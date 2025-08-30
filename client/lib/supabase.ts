// Supabase configuration removed - now using Firebase
// This file is kept for backwards compatibility but all functions are disabled

// Mock exports to maintain compatibility
export const supabase = null; // Main supabase client (removed)
export const auth = null;
export const db = null;
export const storage = null;
export const serverTimestamp = () => new Date().toISOString();
export const isSupabaseConfigured = false;

// Mock supabaseAPI to prevent errors
export const supabaseAPI = {
  signUp: () =>
    Promise.resolve({
      data: null,
      error: { message: "Supabase removed - use Firebase" },
    }),
  signIn: () =>
    Promise.resolve({
      data: null,
      error: { message: "Supabase removed - use Firebase" },
    }),
  signOut: () =>
    Promise.resolve({ error: { message: "Supabase removed - use Firebase" } }),
  getCurrentUser: () =>
    Promise.resolve({
      user: null,
      error: { message: "Supabase removed - use Firebase" },
    }),
  signInWithGoogle: () =>
    Promise.resolve({
      data: null,
      error: { message: "Supabase removed - use Firebase" },
    }),
  signInWithFacebook: () =>
    Promise.resolve({
      data: null,
      error: { message: "Supabase removed - use Firebase" },
    }),
  getUserProfile: () => Promise.resolve(null),
  updateUserProfile: () => Promise.resolve(false),
  searchUsers: () => Promise.resolve({ data: [], error: null }),
  getTrendingSongs: () => Promise.resolve({ data: [], error: null }),
  searchSongs: () => Promise.resolve({ data: [], error: null }),
  getSongById: () => Promise.resolve(null),
  likeSong: () => Promise.resolve({ data: null, error: null }),
  unlikeSong: () => Promise.resolve({ data: null, error: null }),
  getUserLikedSongs: () => Promise.resolve({ data: [], error: null }),
  getUserPlaylists: () => Promise.resolve({ data: [], error: null }),
  getPublicPlaylists: () => Promise.resolve({ data: [], error: null }),
  createPlaylist: () => Promise.resolve({ data: null, error: null }),
  addSongToPlaylist: () => Promise.resolve({ data: null, error: null }),
  getPlaylistSongs: () => Promise.resolve({ data: [], error: null }),
  getTrendingAlbums: () => Promise.resolve({ data: [], error: null }),
  getAlbumById: () => Promise.resolve(null),
  getAlbumSongs: () => Promise.resolve({ data: [], error: null }),
  checkEmailAvailability: () =>
    Promise.resolve({ available: true, error: null }),
  checkUsernameAvailability: () =>
    Promise.resolve({ available: true, error: null }),
  recordSongPlay: () => Promise.resolve({ data: null, error: null }),
  getUserListeningHistory: () => Promise.resolve({ data: [], error: null }),
  subscribeToUserActivity: () => ({ unsubscribe: () => {} }),
  subscribeToPlaylistChanges: () => ({ unsubscribe: () => {} }),
};

// Mock types for backwards compatibility
export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  verified: boolean;
  premium: boolean;
  followers_count: number;
  following_count: number;
  created_at: string;
  updated_at: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  url: string;
  cover_url?: string;
  genre?: string;
  release_date?: string;
  play_count: number;
  likes_count: number;
  created_at: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  cover_url?: string;
  is_public: boolean;
  created_by: string;
  song_count: number;
  total_duration: number;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  cover_url?: string;
  release_date?: string;
  genre?: string;
  song_count: number;
  total_duration: number;
  created_at: string;
}

// Mock app export
export default null;
