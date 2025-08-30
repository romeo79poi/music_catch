import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { songApi } from "../lib/api";
import BackendAPI from "../lib/backend";

interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  image: string;
  duration: string;
  isLiked?: boolean;
}

interface MusicContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  currentTime: number;
  duration: number;
  volume: number;
  isShuffle: boolean;
  isRepeat: boolean;
  likedSongs: string[];
  currentIndex: number;
  setCurrentSong: (song: Song) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setQueue: (songs: Song[]) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  nextSong: () => void;
  previousSong: () => void;
  toggleLikeSong: (songId: string) => Promise<void>;
  isSongLiked: (songId: string) => boolean;
  refreshLikedSongs: () => Promise<void>;
  addToQueue: (song: Song) => void;
  playFromQueue: (index: number) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const useMusicContext = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusicContext must be used within a MusicProvider");
  }
  return context;
};

interface MusicProviderProps {
  children: ReactNode;
}

export const MusicProvider: React.FC<MusicProviderProps> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>({
    id: "1",
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    image:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    duration: "3:20",
  });
  const [isPlaying, setIsPlaying] = useState(true);
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentTime, setCurrentTime] = useState(45);
  const [duration, setDuration] = useState(200);
  const [volume, setVolume] = useState(75);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [likedSongs, setLikedSongs] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleShuffle = () => setIsShuffle(!isShuffle);
  const toggleRepeat = () => setIsRepeat(!isRepeat);

  const nextSong = () => {
    if (queue.length > 0) {
      let nextIndex;
      if (isShuffle) {
        nextIndex = Math.floor(Math.random() * queue.length);
      } else {
        nextIndex = (currentIndex + 1) % queue.length;
      }
      setCurrentIndex(nextIndex);
      setCurrentSong(queue[nextIndex]);
      setCurrentTime(0);

      // Track play on backend
      if (queue[nextIndex]) {
        BackendAPI.playTrack(queue[nextIndex].id).catch(console.error);
      }
    }
  };

  const previousSong = () => {
    if (queue.length > 0) {
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : queue.length - 1;
      setCurrentIndex(prevIndex);
      setCurrentSong(queue[prevIndex]);
      setCurrentTime(0);

      // Track play on backend
      if (queue[prevIndex]) {
        BackendAPI.playTrack(queue[prevIndex].id).catch(console.error);
      }
    }
  };

  const addToQueue = (song: Song) => {
    setQueue((prev) => [...prev, song]);
  };

  const playFromQueue = (index: number) => {
    if (queue[index]) {
      setCurrentIndex(index);
      setCurrentSong(queue[index]);
      setCurrentTime(0);
      setIsPlaying(true);

      // Track play on backend
      BackendAPI.playTrack(queue[index].id).catch(console.error);
    }
  };

  const handleSetQueue = (songs: Song[]) => {
    setQueue(songs);
    setCurrentIndex(0);
    if (songs.length > 0) {
      setCurrentSong(songs[0]);
      setCurrentTime(0);
    }
  };

  // Like functionality with backend integration
  const toggleLikeSong = async (songId: string) => {
    try {
      const isCurrentlyLiked = likedSongs.includes(songId);
      let result;

      if (isCurrentlyLiked) {
        result = await BackendAPI.unlikeSong(songId);
      } else {
        result = await BackendAPI.likeSong(songId);
      }

      if (result.success) {
        // Update local state
        if (isCurrentlyLiked) {
          setLikedSongs((prev) => prev.filter((id) => id !== songId));
        } else {
          setLikedSongs((prev) => [...prev, songId]);
        }
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  const isSongLiked = (songId: string): boolean => {
    return likedSongs.includes(songId);
  };

  const refreshLikedSongs = async () => {
    try {
      const result = await BackendAPI.getLikedSongs();
      if (result.success && result.data) {
        const likedSongIds =
          (result.data as any)?.likedSongs?.map((song: any) => song.id || song._id) || [];
        setLikedSongs(likedSongIds);
      }
    } catch (error) {
      console.error("Failed to fetch liked songs:", error);
    }
  };

  // Load liked songs on mount and when authentication changes
  useEffect(() => {
    if (BackendAPI.isAuthenticated()) {
      refreshLikedSongs();
    }
  }, []);

  // Auto-play next song when current song ends
  useEffect(() => {
    if (duration > 0 && currentTime >= duration && isPlaying) {
      if (isRepeat && queue.length === 1) {
        // Repeat single song
        setCurrentTime(0);
      } else if (isRepeat || currentIndex < queue.length - 1) {
        // Play next song
        nextSong();
      } else {
        // End of queue
        setIsPlaying(false);
      }
    }
  }, [currentTime, duration, isPlaying, isRepeat, currentIndex, queue.length]);

  const value: MusicContextType = {
    currentSong,
    isPlaying,
    queue,
    currentTime,
    duration,
    volume,
    isShuffle,
    isRepeat,
    likedSongs,
    currentIndex,
    setCurrentSong,
    setIsPlaying,
    togglePlay,
    setQueue: handleSetQueue,
    setCurrentTime,
    setDuration,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    nextSong,
    previousSong,
    toggleLikeSong,
    isSongLiked,
    refreshLikedSongs,
    addToQueue,
    playFromQueue,
  };

  return (
    <MusicContext.Provider value={value}>{children}</MusicContext.Provider>
  );
};
