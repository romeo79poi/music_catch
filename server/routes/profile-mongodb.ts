import { RequestHandler } from "express";
import { connectDB } from "../lib/mongodb";
import User from "../models/User";

// Initialize MongoDB connection
connectDB();

// GET /api/v2/profile - Get user profile (MongoDB version)
export const getUserProfile: RequestHandler = async (req, res) => {
  try {
    await connectDB();

    const userId = req.params.userId || req.user?.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id.toString(),
        username: user.username,
        name: user.name,
        displayName: user.display_name || user.name,
        email: user.email,
        bio: user.bio || "",
        profilePicture: user.profile_image_url || "",
        isVerified: user.is_verified,
        emailVerified: user.email_verified,
        isArtist: user.is_artist,
        followerCount: user.follower_count,
        followingCount: user.following_count,
        joinDate: user.created_at,
        lastLogin: user.last_login,
        provider: user.provider,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Error getting user profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user profile",
    });
  }
};

// PUT /api/v2/profile - Update user profile
export const updateUserProfile: RequestHandler = async (req, res) => {
  try {
    await connectDB();

    const userId = req.params.userId || req.user?.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const updates = req.body;

    // Filter allowed updates
    const allowedFields = [
      "name",
      "display_name",
      "bio",
      "profile_image_url",
      "username", // Allow username updates but handle uniqueness
    ];

    const filteredUpdates: any = {};
    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    // If username is being updated, check uniqueness
    if (filteredUpdates.username) {
      const existingUser = await User.findOne({
        username: filteredUpdates.username,
        _id: { $ne: userId },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username already taken",
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(userId, filteredUpdates, {
      new: true,
      select: "-password",
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        id: updatedUser._id.toString(),
        username: updatedUser.username,
        name: updatedUser.name,
        displayName: updatedUser.display_name || updatedUser.name,
        email: updatedUser.email,
        bio: updatedUser.bio || "",
        profilePicture: updatedUser.profile_image_url || "",
        isVerified: updatedUser.is_verified,
        emailVerified: updatedUser.email_verified,
        isArtist: updatedUser.is_artist,
        followerCount: updatedUser.follower_count,
        followingCount: updatedUser.following_count,
        joinDate: updatedUser.created_at,
        lastLogin: updatedUser.last_login,
        provider: updatedUser.provider,
        phone: updatedUser.phone,
      },
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user profile",
    });
  }
};

// GET /api/v2/profile/stats - Get user statistics
export const getUserStats: RequestHandler = async (req, res) => {
  try {
    await connectDB();

    const userId = req.params.userId || req.user?.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // In a real app, you'd calculate these from actual data
    const stats = {
      totalListeningTime: Math.floor(Math.random() * 10000), // minutes
      tracksPlayed: Math.floor(Math.random() * 1000),
      artistsDiscovered: Math.floor(Math.random() * 100),
      playlistsCreated: Math.floor(Math.random() * 20),
      favoriteGenre: "Pop", // Would come from actual listening data
      topArtist: "Various Artists",
      monthlyMinutes: Math.floor(Math.random() * 2000),
      streakDays: Math.floor(Math.random() * 30),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting user stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user stats",
    });
  }
};

// GET /api/v2/users/search - Search users by username or name
export const searchUsers: RequestHandler = async (req, res) => {
  try {
    await connectDB();

    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
        { display_name: { $regex: query, $options: "i" } },
      ],
    })
      .select("-password -email")
      .limit(limit);

    const searchResults = users.map((user) => ({
      id: user._id.toString(),
      username: user.username,
      name: user.name,
      displayName: user.display_name || user.name,
      profilePicture: user.profile_image_url || "",
      isVerified: user.is_verified,
      isArtist: user.is_artist,
      followerCount: user.follower_count,
    }));

    res.json({
      success: true,
      data: searchResults,
    });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search users",
    });
  }
};

// POST /api/v2/profile/follow/:targetUserId - Follow/unfollow a user
export const toggleFollow: RequestHandler = async (req, res) => {
  try {
    await connectDB();

    const userId = req.user?.userId;
    const targetUserId = req.params.targetUserId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (userId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: "Cannot follow yourself",
      });
    }

    const [user, targetUser] = await Promise.all([
      User.findById(userId),
      User.findById(targetUserId),
    ]);

    if (!user || !targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // For simplicity, we'll just update counters
    // In a real app, you'd have a separate Follow collection
    const isFollowing = false; // Would check actual follow relationship

    if (isFollowing) {
      // Unfollow
      await Promise.all([
        User.findByIdAndUpdate(userId, { $inc: { following_count: -1 } }),
        User.findByIdAndUpdate(targetUserId, { $inc: { follower_count: -1 } }),
      ]);
    } else {
      // Follow
      await Promise.all([
        User.findByIdAndUpdate(userId, { $inc: { following_count: 1 } }),
        User.findByIdAndUpdate(targetUserId, { $inc: { follower_count: 1 } }),
      ]);
    }

    res.json({
      success: true,
      data: {
        isFollowing: !isFollowing,
        followerCount: targetUser.follower_count + (isFollowing ? -1 : 1),
      },
      message: isFollowing
        ? "Unfollowed successfully"
        : "Followed successfully",
    });
  } catch (error) {
    console.error("Error toggling follow:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update follow status",
    });
  }
};
