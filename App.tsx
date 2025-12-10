
import React, { useState, useEffect } from 'react';
import { ModuleType, Job, Candidate, CandidateProfile, User, Tenant, Role, ServiceRequest, HRTask, Asset, ITRequest, ITPolicy, AuditLog } from './types';
import LiveAgent from './components/LiveAgent';
import MarketResearch from './views/MarketResearch';
import Finance from './views/Finance';
import HRInternal from './views/HRInternal';
import Recruiting from './views/Recruiting';
import JobBoard from './views/JobBoard';
import SuperuserDashboard, { GlobalBilling } from './views/SuperuserDashboard';
import SuperuserServiceOverview from './views/SuperuserServiceOverview';
import Billing from './views/Billing';
import UserManagement from './views/UserManagement';
import ITAM from './views/ITAM';
import CustomerService from './views/CustomerService';
import GlobalChatbot from './components/GlobalChatbot';
import { LayoutDashboard, Headset, Users, PieChart, Search, Briefcase, Globe, LogOut, Shield, Building2, User as UserIcon, Lock, CreditCard, ChevronDown, Monitor, Wifi, WifiOff, RefreshCw, CheckCircle2, ArrowLeftRight, ExternalLink, Loader2, AlertTriangle } from 'lucide-react';
import { api } from './services/api';

// --- MOCK DATA FALLBACKS ---
const INITIAL_JOBS: Job[] = [
  {
    id: '1',
    tenantId: 'tenant-A',
    title: 'Senior React Developer',
    department: 'Engineering',
    location: 'Bengaluru, KA',
    description: 'Looking for 5+ years experience in React, TypeScript, and Node.js. Hybrid role. Must have experience with scalable architecture and leading small teams.',
    postedDate: '2024-03-10',
    applicants: 12
  },
  {
    id: '2',
    tenantId: 'tenant-A',
    title: 'Product Marketing Manager',
    department: 'Marketing',
    location: 'Gurugram, HR',
    description: 'Lead go-to-market strategies for our new SaaS line.',
    postedDate: '2024-03-12',
    applicants: 8
  }
];

const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: 'c1',
    tenantId: 'tenant-A',
    jobId: '1',
    name: 'Priya Sharma',
    role: 'Senior React Developer',
    experience: '6 years at Infosys & Startups',
    education: 'B.Tech CS, IIT Delhi',
    resumeSummary: 'Full stack developer with focus on frontend performance and scalable systems. Expert in React, Node.js, and Cloud Architecture.',
    status: 'offer_pending', 
    offerDetails: { salary: '15,00,000', joiningDate: '2024-05-01', variablePay: '10%', notes: 'Strong candidate, good cultural fit', draftedBy: 'hr-recruiting' },
    evaluation: { score: 92, reasoning: 'Perfect match for seniority and stack.', fit: 'High', keySkills: ['React', 'Node.js', 'System Design'] }
  },
  {
    id: 'c2',
    tenantId: 'tenant-A',
    jobId: '1',
    name: 'Ananya Gupta',
    role: 'Senior React Developer',
    experience: '5 years at TechM',
    education: 'M.Tech, BITS Pilani',
    resumeSummary: 'Senior Software Engineer specializing in MERN stack. Led a team of 4 developers. Certified AWS Solution Architect with strong TypeScript background.',
    status: 'applied' // High Match - Will trigger AI Analysis
  },
  {
    id: 'c3',
    tenantId: 'tenant-A',
    jobId: '1',
    name: 'Vikram Singh',
    role: 'Senior React Developer',
    experience: '8 years at LegacyCorp',
    education: 'B.E. Mechanical',
    resumeSummary: 'Experienced Java Backend Developer with 8 years in Spring Boot. Recently completed a React Udemy course and looking to switch domains to frontend.',
    status: 'applied' // Pivot/Medium Match - Will trigger AI Analysis
  },
  {
    id: 'c4',
    tenantId: 'tenant-A',
    jobId: '1',
    name: 'Rohan Mehta',
    role: 'Senior React Developer',
    experience: '2 years at WebSolutions',
    education: 'BCA, Bangalore Univ',
    resumeSummary: 'Junior frontend developer passionate about UI libraries. Experienced in HTML, CSS, and basic React hooks. Looking for a senior role to grow.',
    status: 'applied' // Low Match - Will trigger AI Analysis
  }
];

// --- BROWSER BAR COMPONENT ---
const BrowserBar = ({ currentUrl, onChangeUrl, tenants }: { currentUrl: string, onChangeUrl: (url: string) => void, tenants: Tenant[] }) => {
  return (
    <div className="bg-black text-slate-400 text-xs py-2 px-4 flex items-center justify-center gap-4 border-b border-slate-800">
      <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-700">
        <Globe size={12} className="text-blue-500" />
        <span className="font-mono text-slate-500">https://</span>
        <select 
          value={currentUrl} 
          onChange={(e) => onChangeUrl(e.target.value)}
          className="bg-transparent text-white font-mono focus:outline-none appearance-none cursor-pointer hover:text-blue-400 transition-colors"
        >
          <option value="admin.agenra.in">admin.agenra.in (Superuser Portal)</option>
          {tenants.map(t => (
            <option key={t.id} value={t.domain}>{t.domain} ({t.name})</option>
          ))}
          <option value="agenra.in">agenra.in (Public Job Board)</option>
        </select>
        <ChevronDown size={10} className="text-slate-600" />
      </div>
      <div className="text-[10px] text-slate-600 uppercase tracking-widest hidden md:block">
        Domain Simulation Mode
      </div>
    </div>
  );
};

function App() {
  // --- Domain State ---
  const [currentDomain, setCurrentDomain] = useState('admin.agenra.in');

  // System State
  const [backendStatus, setBackendStatus] = useState<'connected' | 'local_mode'>('connected');
  const [isSyncing, setIsSyncing] = useState(true);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.DASHBOARD);
  
  // Superuser Navigation State
  const [superuserTargetTenantId, setSuperuserTargetTenantId] = useState<string | null>(null);

  // Global State
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [hrTasks, setHrTasks] = useState<HRTask[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [itRequests, setItRequests] = useState<ITRequest[]>([]);
  const [itPolicies, setItPolicies] = useState<ITPolicy[]>([
    { id: 'p1', title: 'Hardware Policy', content: 'Standard issue is 1 laptop per employee. Assets must be returned upon exit.', lastUpdated: '2024-01-01' }
  ]);
  const [csSimulationTenantId, setCsSimulationTenantId] = useState<string>('agenra');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // --- Initial Data Load & Auto-Suspension Logic ---
  useEffect(() => {
    const init = async () => {
      setIsSyncing(true);
      try {
        const [fetchedTenants, fetchedUsers, fetchedAssets] = await Promise.all([
           api.getTenants(),
           api.getUsers(),
           api.getAssets('') // Fetch ALL assets initially to handle multi-tenancy in demo
        ]);
        
        // AUTOMATIC SERVICE SUSPENSION LOGIC
        // If billing is overdue, force suspend status.
        const processedTenants = fetchedTenants.map(t => {
          if (t.billing.status === 'overdue' && !t.isServiceSuspended) {
            return { ...t, isServiceSuspended: true };
          }
          return t;
        });

        setTenants(processedTenants);
        setUsers(fetchedUsers);
        setAssets(fetchedAssets);
        setBackendStatus('local_mode');
      } catch (e) {
        console.error("Initialization failed", e);
      } finally {
        setTimeout(() => setIsSyncing(false), 1500); // Artificial delay for polish
      }
    };
    init();
  }, []);

  // Reset session on domain switch
  const handleDomainChange = (newDomain: string) => {
    setCurrentDomain(newDomain);
    setCurrentUser(null);
    setActiveModule(ModuleType.DASHBOARD);
    setSuperuserTargetTenantId(null);
  };

  // --- Login Filtering Logic ---
  const availableUsersForLogin = users.filter(user => {
    if (currentDomain === 'admin.agenra.in') {
      // Allow SU role OR emails ending in @agenra.in
      return user.role === 'SUPERUSER' || user.email.endsWith('@agenra.in');
    }
    if (currentDomain === 'agenra.in') {
      return false; // Public site uses CandidateAuth
    }
    // Tenant domains
    const tenant = tenants.find(t => t.domain === currentDomain);
    return tenant && user.tenantId === tenant.id;
  });

  // --- Handlers (Keep existing functionality) ---
  const handleUpdateTenant = async (updatedTenant: Tenant) => {
    setTenants(prev => prev.map(t => t.id === updatedTenant.id ? updatedTenant : t));
    await api.updateTenant(updatedTenant.id, updatedTenant);
  };

  const handleCreateTenant = async (data: any) => {
    const newTenant = await api.createTenant(data);
    setTenants(prev => [...prev, newTenant]);
    
    const newAdmin: User = {
       id: `admin-${newTenant.id}`,
       name: data.adminName,
       email: data.adminEmail,
       role: 'TENANT_ADMIN',
       tenantId: newTenant.id,
       permissions: [ModuleType.DASHBOARD, ...newTenant.services],
       avatarColor: 'bg-indigo-600'
    };
    await api.createUser(newAdmin);
    setUsers(prev => [...prev, newAdmin]);
  };

  const handleDeleteTenant = async (tenantId: string) => {
    setTenants(prev => prev.filter(t => t.id !== tenantId));
    setUsers(prev => prev.filter(u => u.tenantId !== tenantId));
    await api.deleteTenant(tenantId);
  };

  const handleAddUser = async (user: Partial<User>) => {
    if (!currentUser || !currentUser.tenantId) return;
    const newUser = await api.createUser({ ...user, tenantId: currentUser.tenantId });
    setUsers(prev => [...prev, newUser]);

    // Create Audit Log
    const log: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      tenantId: currentUser.tenantId,
      action: 'CREATE_USER',
      performedBy: currentUser.name,
      targetResource: newUser.name,
      details: `Role: ${newUser.role}, Job Title: ${newUser.jobTitle}, Dept: ${newUser.department}`,
      timestamp: new Date().toLocaleString()
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    setUsers(prev => prev.filter(u => u.id !== userId));

    if (currentUser && userToDelete && currentUser.tenantId) {
      // Create Audit Log
      const log: AuditLog = {
        id: Math.random().toString(36).substr(2, 9),
        tenantId: currentUser.tenantId,
        action: 'DELETE_USER',
        performedBy: currentUser.name,
        targetResource: userToDelete.name,
        details: `Deleted user with email: ${userToDelete.email}`,
        timestamp: new Date().toLocaleString()
      };
      setAuditLogs(prev => [log, ...prev]);
    }
  };

  const handleAddJob = (job: Job) => setJobs(prev => [job, ...prev]);
  const handleUpdateCandidate = (updatedCandidate: Candidate) => setCandidates(prev => prev.map(c => c.id === updatedCandidate.id ? updatedCandidate : c));
  const handleAddCandidate = (candidate: Candidate) => {
    setCandidates(prev => [candidate, ...prev]);
    setJobs(prev => prev.map(j => j.id === candidate.jobId ? { ...j, applicants: j.applicants + 1 } : j));
  };

  const handleAddTask = (task: HRTask) => setHrTasks(prev => [task, ...prev]);
  const handleUpdateTask = (taskId: string, status: 'pending' | 'completed') => setHrTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
  const handleUpdateCandidateProgress = (candidateId: string, checklistId: string) => {
    setCandidates(prev => prev.map(c => {
      if (c.id === candidateId) {
        const updatedProgress = (c.onboardingProgress || []).map(item => 
          item.id === checklistId ? { ...item, completed: !item.completed } : item
        );
        return { ...c, onboardingProgress: updatedProgress };
      }
      return c;
    }));
  };

  const handleInitiateBgv = (candidate: Candidate) => {
    setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, bgvStatus: 'initiated' } : c));
    setTimeout(() => {
       setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, bgvStatus: 'verified' } : c));
    }, 5000);
  };

  const handleRequestItam = (candidate: Candidate) => {
    setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, itamStatus: 'requested' } : c));
    const newReq: ITRequest = {
       id: Math.random().toString(36).substr(2, 9),
       tenantId: candidate.tenantId,
       requesterId: currentUser?.id || 'hr-system',
       candidateId: candidate.id,
       type: 'PROVISION',
       description: `Provision Standard Kit for new hire: ${candidate.name}`,
       status: 'pending',
       date: new Date().toISOString().split('T')[0]
    };
    setItRequests(prev => [newReq, ...prev]);
  };

  const handleAddAsset = async (asset: Asset) => {
     const newAsset = await api.createAsset(asset);
     setAssets(prev => [newAsset, ...prev]);
  };
  const handleUpdateAsset = (asset: Asset) => setAssets(prev => prev.map(a => a.id === asset.id ? asset : a));
  const handleResolveRequest = (requestId: string, assetId?: string) => {
     setItRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'completed' } : r));
     const req = itRequests.find(r => r.id === requestId);
     if (req && req.candidateId) {
        setCandidates(prev => prev.map(c => c.id === req.candidateId ? { ...c, itamStatus: 'provisioned' } : c));
     }
  };
  const handleAddITPolicy = (policy: ITPolicy) => setItPolicies(prev => [...prev, policy]);

  const handleHireCandidate = async (candidate: Candidate) => {
    const newUser = await api.createUser({
      name: candidate.name,
      email: candidate.email || `employee.${candidate.name.split(' ')[0].toLowerCase()}@agenra.com`,
      role: 'SERVICE_USER',
      tenantId: candidate.tenantId,
      jobTitle: candidate.role,
      permissions: [ModuleType.DASHBOARD, ModuleType.HR_INTERNAL],
      department: 'Engineering'
    });
    setUsers(prev => [...prev, newUser]);
    setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, status: 'hired' } : c));
    
    // Log Hiring
    if (currentUser) {
      const log: AuditLog = {
        id: Math.random().toString(36).substr(2, 9),
        tenantId: candidate.tenantId,
        action: 'CREATE_USER',
        performedBy: currentUser.name,
        targetResource: newUser.name,
        details: `Hired from recruiting. Role: ${newUser.jobTitle}`,
        timestamp: new Date().toLocaleString()
      };
      setAuditLogs(prev => [log, ...prev]);
    }
  };

  const handleJobBoardApply = (jobId: string, profile: CandidateProfile, resumeText: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    const newCandidate: Candidate = {
       id: Math.random().toString(36).substr(2, 9),
       tenantId: job.tenantId,
       jobId: job.id,
       name: profile.name,
       email: profile.email,
       phone: profile.phone,
       role: job.title,
       experience: profile.experience || "Extracted",
       education: profile.education || "Extracted",
       resumeSummary: resumeText.slice(0, 200) + "...",
       status: 'applied',
       profile: profile
    };
    handleAddCandidate(newCandidate);
  };

  const handlePayBill = (tenantId: string) => {
    setTenants(prev => prev.map(t => {
      // Automatically resume services when bill is paid
      if (t.id === tenantId) return { 
        ...t, 
        billing: { ...t.billing, amountDue: 0, status: 'active' },
        isServiceSuspended: false 
      };
      return t;
    }));
  };

  const handleRequestServiceChange = (tenantId: string, service: ModuleType, action: 'add' | 'remove') => {
    const request: ServiceRequest = {
      id: Math.random().toString(36).substr(2, 9),
      tenantId,
      service,
      action,
      status: 'pending',
      date: new Date().toISOString().split('T')[0]
    };
    setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, serviceRequests: [...(t.serviceRequests || []), request] } : t));
  };

  const handleApproveServiceRequest = (request: ServiceRequest, approved: boolean) => {
    setTenants(prev => prev.map(t => {
      if (t.id === request.tenantId) {
        const updatedRequests = t.serviceRequests.map(r => r.id === request.id ? { ...r, status: approved ? 'approved' : 'rejected' } : r) as ServiceRequest[];
        let updatedServices = [...t.services];
        if (approved) {
           if (request.action === 'add' && !updatedServices.includes(request.service)) updatedServices.push(request.service);
           else if (request.action === 'remove') updatedServices = updatedServices.filter(s => s !== request.service);
        }
        return { ...t, serviceRequests: updatedRequests, services: updatedServices };
      }
      return t;
    }));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveModule(ModuleType.DASHBOARD);
    setSuperuserTargetTenantId(null);
  };

  // --- Superuser Navigation Helper ---
  const handleManageTenant = (tenantId: string) => {
    setSuperuserTargetTenantId(tenantId);
    setActiveModule(ModuleType.DASHBOARD);
  };

  // --- Filtering & Routing ---
  const getFilteredJobs = () => currentUser?.role === 'SUPERUSER' ? jobs : jobs.filter(j => j.tenantId === currentUser?.tenantId);
  const getFilteredCandidates = () => currentUser?.role === 'SUPERUSER' ? candidates : candidates.filter(c => c.tenantId === currentUser?.tenantId);
  const getFilteredUsers = () => currentUser?.role === 'SUPERUSER' ? users : users.filter(u => u.tenantId === currentUser?.tenantId);
  const getPreboardingCandidates = () => getFilteredCandidates().filter(c => c.status === 'offer_accepted' || c.status === 'onboarding_progress' || c.status === 'onboarding_completed');
  const getFilteredAuditLogs = () => currentUser?.role === 'SUPERUSER' ? auditLogs : auditLogs.filter(log => log.tenantId === currentUser?.tenantId);
  
  // NEW: Filter Assets to ensure multi-tenancy privacy
  const getFilteredAssets = () => currentUser?.role === 'SUPERUSER' ? assets : assets.filter(a => a.tenantId === currentUser?.tenantId);

  // --- Access Control Logic ---
  const canAccess = (module: ModuleType) => {
    if (!currentUser) return false;
    if (module === ModuleType.JOB_BOARD) return true; 

    // Access Logic with Suspension Check
    if (currentUser.permissions.includes(module)) {
      if (currentUser.role !== 'SUPERUSER' && currentUser.tenantId) {
         // Check Suspension Status
         const userTenant = tenants.find(t => t.id === currentUser.tenantId);
         const isSuspended = userTenant?.isServiceSuspended;
         
         // If Suspended, BLOCK all functional modules except Billing and Dashboard
         if (isSuspended && module !== ModuleType.BILLING && module !== ModuleType.DASHBOARD && module !== ModuleType.USER_MANAGEMENT) {
            return false;
         }

         if (module === ModuleType.BILLING) return true;
         if (module === ModuleType.USER_MANAGEMENT) return true;
         
         if (userTenant && !userTenant.services.includes(module)) return false; 
      }
      return true;
    }
    return false;
  };

  // --- Loading Screen ---
  if (isSyncing) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white space-y-6">
           <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 animate-pulse blur-lg absolute"></div>
              <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-700 relative flex items-center justify-center z-10">
                 <span className="text-3xl font-bold bg-gradient-to-tr from-blue-400 to-purple-400 bg-clip-text text-transparent">A</span>
              </div>
           </div>
           <div className="flex flex-col items-center gap-2">
              <h1 className="text-xl font-bold tracking-widest">AGENRA CORE</h1>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                 <Loader2 className="animate-spin" size={12} /> INITIALIZING SYSTEM MODULES
              </div>
           </div>
           <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 animate-progress-indeterminate"></div>
           </div>
        </div>
     );
  }

  // Check suspension status for UI Banner
  const currentTenant = tenants.find(t => t.id === currentUser?.tenantId);
  const isSuspended = currentTenant?.isServiceSuspended;

  // --- Main Render Logic ---
  const renderContent = () => {
    // 1. Superuser Viewing a Service (Drill-down)
    if (currentUser?.role === 'SUPERUSER' && activeModule !== ModuleType.DASHBOARD) {
       const serviceModules = [ModuleType.RECRUITING, ModuleType.FINANCE, ModuleType.MARKET_RESEARCH, ModuleType.HR_INTERNAL, ModuleType.BILLING, ModuleType.ITAM];
       
       if (serviceModules.includes(activeModule)) {
         return <SuperuserServiceOverview 
                  service={activeModule} 
                  tenants={tenants} 
                  users={users} 
                  jobs={jobs} 
                  tickets={tenants.flatMap(t => t.supportTickets)} 
                  onManageTenant={handleManageTenant}
                />;
       }
       if (activeModule === ModuleType.CUSTOMER_SERVICE) {
          // Special view for CS which has full UI for Superuser too
          return <CustomerService 
            currentUser={currentUser} 
            tenants={tenants} 
            onUpdateTenant={handleUpdateTenant}
            simulationTenantId={csSimulationTenantId} 
            setSimulationTenantId={setCsSimulationTenantId} 
          />;
       }
       if (activeModule === ModuleType.USER_MANAGEMENT) {
         return <UserManagement 
            currentUser={currentUser} 
            tenantUsers={users} 
            tenantServices={[]} 
            onAddUser={handleAddUser} 
            onDeleteUser={handleDeleteUser} 
            auditLogs={auditLogs}
         />;
       }
    }

    // 2. Tenant User Viewing a Service (Normal Functionality)
    switch (activeModule) {
      case ModuleType.CUSTOMER_SERVICE:
        return <CustomerService 
          currentUser={currentUser} 
          tenants={tenants} 
          onUpdateTenant={handleUpdateTenant}
          simulationTenantId={csSimulationTenantId} 
          setSimulationTenantId={setCsSimulationTenantId} 
        />;
      case ModuleType.RECRUITING:
         return <Recruiting currentUser={currentUser} tenants={tenants} jobs={getFilteredJobs()} candidates={getFilteredCandidates()} onAddJob={handleAddJob} onUpdateCandidate={handleUpdateCandidate} onAddCandidate={handleAddCandidate} />;
      case ModuleType.MARKET_RESEARCH:
        return <MarketResearch />;
      case ModuleType.FINANCE:
        return <Finance />;
      case ModuleType.HR_INTERNAL:
        return <HRInternal 
          currentUser={currentUser} 
          users={getFilteredUsers()} 
          hrTasks={hrTasks} 
          preboardingCandidates={getPreboardingCandidates()} 
          onAddTask={handleAddTask} 
          onUpdateTask={handleUpdateTask} 
          onHireCandidate={handleHireCandidate} 
          onUpdateCandidateProgress={handleUpdateCandidateProgress} 
          onInitiateBgv={handleInitiateBgv}
          onRequestItam={handleRequestItam}
        />;
      case ModuleType.USER_MANAGEMENT:
        return <UserManagement 
          currentUser={currentUser} 
          tenantUsers={getFilteredUsers()} 
          tenantServices={tenants.find(t => t.id === currentUser.tenantId)?.services || []} 
          onAddUser={handleAddUser} 
          onDeleteUser={handleDeleteUser} 
          auditLogs={getFilteredAuditLogs()}
        />;
      case ModuleType.BILLING:
        if (currentUser.role === 'SUPERUSER') return <GlobalBilling tenants={tenants} />; // Legacy catch, though routing might handle above
        return <Billing tenant={tenants.find(t => t.id === currentUser.tenantId)!} onPayBill={handlePayBill} onRequestServiceChange={handleRequestServiceChange} />;
      case ModuleType.ITAM:
         return <ITAM 
           assets={getFilteredAssets()} 
           requests={itRequests} 
           policies={itPolicies} 
           onAddAsset={handleAddAsset} 
           onUpdateAsset={handleUpdateAsset} 
           onResolveRequest={handleResolveRequest}
           onAddPolicy={handleAddITPolicy}
         />;
      default:
        if (currentUser.role === 'SUPERUSER') return (
          <SuperuserDashboard 
            tenants={tenants} 
            users={users}
            jobs={jobs}
            onUpdateTenant={handleUpdateTenant} 
            onApproveRequest={handleApproveServiceRequest} 
            onCreateTenant={handleCreateTenant} 
            onDeleteTenant={handleDeleteTenant} 
            initialSelectedTenantId={superuserTargetTenantId}
          />
        );
        return (
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
               <h1 className="text-4xl font-extrabold text-white mb-4">Welcome back, <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{currentUser.name.split(' ')[0]}</span></h1>
               <div className="flex items-center gap-3 text-slate-400">
                 <span className="flex items-center gap-2 px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-sm border border-slate-700"><Building2 size={14} /> {tenants.find(t => t.id === currentUser.tenantId)?.name}</span>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {canAccess(ModuleType.CUSTOMER_SERVICE) && <DashboardCard title="Customer Service" icon={Headset} color="blue" onClick={() => setActiveModule(ModuleType.CUSTOMER_SERVICE)} />}
              {canAccess(ModuleType.RECRUITING) && <DashboardCard title="Recruiting" icon={Users} color="green" onClick={() => setActiveModule(ModuleType.RECRUITING)} />}
              {canAccess(ModuleType.FINANCE) && <DashboardCard title="Finance" icon={PieChart} color="cyan" onClick={() => setActiveModule(ModuleType.FINANCE)} />}
              {canAccess(ModuleType.MARKET_RESEARCH) && <DashboardCard title="Market Research" icon={Search} color="purple" onClick={() => setActiveModule(ModuleType.MARKET_RESEARCH)} />}
              {canAccess(ModuleType.HR_INTERNAL) && <DashboardCard title="Internal HR" icon={Briefcase} color="orange" onClick={() => setActiveModule(ModuleType.HR_INTERNAL)} />}
              {canAccess(ModuleType.ITAM) && <DashboardCard title="IT Asset Mgmt" icon={Monitor} color="teal" onClick={() => setActiveModule(ModuleType.ITAM)} />}
              {canAccess(ModuleType.USER_MANAGEMENT) && <DashboardCard title="Team Management" icon={Users} color="indigo" onClick={() => setActiveModule(ModuleType.USER_MANAGEMENT)} />}
              {canAccess(ModuleType.BILLING) && <DashboardCard title="Billing & Services" icon={CreditCard} color="emerald" onClick={() => setActiveModule(ModuleType.BILLING)} />}
            </div>
          </div>
        );
    }
  };

  // --- RENDER APP ---
  if (currentDomain === 'agenra.in' && !currentUser) {
     return (
        <>
          <BrowserBar currentUrl={currentDomain} onChangeUrl={handleDomainChange} tenants={tenants} />
          <div className="bg-slate-900 min-h-screen relative">
            <JobBoard jobs={jobs} onApply={handleJobBoardApply} />
          </div>
        </>
     );
  }

  if (!currentUser) {
    const isSuperuserDomain = currentDomain === 'admin.agenra.in';
    const activeTenant = tenants.find(t => t.domain === currentDomain);

    return (
      <div className="flex flex-col h-screen bg-slate-950">
        <BrowserBar currentUrl={currentDomain} onChangeUrl={handleDomainChange} tenants={tenants} />
        
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
          {isSuperuserDomain ? (
             <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-yellow-600/20 rounded-full blur-[120px]"></div>
          ) : (
             <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]"></div>
          )}

          <div className="text-center mb-12 relative z-10">
            <div className="inline-block p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl mb-6">
              <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-xl font-bold ${isSuperuserDomain ? 'bg-yellow-500' : 'bg-blue-600'}`}>A</div>
                  <h1 className="text-4xl font-extrabold text-white tracking-tight">{isSuperuserDomain ? 'AGENRA CORE' : activeTenant ? activeTenant.name.toUpperCase() : 'AGENRA'}</h1>
              </div>
            </div>
            <p className="text-slate-400 text-lg uppercase tracking-widest text-xs font-bold">
               {isSuperuserDomain ? 'Superuser Administrative Console' : 'Enterprise Workspace Portal'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full relative z-10">
            {availableUsersForLogin.length > 0 ? (
               availableUsersForLogin.map(user => (
                  <button
                  key={user.id}
                  onClick={() => { setCurrentUser(user); setActiveModule(ModuleType.DASHBOARD); }}
                  className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:bg-slate-800 hover:border-slate-600 transition-all text-left group relative overflow-hidden"
                  >
                  <div className={`absolute top-0 left-0 w-1 h-full ${user.role === 'SUPERUSER' ? 'bg-yellow-500' : 'bg-blue-500'} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                  <div className="flex items-start justify-between mb-4">
                     <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${user.avatarColor || 'bg-slate-700'}`}>{user.name.charAt(0)}</div>
                     {user.role === 'SUPERUSER' && <Shield size={20} className="text-yellow-500" />}
                     {user.role === 'TENANT_ADMIN' && <Building2 size={20} className="text-blue-400" />}
                     {user.role === 'SERVICE_USER' && <UserIcon size={20} className="text-slate-500" />}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{user.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                     <p className="text-sm text-slate-400">{user.jobTitle || 'User'}</p>
                  </div>
                  </button>
               ))
            ) : (
               <div className="col-span-full text-center text-slate-500 italic p-8 border border-dashed border-slate-800 rounded-2xl">
                  No users found for this domain ({currentDomain}). Switch domains using the bar above.
               </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Authenticated Layout ---
  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-200 overflow-hidden relative">
      <BrowserBar currentUrl={currentDomain} onChangeUrl={handleDomainChange} tenants={tenants} />
      
      {/* SERVICE SUSPENSION BANNER */}
      {isSuspended && currentUser.role !== 'SUPERUSER' && (
        <div className="bg-red-600 text-white px-4 py-2 text-center text-sm font-bold flex items-center justify-center gap-2 animate-pulse z-50">
          <AlertTriangle size={16} />
          SERVICES PAUSED: Account is overdue. Please settle invoice in Billing to resume access.
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
         <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
         <div className="p-6 border-b border-slate-800">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
               <div className={`w-6 h-6 rounded-md flex items-center justify-center text-white text-xs ${currentUser.role === 'SUPERUSER' ? 'bg-yellow-500' : 'bg-blue-600'}`}>A</div>
               {currentUser.role === 'SUPERUSER' ? 'CORE' : 'WORKSPACE'}
            </h1>
         </div>
         <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <SidebarItem active={activeModule === ModuleType.DASHBOARD} onClick={() => setActiveModule(ModuleType.DASHBOARD)} icon={LayoutDashboard} label="Dashboard" />
            
            <div className="pt-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider pl-3">Apps</div>
            {canAccess(ModuleType.CUSTOMER_SERVICE) && <SidebarItem active={activeModule === ModuleType.CUSTOMER_SERVICE} onClick={() => setActiveModule(ModuleType.CUSTOMER_SERVICE)} icon={Headset} label="Customer Service" />}
            {canAccess(ModuleType.RECRUITING) && <SidebarItem active={activeModule === ModuleType.RECRUITING} onClick={() => setActiveModule(ModuleType.RECRUITING)} icon={Users} label="Recruiting" />}
            {canAccess(ModuleType.HR_INTERNAL) && <SidebarItem active={activeModule === ModuleType.HR_INTERNAL} onClick={() => setActiveModule(ModuleType.HR_INTERNAL)} icon={Briefcase} label="Internal HR" />}
            {canAccess(ModuleType.FINANCE) && <SidebarItem active={activeModule === ModuleType.FINANCE} onClick={() => setActiveModule(ModuleType.FINANCE)} icon={PieChart} label="Finance" />}
            {canAccess(ModuleType.MARKET_RESEARCH) && <SidebarItem active={activeModule === ModuleType.MARKET_RESEARCH} onClick={() => setActiveModule(ModuleType.MARKET_RESEARCH)} icon={Search} label="Market Research" />}
            {canAccess(ModuleType.ITAM) && <SidebarItem active={activeModule === ModuleType.ITAM} onClick={() => setActiveModule(ModuleType.ITAM)} icon={Monitor} label="IT Assets" />}
            <div className="pt-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider pl-3">Account</div>
            {canAccess(ModuleType.USER_MANAGEMENT) && <SidebarItem active={activeModule === ModuleType.USER_MANAGEMENT} onClick={() => setActiveModule(ModuleType.USER_MANAGEMENT)} icon={Users} label="Team Management" />}
            {canAccess(ModuleType.BILLING) && <SidebarItem active={activeModule === ModuleType.BILLING} onClick={() => setActiveModule(ModuleType.BILLING)} icon={CreditCard} label="Billing & Services" />}
         </nav>
         
         <div className="p-4 border-t border-slate-800">
               <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${currentUser.avatarColor}`}>{currentUser.name.charAt(0)}</div>
                  <div className="overflow-hidden">
                  <div className="text-sm font-bold text-white truncate">{currentUser.name}</div>
                  <div className="text-xs text-slate-500 truncate">{currentUser.email}</div>
                  </div>
               </div>
               <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-sm"><LogOut size={14} /> Sign Out</button>
         </div>
         </div>
         <main className="flex-1 overflow-auto bg-slate-900 relative">
            <div className="p-8 pb-20">{renderContent()}</div>
            {/* Global Chatbot */}
            <GlobalChatbot 
              activeModule={activeModule} 
              currentUser={currentUser}
              currentTenant={tenants.find(t => t.id === currentUser.tenantId)}
              onNavigate={(module) => setActiveModule(module)} 
            />
         </main>
      </div>
    </div>
  );
}

const SidebarItem = ({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Icon size={18} /><span className="font-medium text-sm">{label}</span></button>
);

const DashboardCard = ({ title, icon: Icon, color, onClick }: { title: string, icon: any, color: string, onClick: () => void }) => {
  const colorClasses: Record<string, string> = { 
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:border-blue-500', 
    green: 'bg-green-500/10 text-green-400 border-green-500/20 hover:border-green-500', 
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:border-purple-500', 
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:border-cyan-500', 
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:border-orange-500', 
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:border-emerald-500', 
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:border-indigo-500', 
    teal: 'bg-teal-500/10 text-teal-400 border-teal-500/20 hover:border-teal-500' 
  };
  return <button onClick={onClick} className={`p-6 rounded-2xl border transition-all text-left hover:-translate-y-1 hover:shadow-xl group ${colorClasses[color] || colorClasses.blue}`}><div className="mb-4 p-3 rounded-xl bg-slate-900/50 w-fit group-hover:scale-110 transition-transform"><Icon size={32} /></div><h3 className="text-xl font-bold mb-1">{title}</h3><p className="text-sm opacity-70">Click to access module</p></button>;
};

export default App;
