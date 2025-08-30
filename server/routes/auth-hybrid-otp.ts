import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "../lib/email";
import { getUserByIdentifier } from "../lib/userStore";

const JWT_SECRET =
  process.env.JWT_SECRET || "your_jwt_secret_key_change_in_production";

// Store OTP codes temporarily (in production, use Redis)
export const otpStore = new Map<
  string,
  {
    code: string;
    email: string;
    expiresAt: Date;
    userData: any;
  }
>();

// Generate 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate JWT token
const generateToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "15m",
    issuer: "music-catch-api",
    audience: "music-catch-app",
  });
};

const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId, type: "refresh" }, JWT_SECRET, {
    expiresIn: "30d",
    issuer: "music-catch-api",
    audience: "music-catch-app",
  });
};

const setAuthCookies = (
  res: any,
  accessToken: string,
  refreshToken: string,
) => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("auth_token", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

// Request OTP for signup (sends real email, uses in-memory storage)
export const requestSignupOTPHybrid: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;

    // Normalize input
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    // Validate input
    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if user already exists in in-memory store
    const existingUser = getUserByIdentifier(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP temporarily (only email for this step) using normalized key
    otpStore.set(normalizedEmail, {
      code: otp,
      email: normalizedEmail,
      expiresAt,
      userData: { email: normalizedEmail },
    });

    // Send real email with OTP
    console.log(`📧 Sending OTP email to: ${normalizedEmail}`);

    let emailResult;
    try {
      emailResult = await sendVerificationEmail(email, otp);

      if (!emailResult.success) {
        console.error("❌ Email sending failed:", emailResult.error);
        return res.status(500).json({
          success: false,
          message: "Failed to send verification email. Please try again.",
        });
      }
    } catch (emailError: any) {
      console.error("❌ Email service error:", emailError);
      return res.status(500).json({
        success: false,
        message: "Email service temporarily unavailable. Please try again.",
      });
    }

    console.log(`✅ OTP sent successfully to ${email}`);

    res.status(200).json({
      success: true,
      message: "Verification code sent to your email",
    });
  } catch (error: any) {
    console.error("Request signup OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Verify OTP only (account will be created after collecting profile details)
export const verifySignupOTPHybrid: RequestHandler = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const normalizedOTP = String(otp || "").trim();

    if (!normalizedEmail || !normalizedOTP) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // Check if OTP exists and is valid
    const storedOTP = otpStore.get(normalizedEmail);
    if (!storedOTP) {
      console.warn(`❌ No OTP found for email: ${normalizedEmail}`);
      return res.status(400).json({
        success: false,
        message:
          "No verification code found for this email. Please request a new code.",
      });
    }

    // Check if OTP has expired
    if (new Date() > storedOTP.expiresAt) {
      otpStore.delete(normalizedEmail);
      console.warn(`⌛ OTP expired for email: ${normalizedEmail}`);
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new code.",
      });
    }

    // Verify OTP
    if (storedOTP.code !== normalizedOTP) {
      console.warn(`❌ Invalid OTP for email: ${normalizedEmail}`);
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    // Mark as verified and clean up OTP (account will be created later)
    otpStore.delete(normalizedEmail);

    console.log(`✅ Email verified successfully: ${normalizedEmail}`);

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error: any) {
    console.error("Verify signup OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Clean up expired OTPs periodically
setInterval(
  () => {
    const now = new Date();
    for (const [email, data] of otpStore.entries()) {
      if (now > data.expiresAt) {
        otpStore.delete(email);
        console.log(`🧹 Cleaned up expired OTP for: ${email}`);
      }
    }
  },
  5 * 60 * 1000,
); // Run every 5 minutes
