
import React, { useState } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { ArrowRight, UserCircle, Hash, Lock, AlertCircle, Info } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState<'request' | 'verify' | 'reset'>('request');
  
  const [username, setUsername] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const isFieldInvalid = (name: string, value: string) => {
    return touched[name] && !value.trim();
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const [resetCode, setResetCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Validates format: 2 Letters, 15-21, then 4 digits (e.g., DE210001)
  const validateStudentId = (id: string) => {
    const regex = /^[A-Za-z]{2}(15|16|17|18|19|20|21)\d{4}$/;
    return regex.test(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const formattedId = studentId.toUpperCase();

    if (!validateStudentId(formattedId)) {
      setError('Invalid format. Please use your official Student ID (e.g., DE210001).');
      return;
    }

    try {
      if (isLogin) {
        const user = authService.login(formattedId, password);
        if (user) onLogin(user);
        else setError('Student ID not found or incorrect password.');
      } else {
        if (!username.trim()) {
          setError('Please enter your full name.');
          return;
        }
        if (!email.trim() || !email.includes('@')) {
          setError('Please enter a valid email address.');
          return;
        }
        const user = authService.register(username, formattedId, email, password);
        if (user) onLogin(user);
        else setError('This Student ID is already registered.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again later.');
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const user = authService.getUserByStudentId(studentId);
    if (!user) {
      setError('Student ID not found.');
      return;
    }

    const code = authService.requestPasswordReset(studentId);
    if (code) {
      setResetCode(code);
      
      try {
        const response = await fetch('/api/send-reset-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            code: code,
            studentId: user.studentId,
            username: user.username
          })
        });

        if (response.ok) {
          setResetStep('verify');
          setSuccess(`A recovery code has been sent to your email: ${user.email}.`);
        } else {
          const data = await response.json();
          setError(data.error || 'Failed to send recovery code. Please try again.');
        }
      } catch (err) {
        console.error("Error calling reset API:", err);
        setError('Could not connect to the email service. Please check your connection.');
      }
    } else {
      setError('Failed to generate recovery code.');
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (authService.verifyResetCode(studentId, inputCode)) {
      setResetStep('reset');
      setError('');
    } else {
      setError('Invalid recovery code.');
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (authService.resetPassword(studentId, newPassword)) {
      setSuccess('Password reset successful! You can now log in.');
      setIsForgotPassword(false);
      setIsLogin(true);
      setResetStep('request');
      setPassword('');
    } else {
      setError('Failed to reset password.');
    }
  };

  if (isForgotPassword) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-accent tracking-tight mb-2">RESET PASSWORD</h1>
            <div className="h-1 w-20 bg-accent mx-auto rounded-full mb-4"></div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
            <div className="p-10">
              {resetStep === 'request' && (
                <>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Forgot Password?</h3>
                  <p className="text-slate-500 text-sm mb-8">Enter your Student ID to receive a recovery code.</p>
                  <form onSubmit={handleRequestReset} className="space-y-5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2 ml-1">Student ID</label>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="text" required
                          value={studentId} onChange={e => setStudentId(e.target.value)}
                          className="w-full pl-11 pr-5 py-3.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all font-bold text-slate-700 uppercase"
                          placeholder="e.g. DE210001"
                        />
                      </div>
                    </div>
                    {error && <p className="text-rose-500 text-xs font-bold">{error}</p>}
                    <button type="submit" className="w-full bg-[#f27024] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#d9621e] transition-all uppercase tracking-widest text-xs">
                      Send Reset Code
                    </button>
                  </form>
                </>
              )}

              {resetStep === 'verify' && (
                <>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Verify Code</h3>
                  <p className="text-slate-500 text-sm mb-4">Enter the 6-digit code sent to your email.</p>
                  <form onSubmit={handleVerifyCode} className="space-y-5">
                    <input 
                      type="text" required
                      value={inputCode} onChange={e => setInputCode(e.target.value)}
                      maxLength={6}
                      className="w-full px-5 py-4 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent text-center text-2xl font-black tracking-[0.5em]"
                      placeholder="000000"
                    />
                    {error && <p className="text-rose-500 text-xs font-bold">{error}</p>}
                    <button type="submit" className="w-full bg-accent text-white font-bold py-4 rounded-xl shadow-lg hover:opacity-90 transition-all uppercase tracking-widest text-xs">
                      Verify Code
                    </button>
                  </form>
                </>
              )}

              {resetStep === 'reset' && (
                <>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">New Password</h3>
                  <p className="text-slate-500 text-sm mb-8">Please set a strong password for your account.</p>
                  <form onSubmit={handleResetPassword} className="space-y-5">
                    <input 
                      type="password" required
                      value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      className="w-full px-5 py-3.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f27024] font-bold"
                      placeholder="New Password"
                    />
                    <input 
                      type="password" required
                      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full px-5 py-3.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f27024] font-bold"
                      placeholder="Confirm Password"
                    />
                    {error && <p className="text-rose-500 text-xs font-bold">{error}</p>}
                    <button type="submit" className="w-full bg-accent text-white font-bold py-4 rounded-xl shadow-lg hover:opacity-90 transition-all uppercase tracking-widest text-xs">
                      Reset Password
                    </button>
                  </form>
                </>
              )}

              <button 
                onClick={() => {
                  setIsForgotPassword(false);
                  setResetStep('request');
                  setError('');
                  setSuccess('');
                }}
                className="mt-8 w-full text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-tight"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* NEXUS Branding Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-accent tracking-tighter mb-2">NEXUS</h1>
          <div className="h-1.5 w-24 bg-accent mx-auto rounded-full mb-4"></div>
          <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em]">FPT UNI DA NANG CAMPUS</h2>
          <p className="text-slate-400 text-[10px] mt-3 font-bold uppercase tracking-widest opacity-60">Academic Management Portal</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          <div className="p-10 text-center">
            <h3 className="text-2xl font-black text-slate-800 mb-2">
              {isLogin ? 'Sign In' : 'Create Student Account'}
            </h3>
            <p className="text-slate-500 text-sm mb-8 max-w-[280px] mx-auto">
              {isLogin ? 'Sign in to manage your academic journey.' : 'Register your Student ID to access the Nexus portal.'}
            </p>

            {success && (
              <div className="mb-6 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <p className="text-emerald-600 text-xs font-bold">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <>
                  <div className="text-left">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2 ml-1">Full Name</label>
                    <div className="relative">
                      <UserCircle className={`absolute left-4 top-1/2 -translate-y-1/2 ${isFieldInvalid('username', username) ? 'text-rose-400' : 'text-slate-400'}`} size={18} />
                      <input 
                        type="text" required
                        value={username} onChange={e => setUsername(e.target.value)}
                        onBlur={() => handleBlur('username')}
                        className={`w-full pl-11 pr-5 py-3.5 rounded-xl bg-white border transition-all font-semibold text-slate-700 placeholder:text-slate-300 ${isFieldInvalid('username', username) ? 'border-rose-500 ring-2 ring-rose-100' : 'border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent'}`}
                        placeholder="Enter full name"
                      />
                    </div>
                    {isFieldInvalid('username', username) && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">This field is required</p>}
                  </div>
                  <div className="text-left">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2 ml-1">Email Address</label>
                    <div className="relative">
                      <Info className={`absolute left-4 top-1/2 -translate-y-1/2 ${isFieldInvalid('email', email) ? 'text-rose-400' : 'text-slate-400'}`} size={18} />
                      <input 
                        type="email" required
                        value={email} onChange={e => setEmail(e.target.value)}
                        onBlur={() => handleBlur('email')}
                        className={`w-full pl-11 pr-5 py-3.5 rounded-xl bg-white border transition-all font-semibold text-slate-700 placeholder:text-slate-300 ${isFieldInvalid('email', email) ? 'border-rose-500 ring-2 ring-rose-100' : 'border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent'}`}
                        placeholder="student@fpt.edu.vn"
                      />
                    </div>
                    {isFieldInvalid('email', email) && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">This field is required</p>}
                  </div>
                </>
              )}
              
              <div className="text-left">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2 ml-1">Student ID</label>
                <div className="relative">
                  <Hash className={`absolute left-4 top-1/2 -translate-y-1/2 ${isFieldInvalid('studentId', studentId) ? 'text-rose-400' : 'text-slate-400'}`} size={18} />
                  <input 
                    type="text" required
                    value={studentId} onChange={e => setStudentId(e.target.value)}
                    onBlur={() => handleBlur('studentId')}
                    maxLength={8}
                    className={`w-full pl-11 pr-5 py-3.5 rounded-xl bg-white border transition-all font-bold text-slate-700 uppercase placeholder:normal-case placeholder:text-slate-300 ${isFieldInvalid('studentId', studentId) ? 'border-rose-500 ring-2 ring-rose-100' : 'border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent'}`}
                    placeholder="e.g. DE210001"
                  />
                </div>
                {isFieldInvalid('studentId', studentId) && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">This field is required</p>}
              </div>

              <div className="text-left">
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase">Password</label>
                  {isLogin && (
                    <button 
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-[10px] font-bold text-accent hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 ${isFieldInvalid('password', password) ? 'text-rose-400' : 'text-slate-400'}`} size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} required
                    value={password} onChange={e => setPassword(e.target.value)}
                    onBlur={() => handleBlur('password')}
                    className={`w-full pl-11 pr-12 py-3.5 rounded-xl bg-white border transition-all font-bold text-slate-700 placeholder:text-slate-300 ${isFieldInvalid('password', password) ? 'border-rose-500 ring-2 ring-rose-100' : 'border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent'}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
                {isFieldInvalid('password', password) && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">This field is required</p>}
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-rose-50 p-4 rounded-xl border border-rose-100">
                  <AlertCircle size={16} className="text-rose-500 shrink-0" />
                  <p className="text-rose-600 text-xs font-bold">{error}</p>
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-accent text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-100 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
              >
                {isLogin ? 'Login to Portal' : 'Register ID'}
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <button 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setSuccess('');
                }}
                className="text-xs font-bold text-slate-500 hover:text-accent transition-colors uppercase tracking-tight"
              >
                {isLogin ? "New student? Create an account" : "Already registered? Sign in here"}
              </button>
            </div>
          </div>
          
          <div className="bg-slate-50 px-10 py-4 flex items-center gap-3">
             <Info size={14} className="text-slate-400" />
             <p className="text-[10px] text-slate-400 font-medium">Valid ID format for Da Nang Campus: DA/DE/DS + Course (15-21) + 4 digits.</p>
          </div>
        </div>

        <p className="mt-10 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
          &copy; 2025 FPT University Da Nang Campus
        </p>
      </div>
    </div>
  );
}
