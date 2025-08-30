// MusicContext - Supabase integration removed, now using Firebase/Backend
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Mock types for backwards compatibility
interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  url: string;
  cover_url?: string;
  genre?: string;
  play_count: number;
  likes_count: number;
}

interface Playlist {
  id: string;
  name: string;
  description?: string;
  cover_url?: string;
  is_public: boolean;
  created_by: string;
  song_count: number;
  total_duration: number;
}

interface Album {
  id: string;
  title: string;
  artist: string;
  cover_url?: string;
  genre?: string;
  song_count: number;
  total_duration: number;
}

interface MusicContextType {
  // Current playback state
  currentSong: Song | null;
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  progress: number;

  // Music data
  trendingSongs: Song[];
  userPlaylists: Playlist[];
  likedSongs: Song[];
  recentlyPlayed: Song[];

  // Music controls
  playSong: (song: Song) => Promise<void>;
  pauseSong: () => void;
  resumeSong: () => void;
  stopSong: () => void;
  nextSong: () => void;
  previousSong: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;

  // Music data actions
  searchSongs: (query: string) => Promise<Song[]>;
  getTrendingSongs: () => Promise<void>;
  getUserPlaylists: () => Promise<void>;
  createPlaylist: (name: string, description?: string) => Promise<void>;
  addToPlaylist: (playlistId: string, songId: string) => Promise<void>;
  toggleLikeSong: (songId: string) => Promise<void>;

  // Real-time features (disabled)
  isConnected: boolean;
  onlineUsers: number;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Music data state (all empty since Supabase is removed)
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);

  // Mock functions - all Supabase functionality removed
  const playSong = async (song: Song) => {
    console.log("🎵 Play song (Supabase removed):", song.title);
    setCurrentSong(song);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const pauseSong = () => {
    setIsPlaying(false);
    setIsPaused(true);
  };

  const resumeSong = () => {
    setIsPlaying(true);
    setIsPaused(false);
  };

  const stopSong = () => {
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentSong(null);
  };

  const nextSong = () => {
    console.log("🎵 Next song (Supabase removed)");
  };

  const previousSong = () => {
    console.log("🎵 Previous song (Supabase removed)");
  };

  const seekTo = (time: number) => {
    setCurrentTime(time);
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
  };

  const searchSongs = async (query: string): Promise<Song[]> => {
    console.log("🔍 Search songs (Supabase removed):", query);
    return [];
  };

  const getTrendingSongs = async () => {
    console.log("📈 Get trending songs (Supabase removed)");
    setTrendingSongs([]);
  };

  const getUserPlaylists = async () => {
    console.log("📂 Get user playlists (Supabase removed)");
    setUserPlaylists([]);
  };

  const createPlaylist = async (name: string, description?: string) => {
    console.log("➕ Create playlist (Supabase removed):", name);
  };

  const addToPlaylist = async (playlistId: string, songId: string) => {
    console.log("➕ Add to playlist (Supabase removed):", playlistId, songId);
  };

  const toggleLikeSong = async (songId: string) => {
    console.log("❤️ Toggle like song (Supabase removed):", songId);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const value: MusicContextType = {
    // Playback state
    currentSong,
    isPlaying,
    isPaused,
    isLoading,
    volume,
    currentTime,
    duration,
    progress,

    // Music data
    trendingSongs,
    userPlaylists,
    likedSongs,
    recentlyPlayed,

    // Controls
    playSong,
    pauseSong,
    resumeSong,
    stopSong,
    nextSong,
    previousSong,
    seekTo,
    setVolume,

    // Data actions
    searchSongs,
    getTrendingSongs,
    getUserPlaylists,
    createPlaylist,
    addToPlaylist,
    toggleLikeSong,

    // Real-time (disabled)
    isConnected: false,
    onlineUsers: 0,
  };

  return (
    <MusicContext.Provider value={value}>{children}</MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return context;
}
