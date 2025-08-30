import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import { sendVerificationEmail, sendWelcomeEmail } from "../lib/email";
import { generateToken, generateRefreshToken, verifyRefreshToken, authenticateJWT } from "../lib/jwt";
import { connectDB, isMongoConnected } from "../lib/mongodb";
import User from "../models/User";

// In-memory storage for email verification codes (same as existing)
const emailVerificationCodes: Map<
  string,
  {
    code: string;
    email: string;
    expiry: Date;
    attempts: number;
  }
> = new Map();

// Initialize MongoDB connection
const initDB = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error('MongoDB initialization failed:', error);
  }
};

// Call initialization
initDB();

// User registration endpoint with MongoDB
export const registerUserMongoDB: RequestHandler = async (req, res) => {
  try {
    const { email, username, name, password, provider = "email" } = req.body;

    // Validation
    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Email, username, and password are required",
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    // Check if MongoDB is connected
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    // Check if user already exists
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      return res.status(400).json({
        success: false,
        message: "Username already taken",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = new User({
      email,
      username,
      name,
      password: hashedPassword,
      is_verified: provider === "google",
      email_verified: provider === "google",
      provider
    });

    await newUser.save();

    // Generate JWT tokens
    const accessToken = generateToken(newUser._id.toString());
    const refreshToken = generateRefreshToken(newUser._id.toString());

    // Return success response (password is automatically excluded by toJSON)
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: newUser.toJSON(),
      accessToken,
      refreshToken,
    });

    console.log("✅ New user registered:", {
      id: newUser._id,
      email,
      username,
      name,
      provider,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Login endpoint with MongoDB and JWT
export const loginUserMongoDB: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Check if MongoDB is connected
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if user is verified
    if (!user.is_verified) {
      return res.status(400).json({
        success: false,
        message: "Please verify your email before logging in",
      });
    }

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Generate JWT tokens
    const accessToken = generateToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Return success response (password is automatically excluded by toJSON)
    res.json({
      success: true,
      message: "Login successful",
      user: user.toJSON(),
      accessToken,
      refreshToken,
    });

    console.log(`✅ User logged in successfully: ${email}`);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Check availability with MongoDB
export const checkAvailabilityMongoDB: RequestHandler = async (req, res) => {
  try {
    const { email, username } = req.query;

    if (!email && !username) {
      return res.status(400).json({
        success: false,
        message: "Email or username parameter is required",
      });
    }

    // Check if MongoDB is connected
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    const result: { emailAvailable?: boolean; usernameAvailable?: boolean } = {};

    if (email) {
      const existingUser = await User.findOne({ email: email.toString() });
      result.emailAvailable = !existingUser;
    }

    if (username) {
      // Username validation
      const usernameStr = username.toString();
      
      if (usernameStr.length < 3) {
        return res.status(400).json({
          success: false,
          message: "Username must be at least 3 characters long",
        });
      }

      if (usernameStr.length > 20) {
        return res.status(400).json({
          success: false,
          message: "Username must be 20 characters or less",
        });
      }

      if (!/^[a-zA-Z0-9_]+$/.test(usernameStr)) {
        return res.status(400).json({
          success: false,
          message: "Username can only contain letters, numbers, and underscores",
        });
      }

      // Check if reserved username
      const reservedUsernames = [
        "admin", "root", "api", "www", "mail", "ftp", "localhost", 
        "test", "demo", "support", "help"
      ];
      
      if (reservedUsernames.includes(usernameStr.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: "This username is reserved",
        });
      }

      const existingUser = await User.findOne({ username: usernameStr });
      result.usernameAvailable = !existingUser;
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

// Get user profile (protected route)
export const getUserProfile: RequestHandler = async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    const userId = (req as any).userId;
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

// Update user profile (protected route)
export const updateUserProfile: RequestHandler = async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    const userId = (req as any).userId;
    const { name, display_name, bio, profile_image_url } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update fields
    if (name) user.name = name;
    if (display_name) user.display_name = display_name;
    if (bio !== undefined) user.bio = bio;
    if (profile_image_url !== undefined) user.profile_image_url = profile_image_url;

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Refresh token endpoint
export const refreshToken: RequestHandler = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required",
      });
    }

    const decoded = verifyRefreshToken(token);
    if (!decoded) {
      return res.status(403).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Check if MongoDB is connected
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    // Verify user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate new tokens
    const accessToken = generateToken(user._id.toString());
    const newRefreshToken = generateRefreshToken(user._id.toString());

    res.json({
      success: true,
      accessToken,
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

// Complete registration with MongoDB
export const completeRegistrationMongoDB: RequestHandler = async (req, res) => {
  try {
    const { email, username, name, password } = req.body;

    // Validation (same as existing)
    if (!email || !username || !name || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check if MongoDB is connected
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    // Check if user already exists
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      return res.status(400).json({
        success: false,
        message: "Username already taken",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = new User({
      email,
      username,
      name,
      password: hashedPassword,
      is_verified: true, // Email was verified in previous step
      email_verified: true,
    });

    await newUser.save();

    // Generate JWT tokens
    const accessToken = generateToken(newUser._id.toString());
    const refreshToken = generateRefreshToken(newUser._id.toString());

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: newUser.toJSON(),
      accessToken,
      refreshToken,
    });

    console.log(`✅ New user registered successfully:`, {
      id: newUser._id,
      email,
      username,
      name,
    });
  } catch (error) {
    console.error("Complete registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Email verification endpoints (keep existing functionality)
export const sendEmailVerification: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store verification code
    emailVerificationCodes.set(email, {
      code: verificationCode,
      email,
      expiry,
      attempts: 0,
    });

    // Send email
    const emailResult = await sendVerificationEmail(email, verificationCode);

    res.json({
      success: true,
      message: emailResult.success
        ? "Verification code sent to your email successfully"
        : "Email service temporarily unavailable, please try again",
      expiresAt: expiry.toISOString(),
      emailSent: emailResult.success,
    });
  } catch (error) {
    console.error("Send email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

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

    // Check if code is expired
    if (new Date() > storedVerification.expiry) {
      emailVerificationCodes.delete(email);
      return res.status(400).json({
        success: false,
        message: "Verification code has expired",
      });
    }

    // Check if too many attempts
    if (storedVerification.attempts >= 5) {
      emailVerificationCodes.delete(email);
      return res.status(400).json({
        success: false,
        message: "Too many verification attempts. Please request a new code.",
      });
    }

    // Verify code
    if (storedVerification.code !== code) {
      storedVerification.attempts += 1;
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
        attemptsRemaining: 5 - storedVerification.attempts,
      });
    }

    // Code is valid - remove from storage
    emailVerificationCodes.delete(email);

    res.json({
      success: true,
      message: "Email verified successfully",
    });

    console.log(`✅ Email verified successfully: ${email}`);
  } catch (error) {
    console.error("Verify email code error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
