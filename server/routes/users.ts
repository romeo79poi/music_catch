import { RequestHandler } from "express";
import { profileUsers, userFollows } from "../lib/userStore";

// Using shared user store for consistency with auth system

// Get user by ID
export const getUserById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.headers['user-id'] as string;
    
    const user = profileUsers.get(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Check if current user follows this user
    let isFollowing = false;
    if (currentUserId && userFollows.has(currentUserId)) {
      isFollowing = userFollows.get(currentUserId)!.has(id);
    }
    
    // Don't expose sensitive information for other users
    const publicUser = currentUserId === id ? user : {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      profile_image_url: user.profile_image_url,
      bio: user.bio,
      country: user.country,
      is_verified: user.is_verified,
      is_artist: user.is_artist,
      follower_count: user.follower_count,
      following_count: user.following_count,
      created_at: user.created_at
    };
    
    res.json({
      success: true,
      data: {
        ...publicUser,
        is_following: isFollowing
      }
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user"
    });
  }
};

// Get current user profile
export const getCurrentUser: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers['user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required"
      });
    }
    
    const user = profileUsers.get(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile"
    });
  }
};

// Update user profile
export const updateUserProfile: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required"
      });
    }
    
    if (userId !== id) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own profile"
      });
    }
    
    const user = profileUsers.get(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    const {
      display_name,
      bio,
      country,
      date_of_birth,
      gender,
      profile_image_url
    } = req.body;
    
    // Update fields if provided
    if (display_name !== undefined) user.display_name = display_name;
    if (bio !== undefined) user.bio = bio;
    if (country !== undefined) user.country = country;
    if (date_of_birth !== undefined) user.date_of_birth = date_of_birth;
    if (gender !== undefined) user.gender = gender;
    if (profile_image_url !== undefined) user.profile_image_url = profile_image_url;
    
    user.updated_at = new Date().toISOString();
    
    profileUsers.set(id, user);
    
    res.json({
      success: true,
      message: "Profile updated successfully",
      data: user
    });
  } catch (error) {
    console.error("Update user profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile"
    });
  }
};

// Search users
export const searchUsers: RequestHandler = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }
    
    const searchTerm = (q as string).toLowerCase();
    const limitNum = parseInt(limit as string);
    
    const searchResults = Array.from(profileUsers.values())
      .filter(user => user.is_active)
      .filter(user =>
        user.username.toLowerCase().includes(searchTerm) ||
        user.display_name.toLowerCase().includes(searchTerm) ||
        user.bio.toLowerCase().includes(searchTerm)
      )
      .map(user => ({
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        profile_image_url: user.profile_image_url,
        bio: user.bio,
        is_verified: user.is_verified,
        is_artist: user.is_artist,
        follower_count: user.follower_count
      }))
      .slice(0, limitNum);
    
    res.json({
      success: true,
      data: searchResults,
      total: searchResults.length
    });
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search users"
    });
  }
};

// Follow user
export const followUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params; // User to follow
    const userId = req.headers['user-id'] as string; // Current user
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required"
      });
    }
    
    if (userId === id) {
      return res.status(400).json({
        success: false,
        message: "Cannot follow yourself"
      });
    }
    
    const targetUser = profileUsers.get(id);
    const currentUser = profileUsers.get(userId);
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "Current user not found"
      });
    }
    
    // Initialize follow relationships
    if (!userFollows.has(userId)) {
      userFollows.set(userId, new Set());
    }
    
    const userFollowSet = userFollows.get(userId)!;
    
    if (userFollowSet.has(id)) {
      return res.status(400).json({
        success: false,
        message: "Already following this user"
      });
    }
    
    // Add follow relationship
    userFollowSet.add(id);
    
    // Update counts
    targetUser.follower_count += 1;
    currentUser.following_count += 1;
    
    // Update timestamps
    targetUser.updated_at = new Date().toISOString();
    currentUser.updated_at = new Date().toISOString();

    profileUsers.set(id, targetUser);
    profileUsers.set(userId, currentUser);

    res.json({
      success: true,
      message: "Successfully followed user",
      data: {
        user_id: id,
        is_following: true,
        follower_count: targetUser.follower_count
      }
    });
  } catch (error) {
    console.error("Follow user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to follow user"
    });
  }
};

// Unfollow user
export const unfollowUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params; // User to unfollow
    const userId = req.headers['user-id'] as string; // Current user
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required"
      });
    }
    
    const targetUser = profileUsers.get(id);
    const currentUser = profileUsers.get(userId);
    
    if (!targetUser || !currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    if (!userFollows.has(userId)) {
      return res.status(400).json({
        success: false,
        message: "Not following this user"
      });
    }
    
    const userFollowSet = userFollows.get(userId)!;
    
    if (!userFollowSet.has(id)) {
      return res.status(400).json({
        success: false,
        message: "Not following this user"
      });
    }
    
    // Remove follow relationship
    userFollowSet.delete(id);
    
    // Update counts
    targetUser.follower_count = Math.max(0, targetUser.follower_count - 1);
    currentUser.following_count = Math.max(0, currentUser.following_count - 1);
    
    // Update timestamps
    targetUser.updated_at = new Date().toISOString();
    currentUser.updated_at = new Date().toISOString();

    profileUsers.set(id, targetUser);
    profileUsers.set(userId, currentUser);

    res.json({
      success: true,
      message: "Successfully unfollowed user",
      data: {
        user_id: id,
        is_following: false,
        follower_count: targetUser.follower_count
      }
    });
  } catch (error) {
    console.error("Unfollow user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to unfollow user"
    });
  }
};

// Get user followers
export const getUserFollowers: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const user = profileUsers.get(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Find all users who follow this user
    const followers: any[] = [];
    
    for (const [followerId, followSet] of userFollows.entries()) {
      if (followSet.has(id)) {
        const follower = profileUsers.get(followerId);
        if (follower) {
          followers.push({
            id: follower.id,
            username: follower.username,
            display_name: follower.display_name,
            profile_image_url: follower.profile_image_url,
            is_verified: follower.is_verified,
            is_artist: follower.is_artist,
            follower_count: follower.follower_count
          });
        }
      }
    }
    
    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedFollowers = followers.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedFollowers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: followers.length,
        pages: Math.ceil(followers.length / limitNum)
      }
    });
  } catch (error) {
    console.error("Get user followers error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch followers"
    });
  }
};

// Get user following
export const getUserFollowing: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const user = profileUsers.get(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    const followSet = userFollows.get(id) || new Set();
    const following: any[] = [];
    
    for (const followedUserId of followSet) {
      const followedUser = profileUsers.get(followedUserId);
      if (followedUser) {
        following.push({
          id: followedUser.id,
          username: followedUser.username,
          display_name: followedUser.display_name,
          profile_image_url: followedUser.profile_image_url,
          is_verified: followedUser.is_verified,
          is_artist: followedUser.is_artist,
          follower_count: followedUser.follower_count
        });
      }
    }
    
    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedFollowing = following.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedFollowing,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: following.length,
        pages: Math.ceil(following.length / limitNum)
      }
    });
  } catch (error) {
    console.error("Get user following error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch following"
    });
  }
};

// Get user statistics
export const getUserStatistics: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = profileUsers.get(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Mock statistics (in real app, calculate from database)
    const stats = {
      user_id: user.id,
      total_playlists: 12,
      total_liked_tracks: 234,
      total_liked_albums: 45,
      total_listening_hours: 1250,
      average_daily_listening: 3.2,
      top_genre: "Pop",
      total_followers: user.follower_count,
      total_following: user.following_count,
      account_age_days: Math.floor((new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      most_played_track: {
        id: "550e8400-e29b-41d4-a716-446655440040",
        title: "Anti-Hero",
        artist: "Taylor Swift",
        play_count: 47
      },
      listening_trends: {
        weekly_growth: "+5.2%",
        monthly_growth: "+18.7%",
        peak_listening_hour: 19, // 7 PM
        favorite_day: "Saturday"
      }
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Get user statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user statistics"
    });
  }
};
