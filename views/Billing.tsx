
import React, { useState } from 'react';
import { Tenant, ModuleType, ServiceRequest } from '../types';
import { CreditCard, CheckCircle, AlertTriangle, Plus, Trash2, Clock, Check, X } from 'lucide-react';

interface BillingProps {
  tenant: Tenant;
  onPayBill: (tenantId: string) => void;
  onRequestServiceChange: (tenantId: string, service: ModuleType, action: 'add' | 'remove') => void;
}

const ALL_SERVICES = [
  { id: ModuleType.CUSTOMER_SERVICE, label: 'Customer Service' },
  { id: ModuleType.RECRUITING, label: 'Recruiting' },
  { id: ModuleType.FINANCE, label: 'Finance' },
  { id: ModuleType.MARKET_RESEARCH, label: 'Market Research' },
  { id: ModuleType.HR_INTERNAL, label: 'HR Internal' },
];

const Billing: React.FC<BillingProps> = ({ tenant, onPayBill, onRequestServiceChange }) => {
  const [loadingPay, setLoadingPay] = useState(false);

  const handlePay = () => {
    setLoadingPay(true);
    setTimeout(() => {
      onPayBill(tenant.id);
      setLoadingPay(false);
    }, 1500);
  };

  const getServiceStatus = (serviceId: ModuleType) => {
    // Check if active
    if (tenant.services.includes(serviceId)) return 'active';
    // Check if pending add
    const pendingAdd = tenant.serviceRequests?.find(r => r.service === serviceId && r.action === 'add' && r.status === 'pending');
    if (pendingAdd) return 'pending_add';
    // Check if pending remove
    const pendingRemove = tenant.serviceRequests?.find(r => r.service === serviceId && r.action === 'remove' && r.status === 'pending');
    if (pendingRemove) return 'pending_remove';
    
    return 'inactive';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">Billing & Services</h2>
        <p className="text-slate-400 mt-2">Manage your subscription, invoices, and active services.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Invoice Card */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5">
              <CreditCard size={140} />
           </div>
           
           <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
             <CreditCard className="text-green-400" /> Current Invoice
           </h3>

           <div className="space-y-6">
             <div className="flex justify-between items-end pb-4 border-b border-slate-700">
               <span className="text-slate-400">Amount Due</span>
               <span className="text-4xl font-bold text-white">₹{tenant.billing.amountDue.toLocaleString()}</span>
             </div>
             
             <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-slate-500 mb-1">Status</div>
                  <div className={`inline-flex items-center gap-1 font-bold px-2 py-1 rounded ${tenant.billing.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {tenant.billing.status === 'active' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                    {tenant.billing.status.toUpperCase()}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">Due Date</div>
                  <div className="text-white font-mono">{tenant.billing.nextBillingDate}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">Account #</div>
                  <div className="text-white font-mono">{tenant.billing.accountNumber}</div>
                </div>
             </div>

             <button 
               onClick={handlePay}
               disabled={tenant.billing.amountDue === 0 || loadingPay}
               className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-green-500/20 flex items-center justify-center gap-2"
             >
               {loadingPay ? 'Processing...' : tenant.billing.amountDue === 0 ? 'All Paid' : 'Pay Invoice Now'}
             </button>
           </div>
        </div>

        {/* Service Management */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8">
          <h3 className="text-xl font-bold text-white mb-6">Subscription Manager</h3>
          <div className="space-y-3">
             {ALL_SERVICES.map(service => {
               const status = getServiceStatus(service.id);
               return (
                 <div key={service.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-medium text-slate-300">{service.label}</span>
                    
                    {status === 'active' && (
                      <button 
                        onClick={() => onRequestServiceChange(tenant.id, service.id, 'remove')}
                        className="px-3 py-1.5 text-xs bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-lg transition-all flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Request Stop
                      </button>
                    )}
                    
                    {status === 'inactive' && (
                      <button 
                        onClick={() => onRequestServiceChange(tenant.id, service.id, 'add')}
                        className="px-3 py-1.5 text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/20 rounded-lg transition-all flex items-center gap-1"
                      >
                        <Plus size={12} /> Request Access
                      </button>
                    )}

                    {status === 'pending_add' && (
                       <span className="text-xs text-yellow-500 flex items-center gap-1 px-3 py-1.5 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                         <Clock size={12} /> Adding...
                       </span>
                    )}

                    {status === 'pending_remove' && (
                       <span className="text-xs text-yellow-500 flex items-center gap-1 px-3 py-1.5 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                         <Clock size={12} /> Removing...
                       </span>
                    )}
                 </div>
               );
             })}
          </div>
          <div className="mt-6 p-4 bg-blue-500/5 rounded-xl border border-blue-500/10 text-xs text-blue-400">
             <p>Service changes are reviewed by the Superuser. 'Add' requests are provisioned upon approval. 'Stop' requests are effective at the end of the billing cycle.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
