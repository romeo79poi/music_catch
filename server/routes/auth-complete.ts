import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendVerificationEmail, sendWelcomeEmail } from "../lib/email";
import { connectDB, isMongoConnected } from "../lib/mongodb";
import User from "../models/User";

// JWT Configuration
const JWT_SECRET =
  process.env.JWT_SECRET || "your_jwt_secret_key_change_in_production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || "30d";

// In-memory storage for verification codes and tokens
const emailVerificationCodes = new Map<
  string,
  {
    code: string;
    email: string;
    expiry: Date;
    attempts: number;
  }
>();

const phoneVerificationCodes = new Map<
  string,
  {
    code: string;
    phone: string;
    expiry: Date;
    attempts: number;
  }
>();

const refreshTokens = new Set<string>();
const resetPasswordTokens = new Map<
  string,
  {
    email: string;
    token: string;
    expiry: Date;
  }
>();

// Helper Functions
const generateToken = (
  userId: string,
  type: "access" | "refresh" = "access",
): string => {
  const expiresIn = type === "access" ? JWT_EXPIRES_IN : REFRESH_EXPIRES_IN;
  return jwt.sign(
    {
      userId,
      type,
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
    {
      expiresIn,
      issuer: "music-catch-api",
      audience: "music-catch-app",
    },
  );
};

const verifyToken = (
  token: string,
): { userId: string; type: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "music-catch-api",
      audience: "music-catch-app",
    }) as any;
    return { userId: decoded.userId, type: decoded.type || "access" };
  } catch (error) {
    return null;
  }
};

const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

const validatePassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
};

const validateUsername = (
  username: string,
): { isValid: boolean; error?: string } => {
  if (!username) {
    return { isValid: false, error: "Username is required" };
  }

  if (username.length < 3) {
    return {
      isValid: false,
      error: "Username must be at least 3 characters long",
    };
  }

  if (username.length > 20) {
    return { isValid: false, error: "Username must be 20 characters or less" };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return {
      isValid: false,
      error: "Username can only contain letters, numbers, and underscores",
    };
  }

  const reservedUsernames = [
    "admin",
    "root",
    "api",
    "www",
    "mail",
    "ftp",
    "localhost",
    "test",
    "demo",
    "support",
    "help",
    "null",
    "undefined",
  ];

  if (reservedUsernames.includes(username.toLowerCase())) {
    return { isValid: false, error: "This username is reserved" };
  }

  return { isValid: true };
};

// Initialize MongoDB
connectDB();

// 1. REGISTER USER WITH EMAIL
export const registerWithEmail: RequestHandler = async (req, res) => {
  try {
    const {
      email,
      username,
      name,
      password,
      dateOfBirth,
      gender,
      bio,
      profileImageURL,
    } = req.body;

    // Validation
    if (!email || !username || !name || !password) {
      return res.status(400).json({
        success: false,
        message: "Email, username, name, and password are required",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: usernameValidation.error,
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      const field = existingUser.email === email ? "Email" : "Username";
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = new User({
      email,
      username,
      name,
      password: hashedPassword,
      display_name: name,
      bio: bio || "",
      dob: dateOfBirth ? new Date(dateOfBirth) : undefined,
      profile_image_url: profileImageURL || "",
      is_verified: false,
      email_verified: false,
    });

    await newUser.save();

    // Generate tokens
    const accessToken = generateToken(newUser._id.toString(), "access");
    const refreshToken = generateToken(newUser._id.toString(), "refresh");
    refreshTokens.add(refreshToken);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: newUser.toJSON(),
      accessToken,
      refreshToken,
    });

    console.log("✅ New user registered:", newUser.email);
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 2. REGISTER USER WITH PHONE
export const registerWithPhone: RequestHandler = async (req, res) => {
  try {
    const { phone, username, name, password, dateOfBirth, gender, bio } =
      req.body;

    if (!phone || !username || !name || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone, username, name, and password are required",
      });
    }

    if (!validatePhone(phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format",
      });
    }

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: usernameValidation.error,
      });
    }

    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = new User({
      email: `${phone.replace(/\D/g, "")}@phone.musiccatch.com`, // Temporary email
      username,
      name,
      password: hashedPassword,
      display_name: name,
      bio: bio || "",
      dob: dateOfBirth ? new Date(dateOfBirth) : undefined,
      is_verified: true, // Phone users are auto-verified after OTP
      email_verified: false,
      provider: "phone",
    });

    await newUser.save();

    const accessToken = generateToken(newUser._id.toString(), "access");
    const refreshToken = generateToken(newUser._id.toString(), "refresh");
    refreshTokens.add(refreshToken);

    res.status(201).json({
      success: true,
      message: "User registered successfully with phone",
      user: newUser.toJSON(),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Phone registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 3. LOGIN WITH EMAIL
export const loginWithEmail: RequestHandler = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await validatePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Generate tokens (longer expiry if rememberMe is true)
    const accessExpiry = rememberMe ? "30d" : JWT_EXPIRES_IN;
    const accessToken = jwt.sign(
      { userId: user._id.toString(), type: "access" },
      JWT_SECRET,
      { expiresIn: accessExpiry },
    );

    const refreshToken = generateToken(user._id.toString(), "refresh");
    refreshTokens.add(refreshToken);

    res.json({
      success: true,
      message: "Login successful",
      user: user.toJSON(),
      accessToken,
      refreshToken,
      rememberMe: !!rememberMe,
    });

    console.log(`✅ User logged in: ${email}`);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 4. LOGIN WITH USERNAME
export const loginWithUsername: RequestHandler = async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const isPasswordValid = await validatePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    user.last_login = new Date();
    await user.save();

    const accessExpiry = rememberMe ? "30d" : JWT_EXPIRES_IN;
    const accessToken = jwt.sign(
      { userId: user._id.toString(), type: "access" },
      JWT_SECRET,
      { expiresIn: accessExpiry },
    );

    const refreshToken = generateToken(user._id.toString(), "refresh");
    refreshTokens.add(refreshToken);

    res.json({
      success: true,
      message: "Login successful",
      user: user.toJSON(),
      accessToken,
      refreshToken,
      rememberMe: !!rememberMe,
    });
  } catch (error) {
    console.error("Username login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 5. SEND EMAIL VERIFICATION
export const sendEmailVerification: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Valid email is required",
      });
    }

    const code = generateVerificationCode();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    emailVerificationCodes.set(email, {
      code,
      email,
      expiry,
      attempts: 0,
    });

    const emailResult = await sendVerificationEmail(email, code);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again later.",
      });
    }

    res.json({
      success: true,
      message: "Verification code sent to your email",
      emailSent: true,
      expiresAt: expiry.toISOString(),
    });
  } catch (error) {
    console.error("Send email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 6. VERIFY EMAIL CODE
export const verifyEmailCode: RequestHandler = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required",
      });
    }

    const storedVerification = emailVerificationCodes.get(email);
    if (!storedVerification) {
      return res.status(400).json({
        success: false,
        message: "No verification code found for this email",
      });
    }

    if (new Date() > storedVerification.expiry) {
      emailVerificationCodes.delete(email);
      return res.status(400).json({
        success: false,
        message: "Verification code has expired",
      });
    }

    if (storedVerification.attempts >= 5) {
      emailVerificationCodes.delete(email);
      return res.status(400).json({
        success: false,
        message: "Too many verification attempts",
      });
    }

    if (storedVerification.code !== code) {
      storedVerification.attempts += 1;
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
        attemptsRemaining: 5 - storedVerification.attempts,
      });
    }

    emailVerificationCodes.delete(email);

    // Mark user as email verified if they exist
    if (isMongoConnected()) {
      await User.findOneAndUpdate(
        { email },
        { email_verified: true, is_verified: true },
      );
    }

    res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 7. SEND PHONE OTP
export const sendPhoneOTP: RequestHandler = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !validatePhone(phone)) {
      return res.status(400).json({
        success: false,
        message: "Valid phone number is required",
      });
    }

    const code = generateVerificationCode();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    phoneVerificationCodes.set(phone, {
      code,
      phone,
      expiry,
      attempts: 0,
    });

    // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log(`📱 SMS OTP for ${phone}: ${code}`);

    res.json({
      success: true,
      message: "OTP sent to your phone number",
      expiresAt: expiry.toISOString(),
    });
  } catch (error) {
    console.error("Send phone OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 8. VERIFY PHONE OTP
export const verifyPhoneOTP: RequestHandler = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and OTP are required",
      });
    }

    const storedOTP = phoneVerificationCodes.get(phone);
    if (!storedOTP) {
      return res.status(400).json({
        success: false,
        message: "No OTP found for this phone number",
      });
    }

    if (new Date() > storedOTP.expiry) {
      phoneVerificationCodes.delete(phone);
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    if (storedOTP.attempts >= 3) {
      phoneVerificationCodes.delete(phone);
      return res.status(400).json({
        success: false,
        message: "Too many OTP attempts",
      });
    }

    if (storedOTP.code !== otp) {
      storedOTP.attempts += 1;
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
        attemptsRemaining: 3 - storedOTP.attempts,
      });
    }

    phoneVerificationCodes.delete(phone);

    res.json({
      success: true,
      message: "Phone number verified successfully",
    });
  } catch (error) {
    console.error("Verify phone OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 9. CHECK AVAILABILITY
export const checkAvailability: RequestHandler = async (req, res) => {
  try {
    const { email, username, phone } = req.query;

    if (!email && !username && !phone) {
      return res.status(400).json({
        success: false,
        message: "Email, username, or phone parameter is required",
      });
    }

    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    const result: any = {};

    if (email) {
      if (!validateEmail(email.toString())) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
      }
      const existingUser = await User.findOne({ email: email.toString() });
      result.emailAvailable = !existingUser;
    }

    if (username) {
      const usernameValidation = validateUsername(username.toString());
      if (!usernameValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: usernameValidation.error,
        });
      }
      const existingUser = await User.findOne({
        username: username.toString(),
      });
      result.usernameAvailable = !existingUser;
    }

    if (phone) {
      if (!validatePhone(phone.toString())) {
        return res.status(400).json({
          success: false,
          message: "Invalid phone number format",
        });
      }
      // Check if phone is already used (you might store phone separately)
      result.phoneAvailable = true; // Implement phone checking logic
    }

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Availability check error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 10. REFRESH TOKEN
export const refreshAccessToken: RequestHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required",
      });
    }

    if (!refreshTokens.has(refreshToken)) {
      return res.status(403).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const decoded = verifyToken(refreshToken);
    if (!decoded || decoded.type !== "refresh") {
      refreshTokens.delete(refreshToken);
      return res.status(403).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      refreshTokens.delete(refreshToken);
      return res.status(403).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate new tokens
    const newAccessToken = generateToken(user._id.toString(), "access");
    const newRefreshToken = generateToken(user._id.toString(), "refresh");

    // Remove old refresh token and add new one
    refreshTokens.delete(refreshToken);
    refreshTokens.add(newRefreshToken);

    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 11. LOGOUT
export const logout: RequestHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      refreshTokens.delete(refreshToken);
    }

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 12. FORGOT PASSWORD
export const forgotPassword: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Valid email is required",
      });
    }

    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal whether email exists or not
      return res.json({
        success: true,
        message:
          "If your email is registered, you will receive a password reset link",
      });
    }

    const resetToken = jwt.sign(
      { userId: user._id.toString(), type: "reset" },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    resetPasswordTokens.set(resetToken, {
      email,
      token: resetToken,
      expiry,
    });

    // In production, send email with reset link
    console.log(`🔒 Password reset token for ${email}: ${resetToken}`);

    res.json({
      success: true,
      message:
        "If your email is registered, you will receive a password reset link",
      resetToken:
        process.env.NODE_ENV === "development" ? resetToken : undefined,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 13. RESET PASSWORD
export const resetPassword: RequestHandler = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Reset token and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const resetData = resetPasswordTokens.get(token);
    if (!resetData || new Date() > resetData.expiry) {
      resetPasswordTokens.delete(token);
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== "reset") {
      resetPasswordTokens.delete(token);
      return res.status(400).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      resetPasswordTokens.delete(token);
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    resetPasswordTokens.delete(token);

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 14. CHANGE PASSWORD (for authenticated users)
export const changePassword: RequestHandler = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).userId; // From JWT middleware

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long",
      });
    }

    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isCurrentPasswordValid = await validatePassword(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 15. GET USER PROFILE (authenticated)
export const getUserProfile: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;

    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
