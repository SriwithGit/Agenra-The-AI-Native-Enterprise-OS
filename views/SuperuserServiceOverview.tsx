
import React, { useState } from 'react';
import { ModuleType, Tenant, User, Job, SupportTicket } from '../types';
import { Building2, Users, CreditCard, Ticket, ChevronRight, AlertCircle, CheckCircle, BarChart3, Globe, Settings } from 'lucide-react';

interface SuperuserServiceOverviewProps {
  service: ModuleType;
  tenants: Tenant[];
  users: User[];
  jobs: Job[]; // For Recruiting metrics
  tickets: SupportTicket[]; // For CS metrics
  onManageTenant: (tenantId: string) => void;
}

const SERVICE_METRICS: Partial<Record<ModuleType, { label: string, getValue: (t: Tenant, props: SuperuserServiceOverviewProps) => string | number }>> = {
  [ModuleType.RECRUITING]: {
    label: 'Active Jobs',
    getValue: (t, props) => props.jobs.filter(j => j.tenantId === t.id).length
  },
  [ModuleType.CUSTOMER_SERVICE]: {
    label: 'Open Tickets',
    getValue: (t, props) => t.supportTickets.filter(ti => ti.status !== 'resolved').length
  },
  [ModuleType.USER_MANAGEMENT]: {
    label: 'Total Users',
    getValue: (t, props) => props.users.filter(u => u.tenantId === t.id).length
  },
  [ModuleType.FINANCE]: {
    label: 'Revenue Stream',
    getValue: (t) => t.id === 'tenant-A' ? '₹1.2 Cr' : '₹85 Lakhs' // Mocked for demo
  }
};

const SuperuserServiceOverview: React.FC<SuperuserServiceOverviewProps> = (props) => {
  const { service, tenants, onManageTenant } = props;
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  // Filter tenants who have this service enabled
  const activeTenants = tenants.filter(t => t.services.includes(service));

  const serviceLabel = service.replace('_', ' ');
  const metricConfig = SERVICE_METRICS[service];

  const selectedTenant = tenants.find(t => t.id === selectedTenantId);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
           <BarChart3 size={32} />
        </div>
        <div>
           <h2 className="text-3xl font-bold text-white capitalize">{serviceLabel} Service Overview</h2>
           <p className="text-slate-400">Monitoring usage and billing across {activeTenants.length} organizations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Left: List of Tenants using the service */}
         <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
               <Globe size={18} className="text-blue-400" /> Active Subscribers
            </h3>
            
            {activeTenants.length === 0 ? (
               <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500">
                  No tenants are currently subscribed to {serviceLabel}.
               </div>
            ) : (
               activeTenants.map(tenant => {
                 const metricValue = metricConfig ? metricConfig.getValue(tenant, props) : 'N/A';
                 const isSelected = selectedTenantId === tenant.id;

                 return (
                   <div 
                     key={tenant.id}
                     onClick={() => setSelectedTenantId(tenant.id)}
                     className={`p-5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                        isSelected 
                        ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.15)]' 
                        : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                     }`}
                   >
                      <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                            {tenant.name.charAt(0)}
                         </div>
                         <div>
                            <div className={`font-bold ${isSelected ? 'text-blue-400' : 'text-white'}`}>{tenant.name}</div>
                            <div className="text-xs text-slate-500">{tenant.domain}</div>
                         </div>
                      </div>

                      <div className="flex items-center gap-8">
                         {metricConfig && (
                           <div className="text-right">
                              <div className="text-xs text-slate-500 uppercase tracking-wide">{metricConfig.label}</div>
                              <div className="font-mono font-bold text-white">{metricValue}</div>
                           </div>
                         )}
                         <div className="text-right">
                              <div className="text-xs text-slate-500 uppercase tracking-wide">Billing</div>
                              <div className={`font-bold text-sm flex items-center gap-1 ${tenant.billing.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                                 {tenant.billing.status === 'active' ? <CheckCircle size={12}/> : <AlertCircle size={12}/>}
                                 {tenant.billing.status.toUpperCase()}
                              </div>
                         </div>
                         <ChevronRight className={`transition-transform ${isSelected ? 'text-blue-500 translate-x-1' : 'text-slate-600'}`} />
                      </div>
                   </div>
                 );
               })
            )}
         </div>

         {/* Right: Detail View */}
         <div className="lg:col-span-1">
            {selectedTenant ? (
               <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 sticky top-6 shadow-2xl animate-fade-in">
                  <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                     <Building2 size={24} className="text-slate-400" />
                     <div>
                        <h3 className="font-bold text-white text-lg">{selectedTenant.name}</h3>
                        <div className="text-xs text-blue-400">{selectedTenant.id}</div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                           <CreditCard size={14} /> Financials
                        </h4>
                        <div className="bg-slate-900 rounded-xl p-4 space-y-2">
                           <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Status</span>
                              <span className={`font-bold ${selectedTenant.billing.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                                 {selectedTenant.billing.status.toUpperCase()}
                              </span>
                           </div>
                           <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Total Balance</span>
                              <span className="font-mono text-white">₹{selectedTenant.billing.amountDue.toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between text-sm border-t border-slate-800 pt-2 mt-2">
                              <span className="text-slate-400">{serviceLabel} Cost</span>
                              <span className="font-mono text-blue-400">₹65,000/mo</span>
                           </div>
                        </div>
                     </div>

                     <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                           <Users size={14} /> Usage & Users
                        </h4>
                        <div className="bg-slate-900 rounded-xl p-4">
                           <div className="text-sm text-slate-400 mb-2">Users with access:</div>
                           <div className="flex flex-wrap gap-2">
                              {props.users.filter(u => u.tenantId === selectedTenant.id && u.permissions.includes(service)).map(u => (
                                 <div key={u.id} className="flex items-center gap-2 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                                    <div className={`w-5 h-5 rounded-full ${u.avatarColor || 'bg-slate-600'} flex items-center justify-center text-[10px] text-white font-bold`}>
                                       {u.name.charAt(0)}
                                    </div>
                                    <span className="text-xs text-slate-300">{u.name}</span>
                                 </div>
                              ))}
                              {props.users.filter(u => u.tenantId === selectedTenant.id && u.permissions.includes(service)).length === 0 && (
                                 <span className="text-xs text-slate-500 italic">No users assigned</span>
                              )}
                           </div>
                        </div>
                     </div>

                     {/* Support Ticket Integration */}
                     <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                           <Ticket size={14} /> Recent Tickets
                        </h4>
                        <div className="space-y-2">
                           {selectedTenant.supportTickets.length > 0 ? (
                              selectedTenant.supportTickets.slice(0, 3).map(ticket => (
                                 <div key={ticket.id} className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs">
                                    <div className="flex justify-between mb-1">
                                       <span className={`px-1.5 py-0.5 rounded ${ticket.priority === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-300'}`}>
                                          {ticket.priority}
                                       </span>
                                       <span className="text-slate-500">{ticket.status}</span>
                                    </div>
                                    <div className="text-slate-300 truncate">{ticket.subject}</div>
                                 </div>
                              ))
                           ) : (
                              <div className="text-xs text-slate-500 italic p-2">No tickets reported.</div>
                           )}
                        </div>
                     </div>

                     <button 
                        onClick={() => onManageTenant(selectedTenant.id)}
                        className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                     >
                        <Settings size={16} /> Manage Tenant Settings
                     </button>
                  </div>
               </div>
            ) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl p-12">
                  <Globe size={48} className="mb-4 opacity-50" />
                  <p className="text-center">Select an organization to view detailed service metrics.</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default SuperuserServiceOverview;
