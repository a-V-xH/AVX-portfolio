import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Mail, Key, Fingerprint, Github, Facebook, RotateCcw, ArrowRight, Eye, EyeOff, Sparkles, LogIn, CircleCheck, Compass } from 'lucide-react';
import { apiRequest } from '../utils';
import { UserProfile, UserSession } from '../types';

interface LoginViewProps {
  onLoginSuccess: (token: string, user: UserProfile, sessions: UserSession[]) => void;
  onNavigateToRegister: () => void;
  statusCallback: (text: string, icon?: React.ReactNode) => void;
  reducedMotion?: boolean;
  theme?: string;
}

export default function LoginView({
  onLoginSuccess,
  onNavigateToRegister,
  statusCallback,
  reducedMotion = false,
  theme = 'glass-dark',
}: LoginViewProps) {
  const isLight = theme === 'glass-light';
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Social overlay
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  // MFA second-factor overlay
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);

  // Recovery overlay
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySentCode, setRecoverySentCode] = useState<string | null>(null);
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  // System check hook
  useEffect(() => {
    // Active connection check
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorText('Please enter your email or username and password.');
      return;
    }

    setLoading(true);
    setErrorText(null);
    statusCallback('Connecting...', <Shield className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />);

    const res = await apiRequest('/api/auth/login', 'POST', { identifier, password });

    if (res.success) {
      if (res.mfaRequired) {
        statusCallback('2FA Required', <Key className="h-4.5 w-4.5 text-rose-400" />);
        setMfaRequired(true);
        setMfaToken(res.tempToken || '');
        setLoading(false);
      } else {
        statusCallback('Access granted', <CircleCheck className="h-4.5 w-4.5 text-emerald-400 animate-bounce" />);
        // Store for biometric sim next run
        localStorage.setItem('nexus_saved_identity', JSON.stringify({
          identifier: res.data.user.email,
          username: res.data.user.username,
          secretCode: password // stored locally for biometric loop
        }));
        
        // Wait briefly for cinematic effect
        setTimeout(() => {
          onLoginSuccess(res.data.token, res.data.user, res.data.sessions);
          setLoading(false);
        }, 800);
      }
    } else {
      statusCallback('Access denied', <Shield className="h-4.5 w-4.5 text-rose-500" />);
      setErrorText(res.message);
      setLoading(false);
    }
  };

  const handleMfaVerify = async () => {
    if (mfaCode.length !== 6) {
      setErrorText('Verification code must contain exactly 6 digits.');
      return;
    }

    setMfaLoading(true);
    setErrorText(null);
    statusCallback('Verifying...');

    const res = await apiRequest('/api/auth/mfa/verify', 'POST', {
      code: mfaCode,
      tempToken: mfaToken,
    });

    if (res.success) {
      statusCallback('Verified', <CircleCheck className="h-4 w-4 text-emerald-400" />);
      setTimeout(() => {
        onLoginSuccess(res.data.token, res.data.user, res.data.sessions);
        setMfaLoading(false);
        setMfaRequired(false);
      }, 800);
    } else {
      setErrorText(res.message);
      setMfaLoading(false);
    }
  };



  const handleSocialLogin = async (provider: string) => {
    setSocialLoading(provider);
    statusCallback(`Connecting with ${provider}...`);

    setTimeout(async () => {
      // Simulate OAuth response creating real user account
      const socialId = 'oauth_id_' + Math.random().toString(36).substr(2, 9);
      const email = `test_${provider}_${Math.floor(Math.random() * 900)}@avx.io`;
      const name = `${provider.toUpperCase()} User`;

      const res = await apiRequest('/api/auth/social-login', 'POST', {
        provider,
        email,
        name,
        socialId,
      });

      if (res.success) {
        statusCallback('Logged in', <CircleCheck className="h-4 w-4 text-emerald-400 animate-bounce" />);
        onLoginSuccess(res.data.token, res.data.user, res.data.sessions);
      } else {
        setErrorText(res.message);
      }
      setSocialLoading(null);
    }, 1500);
  };

  const handleRequestRecovery = async () => {
    if (!recoveryEmail) {
      setErrorText('Please enter your email address.');
      return;
    }
    setRecoveryLoading(true);
    statusCallback('Sending recovery email...');

    const res = await apiRequest('/api/auth/forgot-password', 'POST', { email: recoveryEmail });
    if (res.success) {
      setRecoverySentCode(res.data?.resetToken || 'MOCK_RESET_CODE_99');
      statusCallback('Recovery code sent');
    } else {
      setErrorText(res.message);
    }
    setRecoveryLoading(false);
  };

  const handleCompleteReset = async () => {
    if (recoveryCodeInput !== recoverySentCode) {
      setErrorText('Invalid verification code.');
      return;
    }
    if (recoveryNewPassword.length < 8) {
      setErrorText('Enter a new password (8+ characters).');
      return;
    }

    setRecoveryLoading(true);
    const res = await apiRequest('/api/auth/reset-password', 'POST', {
      email: recoveryEmail,
      resetToken: recoveryCodeInput,
      newPassword: recoveryNewPassword,
    });

    if (res.success) {
      setRecoverySuccess(true);
      setErrorText(null);
      statusCallback('Password reset');
      setTimeout(() => {
        setShowRecovery(false);
        setRecoverySuccess(false);
        setRecoverySentCode(null);
        setIdentifier(recoveryEmail);
      }, 2000);
    } else {
      setErrorText(res.message);
    }
    setRecoveryLoading(false);
  };

  return (
    <div id="login_screen_container" className={`flex-1 flex flex-col items-center justify-center p-3 md:p-4 h-full overflow-y-auto no-scrollbar font-sans select-none ${
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
              <Shield className={`h-5 w-5 animate-pulse ${isLight ? 'text-indigo-650' : 'text-indigo-400'}`} />
            </div>
          </div>
          <h2 className={`text-lg font-sans font-semibold tracking-tight leading-none ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            Welcome Back
          </h2>
          <p className={`text-[11px] font-sans tracking-wide ${
            isLight ? 'text-slate-500' : 'text-neutral-400'
          }`}>
            Sign in to manage your account
          </p>
        </div>

        {/* ERROR ANCHOR */}
        <AnimatePresence>
          {errorText && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-2.5 rounded-xl border text-[10.5px] font-sans text-left flex items-start gap-2 ${
                isLight
                  ? 'border-rose-200 bg-rose-50 text-rose-800'
                  : 'border-rose-500/20 bg-rose-950/20 text-rose-300'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse mt-1 flex-shrink-0" />
              <span>{errorText}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CORE INTERACTIVES */}
        <AnimatePresence mode="wait">
          {!mfaRequired && !showRecovery ? (
            <motion.form
              key="login-form"
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 10 }}
              onSubmit={handleLogin}
              className="space-y-3.5"
            >
              <div className="space-y-2.5 text-left">
                {/* Username/Email Input */}
                <div className="space-y-1">
                  <label className={`text-[11px] font-medium pl-0.5 ${
                    isLight ? 'text-slate-600' : 'text-neutral-350'
                  }`}>
                    Email or Username
                  </label>
                  <div className="relative">
                    <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                      <Mail className="h-3.5 w-3.5" />
                    </span>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Enter email or username"
                      disabled={loading}
                      className={`w-full border block h-9 pl-9.5 pr-3.5 rounded-lg text-xs transition-all font-sans focus:outline-none focus:ring-1 ${
                        isLight
                          ? 'bg-slate-50/70 border-slate-200/80 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500'
                          : 'bg-neutral-950/50 border border-neutral-800/80 text-white placeholder-neutral-600 focus:ring-1 focus:ring-indigo-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between pl-0.5">
                    <label className={`text-[11px] font-medium ${
                      isLight ? 'text-slate-600' : 'text-neutral-350'
                    }`}>
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowRecovery(true)}
                      className={`text-[10.5px] focus:outline-none transition-colors ${
                        isLight ? 'text-indigo-600 hover:text-indigo-800 font-semibold' : 'text-indigo-400 hover:text-indigo-300'
                      }`}
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                      <Key className="h-3.5 w-3.5" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                      className={`w-full border block h-9 pl-9.5 pr-10 rounded-lg text-xs transition-all font-sans focus:outline-none focus:ring-1 ${
                        isLight
                          ? 'bg-slate-50/70 border-slate-200/80 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500'
                          : 'bg-neutral-950/50 border border-neutral-800/80 text-white focus:ring-1 focus:ring-indigo-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 transition-colors ${
                        isLight ? 'text-slate-400 hover:text-slate-700' : 'text-neutral-500 hover:text-white'
                      }`}
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action triggers */}
              <div className="space-y-2 pt-1">
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-9.5 bg-indigo-600 hover:bg-indigo-500 active:translate-y-0.5 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20 transition-all font-sans"
                >
                  {loading ? (
                    <span className="inline-block h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Sign In <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </motion.button>
              </div>
            </motion.form>
          ) : mfaRequired ? (
            /* MFA GATE SCREEN */
            <motion.div
              key="mfa-form"
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              className="space-y-4 text-center"
            >
              <div className="flex justify-center">
                <div className={`p-3 border rounded-full ${
                  isLight ? 'bg-rose-50 border-rose-200' : 'bg-rose-500/10 border border-rose-500/20'
                }`}>
                  <Fingerprint className={`h-7 w-7 animate-pulse ${isLight ? 'text-rose-600' : 'text-rose-450'}`} />
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Two-Factor Authentication</h3>
                <p className={`text-[11px] font-sans ${isLight ? 'text-slate-505' : 'text-neutral-400'}`}>
                  Enter the secondary verification code to authenticate your session.
                </p>
              </div>

              <div className="space-y-1.5 text-left">
                <label className={`text-xs font-medium pl-1 ${isLight ? 'text-slate-600' : 'text-neutral-300'}`}>
                  Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000 000"
                  className={`w-full text-center tracking-widest block h-10 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-rose-500 border ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-rose-505' 
                      : 'bg-neutral-950/60 border border-neutral-800 text-white'
                  }`}
                />
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleMfaVerify}
                  disabled={mfaLoading || mfaCode.length !== 6}
                  className="w-full h-10 bg-rose-600 hover:bg-rose-505 text-white rounded-xl text-xs font-semibold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shadow-rose-500/10"
                >
                  {mfaLoading ? (
                    <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Verify Code'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMfaRequired(false);
                    setErrorText(null);
                  }}
                  className={`text-xs font-semibold transition-colors ${
                    isLight ? 'text-slate-500 hover:text-slate-800' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : (
            /* PASSWORD RECOVERY SCREEN */
            <motion.div
              key="recovery-form"
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              className="space-y-4 text-left"
            >
              <div className={`flex items-center gap-2 border-b pb-2 ${isLight ? 'border-slate-150' : 'border-neutral-800'}`}>
                <RotateCcw className="h-4 w-4 text-amber-500 animate-spin animate-spin-gradient" style={{ animationDuration: '8s' }} />
                <h3 className={`font-sans font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Reset Password
                </h3>
              </div>

              {!recoverySentCode ? (
                <div className="space-y-3">
                  <p className={`text-xs leading-normal font-sans ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    Enter your email address and we'll send a temporary code to reset your password.
                  </p>
                  <div className="space-y-1">
                    <label className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-neutral-300'}`}>Email Address</label>
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="user@provider.com"
                      className={`w-full border block h-10 px-3 rounded-xl text-xs transition-style font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                        isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
                          : 'bg-neutral-950/60 border border-neutral-800 text-white'
                      }`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestRecovery}
                    disabled={recoveryLoading}
                    className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl tracking-wider flex items-center justify-center cursor-pointer transition-all shadow-md shadow-indigo-500/10"
                  >
                    {recoveryLoading ? 'Sending...' : 'Send Recovery Code'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recoverySuccess ? (
                    <div className={`text-center p-4 rounded-xl space-y-1 my-2 border ${
                      isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
                    }`}>
                      <CircleCheck className="h-8 w-8 text-emerald-500 mx-auto animate-bounce" />
                      <h4 className="font-bold text-xs">Password Changed</h4>
                      <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>Logging in to your account...</p>
                    </div>
                  ) : (
                    <>
                      <div className={`p-2.5 border border-dashed rounded-xl mb-2 text-xs flex justify-between items-center font-sans ${
                        isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-indigo-950/50 border-indigo-900 text-indigo-300'
                      }`}>
                        <span>RECOVERY CODE:</span>
                        <strong className={`px-2 py-0.5 border rounded select-all animate-pulse tracking-wider font-mono ${
                          isLight ? 'bg-indigo-100 border-indigo-300 text-indigo-950' : 'bg-indigo-950 border border-indigo-500/30 text-white'
                        }`}>
                          {recoverySentCode}
                        </strong>
                      </div>

                      <div className="space-y-1">
                        <label className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-neutral-300'}`}>Recovery Code</label>
                        <input
                          type="text"
                          value={recoveryCodeInput}
                          onChange={(e) => setRecoveryCodeInput(e.target.value)}
                          placeholder="Enter code"
                          className={`w-full border h-9 px-3 rounded-xl text-xs focus:outline-none transition-all font-sans ${
                            isLight
                              ? 'bg-slate-55 border-slate-200 text-slate-900 focus:border-indigo-500'
                              : 'bg-neutral-950/65 border border-neutral-800 text-white focus:border-indigo-500'
                          }`}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-neutral-300'}`}>New Password</label>
                        <input
                          type="password"
                          value={recoveryNewPassword}
                          onChange={(e) => setRecoveryNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className={`w-full border h-9 px-3 rounded-xl text-xs focus:outline-none transition-all font-sans ${
                            isLight
                              ? 'bg-slate-55 border-slate-200 text-slate-900 focus:border-indigo-500'
                              : 'bg-neutral-950/65 border border-neutral-800 text-white focus:border-indigo-500'
                          }`}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleCompleteReset}
                        disabled={recoveryLoading || !recoveryCodeInput || !recoveryNewPassword}
                        className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl tracking-wider flex items-center justify-center mt-2 cursor-pointer transition-all shadow-sm shadow-emerald-500/10"
                      >
                        {recoveryLoading ? 'Updating...' : 'Update Password'}
                      </button>
                    </>
                  )}
                </div>
              )}

              <div className="text-center pt-1 animate-fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setShowRecovery(false);
                    setRecoverySentCode(null);
                    setErrorText(null);
                  }}
                  className={`text-xs font-semibold transition-colors ${
                    isLight ? 'text-slate-500 hover:text-slate-800' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Back to Sign In
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FOOTER & SOCIAL LOGINS */}
        <AnimatePresence>
          {!showRecovery && !mfaRequired && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`space-y-3 pt-3 border-t ${isLight ? 'border-slate-150' : 'border-neutral-900'}`}
            >
              {/* Branded Social Connections */}
              <div className="space-y-2">
                <span className={`text-[10px] uppercase tracking-widest block text-center font-sans font-semibold ${
                  isLight ? 'text-slate-400' : 'text-neutral-500'
                }`}>
                  Or sign in with
                </span>
                <div className="flex items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('github')}
                    disabled={loading || socialLoading !== null}
                    className={`p-2 rounded-xl flex items-center justify-center cursor-pointer border transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:text-indigo-650 hover:bg-slate-100 hover:border-slate-300'
                        : 'bg-neutral-900 border border-neutral-800 hover:border-neutral-500 text-neutral-305 hover:text-white'
                    }`}
                  >
                    {socialLoading === 'github' ? (
                      <span className="h-4 w-4 border border-t-transparent animate-spin rounded-full" />
                    ) : (
                      <Github className="h-4.5 w-4.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('google')}
                    disabled={loading || socialLoading !== null}
                    className={`p-2 rounded-xl flex items-center justify-center cursor-pointer border transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:text-indigo-650 hover:bg-slate-100 hover:border-slate-300'
                        : 'bg-neutral-900 border border-neutral-800 hover:border-neutral-500 text-neutral-305 hover:text-white'
                    }`}
                  >
                    {socialLoading === 'google' ? (
                      <span className="h-4 w-4 border border-t-transparent animate-spin rounded-full" />
                    ) : (
                      <span className="font-bold text-xs select-none h-4.5 w-4.5 flex items-center justify-center font-sans">G</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('facebook')}
                    disabled={loading || socialLoading !== null}
                    className={`p-2 rounded-xl flex items-center justify-center cursor-pointer border transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:text-indigo-650 hover:bg-slate-100 hover:border-slate-300'
                        : 'bg-neutral-900 border border-neutral-800 hover:border-neutral-500 text-neutral-305 hover:text-white'
                    }`}
                  >
                    {socialLoading === 'facebook' ? (
                      <span className="h-4 w-4 border border-t-transparent animate-spin rounded-full" />
                    ) : (
                      <Facebook className="h-4.5 w-4.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Pivot to Register */}
              <p className={`text-xs text-center font-sans ${isLight ? 'text-slate-500' : 'text-neutral-450'}`}>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={onNavigateToRegister}
                  className={`font-semibold ml-1 underline cursor-pointer ${
                    isLight ? 'text-indigo-605 hover:text-indigo-805' : 'text-indigo-400 hover:text-indigo-305'
                  }`}
                >
                  Sign Up
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
