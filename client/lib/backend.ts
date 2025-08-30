// Backend connection utility for Music Catch
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export class BackendAPI {
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("token");
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error: any) {
      console.error(`API Error (${endpoint}):`, error);
      return {
        success: false,
        error: error.message || "Network error occurred",
      };
    }
  }

  // Auth endpoints
  static async login(email: string, password: string) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  static async signup(userData: any) {
    return this.request("/auth/signup", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  static async verifyToken() {
    return this.request("/auth/verify");
  }

  // Music endpoints
  static async getTrending(limit = 10) {
    return this.request(`/music/trending?limit=${limit}`);
  }

  static async getRecommendations(limit = 10) {
    return this.request(`/music/recommendations?limit=${limit}`);
  }

  static async getFeaturedPlaylists(limit = 8) {
    return this.request(`/music/playlists/featured?limit=${limit}`);
  }

  static async getGenres() {
    return this.request("/music/genres");
  }

  static async getRecentlyPlayed(limit = 8) {
    return this.request(`/music/recently-played?limit=${limit}`);
  }

  static async searchSongs(query: string, limit = 20) {
    return this.request(
      `/api/v1/tracks/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    );
  }

  static async playTrack(songId: string) {
    return this.request(`/music/play/${songId}`, {
      method: "POST",
    });
  }

  // Likes endpoints
  static async likeSong(songId: string) {
    return this.request(`/api/v1/tracks/${songId}/like`, {
      method: "PUT",
    });
  }

  static async unlikeSong(songId: string) {
    return this.request(`/api/v1/tracks/${songId}/like`, {
      method: "DELETE",
    });
  }

  static async getLikedSongs() {
    return this.request("/api/v1/users/liked-tracks");
  }

  // Profile endpoints
  static async getProfile(userId?: string) {
    const endpoint = userId ? `/profile/${userId}` : "/profile/me";
    return this.request(endpoint);
  }

  static async updateProfile(updates: any) {
    return this.request("/profile/me", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  // Playlist endpoints
  static async getPlaylists() {
    return this.request("/playlists");
  }

  static async createPlaylist(playlistData: any) {
    return this.request("/playlists", {
      method: "POST",
      body: JSON.stringify(playlistData),
    });
  }

  static async getPlaylist(playlistId: string) {
    return this.request(`/playlists/${playlistId}`);
  }

  static async updatePlaylist(playlistId: string, updates: any) {
    return this.request(`/playlists/${playlistId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  static async deletePlaylist(playlistId: string) {
    return this.request(`/playlists/${playlistId}`, {
      method: "DELETE",
    });
  }

  static async addSongToPlaylist(playlistId: string, songId: string) {
    return this.request(`/api/v1/playlists/${playlistId}/tracks`, {
      method: "POST",
      body: JSON.stringify({ songId }),
    });
  }

  static async removeSongFromPlaylist(playlistId: string, songId: string) {
    return this.request(`/api/v1/playlists/${playlistId}/tracks/${songId}`, {
      method: "DELETE",
    });
  }

  // Utility methods
  static setAuthToken(token: string) {
    localStorage.setItem("token", token);
  }

  static clearAuthToken() {
    localStorage.removeItem("token");
  }

  static getAuthToken(): string | null {
    return localStorage.getItem("token");
  }

  static isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}

export default BackendAPI;
