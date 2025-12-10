
import React, { useState } from 'react';
import { Asset, ITRequest, ITPolicy, AssetStatus, AssetType } from '../types';
import { Laptop, Box, CheckCircle, Clock, AlertTriangle, Search, Plus, FileText, User, Settings, RefreshCw, Smartphone, Monitor, Sparkles, Loader2, History, Filter, X, Calendar, MapPin, Tag } from 'lucide-react';
import { generateITPolicy } from '../services/geminiService';

interface ITAMProps {
  assets: Asset[];
  requests: ITRequest[];
  policies: ITPolicy[];
  onAddAsset: (asset: Asset) => void;
  onUpdateAsset: (asset: Asset) => void;
  onResolveRequest: (requestId: string, assetId?: string) => void;
  onAddPolicy: (policy: ITPolicy) => void;
}

interface AssetHistoryLog {
  date: string;
  action: string;
  details: string;
  user?: string;
  type: 'procurement' | 'assignment' | 'maintenance' | 'return';
}

const ITAM: React.FC<ITAMProps> = ({ assets, requests, policies, onAddAsset, onUpdateAsset, onResolveRequest, onAddPolicy }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'requests' | 'policies'>('dashboard');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Asset Modal State
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [newAsset, setNewAsset] = useState<Partial<Asset>>({ type: 'HARDWARE', status: 'AVAILABLE', location: 'HQ' });

  // Detail/History Modal State
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Policy Generation State
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyType, setPolicyType] = useState('Acceptable Use Policy (AUP)');
  const [isGeneratingPolicy, setIsGeneratingPolicy] = useState(false);

  const filteredAssets = assets.filter(a => {
    const matchesSearch = (
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.assignedTo && a.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    const matchesType = filterType === 'ALL' || a.type === filterType;
    const matchesStatus = filterStatus === 'ALL' || a.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

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

  const getMockHistory = (asset: Asset): AssetHistoryLog[] => {
    const history: AssetHistoryLog[] = [
      { 
        date: asset.purchaseDate, 
        action: 'Asset Procured', 
        details: `Purchased for $${asset.value}`, 
        type: 'procurement' 
      }
    ];

    if (asset.status === 'ASSIGNED' && asset.assignedTo) {
      // Mock assignment date (e.g., 2 weeks after purchase)
      history.push({
        date: '2024-02-10', // Fixed mock date for demo
        action: 'Assigned to User',
        details: `Provisioned to ${asset.assignedTo}`,
        user: asset.assignedTo,
        type: 'assignment'
      });
    }

    if (asset.status === 'MAINTENANCE') {
      history.push({
        date: '2024-03-15',
        action: 'Maintenance Ticket',
        details: 'Screen flickering reported. Sent to vendor.',
        user: asset.assignedTo,
        type: 'maintenance'
      });
    }

    if (asset.status === 'AVAILABLE' && asset.id === 'a2') {
       // Mock return history
       history.push({
          date: '2023-06-01',
          action: 'Assigned to User',
          details: 'Provisioned to Previous Employee',
          user: 'Ex-Employee',
          type: 'assignment'
       });
       history.push({
          date: '2024-01-20',
          action: 'Returned to Inventory',
          details: 'Employee exit. Asset wiped and checked.',
          type: 'return'
       });
    }

    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

  const handleGeneratePolicy = async () => {
    setIsGeneratingPolicy(true);
    try {
      const content = await generateITPolicy(policyType);
      const newPolicy: ITPolicy = {
        id: Math.random().toString(36).substr(2, 9),
        title: policyType,
        content: content,
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      onAddPolicy(newPolicy);
      setShowPolicyModal(false);
    } catch (error) {
      console.error(error);
      alert("Failed to generate policy.");
    } finally {
      setIsGeneratingPolicy(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-slate-800 pb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">IT Asset Management</h2>
          <p className="text-slate-400 mt-2">Lifecycle tracking, provisioning, and policy enforcement.</p>
        </div>
        
        <div className="flex bg-slate-800 p-1 rounded-lg overflow-x-auto">
          <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
             <Monitor size={18} /> Dashboard
          </button>
          <button onClick={() => setActiveTab('inventory')} className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'inventory' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
             <Box size={18} /> Inventory
          </button>
          <button onClick={() => setActiveTab('requests')} className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'requests' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
             <Settings size={18} /> Requests
             {pendingRequests.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{pendingRequests.length}</span>}
          </button>
          <button onClick={() => setActiveTab('policies')} className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'policies' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
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
              <div className="text-xs text-slate-500">Utilization: {assets.length > 0 ? Math.round((assets.filter(a => a.status === 'ASSIGNED').length / assets.length) * 100) : 0}%</div>
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
           <div className="p-6 border-b border-slate-700 flex flex-col xl:flex-row gap-4 justify-between items-center">
              <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto flex-1">
                 <div className="relative flex-1">
                    <input 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search ID, Name, Serial, or User..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                 </div>
                 
                 <div className="flex gap-2">
                    <div className="relative">
                       <select 
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                          className="bg-slate-900 border border-slate-700 text-slate-300 py-2 pl-3 pr-8 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 h-full"
                       >
                          <option value="ALL">All Types</option>
                          <option value="HARDWARE">Hardware</option>
                          <option value="SOFTWARE">Software</option>
                          <option value="PERIPHERAL">Peripheral</option>
                       </select>
                       <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                    </div>

                    <div className="relative">
                       <select 
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="bg-slate-900 border border-slate-700 text-slate-300 py-2 pl-3 pr-8 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 h-full"
                       >
                          <option value="ALL">All Status</option>
                          <option value="AVAILABLE">Available</option>
                          <option value="ASSIGNED">Assigned</option>
                          <option value="MAINTENANCE">Maintenance</option>
                          <option value="RETIRED">Retired</option>
                       </select>
                       <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => setShowAssetModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg whitespace-nowrap"
              >
                 <Plus size={18} /> Add Asset
              </button>
           </div>
           
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
               <thead className="bg-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                 <tr>
                   <th className="p-4">Asset Name</th>
                   <th className="p-4">Serial / Tag</th>
                   <th className="p-4">Status</th>
                   <th className="p-4">Assigned To</th>
                   <th className="p-4">Location</th>
                   <th className="p-4 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-700">
                 {filteredAssets.map(asset => (
                   <tr key={asset.id} className="hover:bg-slate-700/30 transition-colors group cursor-pointer" onClick={() => setSelectedAsset(asset)}>
                     <td className="p-4">
                        <div className="flex items-center gap-3">
                           <div className="p-2 rounded bg-slate-700 text-slate-300">
                              {asset.type === 'HARDWARE' ? <Laptop size={18} /> : asset.type === 'SOFTWARE' ? <Monitor size={18} /> : <Smartphone size={18} />}
                           </div>
                           <div>
                              <div className="font-bold text-white">{asset.name}</div>
                              <div className="text-xs text-slate-500 font-mono">ID: {asset.id}</div>
                           </div>
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
                     <td className="p-4 text-right">
                        <button className="text-blue-400 hover:text-white p-2 rounded-lg hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-all">
                           <History size={16} />
                        </button>
                     </td>
                   </tr>
                 ))}
                 {filteredAssets.length === 0 && (
                    <tr>
                       <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                          No assets found matching filters.
                       </td>
                    </tr>
                 )}
               </tbody>
             </table>
           </div>
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
                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
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
         <>
          <div className="flex justify-end mb-4">
            <button 
              onClick={() => setShowPolicyModal(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg transition-all"
            >
               <Sparkles size={18} /> Generate Policy with AI
            </button>
          </div>
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
                    <div className="text-slate-400 text-sm leading-relaxed border-t border-slate-700 pt-4 whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar">
                      {policy.content}
                    </div>
                </div>
              ))}
          </div>
         </>
      )}

      {/* Asset Detail & History Modal */}
      {selectedAsset && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]">
               <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-900 rounded-t-2xl">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">
                        {selectedAsset.type === 'HARDWARE' ? <Laptop size={24} className="text-blue-400" /> : <Box size={24} className="text-purple-400" />}
                     </div>
                     <div>
                        <h2 className="text-2xl font-bold text-white">{selectedAsset.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="font-mono text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                              SN: {selectedAsset.serialNumber}
                           </span>
                           <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getStatusColor(selectedAsset.status)}`}>
                              {selectedAsset.status}
                           </span>
                        </div>
                     </div>
                  </div>
                  <button onClick={() => setSelectedAsset(null)} className="text-slate-500 hover:text-white p-2 hover:bg-slate-800 rounded-full">
                     <X size={20} />
                  </button>
               </div>

               <div className="p-6 overflow-y-auto custom-scrollbar">
                  {/* Basic Details */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                     <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                        <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><MapPin size={12}/> Location</div>
                        <div className="text-white font-medium">{selectedAsset.location}</div>
                     </div>
                     <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                        <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Tag size={12}/> Value</div>
                        <div className="text-white font-medium">${selectedAsset.value.toLocaleString()}</div>
                     </div>
                     <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                        <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Calendar size={12}/> Purchased</div>
                        <div className="text-white font-medium">{selectedAsset.purchaseDate}</div>
                     </div>
                     <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                        <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><User size={12}/> Current User</div>
                        <div className="text-white font-medium">{selectedAsset.assignedTo || "Unassigned"}</div>
                     </div>
                  </div>

                  {/* History Timeline */}
                  <div>
                     <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <History size={18} className="text-orange-400" /> Asset History
                     </h3>
                     <div className="relative border-l-2 border-slate-700 ml-3 space-y-6">
                        {getMockHistory(selectedAsset).map((log, idx) => (
                           <div key={idx} className="relative pl-8">
                              <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-slate-900 ${
                                 log.type === 'procurement' ? 'bg-green-500' :
                                 log.type === 'assignment' ? 'bg-blue-500' :
                                 log.type === 'maintenance' ? 'bg-yellow-500' : 'bg-slate-500'
                              }`}></div>
                              
                              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors">
                                 <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-slate-200 text-sm">{log.action}</h4>
                                    <span className="text-xs text-slate-500 font-mono">{log.date}</span>
                                 </div>
                                 <p className="text-sm text-slate-400">{log.details}</p>
                                 {log.user && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 w-fit px-2 py-1 rounded">
                                       <User size={10} /> {log.user}
                                    </div>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
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

      {/* Generate Policy Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                 <Sparkles className="text-purple-400" /> Generate Policy
              </h3>
              <p className="text-slate-400 text-sm mb-6">Create comprehensive IT policies tailored for Indian enterprises.</p>
              
              <div className="space-y-4">
                 <div>
                    <label className="block text-sm text-slate-400 mb-1">Select Policy Type</label>
                    <select 
                       value={policyType} 
                       onChange={(e) => setPolicyType(e.target.value)}
                       className="w-full bg-slate-800 rounded-lg p-3 text-white border border-slate-700 focus:ring-2 focus:ring-purple-500"
                    >
                       <option>Acceptable Use Policy (AUP)</option>
                       <option>Data Security & Privacy</option>
                       <option>Bring Your Own Device (BYOD)</option>
                       <option>Remote Access Policy</option>
                       <option>Incident Response Plan</option>
                       <option>Password Policy</option>
                    </select>
                 </div>
                 
                 <div className="flex gap-3 pt-4">
                    <button 
                       type="button" 
                       onClick={() => setShowPolicyModal(false)} 
                       className="flex-1 py-2 text-slate-400"
                       disabled={isGeneratingPolicy}
                    >
                       Cancel
                    </button>
                    <button 
                       onClick={handleGeneratePolicy} 
                       disabled={isGeneratingPolicy}
                       className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold flex items-center justify-center gap-2"
                    >
                       {isGeneratingPolicy ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                       {isGeneratingPolicy ? 'Drafting...' : 'Generate'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default ITAM;
