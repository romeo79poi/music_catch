import {
  UserProfile,
  ProfileResponse,
  ProfileUpdateRequest,
  LikedSongsResponse,
  RecentlyPlayedResponse,
  FollowResponse,
  Playlist,
  PlaylistResponse,
  PlaylistCreateRequest,
  PlaylistUpdateRequest,
  UploadResponse,
  SubscriptionResponse,
  SubscriptionUpdateRequest,
  UserSettings,
  ApiError,
} from "@shared/api";

const API_BASE_URL = "/api";

// Auth helper function
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

class LocalApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
  ) {
    super(message);
    this.name = "LocalApiError";
  }
}

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new LocalApiError(
      errorData.message || `API request failed with status ${response.status}`,
      errorData.code,
      response.status,
    );
  }

  return response.json();
}

// Profile API
export const profileApi = {
  // Get user profile
  getProfile: (userId = "user1"): Promise<ProfileResponse> =>
    apiRequest(`/profile/${userId}`),

  // Update user profile
  updateProfile: (
    updates: ProfileUpdateRequest,
    userId = "user1",
  ): Promise<ProfileResponse> =>
    apiRequest(`/profile/${userId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    }),

  // Get user stats
  getUserStats: (userId = "user1") => apiRequest(`/profile/${userId}/stats`),

  // Liked songs
  getLikedSongs: (
    userId = "user1",
    page = 1,
    limit = 20,
  ): Promise<LikedSongsResponse> =>
    apiRequest(`/profile/${userId}/liked-songs?page=${page}&limit=${limit}`),

  toggleLikedSong: (songId: string, userId = "user1") =>
    apiRequest(`/profile/${userId}/liked-songs/${songId}`, {
      method: "POST",
    }),

  // Recently played
  getRecentlyPlayed: (
    userId = "user1",
    limit = 10,
  ): Promise<RecentlyPlayedResponse> =>
    apiRequest(`/profile/${userId}/recently-played?limit=${limit}`),

  addToRecentlyPlayed: (songId: string, userId = "user1") =>
    apiRequest(`/profile/${userId}/recently-played`, {
      method: "POST",
      body: JSON.stringify({ songId }),
    }),

  // Follow functionality
  toggleFollow: (
    targetUserId: string,
    userId = "user1",
  ): Promise<FollowResponse> =>
    apiRequest(`/profile/${userId}/follow/${targetUserId}`, {
      method: "POST",
    }),
};

// Playlist API
export const playlistApi = {
  // Get user playlists
  getUserPlaylists: (userId = "user1", includePrivate = true) =>
    apiRequest(`/playlists/${userId}?includePrivate=${includePrivate}`),

  // Get specific playlist
  getPlaylist: (
    playlistId: string,
    userId = "user1",
  ): Promise<PlaylistResponse> =>
    apiRequest(`/playlist/${playlistId}/${userId}`),

  // Create playlist
  createPlaylist: (
    playlist: PlaylistCreateRequest,
    userId = "user1",
  ): Promise<PlaylistResponse> =>
    apiRequest(`/playlists/${userId}`, {
      method: "POST",
      body: JSON.stringify(playlist),
    }),

  // Update playlist
  updatePlaylist: (
    playlistId: string,
    updates: PlaylistUpdateRequest,
    userId = "user1",
  ): Promise<PlaylistResponse> =>
    apiRequest(`/playlist/${playlistId}/${userId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    }),

  // Delete playlist
  deletePlaylist: (playlistId: string, userId = "user1") =>
    apiRequest(`/playlist/${playlistId}/${userId}`, {
      method: "DELETE",
    }),

  // Add song to playlist
  addSongToPlaylist: (playlistId: string, songId: string, userId = "user1") =>
    apiRequest(`/api/playlist/${playlistId}/songs/${userId}`, {
      method: "POST",
      body: JSON.stringify({ songId }),
    }),

  // Remove song from playlist
  removeSongFromPlaylist: (
    playlistId: string,
    songId: string,
    userId = "user1",
  ) =>
    apiRequest(`/api/playlist/${playlistId}/songs/${songId}/${userId}`, {
      method: "DELETE",
    }),
};

// Upload API
export const uploadApi = {
  // Upload profile picture
  uploadProfilePicture: async (file: File): Promise<UploadResponse> => {
    // Create a data URL from the uploaded file for demo purposes
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const dataUrl = e.target?.result as string;
          const fileData = {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            dataUrl: dataUrl, // Include the actual image data
          };

          const response = await apiRequest(`/upload/profile-picture`, {
            method: "POST",
            body: JSON.stringify(fileData),
          });
          resolve(response as UploadResponse);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  },

  // Delete profile picture
  deleteProfilePicture: (fileName: string) =>
    apiRequest(`/upload/profile-picture/${fileName}`, {
      method: "DELETE",
    }),

  // Upload playlist cover
  uploadPlaylistCover: async (file: File): Promise<UploadResponse> => {
    const fileData = {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    };

    return apiRequest(`/upload/playlist-cover`, {
      method: "POST",
      body: JSON.stringify(fileData),
    });
  },

  // Get upload configuration
  getUploadConfig: () => apiRequest(`/upload/config`),
};

// Settings API
export const settingsApi = {
  // Get user settings
  getUserSettings: (userId = "user1") => apiRequest(`/settings/${userId}`),

  // Update user settings
  updateUserSettings: (settings: Partial<UserSettings>, userId = "user1") =>
    apiRequest(`/settings/${userId}`, {
      method: "PUT",
      body: JSON.stringify(settings),
    }),

  // Update notification settings
  updateNotificationSettings: (
    notifications: Partial<UserSettings["notifications"]>,
    userId = "user1",
  ) =>
    apiRequest(`/settings/${userId}/notifications`, {
      method: "PUT",
      body: JSON.stringify(notifications),
    }),

  // Update privacy settings
  updatePrivacySettings: (
    privacy: Partial<UserSettings["privacy"]>,
    userId = "user1",
  ) =>
    apiRequest(`/settings/${userId}/privacy`, {
      method: "PUT",
      body: JSON.stringify(privacy),
    }),

  // Update playback settings
  updatePlaybackSettings: (
    playback: Partial<UserSettings["playback"]>,
    userId = "user1",
  ) =>
    apiRequest(`/settings/${userId}/playback`, {
      method: "PUT",
      body: JSON.stringify(playback),
    }),

  // Reset settings to default
  resetSettings: (userId = "user1") =>
    apiRequest(`/settings/${userId}/reset`, {
      method: "POST",
    }),
};

// Subscription API
export const subscriptionApi = {
  // Get subscription
  getSubscription: (userId = "user1"): Promise<SubscriptionResponse> =>
    apiRequest(`/subscription/${userId}`),

  // Update subscription
  updateSubscription: (
    updates: SubscriptionUpdateRequest,
    userId = "user1",
  ): Promise<SubscriptionResponse> =>
    apiRequest(`/subscription/${userId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    }),

  // Cancel subscription
  cancelSubscription: (userId = "user1"): Promise<SubscriptionResponse> =>
    apiRequest(`/subscription/${userId}`, {
      method: "DELETE",
    }),
};

// Song API for like/unlike functionality
export const songApi = {
  // Like a song
  likeSong: (
    songId: string,
  ): Promise<{ message: string; likedSongs: string[] }> => {
    const token = localStorage.getItem("token");
    return apiRequest(`/api/v1/tracks/${songId}/like`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Unlike a song
  unlikeSong: (
    songId: string,
  ): Promise<{ message: string; likedSongs: string[] }> => {
    const token = localStorage.getItem("token");
    return apiRequest(`/api/v1/tracks/${songId}/like`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Get all liked songs
  getLikedSongs: (): Promise<{ likedSongs: any[] }> => {
    const token = localStorage.getItem("token");
    return apiRequest(`/api/v1/users/liked-tracks`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Toggle like status (convenience method)
  toggleLike: async (
    songId: string,
    isCurrentlyLiked: boolean,
  ): Promise<{ message: string; likedSongs: string[] }> => {
    if (isCurrentlyLiked) {
      return songApi.unlikeSong(songId);
    } else {
      return songApi.likeSong(songId);
    }
  },

  // Search songs by keyword
  searchSongs: (
    query: string,
    limit: number = 20,
  ): Promise<{ results: any[] }> => {
    const token = localStorage.getItem("token");
    return apiRequest(
      `/api/v1/tracks/search?q=${encodeURIComponent(query)}&limit=${limit}`,
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      },
    );
  },
};

// Messages API
export const messagesApi = {
  // Get conversations
  getConversations: (): Promise<any[]> => {
    return apiRequest("/messages/conversations", {
      headers: getAuthHeaders(),
    });
  },

  // Get messages for a conversation
  getMessages: (conversationId: string): Promise<any[]> => {
    return apiRequest(`/messages/${conversationId}`, {
      headers: getAuthHeaders(),
    });
  },

  // Send a message
  sendMessage: (conversationId: string, content: string): Promise<any> => {
    return apiRequest(`/messages/${conversationId}`, {
      method: "POST",
      body: JSON.stringify({ content }),
      headers: getAuthHeaders(),
    });
  },

  // Create new conversation
  createConversation: (userId: string): Promise<any> => {
    return apiRequest("/messages/conversations", {
      method: "POST",
      body: JSON.stringify({ userId }),
      headers: getAuthHeaders(),
    });
  },
};

// Search API
export const searchApi = {
  // Search all content
  searchAll: (query: string, limit = 20): Promise<any> => {
    return apiRequest(`/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
      headers: getAuthHeaders(),
    });
  },

  // Search songs
  searchSongs: (query: string, limit = 20): Promise<any> => {
    return apiRequest(
      `/search/songs?q=${encodeURIComponent(query)}&limit=${limit}`,
      {
        headers: getAuthHeaders(),
      },
    );
  },

  // Search artists
  searchArtists: (query: string, limit = 20): Promise<any> => {
    return apiRequest(
      `/search/artists?q=${encodeURIComponent(query)}&limit=${limit}`,
      {
        headers: getAuthHeaders(),
      },
    );
  },

  // Search albums
  searchAlbums: (query: string, limit = 20): Promise<any> => {
    return apiRequest(
      `/search/albums?q=${encodeURIComponent(query)}&limit=${limit}`,
      {
        headers: getAuthHeaders(),
      },
    );
  },

  // Search users
  searchUsers: (query: string, limit = 20): Promise<any> => {
    return apiRequest(
      `/search/users?q=${encodeURIComponent(query)}&limit=${limit}`,
      {
        headers: getAuthHeaders(),
      },
    );
  },
};

// Home feed API
export const homeApi = {
  // Get home feed
  getFeed: (limit = 20): Promise<any> => {
    return apiRequest(`/home/feed?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
  },

  // Get featured content
  getFeatured: (): Promise<any> => {
    return apiRequest("/home/featured", {
      headers: getAuthHeaders(),
    });
  },

  // Get trending songs
  getTrending: (limit = 10): Promise<any> => {
    return apiRequest(`/home/trending?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
  },

  // Get new releases
  getNewReleases: (limit = 10): Promise<any> => {
    return apiRequest(`/home/new-releases?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
  },

  // Get recommended for user
  getRecommendations: (limit = 10): Promise<any> => {
    return apiRequest(`/home/recommendations?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
  },
};

// History API
export const historyApi = {
  // Get listening history
  getHistory: (limit = 50, period = "all"): Promise<any> => {
    return apiRequest(`/history?limit=${limit}&period=${period}`, {
      headers: getAuthHeaders(),
    });
  },

  // Add to history
  addToHistory: (songId: string): Promise<any> => {
    return apiRequest("/history", {
      method: "POST",
      body: JSON.stringify({ songId }),
      headers: getAuthHeaders(),
    });
  },

  // Clear history
  clearHistory: (): Promise<any> => {
    return apiRequest("/history", {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  },

  // Get analytics
  getAnalytics: (period = "week"): Promise<any> => {
    return apiRequest(`/analytics/user?period=${period}`, {
      headers: getAuthHeaders(),
    });
  },
};

// Library API
export const libraryApi = {
  // Get user library
  getLibrary: (): Promise<any> => {
    return apiRequest("/library", {
      headers: getAuthHeaders(),
    });
  },

  // Get saved albums
  getSavedAlbums: (limit = 50): Promise<any> => {
    return apiRequest(`/library/albums?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
  },

  // Get saved artists
  getSavedArtists: (limit = 50): Promise<any> => {
    return apiRequest(`/library/artists?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
  },

  // Save album
  saveAlbum: (albumId: string): Promise<any> => {
    return apiRequest(`/library/albums/${albumId}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
  },

  // Unsave album
  unsaveAlbum: (albumId: string): Promise<any> => {
    return apiRequest(`/library/albums/${albumId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  },

  // Follow artist
  followArtist: (artistId: string): Promise<any> => {
    return apiRequest(`/library/artists/${artistId}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
  },

  // Unfollow artist
  unfollowArtist: (artistId: string): Promise<any> => {
    return apiRequest(`/library/artists/${artistId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  },
};

// Auth API
export const authApi = {
  // Login with email
  loginWithEmail: (email: string, password: string): Promise<any> => {
    return apiRequest("/auth/login/email", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  // Login with username
  loginWithUsername: (username: string, password: string): Promise<any> => {
    return apiRequest("/auth/login/username", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  // Register with email
  registerWithEmail: (userData: any): Promise<any> => {
    return apiRequest("/auth/register/email", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  // Register with phone
  registerWithPhone: (userData: any): Promise<any> => {
    return apiRequest("/auth/register/phone", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  // Send email verification
  sendEmailVerification: (email: string): Promise<any> => {
    return apiRequest("/auth/send-email-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  // Verify email
  verifyEmail: (email: string, code: string): Promise<any> => {
    return apiRequest("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
  },

  // Send phone OTP
  sendPhoneOTP: (phone: string): Promise<any> => {
    return apiRequest("/auth/send-phone-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  },

  // Verify phone OTP
  verifyPhoneOTP: (phone: string, code: string): Promise<any> => {
    return apiRequest("/auth/verify-phone-otp", {
      method: "POST",
      body: JSON.stringify({ phone, code }),
    });
  },

  // Logout
  logout: (): Promise<any> => {
    return apiRequest("/auth/logout", {
      method: "POST",
      headers: getAuthHeaders(),
    });
  },

  // Refresh token
  refreshToken: (): Promise<any> => {
    const refreshToken = localStorage.getItem("refreshToken");
    return apiRequest("/auth/token/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  },

  // Get user profile
  getUserProfile: (): Promise<any> => {
    return apiRequest("/auth/profile", {
      headers: getAuthHeaders(),
    });
  },

  // Check availability
  checkAvailability: (field: string, value: string): Promise<any> => {
    return apiRequest(
      `/auth/check-availability?${field}=${encodeURIComponent(value)}`,
    );
  },
};

// Export all APIs
export const api = {
  auth: authApi,
  profile: profileApi,
  playlist: playlistApi,
  upload: uploadApi,
  settings: settingsApi,
  subscription: subscriptionApi,
  song: songApi,
  messages: messagesApi,
  search: searchApi,
  home: homeApi,
  history: historyApi,
  library: libraryApi,
};

export default api;
