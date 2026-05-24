import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, ShieldCheck, UserCheck, KeySquare, Laptop, Trash2, 
  Settings, LogOut, Loader2, Sparkles, AlertTriangle, Fingerprint, 
  CheckCircle, HelpCircle, LayoutGrid, Eye, HelpCircle as InfoIcon,
  Moon, Sun, RefreshCw, Layers, Home, Power, Bell, CreditCard,
  User, Mail, Globe, MapPin, X, Shield, Award, Check,
  Heart, MessageSquare, Plus, ExternalLink, Edit3, Camera, Copy, Compass, Upload, FolderHeart
} from 'lucide-react';
import { apiRequest } from '../utils';
import { UserProfile, UserSession, SecurityStatus } from '../types';

interface DashboardViewProps {
  user: UserProfile;
  token: string;
  initialSessions: UserSession[];
  onLogout: () => void;
  onUpdateUser: (newUser: UserProfile) => void;
  statusCallback: (text: string, icon?: React.ReactNode) => void;
  reducedMotion?: boolean;
}

interface Advice {
  title: string;
  severity: 'Low' | 'Medium' | 'High';
  impact: string;
  description: string;
}

export default function DashboardView({
  user,
  token,
  initialSessions,
  onLogout,
  onUpdateUser,
  statusCallback,
  reducedMotion = false,
}: DashboardViewProps) {
  const [sessions, setSessions] = useState<UserSession[]>(initialSessions);
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'settings'>('overview');

  // Interactive profile & account states
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(false);
  const [notifSecurity, setNotifSecurity] = useState(true);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const [editFullName, setEditFullName] = useState(user.fullName);
  const [editRecoveryEmail, setEditRecoveryEmail] = useState(user.recoveryEmail || '');
  const [editProfileSubmitting, setEditProfileSubmitting] = useState(false);

  // Creative Profile Form variables
  const [editProfessionalTitle, setEditProfessionalTitle] = useState(user.professionalTitle || '3D Visualizer & Brand Designer');
  const [editLocation, setEditLocation] = useState(user.location || 'Seattle, WA');
  const [editCoverUrl, setEditCoverUrl] = useState(user.coverUrl || 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1000&q=80');
  const [editAvatarUrl, setEditAvatarUrl] = useState(user.avatarUrl || '');
  const [editBehanceUrl, setEditBehanceUrl] = useState(user.behanceUrl || '');
  const [editArtstationUrl, setEditArtstationUrl] = useState(user.artstationUrl || '');
  const [editDribbbleUrl, setEditDribbbleUrl] = useState(user.dribbbleUrl || '');

  // Creative Project & Portfolio states
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [portfolioStatusTab, setPortfolioStatusTab] = useState<'Published' | 'Draft' | 'Collection'>('Published');
  const [portfolioCategory, setPortfolioCategory] = useState<string>('All');
  const [isPublicPreview, setIsPublicPreview] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number>(4);
  const [draggingFile, setDraggingFile] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  // Project item form editing fields
  const [projTitle, setProjTitle] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projThumbnail, setProjThumbnail] = useState('');
  const [projCategory, setProjCategory] = useState('3D Modeling');
  const [projAspectRatio, setProjAspectRatio] = useState<'4:3' | '1:1' | '16:9'>('4:3');
  const [projStatus, setProjStatus] = useState<'Published' | 'Draft' | 'Collection'>('Published');
  const [projReviewStatus, setProjReviewStatus] = useState<'Approved' | 'In Review' | 'Awaiting Feedback'>('Approved');
  const [projectFormSubmitting, setProjectFormSubmitting] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changePasswordSubmitting, setChangePasswordSubmitting] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changePasswordSuccess, setChangePasswordSuccess] = useState<string | null>(null);

  const [activeTier, setActiveTier] = useState<'Developer Sandbox' | 'Pro Defender' | 'Enterprise Operations'>('Pro Defender');
  const [terminateAllLoading, setTerminateAllLoading] = useState(false);

  // Fetch projects from DB
  const fetchProjects = async () => {
    setLoadingProjects(true);
    const res = await apiRequest('/api/projects', 'GET', null, token);
    if (res.success && res.data) {
      setProjects(res.data);
    }
    setLoadingProjects(false);
  };

  useEffect(() => {
    fetchProjects();
  }, [token]);

  useEffect(() => {
    setEditFullName(user.fullName);
    setEditRecoveryEmail(user.recoveryEmail || '');
    setEditProfessionalTitle(user.professionalTitle || '3D Visualizer & Brand Designer');
    setEditLocation(user.location || 'Seattle, WA');
    setEditCoverUrl(user.coverUrl || 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1000&q=80');
    setEditAvatarUrl(user.avatarUrl || '');
    setEditBehanceUrl(user.behanceUrl || '');
    setEditArtstationUrl(user.artstationUrl || '');
    setEditDribbbleUrl(user.dribbbleUrl || '');
  }, [user]);

  // Project action handlers
  const handleOpenNewProject = () => {
    setSelectedProject(null);
    setProjTitle('');
    setProjDesc('');
    setProjThumbnail('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80');
    setProjCategory('3D Modeling');
    setProjAspectRatio('4:3');
    setProjStatus('Published');
    setProjReviewStatus('Approved');
    setShowProjectModal(true);
  };

  const handleOpenEditProject = (p: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedProject(p);
    setProjTitle(p.title);
    setProjDesc(p.description);
    setProjThumbnail(p.thumbnailUrl);
    setProjCategory(p.tags[0] || '3D Modeling');
    setProjAspectRatio(p.aspectRatio);
    setProjStatus(p.status);
    setProjReviewStatus(p.reviewStatus || 'Approved');
    setShowProjectModal(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim()) return;

    setProjectFormSubmitting(true);
    const body = {
      title: projTitle.trim(),
      description: projDesc.trim(),
      thumbnailUrl: projThumbnail,
      aspectRatio: projAspectRatio,
      tags: [projCategory],
      status: projStatus,
      reviewStatus: projReviewStatus,
    };

    if (selectedProject) {
      statusCallback('Saving portfolio assets...');
      const res = await apiRequest(`/api/projects/${selectedProject.id}`, 'PUT', body, token);
      if (res.success && res.data) {
        setProjects(prev => prev.map(p => p.id === selectedProject.id ? res.data : p));
        statusCallback('Asset synchronized', <CheckCircle className="h-4 w-4 text-emerald-400" />);
        setShowProjectModal(false);
      } else {
        statusCallback('Sync failed');
      }
    } else {
      statusCallback('Creating draft canvas...');
      const res = await apiRequest('/api/projects', 'POST', body, token);
      if (res.success && res.data) {
        setProjects(prev => [res.data, ...prev]);
        statusCallback('Project published to list', <CheckCircle className="h-4 w-4 text-emerald-400" />);
        setShowProjectModal(false);
      } else {
        statusCallback('Creation failed');
      }
    }
    setProjectFormSubmitting(false);
  };

  const handleDuplicateProject = async (projId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    statusCallback('Duplicating active matrix...');
    const res = await apiRequest(`/api/projects/${projId}/duplicate`, 'POST', null, token);
    if (res.success && res.data) {
      setProjects(prev => [res.data, ...prev]);
      statusCallback('Asset cloned successfully', <CheckCircle className="h-4 w-4 text-emerald-400" />);
    } else {
      statusCallback('Duplication link failed');
    }
  };

  const handleDeleteProject = async (projId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    statusCallback('Purging creative asset...');
    const res = await apiRequest(`/api/projects/${projId}`, 'DELETE', null, token);
    if (res.success) {
      setProjects(prev => prev.filter(p => p.id !== projId));
      statusCallback('Asset purged from space', <CheckCircle className="h-4 w-4 text-emerald-450" />);
    } else {
      statusCallback('Purge failed');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggingFile(true);
  };

  const handleDragLeave = () => {
    setDraggingFile(false);
  };

  const handleDropFile = async (e: React.DragEvent) => {
    e.preventDefault();
    setDraggingFile(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      statusCallback(`Ingesting local file structure: ${file.name}`);
      
      let category = 'Branding';
      if (file.name.endsWith('.obj') || file.name.endsWith('.fbx') || file.name.endsWith('.gltf')) {
        category = '3D Modeling';
      } else if (file.name.endsWith('.svg') || file.name.endsWith('.ai')) {
        category = 'Vector Art';
      }

      const randomImgs = [
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80",
        "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=500&q=80",
        "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=500&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&q=80",
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=500&q=80"
      ];
      const selectedTh = randomImgs[Math.floor(Math.random() * randomImgs.length)];

      const body = {
        title: file.name.split('.')[0] || 'Imported Design',
        description: `Imported digital asset file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
        thumbnailUrl: selectedTh,
        aspectRatio: '4:3',
        tags: [category],
        status: 'Draft',
        reviewStatus: 'Awaiting Feedback'
      };

      const res = await apiRequest('/api/projects', 'POST', body, token);
      if (res.success && res.data) {
        setProjects(prev => [res.data, ...prev]);
        statusCallback(`Imported: ${file.name}`, <CheckCircle className="h-4 w-4 text-emerald-400" />);
      } else {
        statusCallback('Asset ingestion failed');
      }
    }
  };

  const handleUpdateCreatorProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName.trim()) {
      statusCallback('Name validation empty', <AlertTriangle className="h-4 w-4 text-rose-500" />);
      return;
    }

    setEditProfileSubmitting(true);
    statusCallback('Writing profile and custom creator specs...');

    const resProfile = await apiRequest('/api/user/profile', 'POST', {
      fullName: editFullName.trim(),
      recoveryEmail: editRecoveryEmail.trim()
    }, token);

    if (resProfile.success && resProfile.data?.user) {
      const resCreator = await apiRequest('/api/user/creator-profile', 'POST', {
        professionalTitle: editProfessionalTitle,
        location: editLocation,
        coverUrl: editCoverUrl,
        avatarUrl: editAvatarUrl,
        behanceUrl: editBehanceUrl,
        artstationUrl: editArtstationUrl,
        dribbbleUrl: editDribbbleUrl
      }, token);

      if (resCreator.success && resCreator.data?.user) {
        onUpdateUser(resCreator.data.user);
        statusCallback('Creative identity synchronized', <CheckCircle className="h-4 w-4 text-emerald-400" />);
        setShowEditProfileModal(false);
      } else {
        onUpdateUser(resProfile.data.user);
        statusCallback('Profile synced');
        setShowEditProfileModal(false);
      }
    } else {
      statusCallback('Identity sync failed');
    }
    setEditProfileSubmitting(false);
  };
  
  // Theme and accessibility variables mapped
  const [activeTheme, setActiveTheme] = useState(user.theme);
  const [highContrast, setHighContrast] = useState(user.highContrast);
  const [motionSetting, setMotionSetting] = useState(user.reducedMotion);
  const [fontSize, setFontSize] = useState(user.fontSize);

  // Authenticator verification states
  const [mfaQr, setMfaQr] = useState<string | null>(null);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaSetupLoading, setMfaSetupLoading] = useState(false);
  const [mfaVerifyLoading, setMfaVerifyLoading] = useState(false);

  // Email verification states
  const [emailOtpSent, setEmailOtpSent] = useState<string | null>(null);
  const [emailOtpInput, setEmailOtpInput] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailConfirming, setEmailConfirming] = useState(false);

  // AI Security advisor states
  const [aiScanLoading, setAiScanLoading] = useState(false);
  const [aiReport, setAiReport] = useState<Advice[] | null>(null);
  const [aiAdvisorSource, setAiAdvisorSource] = useState<string | null>(null);

  // Trigger load sessions periodically
  useEffect(() => {
    const fetchSessions = async () => {
      const res = await apiRequest('/api/auth/sessions', 'GET', null, token);
      if (res.success && res.data) {
        setSessions(res.data);
      }
    };
    fetchSessions();
    const interval = setInterval(fetchSessions, 15000);
    return () => clearInterval(interval);
  }, [token]);

  // Handle setting updates
  const saveAccessibilitySettings = async (updates: Partial<UserProfile>) => {
    // Dynamic local overrides for instant snappy visual feel
    if (updates.theme !== undefined) setActiveTheme(updates.theme);
    if (updates.highContrast !== undefined) setHighContrast(updates.highContrast);
    if (updates.reducedMotion !== undefined) setMotionSetting(updates.reducedMotion);
    if (updates.fontSize !== undefined) setFontSize(updates.fontSize);

    statusCallback('rewriting configs');
    const res = await apiRequest('/api/user/settings', 'POST', updates, token);
    if (res.success && res.data?.user) {
      onUpdateUser(res.data.user);
      statusCallback('configs written', <CheckCircle className="h-4 w-4 text-emerald-400" />);
    }
  };

  // Setup Authenticator MFA triggers
  const triggerMfaSetup = async () => {
    setMfaSetupLoading(true);
    statusCallback('init totp setup', <KeySquare className="h-4 w-4 text-pink-400 animate-spin" />);
    const res = await apiRequest('/api/auth/mfa/setup', 'POST', null, token);
    if (res.success && res.data) {
      setMfaQr(res.data.qrUrl);
      setMfaSecret(res.data.secret);
      statusCallback('totp code mapped');
    }
    setMfaSetupLoading(false);
  };

  const handleMfaVerify = async () => {
    if (mfaCode.length !== 6) return;
    setMfaVerifyLoading(true);
    statusCallback('certifying token');
    const res = await apiRequest('/api/auth/mfa/verify', 'POST', { code: mfaCode }, token);
    if (res.success && res.data?.user) {
      onUpdateUser(res.data.user);
      setMfaQr(null);
      setMfaSecret(null);
      setMfaCode('');
      statusCallback('mfa certified', <CheckCircle className="h-4 w-4 text-emerald-400" />);
    } else {
      statusCallback('certified failed', <AlertTriangle className="h-4 w-4 text-rose-500" />);
      alert(res.message);
    }
    setMfaVerifyLoading(false);
  };

  // Email verification handlers
  const triggerEmailSend = async () => {
    setEmailSending(true);
    statusCallback('sending verification mail');
    const res = await apiRequest('/api/auth/verify-email-send', 'POST', null, token);
    if (res.success && res.data) {
      setEmailOtpSent(res.data.code);
      statusCallback('check email dispatcher');
    }
    setEmailSending(false);
  };

  const handleEmailConfirm = async () => {
    if (emailOtpInput.length !== 6) return;
    setEmailConfirming(true);
    statusCallback('verifying node address');
    const res = await apiRequest('/api/auth/verify-email-confirm', 'POST', {
      code: emailOtpInput,
      systemCode: emailOtpSent,
    }, token);

    if (res.success && res.data?.user) {
      onUpdateUser(res.data.user);
      setEmailOtpSent(null);
      setEmailOtpInput('');
      statusCallback('email certified', <CheckCircle className="h-4 w-4 text-emerald-400" />);
    } else {
      statusCallback('mismatch verify');
      alert(res.message);
    }
    setEmailConfirming(false);
  };

  // Revoke remote session
  const revokeSession = async (sessionId: string, isCurrent: boolean) => {
    if (isCurrent) {
      statusCallback('destroying current login');
      // Revoke current session triggers absolute immediate logout!
      const res = await apiRequest('/api/auth/sessions/revoke', 'POST', { sessionId }, token);
      if (res.success) {
        onLogout();
      }
      return;
    }

    statusCallback('revoking session key');
    const res = await apiRequest('/api/auth/sessions/revoke', 'POST', { sessionId }, token);
    if (res.success) {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      statusCallback('remote host purged', <Trash2 className="h-4 w-4 text-rose-500" />);
    }
  };

  // Security scanner with Gemini API
  const runAiSecurityAdvisorScan = async () => {
    setAiScanLoading(true);
    setAiReport(null);
    statusCallback('advisor scan active', <RefreshCw className="h-4.5 w-4.5 text-cyan-400 animate-spin" />);

    const res = await apiRequest('/api/security/ai-scan', 'POST', null, token);
    if (res.success && res.data) {
      setAiReport(res.data);
      setAiAdvisorSource(res.source || 'Threat Intelligence Node');
      statusCallback('advisor report populated', <ShieldCheck className="h-4 w-4 text-emerald-400" />);
    } else {
      statusCallback('advisor link down');
    }
    setAiScanLoading(false);
  };

  // Calc security score for progress wheel
  const getSecurityScore = () => {
    let score = 40;
    if (user.mfaEnabled) score += 30;
    if (user.emailVerified) score += 20;
    if (sessions.length === 1) score += 10;
    return score;
  };

  // Handler to update name and recovery coordinates
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName.trim()) {
      statusCallback('Name field validated corrupt', <AlertTriangle className="h-4 w-4 text-rose-500" />);
      return;
    }
    setEditProfileSubmitting(true);
    statusCallback('Updating profile info...');
    const res = await apiRequest('/api/user/profile', 'POST', {
      fullName: editFullName.trim(),
      recoveryEmail: editRecoveryEmail.trim()
    }, token);

    if (res.success && res.data?.user) {
      onUpdateUser(res.data.user);
      setShowEditProfileModal(false);
      statusCallback('Profile synchronization updated', <CheckCircle className="h-4 w-4 text-emerald-400" />);
    } else {
      statusCallback('Profile update failed');
      alert(res.message || 'Profile synchronization failed.');
    }
    setEditProfileSubmitting(false);
  };

  // Handler to rotate pass locks
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError(null);
    setChangePasswordSuccess(null);

    if (!currentPassword || !newPassword) {
      setChangePasswordError('Please enter current and new security locks.');
      return;
    }

    // Integrity constraint check
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasDigit = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
    const isLong = newPassword.length >= 8;

    if (!isLong || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      setChangePasswordError('Password shield requires 8+ chars (upper, lower, digit, special symbol).');
      return;
    }

    setChangePasswordSubmitting(true);
    statusCallback('Verifying old locker and rotating credentials...');
    const res = await apiRequest('/api/user/change-password', 'POST', {
      currentPassword,
      newPassword
    }, token);

    if (res.success) {
      setChangePasswordSuccess('Dynamic password successfully rotated!');
      setCurrentPassword('');
      setNewPassword('');
      statusCallback('Password rotated successfully', <CheckCircle className="h-4 w-4 text-emerald-400" />);
      setTimeout(() => {
        setShowChangePasswordModal(false);
        setChangePasswordSuccess(null);
      }, 1500);
    } else {
      setChangePasswordError(res.message || 'Verification mismatch.');
      statusCallback('Locker rotate failed', <AlertTriangle className="h-4 w-4 text-rose-500" />);
    }
    setChangePasswordSubmitting(false);
  };

  // Terminate all other devices list
  const handleTerminateOtherDevices = async () => {
    const others = sessions.filter(s => !s.isCurrent);
    if (others.length === 0) {
      statusCallback('No other nodes connected', <CheckCircle className="h-4 w-4 text-emerald-400" />);
      return;
    }

    setTerminateAllLoading(true);
    statusCallback('Destroying remote sessions...');
    
    let successCount = 0;
    for (const s of others) {
      const res = await apiRequest('/api/auth/sessions/revoke', 'POST', { sessionId: s.id }, token);
      if (res.success) {
        successCount++;
      }
    }

    setSessions(prev => prev.filter(s => s.isCurrent));
    statusCallback(`Purged ${successCount} secondary hosts`, <CheckCircle className="h-4 w-4 text-emerald-400" />);
    setTerminateAllLoading(false);
  };

  // Accessible font scaling classes helper
  const getFontSizeClass = () => {
    if (fontSize === 'sm') return 'text-[11px]';
    if (fontSize === 'lg') return 'text-sm';
    return 'text-xs';
  };

  return (
    <div id="dashboard_screen_container" className="flex-grow flex flex-col justify-between h-full text-white pb-10">
      
      {/* ATMOSPHERIC FUTURISTIC PROFILE BANNER */}
      <div className="relative w-full h-48 sm:h-64 md:h-80 overflow-hidden bg-neutral-950 flex-shrink-0">
        {/* Banner image if configured, otherwise cyber gradient */}
        {user.coverUrl ? (
          <>
            <img 
              src={user.coverUrl} 
              alt="Profile Cover Banner" 
              className="absolute inset-0 w-full h-full object-cover opacity-60 select-none pointer-events-none"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-indigo-950 to-neutral-950 opacity-80" />
        )}
        
        {/* Animated Cybernetic Cosmic Space / Glow Elements / Neo-particles overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-neutral-950/80 via-transparent to-indigo-950/20 pointer-events-none" />

        {/* Technical abstract grid backdrop */}
        <div 
          className="absolute inset-0 opacity-[0.06] pointer-events-none" 
          style={{
            backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
            color: activeTheme === 'glass-light' ? '#3b82f6' : '#22d3ee'
          }}
        />

        {/* Ambient moving glow spots */}
        <motion.div 
          animate={{
            scale: [1, 1.25, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-16 left-1/4 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" 
        />
        <motion.div 
          animate={{
            scale: [1, 1.15, 1],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-20 right-1/4 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" 
        />

        {/* Faint Cyber scan-line or pulse overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.01] to-transparent pointer-events-none animate-pulse" />

        {/* Edit Cover Trigger directly on the banner */}
        {!isPublicPreview && (
          <button 
            type="button"
            onClick={() => setShowEditProfileModal(true)}
            className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/80 hover:bg-neutral-850 backdrop-blur-md rounded-lg border border-neutral-800 hover:border-neutral-700 text-[10px] md:text-xs font-semibold text-white transition-all cursor-pointer shadow-lg"
          >
            <Camera className="h-3.5 w-3.5 text-cyan-400" />
            <span>Edit Cover</span>
          </button>
        )}

        {/* Faint ambient tagline and status text in corners to enhance cyber mood without clutter */}
        <div className="absolute top-3 left-4 flex items-center gap-1.5 opacity-30 select-none pointer-events-none font-mono text-[8.5px] tracking-widest text-zinc-450">
          <span className="h-1 w-1 bg-cyan-400 rounded-full animate-ping" />
          <span>PORTAL_ACTIVE // SECURE_NODE v4.1</span>
        </div>
        
        <div className="absolute top-3 right-4 select-none pointer-events-none font-mono text-[8.5px] tracking-wider text-zinc-500 opacity-25">
          CRYPTO_CORE_SECURE // {typeof window !== 'undefined' ? window.location.hostname : 'localhost'}
        </div>
      </div>

      {/* GLOBAL MASTER IDENTITY FOREGROUND CARD (overlapping lower edge of banner) */}
      <div 
        id="dashboard_user_header" 
        className={`px-6 pb-5 pt-0 -mt-16 sm:-mt-24 md:-mt-28 relative z-10 transition-all flex flex-col md:flex-row md:items-end justify-between gap-4 border-b ${
          activeTheme === 'glass-light' 
            ? 'border-slate-150 bg-white/80 backdrop-blur-md text-slate-905 shadow-sm' 
            : 'border-neutral-900 bg-neutral-950/70 backdrop-blur-lg text-white'
        }`}
      >
        {/* Left: Overlapping Avatar + Name + Handle + Role + Location + Verified Creator Badge */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 md:gap-5 -mt-12 sm:-mt-16">
          
          {/* Circular Overlapping Avatar with Interactive States and Pencil Badge */}
          <div className="relative group flex-shrink-0 cursor-pointer" onClick={() => setShowEditProfileModal(true)}>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 350, damping: 18 }}
              className={`p-1 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-emerald-400 shadow-xl transition-all ${
                activeTheme === 'glass-light' ? 'shadow-indigo-500/15' : 'shadow-cyan-500/30'
              }`}
            >
              <div 
                className={`w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full flex items-center justify-center select-none border-2 overflow-hidden transition-colors ${
                  activeTheme === 'glass-light'
                    ? 'bg-gradient-to-tr from-slate-50 to-indigo-50 text-indigo-900 border-white'
                    : 'bg-neutral-950 text-white border-neutral-950'
                }`}
              >
                {user.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={user.fullName} 
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full rounded-full flex items-center justify-center font-black text-2xl sm:text-4xl md:text-5xl uppercase tracking-widest font-sans">
                    {user.username ? user.username.slice(0, 2).toUpperCase() : 'A1'}
                  </div>
                )}
              </div>
            </motion.div>
            
            {/* Small edit badge on the corner */}
            <motion.div 
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowEditProfileModal(true);
              }}
              className="absolute bottom-1 right-1 h-8 w-8 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-cyan-400 hover:text-white rounded-full flex items-center justify-center shadow-lg transition-colors cursor-pointer"
              title="Edit Profile"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </motion.div>

            {/* Subtle pulsing ring */}
            <span className="absolute -top-0.5 -left-0.5 w-[calc(100%+4px)] h-[calc(100%+4px)] rounded-full border border-cyan-400/20 animate-pulse pointer-events-none" />
          </div>

          <div className="text-left min-w-0">
            <div className="flex items-center gap-2 flex-wrap pb-1">
              <h1 className={`font-sans font-extrabold text-2xl md:text-3xl tracking-tight leading-none ${
                activeTheme === 'glass-light' ? 'text-slate-900 font-sans' : 'text-neutral-50 font-sans'
              }`}>
                {user.fullName}
              </h1>
              <span className={`text-[9px] md:text-[10px] font-sans font-bold tracking-[0.22em] pl-1 uppercase px-2 py-0.5 rounded border ${
                activeTheme === 'glass-light' 
                  ? 'bg-slate-100 border-slate-200 text-slate-500' 
                  : 'bg-cyan-500/5 border-cyan-500/10 text-cyan-400'
              }`}>
                @{user.username.toLowerCase()}
              </span>
              <span className="flex items-center gap-1 text-[8.5px] font-sans font-extrabold uppercase tracking-wide px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle className="h-3 w-3 text-emerald-400 fill-emerald-505/10" />
                Verified Creator
              </span>
            </div>
            
            <p className={`text-xs font-medium font-sans mt-1 ${
              activeTheme === 'glass-light' ? 'text-slate-500' : 'text-neutral-400'
            }`}>
              {editProfessionalTitle || 'Digital Creator'}
            </p>

            <div className="flex items-center gap-2.5 mt-1.5 whitespace-nowrap text-[10.5px] text-zinc-500 flex-wrap">
              {editLocation && (
                <span className="flex items-center gap-0.5 font-sans">
                  <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                  {editLocation}
                </span>
              )}
              <span className="text-zinc-700">•</span>
              {(() => {
                const currentSession = sessions.find(s => s.isCurrent) || sessions[0];
                const deviceText = currentSession?.device || 'Chrome / macOS';
                const locationText = currentSession?.location || 'Seattle, WA';
                return (
                  <span className="text-zinc-500 text-[10.5px] font-sans">
                    Last login: {deviceText} · {locationText} · Just now
                  </span>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Right master actions row: Edit profile | Public view | EXIT */}
        <div className="flex items-center gap-2 shrink-0 self-start md:self-end ml-0 md:ml-auto flex-wrap">
          {!isPublicPreview && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowEditProfileModal(true)}
              className={`h-8 px-3 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                activeTheme === 'glass-light'
                  ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-705 shadow-xs'
                  : 'bg-neutral-900 border-neutral-800 text-zinc-350 hover:text-white'
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit profile</span>
            </motion.button>
          )}

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsPublicPreview(!isPublicPreview)}
            className={`h-8 px-3 rounded-lg text-xs font-sans tracking-wide font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              isPublicPreview
                ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 border-amber-600'
                : activeTheme === 'glass-light'
                ? 'bg-slate-50 hover:bg-slate-100 border-slate-250 text-indigo-700'
                : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-indigo-400 hover:text-indigo-300'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>{isPublicPreview ? 'Admin console' : 'Public view'}</span>
          </motion.button>

          <motion.button 
            type="button" 
            onClick={onLogout} 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="h-8 px-3 rounded-lg text-xs font-sans tracking-wide font-extrabold uppercase flex items-center gap-1.5 border transition-all cursor-pointer bg-rose-950/20 border-rose-900/40 text-rose-500 hover:bg-rose-900/30 hover:border-rose-500 shadow-sm"
            title="Secure Sign Out"
          >
            <Power className="h-3.5 w-3.5" />
            <span>EXIT</span>
          </motion.button>
        </div>
      </div>

      {/* CORE SEGMENTED TAB NAVIGATION */}
      <div className={`px-4 pt-1 border-b transition-colors ${
        activeTheme === 'glass-light' ? 'bg-slate-50/50 border-slate-200' : 'bg-neutral-955/35 border-neutral-900'
      }`}>
        <div id="portal_tabs_strip" className="flex items-center gap-1.5 pb-0 max-w-md">
          {(['overview', 'security', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`pb-3 pt-3 px-4 relative text-xs font-sans font-bold tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === tab
                  ? activeTheme === 'glass-light' ? 'text-indigo-600' : 'text-indigo-400'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <span>{tab}</span>
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN VIEWPORTS WRAPPER */}
      <div className="flex-grow flex flex-col px-4 pt-4 space-y-4">
        
        <AnimatePresence mode="popLayout">
          {activeTab === 'overview' && (
            <motion.div
              key="overview-tab"
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -5 }}
              className="space-y-4 text-left font-sans"
            >
              
              {/* SECTION 2: METRICS COMPONENT (Impact row + Capacity/Security row) */}
              <div className="space-y-3">
                {/* Row 1: Impact metrics (three equal cards) */}
                <div id="impact_metrics_row" className="grid grid-cols-3 gap-2.5">
                  {[
                    { label: "Views", val: projects.reduce((acc, p) => acc + (p.viewCount || 0), 0), color: "text-indigo-400" },
                    { label: "Likes", val: projects.reduce((acc, p) => acc + (p.likes || 0), 0), color: "text-emerald-400" },
                    { label: "In review", val: projects.filter(p => p.reviewStatus !== 'Approved').length, color: "text-amber-400" },
                  ].map((metric, idx) => (
                    <div 
                      key={idx}
                      className={`p-3.5 rounded-xl border text-center font-sans ${
                        activeTheme === 'glass-light' 
                          ? 'bg-slate-50 border-slate-150' 
                          : 'bg-neutral-950/40 border-neutral-900'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                        {metric.label}
                      </span>
                      <strong className={`block text-lg md:text-xl font-black tracking-tight mt-1 ml-0.5 ${metric.color}`}>
                        {metric.val}
                      </strong>
                    </div>
                  ))}
                </div>

                {/* Row 2: Account/Portfolio status & security checkups */}
                <div id="status_and_security_row" className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Account / capacity allocation info */}
                  <div 
                    className={`p-4 rounded-xl border flex flex-col justify-between ${
                      activeTheme === 'glass-light' 
                        ? 'bg-slate-50 border-slate-150' 
                        : 'bg-neutral-950/40 border-neutral-900'
                    }`}
                  >
                    <div>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block pl-0.5">
                        Portfolio Capacity
                      </span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-xl font-bold tracking-tight">
                          {projects.filter(p => p.status === 'Published').length}
                        </span>
                        <span className="text-xs text-zinc-500">published assets online</span>
                      </div>
                    </div>
                    
                    {/* Visual allocation indicators */}
                    <div className="mt-3.5 space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500">
                        <span>Portfolio capacity: {projects.filter(p => p.status === 'Published').length} of {activeTier === 'professional' || activeTier === 'Pro Defender' ? '5' : activeTier === 'Enterprise Operations' ? 'unlimited' : '2'} slots used</span>
                      </div>
                      <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden">
                        {(() => {
                          const maxSlots = activeTier === 'professional' || activeTier === 'Pro Defender' ? 5 : activeTier === 'Enterprise Operations' ? 100 : 2;
                          const pct = Math.min(100, Math.round((projects.filter(p => p.status === 'Published').length / maxSlots) * 100));
                          return (
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              className="h-full bg-indigo-500 rounded-full"
                            />
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Creator security checklist card with status dot and Go to Security CTA */}
                  <div 
                    className={`p-4 rounded-xl border flex flex-col justify-between ${
                      activeTheme === 'glass-light' 
                        ? 'bg-slate-50 border-slate-115' 
                        : 'bg-neutral-950/40 border-neutral-900/80'
                    }`}
                  >
                    {isPublicPreview ? (
                      <div className="flex flex-col h-full justify-between py-1">
                        <div>
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block pl-0.5">
                            Viewer Status
                          </span>
                          <p className="text-[10.5px] text-zinc-400 mt-2 leading-relaxed">
                            You are viewing verified creator profiles in Visitor view. Administrative security credentials checkups and database actions are protected recursively.
                          </p>
                        </div>
                        <span className="text-[9px] text-indigo-400 font-mono tracking-wider mt-2.5 block pl-0.5 uppercase">
                          • READ-ONLY PREVIEW
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="text-left">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block pl-0.5 flex justify-between items-center">
                            <span>Creator Security Checklist</span>
                            {!user.mfaEnabled || !user.emailVerified ? (
                              <span className="text-amber-500 px-2 py-0.5 text-[8.5px] bg-amber-550/10 border border-amber-500/20 rounded-md font-bold uppercase flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Attention required
                              </span>
                            ) : (
                              <span className="text-emerald-555 px-2 py-0.5 text-[8.5px] bg-emerald-500/10 border border-emerald-550/20 rounded-md font-bold uppercase flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-450" />
                                All secure
                              </span>
                            )}
                          </span>

                          <div className="mt-2.5 space-y-1.5 text-[10.5px] text-zinc-450">
                            <div className="flex items-center gap-2">
                              {user.emailVerified ? (
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-450" />
                              ) : (
                                <span className="h-2 w-2 rounded-full bg-amber-550 animate-ping" />
                              )}
                              <span className={user.emailVerified ? 'line-through text-zinc-500' : ''}>Verify backup recovery email</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {user.mfaEnabled ? (
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-450" />
                              ) : (
                                <span className="h-2 w-2 rounded-full bg-amber-555 animate-ping" />
                              )}
                              <span className={user.mfaEnabled ? 'line-through text-zinc-500' : ''}>Enable TOTP MFA key</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setActiveTab('security')}
                            className="px-3 py-1 text-[9px] font-sans font-bold uppercase bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-indigo-500/30 text-indigo-400 hover:text-indigo-300 rounded-md transition-all cursor-pointer"
                          >
                            Go to Security
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 3: PORTFOLIO SHOWCASE GRID AREA */}
              <div className="space-y-3.5 pt-2">
                
                {/* Simplified Single-line menu row: Tabs on left, New project on right */}
                <div id="portfolio_controls_strip" className="flex items-center justify-between border-b border-neutral-900/10 dark:border-neutral-900/40 pb-2.5 gap-2.5 flex-wrap">
                  
                  {/* Single Line Tabs lists with clear counts */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {([
                      { value: 'Published', label: 'Published' },
                      { value: 'Draft', label: 'Drafts' },
                      { value: 'Collection', label: 'Collections' }
                    ] as const).map(tab => {
                      if (isPublicPreview && tab.value === 'Draft') return null;
                      const count = projects.filter(p => p.status === tab.value).length;
                      return (
                        <button
                          key={tab.value}
                          type="button"
                          onClick={() => {
                            setPortfolioStatusTab(tab.value);
                            setVisibleCount(4);
                          }}
                          className={`px-3 py-1 rounded-lg text-[10.5px] font-bold tracking-wide uppercase transition-all cursor-pointer ${
                            portfolioStatusTab === tab.value
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-zinc-500 hover:text-white hover:bg-neutral-900/40'
                          }`}
                        >
                          {tab.label} ({count})
                        </button>
                      );
                    })}
                  </div>

                  {/* Clean, primary Action Buttons (Upload secondary + New primary) */}
                  {!isPublicPreview && (
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={() => statusCallback('Drag and drop any local PNG/JPG file anywhere inside this tab to upload')}
                        className="h-7 px-2.5 rounded-lg border border-neutral-850 hover:border-neutral-750 text-neutral-400 hover:text-white text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1 font-sans"
                      >
                        <Upload className="h-3 w-3" />
                        <span>Upload asset</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenNewProject}
                        className="h-7 px-3 bg-indigo-600 hover:bg-indigo-550 text-white rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1 font-sans"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>New project</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Minimalist Categories filter pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  <span className="text-[9px] font-mono uppercase text-zinc-550 tracking-wider mr-1.5">Filter category:</span>
                  {['All', '3D Modeling', 'Branding', 'Vector Art', 'UI/UX Layouts', 'Futurism'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setPortfolioCategory(cat);
                        setVisibleCount(4);
                      }}
                      className={`px-2 py-0.5 rounded-full text-[9px] font-sans font-medium transition-all border cursor-pointer whitespace-nowrap ${
                        portfolioCategory === cat
                          ? 'bg-zinc-200 border-zinc-300 text-zinc-950 font-semibold'
                          : 'bg-neutral-900/10 border-neutral-900 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* DRAG AND DROP PORTFOLIO WORKSPACE CANVAS */}
                <div 
                  id="canvas_grid_container"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDropFile}
                  className={`relative p-1.5 rounded-2xl border transition-all ${
                    draggingFile 
                      ? 'border-dashed border-indigo-500 bg-indigo-950/20' 
                      : 'border-transparent bg-transparent'
                  }`}
                >
                  {draggingFile && (
                    <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-4 rounded-xl">
                      <motion.div 
                        animate={{ y: [0, -6, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="bg-indigo-600/20 p-3 rounded-2xl border border-indigo-500/30"
                      >
                        <Upload className="h-6 w-6 text-indigo-400" />
                      </motion.div>
                      <strong className="text-white text-[11px] font-bold mt-2 uppercase tracking-wide">
                        Release to upload project image
                      </strong>
                      <span className="text-zinc-500 text-[8.5px] mt-1">
                        Add metadata or drag & drop files
                      </span>
                    </div>
                  )}

                  {/* ACTIVE PORTFOLIO WORKSPACE VIEWPORT */}
                  {(() => {
                    const matched = projects.filter(p => {
                      const matchesStatus = p.status === portfolioStatusTab;
                      const matchesCategory = portfolioCategory === 'All' || p.tags.includes(portfolioCategory);
                      return matchesStatus && matchesCategory;
                    });

                    if (matched.length === 0) {
                      return (
                        <div className={`aspect-video rounded-xl border flex flex-col items-center justify-center p-6 ${
                          activeTheme === 'glass-light' ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950/25 border-neutral-900'
                        }`}>
                          <LayoutGrid className="h-6 w-6 text-zinc-650 mb-2 animate-pulse" />
                          <strong className="text-[11px] text-zinc-400 uppercase tracking-widest leading-none font-bold">
                            No items in {portfolioStatusTab === 'Draft' ? 'Drafts' : portfolioStatusTab === 'Collection' ? 'Collections' : 'Published'} yet
                          </strong>
                          <p className="text-[10px] text-zinc-500 text-center max-w-[240px] mt-2 leading-relaxed italic">
                            No items in this collection yet. Add files via drag & drop or create your first project.
                          </p>

                          {!isPublicPreview && (
                            <div className="flex items-center gap-3 mt-4">
                              <button
                                type="button"
                                onClick={handleOpenNewProject}
                                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-550 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                              >
                                Create project
                              </button>
                              <button
                                type="button"
                                onClick={() => statusCallback('Drag and drop any local PNG/JPG file anywhere inside this tab to upload')}
                                className="text-[10px] text-indigo-400 hover:underline hover:text-indigo-300 uppercase font-bold tracking-wider cursor-pointer font-sans"
                              >
                                Upload asset
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {matched.slice(0, visibleCount).map((p) => {
                          let aspectClass = 'aspect-[4/3]';
                          if (p.aspectRatio === '1:1') aspectClass = 'aspect-square';
                          if (p.aspectRatio === '16:9') aspectClass = 'aspect-video';

                          const itemReviewStatus = p.reviewStatus || 'Approved';

                          return (
                            <motion.div
                              key={p.id}
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className={`group relative rounded-xl border overflow-hidden ${aspectClass} ${
                                activeTheme === 'glass-light' ? 'border-slate-150' : 'border-neutral-900/85'
                              }`}
                            >
                              <img 
                                referrerPolicy="no-referrer"
                                src={p.thumbnailUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80"}
                                alt={p.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                              />

                              {/* HOVER DETAILS OVERLAY */}
                              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3.5 text-left z-10 select-none">
                                <div className="flex justify-between items-start">
                                  <span className="bg-indigo-600 text-white font-sans font-black text-[7.5px] uppercase tracking-wider px-2 py-0.5 rounded">
                                    {p.tags[0] || 'Branding'}
                                  </span>

                                  <span className={`px-2 py-0.5 text-[7px] font-sans font-extrabold uppercase rounded border ${
                                    itemReviewStatus === 'Approved'
                                      ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-400'
                                      : itemReviewStatus === 'In Review'
                                      ? 'bg-amber-950/30 border-amber-500/20 text-amber-400'
                                      : 'bg-cyan-950/30 border-cyan-500/20 text-cyan-400'
                                  }`}>
                                    {itemReviewStatus}
                                  </span>
                                </div>

                                <div className="space-y-1 py-0.5">
                                  <h4 className="font-sans font-extrabold text-xs text-white leading-tight truncate">
                                    {p.title}
                                  </h4>
                                  <p className="text-[9px] text-zinc-300 leading-normal line-clamp-2">
                                    {p.description}
                                  </p>

                                  <div className="flex items-center justify-between pt-1 border-t border-white/5 mt-1.5">
                                    <div className="flex items-center gap-2.5 text-white/90 text-[8.5px] font-mono">
                                      <span className="flex items-center gap-0.5">
                                        <Eye className="h-3 w-3" /> {p.viewCount}
                                      </span>
                                      <span className="flex items-center gap-0.5">
                                        <Heart className="h-3 w-3 text-rose-500" /> {p.likes}
                                      </span>
                                    </div>

                                    {!isPublicPreview ? (
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          type="button"
                                          onClick={(e) => handleOpenEditProject(p, e)}
                                          className="h-5.5 w-5.5 rounded bg-neutral-900/80 hover:bg-neutral-800 text-indigo-400 hover:text-indigo-300 flex items-center justify-center border border-neutral-800 cursor-pointer"
                                          title="Configure Project Assets"
                                        >
                                          <Edit3 className="h-3 w-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => handleDuplicateProject(p.id, e)}
                                          className="h-5.5 w-5.5 rounded bg-neutral-900/80 hover:bg-neutral-800 text-cyan-400 hover:text-cyan-300 flex items-center justify-center border border-neutral-800 cursor-pointer"
                                          title="Clone project layout"
                                        >
                                          <Copy className="h-3 w-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => handleDeleteProject(p.id, e)}
                                          className="h-5.5 w-5.5 rounded bg-neutral-900/80 hover:bg-rose-950 text-rose-450 hover:text-rose-400 flex items-center justify-center border border-neutral-850 cursor-pointer"
                                          title="Remove asset"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigator.clipboard.writeText(window.location.href);
                                          statusCallback('Project link compiled and copied', <CheckCircle className="h-4 w-4 text-emerald-400" />);
                                        }}
                                        className="h-5.5 px-2 rounded bg-indigo-600 hover:bg-indigo-550 text-white flex items-center gap-1 text-[8px] uppercase tracking-wider font-sans cursor-pointer"
                                      >
                                        <ExternalLink className="h-2.5 w-2.5" />
                                        <span>COMPILE LINK</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    );
                  })()}

                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              key="security-tab"
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -5 }}
              className="space-y-4 text-left font-sans"
            >
              
              {/* PRIMARY CREDENTIALS ROTATION SHIELD */}
              <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/60 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <KeySquare className="h-4 w-4 text-indigo-400" />
                    <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-white">Identity Credentials</h4>
                  </div>
                  <p className="text-[10px] text-zinc-450 leading-relaxed max-w-sm mt-0.5">
                    Rotate or secure your visual creator password keys. Required for manual panel authentications.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(true)}
                  className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-zinc-300 hover:text-white text-[10.5px] uppercase font-bold tracking-wider rounded-lg border border-neutral-850 hover:border-neutral-700 transition-all cursor-pointer font-sans"
                >
                  Change password
                </button>
              </div>

              {/* COMPACT EMAIL CERTIFY GATE */}
              {!user.emailVerified && (
                <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-950/15 space-y-3">
                  <div className="flex gap-2 text-yellow-300">
                    <ShieldAlert className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <h4 className="font-sans font-bold text-xs uppercase tracking-wide">Verify Your Email Address</h4>
                      <p className="text-[10px] text-zinc-450 leading-relaxed font-sans mt-0.5">
                        Verify your email to secure and complete your profile.
                      </p>
                    </div>
                  </div>

                  {!emailOtpSent ? (
                    <button
                      type="button"
                      onClick={triggerEmailSend}
                      disabled={emailSending}
                      className="w-full h-9 bg-yellow-600 hover:bg-yellow-500 text-black font-semibold text-xs font-sans rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                    >
                      {emailSending ? 'SENDING...' : 'SEND VERIFICATION CODE'}
                    </button>
                  ) : (
                    <div className="space-y-3 font-sans">
                      <div className="p-2.5 bg-neutral-950/80 border border-neutral-900 border-dashed rounded text-[11px] flex justify-between items-center text-yellow-500">
                        <span>SIMULATED CODE SENT:</span>
                        <strong className="bg-yellow-950 text-white px-2 py-0.5 border border-yellow-500/30 rounded select-all animate-pulse font-mono">
                          {emailOtpSent}
                        </strong>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={emailOtpInput}
                          onChange={(e) => setEmailOtpInput(e.target.value.replace(/\D/g, ''))}
                          placeholder="ENTER CODE"
                          className="flex-1 bg-neutral-950/70 text-center text-xs h-8.5 rounded-lg border border-neutral-800 text-white font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleEmailConfirm}
                          disabled={emailConfirming || emailOtpInput.length !== 6}
                          className="px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8.5 rounded-lg font-sans shadow-sm"
                        >
                          VERIFY
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MFA / 2FA AUTHENTICATOR HARDENING CABINET */}
              <div className="p-4 rounded-2xl border border-neutral-900 bg-neutral-950/60 space-y-3.5">
                <div className="flex items-center gap-2 border-b border-neutral-900 pb-2">
                  <Fingerprint className="h-4.5 w-4.5 text-indigo-400" />
                  <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-white">TOTP Authentication Vault</h4>
                </div>

                {!user.mfaEnabled ? (
                  !mfaQr ? (
                    <div className="space-y-3 text-left">
                      <p className="text-[10px] text-zinc-450 leading-normal font-sans">
                        Lock down your authentication nodes with high-security TOTP passcode credentials. Required with every decryption run on unrecognized hosts.
                      </p>
                      <button
                        type="button"
                        onClick={triggerMfaSetup}
                        disabled={mfaSetupLoading}
                        className="w-full h-9 bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-sans font-semibold tracking-wide rounded-lg cursor-pointer shadow-lg shadow-indigo-950/25 transition-colors"
                      >
                        {mfaSetupLoading ? 'GENERATING KEY...' : 'ACTIVATE TOTP ENCRYPT BLOCK'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Fake QR Scanner simulator & secret code block */}
                      <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-900 space-y-2">
                        <div className="text-[10px] font-sans font-bold text-neutral-500 uppercase tracking-wider text-center border-b border-neutral-900 pb-1.5">
                          AUTHENTICATOR QR INBOUND
                        </div>
                        <div className="flex justify-center py-2 bg-white rounded-lg max-w-[120px] mx-auto overflow-hidden shadow-inner">
                          {/* Beautiful simulated vector grid representing QR */}
                          <div className="grid grid-cols-4 gap-2 w-20 h-20 bg-neutral-950 p-2 text-white">
                            <span className="bg-white border-2 border-black" />
                            <span className="bg-transparent" />
                            <span className="bg-white border-2 border-black" />
                            <span className="bg-white" />
                            <span className="bg-white" />
                            <span className="bg-white border-2 border-black" />
                            <span className="bg-transparent" />
                            <span className="bg-white" />
                            <span className="bg-white border-2 border-black" />
                            <span className="bg-white" />
                            <span className="bg-white border-2 border-black" />
                            <span className="bg-transparent" />
                            <span className="bg-white" />
                            <span className="bg-transparent" />
                            <span className="bg-white" />
                            <span className="bg-white border-2 border-black" />
                          </div>
                        </div>

                        <div className="text-center font-sans text-xs space-y-1 mt-2">
                          <span className="text-neutral-500 select-none uppercase text-[10px] font-semibold block">SECRET SEED STRING</span>
                          <strong className="text-indigo-400 select-all block font-bold text-xs uppercase bg-indigo-950/40 p-1 border border-indigo-500/20 rounded font-mono">
                            {mfaSecret}
                          </strong>
                        </div>
                      </div>

                      {/* Verify code confirmation row */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-sans font-semibold text-neutral-400 pl-0.5">SUBMIT DYNAMIC CODE VALUE</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={mfaCode}
                            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="000000"
                            className="flex-1 bg-neutral-950 h-9 rounded-lg border border-neutral-800 text-center tracking-widest text-xs text-white uppercase font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleMfaVerify}
                            disabled={mfaVerifyLoading || mfaCode.length !== 6}
                            className="px-5 bg-indigo-600 hover:bg-indigo-550 text-white font-semibold text-xs tracking-wide rounded-lg transition-colors font-sans shadow-sm"
                          >
                            CERTIFY
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-emerald-400 flex-shrink-0 animate-pulse" />
                    <div className="text-left font-sans">
                      <h4 className="font-bold text-emerald-300 text-xs uppercase">Device Cryptography Complete</h4>
                      <p className="text-[10px] text-zinc-400 leading-normal mt-0.5">
                        TOTP hardware keys registered and active across your accounts.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ACTIVE SESSION AUTHORIZED TERMINALS & REVOCATION */}
              <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/60 space-y-3.5">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Laptop className="h-4.5 w-4.5 text-indigo-400" />
                    <div className="text-left">
                      <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-white">Active Sessions & Authorized Hosts</h4>
                      <p className="text-[10px] text-zinc-455 mt-0.5">Authorized devices currently connected to your profile.</p>
                    </div>
                  </div>

                  {sessions.filter(s => !s.isCurrent).length > 0 && (
                    <button
                      type="button"
                      onClick={handleTerminateOtherDevices}
                      className="px-3 py-1.5 text-[9px] font-sans font-bold uppercase transition-all bg-rose-950/20 hover:bg-rose-900/30 border border-rose-905/30 hover:border-rose-500 text-rose-400 hover:text-rose-300 rounded-lg cursor-pointer shadow-sm"
                    >
                      Terminate other hosts
                    </button>
                  )}
                </div>

                <div id="active_hosts_list" className="space-y-2 mt-3.5">
                  {sessions.map((s) => (
                    <div 
                      key={s.id} 
                      className={`p-3 rounded-xl border flex justify-between items-center ${
                        activeTheme === 'glass-light' 
                          ? 'bg-slate-50 border-slate-150' 
                          : 'bg-neutral-950/45 border-neutral-900/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className={`p-2 rounded-lg ${
                          s.isCurrent ? 'bg-indigo-500/10 text-indigo-400' : 'bg-neutral-900 text-zinc-500'
                        }`}>
                          <Laptop className={`h-4 w-4 ${s.isCurrent ? 'animate-pulse' : ''}`} />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-white block leading-none">{s.device}</span>
                          <span className="text-[10px] text-zinc-450 block mt-1.5 leading-none">
                            {s.location} · {s.ip} {s.isCurrent && <strong className="text-indigo-400 font-mono ml-1 uppercase text-[8px] tracking-wider bg-indigo-500/10 px-1 py-0.5 border border-indigo-500/20 rounded">Current Node</strong>}
                          </span>
                        </div>
                      </div>
                      {!s.isCurrent && (
                        <button
                          type="button"
                          onClick={() => revokeSession(s.id, s.isCurrent)}
                          className="px-2.5 py-1 text-[9px] uppercase tracking-wider font-extrabold text-rose-400 hover:text-white bg-neutral-950/60 hover:bg-rose-950 border border-neutral-850 hover:border-rose-900 rounded-md transition-all cursor-pointer font-sans"
                        >
                          Terminate
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ENTERPRISE INTELLIGENT AI SECTIONS ADVISOR */}
              <div className="p-4 rounded-2xl border border-indigo-500/20 bg-neutral-1000/20 relative overflow-hidden space-y-3 shadow-lg shadow-indigo-950/10">
                
                <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
                    <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-white">Central Neural Cyber Advisor</h4>
                  </div>
                  {aiAdvisorSource && (
                    <span className="text-[9px] font-mono bg-indigo-950/60 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20">
                      {aiAdvisorSource}
                    </span>
                  )}
                </div>

                {!aiReport ? (
                  <div className="space-y-3.5 mt-2">
                    <p className="text-xxs text-neutral-400 leading-normal font-sans">
                      Request cognitive support to inspect authentication status, active terminal topologies, and formulate defense recommendations.
                    </p>
                    <button
                      type="button"
                      onClick={runAiSecurityAdvisorScan}
                      disabled={aiScanLoading}
                      className="w-full h-9.5 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white rounded-lg text-xs font-sans font-semibold tracking-wide select-none shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {aiScanLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-white" /> SWEPING DATABANKS...
                        </>
                      ) : (
                        <>
                          RUN COGNITIVE ANALYZER
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {/* Advice card lists */}
                    <div className="space-y-2 max-h-[220px] overflow-y-auto no-scrollbar">
                      {aiReport.map((adv, aIdx) => {
                        const isHigh = adv.severity === 'High';
                        const isMed = adv.severity === 'Medium';
                        
                        return (
                          <div
                            key={aIdx}
                            className={`p-3 rounded-xl border text-xs text-left ${
                              isHigh 
                                ? 'border-rose-500/20 bg-rose-950/15' 
                                : isMed 
                                ? 'border-yellow-500/20 bg-yellow-950/15'
                                : 'border-neutral-900 bg-neutral-950/40'
                            }`}
                          >
                            <div className="flex items-center justify-between font-sans text-[10px] uppercase font-bold tracking-wider text-neutral-400 border-b border-neutral-900/60 pb-1 mb-1.5">
                              <span className={isHigh ? 'text-rose-400' : isMed ? 'text-yellow-400' : 'text-cyan-400'}>
                                {adv.severity} PRIORITY
                              </span>
                              <span className="text-white">{adv.impact}</span>
                            </div>
                            <h5 className="font-bold font-sans text-xs tracking-tight text-white">{adv.title}</h5>
                            <p className="text-[10px] text-neutral-450 leading-relaxed font-sans mt-1">{adv.description}</p>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={runAiSecurityAdvisorScan}
                      disabled={aiScanLoading}
                      className="text-xs font-sans font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mx-auto cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> RE-SCAN SECURITY CORE
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings-tab"
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -5 }}
              className="space-y-4 text-left font-sans"
            >
              
              {/* COMPACT THEME SWITCHER Preset buttons */}
              <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/60 flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-white">Visual Environment</h4>
                  <p className="text-[10px] text-zinc-450">Toggle between light and dark modes</p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Light Mode option */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => saveAccessibilitySettings({ theme: 'glass-light' })}
                    title="Switch to Light Theme"
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-center ${
                      activeTheme === 'glass-light'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-md shadow-amber-500/10'
                        : 'bg-neutral-950/40 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    <Sun className="h-4.5 w-4.5" />
                  </motion.button>

                  {/* Dark Mode option */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => saveAccessibilitySettings({ theme: 'glass-dark' })}
                    title="Switch to Dark Theme"
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-center ${
                      activeTheme === 'glass-dark' || activeTheme === 'cyberpunk' || activeTheme === 'neon'
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-md shadow-indigo-500/10'
                        : 'bg-neutral-950/40 border-neutral-800 text-neutral-500 hover:text-neutral-200'
                    }`}
                  >
                    <Moon className="h-4.5 w-4.5" />
                  </motion.button>
                </div>
              </div>

              {/* PERSONAL INFO PREVIEW & EDIT PROFILE CTA */}
              <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/60 space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-cyan-405" />
                    <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-white">Creator Registry Info</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEditProfileModal(true)}
                    className="text-[10.5px] text-indigo-400 hover:text-indigo-350 hover:underline font-bold uppercase transition-all bg-transparent border-0 cursor-pointer font-sans"
                  >
                    Edit profile
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3.5 text-xs text-zinc-400">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-zinc-550 block">Full Name</span>
                    <strong className="text-zinc-200 block">{user.fullName || 'Verified Creator'}</strong>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-zinc-550 block">Recovery Email</span>
                    <strong className="text-zinc-200 block truncate">{user.recoveryEmail || 'None added'}</strong>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-zinc-550 block">Title / Specialty</span>
                    <strong className="text-zinc-200 block truncate">{editProfessionalTitle || 'Creative Generalist'}</strong>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-zinc-550 block">Location</span>
                    <strong className="text-zinc-200 block truncate">{editLocation || 'Earth Orbit'}</strong>
                  </div>
                </div>
              </div>

              {/* NOTIFICATION PREFERENCES */}
              <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/60 space-y-3">
                <div className="flex items-center gap-2 border-b border-neutral-900 pb-2">
                  <Bell className="h-4.5 w-4.5 text-indigo-400" />
                  <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-white">Notifications</h4>
                </div>

                <div className="space-y-3.5 mt-2.5">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={notifEmail} 
                      onChange={() => setNotifEmail(!notifEmail)}
                      className="mt-0.5 rounded border-neutral-800 bg-neutral-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-neutral-955 h-3.5 w-3.5 cursor-pointer accent-indigo-500"
                    />
                    <div className="text-left leading-none">
                      <strong className="text-xs text-zinc-250 block font-bold leading-tight">Email Notifications</strong>
                      <span className="text-[10px] text-zinc-500 block mt-0.5">System logs, monthly summaries, and email draft digests.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={notifPush} 
                      onChange={() => setNotifPush(!notifPush)}
                      className="mt-0.5 rounded border-neutral-800 bg-neutral-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-neutral-955 h-3.5 w-3.5 cursor-pointer accent-indigo-500"
                    />
                    <div className="text-left leading-none">
                      <strong className="text-xs text-zinc-250 block font-bold leading-tight">Web Push Notifications</strong>
                      <span className="text-[10px] text-zinc-500 block mt-0.5">Instant browser updates and live activity alert indicators.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={notifSecurity} 
                      onChange={() => setNotifSecurity(!notifSecurity)}
                      className="mt-0.5 rounded border-neutral-800 bg-neutral-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-neutral-955 h-3.5 w-3.5 cursor-pointer accent-indigo-500"
                    />
                    <div className="text-left leading-none">
                      <strong className="text-xs text-zinc-250 block font-bold leading-tight">Security & Key Rotations</strong>
                      <span className="text-[10px] text-zinc-500 block mt-0.5">Urgent notifications for unrecognized terminal authorizations or MFA events.</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* MANAGED SUBSCRIPTIONS CARD */}
              <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/60 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-emerald-400" />
                    <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-white">Visual Subscriptions</h4>
                  </div>
                  <p className="text-[10px] text-zinc-450 mt-0.5">
                    Current subscription: <strong className="text-indigo-400 uppercase font-mono">{activeTier}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSubscriptionModal(true)}
                  className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-zinc-300 hover:text-white text-[10.5px] uppercase font-bold tracking-wider rounded-lg border border-neutral-850 hover:border-neutral-700 transition-all cursor-pointer font-sans"
                >
                  Manage subscription
                </button>
              </div>

              {/* ACCESSIBILITY & LAYOUT PANEL */}
              <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/60 space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-950 pb-2">
                  <Settings className="h-4 w-4 text-cyan-400" />
                  <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-white">Accessibility & Scaling</h4>
                </div>

                {/* High Contrast */}
                <div className="flex items-center justify-between">
                  <div className="text-left font-sans">
                    <h5 className="font-bold text-xs capitalize">High contrast mode</h5>
                    <p className="text-[10px] text-neutral-550">Increases structural visibility barriers.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => saveAccessibilitySettings({ highContrast: !highContrast })}
                    className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                      highContrast ? 'bg-indigo-600' : 'bg-neutral-800'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                      highContrast ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Reduced Motion Toggle */}
                <div className="flex items-center justify-between">
                  <div className="text-left font-sans">
                    <h5 className="font-bold text-xs capitalize">Reduced motion constraints</h5>
                    <p className="text-[10px] text-neutral-550">Disables complex float particle loops.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => saveAccessibilitySettings({ reducedMotion: !motionSetting })}
                    className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                      motionSetting ? 'bg-indigo-600' : 'bg-neutral-800'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                      motionSetting ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Font Modifier Control */}
                <div className="space-y-2">
                  <div className="flex justify-between pl-0.5 font-sans">
                    <h5 className="font-bold text-xs capitalize">Identity text scale</h5>
                    <span className="text-[10px] font-sans font-semibold text-indigo-400 capitalize">{fontSize}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-950 border border-neutral-900 rounded-lg">
                    {(['sm', 'md', 'lg'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => saveAccessibilitySettings({ fontSize: sz })}
                        className={`py-1 rounded text-xxs font-sans font-semibold uppercase cursor-pointer transition-colors ${
                          fontSize === sz ? 'bg-indigo-600 text-white' : 'text-neutral-500 hover:text-white'
                        }`}
                      >
                        {sz === 'sm' ? 'SMALL' : sz === 'lg' ? 'LARGE' : 'STAND'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* CORE IDENTITY PORTAL OVERLAYS (MODALS) */}
      <AnimatePresence>
        {/* EDIT PROFILE MODAL */}
        {showEditProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={`w-full max-w-md rounded-2xl border ${
                activeTheme === 'glass-light'
                  ? 'bg-white border-slate-200 text-slate-900 shadow-xl'
                  : 'bg-neutral-950 border-neutral-900 text-white shadow-2xl'
              } p-5 relative overflow-hidden`}
            >
              <div className="flex items-center justify-between border-b border-neutral-900/10 dark:border-neutral-900/50 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-indigo-400" />
                  <h4 className="font-sans font-bold text-xs uppercase tracking-wider">EDIT PROFILE</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="p-1 hover:bg-neutral-800/20 rounded text-neutral-450 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateCreatorProfile} className="space-y-3.5 max-h-[75vh] overflow-y-auto no-scrollbar pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 text-left">
                    <label htmlFor="edit_fullName_field" className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5">DISPLAY NAME</label>
                    <input
                      id="edit_fullName_field"
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      required
                      maxLength={50}
                      className="w-full text-xs font-sans p-2 rounded-lg bg-neutral-900/40 border border-neutral-850 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white"
                      placeholder="e.g. Satoshi Nakamoto"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label htmlFor="edit_recoveryEmail_field" className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5">RECOVERY EMAIL</label>
                    <input
                      id="edit_recoveryEmail_field"
                      type="email"
                      value={editRecoveryEmail}
                      onChange={(e) => setEditRecoveryEmail(e.target.value)}
                      maxLength={80}
                      className="w-full text-xs font-sans p-2 rounded-lg bg-neutral-900/40 border border-neutral-850 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white"
                      placeholder="e.g. alert-recovery@proton.me"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 text-left">
                    <label htmlFor="edit_proTitle_field" className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5">PROFESSIONAL TITLE</label>
                    <input
                      id="edit_proTitle_field"
                      type="text"
                      value={editProfessionalTitle}
                      onChange={(e) => setEditProfessionalTitle(e.target.value)}
                      maxLength={100}
                      className="w-full text-xs font-sans p-2 rounded-lg bg-neutral-900/40 border border-neutral-850 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white"
                      placeholder="e.g. 3D Generative Visualizer"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label htmlFor="edit_location_field" className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5">LOCATION</label>
                    <input
                      id="edit_location_field"
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      maxLength={100}
                      className="w-full text-xs font-sans p-2 rounded-lg bg-neutral-900/40 border border-neutral-850 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white"
                      placeholder="e.g. San Francisco, CA"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label htmlFor="edit_avatarUrl_field" className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5 flex justify-between">
                    <span>AVATAR IMAGE URL</span>
                    <span className="text-indigo-400 text-[8px] lowercase">Quick Preset avatars below</span>
                  </label>
                  <input
                    id="edit_avatarUrl_field"
                    type="url"
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    maxLength={250}
                    className="w-full text-xs font-sans p-2 rounded-lg bg-neutral-900/40 border border-neutral-850 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white font-mono"
                    placeholder="https://images.unsplash.com/..."
                  />

                  {/* Avatar Quick Presets Row */}
                  <div className="flex gap-1.5 flex-wrap pt-1">
                    {[
                      { name: 'Abstract Cyber', link: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=150&h=150&fit=crop&q=80' },
                      { name: 'Neon Shape', link: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop&q=80' },
                      { name: 'Aesthetic Light', link: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=150&h=150&fit=crop&q=80' },
                      { name: 'Satoshi Space', link: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=150&h=150&fit=crop&q=80' },
                    ].map((p, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setEditAvatarUrl(p.link)}
                        className={`px-2 py-0.5 text-[8px] font-sans rounded border cursor-pointer transition-colors ${
                          editAvatarUrl === p.link 
                            ? 'bg-indigo-600 border-indigo-500 text-white font-bold' 
                            : 'bg-neutral-900 border-neutral-850 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label htmlFor="edit_coverUrl_field" className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5 flex justify-between">
                    <span>BANNER IMAGE URL (COVER)</span>
                    <span className="text-indigo-400 text-[8px] lowercase">Quick Preset Banners below</span>
                  </label>
                  <input
                    id="edit_coverUrl_field"
                    type="url"
                    value={editCoverUrl}
                    onChange={(e) => setEditCoverUrl(e.target.value)}
                    maxLength={250}
                    className="w-full text-xs font-sans p-2 rounded-lg bg-neutral-900/40 border border-neutral-850 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white font-mono"
                    placeholder="https://images.unsplash.com/..."
                  />

                  {/* Backdrop Quick Presets Row */}
                  <div className="flex gap-1.5 flex-wrap pt-1">
                    {[
                      { name: 'Minimal Lava', link: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&q=80' },
                      { name: 'Dark Dunes', link: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1000&q=80' },
                      { name: 'Liquid Silk', link: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&q=80' },
                      { name: 'Prism Glass', link: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1000&q=80' },
                    ].map((p, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setEditCoverUrl(p.link)}
                        className={`px-2 py-0.5 text-[8px] font-sans rounded border cursor-pointer transition-colors ${
                          editCoverUrl === p.link 
                            ? 'bg-indigo-600 border-indigo-500 text-white font-bold' 
                            : 'bg-neutral-900 border-neutral-850 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-neutral-900/80 pt-2.5 space-y-2">
                  <span className="text-[8.5px] font-sans text-neutral-500 uppercase tracking-wider font-extrabold block">PORTFOLIO & SOCIAL LINKS</span>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1 text-left">
                      <label className="text-[8px] font-bold text-neutral-450 uppercase pl-0.5">BEHANCE</label>
                      <input
                        type="url"
                        value={editBehanceUrl}
                        onChange={(e) => setEditBehanceUrl(e.target.value)}
                        placeholder="https://behance.net/..."
                        className="w-full text-[10px] p-2 rounded-md bg-neutral-900/40 border border-neutral-850 text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[8px] font-bold text-neutral-450 uppercase pl-0.5">ARTSTATION</label>
                      <input
                        type="url"
                        value={editArtstationUrl}
                        onChange={(e) => setEditArtstationUrl(e.target.value)}
                        placeholder="https://artstation.com/..."
                        className="w-full text-[10px] p-2 rounded-md bg-neutral-900/40 border border-neutral-850 text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[8px] font-bold text-neutral-450 uppercase pl-0.5">DRIBBBLE</label>
                      <input
                        type="url"
                        value={editDribbbleUrl}
                        onChange={(e) => setEditDribbbleUrl(e.target.value)}
                        placeholder="https://dribbble.com/..."
                        className="w-full text-[10px] p-2 rounded-md bg-neutral-900/40 border border-neutral-850 text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 justify-end border-t border-neutral-900/50 mt-1">
                  <button
                    type="button"
                    onClick={() => setShowEditProfileModal(false)}
                    className="px-3.5 py-1.5 text-[10px] font-sans font-semibold border border-neutral-850 rounded-lg hover:bg-neutral-900 transition-colors text-neutral-450 cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={editProfileSubmitting}
                    className="px-4 py-1.5 text-[10px] font-sans font-bold text-white bg-indigo-600 hover:bg-indigo-550 rounded-lg shadow shadow-indigo-500/10 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {editProfileSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
                    SAVE CHANGES
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* CHANGE PASSWORD MODAL */}
        {showChangePasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={`w-full max-w-sm rounded-2xl border ${
                activeTheme === 'glass-light'
                  ? 'bg-slate-50 border-slate-200 text-slate-900 shadow-xl'
                  : 'bg-neutral-950 border-neutral-900 text-white'
              } p-5 shadow-2xl relative overflow-hidden`}
            >
              <div className="flex items-center justify-between border-b border-neutral-900/10 dark:border-neutral-900/50 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <KeySquare className="h-4 w-4 text-cyan-400" />
                  <h4 className="font-sans font-bold text-xs uppercase tracking-wider">Rotate Password Shield</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="p-1 hover:bg-neutral-800/20 rounded text-neutral-450 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                {changePasswordError && (
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[10px] text-rose-400 font-sans leading-tight">
                    {changePasswordError}
                  </div>
                )}
                {changePasswordSuccess && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] text-emerald-400 font-sans leading-tight">
                    {changePasswordSuccess}
                  </div>
                )}

                <div className="space-y-1 text-left">
                  <label htmlFor="old_pass_field" className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5">CURRENT ACCESS SECRET</label>
                  <input
                    id="old_pass_field"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full text-xs font-sans p-2.5 rounded-lg bg-neutral-900/40 border border-neutral-800/80 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white"
                    placeholder="••••••••••••"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label htmlFor="new_pass_field" className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5">NEW ACCESS SHIELD</label>
                  <input
                    id="new_pass_field"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full text-xs font-sans p-2.5 rounded-lg bg-neutral-900/40 border border-neutral-800/80 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white"
                    placeholder="••••••••••••"
                  />
                </div>

                {/* Password Criteria indicators */}
                <div className="p-2.5 rounded-lg bg-neutral-900/20 border border-neutral-850 space-y-1.5 text-left text-[9px]">
                  <span className="font-bold text-neutral-500 block text-[8px] uppercase tracking-wider">STRENGTH REGULATORS:</span>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                    <span className={`flex items-center gap-1 ${newPassword.length >= 8 ? 'text-emerald-400 font-semibold' : 'text-neutral-500'}`}>
                      <Check className="h-2.5 w-2.5" /> 8+ Characters
                    </span>
                    <span className={`flex items-center gap-1 ${/[A-Z]/.test(newPassword) ? 'text-emerald-400 font-semibold' : 'text-neutral-500'}`}>
                      <Check className="h-2.5 w-2.5" /> 1+ Uppercase
                    </span>
                    <span className={`flex items-center gap-1 ${/[a-z]/.test(newPassword) ? 'text-emerald-400 font-semibold' : 'text-neutral-500'}`}>
                      <Check className="h-2.5 w-2.5" /> 1+ Lowercase
                    </span>
                    <span className={`flex items-center gap-1 ${/[0-9]/.test(newPassword) ? 'text-emerald-400 font-semibold' : 'text-neutral-500'}`}>
                      <Check className="h-2.5 w-2.5" /> 1+ Digit
                    </span>
                    <span className={`flex items-center gap-1 ${/[^A-Za-z0-9]/.test(newPassword) ? 'text-emerald-400 font-semibold' : 'text-neutral-500'}`}>
                      <Check className="h-2.5 w-2.5" /> Special Symbol
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowChangePasswordModal(false)}
                    className="px-3.5 py-2 text-[10.5px] font-sans font-semibold border border-neutral-850 rounded-lg hover:bg-neutral-900 transition-colors text-neutral-450 cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={changePasswordSubmitting}
                    className="px-4 py-2 text-[10.5px] font-sans font-bold text-white bg-indigo-600 hover:bg-indigo-550 rounded-lg shadow shadow-indigo-500/10 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {changePasswordSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
                    ROTATION COMPLETE
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* SUBSCRIPTION PLAN SWITCHER */}
        {showSubscriptionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={`w-full max-w-sm rounded-2xl border ${
                activeTheme === 'glass-light'
                  ? 'bg-slate-50 border-slate-200 text-slate-900 shadow-xl'
                  : 'bg-neutral-950 border-neutral-900 text-white'
              } p-5 shadow-2xl relative overflow-hidden`}
            >
              <div className="flex items-center justify-between border-b border-neutral-900/10 dark:border-neutral-900/50 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-400" />
                  <h4 className="font-sans font-bold text-xs uppercase tracking-wider">Select Subscription Plan</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSubscriptionModal(false)}
                  className="p-1 hover:bg-neutral-800/20 rounded text-neutral-450 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar pr-0.5">
                {[
                  {
                    id: "Developer Sandbox",
                    name: "Developer Sandbox",
                    price: "Free",
                    desc: "Hobbyist testing workspace and manual scanning.",
                    features: ["2 Active project slots", "5/mo Advisor queries", "Basic TOTP standard"]
                  },
                  {
                    id: "Pro Defender",
                    name: "Pro Defender",
                    price: "$29/mo",
                    desc: "Mainstream secure terminal with full neural diagnostics.",
                    features: ["5 Active project slots", "10/mo Advisor queries", "Priority server response", "Interactive dashboards"]
                  },
                  {
                    id: "Enterprise Operations",
                    name: "Enterprise Operations",
                    price: "$149/mo",
                    desc: "Unlimited cognitive threat intelligence scanning.",
                    features: ["Unlimited project slots", "Unlimited advisor queries", "FIDO2 security lock support", "Dedicated support dispatcher"]
                  }
                ].map((tierItem) => {
                  const isActive = activeTier === tierItem.id;
                  return (
                    <motion.div
                      key={tierItem.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => {
                        setActiveTier(tierItem.id as any);
                        statusCallback(`Tier changed: ${tierItem.name}`, <CheckCircle className="h-4 w-4 text-emerald-400" />);
                        setTimeout(() => setShowSubscriptionModal(false), 800);
                      }}
                      className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        isActive
                          ? 'border-indigo-500 bg-indigo-950/20 text-white'
                          : 'border-neutral-900 bg-neutral-950/20 hover:border-neutral-800 text-neutral-400'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-sans font-bold text-xs text-white">{tierItem.name}</span>
                        <span className="text-[10px] font-mono font-bold text-indigo-400">{tierItem.price}</span>
                      </div>
                      <p className="text-[9px] text-neutral-450 mb-2 leading-relaxed">{tierItem.desc}</p>
                      
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 border-t border-neutral-900/60 pt-2 text-[8px] text-neutral-500">
                        {tierItem.features.map((f, fi) => (
                          <span key={fi} className="flex items-center gap-0.5">
                            <Check className="h-2 w-2 text-indigo-400" /> {f}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end pt-4 mt-1">
                <button
                  type="button"
                  onClick={() => setShowSubscriptionModal(false)}
                  className="px-4 py-2 text-[10.5px] font-sans font-bold text-white bg-indigo-600 hover:bg-indigo-550 rounded-lg shadow shadow-indigo-500/10 cursor-pointer"
                >
                  DONE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* HIGH-FIDELITY PROJECT CONFIGURATOR MODAL */}
        {showProjectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-md rounded-2xl border border-neutral-900 bg-neutral-950 text-white p-5 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
                <div className="flex items-center gap-2 text-indigo-400">
                  <LayoutGrid className="h-4 w-4" />
                  <h4 className="font-sans font-black text-xs uppercase tracking-wider">
                    {selectedProject ? 'EDIT PORTFOLIO PROJECT ASSET' : 'CREATE PORTFOLIO PROJECT ASSET'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProject} className="space-y-3.5 max-h-[75vh] overflow-y-auto no-scrollbar pr-1">
                <div className="space-y-1 text-left">
                  <label htmlFor="proj_title_field" className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5">Project Title</label>
                  <input
                    id="proj_title_field"
                    type="text"
                    value={projTitle}
                    onChange={(e) => setProjTitle(e.target.value)}
                    required
                    maxLength={100}
                    className="w-full text-xs font-sans p-2 rounded-lg bg-neutral-900/40 border border-neutral-850 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white"
                    placeholder="e.g. Neo-Tokyo Highrise Concept"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5">Asset State Category</label>
                    <select
                      value={projCategory}
                      onChange={(e) => setProjCategory(e.target.value)}
                      className="w-full text-xs font-sans p-2 rounded-lg bg-neutral-900/40 border border-neutral-850 text-white focus:outline-none"
                    >
                      {['3D Modeling', 'Branding', 'Vector Art', 'UI/UX Layouts', 'Futurism'].map(cat => (
                        <option key={cat} value={cat} className="bg-neutral-950 text-white">{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5">Screen Aspect Ratio</label>
                    <div className="grid grid-cols-3 gap-1 bg-neutral-900/30 p-0.5 rounded-lg border border-neutral-850">
                      {(['4:3', '1:1', '16:9'] as const).map(ratio => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => setProjAspectRatio(ratio)}
                          className={`py-1 text-[9px] font-mono font-semibold rounded cursor-pointer transition-colors ${
                            projAspectRatio === ratio 
                              ? 'bg-indigo-600 text-white' 
                              : 'text-neutral-500 hover:text-white'
                          }`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5">Portfolio status tab</label>
                    <select
                      value={projStatus}
                      onChange={(e) => setProjStatus(e.target.value as any)}
                      className="w-full text-xs font-sans p-2 rounded-lg bg-neutral-900/40 border border-neutral-850 text-white focus:outline-none"
                    >
                      {['Published', 'Draft', 'Collection'].map(st => (
                        <option key={st} value={st} className="bg-neutral-950 text-white">{st}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5">Review Pipeline State</label>
                    <select
                      value={projReviewStatus}
                      onChange={(e) => setProjReviewStatus(e.target.value as any)}
                      className="w-full text-xs font-sans p-2 rounded-lg bg-neutral-900/40 border border-neutral-850 text-white focus:outline-none"
                    >
                      {['Approved', 'In Review', 'Awaiting Feedback'].map(rev => (
                        <option key={rev} value={rev} className="bg-neutral-950 text-white">{rev}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label htmlFor="proj_thumbnail_field" className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5 flex justify-between">
                    <span>Thumbnail Image URL Or preset</span>
                    <span className="text-zinc-500 hover:text-indigo-400 text-[8px] transition-colors cursor-pointer" onClick={() => setProjThumbnail(`https://images.unsplash.com/photo-${Date.now().toString().slice(-8)}`)}>randomized</span>
                  </label>
                  <input
                    id="proj_thumbnail_field"
                    type="url"
                    value={projThumbnail}
                    onChange={(e) => setProjThumbnail(e.target.value)}
                    required
                    className="w-full text-xs font-sans p-2 rounded-lg bg-neutral-900/40 border border-neutral-850 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white font-mono"
                    placeholder="https://images.unsplash.com/..."
                  />

                  {/* Thumbnail library options grid presets */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1.5">
                    {[
                      { name: 'Glass Mesh', link: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80' },
                      { name: 'Cosmic Orb', link: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=500&q=80' },
                      { name: 'Sleek Cyber', link: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&q=80' },
                      { name: 'Abstract Grid', link: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=500&q=80' },
                    ].map((galleryItem, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setProjThumbnail(galleryItem.link)}
                        className={`group relative aspect-video rounded-md border text-left overflow-hidden cursor-pointer transition-colors ${
                          projThumbnail === galleryItem.link 
                            ? 'border-indigo-500 shadow shadow-indigo-500/25 ring-1 ring-indigo-500' 
                            : 'border-neutral-850'
                        }`}
                      >
                        <img src={galleryItem.link} alt={galleryItem.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        <span className="absolute bottom-0.5 left-0.5 bg-black/80 px-1 rounded text-[6px] font-sans font-bold text-white uppercase truncate max-w-[90%]">
                          {galleryItem.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label htmlFor="proj_desc_field" className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5">Project description</label>
                  <textarea
                    id="proj_desc_field"
                    value={projDesc}
                    onChange={(e) => setProjDesc(e.target.value)}
                    maxLength={300}
                    rows={3}
                    className="w-full text-xs font-sans p-2 rounded-lg bg-neutral-900/40 border border-neutral-850 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white"
                    placeholder="Brief description or aesthetic guidelines..."
                  />
                </div>

                <div className="flex items-center gap-2 pt-3 justify-end border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowProjectModal(false)}
                    className="px-3.5 py-1.5 text-[10px] font-sans font-semibold border border-neutral-850 rounded-lg hover:bg-neutral-900 transition-colors text-neutral-450 cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={projectFormSubmitting}
                    className="px-4 py-1.5 text-[10px] font-sans font-bold text-white bg-indigo-600 hover:bg-indigo-550 rounded-lg shadow shadow-indigo-500/10 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 animate-pulse"
                  >
                    {projectFormSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
                    {selectedProject ? 'SYNCHRONIZE DRAWING CHANGES' : 'PUBLISH ASSET TO GRID'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
