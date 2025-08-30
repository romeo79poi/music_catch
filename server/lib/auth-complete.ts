import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import nodemailer from "nodemailer";
import User from "../models/User";
import { connectDB, isMongoConnected } from "./mongodb";

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Email transporter
const emailTransporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// OTP storage (in production, use Redis)
const otpStore = new Map<
  string,
  { code: string; expires: Date; purpose: string }
>();

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: Date }>();

/**
 * Generate JWT tokens
 */
export function generateTokens(
  userId: string,
  email: string,
  username?: string,
) {
  const payload = {
    userId,
    email,
    username: username || email,
    type: "access",
  };

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET || "fallback-secret",
    { expiresIn: "15m" },
  );

  const refreshToken = jwt.sign(
    { ...payload, type: "refresh" },
    process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret",
    { expiresIn: "7d" },
  );

  return { accessToken, refreshToken };
}

/**
 * Verify JWT token
 */
export function verifyToken(
  token: string,
  type: "access" | "refresh" = "access",
): any {
  const secret =
    type === "access"
      ? process.env.JWT_SECRET || "fallback-secret"
      : process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret";

  return jwt.verify(token, secret);
}

/**
 * Hash password
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

/**
 * Verify password
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store OTP with expiration
 */
export function storeOTP(
  identifier: string,
  purpose: string,
  expirationMinutes: number = 10,
): string {
  const code = generateOTP();
  const expires = new Date(Date.now() + expirationMinutes * 60 * 1000);

  otpStore.set(`${identifier}:${purpose}`, { code, expires, purpose });

  // Clean up expired OTPs
  setTimeout(
    () => {
      otpStore.delete(`${identifier}:${purpose}`);
    },
    expirationMinutes * 60 * 1000,
  );

  return code;
}

/**
 * Verify OTP code
 */
export function verifyOTP(
  identifier: string,
  purpose: string,
  code: string,
): boolean {
  const key = `${identifier}:${purpose}`;
  const stored = otpStore.get(key);

  if (!stored) {
    return false;
  }

  if (stored.expires < new Date()) {
    otpStore.delete(key);
    return false;
  }

  if (stored.code !== code) {
    return false;
  }

  // Remove OTP after successful verification
  otpStore.delete(key);
  return true;
}

/**
 * Rate limiting check
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowMinutes: number = 15,
): boolean {
  const now = new Date();
  const stored = rateLimitStore.get(identifier);

  if (!stored || stored.resetTime < now) {
    // Reset or create new rate limit entry
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: new Date(now.getTime() + windowMinutes * 60 * 1000),
    });
    return true;
  }

  if (stored.count >= maxRequests) {
    return false;
  }

  stored.count++;
  return true;
}

/**
 * Send OTP email
 */
export async function sendOTPEmail(
  email: string,
  code: string,
  purpose: string,
): Promise<boolean> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`⚠️ Email not configured, OTP code for ${email}: ${code}`);
    return true; // Return true in development
  }

  try {
    const subject =
      purpose === "signup"
        ? "Welcome to Catch - Verify Your Email"
        : "Catch - Login Verification";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B5CF6;">Catch Music</h2>
        <h3>${purpose === "signup" ? "Welcome to Catch!" : "Login Verification"}</h3>
        <p>Your verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
          ${code}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">Catch Music - Your Social Music Platform</p>
      </div>
    `;

    await emailTransporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: email,
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error("❌ Error sending OTP email:", error);
    return false;
  }
}

/**
 * Verify Google ID token
 */
export async function verifyGoogleToken(idToken: string): Promise<any> {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error("Invalid token payload");
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      verified: payload.email_verified,
    };
  } catch (error) {
    console.error("❌ Google token verification failed:", error);
    throw new Error("Invalid Google token");
  }
}

/**
 * Verify Facebook access token
 */
export async function verifyFacebookToken(accessToken: string): Promise<any> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email,picture`,
    );

    if (!response.ok) {
      throw new Error("Facebook API error");
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture?.data?.url,
    };
  } catch (error) {
    console.error("❌ Facebook token verification failed:", error);
    throw new Error("Invalid Facebook token");
  }
}

/**
 * Create or get user from social login
 */
export async function handleSocialLogin(
  provider: "google" | "facebook",
  profile: any,
) {
  await connectDB();

  const { id, email, name, picture } = profile;

  if (!email) {
    throw new Error("Email is required from social provider");
  }

  // Check if user exists with this email
  let user = await User.findOne({ email });

  if (user) {
    // Update social provider ID if not set
    const providerField = provider === "google" ? "google_id" : "facebook_id";
    if (!user[providerField]) {
      user[providerField] = id;
      user.provider = provider;
      if (picture && !user.profile_image_url) {
        user.profile_image_url = picture;
      }
      await user.save();
    }
  } else {
    // Create new user
    const username =
      email.split("@")[0] + "_" + Math.random().toString(36).substr(2, 4);

    user = await User.create({
      email,
      username,
      name,
      display_name: name,
      profile_image_url: picture || "",
      is_verified: true,
      email_verified: true,
      provider,
      [provider === "google" ? "google_id" : "facebook_id"]: id,
    });
  }

  return user;
}

/**
 * Initialize database connection
 */
export async function ensureDBConnection() {
  if (!isMongoConnected()) {
    const result = await connectDB();
    if (!result.success) {
      throw new Error("Database connection failed");
    }
  }
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
): Promise<boolean> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`⚠️ Email not configured, skipping welcome email for ${email}`);
    return true;
  }

  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B5CF6;">Welcome to Catch Music! 🎵</h2>
        <h3>Hi ${name}!</h3>
        <p>Thanks for joining Catch, your new social music platform where you can:</p>
        <ul>
          <li>��� Discover and stream amazing music</li>
          <li>💬 Chat with friends about your favorite tracks</li>
          <li>🎤 Join voice rooms and connect with other music lovers</li>
          <li>📱 Create and share playlists</li>
          <li>🔥 Get personalized recommendations</li>
        </ul>
        <p>Your musical journey starts now. Let's catch some great vibes!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || "http://localhost:8080"}" 
             style="background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Start Exploring
          </a>
        </div>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">Catch Music - Where Music Meets Social</p>
      </div>
    `;

    await emailTransporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: email,
      subject: "Welcome to Catch Music! 🎵",
      html,
    });

    return true;
  } catch (error) {
    console.error("❌ Error sending welcome email:", error);
    return false;
  }
}

/**
 * Generate username from email
 */
export function generateUsername(email: string): string {
  const baseUsername = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const randomSuffix = Math.random().toString(36).substr(2, 4);
  return `${baseUsername}_${randomSuffix}`;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (password.length < 8) {
    return {
      valid: false,
      message: "Password must be at least 8 characters long",
    };
  }

  if (!/(?=.*[a-z])/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }

  if (!/(?=.*\d)/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one number",
    };
  }

  return { valid: true };
}

export default {
  generateTokens,
  verifyToken,
  hashPassword,
  verifyPassword,
  generateOTP,
  storeOTP,
  verifyOTP,
  checkRateLimit,
  sendOTPEmail,
  verifyGoogleToken,
  verifyFacebookToken,
  handleSocialLogin,
  ensureDBConnection,
  sendWelcomeEmail,
  generateUsername,
  isValidEmail,
  validatePassword,
};
