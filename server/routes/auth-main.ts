import express from "express";
import {
  registerWithEmail,
  registerWithPhone,
  loginWithEmail,
  loginWithUsername,
  sendEmailVerification,
  verifyEmailCode,
  sendPhoneOTP,
  verifyPhoneOTP,
  checkAvailability,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  getUserProfile,
} from "./auth-complete";

import {
  authenticateJWT,
  optionalAuth,
  authenticateAdmin,
  rateLimit,
  validateRegistrationInput,
  validateLoginInput,
  securityHeaders,
} from "../middleware/auth";

const router = express.Router();

// Apply security headers to all auth routes
router.use(securityHeaders);

// ==========================================
// PUBLIC AUTHENTICATION ROUTES
// ==========================================

// Rate limiting for auth endpoints
const authRateLimit = rateLimit(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
const loginRateLimit = rateLimit(10, 15 * 60 * 1000); // 10 attempts per 15 minutes

// Registration routes
router.post(
  "/register/email",
  authRateLimit,
  validateRegistrationInput,
  registerWithEmail,
);

router.post(
  "/register/phone",
  authRateLimit,
  validateRegistrationInput,
  registerWithPhone,
);

// Login routes
router.post("/login/email", loginRateLimit, validateLoginInput, loginWithEmail);

router.post(
  "/login/username",
  loginRateLimit,
  validateLoginInput,
  loginWithUsername,
);

// Verification routes
router.post(
  "/verification/email/send",
  rateLimit(3, 5 * 60 * 1000), // 3 attempts per 5 minutes
  sendEmailVerification,
);

router.post(
  "/verification/email/verify",
  rateLimit(5, 10 * 60 * 1000), // 5 attempts per 10 minutes
  verifyEmailCode,
);

router.post(
  "/verification/phone/send",
  rateLimit(3, 5 * 60 * 1000), // 3 attempts per 5 minutes
  sendPhoneOTP,
);

router.post(
  "/verification/phone/verify",
  rateLimit(3, 10 * 60 * 1000), // 3 attempts per 10 minutes
  verifyPhoneOTP,
);

// Availability check
router.get(
  "/check-availability",
  rateLimit(20, 5 * 60 * 1000), // 20 checks per 5 minutes
  checkAvailability,
);

// Token management
router.post(
  "/token/refresh",
  rateLimit(10, 5 * 60 * 1000), // 10 refresh attempts per 5 minutes
  refreshAccessToken,
);

router.post("/logout", logout);

// Password reset
router.post(
  "/password/forgot",
  rateLimit(3, 15 * 60 * 1000), // 3 attempts per 15 minutes
  forgotPassword,
);

router.post(
  "/password/reset",
  rateLimit(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  resetPassword,
);

// ==========================================
// PROTECTED ROUTES (require authentication)
// ==========================================

// Profile management
router.get("/profile", authenticateJWT, getUserProfile);

// Password change (for authenticated users)
router.post(
  "/password/change",
  authenticateJWT,
  rateLimit(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  changePassword,
);

// ==========================================
// ADMIN ROUTES (require admin authentication)
// ==========================================

// Get all users (admin only)
router.get("/admin/users", authenticateAdmin, async (req, res) => {
  try {
    const User = (await import("../models/User")).default;
    const { isMongoConnected } = await import("../lib/mongodb");

    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .select("-password") // Exclude password field
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin get users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Ban/unban user (admin only)
router.post("/admin/users/:userId/ban", authenticateAdmin, async (req, res) => {
  try {
    const User = (await import("../models/User")).default;
    const { isMongoConnected } = await import("../lib/mongodb");

    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    const { userId } = req.params;
    const { banned, reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.is_banned = banned;
    user.ban_reason = banned ? reason : undefined;
    await user.save();

    res.json({
      success: true,
      message: `User ${banned ? "banned" : "unbanned"} successfully`,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Admin ban user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get auth statistics (admin only)
router.get("/admin/stats", authenticateAdmin, async (req, res) => {
  try {
    const User = (await import("../models/User")).default;
    const { isMongoConnected } = await import("../lib/mongodb");

    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      verifiedUsers,
      usersToday,
      usersThisWeek,
      usersThisMonth,
      activeUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ is_verified: true }),
      User.countDocuments({ created_at: { $gte: startOfDay } }),
      User.countDocuments({ created_at: { $gte: startOfWeek } }),
      User.countDocuments({ created_at: { $gte: startOfMonth } }),
      User.countDocuments({
        last_login: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      }),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        verifiedUsers,
        unverifiedUsers: totalUsers - verifiedUsers,
        usersToday,
        usersThisWeek,
        usersThisMonth,
        activeUsers,
        verificationRate:
          totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(2) : 0,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// ==========================================
// HEALTH CHECK ROUTES
// ==========================================

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Auth service is healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

router.get("/health/detailed", optionalAuth, async (req, res) => {
  try {
    const { isMongoConnected } = await import("../lib/mongodb");

    const health = {
      service: "healthy",
      database: isMongoConnected() ? "connected" : "disconnected",
      authentication: req.userId ? "authenticated" : "anonymous",
      timestamp: new Date().toISOString(),
    };

    const statusCode = health.database === "connected" ? 200 : 503;

    res.status(statusCode).json({
      success: statusCode === 200,
      health,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      health: {
        service: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
