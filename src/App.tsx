import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, LogIn, Cpu, UserX, Fingerprint, Eye, Globe } from 'lucide-react';

import DeviceMockup from './components/DeviceMockup';
import ParticleBackground from './components/ParticleBackground';
import LoginView from './components/LoginView';
import RegisterFlow from './components/RegisterFlow';
import DashboardView from './components/DashboardView';
import { UserProfile, UserSession } from './types';
import { apiRequest } from './utils';

export default function App() {
  // Authentication states
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);

  // Navigation states: 'launcher' | 'login' | 'register' | 'dashboard'
  const [screen, setScreen] = useState<'launcher' | 'login' | 'register' | 'dashboard'>('launcher');

  // Unified theme tracking state
  const [activeTheme, setActiveTheme] = useState<'cyberpunk' | 'neon' | 'glass-dark' | 'glass-light'>('glass-dark');

  // Dynamic Island status text display
  const [sysStatusText, setSysStatusText] = useState<string>('');
  const [sysStatusIcon, setSysStatusIcon] = useState<React.ReactNode | null>(null);

  // Stored local authentication properties
  const [hasSavedProfile, setHasSavedProfile] = useState(false);

  // Trigger dynamic island message notifications
  const triggerSystemAlert = (text: string, icon?: React.ReactNode) => {
    setSysStatusText(text);
    if (icon) setSysStatusIcon(icon);
    
    // Auto clear after 4 seconds
    const timer = setTimeout(() => {
      setSysStatusText('');
      setSysStatusIcon(null);
    }, 4000);
    return () => clearTimeout(timer);
  };

  // On page mount, check for existing sessions
  useEffect(() => {
    const localToken = localStorage.getItem('nexus_auth_token');
    const localUser = localStorage.getItem('nexus_auth_user');
    
    // Check if biometric fast profile holds credentials
    const bioId = localStorage.getItem('nexus_saved_identity');
    if (bioId) {
      setHasSavedProfile(true);
    }

    // Retrieve saved visual environment theme
    const savedTheme = localStorage.getItem('nexus_app_theme');
    if (savedTheme) {
      setActiveTheme(savedTheme as any);
    }

    if (localToken && localUser) {
      try {
        setToken(localToken);
        const parsedUser = JSON.parse(localUser);
        setUser(parsedUser);
        if (parsedUser.theme) {
          setActiveTheme(parsedUser.theme);
        }
        setScreen('dashboard');
        triggerSystemAlert('session resumed', <Shield className="h-4 w-4 text-emerald-400" />);
      } catch (e) {
        localStorage.removeItem('nexus_auth_token');
        localStorage.removeItem('nexus_auth_user');
      }
    } else {
      triggerSystemAlert('matrix offline', <Globe className="h-4 w-4 text-rose-500 animate-pulse" />);
    }
  }, []);

  const handleLoginSuccess = (newToken: string, newUser: UserProfile, newSessions: UserSession[]) => {
    setToken(newToken);
    setUser(newUser);
    setSessions(newSessions);
    if (newUser.theme) {
      setActiveTheme(newUser.theme);
      localStorage.setItem('nexus_app_theme', newUser.theme);
    }
    setScreen('dashboard');

    localStorage.setItem('nexus_auth_token', newToken);
    localStorage.setItem('nexus_auth_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setSessions([]);
    setScreen('launcher');

    localStorage.removeItem('nexus_auth_token');
    localStorage.removeItem('nexus_auth_user');
    triggerSystemAlert('node terminated', <UserX className="h-4 w-4 text-rose-500" />);
  };

  // Determine container theme background classes
  const getThemeClasses = () => {
    if (user?.highContrast) {
      return 'bg-neutral-950 font-sans';
    }
    const theme = activeTheme;
    if (theme === 'cyberpunk') {
      return 'bg-slate-950 text-pink-50 border-pink-500/20 font-sans';
    }
    if (theme === 'neon') {
      return 'bg-neutral-950 text-emerald-100 border-emerald-500/20 font-sans';
    }
    if (theme === 'glass-light') {
      return 'bg-slate-100 text-neutral-905 font-sans';
    }
    return 'bg-slate-950 text-white font-sans';
  };

  return (
    <div className={`min-h-screen text-center transition-colors duration-500 relative flex flex-col justify-center items-center overflow-x-hidden ${getThemeClasses()}`}>
      
      {/* GLOBAL MATRIX PARTICLE GRID (Respected across layouts) */}
      <ParticleBackground
        reducedMotion={user?.reducedMotion}
        theme={activeTheme}
      />

      {/* CORE DEVICE FRAME CONTAINER */}
      <DeviceMockup
        theme={activeTheme}
        highContrast={user?.highContrast}
        statusText={sysStatusText}
        statusIcon={sysStatusIcon}
      >
        <AnimatePresence mode="wait">
          
          {/* SCREEN 1: LAUNCH RECRUITER GATE */}
          {screen === 'launcher' && (
            <motion.div
              key="launcher-screen"
              initial={user?.reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={user?.reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className={`flex-1 flex flex-col justify-between h-full ${activeTheme === 'glass-light' ? 'text-slate-800' : 'text-white'}`}
            >
              {/* TOP HEADER ROW: Move access buttons to top right, setting width to fit only the texts */}
              <div className={`flex items-center justify-between w-full h-14 border-b px-4 md:px-6 select-none shrink-0 ${
                activeTheme === 'glass-light' 
                  ? 'border-indigo-150/50 bg-white/20' 
                  : 'border-neutral-900/40 bg-neutral-950/10'
              }`}>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-indigo-500" />
                  <span className={`text-[10px] font-sans font-bold tracking-widest uppercase ${
                    activeTheme === 'glass-light' ? 'text-indigo-900/80' : 'text-neutral-450'
                  }`}>AVX GATEWAY</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setScreen('login');
                      triggerSystemAlert('handshake ready');
                    }}
                    className={`h-8.5 px-3.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap font-sans ${
                      activeTheme === 'glass-light'
                        ? 'bg-slate-200/80 border border-slate-300 text-slate-755 hover:bg-slate-200 hover:text-slate-900'
                        : 'bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white'
                    }`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScreen('register');
                      triggerSystemAlert('register step 1');
                    }}
                    className="h-8.5 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap font-sans shadow-md shadow-indigo-500/10"
                  >
                    Register
                  </button>
                </div>
              </div>

              {/* Giant rotating portal & aVx title */}
              <div className="flex-1 flex flex-col justify-center items-center select-none pb-12 w-full">
                <div className="flex flex-row items-center justify-center gap-6">
                  <div className="relative">
                    {/* Outer glowing pulsing orb */}
                    <div className="absolute w-40 h-40 rounded-full border border-indigo-500/20 animate-pulse bg-gradient-to-tr from-indigo-500/5 to-cyan-500/5 blur-xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    
                    {/* Orbit paths */}
                    <div className={`relative w-28 h-28 rounded-full border flex items-center justify-center shadow-2xl z-10 ${
                      activeTheme === 'glass-light' ? 'border-slate-300/60 bg-white/40 shadow-slate-200/40' : 'border-neutral-900 bg-neutral-950/20'
                    }`}>
                      <div className="absolute inset-0.5 rounded-full border-2 border-indigo-500/10 border-t-indigo-500 animate-spin" style={{ animationDuration: '3s' }} />
                      <div className="absolute inset-1.5 rounded-full border border-dashed border-cyan-405/20 border-b-cyan-500 rotate-180 animate-spin" style={{ animationDuration: '6s' }} />
                      
                      <Shield className="h-10 w-10 text-indigo-550 drop-shadow-[0_0_15px_rgba(99,102,241,0.4)]" />
                    </div>
                  </div>

                  <div className="text-left z-10 flex flex-col justify-center font-sans">
                    <h3 className={`text-4xl font-extrabold font-sans tracking-tight bg-gradient-to-r bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(99,102,241,0.25)] ${
                      activeTheme === 'glass-light'
                        ? 'from-indigo-900 via-indigo-600 to-cyan-600'
                        : 'from-white via-indigo-150 to-indigo-400'
                    }`}>
                      aVx
                    </h3>
                    <p className={`text-[10px] font-sans uppercase tracking-widest mt-1 ${
                      activeTheme === 'glass-light' ? 'text-slate-500/80' : 'text-neutral-500'
                    }`}>
                      Secure Entry
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* SCREEN 2: MULTI-STEP CREATION CONTROL */}
          {screen === 'register' && (
            <motion.div
              key="register-screen"
              initial={user?.reducedMotion ? { opacity: 1 } : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={user?.reducedMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-grow flex flex-col h-full"
            >
              <RegisterFlow
                theme={activeTheme}
                onRegisterSuccess={handleLoginSuccess}
                onNavigateToLogin={() => {
                  setScreen('login');
                  triggerSystemAlert('handshake loaded');
                }}
                statusCallback={triggerSystemAlert}
                reducedMotion={user?.reducedMotion}
              />
            </motion.div>
          )}

          {/* SCREEN 3: HANDSHAKE LOGIN DECRYPTER */}
          {screen === 'login' && (
            <motion.div
              key="login-screen"
              initial={user?.reducedMotion ? { opacity: 1 } : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={user?.reducedMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex-grow flex flex-col h-full"
            >
              <LoginView
                theme={activeTheme}
                onLoginSuccess={handleLoginSuccess}
                onNavigateToRegister={() => {
                  setScreen('register');
                  triggerSystemAlert('register init');
                }}
                statusCallback={triggerSystemAlert}
                reducedMotion={user?.reducedMotion}
              />
            </motion.div>
          )}

          {/* SCREEN 4: SECURED USER VAULT PORTAL */}
          {screen === 'dashboard' && user && token && (
            <motion.div
              key="dashboard-screen"
              initial={user?.reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={user?.reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="flex-grow flex flex-col h-full"
            >
              <DashboardView
                user={user}
                token={token}
                initialSessions={sessions}
                onLogout={handleLogout}
                onUpdateUser={(updated) => {
                  setUser(updated);
                  localStorage.setItem('nexus_auth_user', JSON.stringify(updated));
                }}
                statusCallback={triggerSystemAlert}
                reducedMotion={user?.reducedMotion}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </DeviceMockup>

    </div>
  );
}
