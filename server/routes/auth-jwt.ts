import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { isMongoConnected } from "../lib/mongodb";
import {
  rateLimit,
  validateRegistrationInput,
  validateLoginInput,
} from "../middleware/auth";

const JWT_SECRET =
  process.env.JWT_SECRET || "your_jwt_secret_key_change_in_production";

// Sign token with common user claims for better client fallback
const signTokenWithClaims = (user: any) => {
  const userId = user?._id?.toString?.() || user?._id || user?.id;
  return jwt.sign(
    {
      userId,
      email: user.email,
      username: user.username,
      name: user.name,
      verified: !!user.is_verified,
      provider: user.provider || "email",
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
      issuer: "music-catch-api",
      audience: "music-catch-app",
    },
  );
};

// Generate JWT token
const generateToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "7d",
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
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

// User Registration
export const signup: RequestHandler = async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    const {
      email,
      username,
      password,
      name,
      dateOfBirth,
      gender,
      bio,
      profileImageURL,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          existingUser.email === email
            ? "Email already registered"
            : "Username already taken",
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = new User({
      email,
      username,
      password: hashedPassword,
      name,
      display_name: name,
      provider: "email",
      is_verified: true, // Auto-verify for simplicity
      email_verified: true,
      bio: bio || "",
      profile_image_url: profileImageURL || "",
      dob: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender: gender || undefined,
    });

    await newUser.save();

    // Generate tokens and set cookies
    const token = signTokenWithClaims(newUser);
    const refresh = generateRefreshToken(newUser._id.toString());
    setAuthCookies(res, token, refresh);

    // Return user data without password
    const userData = {
      id: newUser._id.toString(),
      email: newUser.email,
      username: newUser.username,
      name: newUser.name,
      avatar_url: newUser.profile_image_url,
      bio: newUser.bio,
      dob: newUser.dob,
      gender: (newUser as any).gender,
      verified: newUser.is_verified,
      premium: false,
      followers_count: newUser.follower_count,
      following_count: newUser.following_count,
      created_at: newUser.created_at,
      updated_at: newUser.updated_at,
    };

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      data: userData,
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create account",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// User Login
export const login: RequestHandler = async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    const { email, username, password } = req.body;

    // Find user by email or username
    const user = await User.findOne({
      $or: [{ email: email || username }, { username: username || email }],
    });

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user is banned
    if (user.is_banned) {
      return res.status(403).json({
        success: false,
        message: "Account has been suspended",
      });
    }

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Generate tokens and set cookies
    const token = signTokenWithClaims(user);
    const refresh = generateRefreshToken(user._id.toString());
    setAuthCookies(res, token, refresh);

    // Return user data
    const userData = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      name: user.name,
      avatar_url: user.profile_image_url,
      bio: user.bio,
      verified: user.is_verified,
      provider: user.provider || "email",
      premium: false,
      followers_count: user.follower_count,
      following_count: user.following_count,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    res.json({
      success: true,
      message: "Login successful",
      token,
      data: userData,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get Current User (requires authentication)
export const me: RequestHandler = async (req, res) => {
  try {
    // If middleware already populated user from DB, return full profile
    if (req.user) {
      const user = req.user;
      const userData = {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        name: user.name,
        avatar_url: user.profile_image_url,
        bio: user.bio,
        verified: user.is_verified,
        provider: user.provider || "email",
        premium: false,
        followers_count: user.follower_count,
        following_count: user.following_count,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };
      return res.json({ success: true, data: userData, source: "database" });
    }

    // Fallback: decode token directly without requiring DB connection
    const authHeader = req.headers.authorization;
    let token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : authHeader || undefined;

    if (!token && req.headers.cookie) {
      const cookieHeader = req.headers.cookie || "";
      const cookies: Record<string, string> = Object.fromEntries(
        cookieHeader.split(";").map((c) => {
          const idx = c.indexOf("=");
          if (idx === -1) return ["", ""];
          const k = c.slice(0, idx).trim();
          const v = decodeURIComponent(c.slice(idx + 1));
          return [k, v];
        }),
      );
      token = cookies["auth_token"];
    }

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Access token required" });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET, {
        issuer: "music-catch-api",
        audience: "music-catch-app",
      });
    } catch (err: any) {
      const code = err?.name === "TokenExpiredError" ? 401 : 403;
      return res
        .status(code)
        .json({ success: false, message: "Invalid or expired token" });
    }

    // If DB is available, try to enrich from database
    if (isMongoConnected() && decoded?.userId) {
      try {
        const user = await User.findById(decoded.userId);
        if (user) {
          const userData = {
            id: user._id.toString(),
            email: user.email,
            username: user.username,
            name: user.name,
            avatar_url: user.profile_image_url,
            bio: user.bio,
            verified: user.is_verified,
            provider: user.provider || "email",
            premium: false,
            followers_count: user.follower_count,
            following_count: user.following_count,
            created_at: user.created_at,
            updated_at: user.updated_at,
          };
          return res.json({
            success: true,
            data: userData,
            source: "database",
          });
        }
      } catch {}
    }

    // Minimal profile from token claims
    const email = decoded.email || "";
    const username = decoded.username || (email ? email.split("@")[0] : "user");
    const name = decoded.name || username || "User";

    const userData = {
      id: decoded.userId,
      email,
      username,
      name,
      avatar_url: "",
      bio: "",
      verified: !!decoded.verified,
      provider: decoded.provider || "email",
      premium: false,
      followers_count: 0,
      following_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return res.json({ success: true, data: userData, source: "token" });
  } catch (error: any) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user data",
    });
  }
};

// Check availability of username/email
export const checkAvailability: RequestHandler = async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    const { email, username } = req.query;

    if (!email && !username) {
      return res.status(400).json({
        success: false,
        message: "Email or username is required",
      });
    }

    const query: any = {};
    if (email) query.email = email;
    if (username) query.username = username;

    const existingUser = await User.findOne({
      $or: Object.keys(query).map((key) => ({ [key]: query[key] })),
    });

    if (existingUser) {
      const field = existingUser.email === email ? "email" : "username";
      return res.json({
        success: false,
        available: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} is already taken`,
        field,
      });
    }

    res.json({
      success: true,
      available: true,
      message: "Available",
    });
  } catch (error: any) {
    console.error("Check availability error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check availability",
    });
  }
};

// Refresh token
export const refreshToken: RequestHandler = async (req, res) => {
  try {
    const user = req.user; // Set by authenticateJWT middleware

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate new token
    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      token,
      message: "Token refreshed successfully",
    });
  } catch (error: any) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to refresh token",
    });
  }
};

// Update User Profile (requires authentication)
export const updateProfile: RequestHandler = async (req, res) => {
  try {
    const user = req.user;
    const isAuthed = !!user || !!req.userId;
    if (!isAuthed) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const { name, username, bio, avatar_url, location, website } = req.body;

    // Update user fields if provided
    if (name !== undefined) user.name = name;
    if (name !== undefined) user.display_name = name;
    if (username !== undefined) user.username = username;
    if (bio !== undefined) user.bio = bio;
    if (avatar_url !== undefined) user.profile_image_url = avatar_url;
    if (location !== undefined) user.location = location;
    if (website !== undefined) user.website = website;

    user.updated_at = new Date();
    await user.save();

    const userData = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      name: user.name,
      avatar_url: user.profile_image_url,
      bio: user.bio,
      location: user.location,
      website: user.website,
      verified: user.is_verified,
      provider: user.provider || "email",
      premium: false,
      followers_count: user.follower_count,
      following_count: user.following_count,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: userData,
    });
  } catch (error: any) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get User Settings (requires authentication)
export const getSettings: RequestHandler = async (req, res) => {
  try {
    const user = req.user;
    const isAuthed = !!user || !!req.userId;
    if (!isAuthed) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    // Return user settings (you can expand this based on your User model)
    const settings = {
      notifications: {
        email: true,
        push: true,
        marketing: false,
      },
      privacy: {
        publicProfile: true,
        showActivity: true,
        allowMessages: true,
      },
      preferences: {
        theme: "dark",
        language: "en",
        autoplay: true,
        highQuality: true,
      },
    };

    res.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error("Get settings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get settings",
    });
  }
};

// Update User Settings (requires authentication)
export const updateSettings: RequestHandler = async (req, res) => {
  try {
    const user = req.user; // Set by authenticateJWT middleware

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { notifications, privacy, preferences } = req.body;

    // In a real implementation, you would update settings in the database
    // For now, we'll just return success
    console.log("Settings update requested:", {
      notifications,
      privacy,
      preferences,
    });

    res.json({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (error: any) {
    console.error("Update settings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update settings",
    });
  }
};

// Logout (client-side token removal, but this endpoint can be used for logging)
export const logout: RequestHandler = async (req, res) => {
  try {
    // Note: JWT tokens can't be invalidated server-side without a blacklist
    // The client should remove the token from storage

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error: any) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

// Apply rate limiting to auth endpoints
export const signupWithRateLimit = [
  rateLimit(3, 15 * 60 * 1000),
  validateRegistrationInput,
  signup,
];
export const loginWithRateLimit = [
  rateLimit(5, 15 * 60 * 1000),
  validateLoginInput,
  login,
];
