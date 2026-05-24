export interface UserProfile {
  id: string;
  fullName: string;
  username: string;
  email: string;
  mfaEnabled: boolean;
  mfaVerified: boolean;
  emailVerified: boolean;
  theme: 'cyberpunk' | 'neon' | 'glass-dark' | 'glass-light';
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'sm' | 'md' | 'lg';
  recoveryEmail?: string;
  professionalTitle?: string;
  location?: string;
  coverUrl?: string;
  avatarUrl?: string;
  behanceUrl?: string;
  artstationUrl?: string;
  dribbbleUrl?: string;
  verifiedStatus?: 'unverified' | 'creator' | 'enterprise_verified';
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  aspectRatio: '4:3' | '1:1' | '16:9';
  tags: string[];
  status: 'Published' | 'Draft' | 'Collection';
  viewCount: number;
  likes: number;
  commentsCount: number;
  reviewStatus: 'Approved' | 'In Review' | 'Awaiting Feedback';
  createdAt: string;
}

export interface UserSession {
  id: string;
  device: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface SecurityStatus {
  isMfaActive: boolean;
  isEmailVerified: boolean;
  strengthScore: number; // 0-100 password strength or overall rating
  activeSessionsCount: number;
  lastPasswordChange: string;
}

export interface ServerResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
  source?: string;
  mfaRequired?: boolean;
  tempToken?: string;
  available?: boolean;
}

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  sessions: UserSession[];
  security: SecurityStatus;
}
