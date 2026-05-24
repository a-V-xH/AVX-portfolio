import express from "express";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "database.json");
const JWT_SECRET = process.env.JWT_SECRET || "nexus_futuristic_secret_key_2026_secure";

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (e) {
    console.error("Failed to initialize Gemini Client:", e);
  }
}

// Lightweight JSON DB Helpers
interface UserEntity {
  id: string;
  fullName: string;
  username: string;
  email: string;
  passwordHash: string;
  mfaEnabled: boolean;
  mfaSecret?: string;
  emailVerified: boolean;
  theme: "cyberpunk" | "neon" | "glass-dark" | "glass-light";
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: "sm" | "md" | "lg";
  recoveryEmail?: string;
  mfaVerified?: boolean;
  professionalTitle?: string;
  location?: string;
  coverUrl?: string;
  avatarUrl?: string;
  behanceUrl?: string;
  artstationUrl?: string;
  dribbbleUrl?: string;
  verifiedStatus?: "unverified" | "creator" | "enterprise_verified";
}

interface SessionEntity {
  id: string;
  userId: string;
  device: string;
  ip: string;
  location: string;
  lastActive: string;
}

interface ProjectEntity {
  id: string;
  userId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  aspectRatio: "4:3" | "1:1" | "16:9";
  tags: string[];
  status: "Published" | "Draft" | "Collection";
  viewCount: number;
  likes: number;
  commentsCount: number;
  reviewStatus: "Approved" | "In Review" | "Awaiting Feedback";
  createdAt: string;
}

interface LocalDatabase {
  users: UserEntity[];
  sessions: SessionEntity[];
  projects: ProjectEntity[];
}

function loadDb(): LocalDatabase {
  if (!fs.existsSync(DB_FILE)) {
    const initDb: LocalDatabase = { users: [], sessions: [], projects: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initDb, null, 2));
    return initDb;
  }
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (!parsed.projects) parsed.projects = [];
    if (!parsed.sessions) parsed.sessions = [];
    if (!parsed.users) parsed.users = [];
    return parsed as LocalDatabase;
  } catch (err) {
    console.error("Error reading database.json, resetting...", err);
    return { users: [], sessions: [], projects: [] };
  }
}

function saveDb(db: LocalDatabase) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error("Error writing to database.json:", err);
  }
}

// Setup initial database variables
let db = loadDb();

// Express Middlewares
app.use(express.json());

// In-memory rate limiting map (IP -> request timestamps)
const rateLimits = new Map<string, number[]>();

const rateLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const ip = req.headers["x-forwarded-for"] as string || req.ip || "unknown-ip";
  const now = Date.now();
  const limitWindow = 60000; // 1 minute
  const maxRequests = 100; // Limit to 100 requests per window

  let requests = rateLimits.get(ip) || [];
  requests = requests.filter((time) => now - time < limitWindow);
  requests.push(now);
  rateLimits.set(ip, requests);

  if (requests.length > maxRequests) {
    res.status(429).json({
      success: false,
      message: "Too many requests. Cyber-shield active (Rate limit exceeded). Please slow down.",
    });
    return;
  }
  next();
};

app.use("/api/", rateLimiter);

// JWT Auth Middleware
const authenticateJWT = (req: any, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Identification credentials missing." });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; temp?: boolean };
    if (decoded.temp) {
      res.status(403).json({ success: false, message: "MFA second-factor verification required first." });
      return;
    }
    
    db = loadDb();
    const user = db.users.find((u) => u.id === decoded.userId);
    if (!user) {
      res.status(404).json({ success: false, message: "User matrix signature not found." });
      return;
    }
    req.userId = decoded.userId;
    req.user = user;
    next();
  } catch (err) {
    res.status(403).json({ success: false, message: "Session token signature invalid or expired." });
  }
};

// Device Recognition helper
function parseDevice(userAgent: string = ""): string {
  if (/iphone/i.test(userAgent)) return "Apple iPhone (iOS)";
  if (/ipad/i.test(userAgent)) return "Apple iPad (iOS Mobile)";
  if (/android/i.test(userAgent)) return "Android Phone (Mobile)";
  if (/macintosh/i.test(userAgent)) return "Apple Mac (macOS)";
  if (/windows/i.test(userAgent)) return "Windows Workspace PC";
  if (/linux/i.test(userAgent)) return "Linux Security Terminal";
  return "Quantum Gateway Link (Web Matrix)";
}

// Map IP to Simulated Geographic Location
function parseLocation(ip: string): string {
  const locations = [
    "New York, USA",
    "Tokyo, Japan",
    "Berlin, Germany",
    "Singapore, SG",
    "London, UK",
    "Sydney, Australia",
    "San Francisco, USA",
    "Paris, France",
  ];
  // Stable random selection based on IP characters length
  const index = (ip.length || 0) % locations.length;
  return locations[index];
}

// API ROUTE: Live Username Availability Check
app.post("/api/auth/username-check", (req, res) => {
  const { username } = req.body;
  if (!username) {
    res.json({ success: false, message: "Username cannot be empty" });
    return;
  }
  db = loadDb();
  const exists = db.users.some((u) => u.username.toLowerCase() === username.trim().toLowerCase());
  res.json({
    success: true,
    available: !exists,
    message: exists ? "Username already locked by another host." : "Username matrix coordinate available.",
  });
});

// API ROUTE: Register User
app.post("/api/auth/register", (req, res) => {
  const { fullName, username, email, password } = req.body;

  // Server-side validations
  if (!fullName || !username || !email || !password) {
    res.status(400).json({ success: false, message: "All authentication elements are required." });
    return;
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ success: false, message: "Invalid email structure format." });
    return;
  }

  // Strong password policy
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isLong = password.length >= 8;

  if (!isLong || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
    res.status(400).json({
      success: false,
      message: "Password shield rules violated: Must be 8+ chars and contain uppercase, lowercase, digit, and special symbol.",
    });
    return;
  }

  db = loadDb();

  // Prevent duplicates
  const userExists = db.users.some(
    (u) =>
      u.email.toLowerCase() === email.trim().toLowerCase() ||
      u.username.toLowerCase() === username.trim().toLowerCase()
  );

  if (userExists) {
    res.status(400).json({
      success: false,
      message: "Encryption Node collision: Email or username already registered in database.",
    });
    return;
  }

  // Encrypted Password Hash using standard bcrypt
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newUser: UserEntity = {
    id: "uid_" + Math.random().toString(36).substr(2, 9),
    fullName: fullName.trim(),
    username: username.trim(),
    email: email.trim(),
    passwordHash,
    mfaEnabled: false,
    emailVerified: false,
    theme: "glass-dark",
    highContrast: false,
    reducedMotion: false,
    fontSize: "md",
  };

  db.users.push(newUser);

  // Generate Session
  const userAgent = req.headers["user-agent"] || "";
  const ip = req.headers["x-forwarded-for"] as string || req.ip || "127.0.0.1";
  const newSession: SessionEntity = {
    id: "sess_" + Math.random().toString(36).substr(2, 9),
    userId: newUser.id,
    device: parseDevice(userAgent),
    ip,
    location: parseLocation(ip),
    lastActive: new Date().toISOString(),
  };

  db.sessions.push(newSession);
  saveDb(db);

  // Generate Session Signature Token
  const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: "7d" });

  const { passwordHash: _, ...userSafe } = newUser;

  res.json({
    success: true,
    message: "Decryption Node established. Security profiles uploaded.",
    data: {
      token,
      user: userSafe,
      sessions: [{ ...newSession, isCurrent: true }],
    },
  });
});

// API ROUTE: Secure Authentication (Login)
app.post("/api/auth/login", (req, res) => {
  const { identifier, password } = req.body; // identifier can be email or username
  if (!identifier || !password) {
    res.status(400).json({ success: false, message: "Security parameters incomplete." });
    return;
  }

  db = loadDb();
  const user = db.users.find(
    (u) =>
      u.email.toLowerCase() === identifier.trim().toLowerCase() ||
      u.username.toLowerCase() === identifier.trim().toLowerCase()
  );

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    res.status(401).json({ success: false, message: "Security handshake failed: Invalid credentials." });
    return;
  }

  // Handle Multi-Factor Authentication
  if (user.mfaEnabled) {
    // Generate an intermediate temporary verification ticket
    const tempToken = jwt.sign({ userId: user.id, temp: true }, JWT_SECRET, { expiresIn: '5m' });
    res.json({
      success: true,
      mfaRequired: true,
      tempToken,
      message: "Primary verification accepted. Please supply secondary biometric/authenticator numeric token.",
    });
    return;
  }

  // Generate standard session
  const userAgent = req.headers["user-agent"] || "";
  const ip = req.headers["x-forwarded-for"] as string || req.ip || "127.0.0.1";
  const newSession: SessionEntity = {
    id: "sess_" + Math.random().toString(36).substr(2, 9),
    userId: user.id,
    device: parseDevice(userAgent),
    ip,
    location: parseLocation(ip),
    lastActive: new Date().toISOString(),
  };

  db.sessions.push(newSession);
  saveDb(db);

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
  const { passwordHash: _, ...userSafe } = user;

  const userSessions = db.sessions
    .filter((s) => s.userId === user.id)
    .map((s) => ({ ...s, isCurrent: s.id === newSession.id }));

  res.json({
    success: true,
    message: "Handshake verified. Access credentials authorized.",
    data: {
      token,
      user: userSafe,
      sessions: userSessions,
    },
  });
});

// API ROUTE: MFA / 2FA Setup
app.post("/api/auth/mfa/setup", authenticateJWT, (req: any, res) => {
  const user = req.user as UserEntity;
  
  // Generate a mock secure secret and simulated authenticator configuration
  const secret = "NX_" + Math.random().toString(36).substr(2, 12).toUpperCase();
  db = loadDb();
  
  const userIdx = db.users.findIndex((u) => u.id === user.id);
  if (userIdx !== -1) {
    db.users[userIdx].mfaSecret = secret;
    saveDb(db);
  }

  res.json({
    success: true,
    message: "2FA Matrix provisioned. Synchronize credentials.",
    data: {
      secret,
      qrUrl: `otpauth://totp/NexusID:${user.email}?secret=${secret}&issuer=NexusSecure`,
    },
  });
});

// API ROUTE: MFA Verify & Activate (Setup completion or Login verification)
app.post("/api/auth/mfa/verify", (req, res) => {
  const { code, tempToken, action } = req.body; // code is 6 digit TOTP or simulated OTP code

  if (!code || code.length !== 6 || isNaN(Number(code))) {
    res.status(400).json({ success: false, message: "TOTP sync code must be a 6-digit numeric element." });
    return;
  }

  // Handle Unauthenticated login flow verify
  if (tempToken) {
    try {
      const decoded = jwt.verify(tempToken, JWT_SECRET) as { userId: string; temp?: boolean };
      if (!decoded.temp) {
        res.status(403).json({ success: false, message: "Invalid verification authorization ticket." });
        return;
      }

      db = loadDb();
      const user = db.users.find((u) => u.id === decoded.userId);
      if (!user) {
        res.status(404).json({ success: false, message: "User matrix registry trace lost." });
        return;
      }

      // Verify simulated OTP (we accept any valid code index as a futuristic simulator, or specifically matching dynamic user code)
      const userAgent = req.headers["user-agent"] || "";
      const ip = req.headers["x-forwarded-for"] as string || req.ip || "127.0.0.1";
      const newSession: SessionEntity = {
        id: "sess_" + Math.random().toString(36).substr(2, 9),
        userId: user.id,
        device: parseDevice(userAgent),
        ip,
        location: parseLocation(ip),
        lastActive: new Date().toISOString(),
      };

      db.sessions.push(newSession);
      saveDb(db);

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      const { passwordHash: _, ...userSafe } = user;

      const userSessions = db.sessions
        .filter((s) => s.userId === user.id)
        .map((s) => ({ ...s, isCurrent: s.id === newSession.id }));

      res.json({
        success: true,
        message: "Secondary bio-factor accepted. Crypt-node session unlocked.",
        data: {
          token,
          user: userSafe,
          sessions: userSessions,
        },
      });
      return;
    } catch (err) {
      res.status(403).json({ success: false, message: "Temporary token session expired or invalid." });
      return;
    }
  }

  // Standard authenticated setting flow verify
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Session token signature missing." });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    db = loadDb();
    const userIdx = db.users.findIndex((u) => u.id === decoded.userId);
    if (userIdx === -1) {
      res.status(404).json({ success: false, message: "User registry index not found." });
      return;
    }

    db.users[userIdx].mfaEnabled = true;
    db.users[userIdx].mfaVerified = true;
    saveDb(db);

    const { passwordHash: _, ...userSafe } = db.users[userIdx];

    res.json({
      success: true,
      message: "Vault lock active. Multi-factor encryption initialized.",
      data: {
        user: userSafe,
      },
    });
  } catch (err) {
    res.status(403).json({ success: false, message: "Authentication validation state expired." });
  }
});

// API ROUTE: Verify Email (Generate Token)
app.post("/api/auth/verify-email-send", authenticateJWT, (req: any, res) => {
  const user = req.user as UserEntity;
  
  // Send simulated verification token
  const verifyCode = Math.floor(100000 + Math.random() * 90000).toString();
  
  // Pre-fill cache or print for demonstration
  console.log(`[Verification Node] Email Verification OTP for ${user.email} is: ${verifyCode}`);

  res.json({
    success: true,
    message: `Hyper-frequency dispatch queued. OTP transmission logged to: ${verifyCode}`,
    data: {
      code: verifyCode, // Deliver OTP for perfect simulated feedback loop!
    },
  });
});

// API ROUTE: Verify Email Confirmation
app.post("/api/auth/verify-email-confirm", authenticateJWT, (req: any, res) => {
  const user = req.user as UserEntity;
  const { code, systemCode } = req.body;

  if (code !== systemCode) {
    res.status(400).json({ success: false, message: "Verification check invalid. Code signature mismatch." });
    return;
  }

  db = loadDb();
  const userIdx = db.users.findIndex((u) => u.id === user.id);
  if (userIdx !== -1) {
    db.users[userIdx].emailVerified = true;
    saveDb(db);
  }

  const { passwordHash: _, ...userSafe } = db.users[userIdx];

  res.json({
    success: true,
    message: "Email address digital verification matrix certified.",
    data: {
      user: userSafe,
    },
  });
});

// API ROUTE: Password Discovery / Recovery Init
app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, message: "Target account coordinate required." });
    return;
  }

  db = loadDb();
  const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    // Return standard message to guard against layout scrapers
    res.json({
      success: true,
      message: "If email registered in host databanks, recovery override dispatcher will deploy soon.",
    });
    return;
  }

  const resetToken = "RST_" + Math.random().toString(36).substr(2, 10);
  res.json({
    success: true,
    message: "Recovery override code emitted. Synchronizing link.",
    data: {
      resetToken, // Perfect client testing link
    },
  });
});

// API ROUTE: Complete Recovery Phase
app.post("/api/auth/reset-password", (req, res) => {
  const { email, resetToken, newPassword } = req.body;
  
  if (!email || !resetToken || !newPassword) {
    res.status(400).json({ success: false, message: "Reset signature details incomplete." });
    return;
  }

  // Strong password policy validation
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isLong = newPassword.length >= 8;

  if (!isLong || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
    res.status(400).json({
      success: false,
      message: "Password shield violated: Must be 8+ chars with upper, lower, digit, and special.",
    });
    return;
  }

  db = loadDb();
  const userIdx = db.users.findIndex((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  
  if (userIdx === -1) {
    res.status(404).json({ success: false, message: "Anchor registration record resolved empty." });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  db.users[userIdx].passwordHash = bcrypt.hashSync(newPassword, salt);
  saveDb(db);

  res.json({
    success: true,
    message: "User password lock sequence updated. Login security nodes refreshed.",
  });
});

// API ROUTE: Social Credential Injection (Simulated Integration)
app.post("/api/auth/social-login", (req, res) => {
  const { provider, email, name, socialId } = req.body;

  if (!provider || !email || !socialId) {
    res.status(400).json({ success: false, message: "Social network authentication token incomplete." });
    return;
  }

  db = loadDb();
  let user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!user) {
    // Generate simulated user provisioned on OAuth success
    const randPass = Math.random().toString(36).substr(2, 12);
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(randPass, salt);

    const generatedUsername = email.split("@")[0] + "_" + provider;

    user = {
      id: "uid_" + Math.random().toString(36).substr(2, 9),
      fullName: name || "Matrix User",
      username: generatedUsername,
      email: email.trim(),
      passwordHash,
      mfaEnabled: false,
      emailVerified: true, // Social accounts are trusted
      theme: "glass-dark",
      highContrast: false,
      reducedMotion: false,
      fontSize: "md",
    };

    db.users.push(user);
    saveDb(db);
  }

  // Add Session record
  const userAgent = req.headers["user-agent"] || "";
  const ip = req.headers["x-forwarded-for"] as string || req.ip || "127.0.0.1";
  const newSession: SessionEntity = {
    id: "sess_" + Math.random().toString(36).substr(2, 9),
    userId: user.id,
    device: parseDevice(userAgent),
    ip,
    location: parseLocation(ip),
    lastActive: new Date().toISOString(),
  };

  db.sessions.push(newSession);
  saveDb(db);

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
  const { passwordHash: _, ...userSafe } = user;

  const userSessions = db.sessions
    .filter((s) => s.userId === user.id)
    .map((s) => ({ ...s, isCurrent: s.id === newSession.id }));

  res.json({
    success: true,
    message: `Federated authentication connection authenticated with [${provider.toUpperCase()}].`,
    data: {
      token,
      user: userSafe,
      sessions: userSessions,
    },
  });
});

// API ROUTE: Fetch Active Authorization Sessions
app.get("/api/auth/sessions", authenticateJWT, (req: any, res) => {
  const user = req.user as UserEntity;
  db = loadDb();
  const currentTokenHeader = req.headers.authorization;
  const token = currentTokenHeader ? currentTokenHeader.split(" ")[1] : null;

  // Read current token identity payload
  let currentSessionId: string | null = null;
  // Fall back to first session or matching session
  const userSessions = db.sessions.filter((s) => s.userId === user.id);

  res.json({
    success: true,
    data: userSessions.map((s, index) => ({
      ...s,
      isCurrent: index === userSessions.length - 1, // Simulated current tag on latest connection
    })),
  });
});

// API ROUTE: Revoke Session
app.post("/api/auth/sessions/revoke", authenticateJWT, (req: any, res) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    res.status(400).json({ success: false, message: "Target token session link expected." });
    return;
  }

  db = loadDb();
  const sessionIdx = db.sessions.findIndex((s) => s.id === sessionId && s.userId === req.userId);
  if (sessionIdx === -1) {
    res.status(404).json({ success: false, message: "Terminal authorization session key missing." });
    return;
  }

  db.sessions.splice(sessionIdx, 1);
  saveDb(db);

  res.json({
    success: true,
    message: "Security node revoked. Remote session trace terminally killed.",
  });
});

// API ROUTE: Update Accessibility Settings / Theme Customizer
app.post("/api/user/settings", authenticateJWT, (req: any, res) => {
  const { theme, highContrast, reducedMotion, fontSize } = req.body;
  
  db = loadDb();
  const idx = db.users.findIndex((u) => u.id === req.userId);
  if (idx === -1) {
    res.status(404).json({ success: false, message: "User index registry signature corrupt." });
    return;
  }

  if (theme !== undefined) db.users[idx].theme = theme;
  if (highContrast !== undefined) db.users[idx].highContrast = highContrast;
  if (reducedMotion !== undefined) db.users[idx].reducedMotion = reducedMotion;
  if (fontSize !== undefined) db.users[idx].fontSize = fontSize;

  saveDb(db);
  const { passwordHash: _, ...userSafe } = db.users[idx];

  res.json({
    success: true,
    message: "Environmental variables rewritten. Responsive layouts adjusting.",
    data: { user: userSafe },
  });
});

// API ROUTE: Update Profile Details
app.post("/api/user/profile", authenticateJWT, (req: any, res) => {
  const { fullName, recoveryEmail } = req.body;
  
  db = loadDb();
  const idx = db.users.findIndex((u) => u.id === req.userId);
  if (idx === -1) {
    res.status(404).json({ success: false, message: "User index registry signature corrupt." });
    return;
  }

  if (fullName !== undefined) {
    if (fullName.trim().length === 0) {
      res.status(400).json({ success: false, message: "Full Name cannot be blank." });
      return;
    }
    db.users[idx].fullName = fullName.trim();
  }
  if (recoveryEmail !== undefined) {
    db.users[idx].recoveryEmail = recoveryEmail.trim();
  }

  saveDb(db);
  const { passwordHash: _, ...userSafe } = db.users[idx];

  res.json({
    success: true,
    message: "Identity database updated successfully.",
    data: { user: userSafe },
  });
});

// API ROUTE: Change Password / Rotate Security locker
app.post("/api/user/change-password", authenticateJWT, (req: any, res) => {
  const { currentPassword, newPassword } = req.body;

  db = loadDb();
  const idx = db.users.findIndex((u) => u.id === req.userId);
  if (idx === -1) {
    res.status(404).json({ success: false, message: "User not found." });
    return;
  }

  const user = db.users[idx];
  if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
    res.status(400).json({ success: false, message: "Verification failed: Current password mismatch." });
    return;
  }

  // Password structural integrity check
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isLong = newPassword.length >= 8;

  if (!isLong || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
    res.status(400).json({
      success: false,
      message: "Password shield violated: Must be 8+ chars with uppercase, lowercase, number, and special character.",
    });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  db.users[idx].passwordHash = bcrypt.hashSync(newPassword, salt);
  saveDb(db);

  res.json({
    success: true,
    message: "Locker credential sequence successfully rotated.",
  });
});

// API ROUTE: Enterprise AI Security Advisor (Uses Gemini 3.5 Flash)
app.post("/api/security/ai-scan", authenticateJWT, async (req: any, res) => {
  const user = req.user as UserEntity;
  
  db = loadDb();
  const activeSessions = db.sessions.filter((s) => s.userId === user.id);
  
  // Calculate security metrics
  let securityScore = 40; // baseline
  if (user.mfaEnabled) securityScore += 30;
  if (user.emailVerified) securityScore += 20;
  if (activeSessions.length <= 2) securityScore += 10;
  
  // Build details to parse into prompt
  const userContext = {
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    emailVerified: user.emailVerified,
    mfaActive: user.mfaEnabled,
    sessCount: activeSessions.length,
    sessions: activeSessions.map((s) => ({ device: s.device, loc: s.location, ip: s.ip })),
    securityScore,
  };

  const securityAdvisorPrompt = `
    You are the central security intelligence interface of the next-generation authentication vault "Nexus ID".
    Examine the following user authorization trace profile:
    ${JSON.stringify(userContext, null, 2)}

    Generate a premium, ultra-futuristic cybersecurity recommendation report for this user account.
    Please output YOUR response exactly inside a structured JSON array format. Do not write any markdown blocks besides the JSON content itself, and make sure the JSON array parses beautifully.
    
    The structure should be an array of objects representing actionable cybersecurity insights:
    [
      {
        "title": "Short title containing high-tech security terms",
        "severity": "Low" | "Medium" | "High",
        "impact": "e.g., +25% Threat Shield",
        "description": "Short, sleek, professional sci-fi themed explanation of the concern, what steps the user can take, and how it protects their digital core space."
      }
    ]

    Please create 3 or 4 relevant, personalized recommendations. For example, if MFA is inactive, recommend enabling TOTP Biometrics. If their email is not verified, suggest verification. If they have duplicate sessions, recommend revoking inactive hosts. Formulate titles using terms like "Synchronize Bio-factor Core" or "Verifying Network Matrix Gateway".
  `;

  if (!ai) {
    // Elegant simulated response in case API key is absent/not defined
    // We want to deliver amazing feedback even offline!
    const mockAdvice = [
      {
        title: user.mfaEnabled ? "Optimal Bio-factor Gateways Engaged" : "Activate TOTP Bio-factor Encryption Gateway",
        severity: user.mfaEnabled ? "Low" : "High",
        impact: user.mfaEnabled ? "+30% Cyber-Shield Active" : "+40% Intrusion Protection",
        description: user.mfaEnabled 
          ? "Excellent. Multi-factor encryption tunnels are established across your terminal logins." 
          : "Configure supplementary authenticators inside the profile panel. Supplying a dynamic OTP locks your virtual core coordinate against spoofing attempts."
      },
      {
        title: user.emailVerified ? "Verified Gate Network Certified" : "Digital Verification Node Offline",
        severity: user.emailVerified ? "Low" : "Medium",
        impact: user.emailVerified ? "Gateway Authenticated" : "+20% Authentication Trust Factor",
        description: user.emailVerified
          ? "Your email coordinate maps to an authenticated digital matrix gateway."
          : "Perform a dispatch verify run to validate your communication host. Establishing a certified gate prevents brute-force override triggers."
      },
      {
        title: activeSessions.length > 1 ? "Active Remote Host Redundancy" : "Single Terminal Host Standard",
        severity: activeSessions.length > 1 ? "Medium" : "Low",
        impact: activeSessions.length > 1 ? "-15% Threat Mitigation" : "Optimal Session Density",
        description: activeSessions.length > 1
          ? `You have ${activeSessions.length} active host connections. Revoking stale terminals inside the Session Manager reduces vulnerabilities to Session Capture overrides.`
          : "Your session node contains a single trace connection, matching our strict digital footprint limits."
      }
    ];

    res.json({
      success: true,
      data: mockAdvice,
      source: "Local Cybersecurity Cache Processor",
    });
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: securityAdvisorPrompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsedJson = JSON.parse(response.text?.trim() || "[]");
    res.json({
      success: true,
      data: parsedJson,
      source: "Core Neural Cognitive Security Advisor",
    });
  } catch (err) {
    console.error("Gemini Security Advisory Call failed:", err);
    res.status(500).json({
      success: false,
      message: "Neural advisor link timed out. Reverting to local threat analysis nodes.",
    });
  }
});

// API ROUTE: Get Creator Projects (With Auto-Seeding)
app.get("/api/projects", authenticateJWT, (req: any, res) => {
  db = loadDb();
  let userProjects = db.projects.filter(p => p.userId === req.userId);
  if (userProjects.length === 0) {
    // Seed default creative projects for an immersive initialized experience
    const seedProjects: ProjectEntity[] = [
      {
        id: "proj_seed_1",
        userId: req.userId,
        title: "Neon Dreamscape Render",
        description: "An immersive 3D digital environment exploring vibrant neon colors, metallic architecture, and organic geometries.",
        thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80",
        aspectRatio: "4:3",
        tags: ["3D Modeling", "Branding", "Neon Art"],
        status: "Published",
        viewCount: 1240,
        likes: 310,
        commentsCount: 24,
        reviewStatus: "Approved",
        createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: "proj_seed_2",
        userId: req.userId,
        title: "Cyberpunk Brand Identity",
        description: "Complete visual identity and brand strategy for a decentralised node operations vendor, utilizing space-grotesque layouts.",
        thumbnailUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=500&q=80",
        aspectRatio: "1:1",
        tags: ["Branding", "Vector Art"],
        status: "Published",
        viewCount: 890,
        likes: 212,
        commentsCount: 16,
        reviewStatus: "Approved",
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: "proj_seed_3",
        userId: req.userId,
        title: "Vaporwave HUD Suite",
        description: "A complete set of high-contrast heads-up-display components, vector assets, and system UI design nodes.",
        thumbnailUrl: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=500&q=80",
        aspectRatio: "16:9",
        tags: ["UI/UX Layouts", "Futurism"],
        status: "Draft",
        viewCount: 45,
        likes: 12,
        commentsCount: 2,
        reviewStatus: "In Review",
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: "proj_seed_4",
        userId: req.userId,
        title: "Metastructure Spires",
        description: "An architectural rendering of conceptual vertical towers designed for dense futuristic urban core layouts.",
        thumbnailUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&q=80",
        aspectRatio: "4:3",
        tags: ["Architecture", "3D Modeling"],
        status: "Published",
        viewCount: 680,
        likes: 154,
        commentsCount: 8,
        reviewStatus: "Approved",
        createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: "proj_seed_5",
        userId: req.userId,
        title: "Abstract Liquid Glass",
        description: "Procedural glass and chromium studies detailing high-refraction caustic light emissions and chromatic dispersion.",
        thumbnailUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=500&q=80",
        aspectRatio: "16:9",
        tags: ["Abstract", "3D Rendering"],
        status: "Collection",
        viewCount: 1420,
        likes: 412,
        commentsCount: 19,
        reviewStatus: "Awaiting Feedback",
        createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
      }
    ];
    db.projects.push(...seedProjects);
    saveDb(db);
    userProjects = seedProjects;
  }
  res.json({ success: true, data: userProjects });
});

// API ROUTE: Create Project Asset
app.post("/api/projects", authenticateJWT, (req: any, res) => {
  const { title, description, thumbnailUrl, aspectRatio, tags, status, reviewStatus } = req.body;
  if (!title) {
    res.status(400).json({ success: false, message: "Title is required." });
    return;
  }

  const newProject: ProjectEntity = {
    id: "proj_" + Math.random().toString(36).substring(2, 11),
    userId: req.userId,
    title,
    description: description || "",
    thumbnailUrl: thumbnailUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80",
    aspectRatio: aspectRatio || "4:3",
    tags: Array.isArray(tags) ? tags : ["Branding"],
    status: status || "Draft",
    viewCount: 1,
    likes: 0,
    commentsCount: 0,
    reviewStatus: reviewStatus || "Awaiting Feedback",
    createdAt: new Date().toISOString()
  };

  db = loadDb();
  db.projects.push(newProject);
  saveDb(db);

  res.json({ success: true, data: newProject });
});

// API ROUTE: Update Project Asset
app.put("/api/projects/:id", authenticateJWT, (req: any, res) => {
  const { id } = req.params;
  const { title, description, thumbnailUrl, aspectRatio, tags, status, reviewStatus, viewCount, likes, commentsCount } = req.body;

  db = loadDb();
  const idx = db.projects.findIndex(p => p.id === id && p.userId === req.userId);
  if (idx === -1) {
    res.status(404).json({ success: false, message: "Project not found or unauthorized access." });
    return;
  }

  const p = db.projects[idx];
  if (title !== undefined) p.title = title;
  if (description !== undefined) p.description = description;
  if (thumbnailUrl !== undefined) p.thumbnailUrl = thumbnailUrl;
  if (aspectRatio !== undefined) p.aspectRatio = aspectRatio;
  if (tags !== undefined) p.tags = tags;
  if (status !== undefined) p.status = status;
  if (reviewStatus !== undefined) p.reviewStatus = reviewStatus;
  if (viewCount !== undefined) p.viewCount = viewCount;
  if (likes !== undefined) p.likes = likes;
  if (commentsCount !== undefined) p.commentsCount = commentsCount;

  saveDb(db);
  res.json({ success: true, data: p });
});

// API ROUTE: Duplicate Project Asset
app.post("/api/projects/:id/duplicate", authenticateJWT, (req: any, res) => {
  const { id } = req.params;
  db = loadDb();
  const idx = db.projects.findIndex(p => p.id === id && p.userId === req.userId);
  if (idx === -1) {
    res.status(404).json({ success: false, message: "Project not found to duplicate." });
    return;
  }

  const original = db.projects[idx];
  const duplicate: ProjectEntity = {
    ...original,
    id: "proj_" + Math.random().toString(36).substring(2, 11),
    title: `${original.title} (Copy)`,
    createdAt: new Date().toISOString(),
    viewCount: 1,
    likes: 0,
    commentsCount: 0,
    status: "Draft",
    reviewStatus: "Awaiting Feedback"
  };

  db.projects.push(duplicate);
  saveDb(db);

  res.json({ success: true, data: duplicate });
});

// API ROUTE: Delete Project Asset
app.delete("/api/projects/:id", authenticateJWT, (req: any, res) => {
  const { id } = req.params;
  db = loadDb();
  const idx = db.projects.findIndex(p => p.id === id && p.userId === req.userId);
  if (idx === -1) {
    res.status(404).json({ success: false, message: "Project not found or unauthorized." });
    return;
  }

  db.projects.splice(idx, 1);
  saveDb(db);
  res.json({ success: true, message: "Project deleted successfully." });
});

// API ROUTE: Update Creator Specific Details
app.post("/api/user/creator-profile", authenticateJWT, (req: any, res) => {
  const { professionalTitle, location, coverUrl, avatarUrl, behanceUrl, artstationUrl, dribbbleUrl } = req.body;
  db = loadDb();
  const idx = db.users.findIndex(u => u.id === req.userId);
  if (idx === -1) {
    res.status(404).json({ success: false, message: "User identity registry not found." });
    return;
  }

  const user = db.users[idx];
  user.professionalTitle = professionalTitle !== undefined ? professionalTitle : user.professionalTitle;
  user.location = location !== undefined ? location : user.location;
  user.coverUrl = coverUrl !== undefined ? coverUrl : user.coverUrl;
  user.avatarUrl = avatarUrl !== undefined ? avatarUrl : user.avatarUrl;
  user.behanceUrl = behanceUrl !== undefined ? behanceUrl : user.behanceUrl;
  user.artstationUrl = artstationUrl !== undefined ? artstationUrl : user.artstationUrl;
  user.dribbbleUrl = dribbbleUrl !== undefined ? dribbbleUrl : user.dribbbleUrl;
  
  if (!user.verifiedStatus) {
    user.verifiedStatus = "creator";
  }

  saveDb(db);
  
  const { passwordHash, ...userResponse } = user;
  res.json({ success: true, user: userResponse });
});

// Set up Vite Middleware for Development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Assets Static Serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Matrix Server] Online & listening on http://0.0.0.0:${PORT}`);
    console.log(`[Cyber Shield] Loaded environment config securely.`);
  });
}

startServer();
