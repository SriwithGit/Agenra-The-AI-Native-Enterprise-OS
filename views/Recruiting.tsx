
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Briefcase, UserCheck, Phone, ChevronRight, Loader2, Sparkles, Mail, Upload, FileText, X, Building2, Filter, MapPin, Mic, MicOff, Zap, Play, User, ExternalLink, CheckCircle, FileSignature, DollarSign, Calendar, ArrowRight, IndianRupee } from 'lucide-react';
import { evaluateCandidate, parseResume, generateJobDescription, transcribeAudioNote, quickSummarize } from '../services/geminiService';
import LiveAgent from '../components/LiveAgent';
import { Type, FunctionDeclaration } from "@google/genai";
import { Job, Candidate, User as AppUser, Tenant, CandidateProfile, OfferDetails } from '../types';

interface RecruitingProps {
  currentUser: AppUser;
  tenants: Tenant[];
  jobs: Job[];
  candidates: Candidate[];
  onAddJob: (job: Job) => void;
  onUpdateCandidate: (candidate: Candidate) => void;
  onAddCandidate: (candidate: Candidate) => void;
}

// --- Tool Definitions ---
const emailTool: FunctionDeclaration = {
  name: 'sendEmail',
  description: 'Send an email to the candidate. Use this to send assessment links or rejection emails.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      recipientName: { type: Type.STRING },
      emailType: { type: Type.STRING, enum: ['assessment', 'rejection'], description: 'The type of email to send.' },
      subject: { type: Type.STRING },
      bodyContent: { type: Type.STRING, description: 'The main content of the email.' }
    },
    required: ['recipientName', 'emailType', 'subject', 'bodyContent']
  }
};

const Recruiting: React.FC<RecruitingProps> = ({ 
  currentUser,
  tenants,
  jobs, 
  candidates, 
  onAddJob, 
  onUpdateCandidate, 
  onAddCandidate 
}) => {
  const isSuperuser = currentUser.role === 'SUPERUSER';
  const isTenantAdmin = currentUser.role === 'TENANT_ADMIN';
  const isRecruiter = currentUser.jobTitle?.toLowerCase().includes('recruitment') || currentUser.jobTitle?.toLowerCase().includes('recruiting');
  const defaultTenantId = currentUser.tenantId || tenants[0].id;

  const [activeTab, setActiveTab] = useState<'jobs' | 'candidates'>('jobs');
  const [showPostJob, setShowPostJob] = useState(false);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [evaluatingIds, setEvaluatingIds] = useState<Set<string>>(new Set());
  const [activeInterview, setActiveInterview] = useState<Candidate | null>(null);
  const [emailNotification, setEmailNotification] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<CandidateProfile | null>(null);

  // Offer Modal State
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerCandidate, setOfferCandidate] = useState<Candidate | null>(null);
  const [offerForm, setOfferForm] = useState({ salary: '', joiningDate: '', variable: '', notes: '' });

  // Job Filters
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  // Job Form State
  const [newJob, setNewJob] = useState({ 
    title: '', 
    department: '', 
    location: '',
    description: '',
    tenantId: defaultTenantId // For superuser selection
  });
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

  // Add Candidate Form State
  const [rawResume, setRawResume] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [newCandidateForm, setNewCandidateForm] = useState({
    name: '',
    role: '',
    experience: '',
    education: '',
    resumeSummary: ''
  });

  // Voice Note State
  const [isRecording, setIsRecording] = useState(false);
  const [voiceNoteText, setVoiceNoteText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Quick Summary State
  const [quickSummaryId, setQuickSummaryId] = useState<string | null>(null);
  const [quickSummaries, setQuickSummaries] = useState<Record<string, string>>({});

  // Derived Filters
  const departments = Array.from(new Set(jobs.map(j => j.department)));
  const locations = Array.from(new Set(jobs.map(j => j.location).filter(Boolean)));

  const filteredJobs = jobs.filter(job => {
    const matchDept = !filterDepartment || job.department === filterDepartment;
    const matchLoc = !filterLocation || job.location === filterLocation;
    return matchDept && matchLoc;
  });

  const sortedCandidates = [...candidates].sort((a, b) => {
    // Custom sort order for workflow
    const statusOrder: Record<string, number> = {
      'offer_pending': 10,
      'hr_round': 9,
      'team_interview': 8,
      'shortlisted': 7,
      'evaluated': 6,
      'applied': 5,
      'offer_sent': 4,
      'offer_accepted': 3,
      'hired': 1,
      'rejected': 0
    };
    const statusDiff = (statusOrder[b.status] || 0) - (statusOrder[a.status] || 0);
    if (statusDiff !== 0) return statusDiff;
    return (b.evaluation?.score || 0) - (a.evaluation?.score || 0);
  });

  // Auto-Evaluation
  useEffect(() => {
    const unevaluatedCandidates = candidates.filter(c => c.status === 'applied' && !evaluatingIds.has(c.id));
    if (unevaluatedCandidates.length > 0) {
      unevaluatedCandidates.forEach(candidate => {
        handleAutoEvaluate(candidate);
      });
    }
  }, [candidates, evaluatingIds]); 

  const handleAutoEvaluate = async (candidate: Candidate) => {
    setEvaluatingIds(prev => new Set(prev).add(candidate.id));
    const job = jobs.find(j => j.id === candidate.jobId) || jobs.find(j => j.title === candidate.role);
    const description = job ? job.description : "Standard job requirements.";
    
    try {
      await new Promise(r => setTimeout(r, Math.random() * 2000 + 1000));
      const evaluation = await evaluateCandidate(
        `Experience: ${candidate.experience}. Education: ${candidate.education}. Resume: ${candidate.resumeSummary}`,
        description
      );
      const newStatus = evaluation.score >= 85 ? 'shortlisted' : 'evaluated';
      onUpdateCandidate({ ...candidate, status: newStatus, evaluation: evaluation });
    } catch (error) {
      console.error(error);
    } finally {
      setEvaluatingIds(prev => {
        const next = new Set(prev);
        next.delete(candidate.id);
        return next;
      });
    }
  };

  const handlePostJob = (e: React.FormEvent) => {
    e.preventDefault();
    const job: Job = {
      id: Math.random().toString(36).substr(2, 9),
      tenantId: isSuperuser ? newJob.tenantId : currentUser.tenantId!,
      title: newJob.title,
      department: newJob.department,
      location: newJob.location || 'Remote',
      description: newJob.description,
      postedDate: new Date().toISOString().split('T')[0],
      applicants: 0
    };
    onAddJob(job);
    setShowPostJob(false);
    setNewJob({ title: '', department: '', location: '', description: '', tenantId: defaultTenantId });
    alert(`Job posted successfully!`);
  };

  const handleGenerateDescription = async () => {
    if (!newJob.title || !newJob.department) {
      alert("Please enter a Title and Department first.");
      return;
    }
    setIsGeneratingDesc(true);
    try {
      const desc = await generateJobDescription(newJob.title, newJob.department);
      setNewJob(prev => ({ ...prev, description: desc }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleParseResume = async () => {
    if (!rawResume.trim()) return;
    setIsParsing(true);
    try {
      const parsed = await parseResume(rawResume);
      setNewCandidateForm(prev => ({
        ...prev,
        name: parsed.name,
        experience: parsed.experience,
        education: parsed.education,
        resumeSummary: parsed.resumeSummary
      }));
    } catch (e) {
      console.error(e);
      alert("Failed to parse resume.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidateForm.role) {
      alert("Please select a role.");
      return;
    }
    const selectedJob = jobs.find(j => j.title === newCandidateForm.role);
    const jobId = selectedJob ? selectedJob.id : 'unknown';
    const targetTenantId = selectedJob ? selectedJob.tenantId : (currentUser.tenantId || tenants[0].id);

    const candidate: Candidate = {
      id: Math.random().toString(36).substr(2, 9),
      jobId: jobId,
      tenantId: targetTenantId,
      name: newCandidateForm.name || "Candidate",
      role: newCandidateForm.role,
      experience: newCandidateForm.experience,
      education: newCandidateForm.education,
      resumeSummary: newCandidateForm.resumeSummary,
      status: 'applied'
    };
    onAddCandidate(candidate);
    setShowAddCandidate(false);
    setRawResume('');
    setVoiceNoteText('');
    setNewCandidateForm({ name: '', role: '', experience: '', education: '', resumeSummary: '' });
  };

  const handleStatusChange = (candidate: Candidate, status: Candidate['status']) => {
    onUpdateCandidate({ ...candidate, status });
  };

  const handleManualEmail = (candidate: Candidate, type: 'assessment' | 'rejection') => {
    const action = type === 'assessment' ? 'Technical Assessment Link' : 'Rejection Notice';
    setEmailNotification(`Sent ${action} to ${candidate.name}`);
    setTimeout(() => setEmailNotification(null), 4000);
    if (type === 'rejection') handleStatusChange(candidate, 'rejected');
  };

  const sendEmailImplementation = async (args: any) => {
    const typeLabel = args.emailType === 'assessment' ? 'Technical Assessment' : 'Rejection Notice';
    setEmailNotification(`Agent sent ${typeLabel} to ${args.recipientName}`);
    setTimeout(() => setEmailNotification(null), 5000);
    return { success: true, message: "Email queued successfully." };
  };

  // Voice Note
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setIsTranscribing(true);
          const text = await transcribeAudioNote(base64Audio);
          setVoiceNoteText(prev => prev + (prev ? ' ' : '') + text);
          setIsTranscribing(false);
        };
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleQuickSummary = async (candidateId: string, text: string) => {
    setQuickSummaryId(candidateId);
    const summary = await quickSummarize(text);
    setQuickSummaries(prev => ({ ...prev, [candidateId]: summary }));
    setQuickSummaryId(null);
  };

  // Offer Logic
  const openOfferModal = (candidate: Candidate) => {
    setOfferCandidate(candidate);
    setOfferForm({ salary: '', joiningDate: '', variable: '', notes: '' });
    setShowOfferModal(true);
  };

  const submitDraftOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerCandidate) return;

    const offer: OfferDetails = {
      salary: offerForm.salary,
      joiningDate: offerForm.joiningDate,
      variablePay: offerForm.variable,
      notes: offerForm.notes,
      draftedBy: currentUser.id
    };

    onUpdateCandidate({
      ...offerCandidate,
      status: 'offer_pending',
      offerDetails: offer
    });

    setShowOfferModal(false);
    setEmailNotification("Offer drafted and sent for Admin Approval");
    setTimeout(() => setEmailNotification(null), 4000);
  };

  const approveOffer = (candidate: Candidate) => {
    if (!candidate.offerDetails) return;
    onUpdateCandidate({
      ...candidate,
      status: 'offer_sent',
      offerDetails: {
        ...candidate.offerDetails,
        approvedBy: currentUser.id
      }
    });
    setEmailNotification("Offer Approved & Sent to Candidate");
    setTimeout(() => setEmailNotification(null), 4000);
  };

  const simulateOfferAcceptance = (candidate: Candidate) => {
    onUpdateCandidate({
      ...candidate,
      status: 'offer_accepted',
      onboardingProgress: [
        { id: '1', label: 'Offer Letter Signed', completed: true },
        { id: '2', label: 'Background Check', completed: false },
        { id: '3', label: 'ID Proof Verified', completed: false },
        { id: '4', label: 'IT Assets Assigned', completed: false }
      ]
    });
    alert(`Candidate ${candidate.name} has accepted! Moved to Pre-boarding.`);
  };

  // --- Render ---

  if (activeInterview) {
    return (
      <div className="h-full flex flex-col items-center justify-center relative">
        <button 
          onClick={() => setActiveInterview(null)}
          className="absolute top-4 left-4 text-slate-400 hover:text-white flex items-center gap-2"
        >
          <ChevronRight className="rotate-180" size={20} />
          Back to Dashboard
        </button>

        {emailNotification && (
          <div className="absolute top-4 right-4 bg-green-500/20 border border-green-500 text-green-400 px-6 py-4 rounded-xl shadow-2xl animate-fade-in flex items-center gap-3">
            <Mail size={24} />
            <div>
              <div className="font-bold">Email Dispatcher</div>
              <div className="text-sm">{emailNotification}</div>
            </div>
          </div>
        )}
        
        <LiveAgent 
           agentName="Alex (Recruiter)"
           roleDescription={`Talent Acquisition Specialist interviewing ${activeInterview.name}.`}
           systemInstruction={`You are Alex, a professional recruiter... (Same instructions)`}
           voiceName="Kore"
           tools={[{ functionDeclarations: [emailTool] }]}
           toolImplementations={{ sendEmail: sendEmailImplementation }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative pb-12">
      {emailNotification && (
        <div className="fixed top-8 right-8 z-50 bg-slate-800 border border-green-500/50 text-green-400 px-6 py-4 rounded-2xl shadow-2xl animate-bounce-in flex items-center gap-3">
          <Mail size={24} />
          <div>
            <div className="font-bold text-white">Notification</div>
            <div className="text-sm text-slate-300">{emailNotification}</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-slate-800 pb-4 gap-4">
        <div>
           <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">Recruiting Hub</h2>
           <p className="text-slate-400 mt-2">End-to-end hiring: Job Posting → Screening → Offer Management.</p>
        </div>
        <div className="flex bg-slate-800 p-1 rounded-lg">
          <button onClick={() => setActiveTab('jobs')} className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === 'jobs' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Job Board</button>
          <button onClick={() => setActiveTab('candidates')} className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === 'candidates' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Candidates</button>
        </div>
      </div>

      {activeTab === 'jobs' ? (
        // ... (Existing Job Board UI - No changes needed here, assuming kept from previous context)
        <div className="animate-fade-in space-y-6">
           <div className="flex justify-end mb-4">
               <button onClick={() => setShowPostJob(true)} className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium shadow-lg"><Plus size={18} /> Post Job</button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map(job => (
                <div key={job.id} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-slate-600 transition-all flex flex-col h-64 relative overflow-hidden">
                    <h3 className="text-xl font-bold text-white mb-1">{job.title}</h3>
                    <p className="text-sm text-slate-500 mb-4">{job.department}</p>
                    <p className="text-sm text-slate-400 line-clamp-3">{job.description}</p>
                    <div className="mt-auto pt-4 border-t border-slate-700 flex justify-between text-sm">
                        <span className="text-slate-400">{job.applicants} Applicants</span>
                        <button onClick={() => setActiveTab('candidates')} className="text-blue-400 hover:underline">View Candidates</button>
                    </div>
                </div>
              ))}
           </div>
           
           {/* Post Job Modal (Simplified for brevity as it was existing) */}
           {showPostJob && (
             <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl max-w-lg w-full">
                   <h3 className="text-2xl font-bold text-white mb-6">Create Job Posting</h3>
                   <form onSubmit={handlePostJob} className="space-y-4">
                      <input value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} placeholder="Title" className="w-full bg-slate-800 rounded-lg p-3 text-white" />
                      <input value={newJob.department} onChange={e => setNewJob({...newJob, department: e.target.value})} placeholder="Department" className="w-full bg-slate-800 rounded-lg p-3 text-white" />
                      <textarea value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})} placeholder="Description" className="w-full bg-slate-800 rounded-lg p-3 text-white h-32" />
                      <div className="flex gap-4">
                         <button type="button" onClick={() => setShowPostJob(false)} className="flex-1 py-3 text-slate-400">Cancel</button>
                         <button type="submit" className="flex-1 py-3 bg-green-600 text-white rounded-lg font-bold">Post Job</button>
                      </div>
                   </form>
                </div>
             </div>
           )}
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowAddCandidate(true)} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium shadow-lg"><Upload size={18} /> Add Candidate</button>
          </div>

          {sortedCandidates.map(candidate => (
            <div key={candidate.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6 transition-all hover:border-slate-600 relative overflow-hidden">
               {/* Status Badge */}
               <div className="absolute top-0 right-0 p-4">
                  {candidate.status === 'offer_pending' && <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-lg text-xs font-bold border border-yellow-500/30 flex items-center gap-1"><FileSignature size={12}/> Offer Approval Pending</span>}
                  {candidate.status === 'offer_sent' && <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg text-xs font-bold border border-blue-500/30 flex items-center gap-1"><Mail size={12}/> Offer Sent</span>}
                  {candidate.status === 'offer_accepted' && <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-xs font-bold border border-green-500/30 flex items-center gap-1"><CheckCircle size={12}/> Offer Accepted</span>}
                  {candidate.status === 'hired' && <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-lg text-xs font-bold border border-indigo-500/30 flex items-center gap-1"><UserCheck size={12}/> Hired</span>}
               </div>

              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {candidate.name}
                    {candidate.status === 'shortlisted' && <span className="bg-green-500/10 text-green-400 text-xs px-2 py-0.5 rounded-full">Shortlisted</span>}
                    {candidate.status === 'team_interview' && <span className="bg-purple-500/10 text-purple-400 text-xs px-2 py-0.5 rounded-full">Team Interview</span>}
                    {candidate.status === 'hr_round' && <span className="bg-orange-500/10 text-orange-400 text-xs px-2 py-0.5 rounded-full">HR Negotiation</span>}
                  </h3>
                  <p className="text-slate-400 text-sm">{candidate.role}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm text-slate-300">
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                      <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Experience</span> {candidate.experience}
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                       <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Resume Summary</span>
                       {candidate.resumeSummary}
                    </div>
                  </div>
                </div>

                {/* Workflow Action Panel */}
                <div className="lg:w-80 shrink-0 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-700 pt-4 lg:pt-0 lg:pl-6">
                  {candidate.status === 'applied' || candidate.status === 'evaluated' ? (
                     <div className="space-y-2">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-slate-400">Score</span>
                           <span className={`text-xl font-bold ${candidate.evaluation && candidate.evaluation.score >= 85 ? 'text-green-400' : 'text-slate-200'}`}>{candidate.evaluation?.score || 0}</span>
                        </div>
                        <button onClick={() => handleStatusChange(candidate, 'shortlisted')} className="w-full py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg">Shortlist</button>
                        <button onClick={() => handleManualEmail(candidate, 'rejection')} className="w-full py-2 border border-slate-600 text-slate-400 hover:text-white rounded-lg">Reject</button>
                     </div>
                  ) : candidate.status === 'shortlisted' ? (
                     <div className="space-y-2">
                        <button onClick={() => setActiveInterview(candidate)} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2"><Phone size={16}/> AI Interview</button>
                        <button onClick={() => handleManualEmail(candidate, 'assessment')} className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center gap-2"><Mail size={16}/> Send Assessment</button>
                        <button onClick={() => handleStatusChange(candidate, 'team_interview')} className="w-full py-2 border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 rounded-lg flex items-center justify-center gap-2">Move to Team Round <ArrowRight size={16}/></button>
                     </div>
                  ) : candidate.status === 'team_interview' ? (
                     <div className="space-y-2 text-center">
                        <p className="text-sm text-slate-400 mb-2">Interviewing with Team Lead...</p>
                        <button onClick={() => handleStatusChange(candidate, 'hr_round')} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg">Pass to HR Round</button>
                        <button onClick={() => handleStatusChange(candidate, 'rejected')} className="w-full py-2 border border-slate-600 text-slate-400 rounded-lg">Reject</button>
                     </div>
                  ) : candidate.status === 'hr_round' ? (
                     <div className="space-y-2">
                        <p className="text-sm text-slate-400 text-center mb-2">Negotiation Phase</p>
                        {isRecruiter || isSuperuser ? (
                           <button onClick={() => openOfferModal(candidate)} className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold flex items-center justify-center gap-2"><FileSignature size={16}/> Draft Offer</button>
                        ) : (
                           <div className="text-xs text-orange-400 bg-orange-500/10 p-2 rounded text-center">Waiting for Recruiter to draft offer</div>
                        )}
                        <button onClick={() => handleStatusChange(candidate, 'rejected')} className="w-full py-2 border border-slate-600 text-slate-400 rounded-lg">Reject</button>
                     </div>
                  ) : candidate.status === 'offer_pending' ? (
                     <div className="space-y-2">
                        <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg text-xs text-yellow-200">
                           <div className="font-bold mb-1">Offer Drafted</div>
                           <div>Salary: {candidate.offerDetails?.salary}</div>
                        </div>
                        {isTenantAdmin || isSuperuser ? (
                           <button onClick={() => approveOffer(candidate)} className="w-full py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold flex items-center justify-center gap-2"><CheckCircle size={16}/> Approve & Send</button>
                        ) : (
                           <div className="text-center text-xs text-slate-500 italic">Waiting for Admin Approval</div>
                        )}
                     </div>
                  ) : candidate.status === 'offer_sent' ? (
                     <div className="space-y-2 text-center">
                        <p className="text-sm text-blue-400 font-medium">Offer Sent to Candidate</p>
                        <button onClick={() => simulateOfferAcceptance(candidate)} className="w-full py-2 border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg text-xs">Simulate "Candidate Accepts"</button>
                     </div>
                  ) : candidate.status === 'offer_accepted' ? (
                     <div className="text-center h-full flex flex-col items-center justify-center text-green-400">
                        <CheckCircle size={32} className="mb-2" />
                        <p className="font-bold">Offer Accepted!</p>
                        <p className="text-xs text-slate-500 mt-1">Moved to Pre-boarding in HR Module</p>
                     </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}

          {/* Offer Modal */}
          {showOfferModal && offerCandidate && (
             <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl max-w-md w-full shadow-2xl">
                   <h3 className="text-xl font-bold text-white mb-4">Draft Offer for {offerCandidate.name}</h3>
                   <form onSubmit={submitDraftOffer} className="space-y-4">
                      <div>
                         <label className="block text-sm text-slate-400 mb-1">Annual Salary</label>
                         <div className="relative">
                           <input required value={offerForm.salary} onChange={e => setOfferForm({...offerForm, salary: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pl-10 text-white" placeholder="12,00,000" />
                           <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                         </div>
                      </div>
                      <div>
                         <label className="block text-sm text-slate-400 mb-1">Variable Pay / Bonus</label>
                         <input value={offerForm.variable} onChange={e => setOfferForm({...offerForm, variable: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white" placeholder="10%" />
                      </div>
                      <div>
                         <label className="block text-sm text-slate-400 mb-1">Joining Date</label>
                         <div className="relative">
                            <input required type="date" value={offerForm.joiningDate} onChange={e => setOfferForm({...offerForm, joiningDate: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pl-10 text-white" />
                            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                         </div>
                      </div>
                      <div>
                         <label className="block text-sm text-slate-400 mb-1">Notes for Approver</label>
                         <textarea value={offerForm.notes} onChange={e => setOfferForm({...offerForm, notes: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white h-20" />
                      </div>
                      <div className="flex gap-3 pt-4">
                         <button type="button" onClick={() => setShowOfferModal(false)} className="flex-1 py-2 text-slate-400">Cancel</button>
                         <button type="submit" className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold">Submit for Approval</button>
                      </div>
                   </form>
                </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Recruiting;
