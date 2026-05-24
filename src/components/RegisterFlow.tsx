import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Shield, Mail, Key, Sparkles, ArrowLeft, ArrowRight, Eye, EyeOff, CircleCheck, CircleAlert, Check, Loader2 } from 'lucide-react';
import { apiRequest } from '../utils';
import { UserProfile, UserSession } from '../types';

interface RegisterFlowProps {
  onRegisterSuccess: (token: string, user: UserProfile, sessions: UserSession[]) => void;
  onNavigateToLogin: () => void;
  statusCallback: (text: string, icon?: React.ReactNode) => void;
  reducedMotion?: boolean;
  theme?: string;
}

export default function RegisterFlow({
  onRegisterSuccess,
  onNavigateToLogin,
  statusCallback,
  reducedMotion = false,
  theme = 'glass-dark',
}: RegisterFlowProps) {
  const isLight = theme === 'glass-light';
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0); // 1 = right, -1 = left

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  // States for verification indicators
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Field validity flags
  const [nameVal, setNameVal] = useState(false);
  const [usernameVal, setUsernameVal] = useState(false);
  const [emailVal, setEmailVal] = useState(false);

  // Password requirements checklist
  const passLong = password.length >= 8;
  const passUpper = /[A-Z]/.test(password);
  const passLower = /[a-z]/.test(password);
  const passDigit = /[0-9]/.test(password);
  const passSpecial = /[^A-Za-z0-9]/.test(password);
  const passwordValid = passLong && passUpper && passLower && passDigit && passSpecial;

  // Real-time Name validator
  useEffect(() => {
    setNameVal(fullName.trim().length >= 2);
  }, [fullName]);

  // Real-time Username syntax validator
  useEffect(() => {
    const validFormat = /^[a-zA-Z0-9_]{3,15}$/.test(username);
    setUsernameVal(validFormat);
    if (!validFormat) {
      setUsernameAvailable(null);
    }
  }, [username]);

  // Debounced server username check
  useEffect(() => {
    if (!usernameVal) return;
    
    setCheckingUsername(true);
    const handler = setTimeout(async () => {
      const res = await apiRequest('/api/auth/username-check', 'POST', { username });
      if (res.success) {
        setUsernameAvailable(res.available || false);
        if (res.available) {
          statusCallback('Username available', <Sparkles className="h-4.5 w-4.5 text-emerald-400" />);
        } else {
          statusCallback('Username taken', <CircleAlert className="h-4 w-4 text-rose-500" />);
        }
      }
      setCheckingUsername(false);
    }, 600);

    return () => clearTimeout(handler);
  }, [username, usernameVal, statusCallback]);

  // Real-time Email format validator
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailVal(emailRegex.test(email));
  }, [email]);

  // Slide directional helper
  const nextStep = () => {
    if (step === 0 && !nameVal) return;
    if (step === 1 && (!usernameVal || !usernameAvailable)) return;
    if (step === 2 && !emailVal) return;
    
    setDirection(1);
    setStep((prev) => prev + 1);
    statusCallback(`Step ${step + 2}`);
  };

  const prevStep = () => {
    setDirection(-1);
    setStep((prev) => prev - 1);
    statusCallback(`Step ${step}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameVal || !usernameVal || !usernameAvailable || !emailVal || !passwordValid) {
      statusCallback('Validation failed');
      return;
    }

    setSubmitting(true);
    statusCallback('Creating account...', <Loader2 className="h-4.5 w-4.5 text-indigo-400 animate-spin" />);

    const res = await apiRequest('/api/auth/register', 'POST', {
      fullName,
      username,
      email,
      password,
    });

    if (res.success) {
      statusCallback('Account created successfully', <CircleCheck className="h-4.5 w-4.5 text-emerald-400 animate-bounce" />);
      
      // Store local authentication cache for effortless simulated logins later
      localStorage.setItem('nexus_saved_identity', JSON.stringify({
        identifier: email,
        username,
        secretCode: password
      }));

      setTimeout(() => {
        onRegisterSuccess(res.data.token, res.data.user, res.data.sessions);
        setSubmitting(false);
      }, 1500);
    } else {
      statusCallback('Registration failed', <CircleAlert className="h-4 w-4 text-rose-500" />);
      alert(res.message);
      setSubmitting(false);
    }
  };

  // Elastic horizontal transition spring config
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '105%' : '-105%',
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 350, damping: 30 },
        opacity: { duration: 0.2 },
      },
    },
    exit: (dir: number) => ({
      x: dir < 0 ? '105%' : '-105%',
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: 'spring', stiffness: 350, damping: 30 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  return (
    <div id="register_screen_container" className={`flex-1 flex flex-col items-center justify-center p-3 md:p-4 h-full overflow-y-auto no-scrollbar font-sans select-none ${
      isLight ? 'text-slate-800' : 'text-white'
    }`}>
      
      <div className={`w-full max-w-[316px] rounded-2xl p-4 md:p-5 space-y-3.5 backdrop-blur-md shadow-2xl flex flex-col justify-between my-auto border transition-all ${
        isLight
          ? 'bg-white/80 border-slate-200/70 shadow-slate-200/40' 
          : 'bg-neutral-950/60 border-neutral-900/50'
      }`}>
        
        {/* Title / Logo Header */}
        <div className="text-center space-y-1 pt-0.5">
          <div className="flex justify-center mb-1">
            <div className={`p-1.5 border rounded-xl ${
              isLight ? 'bg-indigo-50 border-indigo-200/60' : 'bg-indigo-500/10 border border-indigo-500/20'
            }`}>
              <User className={`h-5 w-5 animate-pulse ${isLight ? 'text-indigo-650' : 'text-indigo-400'}`} />
            </div>
          </div>
          <h2 className={`text-lg font-sans font-semibold tracking-tight leading-none ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            Create Account
          </h2>
          <p className={`text-[11px] font-sans tracking-wide ${
            isLight ? 'text-slate-500' : 'text-neutral-400'
          }`}>
            Step {step + 1} of 4 • {step === 0 ? "Profile" : step === 1 ? "Handle" : step === 2 ? "Contact" : "Security"}
          </p>
        </div>

        {/* Progress Dots Bar */}
        <div className="flex items-center justify-center gap-1.5 py-0.5">
          {[0, 1, 2, 3].map((idx) => {
            const isActive = idx === step;
            const isCompleted = idx < step;
            return (
              <div
                key={idx}
                className={`h-1 w-6 rounded-full duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                    : isCompleted
                    ? 'bg-indigo-600'
                    : isLight ? 'bg-slate-200' : 'bg-neutral-900'
                }`}
              />
            );
          })}
        </div>

        {/* SWIPE VIEWER PORT */}
        <div className="relative overflow-hidden min-h-[190px] flex flex-col justify-center">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            {step === 0 && (
              <motion.div
                key="step-name"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-4 text-left w-full h-fit flex flex-col justify-center"
              >
                <div className="space-y-1 text-center font-sans">
                  <h3 className={`text-sm font-sans font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Enter your Name
                  </h3>
                  <p className={`text-xs leading-relaxed font-sans ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    Please provide your name to start your profile.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-xs font-medium pl-1 ${isLight ? 'text-slate-600' : 'text-neutral-300'}`}>
                    Full Name
                  </label>
                  <div id="full_name_input_row" className="relative">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Carter"
                      autoFocus
                      className={`w-full border block h-9 pl-9 pr-3.5 rounded-lg text-xs transition-style font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                        isLight
                          ? 'bg-slate-50/70 border-slate-200/80 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-505'
                          : 'bg-neutral-950/50 border border-neutral-800/85 text-white placeholder-neutral-600 focus:ring-1 focus:ring-indigo-500'
                      }`}
                    />
                    {fullName.trim().length > 0 && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {nameVal ? (
                          <Check className="h-4 w-4 text-emerald-500 font-bold" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step-username"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-4 text-left w-full h-fit flex flex-col justify-center"
              >
                <div className="space-y-1 text-center font-sans">
                  <h3 className={`text-sm font-sans font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Choose a Username
                  </h3>
                  <p className={`text-xs leading-relaxed font-sans ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    Pick a unique username for your handle.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-xs font-medium pl-1 ${isLight ? 'text-slate-600' : 'text-neutral-300'}`}>
                    Username
                  </label>
                  <div className="relative">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="e.g. alex_carter"
                      autoFocus
                      className={`w-full border block h-9 pl-9 pr-11 rounded-lg text-xs transition-style font-sans focus:outline-none focus:ring-1 focus:ring-indigo-555 ${
                        isLight
                          ? 'bg-slate-50/70 border-slate-200/80 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
                          : 'bg-neutral-950/50 border border-neutral-800/85 text-white placeholder-neutral-600 focus:ring-1 focus:ring-indigo-500'
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                      {checkingUsername ? (
                        <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
                      ) : usernameAvailable === true ? (
                        <Check className="h-4 w-4 text-emerald-500 font-bold" />
                      ) : usernameAvailable === false ? (
                        <span className="text-[10px] font-bold text-rose-500 select-none">TAKEN</span>
                      ) : username.trim().length > 0 ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                      ) : null}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-email"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-4 text-left w-full h-fit flex flex-col justify-center"
              >
                <div className="space-y-1 text-center font-sans">
                  <h3 className={`text-sm font-sans font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Enter your Email
                  </h3>
                  <p className={`text-xs leading-relaxed font-sans ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    Add your email for registration.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-xs font-medium pl-1 ${isLight ? 'text-slate-600' : 'text-neutral-300'}`}>
                    Email Address
                  </label>
                  <div className="relative">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. name@provider.com"
                      autoFocus
                      className={`w-full border block h-9 pl-9 pr-3.5 rounded-lg text-xs transition-style font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                        isLight
                          ? 'bg-slate-50/70 border-slate-200/80 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
                          : 'bg-neutral-950/50 border border-neutral-800/85 text-white placeholder-neutral-600 focus:ring-1 focus:ring-indigo-505'
                      }`}
                    />
                    {email.trim().length > 0 && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {emailVal ? (
                          <Check className="h-4 w-4 text-emerald-500 font-bold" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step-password"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-4 text-left w-full h-fit flex flex-col justify-center"
              >
                <div className="space-y-1 text-center font-sans">
                  <h3 className={`text-sm font-sans font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Create a Password
                  </h3>
                  <p className={`text-xs leading-relaxed font-sans ${isLight ? 'text-slate-505' : 'text-neutral-450'}`}>
                    Choose a strong, secure password.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-xs font-medium pl-1 ${isLight ? 'text-slate-655' : 'text-neutral-300'}`}>
                    Password
                  </label>
                  <div className="relative">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                      <Key className="h-4 w-4" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoFocus
                      className={`w-full border block h-9 pl-9 pr-8.5 rounded-lg text-xs transition-style font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                        isLight
                          ? 'bg-slate-50/70 border-slate-200 text-slate-905 focus:border-indigo-500'
                          : 'bg-neutral-950/50 border border-neutral-800/85 text-white focus:ring-1 focus:ring-indigo-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors ${
                        isLight ? 'text-slate-400 hover:text-slate-750' : 'text-neutral-500 hover:text-white'
                      }`}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Criteria checklist */}
                <div className={`p-2.5 rounded-xl space-y-1 border ${
                  isLight
                    ? 'bg-slate-50/90 border-slate-200 text-slate-600'
                    : 'bg-neutral-950 bg-opacity-80 border-neutral-900 text-neutral-450'
                }`}>
                  <div className={`text-[9.5px] uppercase tracking-wide font-bold border-b pb-1 flex items-center justify-between ${
                    isLight ? 'border-slate-150 text-slate-500' : 'border-neutral-900/50 text-neutral-450'
                  }`}>
                    <span>STRENGTH</span>
                    <span className={passwordValid ? 'text-emerald-555 font-bold' : isLight ? 'text-slate-400' : 'text-neutral-550'}>
                      {passwordValid ? 'STRONG' : 'WEAK'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1 font-sans">
                    <span className={`flex items-center gap-1 ${passLong ? 'text-emerald-555 font-semibold' : isLight ? 'text-slate-400' : 'text-neutral-550'}`}>
                      <span>•</span> 8+ chars
                    </span>
                    <span className={`flex items-center gap-1 ${passUpper ? 'text-emerald-555 font-semibold' : isLight ? 'text-slate-400' : 'text-neutral-550'}`}>
                      <span>•</span> Uppercase
                    </span>
                    <span className={`flex items-center gap-1 ${passLower ? 'text-emerald-555 font-semibold' : isLight ? 'text-slate-400' : 'text-neutral-550'}`}>
                      <span>•</span> Lowercase
                    </span>
                    <span className={`flex items-center gap-1 ${passDigit ? 'text-emerald-555 font-semibold' : isLight ? 'text-slate-400' : 'text-neutral-550'}`}>
                      <span>•</span> Digit
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action triggers */}
        <div className={`flex items-center gap-2 pt-2 border-t ${isLight ? 'border-slate-150' : 'border-neutral-900/65'}`}>
          {step > 0 ? (
            <button
              type="button"
              onClick={prevStep}
              className={`flex-1 h-9 border text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                isLight
                  ? 'bg-slate-100 border-slate-200 hover:bg-slate-205 text-slate-700'
                  : 'bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white'
              }`}
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onNavigateToLogin}
              className={`flex-1 h-9 border text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                isLight
                  ? 'bg-slate-50 border-slate-205 hover:bg-slate-100 text-slate-705'
                  : 'bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white'
              }`}
            >
              Sign In
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              disabled={
                step === 0 ? !nameVal :
                step === 1 ? (!usernameVal || !usernameAvailable) :
                !emailVal
              }
              onClick={nextStep}
              className={`flex-1 h-9 bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-950/40 text-white text-xs font-semibold rounded-lg tracking-wide flex items-center justify-center gap-1 cursor-pointer transition-all ${
                isLight
                  ? 'disabled:bg-slate-100/50 disabled:text-slate-400'
                  : 'disabled:bg-neutral-900 disabled:text-neutral-600 disabled:border-transparent'
              }`}
            >
              Next <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !passwordValid}
              className={`flex-1 h-9 bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-950/40 text-white text-xs font-semibold rounded-lg tracking-wide flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                isLight
                  ? 'disabled:bg-slate-100/50 disabled:text-slate-400'
                  : 'disabled:bg-neutral-900 disabled:text-neutral-600 disabled:border-transparent'
              }`}
            >
              {submitting ? (
                <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Register'
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
