import React, { useState } from 'react';
import { Search, Globe, ArrowRight, Loader2 } from 'lucide-react';
import { searchMarketData } from '../services/geminiService';
import { GroundingChunk } from '../types';

const MarketResearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string, sources: GroundingChunk[] } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const data = await searchMarketData(`Act as a senior market researcher. Provide a detailed analysis for: ${query}. Focus on competitors, trends, and market size.`);
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700">
        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Market Research Intelligence</h2>
        <p className="text-slate-400 mb-6">Deep dive into market trends, competitor analysis, and consumer behavior using real-time Google Search data.</p>
        
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="E.g., Global EV battery market trends 2024..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-slate-600"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
          <button 
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 bottom-2 bg-purple-600 hover:bg-purple-500 text-white px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
          </button>
        </form>
      </div>

      {result && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Globe className="text-blue-400" size={20} />
              Research Summary
            </h3>
            <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed whitespace-pre-line">
              {result.text}
            </div>
          </div>

          {result.sources.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.sources.map((source, idx) => {
                const web = source.web;
                if (!web || !web.uri || !web.title) return null;
                return (
                  <a 
                    key={idx} 
                    href={web.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all hover:-translate-y-1 hover:shadow-lg group"
                  >
                    <div className="text-xs text-slate-500 mb-1 truncate">{new URL(web.uri).hostname}</div>
                    <div className="font-medium text-blue-400 group-hover:text-blue-300 truncate">{web.title}</div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MarketResearch;
