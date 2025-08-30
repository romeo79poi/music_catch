import { RequestHandler } from "express";
import {
  UserProfile,
  ProfileResponse,
  ProfileUpdateRequest,
  LikedSongsResponse,
  RecentlyPlayedResponse,
  FollowResponse,
  ApiError,
  Song,
  FollowUser,
} from "@shared/api";

// In-memory database simulation (in production, use a real database)
let profiles: Map<string, UserProfile> = new Map();
let songs: Map<string, Song> = new Map();
let followers: Map<string, Set<string>> = new Map();

// Initialize with mock data
initializeMockData();

// Function to get or create profile from user data
function getOrCreateProfile(userId: string): UserProfile | null {
  let profile = profiles.get(userId);
  if (!profile && userId !== "user1") {
    // Create a basic profile for new users
    profile = {
      id: userId,
      username: `user_${userId}`,
      displayName: `User ${userId}`,
      bio: "Music lover 🎵",
      profilePicture: "",
      email: `user${userId}@example.com`,
      joinDate: new Date().toISOString().split("T")[0],
      isVerified: false,
      followers: 0,
      following: 0,
      likedSongs: [],
      recentlyPlayed: [],
      playlists: [],
      musicPreferences: {
        favoriteGenres: ["Pop"],
        favoriteArtists: [],
        mood: "Chill",
        language: ["English"],
        autoPlay: true,
        crossfade: false,
        soundQuality: "high",
      },
      socialLinks: {},
      subscription: {
        plan: "free",
        status: "active",
        startDate: new Date().toISOString().split("T")[0],
        features: ["Basic listening"],
        autoRenew: false,
      },
      settings: {
        theme: "dark",
        language: "en",
        notifications: {
          email: true,
          push: true,
          newFollowers: true,
          newMusic: true,
          recommendations: true,
          socialActivity: false,
        },
        privacy: {
          profileVisibility: "public",
          showRecentlyPlayed: true,
          showLikedSongs: true,
          showPlaylists: true,
          allowFollowers: true,
        },
        playback: {
          volume: 80,
          shuffle: false,
          repeat: "off",
          gaplessPlayback: true,
          normalization: true,
        },
      },
    };
    profiles.set(userId, profile);
  }
  return profile;
}

function initializeMockData() {
  const mockProfile: UserProfile = {
    id: "user1",
    username: "biospectra",
    displayName: "Bio Spectra",
    bio: "Music lover 🎵 | Producer | Always discovering new sounds ✨",
    profilePicture: "",
    email: "bio.spectra@musiccatch.com",
    joinDate: "2023-01-15",
    isVerified: true,
    followers: 1248,
    following: 567,
    likedSongs: ["song1", "song2", "song3"],
    recentlyPlayed: ["song1", "song3", "song4"],
    playlists: [
      {
        id: "playlist1",
        name: "My Vibes",
        description: "Songs that match my mood",
        coverImage:
          "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
        songs: ["song1", "song2", "song3"],
        isPublic: true,
        createdAt: "2023-12-01",
        updatedAt: "2023-12-01",
        createdBy: "user1",
        totalDuration: 720,
      },
      {
        id: "playlist2",
        name: "Late Night Sessions",
        description: "Perfect for coding and creating",
        coverImage:
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
        songs: ["song4", "song5"],
        isPublic: false,
        createdAt: "2023-11-15",
        updatedAt: "2023-11-15",
        createdBy: "user1",
        totalDuration: 480,
      },
    ],
    musicPreferences: {
      favoriteGenres: ["Electronic", "Indie", "Alternative", "Lo-fi"],
      favoriteArtists: ["The Weeknd", "Daft Punk", "Tame Impala", "ODESZA"],
      mood: "Chill",
      language: ["English", "French"],
      autoPlay: true,
      crossfade: false,
      soundQuality: "high",
    },
    socialLinks: {
      twitter: "@biospectramusic",
      website: "biospectra.com",
      musicPlatform: "biospectra",
    },
    subscription: {
      plan: "premium",
      status: "active",
      startDate: "2023-01-15",
      features: [
        "Unlimited skips",
        "Ad-free listening",
        "High-quality audio",
        "Offline downloads",
      ],
      autoRenew: true,
    },
    settings: {
      theme: "dark",
      language: "en",
      notifications: {
        email: true,
        push: true,
        newFollowers: true,
        newMusic: true,
        recommendations: true,
        socialActivity: false,
      },
      privacy: {
        profileVisibility: "public",
        showRecentlyPlayed: true,
        showLikedSongs: true,
        showPlaylists: true,
        allowFollowers: true,
      },
      playback: {
        volume: 80,
        shuffle: false,
        repeat: "off",
        gaplessPlayback: true,
        normalization: true,
      },
    },
  };

  const mockSongs: Song[] = [
    {
      id: "song1",
      title: "Blinding Lights",
      artist: "The Weeknd",
      album: "After Hours",
      duration: 200,
      coverImage:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
      genre: "Pop",
      releaseDate: "2019-11-29",
      isLiked: true,
    },
    {
      id: "song2",
      title: "Levitating",
      artist: "Dua Lipa",
      album: "Future Nostalgia",
      duration: 203,
      coverImage:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
      genre: "Pop",
      releaseDate: "2020-03-27",
      isLiked: true,
    },
    {
      id: "song3",
      title: "Good 4 U",
      artist: "Olivia Rodrigo",
      album: "SOUR",
      duration: 178,
      coverImage:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
      genre: "Pop Rock",
      releaseDate: "2021-05-14",
      isLiked: true,
    },
    {
      id: "song4",
      title: "Stay",
      artist: "The Kid LAROI",
      album: "F*CK LOVE 3",
      duration: 141,
      coverImage:
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop",
      genre: "Hip Hop",
      releaseDate: "2021-07-09",
      isLiked: false,
    },
    {
      id: "song5",
      title: "Heat Waves",
      artist: "Glass Animals",
      album: "Dreamland",
      duration: 238,
      coverImage:
        "https://images.unsplash.com/photo-1571974599782-87624638275c?w=400&h=400&fit=crop",
      genre: "Indie",
      releaseDate: "2020-06-29",
      isLiked: false,
    },
  ];

  profiles.set(mockProfile.id, mockProfile);
  mockSongs.forEach((song) => songs.set(song.id, song));

  // Initialize followers for the user
  followers.set("user1", new Set(["user2", "user3", "user4"]));
}

// Get user profile
export const getProfile: RequestHandler = (req, res) => {
  try {
    const userId = req.params.userId || "user1"; // Default to user1 for demo
    const profile = getOrCreateProfile(userId);

    if (!profile) {
      const error: ApiError = {
        success: false,
        message: "Profile not found",
        code: "PROFILE_NOT_FOUND",
      };
      return res.status(404).json(error);
    }

    const response: ProfileResponse = {
      profile,
      success: true,
    };

    res.json(response);
  } catch (error) {
    const errorResponse: ApiError = {
      success: false,
      message: "Failed to get profile",
      details: error,
    };
    res.status(500).json(errorResponse);
  }
};

// Update user profile
export const updateProfile: RequestHandler = (req, res) => {
  try {
    const userId = req.params.userId || "user1";
    const updates: ProfileUpdateRequest = req.body;

    const profile = getOrCreateProfile(userId);
    if (!profile) {
      const error: ApiError = {
        success: false,
        message: "Profile not found",
        code: "PROFILE_NOT_FOUND",
      };
      return res.status(404).json(error);
    }

    // Update profile with new data
    const updatedProfile: UserProfile = {
      ...profile,
      ...updates,
      socialLinks: updates.socialLinks
        ? { ...profile.socialLinks, ...updates.socialLinks }
        : profile.socialLinks,
      musicPreferences: updates.musicPreferences
        ? { ...profile.musicPreferences, ...updates.musicPreferences }
        : profile.musicPreferences,
      settings: updates.settings
        ? { ...profile.settings, ...updates.settings }
        : profile.settings,
    };

    profiles.set(userId, updatedProfile);

    const response: ProfileResponse = {
      profile: updatedProfile,
      success: true,
      message: "Profile updated successfully",
    };

    res.json(response);
  } catch (error) {
    const errorResponse: ApiError = {
      success: false,
      message: "Failed to update profile",
      details: error,
    };
    res.status(500).json(errorResponse);
  }
};

// Get liked songs
export const getLikedSongs: RequestHandler = (req, res) => {
  try {
    const userId = req.params.userId || "user1";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const profile = getOrCreateProfile(userId);
    if (!profile) {
      const error: ApiError = {
        success: false,
        message: "Profile not found",
        code: "PROFILE_NOT_FOUND",
      };
      return res.status(404).json(error);
    }

    const likedSongIds = profile.likedSongs;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSongIds = likedSongIds.slice(startIndex, endIndex);

    const likedSongs = paginatedSongIds
      .map((songId) => songs.get(songId))
      .filter((song): song is Song => song !== undefined)
      .map((song) => ({ ...song, isLiked: true }));

    const response: LikedSongsResponse = {
      songs: likedSongs,
      total: likedSongIds.length,
      page,
      limit,
      success: true,
    };

    res.json(response);
  } catch (error) {
    const errorResponse: ApiError = {
      success: false,
      message: "Failed to get liked songs",
      details: error,
    };
    res.status(500).json(errorResponse);
  }
};

// Toggle liked song
export const toggleLikedSong: RequestHandler = (req, res) => {
  try {
    const userId = req.params.userId || "user1";
    const songId = req.params.songId;

    const profile = getOrCreateProfile(userId);
    if (!profile) {
      const error: ApiError = {
        success: false,
        message: "Profile not found",
        code: "PROFILE_NOT_FOUND",
      };
      return res.status(404).json(error);
    }

    const isLiked = profile.likedSongs.includes(songId);
    let updatedLikedSongs: string[];

    if (isLiked) {
      updatedLikedSongs = profile.likedSongs.filter((id) => id !== songId);
    } else {
      updatedLikedSongs = [...profile.likedSongs, songId];
    }

    const updatedProfile = { ...profile, likedSongs: updatedLikedSongs };
    profiles.set(userId, updatedProfile);

    res.json({
      success: true,
      isLiked: !isLiked,
      message: isLiked
        ? "Song removed from liked songs"
        : "Song added to liked songs",
    });
  } catch (error) {
    const errorResponse: ApiError = {
      success: false,
      message: "Failed to toggle liked song",
      details: error,
    };
    res.status(500).json(errorResponse);
  }
};

// Get recently played
export const getRecentlyPlayed: RequestHandler = (req, res) => {
  try {
    const userId = req.params.userId || "user1";
    const limit = parseInt(req.query.limit as string) || 10;

    const profile = getOrCreateProfile(userId);
    if (!profile) {
      const error: ApiError = {
        success: false,
        message: "Profile not found",
        code: "PROFILE_NOT_FOUND",
      };
      return res.status(404).json(error);
    }

    const recentSongIds = profile.recentlyPlayed.slice(0, limit);
    const recentSongs = recentSongIds
      .map((songId, index) => {
        const song = songs.get(songId);
        if (!song) return null;

        // Mock playedAt times
        const hoursAgo = index * 2 + 1;
        const playedAt = new Date(
          Date.now() - hoursAgo * 60 * 60 * 1000,
        ).toISOString();

        return {
          ...song,
          isLiked: profile.likedSongs.includes(songId),
          playedAt,
        };
      })
      .filter((song): song is Song & { playedAt: string } => song !== null);

    const response: RecentlyPlayedResponse = {
      songs: recentSongs,
      success: true,
    };

    res.json(response);
  } catch (error) {
    const errorResponse: ApiError = {
      success: false,
      message: "Failed to get recently played",
      details: error,
    };
    res.status(500).json(errorResponse);
  }
};

// Follow/Unfollow user
export const toggleFollow: RequestHandler = (req, res) => {
  try {
    const userId = req.params.userId || "user1";
    const targetUserId = req.params.targetUserId;

    if (userId === targetUserId) {
      const error: ApiError = {
        success: false,
        message: "Cannot follow yourself",
        code: "SELF_FOLLOW_ERROR",
      };
      return res.status(400).json(error);
    }

    const userProfile = profiles.get(userId);
    const targetProfile = profiles.get(targetUserId);

    if (!userProfile || !targetProfile) {
      const error: ApiError = {
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND",
      };
      return res.status(404).json(error);
    }

    let userFollowers = followers.get(targetUserId) || new Set();
    const isFollowing = userFollowers.has(userId);

    if (isFollowing) {
      userFollowers.delete(userId);
      targetProfile.followers = Math.max(0, targetProfile.followers - 1);
      userProfile.following = Math.max(0, userProfile.following - 1);
    } else {
      userFollowers.add(userId);
      targetProfile.followers += 1;
      userProfile.following += 1;
    }

    followers.set(targetUserId, userFollowers);
    profiles.set(userId, userProfile);
    profiles.set(targetUserId, targetProfile);

    const response: FollowResponse = {
      isFollowing: !isFollowing,
      followersCount: targetProfile.followers,
      success: true,
      message: isFollowing
        ? "Unfollowed successfully"
        : "Followed successfully",
    };

    res.json(response);
  } catch (error) {
    const errorResponse: ApiError = {
      success: false,
      message: "Failed to toggle follow",
      details: error,
    };
    res.status(500).json(errorResponse);
  }
};

// Add song to recently played
export const addToRecentlyPlayed: RequestHandler = (req, res) => {
  try {
    const userId = req.params.userId || "user1";
    const songId = req.body.songId;

    const profile = getOrCreateProfile(userId);
    if (!profile) {
      const error: ApiError = {
        success: false,
        message: "Profile not found",
        code: "PROFILE_NOT_FOUND",
      };
      return res.status(404).json(error);
    }

    // Remove song if it already exists, then add it to the beginning
    const updatedRecentlyPlayed = [
      songId,
      ...profile.recentlyPlayed.filter((id) => id !== songId),
    ];

    // Keep only the last 50 songs
    const trimmedRecentlyPlayed = updatedRecentlyPlayed.slice(0, 50);

    const updatedProfile = {
      ...profile,
      recentlyPlayed: trimmedRecentlyPlayed,
    };
    profiles.set(userId, updatedProfile);

    res.json({
      success: true,
      message: "Song added to recently played",
    });
  } catch (error) {
    const errorResponse: ApiError = {
      success: false,
      message: "Failed to add to recently played",
      details: error,
    };
    res.status(500).json(errorResponse);
  }
};

// Get user's stats
export const getUserStats: RequestHandler = (req, res) => {
  try {
    const userId = req.params.userId || "user1";

    const profile = getOrCreateProfile(userId);
    if (!profile) {
      const error: ApiError = {
        success: false,
        message: "Profile not found",
        code: "PROFILE_NOT_FOUND",
      };
      return res.status(404).json(error);
    }

    const stats = {
      totalSongsPlayed: profile.recentlyPlayed.length + 429, // Adding mock additional plays
      likedSongsCount: profile.likedSongs.length,
      playlistsCount: profile.playlists.length,
      followersCount: profile.followers,
      followingCount: profile.following,
      totalListeningTime: 12567, // Mock total minutes
      favoriteGenre: profile.musicPreferences.favoriteGenres[0] || "Unknown",
      joinDate: profile.joinDate,
      isVerified: profile.isVerified,
      subscriptionPlan: profile.subscription.plan,
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    const errorResponse: ApiError = {
      success: false,
      message: "Failed to get user stats",
      details: error,
    };
    res.status(500).json(errorResponse);
  }
};
