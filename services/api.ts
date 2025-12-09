
import { Tenant, User, Job, Candidate, ITRequest, Asset, HRTask, ModuleType } from '../types';

// ==========================================
// CONFIGURATION
// ==========================================
// Toggle this to FALSE to connect to your real Python/MSSQL Backend
const USE_MOCK = true; 

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

// ==========================================
// MOCK DATA INITIALIZATION
// ==========================================
const MOCK_DELAY = 600; 

const INITIAL_TENANTS: Tenant[] = [
  { 
    id: 'tenant-A', 
    name: 'TechFlow Solutions India',
    domain: 'techflow.agenra.in',
    adminEmail: 'vikram@techflow.com',
    services: [ModuleType.CUSTOMER_SERVICE, ModuleType.RECRUITING, ModuleType.HR_INTERNAL, ModuleType.BILLING, ModuleType.USER_MANAGEMENT, ModuleType.ITAM],
    billing: {
      accountNumber: 'TF-2024-889',
      status: 'active',
      amountDue: 245000.00,
      nextBillingDate: '2024-04-01'
    },
    supportTickets: [
      { 
        id: 'TKT-2024-101', 
        tenantId: 'tenant-A',
        subject: 'Integration issue with HR module', 
        description: 'User reports that the "Sync to Payroll" button is unresponsive. Checked logs, seems to be an API timeout with the legacy system.',
        status: 'open', 
        priority: 'medium',
        assignedDept: 'Technical',
        createdAt: '2024-03-18 10:30 AM',
        createdBy: 'Neha (HR Manager)'
      }
    ],
    serviceRequests: []
  },
  { 
    id: 'tenant-B', 
    name: 'Global Finance Corp',
    domain: 'globalfinance.agenra.in',
    adminEmail: 'rahul@globalfinance.com',
    services: [ModuleType.FINANCE, ModuleType.RECRUITING, ModuleType.BILLING, ModuleType.USER_MANAGEMENT],
    billing: {
      accountNumber: 'GF-2024-112',
      status: 'overdue',
      amountDue: 512050.50,
      nextBillingDate: '2024-03-25'
    },
    supportTickets: [
      { 
        id: 'TKT-2024-102', 
        tenantId: 'tenant-B',
        subject: 'Billing dashboard not loading', 
        description: 'Critical issue. Admin cannot access the invoice page. Error 503 displayed. Suspect billing service downtime for this shard.',
        status: 'escalated', 
        priority: 'high',
        assignedDept: 'Billing',
        createdAt: '2024-03-19 08:15 AM',
        createdBy: 'Rahul (Admin)'
      },
      { 
        id: 'TKT-2024-103', 
        tenantId: 'tenant-B',
        subject: 'Add new user request', 
        description: 'Request to increase user license cap by 5 seats for the Marketing department.',
        status: 'open', 
        priority: 'low',
        assignedDept: 'Account',
        createdAt: '2024-03-20 02:00 PM',
        createdBy: 'Rahul (Admin)'
      }
    ],
    serviceRequests: []
  }
];

const INITIAL_USERS: User[] = [
  // --- AGENRA INTERNAL TEAM (SUPERUSERS) ---
  {
    id: 'superuser-zeus',
    name: 'Zeus (Super Admin)',
    email: 'zeus@agenra.in',
    role: 'SUPERUSER',
    jobTitle: 'System Architect',
    permissions: [ModuleType.DASHBOARD, ModuleType.CUSTOMER_SERVICE, ModuleType.RECRUITING, ModuleType.FINANCE, ModuleType.MARKET_RESEARCH, ModuleType.HR_INTERNAL, ModuleType.BILLING, ModuleType.ITAM, ModuleType.USER_MANAGEMENT],
    avatarColor: 'bg-gradient-to-tr from-yellow-400 to-orange-500'
  },
  {
    id: 'spec-tech',
    name: 'Athena (Tech Specialist)',
    email: 'athena@agenra.in',
    role: 'SUPERUSER',
    jobTitle: 'Technical Support Lead',
    permissions: [ModuleType.DASHBOARD, ModuleType.CUSTOMER_SERVICE, ModuleType.ITAM],
    avatarColor: 'bg-cyan-600'
  },
  {
    id: 'spec-billing',
    name: 'Hermes (Billing Specialist)',
    email: 'hermes@agenra.in',
    role: 'SUPERUSER',
    jobTitle: 'Billing Operations',
    permissions: [ModuleType.DASHBOARD, ModuleType.BILLING, ModuleType.FINANCE],
    avatarColor: 'bg-green-600'
  },
  {
    id: 'spec-hr',
    name: 'Hera (HR Specialist)',
    email: 'hera@agenra.in',
    role: 'SUPERUSER',
    jobTitle: 'HR Success Manager',
    permissions: [ModuleType.DASHBOARD, ModuleType.HR_INTERNAL, ModuleType.RECRUITING],
    avatarColor: 'bg-purple-600'
  },

  // --- TENANT A USERS ---
  {
    id: 'admin-a',
    name: 'Vikram (Admin)',
    email: 'vikram@techflow.com',
    role: 'TENANT_ADMIN',
    jobTitle: 'Operations Director',
    tenantId: 'tenant-A',
    permissions: [ModuleType.DASHBOARD, ModuleType.CUSTOMER_SERVICE, ModuleType.RECRUITING, ModuleType.FINANCE, ModuleType.HR_INTERNAL, ModuleType.BILLING, ModuleType.USER_MANAGEMENT, ModuleType.ITAM],
    avatarColor: 'bg-blue-600'
  },
  {
    id: 'hr-manager',
    name: 'Neha (HR Manager)',
    email: 'neha@techflow.com',
    role: 'SERVICE_USER',
    jobTitle: 'HR Manager',
    tenantId: 'tenant-A',
    department: 'HR',
    permissions: [ModuleType.DASHBOARD, ModuleType.HR_INTERNAL, ModuleType.RECRUITING, ModuleType.ITAM],
    avatarColor: 'bg-pink-600'
  },
  {
    id: 'hr-payroll',
    name: 'Amit (Payroll HR)',
    email: 'amit@techflow.com',
    role: 'SERVICE_USER',
    jobTitle: 'Payroll Specialist',
    tenantId: 'tenant-A',
    department: 'HR',
    permissions: [ModuleType.DASHBOARD, ModuleType.HR_INTERNAL],
    avatarColor: 'bg-emerald-600'
  },
  {
    id: 'emp-1',
    name: 'Aditya Raj',
    email: 'aditya@techflow.com',
    role: 'SERVICE_USER',
    jobTitle: 'Senior Developer',
    tenantId: 'tenant-A',
    department: 'Engineering',
    permissions: [ModuleType.DASHBOARD, ModuleType.HR_INTERNAL],
    avatarColor: 'bg-slate-600'
  }
];

const INITIAL_ASSETS: Asset[] = [
  { id: 'a1', tenantId: 'tenant-A', name: 'MacBook Pro 14"', serialNumber: 'C02HG5', type: 'HARDWARE', status: 'ASSIGNED', location: 'Bengaluru Office', purchaseDate: '2023-01-10', value: 169000, assignedTo: 'Aditya Raj' },
  { id: 'a2', tenantId: 'tenant-A', name: 'Dell Monitor', serialNumber: 'DL-999', type: 'PERIPHERAL', status: 'AVAILABLE', location: 'HQ', purchaseDate: '2023-02-01', value: 25000 }
];

// --- LOCAL STORAGE HELPERS ---
const DB_KEYS = {
  TENANTS: 'agenra_tenants',
  USERS: 'agenra_users',
  JOBS: 'agenra_jobs',
  CANDIDATES: 'agenra_candidates',
  ASSETS: 'agenra_assets',
  HR_TASKS: 'agenra_hr_tasks'
};

const getStorage = <T>(key: string, initial: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(stored);
};

const setStorage = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- HTTP CLIENT HELPER ---
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options?.headers }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown Error' }));
    throw new Error(errorData.detail || `API Error: ${response.statusText}`);
  }

  return response.json();
}

// ==========================================
// UNIFIED API CLIENT
// ==========================================

export const api = {
  // --- System ---
  checkHealth: async (): Promise<boolean> => {
    if (USE_MOCK) return new Promise(resolve => setTimeout(() => resolve(true), 500));
    try {
      await fetchApi('/health');
      return true;
    } catch {
      return false;
    }
  },

  // --- Tenants ---
  getTenants: async (): Promise<Tenant[]> => {
    if (USE_MOCK) {
      return new Promise(resolve => {
        setTimeout(() => resolve(getStorage(DB_KEYS.TENANTS, INITIAL_TENANTS)), MOCK_DELAY);
      });
    }
    return fetchApi<Tenant[]>('/tenants');
  },

  createTenant: async (data: any): Promise<Tenant> => {
    if (USE_MOCK) {
      return new Promise(resolve => {
        setTimeout(() => {
          const tenants = getStorage<Tenant[]>(DB_KEYS.TENANTS, INITIAL_TENANTS);
          const newId = `tenant-${Math.random().toString(36).substr(2, 5)}`;
          const newTenant: Tenant = {
            id: newId,
            name: data.name,
            domain: data.domain,
            adminEmail: data.admin_email || data.adminEmail,
            services: data.services,
            billing: { accountNumber: `NEW-${Date.now()}`, status: 'active', amountDue: 0, nextBillingDate: new Date().toISOString().split('T')[0] },
            supportTickets: [],
            serviceRequests: []
          };
          tenants.push(newTenant);
          setStorage(DB_KEYS.TENANTS, tenants);
          resolve(newTenant);
        }, MOCK_DELAY);
      });
    }
    return fetchApi<Tenant>('/tenants', { method: 'POST', body: JSON.stringify(data) });
  },

  updateTenant: async (id: string, data: Partial<Tenant>): Promise<Tenant> => {
    if (USE_MOCK) {
      return new Promise(resolve => {
        const tenants = getStorage<Tenant[]>(DB_KEYS.TENANTS, INITIAL_TENANTS);
        const idx = tenants.findIndex(t => t.id === id);
        if (idx !== -1) {
          tenants[idx] = { ...tenants[idx], ...data };
          setStorage(DB_KEYS.TENANTS, tenants);
          resolve(tenants[idx]);
        } else throw new Error("Tenant not found");
      });
    }
    return fetchApi<Tenant>(`/tenants/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  deleteTenant: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      return new Promise(resolve => {
        const tenants = getStorage<Tenant[]>(DB_KEYS.TENANTS, INITIAL_TENANTS);
        setStorage(DB_KEYS.TENANTS, tenants.filter(t => t.id !== id));
        resolve();
      });
    }
    return fetchApi<void>(`/tenants/${id}`, { method: 'DELETE' });
  },

  // --- Users ---
  getUsers: async (tenantId?: string): Promise<User[]> => {
    if (USE_MOCK) {
      return new Promise(resolve => {
        setTimeout(() => {
          let users = getStorage<User[]>(DB_KEYS.USERS, INITIAL_USERS);
          if (tenantId) users = users.filter(u => u.tenantId === tenantId);
          resolve(users);
        }, MOCK_DELAY);
      });
    }
    const query = tenantId ? `?tenant_id=${tenantId}` : '';
    return fetchApi<User[]>(`/users${query}`);
  },

  createUser: async (user: Partial<User>): Promise<User> => {
    if (USE_MOCK) {
      return new Promise(resolve => {
        const users = getStorage<User[]>(DB_KEYS.USERS, INITIAL_USERS);
        const newUser = { ...user, id: `user-${Date.now()}` } as User;
        users.push(newUser);
        setStorage(DB_KEYS.USERS, users);
        resolve(newUser);
      });
    }
    return fetchApi<User>('/users', { method: 'POST', body: JSON.stringify(user) });
  },

  // --- ITAM (Assets) ---
  getAssets: async (tenantId: string): Promise<Asset[]> => {
    if (USE_MOCK) {
      return new Promise(resolve => {
        const assets = getStorage<Asset[]>(DB_KEYS.ASSETS, INITIAL_ASSETS);
        resolve(assets.filter(a => a.tenantId === tenantId));
      });
    }
    return fetchApi<Asset[]>(`/itam/assets?tenant_id=${tenantId}`);
  },

  createAsset: async (asset: Partial<Asset>): Promise<Asset> => {
    if (USE_MOCK) {
      return new Promise(resolve => {
        const assets = getStorage<Asset[]>(DB_KEYS.ASSETS, INITIAL_ASSETS);
        const newAsset = { ...asset, id: `asset-${Date.now()}` } as Asset;
        assets.push(newAsset);
        setStorage(DB_KEYS.ASSETS, assets);
        resolve(newAsset);
      });
    }
    return fetchApi<Asset>('/itam/assets', { method: 'POST', body: JSON.stringify(asset) });
  },

  // --- Payments (New) ---
  processMockPayment: async (amount: number, type: 'credit' | 'subscription'): Promise<{ success: boolean, transactionId: string }> => {
    return new Promise(resolve => {
      setTimeout(() => {
        // Mock success
        resolve({ 
          success: true, 
          transactionId: `txn_${Math.random().toString(36).substr(2, 9)}` 
        });
      }, 2000); // Simulate network delay
    });
  }
};
