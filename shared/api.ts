/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */


/**
 * Profile API Types
 */
export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  profilePicture: string;
  email: string;
  joinDate: string;
  isVerified: boolean;
  followers: number;
  following: number;
  likedSongs: string[];
  recentlyPlayed: string[];
  playlists: Playlist[];
  musicPreferences: MusicPreferences;
  socialLinks: SocialLinks;
  subscription: SubscriptionInfo;
  settings: UserSettings;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  songs: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  totalDuration: number;
}

export interface MusicPreferences {
  favoriteGenres: string[];
  favoriteArtists: string[];
  mood: string;
  language: string[];
  autoPlay: boolean;
  crossfade: boolean;
  soundQuality: "low" | "medium" | "high" | "lossless";
}

export interface SocialLinks {
  twitter?: string;
  youtube?: string;
  website?: string;
  musicPlatform?: string;
  socialPlatform?: string;
}

export interface SubscriptionInfo {
  plan: "free" | "premium" | "family";
  status: "active" | "cancelled" | "expired";
  startDate: string;
  endDate?: string;
  features: string[];
  autoRenew: boolean;
}

export interface UserSettings {
  theme: "light" | "dark" | "auto";
  language: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  playback: PlaybackSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  newFollowers: boolean;
  newMusic: boolean;
  recommendations: boolean;
  socialActivity: boolean;
}

export interface PrivacySettings {
  profileVisibility: "public" | "friends" | "private";
  showRecentlyPlayed: boolean;
  showLikedSongs: boolean;
  showPlaylists: boolean;
  allowFollowers: boolean;
}

export interface PlaybackSettings {
  volume: number;
  shuffle: boolean;
  repeat: "off" | "one" | "all";
  gaplessPlayback: boolean;
  normalization: boolean;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverImage: string;
  previewUrl?: string;
  genre: string;
  releaseDate: string;
  isLiked: boolean;
}

export interface FollowUser {
  id: string;
  username: string;
  displayName: string;
  profilePicture: string;
  isVerified: boolean;
  mutualFollowers: number;
}

// API Request/Response Types
export interface ProfileUpdateRequest {
  displayName?: string;
  bio?: string;
  profilePicture?: string;
  socialLinks?: Partial<SocialLinks>;
  musicPreferences?: Partial<MusicPreferences>;
  settings?: Partial<UserSettings>;
}

export interface ProfileResponse {
  profile: UserProfile;
  success: boolean;
  message?: string;
}

export interface PlaylistCreateRequest {
  name: string;
  description?: string;
  isPublic: boolean;
  coverImage?: string;
}

export interface PlaylistUpdateRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
  coverImage?: string;
  songs?: string[];
}

export interface PlaylistResponse {
  playlist: Playlist;
  success: boolean;
  message?: string;
}

export interface FollowResponse {
  isFollowing: boolean;
  followersCount: number;
  success: boolean;
  message?: string;
}

export interface LikedSongsResponse {
  songs: Song[];
  total: number;
  page: number;
  limit: number;
  success: boolean;
}

export interface RecentlyPlayedResponse {
  songs: Array<Song & { playedAt: string }>;
  success: boolean;
}

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  success: boolean;
  message?: string;
}

export interface SearchUsersResponse {
  users: FollowUser[];
  total: number;
  page: number;
  limit: number;
  success: boolean;
}

export interface SubscriptionUpdateRequest {
  plan: "free" | "premium" | "family";
  autoRenew?: boolean;
}

export interface SubscriptionResponse {
  subscription: SubscriptionInfo;
  success: boolean;
  message?: string;
}

// Error Response Type
export interface ApiError {
  success: false;
  message: string;
  code?: string;
  details?: any;
}

// Song Search Response Types
export interface SongSearchResponse {
  results: Song[];
  total: number;
  query: string;
  success: boolean;
}

export interface MusicSearchResponse {
  songs?: Song[];
  artists?: Artist[];
  playlists?: Playlist[];
  total: number;
  query: string;
  success: boolean;
}

export interface Artist {
  id: string;
  name: string;
  image: string;
  followers?: number;
  verified?: boolean;
  genre?: string;
}

// Success Response Type
export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  message?: string;
}
