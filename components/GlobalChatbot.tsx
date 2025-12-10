
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, BrainCircuit, Loader2, Sparkles, ChevronDown, Navigation, Lock } from 'lucide-react';
import { GoogleGenAI, Tool, FunctionDeclaration, Type, Content } from "@google/genai";
import { ModuleType, User, Tenant } from '../types';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface GlobalChatbotProps {
  activeModule: ModuleType;
  currentUser: User | null;
  currentTenant: Tenant | undefined;
  onNavigate: (module: ModuleType) => void;
}

const MODULE_DESCRIPTIONS = {
  [ModuleType.DASHBOARD]: "Main command center for analytics and tenant overview.",
  [ModuleType.CUSTOMER_SERVICE]: "Support ticket management and Live Voice Agents.",
  [ModuleType.RECRUITING]: "ATS for job posting, candidate tracking, and AI resume scoring.",
  [ModuleType.FINANCE]: "Financial ledger parsing, forecasting, and revenue analytics.",
  [ModuleType.MARKET_RESEARCH]: "Competitor analysis using Google Search Grounding.",
  [ModuleType.HR_INTERNAL]: "Employee payroll, policy handbook, and onboarding.",
  [ModuleType.BILLING]: "Invoices, subscription management, and payment gateway.",
  [ModuleType.ITAM]: "IT Asset Management for hardware/software inventory.",
  [ModuleType.USER_MANAGEMENT]: "Admin panel to add/remove users and view audit logs."
};

const navigationTool: FunctionDeclaration = {
  name: "navigate_to_module",
  description: "Navigate the user to a specific module/page in the application. Use this when the user asks to go somewhere, view a page, or open a specific tool.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      targetModule: {
        type: Type.STRING,
        enum: Object.values(ModuleType),
        description: "The ID of the module to navigate to."
      }
    },
    required: ["targetModule"]
  }
};

const GlobalChatbot: React.FC<GlobalChatbotProps> = ({ activeModule, currentUser, currentTenant, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hello! I am your Agenra OS Assistant. I can help you navigate the system or analyze data. Where would you like to go?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Initialize Chat Session
  useEffect(() => {
    const initChat = async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const accessibleModules = currentUser?.permissions.join(', ') || "None";
      const tenantInfo = currentTenant ? `${currentTenant.name} (${currentTenant.domain})` : "System/Superuser";

      const systemInstruction = `
        You are the AI Operating System for Agenra (Indian Market Edition).
        
        **User Context:**
        - Name: ${currentUser?.name || 'User'}
        - Role: ${currentUser?.role || 'Guest'}
        - Tenant: ${tenantInfo}
        - Permissions: ${accessibleModules}
        
        **Current View:**
        - Module: ${activeModule}
        - Description: ${MODULE_DESCRIPTIONS[activeModule] || 'Unknown Module'}
        
        **Your Capabilities:**
        1. **Navigation:** You have a tool 'navigate_to_module'. 
           - If the user says "Go to Recruiting" or "Open Finance", USE THE TOOL. 
           - **CRITICAL:** You must check if the target module is in the user's 'Permissions' list provided above. 
           - If they don't have permission, DO NOT call the tool. Instead, politely refuse.
           - If they have permission, call 'navigate_to_module'.
        
        2. **Contextual Help:** Answer questions about the current module functionality or general Indian business practices (GST, policies).
        
        Tone: Professional, Efficient, Executive.
      `;

      // Persist history across module changes
      const history: Content[] = messages
        .filter((_, i) => i > 0 || messages.length > 1) 
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      chatSessionRef.current = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: systemInstruction,
          tools: [{ functionDeclarations: [navigationTool] }],
        },
        history: history.length > 0 ? history : undefined
      });
    };

    if (currentUser) {
      initChat();
    }
  }, [currentUser, activeModule, currentTenant]); 

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentSession = chatSessionRef.current;
    
    if (!input.trim() || isLoading || !currentSession) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      let response = await currentSession.sendMessage({ message: userMsg });
      
      while (response.functionCalls && response.functionCalls.length > 0) {
        const call = response.functionCalls[0];
        const { name, args } = call;

        if (name === 'navigate_to_module') {
          const target = args.targetModule as ModuleType;
          setProcessingAction(`Navigating to ${target.replace('_', ' ')}...`);

          if (currentUser?.permissions.includes(target)) {
            // FIX: Send tool response FIRST to complete the turn
            response = await currentSession.sendToolResponse({
              functionResponses: [{
                id: call.id,
                name: name,
                response: { result: `Successfully navigated user to ${target}.` }
              }]
            });
            
            // THEN perform navigation (which might kill this session context)
            setTimeout(() => {
                onNavigate(target);
                setProcessingAction(null);
            }, 500); 
            
            setIsLoading(false);
            return; // Stop processing this loop as session is invalid now
          } else {
            response = await currentSession.sendToolResponse({
              functionResponses: [{
                id: call.id,
                name: name,
                response: { error: `Access Denied. User ${currentUser?.name} does not have permission to view ${target}.` }
              }]
            });
          }
          setProcessingAction(null);
        }
      }

      const modelText = response.text;
      if (modelText) {
        setMessages(prev => [...prev, { role: 'model', text: modelText }]);
      }

    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I encountered an error processing your request." }]);
    } finally {
      setIsLoading(false);
      setProcessingAction(null);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-96 h-[500px] mb-4 flex flex-col overflow-hidden animate-fade-in-up">
          <div className="bg-slate-800 p-4 flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Agenra OS</h3>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  System Active
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
              <ChevronDown size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50 scrollbar-thin scrollbar-thumb-slate-700">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {(isLoading || processingAction) && (
              <div className="flex justify-start">
                 <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-3 text-slate-400 text-xs shadow-sm">
                    {processingAction ? (
                        <>
                           <Navigation size={14} className="text-blue-400 animate-bounce" />
                           <span className="text-blue-400 font-medium">{processingAction}</span>
                        </>
                    ) : (
                        <>
                           <BrainCircuit size={14} className="animate-pulse text-purple-400" />
                           <span>Processing...</span>
                        </>
                    )}
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-slate-800 border-t border-slate-700">
            <form onSubmit={handleSend} className="relative">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type 'Go to Finance'..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500 transition-all shadow-inner"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:bg-slate-700 transition-all shadow-lg"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative w-14 h-14 bg-slate-900 border border-slate-700 hover:border-blue-500 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/20 to-blue-600/20 group-hover:opacity-100 opacity-0 transition-opacity"></div>
        {isOpen ? <X size={24} /> : <Sparkles size={24} className="text-blue-400" />}
      </button>
    </div>
  );
};

export default GlobalChatbot;
