import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Tool } from "@google/genai";
import { createPcmBlob, base64ToUint8Array, decodeAudioData } from '../utils/audioUtils';
import { Mic, MicOff, Phone, PhoneOff, Activity, Zap, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface LiveAgentProps {
  systemInstruction: string;
  agentName: string;
  roleDescription: string;
  voiceName: string;
  tools?: Tool[];
  toolImplementations?: { [name: string]: (args: any) => Promise<any> };
}

interface InteractionLog {
  source: 'User' | 'Agent';
  text: string;
  timestamp: string;
}

const LiveAgent: React.FC<LiveAgentProps> = ({ 
  systemInstruction, 
  agentName, 
  roleDescription, 
  voiceName,
  tools,
  toolImplementations 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0);
  const [toolCallStatus, setToolCallStatus] = useState<string | null>(null);
  
  // Logging State
  const [logs, setLogs] = useState<InteractionLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  
  // Audio Context Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Transcription Accumulation Refs
  const currentTranscriptRef = useRef<{user: string, agent: string}>({ user: '', agent: '' });

  const disconnect = useCallback(() => {
    if (sessionPromiseRef.current) {
       sessionPromiseRef.current.then(session => session.close());
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
    }
    
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
    }
    
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
    }

    // Stop all playing sources
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();

    setIsConnected(false);
    setVolume(0);
    setToolCallStatus(null);
    currentTranscriptRef.current = { user: '', agent: '' };
  }, []);

  const connect = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Clear previous logs on new connection
      setLogs([]);

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
          },
          systemInstruction: systemInstruction,
          tools: tools,
          inputAudioTranscription: {}, // Enable user transcription
          outputAudioTranscription: {}, // Enable model transcription
        },
        callbacks: {
          onopen: () => {
            console.log("Session opened");
            setIsConnected(true);
            
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const processor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = processor;
            
            processor.onaudioprocess = (e) => {
              if (isMuted) return;
              
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Calculate volume for visualizer
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / inputData.length);
              setVolume(Math.min(rms * 5, 1)); // Amplify for visual

              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(processor);
            processor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // --- Handle Transcriptions for Logging ---
            const inputTr = message.serverContent?.inputTranscription?.text;
            if (inputTr) {
               currentTranscriptRef.current.user += inputTr;
            }

            const outputTr = message.serverContent?.outputTranscription?.text;
            if (outputTr) {
               currentTranscriptRef.current.agent += outputTr;
            }

            // Commit logs on turn completion
            if (message.serverContent?.turnComplete) {
               const userText = currentTranscriptRef.current.user.trim();
               const agentText = currentTranscriptRef.current.agent.trim();

               if (userText) {
                 setLogs(prev => [...prev, { source: 'User', text: userText, timestamp: new Date().toLocaleTimeString() }]);
                 currentTranscriptRef.current.user = '';
               }
               
               // Agent text might still be streaming audio, but text is usually ready
               if (agentText) {
                 setLogs(prev => [...prev, { source: 'Agent', text: agentText, timestamp: new Date().toLocaleTimeString() }]);
                 currentTranscriptRef.current.agent = '';
               }
            }
            
            // --- Handle Audio Output ---
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
               setVolume(0.5 + Math.random() * 0.4); 

               nextStartTimeRef.current = Math.max(
                 nextStartTimeRef.current,
                 outputAudioContextRef.current.currentTime
               );
               
               const audioBuffer = await decodeAudioData(
                 base64ToUint8Array(base64Audio),
                 outputAudioContextRef.current,
                 24000,
                 1
               );
               
               const source = outputAudioContextRef.current.createBufferSource();
               source.buffer = audioBuffer;
               source.connect(outputAudioContextRef.current.destination);
               source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                  if (sourcesRef.current.size === 0) setVolume(0);
               });
               
               source.start(nextStartTimeRef.current);
               nextStartTimeRef.current += audioBuffer.duration;
               sourcesRef.current.add(source);
            }

            // --- Handle Function Calls ---
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                console.log("Function Call Triggered:", fc.name, fc.args);
                setToolCallStatus(`Executing: ${fc.name}`);
                
                let result = { error: "Function not found" };
                if (toolImplementations && toolImplementations[fc.name]) {
                  try {
                    result = await toolImplementations[fc.name](fc.args);
                  } catch (e: any) {
                    result = { error: e.message };
                  }
                }

                sessionPromise.then(session => {
                  session.sendToolResponse({
                    functionResponses: {
                      id: fc.id,
                      name: fc.name,
                      response: { result },
                    }
                  });
                });
                setToolCallStatus(null);
                
                // Add System Log for tool usage
                setLogs(prev => [...prev, { source: 'Agent', text: `[Action] Executed ${fc.name}`, timestamp: new Date().toLocaleTimeString() }]);
              }
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              // Clear agent buffer if interrupted
              currentTranscriptRef.current.agent = '';
            }
          },
          onclose: () => {
            console.log("Session closed");
            setIsConnected(false);
          },
          onerror: (err) => {
            console.error("Session error", err);
            disconnect();
          }
        }
      });
      sessionPromiseRef.current = sessionPromise;

    } catch (err) {
      console.error("Failed to connect", err);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-slate-800 rounded-2xl shadow-xl border border-slate-700 w-full max-w-2xl mx-auto transition-all">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">{agentName}</h2>
        <p className="text-slate-400">{roleDescription}</p>
      </div>

      <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
        {/* Visualizer Rings */}
        <div 
          className={`absolute rounded-full bg-blue-500/20 transition-all duration-75 ease-out ${isConnected ? 'animate-pulse' : ''}`}
          style={{ width: `${100 + volume * 100}%`, height: `${100 + volume * 100}%` }}
        />
        <div 
          className={`absolute rounded-full bg-blue-500/40 transition-all duration-75 ease-out`}
          style={{ width: `${80 + volume * 60}%`, height: `${80 + volume * 60}%` }}
        />
        <div className="z-10 bg-slate-900 rounded-full p-6 border-4 border-slate-700 relative">
           <Activity size={48} className={`text-blue-400 ${isConnected ? 'animate-bounce' : ''}`} />
           {toolCallStatus && (
             <div className="absolute -top-2 -right-2 bg-yellow-500 text-slate-900 rounded-full p-1.5 animate-pulse">
               <Zap size={16} fill="currentColor" />
             </div>
           )}
        </div>
      </div>

      {toolCallStatus && (
        <div className="mb-4 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm font-mono animate-fade-in">
          {toolCallStatus}
        </div>
      )}

      <div className="flex gap-6 mb-6">
        {!isConnected ? (
          <button
            onClick={connect}
            className="flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-full font-bold transition-all shadow-lg hover:shadow-green-500/30"
          >
            <Phone size={24} />
            Start Call
          </button>
        ) : (
          <>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-4 rounded-full transition-all ${isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            <button
              onClick={disconnect}
              className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold transition-all shadow-lg hover:shadow-red-500/30 flex items-center gap-2"
            >
              <PhoneOff size={24} />
              End Call
            </button>
          </>
        )}
      </div>
      
      <div className="w-full">
         <button 
           onClick={() => setShowLogs(!showLogs)}
           className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-300 py-2 border-t border-slate-700"
         >
           <span className="flex items-center gap-2 font-mono">
             <FileText size={12} />
             SESSION LOGS ({logs.length})
           </span>
           {showLogs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
         </button>
         
         {showLogs && (
           <div className="bg-slate-950/50 rounded-lg p-3 max-h-48 overflow-y-auto mt-2 border border-slate-700/50 space-y-2">
              {logs.length === 0 && <div className="text-slate-600 text-xs text-center italic">No interaction logs yet...</div>}
              {logs.map((log, idx) => (
                <div key={idx} className="text-xs font-mono border-b border-slate-800/50 last:border-0 pb-1">
                   <div className="flex justify-between items-center mb-0.5 opacity-50">
                      <span className={log.source === 'User' ? 'text-blue-400' : 'text-purple-400'}>{log.source}</span>
                      <span>{log.timestamp}</span>
                   </div>
                   <div className="text-slate-300 leading-relaxed">{log.text}</div>
                </div>
              ))}
           </div>
         )}
      </div>

      <div className="mt-4 text-xs text-slate-500 font-mono">
        Status: {isConnected ? <span className="text-green-400">LIVE CONNECTION</span> : <span className="text-slate-500">DISCONNECTED</span>}
      </div>
    </div>
  );
};

export default LiveAgent;