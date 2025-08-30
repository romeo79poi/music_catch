import { supabaseAPI } from "./supabase";

// Enhanced API wrapper with consistent error handling
export class APIClient {
  private baseURL: string;

  constructor(baseURL: string = "/api") {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config: RequestInit = {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      };

      // Add JWT token if available
      const token = localStorage.getItem("token");
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }

      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Network error" }));
        return {
          data: null,
          error: errorData.message || `HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // GET request
  async get<T>(
    endpoint: string,
  ): Promise<{ data: T | null; error: string | null }> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  // POST request
  async post<T>(
    endpoint: string,
    body?: any,
  ): Promise<{ data: T | null; error: string | null }> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // PUT request
  async put<T>(
    endpoint: string,
    body?: any,
  ): Promise<{ data: T | null; error: string | null }> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // DELETE request
  async delete<T>(
    endpoint: string,
  ): Promise<{ data: T | null; error: string | null }> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

// Create instances for different services
export const mongoAPI = new APIClient("/api/v2");
export const mainAPI = new APIClient("/api");
export const backendAPI = new APIClient("/api/v1");

// Unified API service that chooses the best backend
export const unifiedAPI = {
  // Authentication - Use MongoDB+JWT (most complete)
  auth: {
    register: (data: any) => mongoAPI.post("/auth/register", data),
    login: (data: any) => mongoAPI.post("/auth/login", data),
    refreshToken: () => mongoAPI.post("/auth/refresh-token"),
    checkAvailability: (field: string, value: string) =>
      mongoAPI.get(`/auth/check-availability?${field}=${value}`),
  },

  // Music data - Use backend API (v1)
  music: {
    getTrending: () => backendAPI.get("/tracks/trending"),
    search: (query: string) => backendAPI.get(`/tracks/search?q=${query}`),
    getById: (id: string) => backendAPI.get(`/tracks/${id}`),
    recordPlay: (id: string) => backendAPI.post(`/tracks/${id}/play`),
  },

  // User data - Use Supabase (real-time)
  users: {
    getProfile: supabaseAPI.getUserProfile,
    updateProfile: supabaseAPI.updateUserProfile,
    search: supabaseAPI.searchUsers,
  },

  // Playlists - Use Supabase (real-time)
  playlists: {
    getUserPlaylists: supabaseAPI.getUserPlaylists,
    create: supabaseAPI.createPlaylist,
    addSong: supabaseAPI.addSongToPlaylist,
  },
};

export default unifiedAPI;
