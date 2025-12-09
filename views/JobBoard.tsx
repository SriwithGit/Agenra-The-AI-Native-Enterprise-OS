import React, { useState } from 'react';
import { Job, CandidateProfile } from '../types';
import { Briefcase, MapPin, Search, ArrowRight, User, LogOut, Globe, Edit3, Camera, FileText, Building2, Mail, Phone, X, Sparkles, Loader2, Copy, Star } from 'lucide-react';
import { CandidateAuth } from './CandidateAuth';
import { generateApplicationMaterials } from '../services/geminiService';
import PaymentGateway from '../components/PaymentGateway';

interface JobBoardProps {
  jobs: Job[];
  onApply: (jobId: string, candidateProfile: CandidateProfile, resumeText: string) => void;
}

const JobBoard: React.FC<JobBoardProps> = ({ jobs, onApply }) => {
  const [currentUser, setCurrentUser] = useState<CandidateProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');

  // Application Modal State (Quick Apply)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  
  // AI Gen State
  const [isGeneratingMaterials, setIsGeneratingMaterials] = useState(false);
  const [generatedMaterials, setGeneratedMaterials] = useState<{coverLetter: string, tailoredResume: string} | null>(null);
  
  // Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Filter Jobs based on search query
  const filteredJobs = jobs.filter(job => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(query) ||
      job.department.toLowerCase().includes(query) ||
      job.description.toLowerCase().includes(query) ||
      job.location.toLowerCase().includes(query)
    );
  });

  const handleApplyClick = (job: Job) => {
    if (!currentUser) {
      setAuthView('login');
      setShowAuthModal(true);
      return;
    }
    setSelectedJob(job);
    // Pre-fill resume if available from profile
    if (currentUser.resumeText) {
      setResumeText(currentUser.resumeText);
    }
    setGeneratedMaterials(null);
  };

  const handleLoginSuccess = (profile: CandidateProfile) => {
    setCurrentUser(profile);
    setShowAuthModal(false);
  };

  const handleGenerateAI = async () => {
    if (!currentUser || !selectedJob) return;
    
    // Check for premium
    if (currentUser.subscriptionTier !== 'premium' && (currentUser.credits || 0) <= 0) {
      setShowPaymentModal(true);
      return;
    }

    setIsGeneratingMaterials(true);
    try {
      const materials = await generateApplicationMaterials(currentUser, selectedJob);
      setGeneratedMaterials(materials);
      
      // Consume credit if not premium
      if (currentUser.subscriptionTier !== 'premium') {
         setCurrentUser(prev => prev ? {...prev, credits: (prev.credits || 0) - 1} : null);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate materials");
    } finally {
      setIsGeneratingMaterials(false);
    }
  };

  const handleApplySubmit = () => {
     if (!selectedJob || !currentUser) return;
     setIsApplying(true);
     setTimeout(() => {
        onApply(selectedJob.id, currentUser, generatedMaterials?.tailoredResume || resumeText);
        setIsApplying(false);
        setSelectedJob(null);
        setGeneratedMaterials(null);
        alert("Application submitted successfully!");
     }, 1000);
  };

  const handlePaymentSuccess = (plan: 'credit' | 'subscription') => {
     if (!currentUser) return;
     setCurrentUser(prev => {
        if (!prev) return null;
        if (plan === 'subscription') return { ...prev, subscriptionTier: 'premium' };
        return { ...prev, credits: (prev.credits || 0) + 1 };
     });
     setShowPaymentModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header / Nav */}
      <div className="flex justify-between items-center mb-12">
         <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">A</div>
            <div className="font-bold text-white text-xl tracking-tight">AGENRA CAREERS</div>
         </div>
         
         <div>
            {currentUser ? (
               <div className="flex items-center gap-4">
                  <div className="hidden md:block text-right">
                     <div className="text-white font-bold">{currentUser.name}</div>
                     <div className="text-xs text-slate-400">
                        {currentUser.subscriptionTier === 'premium' ? <span className="text-yellow-400 flex items-center gap-1 justify-end"><Star size={10} fill="currentColor"/> Pro Member</span> : `${currentUser.credits || 0} Credits`}
                     </div>
                  </div>
                  <button onClick={() => setCurrentUser(null)} className="text-slate-400 hover:text-white">
                     <LogOut size={20} />
                  </button>
               </div>
            ) : (
               <div className="flex gap-4">
                  <button onClick={() => { setAuthView('login'); setShowAuthModal(true); }} className="text-slate-300 hover:text-white font-medium">Log In</button>
                  <button onClick={() => { setAuthView('signup'); setShowAuthModal(true); }} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold transition-all">Sign Up</button>
               </div>
            )}
         </div>
      </div>

      {/* Hero Search */}
      <div className="text-center max-w-2xl mx-auto mb-16">
         <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Find Your Next <span className="text-blue-500">Dream Job</span></h1>
         <p className="text-slate-400 text-lg mb-8">Browse thousands of job openings from top companies using Agenra.</p>
         
         <div className="relative">
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, skill, or location..." 
              className="w-full bg-slate-800 border border-slate-700 rounded-full py-4 pl-14 pr-6 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xl placeholder:text-slate-600"
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
         </div>
      </div>

      {/* Job Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredJobs.map(job => (
            <div key={job.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 hover:border-blue-500/50 transition-all hover:-translate-y-1 group flex flex-col">
               <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                     {job.tenantId.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded-full">{job.postedDate}</span>
               </div>
               
               <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{job.title}</h3>
               <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                  <Building2 size={14} /> {job.department}
                  <span>•</span>
                  <MapPin size={14} /> {job.location}
               </div>
               
               <p className="text-slate-400 text-sm line-clamp-3 mb-6 flex-1">{job.description}</p>
               
               <button 
                 onClick={() => handleApplyClick(job)}
                 className="w-full py-3 bg-slate-700 hover:bg-blue-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
               >
                 Apply Now <ArrowRight size={16} />
               </button>
            </div>
         ))}
      </div>
      
      {filteredJobs.length === 0 && (
         <div className="text-center py-20">
            <Briefcase size={48} className="mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-slate-400">No jobs found</h3>
            <p className="text-slate-500">Try adjusting your search terms.</p>
         </div>
      )}

      {/* Apply Modal */}
      {selectedJob && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]">
               <div className="p-6 border-b border-slate-800 flex justify-between items-start">
                  <div>
                     <h2 className="text-2xl font-bold text-white">Apply for {selectedJob.title}</h2>
                     <p className="text-slate-400 text-sm">{selectedJob.department} • {selectedJob.location}</p>
                  </div>
                  <button onClick={() => { setSelectedJob(null); setGeneratedMaterials(null); }} className="text-slate-500 hover:text-white"><X size={24} /></button>
               </div>
               
               <div className="p-6 overflow-y-auto custom-scrollbar">
                  {/* AI Assistant Banner */}
                  <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 rounded-xl p-4 mb-6 flex items-start gap-4">
                     <div className="p-2 bg-purple-500/20 rounded-lg text-purple-300 shrink-0">
                        <Sparkles size={24} />
                     </div>
                     <div className="flex-1">
                        <h4 className="font-bold text-white text-sm mb-1">Boost your chances with AI</h4>
                        <p className="text-xs text-slate-300 mb-3">Generate a tailored resume and cover letter specific to this job description.</p>
                        <button 
                           onClick={handleGenerateAI} 
                           disabled={isGeneratingMaterials}
                           className="text-xs bg-white text-purple-900 hover:bg-purple-100 px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 disabled:opacity-70"
                        >
                           {isGeneratingMaterials ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                           {isGeneratingMaterials ? 'Generating...' : 'Auto-Generate Application'}
                        </button>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Resume / CV Content</label>
                        <textarea 
                           value={generatedMaterials ? generatedMaterials.tailoredResume : resumeText}
                           onChange={(e) => setResumeText(e.target.value)}
                           className="w-full h-40 bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                           placeholder="Paste your resume text here..."
                        />
                        {generatedMaterials && (
                           <div className="text-xs text-green-400 mt-2 flex items-center gap-1">
                              <Sparkles size={12} /> Tailored for this job by Gemini
                           </div>
                        )}
                     </div>
                     
                     {generatedMaterials && (
                        <div className="animate-fade-in">
                           <label className="block text-sm font-medium text-slate-400 mb-2">AI Cover Letter</label>
                           <textarea 
                              value={generatedMaterials.coverLetter}
                              readOnly
                              className="w-full h-40 bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                           />
                        </div>
                     )}
                  </div>
               </div>
               
               <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
                  <button onClick={() => { setSelectedJob(null); setGeneratedMaterials(null); }} className="px-6 py-2 text-slate-400 hover:text-white">Cancel</button>
                  <button 
                     onClick={handleApplySubmit}
                     disabled={isApplying}
                     className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
                  >
                     {isApplying ? 'Submitting...' : 'Submit Application'}
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
         <CandidateAuth 
            initialView={authView} 
            onLogin={handleLoginSuccess} 
            onClose={() => setShowAuthModal(false)} 
         />
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
         <PaymentGateway 
            onSuccess={handlePaymentSuccess} 
            onClose={() => setShowPaymentModal(false)} 
         />
      )}
    </div>
  );
};

export default JobBoard;