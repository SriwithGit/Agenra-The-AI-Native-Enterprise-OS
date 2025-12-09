
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ComposedChart, Area, Legend } from 'recharts';
import { searchMarketData, parseFinancialLedger, generateFinancialForecast, LedgerItem, ForecastResult } from '../services/geminiService';
import { TrendingUp, TrendingDown, PieChart as PieIcon, RefreshCw, Table, DollarSign, ArrowUpRight, ArrowDownRight, FileSpreadsheet, Download, Upload, Calendar, BrainCircuit, Loader2, FileText, IndianRupee } from 'lucide-react';

const INITIAL_CHART_DATA = [
  { name: 'Jan', revenue: 400000, profit: 240000 },
  { name: 'Feb', revenue: 300000, profit: 139800 },
  { name: 'Mar', revenue: 200000, profit: 98000 },
  { name: 'Apr', revenue: 278000, profit: 390800 },
  { name: 'May', revenue: 189000, profit: 48000 },
  { name: 'Jun', revenue: 239000, profit: 38000 },
];

const INITIAL_LEDGER: LedgerItem[] = [
  { category: "Revenue", name: "Product Sales", period1: 1500000, period2: 1850000 },
  { category: "Revenue", name: "Service Subscriptions", period1: 800000, period2: 820000 },
  { category: "Revenue", name: "Licensing Fees", period1: 120000, period2: 150000 },
  { category: "Cost of Goods Sold (COGS)", name: "Production Costs", period1: 450000, period2: 520000 },
  { category: "Cost of Goods Sold (COGS)", name: "Raw Materials", period1: 200000, period2: 240000 },
  { category: "Cost of Goods Sold (COGS)", name: "Shipping & Logistics", period1: 80000, period2: 95000 },
  { category: "Operating Expenses (OpEx)", name: "Employee Salaries (Payroll)", period1: 950000, period2: 980000 },
  { category: "Operating Expenses (OpEx)", name: "Contractor Fees", period1: 150000, period2: 120000 },
  { category: "Operating Expenses (OpEx)", name: "Marketing & Ads", period1: 250000, period2: 350000 },
  { category: "Operating Expenses (OpEx)", name: "Software Licenses (SaaS)", period1: 45000, period2: 48000 },
];

const Finance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'planner' | 'forecast'>('overview');
  const [insight, setInsight] = useState("Loading market context...");
  
  // Planner State
  const [viewMode, setViewMode] = useState<'quarterly' | 'yearly'>('quarterly');
  const [ledgerData, setLedgerData] = useState<LedgerItem[]>(INITIAL_LEDGER);
  const [isUploading, setIsUploading] = useState(false);

  // Forecast State
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);
  const [isForecasting, setIsForecasting] = useState(false);

  useEffect(() => {
    const fetchInsight = async () => {
      try {
        const res = await searchMarketData("Briefly summarize the current Indian economic outlook for tech sector financial planning in 2 sentences.");
        setInsight(res.text);
      } catch (e) {
        setInsight("Could not load real-time insights.");
      }
    };
    fetchInsight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calculateVariance = (current: number, previous: number) => {
    const diff = current - previous;
    const percent = previous !== 0 ? ((diff / previous) * 100).toFixed(1) : "0.0";
    return { diff, percent };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const parsedItems = await parseFinancialLedger(text, viewMode);
      if (parsedItems.length > 0) {
        setLedgerData(parsedItems);
      } else {
        alert("Could not parse file. Ensure it contains financial data.");
      }
      setIsUploading(false);
    };
    reader.readAsText(file);
  };

  const handleGenerateForecast = async () => {
    setIsForecasting(true);
    try {
      // Use ledger data if available, otherwise fallback to chart data
      const sourceData = ledgerData.length > 0 ? ledgerData : INITIAL_CHART_DATA;
      const result = await generateFinancialForecast(sourceData, viewMode);
      setForecastResult(result);
    } catch (e) {
      console.error(e);
      alert("Failed to generate forecast. Try reducing data size or try again.");
    } finally {
      setIsForecasting(false);
    }
  };

  // Group ledger data by category
  const groupedLedger = ledgerData.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, LedgerItem[]>);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-slate-800 pb-6">
        <div>
           <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Financial Planning</h2>
           <p className="text-slate-400 mt-2">Revenue analysis, forecasting, and budget allocation (INR).</p>
        </div>
        <div className="flex bg-slate-800 p-1 rounded-lg overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 md:px-6 py-2 rounded-md font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'overview' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            <PieIcon size={18} /> Market Overview
          </button>
          <button
            onClick={() => setActiveTab('planner')}
            className={`px-4 md:px-6 py-2 rounded-md font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'planner' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            <Table size={18} /> Budget Planner
          </button>
          <button
            onClick={() => setActiveTab('forecast')}
            className={`px-4 md:px-6 py-2 rounded-md font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'forecast' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            <TrendingUp size={18} /> Forecast
          </button>
        </div>
      </div>

      {/* Real-time Insight Banner */}
      <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-xl flex items-start gap-3">
        <TrendingUp className="text-emerald-400 shrink-0 mt-1" size={24} />
        <div>
          <h4 className="font-semibold text-emerald-400 text-sm uppercase tracking-wider mb-1">Live Market Context</h4>
          <p className="text-emerald-100 text-sm leading-relaxed">{insight}</p>
        </div>
      </div>

      {/* --- MARKET OVERVIEW TAB --- */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Revenue Projection (INR)</h3>
              <PieIcon className="text-slate-500" size={20} />
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={INITIAL_CHART_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Bar dataKey="revenue" fill="#34d399" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
             <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Profit Margins (INR)</h3>
              <TrendingUp className="text-slate-500" size={20} />
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={INITIAL_CHART_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Line type="monotone" dataKey="profit" stroke="#22d3ee" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* --- BUDGET PLANNER TAB --- */}
      {activeTab === 'planner' && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden animate-fade-in shadow-xl">
           <div className="p-6 border-b border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50">
              <div>
                 <h3 className="text-xl font-bold text-white flex items-center gap-2">
                   <FileSpreadsheet className="text-emerald-400" /> Budget Ledger
                 </h3>
                 <p className="text-sm text-slate-400">Comparing Current vs Previous Period</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                 {/* View Mode Toggle */}
                 <div className="bg-slate-800 p-1 rounded-lg border border-slate-700 flex text-xs font-bold">
                    <button 
                      onClick={() => setViewMode('quarterly')}
                      className={`px-3 py-1.5 rounded transition-colors ${viewMode === 'quarterly' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      Quarterly
                    </button>
                    <button 
                      onClick={() => setViewMode('yearly')}
                      className={`px-3 py-1.5 rounded transition-colors ${viewMode === 'yearly' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      Yearly
                    </button>
                 </div>

                 {/* File Upload */}
                 <label className={`flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                    {isUploading ? 'Parsing...' : 'Upload Ledger'}
                    <input type="file" className="hidden" accept=".csv,.txt,.json" onChange={handleFileUpload} disabled={isUploading} />
                 </label>

                 <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors">
                    <Download size={16} /> Export
                 </button>
              </div>
           </div>
           
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="bg-slate-900 text-slate-400 uppercase font-bold text-xs">
                 <tr>
                   <th className="px-6 py-4">Line Item</th>
                   <th className="px-6 py-4 text-right">Previous ({viewMode === 'quarterly' ? 'Q1' : '2023'})</th>
                   <th className="px-6 py-4 text-right">Current ({viewMode === 'quarterly' ? 'Q2' : '2024'})</th>
                   <th className="px-6 py-4 text-right">Variance (₹)</th>
                   <th className="px-6 py-4 text-right">Trend (%)</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-700">
                 {Object.entries(groupedLedger).map(([category, items]: [string, LedgerItem[]], idx) => (
                   <React.Fragment key={idx}>
                     <tr className="bg-slate-800/80">
                       <td colSpan={5} className="px-6 py-3 font-bold text-blue-400 uppercase tracking-wider text-xs border-y border-slate-700">
                         {category}
                       </td>
                     </tr>
                     {items.map((item, itemIdx) => {
                       const { diff, percent } = calculateVariance(item.period2, item.period1);
                       const isPositive = diff >= 0;
                       
                       // Determine color based on context (Revenue increase = Good/Green, Expense increase = Bad/Red)
                       const isRevenue = category === "Revenue";
                       const trendColor = isRevenue 
                          ? (isPositive ? 'text-green-400' : 'text-red-400') 
                          : (isPositive ? 'text-red-400' : 'text-green-400'); // Expenses increasing is usually bad

                       return (
                         <tr key={itemIdx} className="hover:bg-slate-700/30 transition-colors">
                           <td className="px-6 py-4 text-white font-medium pl-8 border-l-4 border-transparent hover:border-blue-500">
                             {item.name}
                           </td>
                           <td className="px-6 py-4 text-right text-slate-400 font-mono">
                             ₹{item.period1.toLocaleString()}
                           </td>
                           <td className="px-6 py-4 text-right text-white font-mono font-bold">
                             ₹{item.period2.toLocaleString()}
                           </td>
                           <td className={`px-6 py-4 text-right font-mono ${isPositive ? 'text-white' : 'text-slate-300'}`}>
                             {isPositive ? '+' : ''}{diff.toLocaleString()}
                           </td>
                           <td className="px-6 py-4 text-right">
                             <div className={`flex items-center justify-end gap-1 font-bold ${trendColor}`}>
                               {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                               {percent}%
                             </div>
                           </td>
                         </tr>
                       );
                     })}
                     {/* Subtotal Row */}
                     <tr className="bg-slate-900/30 font-bold">
                       <td className="px-6 py-3 text-slate-300 text-right uppercase text-xs">Subtotal</td>
                       <td className="px-6 py-3 text-right text-slate-400 font-mono">
                         ₹{items.reduce((acc, i) => acc + i.period1, 0).toLocaleString()}
                       </td>
                       <td className="px-6 py-3 text-right text-white font-mono">
                         ₹{items.reduce((acc, i) => acc + i.period2, 0).toLocaleString()}
                       </td>
                       <td colSpan={2}></td>
                     </tr>
                   </React.Fragment>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {/* --- FORECAST TAB --- */}
      {activeTab === 'forecast' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          <div className="lg:col-span-2 bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <BrainCircuit className="text-purple-400" /> AI Growth Projection
                </h3>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                   <Calendar size={14} /> Next 4 {viewMode === 'quarterly' ? 'Quarters' : 'Years'}
                </div>
             </div>

             {forecastResult ? (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={[
                        ...(ledgerData.length > 0 ? [] : INITIAL_CHART_DATA.map(d => ({...d, type: 'History'}))), 
                        ...forecastResult.predictions.map(d => ({...d, type: 'Forecast'}))
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }} />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.1} name="Revenue" />
                      <Line type="monotone" dataKey="profit" stroke="#34d399" strokeWidth={3} name="Profit" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
             ) : (
                <div className="h-80 flex flex-col items-center justify-center text-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
                   <TrendingUp size={48} className="mb-4 opacity-50" />
                   <p className="mb-4">Generate a forecast based on your ledger data.</p>
                   <button 
                     onClick={handleGenerateForecast}
                     disabled={isForecasting}
                     className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-purple-500/20 flex items-center gap-2 disabled:opacity-50"
                   >
                     {isForecasting ? <Loader2 className="animate-spin" /> : <BrainCircuit />}
                     Generate AI Forecast
                   </button>
                </div>
             )}
          </div>

          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl flex flex-col">
             <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
               <FileText className="text-blue-400" /> Strategic Analysis
             </h3>
             {forecastResult ? (
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                   <div className="prose prose-invert prose-sm">
                      <div className="whitespace-pre-line text-slate-300 leading-relaxed">
                         {forecastResult.analysis}
                      </div>
                   </div>
                </div>
             ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 italic text-sm">
                   Analysis will appear here after generation.
                </div>
             )}
             <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="text-xs text-slate-500 flex items-center gap-1">
                   <BrainCircuit size={12} /> Powered by Gemini 2.5 Flash
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
