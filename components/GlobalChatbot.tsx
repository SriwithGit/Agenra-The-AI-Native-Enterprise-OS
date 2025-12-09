import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, BrainCircuit, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { chatWithPro } from '../services/geminiService';
import { ModuleType } from '../types';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface GlobalChatbotProps {
  activeModule: string;
}

const MODULE_CONTEXTS: Record<string, string> = {
  [ModuleType.DASHBOARD]: "The user is on the main Dashboard. Help them navigate to apps like Recruiting, Finance, or Support. Summarize their active services if asked.",
  [ModuleType.CUSTOMER_SERVICE]: "The user is in the Customer Service module using Gemini Live audio agents. Help them configure agents, troubleshoot audio issues, or understand session logs.",
  [ModuleType.RECRUITING]: "The user is in the Recruiting Hub. They can post jobs, manage candidates, and use AI for evaluation. Help them write job descriptions, understand candidate scoring, or draft emails.",
  [ModuleType.FINANCE]: "The user is in the Finance module. They are looking at revenue charts and market data. Help them interpret financial trends, plan budgets, or understand economic outlooks.",
  [ModuleType.MARKET_RESEARCH]: "The user is in Market Research. They are using Google Search Grounding. Suggest high-value search queries or help analyze the research results displayed.",
  [ModuleType.HR_INTERNAL]: "The user is viewing Internal HR Policies. Help them summarize policies like Remote Work or Annual Leave.",
  [ModuleType.BILLING]: "The user is managing Billing & Subscriptions. Help them understand their invoice, service costs, or how to add/remove services.",
};

const GlobalChatbot: React.FC<GlobalChatbotProps> = ({ activeModule }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hello! I am your AI Orchestration Assistant. I can help you with complex analysis or general questions about the platform.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Reset or announce context change when module changes
  useEffect(() => {
    if (messages.length > 1) {
       // Optional: Add a system note to the chat view or just log it
       // setMessages(prev => [...prev, { role: 'model', text: `Context switched to ${activeModule}. How can I help you here?` }]);
    }
  }, [activeModule]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      // Get context-aware system instruction
      const context = MODULE_CONTEXTS[activeModule] || "You are a helpful AI assistant for the Agenra platform.";
      const systemInstruction = `You are the Agenra Global AI Assistant. ${context}
      
      If the user asks about the current view, use the context provided.
      Current Module: ${activeModule}`;

      const response = await chatWithPro(history, userMsg, useThinking, systemInstruction);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-96 h-[500px] mb-4 flex flex-col overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="bg-slate-800 p-4 flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">AI Assistant</h3>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  Gemini 3 Pro • <span className="text-blue-400 uppercase">{activeModule.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <ChevronDown size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                 <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2 text-slate-400 text-xs">
                    {useThinking ? <BrainCircuit size={14} className="animate-pulse text-purple-400" /> : <Loader2 size={14} className="animate-spin" />}
                    {useThinking ? "Thinking deeply..." : "Typing..."}
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Controls */}
          <div className="p-3 bg-slate-800 border-t border-slate-700">
            <div className="flex items-center gap-2 mb-2 px-1">
              <button 
                type="button"
                onClick={() => setUseThinking(!useThinking)}
                className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border transition-all ${
                  useThinking 
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/50' 
                    : 'bg-slate-900 text-slate-500 border-slate-700 hover:border-slate-500'
                }`}
                title="Enable deep reasoning (Thinking Budget: 32k)"
              >
                <BrainCircuit size={12} />
                Thinking Mode: {useThinking ? 'ON' : 'OFF'}
              </button>
            </div>
            <form onSubmit={handleSend} className="relative">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-4 pr-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-600"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:bg-slate-700"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </button>
    </div>
  );
};

export default GlobalChatbot;