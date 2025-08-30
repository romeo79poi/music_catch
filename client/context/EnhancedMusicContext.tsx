import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { useToast } from "../hooks/use-toast";
import { fastAudioEngine } from "../lib/fast-audio-engine";

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverImageURL: string;
  duration: number;
  url: string;
  genre?: string;
  year?: number;
  explicit?: boolean;
  likes?: number;
  plays?: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverImageURL?: string;
  songs: Song[];
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Artist {
  id: string;
  name: string;
  imageURL?: string;
  followers: number;
  verified: boolean;
  genres: string[];
}

export interface Album {
  id: string;
  title: string;
  artist: Artist;
  coverImageURL: string;
  releaseDate: Date;
  songs: Song[];
  genre: string;
}

interface AudioState {
  currentSong: Song | null;
  currentPlaylist: Playlist | null;
  currentIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  previousVolume: number;
}

interface PlaybackSettings {
  isShuffle: boolean;
  repeatMode: "off" | "all" | "one";
  crossfade: number;
  autoplay: boolean;
  highQuality: boolean;
}

interface UserPreferences {
  likedSongs: Set<string>;
  recentlyPlayed: Song[];
  followedArtists: Set<string>;
  savedPlaylists: Set<string>;
  playbackHistory: Array<{
    song: Song;
    playedAt: Date;
    duration: number;
  }>;
}

interface EnhancedMusicContextType {
  // Audio state
  audioState: AudioState;
  playbackSettings: PlaybackSettings;
  userPreferences: UserPreferences;

  // Audio controls
  playSong: (song: Song, playlist?: Playlist, index?: number) => void;
  pauseSong: () => void;
  resumeSong: () => void;
  stopSong: () => void;
  nextSong: () => void;
  previousSong: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;

  // Playback settings
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setCrossfade: (seconds: number) => void;
  setAutoplay: (enabled: boolean) => void;
  setHighQuality: (enabled: boolean) => void;

  // Playlist management
  createPlaylist: (name: string, description?: string) => Playlist;
  addToPlaylist: (playlistId: string, song: Song) => void;
  removeFromPlaylist: (playlistId: string, songId: string) => void;
  deletePlaylist: (playlistId: string) => void;

  // User actions
  toggleLikeSong: (songId: string) => void;
  followArtist: (artistId: string) => void;
  unfollowArtist: (artistId: string) => void;
  savePlaylist: (playlistId: string) => void;

  // Search and discovery
  searchSongs: (query: string) => Promise<Song[]>;
  getRecommendations: (seedSong?: Song) => Promise<Song[]>;
  getTrendingSongs: () => Promise<Song[]>;
  getNewReleases: () => Promise<Album[]>;

  // Data
  playlists: Playlist[];
  artists: Artist[];
  albums: Album[];
  trendingSongs: Song[];

  // Loading states
  isSearching: boolean;
  isLoadingRecommendations: boolean;
  isLoadingTrending: boolean;
}

const EnhancedMusicContext = createContext<
  EnhancedMusicContextType | undefined
>(undefined);

// Sample data
const sampleSongs: Song[] = [
  {
    id: "1",
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    coverImageURL:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    duration: 200,
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    genre: "Synthwave",
    year: 2020,
    explicit: false,
    likes: 1200000,
    plays: 89000000,
  },
  {
    id: "2",
    title: "Watermelon Sugar",
    artist: "Harry Styles",
    album: "Fine Line",
    coverImageURL:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    duration: 174,
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    genre: "Pop",
    year: 2020,
    explicit: false,
    likes: 890000,
    plays: 67000000,
  },
  {
    id: "3",
    title: "Levitating",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    coverImageURL:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    duration: 203,
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    genre: "Pop",
    year: 2020,
    explicit: false,
    likes: 750000,
    plays: 45000000,
  },
  {
    id: "4",
    title: "Good 4 U",
    artist: "Olivia Rodrigo",
    album: "Sour",
    coverImageURL:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=400&fit=crop",
    duration: 178,
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    genre: "Pop Rock",
    year: 2021,
    explicit: false,
    likes: 920000,
    plays: 78000000,
  },
  {
    id: "5",
    title: "Stay",
    artist: "The Kid LAROI, Justin Bieber",
    album: "F*ck Love 3",
    coverImageURL:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
    duration: 141,
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    genre: "Pop",
    year: 2021,
    explicit: true,
    likes: 680000,
    plays: 56000000,
  },
];

const samplePlaylists: Playlist[] = [
  {
    id: "1",
    name: "My Favorites",
    description: "All my favorite songs in one place",
    coverImageURL:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    songs: sampleSongs.slice(0, 3),
    isPublic: false,
    createdBy: "user123",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Workout Hits",
    description: "High energy songs for working out",
    coverImageURL:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
    songs: sampleSongs.slice(2, 5),
    isPublic: true,
    createdBy: "user123",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export function EnhancedMusicProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);

  // Audio state
  const [audioState, setAudioState] = useState<AudioState>({
    currentSong: null,
    currentPlaylist: null,
    currentIndex: 0,
    isPlaying: false,
    isPaused: false,
    isLoading: false,
    duration: 0,
    currentTime: 0,
    volume: 0.7,
    isMuted: false,
    previousVolume: 0.7,
  });

  // Playback settings
  const [playbackSettings, setPlaybackSettings] = useState<PlaybackSettings>({
    isShuffle: false,
    repeatMode: "off",
    crossfade: 0,
    autoplay: true,
    highQuality: false,
  });

  // User preferences
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    likedSongs: new Set(),
    recentlyPlayed: [],
    followedArtists: new Set(),
    savedPlaylists: new Set(),
    playbackHistory: [],
  });

  // Data
  const [playlists] = useState<Playlist[]>(samplePlaylists);
  const [artists] = useState<Artist[]>([]);
  const [albums] = useState<Album[]>([]);
  const [trendingSongs] = useState<Song[]>(sampleSongs);

  // Loading states
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] =
    useState(false);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);

  // Audio element setup with C++ fast engine
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    // Initialize fast C++ audio engine
    fastAudioEngine
      .initialize()
      .then(() => {
        console.log("Fast C++ audio engine initialized successfully");
      })
      .catch((error) => {
        console.warn(
          "Fast audio engine failed to initialize, using fallback:",
          error,
        );
      });

    const handleTimeUpdate = () => {
      setAudioState((prev) => ({ ...prev, currentTime: audio.currentTime }));
    };

    const handleDurationChange = () => {
      setAudioState((prev) => ({ ...prev, duration: audio.duration }));
    };

    const handleLoadStart = () => {
      setAudioState((prev) => ({ ...prev, isLoading: true }));
    };

    const handleLoadedData = () => {
      setAudioState((prev) => ({ ...prev, isLoading: false }));
    };

    const handleEnded = () => {
      if (playbackSettings.repeatMode === "one") {
        audio.currentTime = 0;
        audio.play();
      } else {
        nextSong();
      }
    };

    const handleError = () => {
      toast({
        title: "Playback Error",
        description: "Failed to load the audio track",
        variant: "destructive",
      });
      setAudioState((prev) => ({
        ...prev,
        isLoading: false,
        isPlaying: false,
      }));
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("loadeddata", handleLoadedData);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("loadeddata", handleLoadedData);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.pause();
    };
  }, [playbackSettings.repeatMode, toast]);

  // Volume control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioState.isMuted ? 0 : audioState.volume;
    }
  }, [audioState.volume, audioState.isMuted]);

  // Audio controls
  const playSong = (song: Song, playlist?: Playlist, index?: number) => {
    if (!audioRef.current) return;

    // Add to recently played
    setUserPreferences((prev) => ({
      ...prev,
      recentlyPlayed: [
        song,
        ...prev.recentlyPlayed.filter((s) => s.id !== song.id),
      ].slice(0, 50),
    }));

    // Update audio state
    setAudioState((prev) => ({
      ...prev,
      currentSong: song,
      currentPlaylist: playlist || prev.currentPlaylist,
      currentIndex: index !== undefined ? index : prev.currentIndex,
      isPlaying: true,
      isPaused: false,
    }));

    // Load and play the song
    audioRef.current.src = song.url;
    audioRef.current.load();
    audioRef.current.play().catch(() => {
      toast({
        title: "Playback Failed",
        description: "Unable to play this track",
        variant: "destructive",
      });
    });

    toast({
      title: "Now Playing",
      description: `${song.title} by ${song.artist}`,
    });
  };

  const pauseSong = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setAudioState((prev) => ({ ...prev, isPlaying: false, isPaused: true }));
    }
  };

  const resumeSong = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setAudioState((prev) => ({ ...prev, isPlaying: true, isPaused: false }));
    }
  };

  const stopSong = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioState((prev) => ({
        ...prev,
        isPlaying: false,
        isPaused: false,
        currentTime: 0,
      }));
    }
  };

  const nextSong = () => {
    const { currentPlaylist, currentIndex } = audioState;
    if (!currentPlaylist || !currentPlaylist.songs.length) return;

    let nextIndex;
    if (playbackSettings.isShuffle) {
      nextIndex = Math.floor(Math.random() * currentPlaylist.songs.length);
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= currentPlaylist.songs.length) {
        if (playbackSettings.repeatMode === "all") {
          nextIndex = 0;
        } else {
          stopSong();
          return;
        }
      }
    }

    const nextSongItem = currentPlaylist.songs[nextIndex];
    if (nextSongItem) {
      playSong(nextSongItem, currentPlaylist, nextIndex);
    }
  };

  const previousSong = () => {
    if (audioState.currentTime > 5) {
      // If more than 5 seconds in, restart current song
      seekTo(0);
      return;
    }

    const { currentPlaylist, currentIndex } = audioState;
    if (!currentPlaylist || !currentPlaylist.songs.length) return;

    let prevIndex;
    if (playbackSettings.isShuffle) {
      prevIndex = Math.floor(Math.random() * currentPlaylist.songs.length);
    } else {
      prevIndex = currentIndex - 1;
      if (prevIndex < 0) {
        if (playbackSettings.repeatMode === "all") {
          prevIndex = currentPlaylist.songs.length - 1;
        } else {
          return;
        }
      }
    }

    const prevSongItem = currentPlaylist.songs[prevIndex];
    if (prevSongItem) {
      playSong(prevSongItem, currentPlaylist, prevIndex);
    }
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setAudioState((prev) => ({ ...prev, currentTime: time }));
    }
  };

  const setVolume = (volume: number) => {
    setAudioState((prev) => ({
      ...prev,
      volume,
      isMuted: volume === 0,
      previousVolume: volume > 0 ? volume : prev.previousVolume,
    }));

    // Apply volume to fast C++ engine
    fastAudioEngine.setVolume(volume);
  };

  const toggleMute = () => {
    setAudioState((prev) => ({
      ...prev,
      isMuted: !prev.isMuted,
      volume: prev.isMuted ? prev.previousVolume : prev.volume,
    }));

    // Apply mute to fast C++ engine
    const newMuted = !audioState.isMuted;
    fastAudioEngine.setMuted(newMuted);
    if (!newMuted) {
      fastAudioEngine.setVolume(audioState.previousVolume);
    }
  };

  // Playback settings
  const toggleShuffle = () => {
    setPlaybackSettings((prev) => ({ ...prev, isShuffle: !prev.isShuffle }));
    toast({
      title: playbackSettings.isShuffle
        ? "Shuffle disabled"
        : "Shuffle enabled",
      description: playbackSettings.isShuffle
        ? "Playing in order"
        : "Playing randomly",
    });
  };

  const toggleRepeat = () => {
    const modes: ("off" | "all" | "one")[] = ["off", "all", "one"];
    const currentIndex = modes.indexOf(playbackSettings.repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];

    setPlaybackSettings((prev) => ({ ...prev, repeatMode: nextMode }));

    toast({
      title: `Repeat ${nextMode === "off" ? "disabled" : nextMode === "all" ? "playlist" : "track"}`,
      description:
        nextMode === "off"
          ? "Repeat turned off"
          : nextMode === "all"
            ? "Repeating playlist"
            : "Repeating current track",
    });
  };

  const setCrossfade = (seconds: number) => {
    setPlaybackSettings((prev) => ({ ...prev, crossfade: seconds }));
  };

  const setAutoplay = (enabled: boolean) => {
    setPlaybackSettings((prev) => ({ ...prev, autoplay: enabled }));
  };

  const setHighQuality = (enabled: boolean) => {
    setPlaybackSettings((prev) => ({ ...prev, highQuality: enabled }));
  };

  // Playlist management
  const createPlaylist = (name: string, description?: string): Playlist => {
    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}`,
      name,
      description,
      songs: [],
      isPublic: false,
      createdBy: "user123",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    toast({
      title: "Playlist Created",
      description: `"${name}" has been created`,
    });

    return newPlaylist;
  };

  const addToPlaylist = (playlistId: string, song: Song) => {
    // This would update the playlist in a real app
    toast({
      title: "Added to Playlist",
      description: `"${song.title}" added to playlist`,
    });
  };

  const removeFromPlaylist = (playlistId: string, songId: string) => {
    // This would remove the song from the playlist in a real app
    toast({
      title: "Removed from Playlist",
      description: "Song removed from playlist",
    });
  };

  const deletePlaylist = (playlistId: string) => {
    // This would delete the playlist in a real app
    toast({
      title: "Playlist Deleted",
      description: "Playlist has been deleted",
    });
  };

  // User actions
  const toggleLikeSong = (songId: string) => {
    setUserPreferences((prev) => {
      const newLikedSongs = new Set(prev.likedSongs);
      if (newLikedSongs.has(songId)) {
        newLikedSongs.delete(songId);
        toast({
          title: "Removed from Liked Songs",
          description: "Song removed from your liked songs",
        });
      } else {
        newLikedSongs.add(songId);
        toast({
          title: "Added to Liked Songs",
          description: "Song added to your liked songs",
        });
      }
      return { ...prev, likedSongs: newLikedSongs };
    });
  };

  const followArtist = (artistId: string) => {
    setUserPreferences((prev) => ({
      ...prev,
      followedArtists: new Set([...prev.followedArtists, artistId]),
    }));
  };

  const unfollowArtist = (artistId: string) => {
    setUserPreferences((prev) => {
      const newFollowedArtists = new Set(prev.followedArtists);
      newFollowedArtists.delete(artistId);
      return { ...prev, followedArtists: newFollowedArtists };
    });
  };

  const savePlaylist = (playlistId: string) => {
    setUserPreferences((prev) => ({
      ...prev,
      savedPlaylists: new Set([...prev.savedPlaylists, playlistId]),
    }));
  };

  // Search and discovery
  const searchSongs = async (query: string): Promise<Song[]> => {
    setIsSearching(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      const results = sampleSongs.filter(
        (song) =>
          song.title.toLowerCase().includes(query.toLowerCase()) ||
          song.artist.toLowerCase().includes(query.toLowerCase()),
      );
      return results;
    } finally {
      setIsSearching(false);
    }
  };

  const getRecommendations = async (seedSong?: Song): Promise<Song[]> => {
    setIsLoadingRecommendations(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return sampleSongs.slice(0, 5);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const getTrendingSongs = async (): Promise<Song[]> => {
    setIsLoadingTrending(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      return sampleSongs;
    } finally {
      setIsLoadingTrending(false);
    }
  };

  const getNewReleases = async (): Promise<Album[]> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    return [];
  };

  const value: EnhancedMusicContextType = {
    // Audio state
    audioState,
    playbackSettings,
    userPreferences,

    // Audio controls
    playSong,
    pauseSong,
    resumeSong,
    stopSong,
    nextSong,
    previousSong,
    seekTo,
    setVolume,
    toggleMute,

    // Playback settings
    toggleShuffle,
    toggleRepeat,
    setCrossfade,
    setAutoplay,
    setHighQuality,

    // Playlist management
    createPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    deletePlaylist,

    // User actions
    toggleLikeSong,
    followArtist,
    unfollowArtist,
    savePlaylist,

    // Search and discovery
    searchSongs,
    getRecommendations,
    getTrendingSongs,
    getNewReleases,

    // Data
    playlists,
    artists,
    albums,
    trendingSongs,

    // Loading states
    isSearching,
    isLoadingRecommendations,
    isLoadingTrending,
  };

  return (
    <EnhancedMusicContext.Provider value={value}>
      {children}
    </EnhancedMusicContext.Provider>
  );
}

export function useEnhancedMusic() {
  const context = useContext(EnhancedMusicContext);
  if (context === undefined) {
    throw new Error(
      "useEnhancedMusic must be used within an EnhancedMusicProvider",
    );
  }
  return context;
}
