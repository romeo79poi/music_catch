import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  MoreHorizontal,
  Play,
  Plus,
  Heart,
  Download,
  Clock,
  Music,
  ListMusic,
  User,
  Home,
  Library as LibraryIcon,
  Loader2,
  Trash2,
  Edit,
  Pause,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import MobileFooter from "../components/MobileFooter";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useMusic } from "../context/MusicContextSupabase";
import { useFirebase } from "../context/FirebaseContext";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  album_title?: string;
  duration: number;
  cover_image_url: string;
  genre?: string;
  play_count?: number;
}

interface Playlist {
  id: string;
  name: string;
  description?: string;
  cover_image_url?: string;
  is_public: boolean;
  track_count: number;
  created_at: string;
}

export default function Library() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: firebaseUser, loading: firebaseLoading } = useFirebase();

  const [activeTab, setActiveTab] = useState("Recently Added");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [likedSongs, setLikedSongs] = useState<Track[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSong, setCurrentSong] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const tabs = [
    "Recently Added",
    "Recently Played",
    "Playlists",
    "Liked Songs",
  ];

  useEffect(() => {
    if (!firebaseLoading) {
      checkAuthAndLoadData();
    }
  }, [firebaseUser, firebaseLoading]);

  const checkAuthAndLoadData = async () => {
    try {
      setIsLoading(true);

      // Check Firebase authentication
      if (!firebaseUser) {
        console.log("❌ No Firebase user found");
        navigate("/login");
        return;
      }

      console.log("🔥 Loading library for Firebase user:", firebaseUser.email);
      setCurrentUser({
        id: firebaseUser.uid,
        name: firebaseUser.displayName || "User",
        email: firebaseUser.email,
        avatar: firebaseUser.photoURL,
      });

      await loadLibraryData();
    } catch (error) {
      console.error("❌ Auth check error:", error);
      navigate("/login");
    } finally {
      setIsLoading(false);
    }
  };

  const loadLibraryData = async () => {
    try {
      if (!firebaseUser) return;

      console.log(
        "🔥 Loading library data for Firebase user:",
        firebaseUser.uid,
      );

      // Load playlists with Firebase user ID
      try {
        const playlistsResponse = await fetch(
          `/api/v1/users/${firebaseUser.uid}/playlists`,
          {
            headers: {
              "user-id": firebaseUser.uid,
              "Content-Type": "application/json",
            },
          },
        );
        if (playlistsResponse.ok) {
          const playlistsData = await playlistsResponse.json();
          setUserPlaylists(playlistsData.playlists || []);
          console.log(
            "✅ Loaded playlists from backend:",
            playlistsData.playlists?.length || 0,
          );
        }
      } catch (error) {
        console.error("⚠️ Error loading playlists:", error);
        // Set mock playlists as fallback
        setUserPlaylists([
          {
            id: "mock-1",
            name: "My Favorites",
            description: "Firebase user's favorite tracks",
            cover_image_url:
              "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop",
            is_public: false,
            track_count: 15,
            created_at: new Date().toISOString(),
          },
        ]);
      }

      // Load liked songs with Firebase user ID
      try {
        const likedResponse = await fetch(
          `/api/v1/users/${firebaseUser.uid}/liked-tracks`,
          {
            headers: {
              "user-id": firebaseUser.uid,
              "Content-Type": "application/json",
            },
          },
        );
        if (likedResponse.ok) {
          const likedData = await likedResponse.json();
          setLikedSongs(likedData.liked_tracks || []);
          console.log(
            "✅ Loaded liked songs from backend:",
            likedData.liked_tracks?.length || 0,
          );
        }
      } catch (error) {
        console.error("⚠️ Error loading liked songs:", error);
        // Set mock liked songs as fallback
        setLikedSongs([
          {
            id: "mock-like-1",
            title: "Midnight Dreams",
            artist_name: "Alex Johnson",
            duration: 234,
            cover_image_url:
              "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop",
            genre: "Electronic",
            play_count: 1240,
          },
        ]);
      }

      // Load recently played with Firebase user ID
      try {
        const historyResponse = await fetch(
          `/api/v1/users/${firebaseUser.uid}/play-history?limit=20`,
          {
            headers: {
              "user-id": firebaseUser.uid,
              "Content-Type": "application/json",
            },
          },
        );
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setRecentlyPlayed(historyData.play_history || []);
          console.log(
            "✅ Loaded play history from backend:",
            historyData.play_history?.length || 0,
          );
        }
      } catch (error) {
        console.error("⚠️ Error loading play history:", error);
        // Set mock recent plays as fallback
        setRecentlyPlayed([
          {
            id: "mock-recent-1",
            title: "Summer Vibes",
            artist_name: "Beach Boys Redux",
            duration: 198,
            cover_image_url:
              "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
            genre: "Pop",
            play_count: 890,
          },
        ]);
      }

      // Load recently added songs (trending tracks as fallback)
      try {
        const tracksResponse = await fetch(
          "/api/v1/tracks?sort_by=created_at&limit=20",
        );
        if (tracksResponse.ok) {
          const tracksData = await tracksResponse.json();
          setRecentlyAdded(tracksData.tracks || []);
        }
      } catch (error) {
        console.error("Error loading recent tracks:", error);
      }
    } catch (error) {
      console.error("Failed to load library data:", error);
      toast({
        title: "Error",
        description: "Failed to load library data",
        variant: "destructive",
      });
    }
  };

  const handlePlaySong = async (song: Track) => {
    try {
      if (currentSong?.id === song.id) {
        setIsPlaying(!isPlaying);
      } else {
        setCurrentSong(song);
        setIsPlaying(true);

        // Add to listening history
        if (currentUser) {
          const token = localStorage.getItem("token");
          if (token) {
            await fetch("/api/v1/users/play-history", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ track_id: song.id }),
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to play song:", error);
      // Still allow playback even if history fails
      if (currentSong?.id === song.id) {
        setIsPlaying(!isPlaying);
      } else {
        setCurrentSong(song);
        setIsPlaying(true);
      }
    }
  };

  const createNewPlaylist = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to create playlists",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please log in to create playlists",
          variant: "destructive",
        });
        return;
      }

      const playlistName = `My Playlist #${userPlaylists.length + 1}`;
      const response = await fetch("/api/v1/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: playlistName,
          description: "A new playlist",
          is_public: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserPlaylists([...userPlaylists, data.playlist]);
        toast({
          title: "Playlist Created",
          description: `${playlistName} has been created`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to create playlist",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to create playlist:", error);
      toast({
        title: "Error",
        description: "Failed to create playlist",
        variant: "destructive",
      });
    }
  };

  const handleToggleLike = async (trackId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    if (!currentUser) {
      toast({
        title: "Login required",
        description: "Please log in to like songs",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Login required",
          description: "Please log in to like songs",
          variant: "destructive",
        });
        return;
      }

      const isCurrentlyLiked = likedSongs.some((song) => song.id === trackId);
      const method = isCurrentlyLiked ? "DELETE" : "POST";

      const response = await fetch(`/api/v1/users/liked-tracks/${trackId}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Update local state
        if (isCurrentlyLiked) {
          setLikedSongs((prev) => prev.filter((song) => song.id !== trackId));
        } else {
          const song = recentlyAdded.find((s) => s.id === trackId);
          if (song) {
            setLikedSongs((prev) => [...prev, song]);
          }
        }

        toast({
          title: isCurrentlyLiked
            ? "Removed from liked songs"
            : "Added to liked songs",
          description: isCurrentlyLiked
            ? "Song removed from your favorites"
            : "Song added to your favorites",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update like status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-primary animate-spin" />
          <span className="ml-2 text-gray-400">Loading your library...</span>
        </div>
      );
    }

    switch (activeTab) {
      case "Recently Added":
        return (
          <div className="space-y-2">
            {recentlyAdded.map((song) => (
              <div
                key={song.id}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-all group cursor-pointer"
                onClick={() => handlePlaySong(song)}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={song.cover_image_url}
                    alt={song.title}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlaySong(song);
                    }}
                    className="absolute inset-0 bg-black/60 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {currentSong?.id === song.id && isPlaying ? (
                      <Pause className="w-4 h-4 text-white" />
                    ) : (
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    )}
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate text-white">
                    {song.title}
                  </h3>
                  <p className="text-gray-400 text-xs truncate">
                    {song.artist_name} {song.genre && `• ${song.genre}`}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-xs">
                    {formatDuration(song.duration)}
                  </span>
                  <button
                    onClick={(e) => handleToggleLike(song.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Heart
                      className={`w-4 h-4 ${likedSongs.some((liked) => liked.id === song.id) ? "text-red-500 fill-current" : "text-gray-400"}`}
                    />
                  </button>
                  <MoreHorizontal className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        );

      case "Recently Played":
        return (
          <div className="space-y-2">
            {recentlyPlayed.map((song) => (
              <div
                key={song.id}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-all group cursor-pointer"
                onClick={() => handlePlaySong(song)}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={song.cover_image_url}
                    alt={song.title}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <button className="absolute inset-0 bg-black/60 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {currentSong?.id === song.id && isPlaying ? (
                      <Pause className="w-4 h-4 text-white" />
                    ) : (
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    )}
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate text-white">
                    {song.title}
                  </h3>
                  <p className="text-gray-400 text-xs truncate">
                    {song.artist_name}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-xs">
                    {formatDuration(song.duration)}
                  </span>
                  <MoreHorizontal className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        );

      case "Playlists":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userPlaylists.map((playlist) => (
              <div
                key={playlist.id}
                className="group bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={
                        playlist.cover_image_url ||
                        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop"
                      }
                      alt={playlist.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <button className="absolute bottom-1 right-1 w-8 h-8 bg-purple-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 transition-all">
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{playlist.name}</h3>
                    <p className="text-gray-400 text-sm">
                      {playlist.is_public ? "Public" : "Private"} •{" "}
                      {playlist.track_count || 0} songs
                    </p>
                  </div>
                  <MoreHorizontal className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        );

      case "Liked Songs":
        return (
          <div className="space-y-2">
            {likedSongs.map((song) => (
              <div
                key={song.id}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-all group cursor-pointer"
                onClick={() => handlePlaySong(song)}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={song.cover_image_url}
                    alt={song.title}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <button className="absolute inset-0 bg-black/60 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {currentSong?.id === song.id && isPlaying ? (
                      <Pause className="w-4 h-4 text-white" />
                    ) : (
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    )}
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate text-white">
                    {song.title}
                  </h3>
                  <p className="text-gray-400 text-xs truncate">
                    {song.artist_name} {song.genre && `• ${song.genre}`}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-red-500 fill-current" />
                  <span className="text-gray-400 text-xs">
                    {formatDuration(song.duration)}
                  </span>
                  <MoreHorizontal className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-darker via-background to-purple-dark text-white">
      {/* Background Glow Effects */}
      <div className="fixed inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-secondary/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 md:p-6 bg-black/60 backdrop-blur-sm sticky top-0 z-20"
        >
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold">Your Library</h1>
            {firebaseUser && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-orange-500/10 rounded-full">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-xs text-orange-500 font-medium">
                  Firebase
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={() => navigate("/search")}>
              <Search className="w-6 h-6 text-gray-400" />
            </button>
            <button
              onClick={createNewPlaylist}
              className="w-6 h-6 text-gray-400 hover:text-purple-primary transition-colors"
              title="Create New Playlist"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </motion.div>

        {/* Quick Access */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="px-4 md:px-6 mb-6"
        >
          <div className="flex space-x-4 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab("Liked Songs")}
              className="flex items-center space-x-2 bg-purple-primary/20 border border-purple-primary/30 rounded-full px-4 py-2 whitespace-nowrap"
            >
              <Heart className="w-4 h-4 text-purple-primary" />
              <span className="text-sm">Liked Songs</span>
            </button>
            <button
              onClick={() => setActiveTab("Recently Played")}
              className="flex items-center space-x-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 whitespace-nowrap"
            >
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm">Recently Played</span>
            </button>
          </div>
        </motion.div>

        {/* Quick Actions Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-4 md:px-6 mb-8"
        >
          <h2 className="text-xl font-bold mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveTab("Liked Songs")}
              className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-lg flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white fill-current" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-white">Liked Songs</h3>
                  <p className="text-gray-400 text-sm">
                    {likedSongs.length} songs
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("Recently Played")}
              className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-white">Recently Played</h3>
                  <p className="text-gray-400 text-sm">
                    {recentlyPlayed.length} tracks
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={createNewPlaylist}
              className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-primary to-purple-secondary rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-white">Create Playlist</h3>
                  <p className="text-gray-400 text-sm">Make a new playlist</p>
                </div>
              </div>
            </button>
          </div>
        </motion.section>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="px-4 md:px-6 mb-4"
        >
          <div className="flex space-x-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-sm font-medium whitespace-nowrap pb-2 border-b-2 transition-colors ${
                  activeTab === tab
                    ? "text-white border-purple-primary"
                    : "text-gray-400 border-transparent hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex-1 px-4 md:px-6 pb-24"
        >
          {renderTabContent()}
        </motion.div>

        {/* Mobile Footer */}
        <MobileFooter />
      </div>
    </div>
  );
}
