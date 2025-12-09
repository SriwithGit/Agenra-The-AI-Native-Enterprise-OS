
import React, { useState } from 'react';
import { Asset, ITRequest, ITPolicy, AssetStatus, AssetType } from '../types';
import { Laptop, Box, CheckCircle, Clock, AlertTriangle, Search, Plus, FileText, User, Settings, RefreshCw, Smartphone, Monitor } from 'lucide-react';

interface ITAMProps {
  assets: Asset[];
  requests: ITRequest[];
  policies: ITPolicy[];
  onAddAsset: (asset: Asset) => void;
  onUpdateAsset: (asset: Asset) => void;
  onResolveRequest: (requestId: string, assetId?: string) => void;
}

const ITAM: React.FC<ITAMProps> = ({ assets, requests, policies, onAddAsset, onUpdateAsset, onResolveRequest }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'requests' | 'policies'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Asset Modal State
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [newAsset, setNewAsset] = useState<Partial<Asset>>({ type: 'HARDWARE', status: 'AVAILABLE', location: 'HQ' });

  const filteredAssets = assets.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingRequests = requests.filter(r => r.status === 'pending');

  const getStatusColor = (status: AssetStatus) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'ASSIGNED': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'MAINTENANCE': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'RETIRED': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default: return 'bg-slate-500/10 text-slate-400';
    }
  };

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    onAddAsset({
      id: Math.random().toString(36).substr(2, 9),
      tenantId: 'current', // In real app, from context
      name: newAsset.name || 'Unknown Asset',
      serialNumber: newAsset.serialNumber || `SN-${Math.floor(Math.random()*10000)}`,
      type: newAsset.type || 'HARDWARE',
      status: 'AVAILABLE',
      location: newAsset.location || 'HQ',
      purchaseDate: new Date().toISOString().split('T')[0],
      value: newAsset.value || 0
    });
    setShowAssetModal(false);
    setNewAsset({ type: 'HARDWARE', status: 'AVAILABLE', location: 'HQ' });
  };

  const handleAssignAsset = (request: ITRequest, assetId: string) => {
    // 1. Update Asset Status
    const asset = assets.find(a => a.id === assetId);
    if (asset) {
       onUpdateAsset({ 
         ...asset, 
         status: 'ASSIGNED', 
         assignedTo: request.description.split('for ')[1] || 'Employee' // Naive parsing for demo
       });
    }
    // 2. Resolve Request
    onResolveRequest(request.id, assetId);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-slate-800 pb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">IT Asset Management</h2>
          <p className="text-slate-400 mt-2">Lifecycle tracking, provisioning, and policy enforcement.</p>
        </div>
        
        <div className="flex bg-slate-800 p-1 rounded-lg">
          <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
             <Monitor size={18} /> Dashboard
          </button>
          <button onClick={() => setActiveTab('inventory')} className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${activeTab === 'inventory' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
             <Box size={18} /> Inventory
          </button>
          <button onClick={() => setActiveTab('requests')} className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${activeTab === 'requests' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
             <Settings size={18} /> Requests
             {pendingRequests.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{pendingRequests.length}</span>}
          </button>
          <button onClick={() => setActiveTab('policies')} className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${activeTab === 'policies' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
             <FileText size={18} /> Policies
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <div className="text-slate-400 text-sm">Total Assets</div>
                    <div className="text-3xl font-bold text-white">{assets.length}</div>
                 </div>
                 <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400"><Box size={24} /></div>
              </div>
              <div className="text-xs text-slate-500">Value: ${assets.reduce((sum, a) => sum + a.value, 0).toLocaleString()}</div>
           </div>
           <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <div className="text-slate-400 text-sm">Assigned</div>
                    <div className="text-3xl font-bold text-white">{assets.filter(a => a.status === 'ASSIGNED').length}</div>
                 </div>
                 <div className="p-3 bg-green-500/10 rounded-lg text-green-400"><User size={24} /></div>
              </div>
              <div className="text-xs text-slate-500">Utilization: {Math.round((assets.filter(a => a.status === 'ASSIGNED').length / assets.length) * 100)}%</div>
           </div>
           <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <div className="text-slate-400 text-sm">Pending Requests</div>
                    <div className="text-3xl font-bold text-yellow-400">{pendingRequests.length}</div>
                 </div>
                 <div className="p-3 bg-yellow-500/10 rounded-lg text-yellow-400"><Clock size={24} /></div>
              </div>
              <div className="text-xs text-slate-500">Requires Action</div>
           </div>
           <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <div className="text-slate-400 text-sm">Maintenance</div>
                    <div className="text-3xl font-bold text-red-400">{assets.filter(a => a.status === 'MAINTENANCE').length}</div>
                 </div>
                 <div className="p-3 bg-red-500/10 rounded-lg text-red-400"><AlertTriangle size={24} /></div>
              </div>
              <div className="text-xs text-slate-500">Assets under repair</div>
           </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
           <div className="p-6 border-b border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:w-96">
                 <input 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   placeholder="Search by name, serial, or user..."
                   className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                 />
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              </div>
              <button 
                onClick={() => setShowAssetModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg"
              >
                 <Plus size={18} /> Add Asset
              </button>
           </div>
           
           <table className="w-full text-left text-sm">
             <thead className="bg-slate-900 text-slate-400 font-bold uppercase tracking-wider">
               <tr>
                 <th className="p-4">Asset Name</th>
                 <th className="p-4">Serial / Tag</th>
                 <th className="p-4">Status</th>
                 <th className="p-4">Assigned To</th>
                 <th className="p-4">Location</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-700">
               {filteredAssets.map(asset => (
                 <tr key={asset.id} className="hover:bg-slate-700/30 transition-colors">
                   <td className="p-4">
                      <div className="flex items-center gap-3">
                         <div className="p-2 rounded bg-slate-700 text-slate-300">
                            {asset.type === 'HARDWARE' ? <Laptop size={18} /> : asset.type === 'SOFTWARE' ? <Monitor size={18} /> : <Smartphone size={18} />}
                         </div>
                         <div className="font-bold text-white">{asset.name}</div>
                      </div>
                   </td>
                   <td className="p-4 text-slate-400 font-mono">{asset.serialNumber}</td>
                   <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getStatusColor(asset.status)}`}>
                         {asset.status}
                      </span>
                   </td>
                   <td className="p-4 text-white">
                      {asset.assignedTo ? (
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-xs">{asset.assignedTo.charAt(0)}</div>
                           {asset.assignedTo}
                        </div>
                      ) : <span className="text-slate-600 italic">Unassigned</span>}
                   </td>
                   <td className="p-4 text-slate-400">{asset.location}</td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      )}

      {activeTab === 'requests' && (
         <div className="space-y-4">
            {pendingRequests.length === 0 ? (
               <div className="text-center py-12 bg-slate-800 rounded-2xl border border-slate-700 border-dashed text-slate-500">
                  <CheckCircle size={48} className="mx-auto mb-4 opacity-50 text-green-500" />
                  <p>All clear! No pending provisioning requests.</p>
               </div>
            ) : (
               pendingRequests.map(request => (
                  <div key={request.id} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg flex flex-col md:flex-row justify-between gap-6">
                     <div>
                        <div className="flex items-center gap-2 mb-2">
                           <span className="bg-purple-500/10 text-purple-400 text-xs px-2 py-0.5 rounded border border-purple-500/20 font-bold uppercase">
                              {request.type}
                           </span>
                           <span className="text-slate-500 text-xs">{request.date}</span>
                        </div>
                        <h3 className="text-xl font-bold text-white">{request.description}</h3>
                        <p className="text-sm text-slate-400 mt-1">Requested by: HR (Onboarding)</p>
                     </div>
                     
                     <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 w-full md:w-96">
                        <h4 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Assign Available Asset</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                           {assets.filter(a => a.status === 'AVAILABLE').map(asset => (
                              <div key={asset.id} className="flex items-center justify-between p-2 hover:bg-slate-800 rounded cursor-pointer group">
                                 <div className="flex items-center gap-2">
                                    <Laptop size={14} className="text-slate-500" />
                                    <span className="text-sm text-slate-300">{asset.name}</span>
                                 </div>
                                 <button 
                                   onClick={() => handleAssignAsset(request, asset.id)}
                                   className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded transition-colors"
                                 >
                                    Assign
                                 </button>
                              </div>
                           ))}
                           {assets.filter(a => a.status === 'AVAILABLE').length === 0 && (
                              <div className="text-xs text-red-400 italic">No available assets in inventory!</div>
                           )}
                        </div>
                     </div>
                  </div>
               ))
            )}
         </div>
      )}

      {activeTab === 'policies' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {policies.map(policy => (
               <div key={policy.id} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="p-3 bg-slate-700 rounded-xl text-slate-300">
                        <FileText size={24} />
                     </div>
                     <div>
                        <h3 className="text-lg font-bold text-white">{policy.title}</h3>
                        <div className="text-xs text-slate-500">Updated: {policy.lastUpdated}</div>
                     </div>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed border-t border-slate-700 pt-4">
                     {policy.content}
                  </p>
               </div>
            ))}
         </div>
      )}

      {/* Create Asset Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-6">Add New Asset</h3>
              <form onSubmit={handleCreateAsset} className="space-y-4">
                 <div>
                    <label className="block text-sm text-slate-400 mb-1">Asset Name / Model</label>
                    <input required value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} className="w-full bg-slate-800 rounded-lg p-3 text-white border border-slate-700" placeholder="e.g. Dell XPS 15" />
                 </div>
                 <div>
                    <label className="block text-sm text-slate-400 mb-1">Serial Number</label>
                    <input required value={newAsset.serialNumber} onChange={e => setNewAsset({...newAsset, serialNumber: e.target.value})} className="w-full bg-slate-800 rounded-lg p-3 text-white border border-slate-700" placeholder="SN-12345" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-sm text-slate-400 mb-1">Value ($)</label>
                       <input type="number" value={newAsset.value} onChange={e => setNewAsset({...newAsset, value: Number(e.target.value)})} className="w-full bg-slate-800 rounded-lg p-3 text-white border border-slate-700" />
                    </div>
                    <div>
                       <label className="block text-sm text-slate-400 mb-1">Location</label>
                       <input value={newAsset.location} onChange={e => setNewAsset({...newAsset, location: e.target.value})} className="w-full bg-slate-800 rounded-lg p-3 text-white border border-slate-700" />
                    </div>
                 </div>
                 <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setShowAssetModal(false)} className="flex-1 py-2 text-slate-400">Cancel</button>
                    <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold">Add to Inventory</button>
                 </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
};

export default ITAM;
