
import React, { useState, useRef, useEffect } from 'react';
import { Tenant, ModuleType, SupportTicket, ServiceRequest, User, Job } from '../types';
import { Building2, CreditCard, Ticket, Settings, Check, X, Shield, Mail, AlertCircle, Plus, Trash2, BrainCircuit, Sparkles, Loader2, FileText, Inbox, TrendingUp, Calendar, AlertTriangle, Globe, User as UserIcon, Terminal as TerminalIcon, Command, ChevronRight, Server, Database, Activity, PieChart, BarChart as BarChartIcon } from 'lucide-react';
import { analyzeSupportTickets } from '../services/geminiService';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend } from 'recharts';

interface SuperuserDashboardProps {
  tenants: Tenant[];
  users: User[];
  jobs: Job[];
  onUpdateTenant: (tenant: Tenant) => void;
  onApproveRequest: (request: ServiceRequest, approved: boolean) => void;
  onCreateTenant: (tenantData: { name: string, domain: string, adminName: string, adminEmail: string, initialServices: ModuleType[] }) => void;
  onDeleteTenant: (tenantId: string) => void;
  initialSelectedTenantId?: string | null;
}

const ALL_SERVICES = [
  { id: ModuleType.CUSTOMER_SERVICE, label: 'Customer Service' },
  { id: ModuleType.RECRUITING, label: 'Recruiting' },
  { id: ModuleType.FINANCE, label: 'Finance' },
  { id: ModuleType.MARKET_RESEARCH, label: 'Market Research' },
  { id: ModuleType.HR_INTERNAL, label: 'HR Internal' },
];

const SERVICE_COSTS: Partial<Record<ModuleType, number>> = {
  [ModuleType.CUSTOMER_SERVICE]: 50000,
  [ModuleType.RECRUITING]: 65000,
  [ModuleType.FINANCE]: 40000,
  [ModuleType.MARKET_RESEARCH]: 30000,
  [ModuleType.HR_INTERNAL]: 25000,
  [ModuleType.BILLING]: 0,
};

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

// --- ANALYTICS COMPONENT ---
const GlobalAnalytics: React.FC<{ tenants: Tenant[], users: User[], jobs: Job[] }> = ({ tenants, users, jobs }) => {
  // 1. Service Adoption
  const serviceStats = ALL_SERVICES.map(service => ({
    name: service.label,
    count: tenants.filter(t => t.services.includes(service.id)).length
  }));

  // 2. Revenue by Tenant
  const revenueData = tenants.map(t => ({
    name: t.name,
    amount: t.billing.amountDue
  }));

  // 3. Operational Scale (Users & Jobs)
  const scaleData = tenants.map(t => ({
    name: t.name,
    Users: users.filter(u => u.tenantId === t.id).length,
    Jobs: jobs.filter(j => j.tenantId === t.id).length
  }));

  // 4. Global Support Health
  const allTickets = tenants.flatMap(t => t.supportTickets);
  const ticketStatusData = [
    { name: 'Open', value: allTickets.filter(t => t.status === 'open').length },
    { name: 'Pending', value: allTickets.filter(t => t.status === 'pending').length },
    { name: 'Resolved', value: allTickets.filter(t => t.status === 'resolved').length },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 animate-fade-in">
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Revenue Chart */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
             <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <CreditCard size={18} className="text-green-400"/> Revenue Distribution
             </h3>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }} />
                      <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} name="Amount Due (₹)" />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Service Adoption Pie */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
             <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <PieChart size={18} className="text-purple-400"/> Service Popularity
             </h3>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                   <RePieChart>
                      <Pie data={serviceStats} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="count" label>
                         {serviceStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                         ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }} />
                      <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
                   </RePieChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Operational Scale */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
             <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Activity size={18} className="text-blue-400"/> Operational Scale
             </h3>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={scaleData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }} />
                      <Bar dataKey="Users" fill="#3b82f6" stackId="a" />
                      <Bar dataKey="Jobs" fill="#f59e0b" stackId="a" />
                      <Legend />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Support Health */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
             <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Ticket size={18} className="text-red-400"/> Global Support Status
             </h3>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                   <RePieChart>
                      <Pie data={ticketStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" dataKey="value" paddingAngle={5}>
                         {ticketStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.name === 'Open' ? '#ef4444' : entry.name === 'Resolved' ? '#10b981' : '#f59e0b'} />
                         ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }} />
                      <Legend />
                   </RePieChart>
                </ResponsiveContainer>
             </div>
          </div>
       </div>
    </div>
  );
};

export const GlobalBilling: React.FC<{ tenants: Tenant[] }> = ({ tenants }) => {
  const totalDue = tenants.reduce((sum, t) => sum + t.billing.amountDue, 0);
  const totalProjected = tenants.reduce((sum, t) => {
    return sum + t.services.reduce((s, service) => s + (SERVICE_COSTS[service] || 0), 0);
  }, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div>
         <h2 className="text-3xl font-bold text-white mb-2">Global Billing Overview</h2>
         <p className="text-slate-400">Consolidated financial view across all organizations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="text-slate-400 text-sm mb-1">Total Outstanding Revenue</div>
          <div className="text-4xl font-bold text-white">₹{totalDue.toLocaleString()}</div>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="text-slate-400 text-sm mb-1">Total Projected (Next Cycle)</div>
          <div className="text-4xl font-bold text-blue-400">₹{totalProjected.toLocaleString()}</div>
        </div>
      </div>

      <div className="space-y-6">
        {tenants.map(tenant => {
           const projected = tenant.services.reduce((s, service) => s + (SERVICE_COSTS[service] || 0), 0);
           return (
             <div key={tenant.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/30">
                   <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${tenant.billing.status === 'overdue' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                         <Building2 size={24} />
                      </div>
                      <div>
                         <h3 className="text-xl font-bold text-white flex items-center gap-2">
                           {tenant.name}
                           {tenant.billing.status === 'overdue' && (
                              <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Overdue</span>
                           )}
                         </h3>
                         <div className="text-sm text-slate-500">ID: {tenant.id}</div>
                      </div>
                   </div>
                   <div className="flex gap-8 text-right">
                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide">Current Due</div>
                        <div className={`text-xl font-bold ${tenant.billing.status === 'overdue' ? 'text-red-400' : 'text-white'}`}>
                          ₹{tenant.billing.amountDue.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide">Projected</div>
                        <div className="text-xl font-bold text-blue-400">₹{projected.toLocaleString()}</div>
                      </div>
                   </div>
                </div>
                
                <div className="p-6">
                   <h4 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Service Breakdown</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {tenant.services.map(service => (
                        <div key={service} className="flex justify-between items-center p-3 bg-slate-900 rounded-lg border border-slate-800">
                           <span className="text-slate-300 text-sm">{ALL_SERVICES.find(s => s.id === service)?.label}</span>
                           <span className="text-slate-500 font-mono text-sm">₹{SERVICE_COSTS[service]}</span>
                        </div>
                      ))}
                      {tenant.services.length === 0 && <div className="text-slate-500 italic text-sm">No active services</div>}
                   </div>
                </div>
             </div>
           );
        })}
      </div>
    </div>
  );
};

// --- SYSTEM CONSOLE COMPONENT ---

const SystemConsole: React.FC<{ tenants: Tenant[] }> = ({ tenants }) => {
  const [history, setHistory] = useState<string[]>([' Agenra v2.5.0 System Console', ' Type "help" for available commands.', '']);
  const [command, setCommand] = useState('');
  const [health, setHealth] = useState<'checking' | 'ok' | 'error'>('checking');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
    checkSystem();
  }, [history]);

  const checkSystem = async () => {
    const isOk = await api.checkHealth();
    setHealth(isOk ? 'ok' : 'error');
  };

  const executeCommand = async (cmd: string) => {
    const args = cmd.trim().split(' ');
    const main = args[0].toLowerCase();
    
    let output: string[] = [];

    switch (main) {
      case 'help':
        output = [
          ' Available commands:',
          '  status               Check system health',
          '  ls tenants           List all active organizations',
          '  ls billing           List billing status for all',
          '  notify all [msg]     Broadcast system notification',
          '  whoami               Current session info',
          '  clear                Clear console',
        ];
        break;
      case 'status':
        const isOk = await api.checkHealth();
        output = [
          ` System Status: ${isOk ? 'ONLINE' : 'OFFLINE (Connection Refused)'}`,
          ` API Endpoint: http://localhost:8000/api/v1`,
          ` Database: ${isOk ? 'Connected' : 'Unreachable'}`,
        ];
        break;
      case 'ls':
        if (args[1] === 'tenants') {
          output = tenants.map(t => ` [${t.id}] ${t.name} (${t.domain})`);
          output.unshift(` Found ${tenants.length} tenants:`);
        } else if (args[1] === 'billing') {
          output = tenants.map(t => ` [${t.id}] ${t.name}: ₹${t.billing.amountDue} (${t.billing.status})`);
        } else {
          output = [' Usage: ls [tenants|billing]'];
        }
        break;
      case 'notify':
        if (args[1] === 'all') {
          const msg = args.slice(2).join(' ');
          if (!msg) {
             output = [' Error: Message required. Usage: notify all [message]'];
          } else {
             output = [` Broadcast queued: "${msg}" sent to ${tenants.length} admins.`];
          }
        } else {
          output = [' Usage: notify all [message]'];
        }
        break;
      case 'whoami':
        output = [' User: Zeus (Super Admin)', ' Role: SUPERUSER', ' Session: Secure (TLS 1.3)'];
        break;
      case 'clear':
        setHistory([]);
        return;
      default:
        if (cmd.trim()) output = [` Command not found: ${main}`];
        break;
    }

    setHistory(prev => [...prev, `> ${cmd}`, ...output, '']);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(command);
      setCommand('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
       <div className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden font-mono text-sm shadow-2xl flex flex-col h-full">
        <div className="bg-slate-900 p-3 border-b border-slate-800 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="text-slate-400 text-xs ml-2">root@agenra-core:~</div>
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-1 text-slate-300">
          {history.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap">{line}</div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="p-3 bg-slate-900/50 border-t border-slate-800 flex items-center gap-2">
          <span className="text-green-500 font-bold">{'>'}</span>
          <input 
            autoFocus
            value={command}
            onChange={e => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-none outline-none text-white w-full placeholder:text-slate-600"
            placeholder="Enter command..."
          />
        </div>
      </div>

      <div className="lg:col-span-1 space-y-4">
         <div className={`p-6 rounded-2xl border ${health === 'ok' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'} transition-colors`}>
            <div className="flex items-center gap-3 mb-2">
               <Activity className={health === 'ok' ? 'text-green-400' : 'text-red-400'} />
               <h3 className="font-bold text-white">System Health</h3>
            </div>
            <div className={`text-2xl font-bold ${health === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
               {health === 'ok' ? 'OPERATIONAL' : 'CRITICAL'}
            </div>
            <p className="text-xs text-slate-400 mt-2">
               {health === 'ok' ? 'All systems nominal.' : 'Backend connection refused. Check Docker logs.'}
            </p>
         </div>

         <div className="p-6 rounded-2xl border bg-slate-800 border-slate-700">
            <div className="flex items-center gap-3 mb-2">
               <Server className="text-blue-400" />
               <h3 className="font-bold text-white">Infrastructure</h3>
            </div>
            <div className="space-y-3 mt-4">
               <div className="flex justify-between text-sm">
                  <span className="text-slate-400">API Gateway</span>
                  <span className="text-green-400 font-mono">v1.2.0</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Database</span>
                  <span className="text-green-400 font-mono">Postgres 15</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Cache</span>
                  <span className="text-green-400 font-mono">Redis 7</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const SuperuserDashboard: React.FC<SuperuserDashboardProps> = ({ tenants, users, jobs, onUpdateTenant, onApproveRequest, onCreateTenant, onDeleteTenant, initialSelectedTenantId }) => {
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(initialSelectedTenantId || null);
  const [notification, setNotification] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'console'>('overview');
  
  // Update selection if prop changes (e.g., navigation from Overview)
  useEffect(() => {
    if (initialSelectedTenantId) {
      setSelectedTenantId(initialSelectedTenantId);
      setActiveTab('overview');
    }
  }, [initialSelectedTenantId]);

  // Support Agent State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<string | null>(null);

  // New Tenant Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [onboardingData, setOnboardingData] = useState({
    name: '',
    domain: '',
    adminName: '',
    adminEmail: '',
    initialServices: [] as ModuleType[]
  });

  const activeTenant = tenants.find(t => t.id === selectedTenantId);

  // Collect all pending requests
  const pendingRequests = tenants.flatMap(t => t.serviceRequests ? t.serviceRequests.filter(r => r.status === 'pending') : []);

  // Calculate projected bill for active tenant
  const projectedBill = activeTenant 
    ? activeTenant.services.reduce((acc, curr) => acc + (SERVICE_COSTS[curr] || 0), 0) 
    : 0;

  const toggleService = (tenant: Tenant, serviceId: ModuleType) => {
    const hasService = tenant.services.includes(serviceId);
    let newServices: ModuleType[];
    
    if (hasService) {
      newServices = tenant.services.filter(s => s !== serviceId);
    } else {
      newServices = [...tenant.services, serviceId];
    }

    const updatedTenant = { ...tenant, services: newServices };
    onUpdateTenant(updatedTenant);

    // Trigger Notification
    const action = hasService ? 'removed from' : 'added to';
    const serviceName = ALL_SERVICES.find(s => s.id === serviceId)?.label;
    
    setNotification(`Email sent to ${tenant.adminEmail}: Service "${serviceName}" has been ${action} your account.`);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisReport(null);
    try {
      const report = await analyzeSupportTickets(tenants);
      setAnalysisReport(report);
    } catch (error) {
      setAnalysisReport("Failed to run analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateTenant(onboardingData);
    setOnboardingData({ name: '', domain: '', adminName: '', adminEmail: '', initialServices: [] });
    setShowCreateModal(false);
    setNotification(`Successfully onboarded tenant: ${onboardingData.name}`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteClick = (e: React.MouseEvent, tenant: Tenant) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete ${tenant.name}? This action cannot be undone.`)) {
      if (selectedTenantId === tenant.id) setSelectedTenantId(null);
      onDeleteTenant(tenant.id);
    }
  };

  const toggleOnboardingService = (serviceId: ModuleType) => {
    setOnboardingData(prev => {
      const has = prev.initialServices.includes(serviceId);
      return {
        ...prev,
        initialServices: has ? prev.initialServices.filter(s => s !== serviceId) : [...prev.initialServices, serviceId]
      };
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent flex items-center gap-3">
            <Shield className="text-yellow-500" /> Superuser Command Center
          </h1>
          <p className="text-slate-400 mt-2">Manage tenants, provision services, and monitor billing health.</p>
        </div>
        <div className="flex bg-slate-800 p-1 rounded-lg overflow-x-auto">
           <button 
             onClick={() => setActiveTab('overview')} 
             className={`px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
           >
             <Command size={16} /> Overview
           </button>
           <button 
             onClick={() => setActiveTab('analytics')} 
             className={`px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'analytics' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
           >
             <BarChartIcon size={16} /> Visualization
           </button>
           <button 
             onClick={() => setActiveTab('console')} 
             className={`px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'console' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
           >
             <TerminalIcon size={16} /> System Console
           </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-8 right-8 z-50 bg-slate-800 border border-green-500 text-green-400 px-6 py-4 rounded-xl shadow-2xl animate-bounce-in flex items-center gap-3">
          <Mail size={20} />
          <div>
            <div className="font-bold text-white">System Notification</div>
            <div className="text-sm text-slate-300">{notification}</div>
          </div>
        </div>
      )}

      {activeTab === 'console' && <SystemConsole tenants={tenants} />}
      
      {activeTab === 'analytics' && <GlobalAnalytics tenants={tenants} users={users} jobs={jobs} />}

      {activeTab === 'overview' && (
        <>
        {/* Service Request Inbox */}
        {pendingRequests.length > 0 && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl border-l-4 border-l-blue-500">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Inbox className="text-blue-400" /> Service Requests ({pendingRequests.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingRequests.map(request => {
                  const tenantName = tenants.find(t => t.id === request.tenantId)?.name || request.tenantId;
                  const serviceName = ALL_SERVICES.find(s => s.id === request.service)?.label;
                  return (
                    <div key={request.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                        <div className="mb-4">
                          <div className="text-xs text-slate-500 mb-1">{request.date}</div>
                          <div className="font-bold text-white">{tenantName}</div>
                          <div className={`text-sm mt-1 ${request.action === 'add' ? 'text-green-400' : 'text-red-400'}`}>
                            {request.action === 'add' ? 'Request to Add' : 'Request to Remove'}: {serviceName}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => onApproveRequest(request, false)}
                            className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all text-sm font-bold"
                          >
                            Reject
                          </button>
                          <button 
                            onClick={() => onApproveRequest(request, true)}
                            className="flex-1 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white transition-all text-sm font-bold"
                          >
                            Approve
                          </button>
                        </div>
                    </div>
                  );
                })}
              </div>
          </div>
        )}

        {/* Support Intelligence Agent Section */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl border border-slate-700 p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <BrainCircuit size={120} className="text-blue-500" />
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="text-blue-400" /> Support Intelligence Agent
                </h2>
                <p className="text-slate-400 max-w-2xl">
                  Deploy the AI agent to analyze global support queries across all tenants. 
                  Identify root causes (including billing correlations), suggest immediate fixes, and generate prevention strategies.
                </p>
              </div>
              <button
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} /> Analyzing...
                  </>
                ) : (
                  <>
                    <BrainCircuit size={20} /> Run Global Analysis
                  </>
                )}
              </button>
            </div>

            {analysisReport && (
              <div className="bg-slate-950/50 rounded-xl border border-slate-700/50 p-6 animate-fade-in max-h-96 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 mb-4 text-blue-400 border-b border-slate-800 pb-2">
                  <FileText size={18} />
                  <span className="font-bold uppercase tracking-wider text-sm">Agent Analysis Report</span>
                </div>
                <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                  <div className="whitespace-pre-line leading-relaxed">
                    {analysisReport}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Tenant List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-white">Organizations</h2>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg border border-blue-500/50 transition-all flex items-center gap-1 shadow-lg shadow-blue-500/10"
              >
                <Plus size={14} /> Onboard Tenant
              </button>
            </div>
            
            {tenants.map(tenant => (
              <button
                key={tenant.id}
                onClick={() => setSelectedTenantId(tenant.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${
                  selectedTenantId === tenant.id
                    ? 'bg-blue-600/10 border-blue-500 text-white'
                    : tenant.billing.status === 'overdue'
                      ? 'bg-red-500/5 border-red-500/30 text-red-200 hover:bg-red-500/10' // Overdue style
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    selectedTenantId === tenant.id ? 'bg-blue-500 text-white' : 
                    tenant.billing.status === 'overdue' ? 'bg-red-500 text-white' : 'bg-slate-900 text-slate-500'
                  }`}>
                    {tenant.billing.status === 'overdue' ? <AlertCircle size={20} /> : <Building2 size={20} />}
                  </div>
                  <div>
                    <div className="font-bold flex items-center gap-2">
                      {tenant.name}
                      {tenant.billing.status === 'overdue' && (
                        <span className="text-[10px] bg-red-500 text-white px-1.5 rounded uppercase font-bold tracking-wider">Overdue</span>
                      )}
                    </div>
                    <div className="text-xs opacity-70 flex gap-1 items-center"><Globe size={10} /> {tenant.domain || 'No Domain'}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Delete Button - Only shown/enabled if services is 0 */}
                  {tenant.services.length === 0 && (
                    <div 
                      onClick={(e) => handleDeleteClick(e, tenant)}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                      title="Delete Tenant"
                    >
                      <Trash2 size={16} />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Right Column: Detail View */}
          <div className="lg:col-span-2">
            {activeTenant ? (
              <div className="space-y-6 animate-fade-in">
                {/* Service Provisioning Card */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                  <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Settings className="text-blue-400" /> Service Provisioning
                      </h3>
                      <p className="text-sm text-slate-400">Manage subscribed apps for {activeTenant.name}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-slate-500">ID: {activeTenant.id}</div>
                      <div className="text-xs text-blue-400 font-medium">{activeTenant.domain}</div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      {ALL_SERVICES.map(service => {
                        const isActive = activeTenant.services.includes(service.id);
                        return (
                          <div key={service.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 transition-all">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-slate-600'}`}></div>
                              <span className={`font-medium ${isActive ? 'text-white' : 'text-slate-500'}`}>{service.label}</span>
                            </div>
                            <button
                              onClick={() => toggleService(activeTenant, service.id)}
                              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                                isActive 
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white' 
                                  : 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500 hover:text-white'
                              }`}
                            >
                              {isActive ? (
                                <>
                                  <Trash2 size={14} /> Force Remove
                                </>
                              ) : (
                                <>
                                  <Plus size={14} /> Force Add
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Billing & Financial Health */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <CreditCard className={activeTenant.billing.status === 'overdue' ? "text-red-400" : "text-green-400"} /> 
                      Financial Overview
                    </h3>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                      activeTenant.billing.status === 'active' 
                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                        : 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
                    }`}>
                      Status: {activeTenant.billing.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                      <div className="text-slate-500 text-sm mb-1 flex items-center gap-2">
                        Current Amount Due <AlertTriangle size={12} className={activeTenant.billing.status === 'overdue' ? 'text-red-500' : 'hidden'} />
                      </div>
                      <div className={`text-3xl font-bold ${activeTenant.billing.status === 'overdue' ? 'text-red-400' : 'text-white'}`}>
                        ₹{activeTenant.billing.amountDue.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500 mt-2 font-mono">
                        Acct: {activeTenant.billing.accountNumber}
                      </div>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                      <div className="text-slate-500 text-sm mb-1 flex items-center gap-2">
                        <TrendingUp size={14} className="text-blue-400" /> Projected Bill (Next Month)
                      </div>
                      <div className="text-3xl font-bold text-blue-400">
                        ₹{projectedBill.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                        <Calendar size={12} /> Billing Date: {activeTenant.billing.nextBillingDate}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Breakdown Table */}
                  <div className="overflow-hidden rounded-xl border border-slate-700">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-900 text-slate-400 font-medium">
                        <tr>
                          <th className="p-3">Service Module</th>
                          <th className="p-3">Monthly Cost</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700 bg-slate-800/50">
                        {activeTenant.services.map(serviceId => (
                          <tr key={serviceId} className="hover:bg-slate-700/30 transition-colors">
                            <td className="p-3 text-white">
                              {ALL_SERVICES.find(s => s.id === serviceId)?.label}
                            </td>
                            <td className="p-3 font-mono text-slate-300">
                              ₹{SERVICE_COSTS[serviceId]}
                            </td>
                            <td className="p-3">
                              <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20">Active</span>
                            </td>
                          </tr>
                        ))}
                        {activeTenant.services.length === 0 && (
                          <tr>
                            <td colSpan={3} className="p-4 text-center text-slate-500 italic">No active services</td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot className="bg-slate-900/80 font-bold">
                        <tr>
                          <td className="p-3 text-right text-slate-400">Total Monthly Recurring:</td>
                          <td className="p-3 text-blue-400 font-mono">₹{projectedBill}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Support Tickets Card */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Ticket className="text-purple-400" /> Support Queries
                    </h3>
                    
                    <div className="space-y-3">
                      {activeTenant.supportTickets.length === 0 ? (
                        <div className="text-slate-500 text-sm text-center py-4">No open tickets</div>
                      ) : (
                        activeTenant.supportTickets.map(ticket => (
                          <div key={ticket.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                            <div className="flex justify-between mb-1">
                              <span className={`px-1.5 py-0.5 rounded ${ticket.priority === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-300'}`}>
                                {ticket.priority}
                              </span>
                              <span className="text-slate-500">{ticket.status}</span>
                            </div>
                            <div className="font-medium text-slate-200">{ticket.subject}</div>
                            <div className="text-xs text-slate-500 mt-1 capitalize">Status: {ticket.status}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl p-12">
                <Building2 size={48} className="mb-4 opacity-50" />
                <p className="text-lg">Select an organization to manage</p>
              </div>
            )}
          </div>
        </div>
        </>
      )}

      {/* Onboard Tenant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl relative flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white z-10"
            >
              <X size={20} />
            </button>
            
            <div className="p-8 border-b border-slate-800">
               <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                 <RocketIcon /> Tenant Onboarding Portal
               </h3>
               <p className="text-slate-400 mt-1">Configure new organization, domain, and initial services.</p>
            </div>
            
            <div className="p-8 overflow-y-auto">
              <form onSubmit={handleCreateSubmit} className="space-y-8">
                
                {/* Step 1: Org Details */}
                <div className="space-y-4">
                   <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                      <Building2 size={16} /> Organization Profile
                   </h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Organization Name</label>
                        <input 
                          required
                          value={onboardingData.name}
                          onChange={e => {
                             const val = e.target.value;
                             const slug = val.toLowerCase().replace(/[^a-z0-9]/g, '') + ".agenra.in";
                             setOnboardingData({...onboardingData, name: val, domain: slug});
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. Acme Corp"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Assigned Domain</label>
                        <div className="relative">
                          <input 
                            required
                            readOnly
                            value={onboardingData.domain}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-400 font-mono text-sm"
                          />
                          <Globe size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600" />
                        </div>
                      </div>
                   </div>
                </div>

                {/* Step 2: Admin Setup */}
                <div className="space-y-4">
                   <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                      <UserIcon size={16} /> Initial Administrator
                   </h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Admin Full Name</label>
                        <input 
                          required
                          value={onboardingData.adminName}
                          onChange={e => setOnboardingData({...onboardingData, adminName: e.target.value})}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. John Admin"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Admin Email</label>
                        <input 
                          required
                          type="email"
                          value={onboardingData.adminEmail}
                          onChange={e => setOnboardingData({...onboardingData, adminEmail: e.target.value})}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="admin@acme.com"
                        />
                      </div>
                   </div>
                </div>

                {/* Step 3: Services */}
                <div className="space-y-4">
                   <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                      <Settings size={16} /> Enable Services
                   </h4>
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {ALL_SERVICES.map(service => (
                         <label key={service.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            onboardingData.initialServices.includes(service.id) 
                            ? 'bg-blue-600/20 border-blue-500 text-white' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                         }`}>
                            <input 
                               type="checkbox"
                               className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 bg-slate-700"
                               checked={onboardingData.initialServices.includes(service.id)}
                               onChange={() => toggleOnboardingService(service.id)}
                            />
                            <span className="text-sm font-medium">{service.label}</span>
                         </label>
                      ))}
                   </div>
                </div>
                
                <div className="pt-6 flex gap-3 border-t border-slate-800">
                  <button 
                    type="button" 
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all font-medium"
                  >
                    Cancel Setup
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/20"
                  >
                    Initialize Tenant
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const RocketIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
);

export default SuperuserDashboard;
