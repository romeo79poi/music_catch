import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { connectDB, isMongoConnected } from "../lib/mongodb";
import User from "../models/User";

// JWT Configuration
const JWT_SECRET =
  process.env.JWT_SECRET || "your_jwt_secret_key_change_in_production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || "30d";

// In-memory storage for refresh tokens
const refreshTokens = new Set<string>();

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

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Initialize MongoDB
connectDB();

// GOOGLE SIGNIN
export const googleSignin: RequestHandler = async (req, res) => {
  try {
    // Simulate Google OAuth popup flow
    const googleUser = {
      id: `google_${Date.now()}`,
      email: "user@gmail.com",
      name: "Google User",
      picture: "https://via.placeholder.com/96x96/4285F4/ffffff?text=GU"
    };

    // Try to connect to database, but continue without it if unavailable
    let dbAvailable = false;
    try {
      await connectDB();
      dbAvailable = isMongoConnected();
    } catch (error) {
      console.warn("⚠️ MongoDB unavailable, using in-memory storage for Google auth");
      dbAvailable = false;
    }

    let user: any;
    let isNewUser = false;

    if (dbAvailable) {
      // Use MongoDB
      user = await User.findOne({ email: googleUser.email });

      if (!user) {
        // Create new user in MongoDB
        isNewUser = true;
        user = new User({
          email: googleUser.email,
          username: `google_user_${Date.now()}`,
          name: googleUser.name,
          profile_image_url: googleUser.picture,
          google_id: googleUser.id,
          provider: "google",
          is_verified: true,
          email_verified: true,
          last_login: new Date(),
        });
        await user.save();
        console.log("✅ New Google user created in MongoDB:", user.email);
      } else {
        // Update existing user in MongoDB
        user.last_login = new Date();
        if (!user.google_id) {
          user.google_id = googleUser.id;
          user.provider = "google";
        }
        await user.save();
        console.log("✅ Existing Google user logged in from MongoDB:", user.email);
      }
    } else {
      // Use in-memory storage
      isNewUser = true;
      user = {
        _id: { toString: () => `google_${Date.now()}` },
        email: googleUser.email,
        username: `google_user_${Date.now()}`,
        name: googleUser.name,
        profile_image_url: googleUser.picture,
        google_id: googleUser.id,
        provider: "google",
        is_verified: true,
        email_verified: true,
        last_login: new Date(),
      };
      console.log("✅ Google user created in memory:", user.email);
    }

    // Generate tokens
    const accessToken = generateToken(user._id.toString(), "access");
    const refreshToken = generateToken(user._id.toString(), "refresh");

    // Store refresh token
    refreshTokens.add(refreshToken);

    // Return success response
    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        name: user.name,
        profile_image_url: user.profile_image_url,
        is_verified: user.is_verified,
      },
      accessToken,
      refreshToken,
      isNewUser,
      message: isNewUser ? "Account created successfully" : "Login successful",
    });

  } catch (error) {
    console.error("Google signin error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// FACEBOOK SIGNIN
export const facebookSignin: RequestHandler = async (req, res) => {
  try {
    // Simulate Facebook OAuth popup flow
    const facebookUser = {
      id: `fb_${Date.now()}`,
      email: "user@facebook.com",
      name: "Facebook User",
      picture: {
        data: {
          url: "https://via.placeholder.com/96x96/1877F2/ffffff?text=FB"
        }
      }
    };

    // Try to connect to database, but continue without it if unavailable
    let dbAvailable = false;
    try {
      await connectDB();
      dbAvailable = isMongoConnected();
    } catch (error) {
      console.warn("⚠️ MongoDB unavailable, using in-memory storage for Facebook auth");
      dbAvailable = false;
    }

    let user: any;
    let isNewUser = false;

    if (dbAvailable) {
      // Use MongoDB
      user = await User.findOne({ email: facebookUser.email });

      if (!user) {
        // Create new user in MongoDB
        isNewUser = true;
        user = new User({
          email: facebookUser.email,
          username: `fb_user_${Date.now()}`,
          name: facebookUser.name,
          profile_image_url: facebookUser.picture.data.url,
          facebook_id: facebookUser.id,
          provider: "facebook",
          is_verified: true,
          email_verified: true,
          last_login: new Date(),
        });
        await user.save();
        console.log("✅ New Facebook user created in MongoDB:", user.email);
      } else {
        // Update existing user in MongoDB
        user.last_login = new Date();
        if (!user.facebook_id) {
          user.facebook_id = facebookUser.id;
          user.provider = "facebook";
        }
        await user.save();
        console.log("✅ Existing Facebook user logged in from MongoDB:", user.email);
      }
    } else {
      // Use in-memory storage
      isNewUser = true;
      user = {
        _id: { toString: () => `facebook_${Date.now()}` },
        email: facebookUser.email,
        username: `fb_user_${Date.now()}`,
        name: facebookUser.name,
        profile_image_url: facebookUser.picture.data.url,
        facebook_id: facebookUser.id,
        provider: "facebook",
        is_verified: true,
        email_verified: true,
        last_login: new Date(),
      };
      console.log("✅ Facebook user created in memory:", user.email);
    }

    // Generate tokens
    const accessToken = generateToken(user._id.toString(), "access");
    const refreshToken = generateToken(user._id.toString(), "refresh");

    // Store refresh token
    refreshTokens.add(refreshToken);

    // Return success response
    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        name: user.name,
        profile_image_url: user.profile_image_url,
        is_verified: user.is_verified,
      },
      accessToken,
      refreshToken,
      isNewUser,
      message: isNewUser ? "Account created successfully" : "Login successful",
    });

  } catch (error) {
    console.error("Facebook signin error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GOOGLE AUTHENTICATION
export const googleAuth: RequestHandler = async (req, res) => {
  try {
    const { email, name, picture, googleId, isNewUser } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({
        success: false,
        message: "Email and Google ID are required",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Ensure MongoDB connection before proceeding
    await connectDB();

    // Check if user already exists
    let user = await User.findOne({
      $or: [{ email: email }, { google_id: googleId }],
    });

    if (user) {
      // Update existing user with Google data if not already set
      if (!user.google_id) {
        user.google_id = googleId;
        user.provider = "google";
        if (picture && !user.profile_image_url) {
          user.profile_image_url = picture;
        }
        await user.save();
      }
    } else {
      // Create new user
      const username = email.split("@")[0] + "_google_" + Date.now();

      user = new User({
        email,
        username,
        name: name || email.split("@")[0],
        display_name: name || email.split("@")[0],
        password: await bcrypt.hash("google_auth_" + googleId, 12), // Dummy password
        google_id: googleId,
        provider: "google",
        profile_image_url: picture || "",
        is_verified: true, // Google accounts are pre-verified
        email_verified: true,
        bio: "",
      });

      await user.save();
    }

    // Generate tokens
    const accessToken = generateToken(user._id.toString(), "access");
    const refreshToken = generateToken(user._id.toString(), "refresh");
    refreshTokens.add(refreshToken);

    // Update last login
    user.last_login = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: isNewUser ? "Account created successfully" : "Login successful",
      user: user.toJSON(),
      token: accessToken, // For backward compatibility
      accessToken,
      refreshToken,
      isNewUser: !user.last_login || isNewUser,
    });

    console.log("✅ Google authentication successful:", user.email);
  } catch (error) {
    console.error("Google authentication error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// FACEBOOK AUTHENTICATION
export const facebookAuth: RequestHandler = async (req, res) => {
  try {
    const { email, name, picture, facebookId, isNewUser } = req.body;

    if (!email || !facebookId) {
      return res.status(400).json({
        success: false,
        message: "Email and Facebook ID are required",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Ensure MongoDB connection before proceeding
    await connectDB();

    // Check if user already exists
    let user = await User.findOne({
      $or: [{ email: email }, { facebook_id: facebookId }],
    });

    if (user) {
      // Update existing user with Facebook data if not already set
      if (!user.facebook_id) {
        user.facebook_id = facebookId;
        user.provider = "facebook";
        if (picture && !user.profile_image_url) {
          user.profile_image_url = picture;
        }
        await user.save();
      }
    } else {
      // Create new user
      const username = email.split("@")[0] + "_facebook_" + Date.now();

      user = new User({
        email,
        username,
        name: name || email.split("@")[0],
        display_name: name || email.split("@")[0],
        password: await bcrypt.hash("facebook_auth_" + facebookId, 12), // Dummy password
        facebook_id: facebookId,
        provider: "facebook",
        profile_image_url: picture || "",
        is_verified: true, // Facebook accounts are pre-verified
        email_verified: true,
        bio: "",
      });

      await user.save();
    }

    // Generate tokens
    const accessToken = generateToken(user._id.toString(), "access");
    const refreshToken = generateToken(user._id.toString(), "refresh");
    refreshTokens.add(refreshToken);

    // Update last login
    user.last_login = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: isNewUser ? "Account created successfully" : "Login successful",
      user: user.toJSON(),
      token: accessToken, // For backward compatibility
      accessToken,
      refreshToken,
      isNewUser: !user.last_login || isNewUser,
    });

    console.log("✅ Facebook authentication successful:", user.email);
  } catch (error) {
    console.error("Facebook authentication error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// SOCIAL LOGIN (UNIFIED ENDPOINT)
export const socialLogin: RequestHandler = async (req, res) => {
  try {
    const {
      provider,
      email,
      name,
      picture,
      socialId,
      accessToken: socialAccessToken,
    } = req.body;

    if (!provider || !email || !socialId) {
      return res.status(400).json({
        success: false,
        message: "Provider, email, and social ID are required",
      });
    }

    if (!["google", "facebook"].includes(provider)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider. Must be 'google' or 'facebook'",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Ensure MongoDB connection before proceeding
    await connectDB();

    // Check if user already exists
    const socialFieldMap = {
      google: "google_id",
      facebook: "facebook_id",
    };

    const socialField = socialFieldMap[provider as keyof typeof socialFieldMap];

    let user = await User.findOne({
      $or: [{ email: email }, { [socialField]: socialId }],
    });

    let isNewUser = !user;

    if (user) {
      // Update existing user with social data if not already set
      if (!user[socialField as keyof typeof user]) {
        (user as any)[socialField] = socialId;
        user.provider = provider;
        if (picture && !user.profile_image_url) {
          user.profile_image_url = picture;
        }
        await user.save();
      }
    } else {
      // Create new user
      const username = email.split("@")[0] + "_" + provider + "_" + Date.now();

      const userData = {
        email,
        username,
        name: name || email.split("@")[0],
        display_name: name || email.split("@")[0],
        password: await bcrypt.hash(provider + "_auth_" + socialId, 12),
        provider,
        profile_image_url: picture || "",
        is_verified: true,
        email_verified: true,
        bio: "",
        [socialField]: socialId,
      };

      user = new User(userData);
      await user.save();
    }

    // Generate tokens
    const accessToken = generateToken(user._id.toString(), "access");
    const refreshToken = generateToken(user._id.toString(), "refresh");
    refreshTokens.add(refreshToken);

    // Update last login
    user.last_login = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: isNewUser ? "Account created successfully" : "Login successful",
      user: user.toJSON(),
      token: accessToken, // For backward compatibility
      accessToken,
      refreshToken,
      isNewUser,
    });

    console.log(`✅ ${provider} authentication successful:`, user.email);
  } catch (error) {
    console.error("Social authentication error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// CHECK IF SOCIAL USER EXISTS
export const checkSocialUser: RequestHandler = async (req, res) => {
  try {
    const { email, provider, socialId } = req.query;

    if (!email || !provider || !socialId) {
      return res.status(400).json({
        success: false,
        message: "Email, provider, and social ID are required",
      });
    }

    // Ensure MongoDB connection before proceeding
    await connectDB();

    const socialFieldMap = {
      google: "google_id",
      facebook: "facebook_id",
    };

    const socialField = socialFieldMap[provider as keyof typeof socialFieldMap];

    const user = await User.findOne({
      $or: [
        { email: email.toString() },
        { [socialField]: socialId.toString() },
      ],
    });

    res.json({
      success: true,
      userExists: !!user,
      isNewUser: !user,
    });
  } catch (error) {
    console.error("Check social user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
