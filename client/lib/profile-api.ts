// Profile API functions for MongoDB backend

export interface UserProfileData {
  id: string;
  username: string;
  name: string;
  displayName: string;
  email: string;
  bio: string;
  profilePicture: string;
  isVerified: boolean;
  emailVerified: boolean;
  isArtist: boolean;
  followerCount: number;
  followingCount: number;
  joinDate: string;
  lastLogin?: string;
  provider: string;
  phone?: string;
}

export interface UserStats {
  totalListeningTime: number;
  tracksPlayed: number;
  artistsDiscovered: number;
  playlistsCreated: number;
  favoriteGenre: string;
  topArtist: string;
  monthlyMinutes: number;
  streakDays: number;
}

// Fetch user profile from MongoDB backend
export const fetchUserProfileFromMongoDB = async (
  userId?: string,
): Promise<{
  success: boolean;
  userData?: UserProfileData;
  error?: string;
}> => {
  try {
    const token = localStorage.getItem("token");
    const url = userId ? `/api/v2/profile/${userId}` : "/api/v2/profile";

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    const data = await response.json();

    if (data.success && data.data) {
      return {
        success: true,
        userData: data.data,
      };
    } else {
      return {
        success: false,
        error: data.message || "Failed to fetch profile",
      };
    }
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch profile",
    };
  }
};

// Update user profile in MongoDB backend
export const updateUserProfileInMongoDB = async (
  updates: Partial<UserProfileData>,
  userId?: string,
): Promise<{
  success: boolean;
  userData?: UserProfileData;
  error?: string;
}> => {
  try {
    const token = localStorage.getItem("token");
    const url = userId ? `/api/v2/profile/${userId}` : "/api/v2/profile";

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (data.success && data.data) {
      return {
        success: true,
        userData: data.data,
      };
    } else {
      return {
        success: false,
        error: data.message || "Failed to update profile",
      };
    }
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    return {
      success: false,
      error: error.message || "Failed to update profile",
    };
  }
};

// Fetch user statistics from MongoDB backend
export const fetchUserStatsFromMongoDB = async (
  userId?: string,
): Promise<{
  success: boolean;
  stats?: UserStats;
  error?: string;
}> => {
  try {
    const token = localStorage.getItem("token");
    const url = userId
      ? `/api/v2/profile/${userId}/stats`
      : "/api/v2/profile/stats";

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    const data = await response.json();

    if (data.success && data.data) {
      return {
        success: true,
        stats: data.data,
      };
    } else {
      return {
        success: false,
        error: data.message || "Failed to fetch stats",
      };
    }
  } catch (error: any) {
    console.error("Error fetching user stats:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch stats",
    };
  }
};

// Search users in MongoDB backend
export const searchUsersInMongoDB = async (
  query: string,
): Promise<{
  success: boolean;
  users?: UserProfileData[];
  error?: string;
}> => {
  try {
    const response = await fetch(
      `/api/v2/users/search?q=${encodeURIComponent(query)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (data.success && data.data) {
      return {
        success: true,
        users: data.data,
      };
    } else {
      return {
        success: false,
        error: data.message || "Failed to search users",
      };
    }
  } catch (error: any) {
    console.error("Error searching users:", error);
    return {
      success: false,
      error: error.message || "Failed to search users",
    };
  }
};

// Follow/unfollow user in MongoDB backend
export const toggleFollowInMongoDB = async (
  targetUserId: string,
): Promise<{
  success: boolean;
  isFollowing?: boolean;
  followerCount?: number;
  error?: string;
}> => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    const response = await fetch(`/api/v2/profile/${targetUserId}/follow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success && data.data) {
      return {
        success: true,
        isFollowing: data.data.isFollowing,
        followerCount: data.data.followerCount,
      };
    } else {
      return {
        success: false,
        error: data.message || "Failed to update follow status",
      };
    }
  } catch (error: any) {
    console.error("Error toggling follow:", error);
    return {
      success: false,
      error: error.message || "Failed to update follow status",
    };
  }
};
