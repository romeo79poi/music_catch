import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Play,
  Pause,
  MoreVertical,
  Shuffle,
  Download,
  Share,
  Music,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProfileContext } from "../context/ProfileContext";
import { useEnhancedMusic } from "../context/EnhancedMusicContext";
import { songApi } from "../lib/api";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import LikeButton from "../components/LikeButton";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/use-toast";

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  image: string;
  likedAt: string;
}

export default function LikedSongs() {
  const navigate = useNavigate();
  const { profile, toggleLikedSong } = useProfileContext();
  const { currentSong, isPlaying, playSong, pauseSong, resumeSong } = useEnhancedMusic();

  const setCurrentSong = (song: any) => {
    playSong(song);
  };

  const togglePlay = () => {
    if (isPlaying) {
      pauseSong();
    } else {
      resumeSong();
    }
  };
  const { user: authUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (authUser) {
        loadLikedSongs();
      } else {
        navigate("/login");
      }
    }
  }, [firebaseUser, firebaseLoading]);

  const loadLikedSongs = async () => {
    try {
      setIsLoading(true);
      const data = await songApi.getLikedSongs();

      if (data.success) {
        setLikedSongs(data.likedSongs || []);
      } else {
        // Fallback to mock data
        setLikedSongs(mockLikedSongs);
      }
    } catch (error) {
      console.error("Failed to load liked songs:", error);
      setLikedSongs(mockLikedSongs);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock liked songs data as fallback
  const mockLikedSongs: Song[] = [
    {
      id: "1",
      title: "Blinding Lights",
      artist: "The Weeknd",
      album: "After Hours",
      duration: "3:20",
      image:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
      likedAt: "2024-01-15",
    },
    {
      id: "2",
      title: "Levitating",
      artist: "Dua Lipa",
      album: "Future Nostalgia",
      duration: "3:23",
      image:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
      likedAt: "2024-01-14",
    },
    {
      id: "3",
      title: "Good 4 U",
      artist: "Olivia Rodrigo",
      album: "SOUR",
      duration: "2:58",
      image:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
      likedAt: "2024-01-13",
    },
    {
      id: "4",
      title: "Stay",
      artist: "The Kid LAROI, Justin Bieber",
      album: "Stay",
      duration: "2:21",
      image:
        "https://images.unsplash.com/photo-1520637836862-4d197d17c90a?w=400&h=400&fit=crop",
      likedAt: "2024-01-12",
    },
    {
      id: "5",
      title: "Industry Baby",
      artist: "Lil Nas X, Jack Harlow",
      album: "MONTERO",
      duration: "3:32",
      image:
        "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop",
      likedAt: "2024-01-11",
    },
  ];

  const filteredSongs = likedSongs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.album.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handlePlaySong = (song: Song) => {
    const musicSong = {
      id: parseInt(song.id),
      title: song.title,
      artist: song.artist,
      album: song.album,
      image: song.image,
      duration: song.duration,
    };

    if (currentSong?.id === parseInt(song.id)) {
      togglePlay();
    } else {
      setCurrentSong(musicSong);
    }
  };

  const handleUnlikeSong = async (songId: string) => {
    try {
      await toggleLikedSong(songId);
      // Remove from local state
      setLikedSongs((prev) => prev.filter((song) => song.id !== songId));
    } catch (error) {
      console.error("Failed to unlike song:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-black">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-6 pt-12"
        >
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Liked Songs</h1>
          <div className="w-10" />
        </motion.div>

        {/* Header Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="px-6 mb-6"
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-lg flex items-center justify-center">
              <Heart className="w-8 h-8 text-white fill-current" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Liked Songs</h2>
              <p className="text-gray-400">{filteredSongs.length} songs</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Button className="bg-gradient-to-r from-neon-green to-neon-blue text-black font-semibold flex-1">
              <Shuffle className="w-4 h-4 mr-2" />
              Shuffle Play
            </Button>
            <Button variant="outline" className="border-white/20 text-white">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="border-white/20 text-white">
              <Share className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-6 mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border-white/10 text-white pl-12"
              placeholder="Search in liked songs..."
            />
          </div>
        </motion.div>

        {/* Songs List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="px-6 space-y-2"
        >
          {filteredSongs.length === 0 ? (
            <div className="text-center py-12">
              <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                {searchQuery ? "No songs found" : "No liked songs yet"}
              </h3>
              <p className="text-gray-500">
                {searchQuery
                  ? "Try searching with different keywords"
                  : "Start liking songs to see them here"}
              </p>
            </div>
          ) : (
            filteredSongs.map((song, index) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center p-3 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all group"
              >
                {/* Song Info */}
                <div className="flex items-center flex-1 space-x-3">
                  <div className="relative">
                    <img
                      src={song.image}
                      alt={song.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <button
                      onClick={() => handlePlaySong(song)}
                      className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {currentSong?.id === parseInt(song.id) && isPlaying ? (
                        <Pause className="w-5 h-5 text-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white" />
                      )}
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white truncate">
                      {song.title}
                    </h4>
                    <p className="text-sm text-gray-400 truncate">
                      {song.artist} • {song.album}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-400">
                    {formatDate(song.likedAt)}
                  </span>
                  <span className="text-sm text-gray-400">{song.duration}</span>
                  <LikeButton
                    songId={song.id}
                    size="sm"
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                  />
                  <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100">
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Bottom Spacing */}
        <div className="h-24" />
      </div>
    </div>
  );
}
