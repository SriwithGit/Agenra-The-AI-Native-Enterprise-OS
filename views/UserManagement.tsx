
import React, { useState } from 'react';
import { User, Tenant, ModuleType, DEPARTMENTS, Department, AuditLog } from '../types';
import { UserPlus, Trash2, Shield, Mail, Briefcase, CheckCircle, X, ChevronDown, FileText, Activity } from 'lucide-react';

interface UserManagementProps {
  currentUser: User;
  tenantUsers: User[];
  tenantServices: ModuleType[];
  onAddUser: (user: Partial<User>) => void;
  onDeleteUser: (userId: string) => void;
  auditLogs?: AuditLog[];
}

const ALL_MODULES = [
  { id: ModuleType.CUSTOMER_SERVICE, label: 'Customer Service' },
  { id: ModuleType.RECRUITING, label: 'Recruiting' },
  { id: ModuleType.FINANCE, label: 'Finance' },
  { id: ModuleType.MARKET_RESEARCH, label: 'Market Research' },
  { id: ModuleType.HR_INTERNAL, label: 'Internal HR' },
];

const UserManagement: React.FC<UserManagementProps> = ({ currentUser, tenantUsers, tenantServices, onAddUser, onDeleteUser, auditLogs = [] }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    department: '' as Department | '',
    jobTitle: '',
    selectedPermissions: [ModuleType.DASHBOARD] as ModuleType[]
  });

  const availableServices = ALL_MODULES.filter(m => tenantServices.includes(m.id));
  const departmentKeys = Object.keys(DEPARTMENTS) as Department[];

  const togglePermission = (moduleId: ModuleType) => {
    setNewUser(prev => {
      if (prev.selectedPermissions.includes(moduleId)) {
        return { ...prev, selectedPermissions: prev.selectedPermissions.filter(p => p !== moduleId) };
      } else {
        return { ...prev, selectedPermissions: [...prev.selectedPermissions, moduleId] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddUser({
      name: newUser.name,
      email: newUser.email,
      department: newUser.department,
      jobTitle: newUser.jobTitle,
      role: 'SERVICE_USER',
      permissions: newUser.selectedPermissions
    });
    setShowAddModal(false);
    setNewUser({ name: '', email: '', department: '', jobTitle: '', selectedPermissions: [ModuleType.DASHBOARD] });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Team Management</h2>
          <p className="text-slate-400 mt-2">Manage employee access and audit administrative actions.</p>
        </div>
        <div className="flex bg-slate-800 p-1 rounded-lg">
           <button 
             onClick={() => setActiveTab('users')} 
             className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === 'users' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
           >
             Employees
           </button>
           <button 
             onClick={() => setActiveTab('audit')} 
             className={`px-6 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${activeTab === 'audit' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
           >
             <FileText size={16} /> Audit Log
           </button>
        </div>
      </div>

      {activeTab === 'users' && (
        <>
          <div className="flex justify-end">
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
            >
              <UserPlus size={18} /> Add Employee
            </button>
          </div>

          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl animate-fade-in">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-slate-400 text-sm font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-6">Employee</th>
                  <th className="p-6">Department & Role</th>
                  <th className="p-6">Access Rights</th>
                  <th className="p-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {tenantUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${user.avatarColor || 'bg-slate-600'}`}>
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white">{user.name}</div>
                          <div className="text-sm text-slate-500 flex items-center gap-1">
                            <Mail size={12} /> {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="text-white font-medium">{user.jobTitle || 'N/A'}</span>
                        <span className="text-xs text-blue-400 mt-0.5 font-semibold">{user.department || 'General'}</span>
                        <span className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 w-fit mt-1">
                            {user.role}
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-wrap gap-2">
                        {user.permissions.filter(p => p !== ModuleType.DASHBOARD).map(p => (
                          <span key={p} className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">
                            {ALL_MODULES.find(m => m.id === p)?.label}
                          </span>
                        ))}
                        {user.permissions.length === 1 && <span className="text-xs text-slate-500">Dashboard Only</span>}
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      {user.id !== currentUser.id && user.role !== 'TENANT_ADMIN' && (
                        <button 
                          onClick={() => onDeleteUser(user.id)}
                          className="text-slate-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Remove User"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'audit' && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl animate-fade-in">
           <div className="p-6 border-b border-slate-700 bg-slate-900/50">
              <h3 className="font-bold text-white flex items-center gap-2">
                 <Activity size={20} className="text-blue-400" /> Administrative Actions
              </h3>
              <p className="text-sm text-slate-400 mt-1">Track changes made to user accounts and permissions.</p>
           </div>
           {auditLogs.length === 0 ? (
             <div className="p-12 text-center text-slate-500 italic">No audit records found for this tenant.</div>
           ) : (
             <table className="w-full text-left text-sm">
               <thead className="bg-slate-900 text-slate-400 font-bold uppercase tracking-wider text-xs">
                 <tr>
                   <th className="p-4">Action</th>
                   <th className="p-4">Performed By</th>
                   <th className="p-4">Target User</th>
                   <th className="p-4">Details</th>
                   <th className="p-4 text-right">Timestamp</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-700">
                 {auditLogs.map(log => (
                   <tr key={log.id} className="hover:bg-slate-700/30 transition-colors">
                     <td className="p-4">
                       <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                         log.action === 'CREATE_USER' ? 'bg-green-500/10 text-green-400' : 
                         log.action === 'DELETE_USER' ? 'bg-red-500/10 text-red-400' : 
                         'bg-blue-500/10 text-blue-400'
                       }`}>
                         {log.action.replace('_', ' ')}
                       </span>
                     </td>
                     <td className="p-4 text-white font-medium">{log.performedBy}</td>
                     <td className="p-4 text-slate-300">{log.targetResource}</td>
                     <td className="p-4 text-slate-400 max-w-xs truncate" title={log.details}>{log.details}</td>
                     <td className="p-4 text-right text-slate-500 font-mono text-xs">{log.timestamp}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           )}
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl max-w-lg w-full shadow-2xl relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-2xl font-bold text-white mb-6">Onboard New Employee</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Full Name</label>
                <input 
                  required
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email Address</label>
                <input 
                  required
                  type="email"
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john@company.com"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Department</label>
                  <div className="relative">
                    <select
                      required
                      value={newUser.department}
                      onChange={e => setNewUser({...newUser, department: e.target.value as Department, jobTitle: ''})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Dept</option>
                      {departmentKeys.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Role / Job Title</label>
                  <div className="relative">
                    <select
                      required
                      value={newUser.jobTitle}
                      onChange={e => setNewUser({...newUser, jobTitle: e.target.value})}
                      disabled={!newUser.department}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <option value="">Select Role</option>
                      {newUser.department && DEPARTMENTS[newUser.department]?.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-sm text-slate-400 mb-2">Assign Access Rights</label>
                <div className="bg-slate-800 rounded-lg border border-slate-700 p-3 space-y-2 max-h-48 overflow-y-auto">
                   {availableServices.length > 0 ? (
                     availableServices.map(service => (
                       <label key={service.id} className="flex items-center gap-3 p-2 hover:bg-slate-700/50 rounded cursor-pointer">
                         <input 
                           type="checkbox"
                           checked={newUser.selectedPermissions.includes(service.id)}
                           onChange={() => togglePermission(service.id)}
                           className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                         />
                         <span className="text-slate-200 text-sm">{service.label}</span>
                       </label>
                     ))
                   ) : (
                     <div className="text-slate-500 text-sm italic text-center py-2">No active services available. Contact Admin.</div>
                   )}
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all shadow-lg"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
