
import { Tool } from "@google/genai";

export enum ModuleType {
  DASHBOARD = 'DASHBOARD',
  CUSTOMER_SERVICE = 'CUSTOMER_SERVICE',
  RECRUITING = 'RECRUITING',
  FINANCE = 'FINANCE',
  MARKET_RESEARCH = 'MARKET_RESEARCH',
  HR_INTERNAL = 'HR_INTERNAL',
  JOB_BOARD = 'JOB_BOARD', // Public view
  BILLING = 'BILLING',
  USER_MANAGEMENT = 'USER_MANAGEMENT',
  ITAM = 'ITAM'
}

export const DEPARTMENTS = {
  "Engineering": ["Senior Developer", "Junior Developer", "QA Engineer", "Engineering Manager", "CTO"],
  "Product": ["Product Manager", "Product Designer", "Head of Product", "CPO"],
  "Sales": ["Sales Representative", "Account Executive", "Sales Manager", "VP of Sales"],
  "HR": ["HR Manager", "Payroll Specialist", "Onboarding Specialist", "Recruitment Specialist"],
  "Marketing": ["Marketing Manager", "Content Writer", "SEO Specialist"],
  "Executive": ["CEO", "CFO", "COO"]
} as const;

export type Department = keyof typeof DEPARTMENTS;

export type Role = 'SUPERUSER' | 'TENANT_ADMIN' | 'SERVICE_USER';

export interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  period: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Yearly';
  assignedBy: string; // User ID
  targetDepartment?: string;
  minSeniority?: 'Junior' | 'Senior' | 'Manager' | 'Executive';
}

export interface SupportTicket {
  id: string;
  tenantId: string;
  subject: string;
  description: string; // AI generated description
  status: 'open' | 'in_progress' | 'resolved' | 'pending' | 'escalated';
  priority: 'high' | 'medium' | 'low';
  assignedDept: 'Technical' | 'Billing' | 'HR' | 'Account' | 'General'; // AI Assigned
  createdAt: string;
  createdBy: string; // User or Agent
}

export interface BillingInfo {
  accountNumber: string;
  status: 'active' | 'overdue' | 'suspended';
  nextBillingDate: string;
  amountDue: number;
}

export interface ServiceRequest {
  id: string;
  tenantId: string;
  service: ModuleType;
  action: 'add' | 'remove';
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

export interface Tenant {
  id: string;
  name: string;
  domain: string; // e.g. techflow.agenra.in
  adminEmail: string;
  services: ModuleType[];
  billing: BillingInfo;
  supportTickets: SupportTicket[];
  serviceRequests: ServiceRequest[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  jobTitle?: string; // Specific role name
  department?: string; // New field for Org structure
  tenantId?: string; // Optional for Superuser (or acts as 'system')
  permissions: ModuleType[]; // Whitelist of accessible modules
  avatarColor?: string;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  action: 'CREATE_USER' | 'DELETE_USER' | 'UPDATE_USER' | 'ACCESS_CHANGE';
  performedBy: string; // Name of the admin who performed the action
  targetResource: string; // Name of the affected user/resource
  details: string;
  timestamp: string;
}

export interface HRTask {
  id: string;
  title: string;
  description: string;
  assignedBy: string; // User ID
  assignedTo: string; // User ID (Specialist)
  targetEmployeeId: string; // User ID (Subject of task)
  status: 'pending' | 'completed';
  type: 'payroll' | 'onboarding' | 'recruiting' | 'general';
  dueDate: string;
}

export interface AgentStatus {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'offline';
  type: 'voice' | 'text';
}

export interface SearchResult {
  title: string;
  uri: string;
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

// --- Recruiting & Job Platform Types ---

export interface CandidateEvaluation {
  score: number;
  reasoning: string;
  fit: 'High' | 'Medium' | 'Low';
  keySkills: string[];
}

export interface Job {
  id: string;
  tenantId: string;
  title: string;
  department: string;
  location: string;
  description: string;
  postedDate: string;
  applicants: number;
}

export interface CandidateProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string; // Base64 or URL
  tagline?: string;
  bio?: string;
  lookingForRole?: string;
  presentRole?: string;
  presentOrg?: string;
  resumeText: string;
  resumeFileName?: string; // For UI display
  experience: string;
  education: string;
  resumeSummary: string;
  // Payment & Subscription
  subscriptionTier?: 'free' | 'premium';
  credits?: number; // For pay-per-use
  subscriptionExpiry?: string;
}

export interface OfferDetails {
  salary: string;
  joiningDate: string;
  variablePay: string;
  notes: string;
  draftedBy: string; // User ID (Specialist)
  approvedBy?: string; // User ID (Admin)
}

export interface OnboardingChecklist {
  id: string;
  label: string;
  completed: boolean;
}

export interface Candidate {
  id: string;
  jobId: string;
  tenantId: string;
  name: string;
  role: string; // Job Title
  experience: string;
  education: string;
  resumeSummary: string;
  // Updated status flow
  status: 
    | 'applied' 
    | 'evaluated' 
    | 'shortlisted' // AI Interview happens here
    | 'team_interview' // Team Lead Round
    | 'hr_round' // Negotiation Round
    | 'offer_pending' // Specialist drafted, waiting Admin approval
    | 'offer_sent' // Admin approved
    | 'offer_accepted' // Candidate accepted, ready for Pre-boarding
    | 'onboarding_progress' // In HR Internal module
    | 'onboarding_completed' // Ready to hire
    | 'hired' // Converted to User
    | 'rejected'
    | 'interviewing'; // Deprecated but kept for backward compat
    
  evaluation?: CandidateEvaluation;
  email?: string;
  phone?: string;
  profile?: CandidateProfile; // Full linked profile
  offerDetails?: OfferDetails;
  onboardingProgress?: OnboardingChecklist[];
  bgvStatus?: 'pending' | 'initiated' | 'verified' | 'failed';
  itamStatus?: 'pending' | 'requested' | 'provisioned';
}

// --- ITAM TYPES ---

export type AssetStatus = 'AVAILABLE' | 'ASSIGNED' | 'MAINTENANCE' | 'RETIRED';
export type AssetType = 'HARDWARE' | 'SOFTWARE' | 'PERIPHERAL';

export interface Asset {
  id: string;
  tenantId: string;
  name: string; // e.g. MacBook Pro M3
  serialNumber: string;
  type: AssetType;
  status: AssetStatus;
  assignedTo?: string; // User ID or Candidate Name if pre-provisioned
  location: string;
  purchaseDate: string;
  value: number;
}

export interface ITPolicy {
  id: string;
  title: string;
  content: string;
  lastUpdated: string;
}

export interface ITRequest {
  id: string;
  tenantId: string;
  requesterId: string; // HR Manager or User
  candidateId?: string; // If for new hire
  type: 'PROVISION' | 'RETRIEVAL' | 'REPAIR';
  description: string; // e.g. "Laptop for New Hire John Doe"
  status: 'pending' | 'in_progress' | 'completed';
  date: string;
}
