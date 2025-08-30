import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import axios from "axios";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User";
import { isMongoConnected } from "../lib/mongodb";
import { rateLimit } from "../middleware/auth";

const JWT_SECRET =
  process.env.JWT_SECRET || "your_jwt_secret_key_change_in_production";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

// Initialize Google OAuth2 client
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Generate JWT token
const generateToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "7d",
    issuer: "music-catch-api",
    audience: "music-catch-app",
  });
};

// Verify Google ID token and get user data
const verifyGoogleToken = async (idToken: string) => {
  try {
    if (!GOOGLE_CLIENT_ID) {
      throw new Error(
        "Google OAuth not configured on server. Please set GOOGLE_CLIENT_ID environment variable.",
      );
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error("Invalid Google token payload");
    }

    if (!payload.email) {
      throw new Error("Google account must have a verified email address");
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      email_verified: payload.email_verified,
      given_name: payload.given_name,
      family_name: payload.family_name,
    };
  } catch (error) {
    console.error("❌ Google token verification failed:", error);
    throw new Error("Invalid Google token");
  }
};

// Verify Facebook access token and get user data
const verifyFacebookToken = async (accessToken: string) => {
  try {
    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      throw new Error(
        "Facebook OAuth not configured on server. Please set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET environment variables.",
      );
    }

    // Verify token with Facebook's debug endpoint
    const debugResponse = await axios.get(
      `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`,
    );

    if (!debugResponse.data.data.is_valid) {
      throw new Error("Invalid Facebook token");
    }

    // Get user data from Facebook Graph API
    const userResponse = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large),first_name,last_name&access_token=${accessToken}`,
    );

    if (!userResponse.data.email) {
      throw new Error("Facebook account must have an email address");
    }

    return {
      id: userResponse.data.id,
      email: userResponse.data.email,
      name: userResponse.data.name,
      picture: userResponse.data.picture?.data?.url,
      first_name: userResponse.data.first_name,
      last_name: userResponse.data.last_name,
    };
  } catch (error) {
    console.error("❌ Facebook token verification failed:", error);
    throw new Error("Invalid Facebook token");
  }
};

// Google OAuth authentication
export const googleAuth: RequestHandler = async (req, res) => {
  console.log("🔥 Real Google OAuth authentication started");

  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    const { token: idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Google ID token is required",
      });
    }

    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        message: "Google OAuth not configured on server",
      });
    }

    // Verify Google token and get real user data
    console.log("🔍 Verifying Google ID token...");
    const googleUser = await verifyGoogleToken(idToken);

    console.log("✅ Google user verified:", {
      email: googleUser.email,
      name: googleUser.name,
      verified: googleUser.email_verified,
    });

    if (!googleUser.email) {
      return res.status(400).json({
        success: false,
        message: "Google account must have a verified email address",
      });
    }

    // Check if user exists
    let user = await User.findOne({
      $or: [{ email: googleUser.email }, { google_id: googleUser.id }],
    });

    if (!user) {
      // Create new user
      const username = `google_${googleUser.email.split("@")[0]}_${Date.now()}`;

      const userData = {
        email: googleUser.email,
        username,
        name: googleUser.name || googleUser.email.split("@")[0],
        display_name: googleUser.name || googleUser.email.split("@")[0],
        profile_image_url: googleUser.picture || "",
        provider: "google",
        google_id: googleUser.id,
        is_verified: googleUser.email_verified || true,
        email_verified: googleUser.email_verified || true,
        first_name: googleUser.given_name || "",
        last_name: googleUser.family_name || "",
      };

      console.log("👤 Creating new Google user...");
      user = new User(userData);
      await user.save();
      console.log("✅ New Google user created:", user._id);
    } else {
      // Update existing user
      user.last_login = new Date();
      if (!user.google_id) {
        user.google_id = googleUser.id;
      }
      if (!user.profile_image_url && googleUser.picture) {
        user.profile_image_url = googleUser.picture;
      }
      await user.save();
      console.log("✅ Existing Google user logged in:", user._id);
    }

    // Generate JWT token
    const jwtToken = generateToken(user._id.toString());

    // Return user data
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
      premium: false,
      followers_count: user.follower_count || 0,
      following_count: user.following_count || 0,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    res.json({
      success: true,
      message: "Google authentication successful",
      token: jwtToken,
      data: userData,
    });
  } catch (error: any) {
    console.error("❌ Google auth error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Google authentication failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Facebook OAuth authentication
export const facebookAuth: RequestHandler = async (req, res) => {
  console.log("🔥 Real Facebook OAuth authentication started");

  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    const { token: accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: "Facebook access token is required",
      });
    }

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Facebook OAuth not configured on server",
      });
    }

    // Verify Facebook token and get real user data
    console.log("🔍 Verifying Facebook access token...");
    const facebookUser = await verifyFacebookToken(accessToken);

    console.log("✅ Facebook user verified:", {
      email: facebookUser.email,
      name: facebookUser.name,
    });

    if (!facebookUser.email) {
      return res.status(400).json({
        success: false,
        message: "Facebook account must have an email address",
      });
    }

    // Check if user exists
    let user = await User.findOne({
      $or: [{ email: facebookUser.email }, { facebook_id: facebookUser.id }],
    });

    if (!user) {
      // Create new user
      const username = `facebook_${facebookUser.email.split("@")[0]}_${Date.now()}`;

      const userData = {
        email: facebookUser.email,
        username,
        name: facebookUser.name || facebookUser.email.split("@")[0],
        display_name: facebookUser.name || facebookUser.email.split("@")[0],
        profile_image_url: facebookUser.picture || "",
        provider: "facebook",
        facebook_id: facebookUser.id,
        is_verified: true,
        email_verified: true,
        first_name: facebookUser.first_name || "",
        last_name: facebookUser.last_name || "",
      };

      console.log("👤 Creating new Facebook user...");
      user = new User(userData);
      await user.save();
      console.log("✅ New Facebook user created:", user._id);
    } else {
      // Update existing user
      user.last_login = new Date();
      if (!user.facebook_id) {
        user.facebook_id = facebookUser.id;
      }
      if (!user.profile_image_url && facebookUser.picture) {
        user.profile_image_url = facebookUser.picture;
      }
      await user.save();
      console.log("✅ Existing Facebook user logged in:", user._id);
    }

    // Generate JWT token
    const jwtToken = generateToken(user._id.toString());

    // Return user data
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
      premium: false,
      followers_count: user.follower_count || 0,
      following_count: user.following_count || 0,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    res.json({
      success: true,
      message: "Facebook authentication successful",
      token: jwtToken,
      data: userData,
    });
  } catch (error: any) {
    console.error("❌ Facebook auth error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Facebook authentication failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Apply rate limiting and export
export const googleAuthWithRateLimit = [
  rateLimit(10, 15 * 60 * 1000),
  googleAuth,
];
export const facebookAuthWithRateLimit = [
  rateLimit(10, 15 * 60 * 1000),
  facebookAuth,
];
