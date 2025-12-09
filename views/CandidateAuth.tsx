
import React, { useState } from 'react';
import { Mail, Lock, Phone, ArrowRight, ShieldCheck, ChevronLeft, Smartphone, User, Briefcase, Building2, FileText, Upload, Camera, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { CandidateProfile } from '../types';

interface CandidateAuthProps {
  onLogin: (profile: CandidateProfile) => void;
  onClose: () => void;
  initialView?: 'login' | 'signup';
}

type AuthView = 'login' | 'signup' | 'forgot_password';
type SignupStep = 'contact' | 'verify' | 'security' | 'profile';
type ForgotStep = 'identify' | 'verify' | 'reset';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const CandidateAuth: React.FC<CandidateAuthProps> = ({ onLogin, onClose, initialView = 'login' }) => {
  const [view, setView] = useState<AuthView>(initialView);
  
  // Signup State
  const [signupStep, setSignupStep] = useState<SignupStep>('contact');
  
  // Forgot Password State
  const [forgotStep, setForgotStep] = useState<ForgotStep>('identify');

  // Basic Form Data
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Verification State
  const [emailOtpInput, setEmailOtpInput] = useState('');
  const [phoneOtpInput, setPhoneOtpInput] = useState('');
  const [singleOtpInput, setSingleOtpInput] = useState(''); // For forgot password

  // Profile Setup Data
  const [profileData, setProfileData] = useState({
    name: '',
    tagline: '',
    bio: '',
    lookingForRole: '',
    presentRole: '',
    presentOrg: '',
    avatar: null as string | null,
    resumeName: ''
  });

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Timers
  const [emailResendTimer, setEmailResendTimer] = useState(0);
  const [phoneResendTimer, setPhoneResendTimer] = useState(0);

  // --- Helpers ---

  const validatePassword = (pass: string) => {
    if (!PASSWORD_REGEX.test(pass)) {
      return "Password must have 8+ chars, 1 uppercase, 1 lowercase, 1 number, and 1 special char.";
    }
    return null;
  };

  const simulateApi = (callback: () => void) => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setLoading(false);
      callback();
    }, 1200);
  };

  const startTimer = (setTimer: React.Dispatch<React.SetStateAction<number>>) => {
    setTimer(30);
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendEmailOtp = () => {
    startTimer(setEmailResendTimer);
    console.log("Mock Email OTP sent: 1111");
  };

  const handleSendPhoneOtp = () => {
    startTimer(setPhoneResendTimer);
    console.log("Mock Phone OTP sent: 2222");
  };

  const handleSendSingleOtp = () => {
    startTimer(setEmailResendTimer); 
    console.log("Mock Recovery OTP sent: 1234");
  };

  // --- Login Flow ---
  
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }
    simulateApi(() => {
      // Mock Login Success
      onLogin({
        id: 'mock-candidate-id',
        name: email.split('@')[0], // Derive name for mock
        email: email,
        phone: '+15550000000',
        tagline: 'Software Engineer',
        bio: 'Passionate about building scalable systems.',
        lookingForRole: 'Senior Developer',
        resumeText: '', 
        resumeSummary: '',
        experience: '5 Years',
        education: 'BS CS'
      });
    });
  };

  // --- Signup Flow ---

  const handleSignupContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@') || phone.length < 10) {
      setError("Please enter a valid email and phone number.");
      return;
    }
    setError(null);
    handleSendEmailOtp();
    handleSendPhoneOtp();
    alert(`[MOCK] Verification Codes Sent:\nEmail: 1111\nPhone: 2222`);
    setSignupStep('verify');
  };

  const handleSignupVerify = (e: React.FormEvent) => {
    e.preventDefault();
    
    let hasError = false;
    let errorMsg = "";

    if (emailOtpInput !== '1111') {
       errorMsg += "Invalid Email Code. ";
       hasError = true;
    }
    if (phoneOtpInput !== '2222') {
       errorMsg += "Invalid Phone Code.";
       hasError = true;
    }

    if (hasError) {
      setError(errorMsg.trim());
      return;
    }

    setSignupStep('security');
    setEmailOtpInput('');
    setPhoneOtpInput('');
    setError(null);
  };

  const handleSignupSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    const passError = validatePassword(password);
    if (passError) {
      setError(passError);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    // Proceed to Profile Setup instead of immediate login
    setSignupStep('profile');
    // Pre-fill name from email as a placeholder
    setProfileData(prev => ({ ...prev, name: email.split('@')[0] }));
  };

  const handleSignupProfile = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileData.name || !profileData.lookingForRole) {
      setError("Name and Role are required.");
      return;
    }

    simulateApi(() => {
      onLogin({
        id: Math.random().toString(36).substr(2, 9),
        name: profileData.name,
        email,
        phone,
        avatarUrl: profileData.avatar || undefined,
        tagline: profileData.tagline,
        bio: profileData.bio,
        lookingForRole: profileData.lookingForRole,
        presentRole: profileData.presentRole,
        presentOrg: profileData.presentOrg,
        resumeFileName: profileData.resumeName,
        resumeText: "Placeholder for parsed text...",
        resumeSummary: "Placeholder for AI summary...",
        experience: "Extracted...",
        education: "Extracted..."
      });
    });
  };

  // --- Forgot Password Flow ---

  const handleForgotIdentify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError("Enter a valid email.");
      return;
    }
    handleSendSingleOtp();
    alert(`[MOCK] Recovery Code Sent: 1234`);
    setForgotStep('verify');
  };

  const handleForgotVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (singleOtpInput !== '1234') {
        setError("Invalid Code.");
        return;
    }
    setForgotStep('reset');
    setSingleOtpInput('');
    setError(null);
  };

  const handleForgotReset = (e: React.FormEvent) => {
    e.preventDefault();
    const passError = validatePassword(password);
    if (passError) {
      setError(passError);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    simulateApi(() => {
       alert("Password reset successfully. Please login.");
       setView('login');
       setPassword('');
       setConfirmPassword('');
       setError(null);
    });
  };

  // --- Render Components ---

  const renderInput = (
    label: string, 
    value: string, 
    onChange: (val: string) => void, 
    type: string = 'text', 
    placeholder: string = '', 
    icon?: React.ReactNode
  ) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
           {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl flex flex-col my-auto relative">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-2xl sticky top-0 z-10">
          <div>
             <h2 className="text-xl font-bold text-white">
               {view === 'login' && 'Candidate Login'}
               {view === 'signup' && 'Create Account'}
               {view === 'forgot_password' && 'Reset Password'}
             </h2>
             <p className="text-sm text-slate-500">agenra.in • Job Board Portal</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
             <div className="p-1 hover:bg-slate-800 rounded-full transition-colors"><ChevronLeft size={24} /></div>
          </button>
        </div>

        {/* Body */}
        <div className="p-8">
           {error && (
             <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex items-start gap-2 animate-shake">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                {error}
             </div>
           )}

           {/* LOGIN VIEW */}
           {view === 'login' && (
             <form onSubmit={handleLoginSubmit}>
                {renderInput('Email Address', email, setEmail, 'email', 'you@example.com', <Mail size={18} />)}
                <div className="mb-4">
                   <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
                   <div className="relative">
                     <input
                       type={showPassword ? 'text' : 'password'}
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                     />
                     <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                        <Lock size={18} />
                     </div>
                     <button 
                       type="button"
                       onClick={() => setShowPassword(!showPassword)}
                       className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1"
                     >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                     </button>
                   </div>
                </div>
                
                <div className="flex justify-end mb-6">
                  <button type="button" onClick={() => { setView('forgot_password'); setForgotStep('identify'); setError(null); }} className="text-sm text-blue-400 hover:underline">
                    Forgot Password?
                  </button>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 flex justify-center">
                   {loading ? 'Signing In...' : 'Sign In'}
                </button>

                <div className="mt-6 text-center text-sm text-slate-500">
                   Don't have an account? <button type="button" onClick={() => { setView('signup'); setSignupStep('contact'); setError(null); }} className="text-blue-400 font-bold hover:underline">Sign Up</button>
                </div>
             </form>
           )}

           {/* SIGNUP VIEW */}
           {view === 'signup' && (
             <div>
                {/* Stepper */}
                <div className="flex items-center gap-2 mb-8">
                   <div className={`h-1 flex-1 rounded-full ${signupStep === 'contact' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                   <div className={`h-1 flex-1 rounded-full ${signupStep === 'contact' ? 'bg-slate-700' : signupStep === 'verify' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                   <div className={`h-1 flex-1 rounded-full ${['contact', 'verify'].includes(signupStep) ? 'bg-slate-700' : signupStep === 'security' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                   <div className={`h-1 flex-1 rounded-full ${signupStep === 'profile' ? 'bg-blue-500' : 'bg-slate-700'}`}></div>
                </div>

                {signupStep === 'contact' && (
                  <form onSubmit={handleSignupContact}>
                     {renderInput('Email Address', email, setEmail, 'email', 'you@example.com', <Mail size={18} />)}
                     {renderInput('Mobile Number', phone, setPhone, 'tel', '+1 (555) 000-0000', <Phone size={18} />)}
                     <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold mt-4 flex items-center justify-center gap-2">
                        Verify Contact <ArrowRight size={18} />
                     </button>
                  </form>
                )}

                {signupStep === 'verify' && (
                   <form onSubmit={handleSignupVerify}>
                      <div className="text-center mb-6">
                         <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-400">
                            <ShieldCheck size={32} />
                         </div>
                         <h3 className="text-white font-bold">Two-Factor Verification</h3>
                         <p className="text-sm text-slate-400">Enter codes sent to your devices</p>
                      </div>

                      {/* Email Verification */}
                      <div className="mb-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <Mail size={14} className="text-blue-400"/> Email Code
                          </label>
                          <button 
                             type="button" 
                             onClick={handleSendEmailOtp} 
                             disabled={emailResendTimer > 0} 
                             className="text-xs text-slate-500 hover:text-white disabled:opacity-50"
                           >
                              {emailResendTimer > 0 ? `${emailResendTimer}s` : 'Resend'}
                           </button>
                        </div>
                        <input 
                           type="text" 
                           value={emailOtpInput} 
                           onChange={e => setEmailOtpInput(e.target.value)}
                           placeholder="1111"
                           maxLength={4}
                           className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 text-center text-lg tracking-widest text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Phone Verification */}
                      <div className="mb-6 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <Smartphone size={14} className="text-green-400"/> Phone Code
                          </label>
                          <button 
                             type="button" 
                             onClick={handleSendPhoneOtp} 
                             disabled={phoneResendTimer > 0} 
                             className="text-xs text-slate-500 hover:text-white disabled:opacity-50"
                           >
                              {phoneResendTimer > 0 ? `${phoneResendTimer}s` : 'Resend'}
                           </button>
                        </div>
                        <input 
                           type="text" 
                           value={phoneOtpInput} 
                           onChange={e => setPhoneOtpInput(e.target.value)}
                           placeholder="2222"
                           maxLength={4}
                           className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 text-center text-lg tracking-widest text-white focus:ring-2 focus:ring-green-500"
                        />
                      </div>

                      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold">
                        Verify & Continue
                      </button>
                   </form>
                )}

                {signupStep === 'security' && (
                  <form onSubmit={handleSignupSecurity}>
                     <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 mb-6 text-xs text-slate-400">
                        <p className="font-bold text-slate-300 mb-1">Password Requirements:</p>
                        <ul className="list-disc pl-4 space-y-0.5">
                           <li className={/(?=.*[A-Z])/.test(password) ? "text-green-400" : ""}>One uppercase letter</li>
                           <li className={/(?=.*[a-z])/.test(password) ? "text-green-400" : ""}>One lowercase letter</li>
                           <li className={/(?=.*\d)/.test(password) ? "text-green-400" : ""}>One number</li>
                           <li className={/(?=.*[@$!%*?&])/.test(password) ? "text-green-400" : ""}>One special char (@$!%*?&)</li>
                           <li className={password.length >= 8 ? "text-green-400" : ""}>Minimum 8 characters</li>
                        </ul>
                     </div>
                     <div className="mb-4">
                       <label className="block text-sm font-medium text-slate-400 mb-1">Create Password</label>
                       <div className="relative">
                         <input
                           type={showPassword ? 'text' : 'password'}
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                           className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                         />
                         <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                            <Lock size={18} />
                         </div>
                         <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1"
                         >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                         </button>
                       </div>
                     </div>
                     <div className="mb-6">
                       <label className="block text-sm font-medium text-slate-400 mb-1">Confirm Password</label>
                       <div className="relative">
                         <input
                           type={showPassword ? 'text' : 'password'}
                           value={confirmPassword}
                           onChange={(e) => setConfirmPassword(e.target.value)}
                           className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                         />
                         <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                            <Lock size={18} />
                         </div>
                         <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1"
                         >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                         </button>
                       </div>
                     </div>
                     
                     <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold mt-2 shadow-lg hover:shadow-blue-500/20">
                        Continue to Profile
                     </button>
                  </form>
                )}

                {signupStep === 'profile' && (
                  <form onSubmit={handleSignupProfile}>
                    <div className="text-center mb-6">
                       <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-dashed border-slate-600 hover:border-blue-500 cursor-pointer transition-colors relative group">
                          {profileData.avatar ? (
                            <img src={profileData.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <Camera size={24} className="text-slate-500 group-hover:text-blue-400" />
                          )}
                          <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => {
                               const file = e.target.files?.[0];
                               if(file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                     setProfileData(prev => ({...prev, avatar: reader.result as string}));
                                  }
                                  reader.readAsDataURL(file);
                               }
                            }}
                          />
                       </div>
                       <h3 className="text-white font-bold">Basic Profile</h3>
                       <p className="text-sm text-slate-400">Tell us a bit about yourself</p>
                    </div>

                    <div className="space-y-4">
                       {renderInput('Full Name', profileData.name, (v) => setProfileData(p => ({...p, name: v})), 'text', 'John Doe', <User size={18}/>)}
                       
                       {renderInput('Professional Tagline', profileData.tagline, (v) => setProfileData(p => ({...p, tagline: v})), 'text', 'e.g. Senior React Developer', <Briefcase size={18}/>)}
                       
                       <div className="grid grid-cols-2 gap-3">
                          {renderInput('Looking For Role', profileData.lookingForRole, (v) => setProfileData(p => ({...p, lookingForRole: v})), 'text', 'Role name')}
                          {renderInput('Present Role', profileData.presentRole, (v) => setProfileData(p => ({...p, presentRole: v})), 'text', 'Current Role')}
                       </div>

                       {renderInput('Present Organization', profileData.presentOrg, (v) => setProfileData(p => ({...p, presentOrg: v})), 'text', 'Current Company', <Building2 size={18}/>)}

                       <div className="mb-4">
                          <label className="block text-sm font-medium text-slate-400 mb-1">Short Bio</label>
                          <textarea 
                             value={profileData.bio}
                             onChange={(e) => setProfileData(p => ({...p, bio: e.target.value}))}
                             className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm h-20 placeholder:text-slate-600"
                             placeholder="Briefly describe your professional background..."
                          />
                       </div>

                       <div className="mb-6">
                         <label className="block text-sm font-medium text-slate-400 mb-1">Upload Resume</label>
                         <div className="border border-slate-700 bg-slate-800 rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3 overflow-hidden">
                               <div className="bg-slate-700 p-2 rounded-lg text-slate-300">
                                  <FileText size={18} />
                               </div>
                               <span className="text-sm text-slate-300 truncate">
                                  {profileData.resumeName || "No file chosen"}
                               </span>
                            </div>
                            <label className="cursor-pointer bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                               Upload
                               <input 
                                  type="file" 
                                  className="hidden"
                                  accept=".pdf,.doc,.docx"
                                  onChange={(e) => {
                                     const file = e.target.files?.[0];
                                     if(file) setProfileData(prev => ({...prev, resumeName: file.name}));
                                  }}
                               />
                            </label>
                         </div>
                       </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold mt-2 shadow-lg hover:shadow-green-500/20">
                       {loading ? 'Creating Profile...' : 'Save & Finish'}
                    </button>
                  </form>
                )}

                <div className="mt-6 text-center text-sm text-slate-500">
                   Already have an account? <button type="button" onClick={() => { setView('login'); setError(null); }} className="text-blue-400 font-bold hover:underline">Log In</button>
                </div>
             </div>
           )}

           {/* FORGOT PASSWORD VIEW */}
           {view === 'forgot_password' && (
             <div>
                {forgotStep === 'identify' && (
                   <form onSubmit={handleForgotIdentify}>
                      <p className="text-sm text-slate-400 mb-6">Enter your email or phone to receive a reset code.</p>
                      {renderInput('Email / Phone', email, setEmail, 'text', 'you@example.com', <Mail size={18} />)}
                      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold">
                         Send Reset Code
                      </button>
                   </form>
                )}

                {forgotStep === 'verify' && (
                   <form onSubmit={handleForgotVerify}>
                      <p className="text-sm text-slate-400 mb-6 text-center">Enter the code sent to {email}</p>
                      <input 
                         type="text" 
                         value={singleOtpInput} 
                         onChange={e => setSingleOtpInput(e.target.value)}
                         placeholder="1234"
                         maxLength={4}
                         className="w-full bg-slate-800 border border-slate-700 rounded-xl py-4 text-center text-2xl tracking-[0.5em] text-white focus:ring-2 focus:ring-blue-500 mb-4"
                      />
                      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold">
                         Verify Code
                      </button>
                   </form>
                )}

                {forgotStep === 'reset' && (
                   <form onSubmit={handleForgotReset}>
                      <p className="text-sm text-slate-400 mb-6">Create a new strong password.</p>
                      <div className="mb-4">
                         <label className="block text-sm font-medium text-slate-400 mb-1">New Password</label>
                         <div className="relative">
                            <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Lock size={18} /></div>
                            <button 
                               type="button"
                               onClick={() => setShowPassword(!showPassword)}
                               className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1"
                            >
                               {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                         </div>
                      </div>
                      <div className="mb-6">
                         <label className="block text-sm font-medium text-slate-400 mb-1">Confirm New Password</label>
                         <div className="relative">
                            <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Lock size={18} /></div>
                            <button 
                               type="button"
                               onClick={() => setShowPassword(!showPassword)}
                               className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1"
                            >
                               {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                         </div>
                      </div>
                      <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold">
                         {loading ? 'Resetting...' : 'Set New Password'}
                      </button>
                   </form>
                )}
                
                <div className="mt-6 text-center">
                   <button type="button" onClick={() => { setView('login'); setError(null); }} className="text-sm text-slate-500 hover:text-white">
                      Back to Login
                   </button>
                </div>
             </div>
           )}

        </div>
      </div>
    </div>
  );
};
