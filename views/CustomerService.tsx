
import React, { useState } from 'react';
import { User, Tenant, SupportTicket } from '../types';
import LiveAgent from '../components/LiveAgent';
import { Headset, Ticket, Search, Filter, AlertCircle, CheckCircle, Clock, ArrowRight, User as UserIcon, Building2, MessageSquare, ChevronRight, X } from 'lucide-react';

interface CustomerServiceProps {
  currentUser: User;
  tenants: Tenant[];
  onUpdateTenant?: (tenant: Tenant) => void;
  simulationTenantId: string;
  setSimulationTenantId: (id: string) => void;
}

const CustomerService: React.FC<CustomerServiceProps> = ({ currentUser, tenants, onUpdateTenant, simulationTenantId, setSimulationTenantId }) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'tickets'>('voice');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const isSuperuser = currentUser.role === 'SUPERUSER';
  
  // Determine context
  let activeTenantName = "Agenra Platform";
  let activeTenantId = isSuperuser ? simulationTenantId : (currentUser.tenantId || 'agenra');
  
  if (activeTenantId !== 'agenra') {
     const t = tenants.find(t => t.id === activeTenantId);
     if (t) activeTenantName = t.name;
  }

  // Get Tickets
  // For Superuser: Show tickets from simulated tenant OR all if viewing 'agenra' context (global support)
  // For Tenant: Show only their tickets
  let tickets: SupportTicket[] = [];
  if (isSuperuser) {
     if (activeTenantId === 'agenra') {
        tickets = tenants.flatMap(t => t.supportTickets);
     } else {
        const t = tenants.find(t => t.id === activeTenantId);
        tickets = t ? t.supportTickets : [];
     }
  } else {
     const t = tenants.find(t => t.id === currentUser.tenantId);
     tickets = t ? t.supportTickets : [];
  }

  const filteredTickets = tickets.filter(t => filterStatus === 'all' || t.status === filterStatus);

  const getStatusColor = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'escalated': return 'bg-orange-500/10 text-orange-400 border-orange-500/20 animate-pulse';
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'resolved': return 'bg-green-500/10 text-green-400 border-green-500/20';
      default: return 'bg-slate-500/10 text-slate-400';
    }
  };

  const getPriorityColor = (p: SupportTicket['priority']) => {
     switch(p) {
        case 'high': return 'text-red-400';
        case 'medium': return 'text-yellow-400';
        default: return 'text-slate-400';
     }
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-slate-800 pb-6 gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent flex items-center gap-3">
             <Headset className="text-blue-500" /> Customer Service Hub
          </h2>
          <p className="text-slate-400 mt-2">AI-powered support and ticket orchestration.</p>
        </div>
        
        <div className="flex bg-slate-800 p-1 rounded-lg">
          <button onClick={() => setActiveTab('voice')} className={`px-6 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${activeTab === 'voice' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
             <MessageSquare size={18} /> Voice Agent
          </button>
          <button onClick={() => setActiveTab('tickets')} className={`px-6 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${activeTab === 'tickets' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
             <Ticket size={18} /> Ticket Center
             {tickets.filter(t => t.status === 'open' || t.status === 'escalated').length > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                   {tickets.filter(t => t.status === 'open' || t.status === 'escalated').length}
                </span>
             )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
         {activeTab === 'voice' && (
            <div className="h-full flex flex-col items-center justify-center relative">
               {/* Context Switcher for Superuser */}
               <div className="absolute top-0 left-0 right-0 flex justify-center z-20">
                  <div className="inline-flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm p-1.5 rounded-xl border border-slate-700 mb-6 shadow-lg">
                     {isSuperuser ? (
                        <>
                           <span className="text-xs text-slate-500 font-bold px-3">ACTIVE AGENT:</span>
                           <select 
                              value={simulationTenantId} 
                              onChange={(e) => setSimulationTenantId(e.target.value)} 
                              className="bg-slate-900 text-white text-sm py-1.5 px-3 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                           >
                              <option value="agenra">Agenra Global Support (Internal)</option>
                              {tenants.map(t => <option key={t.id} value={t.id}>{t.name} Agent</option>)}
                           </select>
                        </>
                     ) : (
                        <div className="flex items-center gap-2 px-4 py-1.5">
                           <Building2 size={16} className="text-blue-400" />
                           <span className="font-bold text-white">{activeTenantName} Support Line</span>
                        </div>
                     )}
                  </div>
               </div>

               <div className="w-full max-w-2xl relative mt-12">
                  <LiveAgent 
                     key={activeTenantId} 
                     agentName={activeTenantId === 'agenra' ? "Agenra Support Specialist" : "Support Assistant"} 
                     roleDescription={`Customer Service for ${activeTenantName}`} 
                     systemInstruction={`You are a helpful customer service agent for ${activeTenantName}. Use the createTicket tool to log issues.`} 
                     voiceName={activeTenantId === 'agenra' ? "Kore" : "Puck"} 
                  />
               </div>
            </div>
         )}

         {activeTab === 'tickets' && (
            <div className="h-full flex gap-6">
               {/* Ticket List */}
               <div className={`${selectedTicket ? 'w-1/2' : 'w-full'} bg-slate-800 rounded-2xl border border-slate-700 flex flex-col transition-all duration-300`}>
                  <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 rounded-t-2xl">
                     <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input placeholder="Search tickets..." className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-blue-500" />
                     </div>
                     <div className="flex gap-2 ml-4">
                        <select 
                           value={filterStatus} 
                           onChange={(e) => setFilterStatus(e.target.value)}
                           className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none"
                        >
                           <option value="all">All Status</option>
                           <option value="open">Open</option>
                           <option value="escalated">Escalated</option>
                           <option value="resolved">Resolved</option>
                        </select>
                     </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                     {filteredTickets.map(ticket => (
                        <div 
                           key={ticket.id} 
                           onClick={() => setSelectedTicket(ticket)}
                           className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                              selectedTicket?.id === ticket.id 
                              ? 'bg-blue-600/10 border-blue-500 shadow-blue-900/10' 
                              : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                           }`}
                        >
                           <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                 <span className="font-mono text-xs text-slate-500">{ticket.id}</span>
                                 {isSuperuser && activeTenantId === 'agenra' && (
                                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">
                                       {tenants.find(t => t.id === ticket.tenantId)?.name || 'Unknown'}
                                    </span>
                                 )}
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold border ${getStatusColor(ticket.status)}`}>
                                 {ticket.status.replace('_', ' ')}
                              </span>
                           </div>
                           <h4 className="text-sm font-bold text-white mb-1 line-clamp-1">{ticket.subject}</h4>
                           <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
                              <div className="flex items-center gap-2">
                                 <span className={`font-medium ${getPriorityColor(ticket.priority)} capitalize`}>{ticket.priority}</span>
                                 <span>•</span>
                                 <span>{ticket.assignedDept} Dept</span>
                              </div>
                              <span>{ticket.createdAt.split(' ')[0]}</span>
                           </div>
                        </div>
                     ))}
                     {filteredTickets.length === 0 && (
                        <div className="text-center py-12 text-slate-500">No tickets found.</div>
                     )}
                  </div>
               </div>

               {/* Ticket Details */}
               {selectedTicket && (
                  <div className="w-1/2 bg-slate-800 rounded-2xl border border-slate-700 flex flex-col animate-fade-in-right shadow-2xl">
                     <div className="p-6 border-b border-slate-700 flex justify-between items-start bg-slate-900/50 rounded-t-2xl">
                        <div>
                           <div className="flex items-center gap-3 mb-2">
                              <span className="font-mono text-sm text-slate-500">{selectedTicket.id}</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${getStatusColor(selectedTicket.status)}`}>
                                 {selectedTicket.status.replace('_', ' ')}
                              </span>
                           </div>
                           <h3 className="text-xl font-bold text-white leading-tight">{selectedTicket.subject}</h3>
                        </div>
                        <button onClick={() => setSelectedTicket(null)} className="text-slate-500 hover:text-white p-1 hover:bg-slate-800 rounded-full transition-colors">
                           <X size={20} />
                        </button>
                     </div>

                     <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Meta Grid */}
                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                              <div className="text-xs text-slate-500 mb-1">Assigned Department</div>
                              <div className="text-sm font-bold text-white flex items-center gap-2">
                                 <Building2 size={14} className="text-blue-400" /> {selectedTicket.assignedDept}
                              </div>
                           </div>
                           <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                              <div className="text-xs text-slate-500 mb-1">Created By</div>
                              <div className="text-sm font-bold text-white flex items-center gap-2">
                                 <UserIcon size={14} className="text-purple-400" /> {selectedTicket.createdBy}
                              </div>
                           </div>
                           <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                              <div className="text-xs text-slate-500 mb-1">Priority</div>
                              <div className={`text-sm font-bold capitalize ${getPriorityColor(selectedTicket.priority)}`}>
                                 {selectedTicket.priority} Priority
                              </div>
                           </div>
                           <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                              <div className="text-xs text-slate-500 mb-1">Created At</div>
                              <div className="text-sm font-bold text-slate-300">
                                 {selectedTicket.createdAt}
                              </div>
                           </div>
                        </div>

                        {/* Description */}
                        <div>
                           <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Issue Description</h4>
                           <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {selectedTicket.description}
                           </div>
                        </div>

                        {/* Actions */}
                        <div className="border-t border-slate-700 pt-6">
                           <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h4>
                           <div className="flex gap-3">
                              <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-bold text-sm transition-all shadow-lg">
                                 Reply to User
                              </button>
                              <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg font-bold text-sm transition-all border border-slate-600">
                                 Reassign
                              </button>
                              {selectedTicket.status !== 'resolved' && (
                                 <button className="flex-1 bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white py-2 rounded-lg font-bold text-sm transition-all border border-green-600/30">
                                    Mark Resolved
                                 </button>
                              )}
                           </div>
                        </div>
                     </div>
                  </div>
               )}
            </div>
         )}
      </div>
    </div>
  );
};

export default CustomerService;
