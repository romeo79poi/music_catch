import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Play,
  Pause,
  Heart,
  MoreHorizontal,
  Edit3,
  Trash2,
  Share,
  Download,
  Search,
  Music,
  Clock,
  Users,
  Lock,
  Globe,
  Camera,
  X,
  Check,
  Shuffle,
  SkipForward,
  Volume2,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import MobileFooter from "../components/MobileFooter";
import { useFirebase } from "../context/FirebaseContext";

interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  coverImageURL: string;
  liked?: boolean;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  coverImageURL: string;
  isPublic: boolean;
  songs: Song[];
  createdAt: string;
  totalDuration: number;
  followers?: number;
  isOwner: boolean;
}

export default function Playlists() {
  const navigate = useNavigate();
  const { playlistId } = useParams();
  const { toast } = useToast();
  const { user: firebaseUser, loading: firebaseLoading } = useFirebase();

  // Sample playlists data
  const [playlists, setPlaylists] = useState<Playlist[]>([
    {
      id: "1",
      name: "My Favorites",
      description: "Songs I love to listen to",
      coverImageURL:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
      isPublic: true,
      songs: [
        {
          id: "1",
          title: "Blinding Lights",
          artist: "The Weeknd",
          album: "After Hours",
          duration: 200,
          coverImageURL:
            "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=80&h=80&fit=crop",
          liked: true,
        },
        {
          id: "2",
          title: "Watermelon Sugar",
          artist: "Harry Styles",
          album: "Fine Line",
          duration: 174,
          coverImageURL:
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
          liked: false,
        },
      ],
      createdAt: "2024-01-15",
      totalDuration: 374,
      followers: 42,
      isOwner: true,
    },
    {
      id: "2",
      name: "Chill Vibes",
      description: "Perfect for relaxing",
      coverImageURL:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop",
      isPublic: false,
      songs: [],
      createdAt: "2024-01-10",
      totalDuration: 0,
      followers: 0,
      isOwner: true,
    },
  ]);

  // State management
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [playlistForm, setPlaylistForm] = useState({
    name: "",
    description: "",
    isPublic: true,
    coverImageURL: "",
  });

  // Load playlist if ID is provided
  useEffect(() => {
    if (playlistId) {
      const playlist = playlists.find((p) => p.id === playlistId);
      setCurrentPlaylist(playlist || null);
    }
  }, [playlistId, playlists]);

  // Format time helper
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatSongDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Handle playlist creation
  const handleCreatePlaylist = () => {
    if (!playlistForm.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a playlist name",
        variant: "destructive",
      });
      return;
    }

    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name: playlistForm.name,
      description: playlistForm.description,
      coverImageURL:
        playlistForm.coverImageURL ||
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
      isPublic: playlistForm.isPublic,
      songs: [],
      createdAt: new Date().toISOString().split("T")[0],
      totalDuration: 0,
      followers: 0,
      isOwner: true,
    };

    setPlaylists((prev) => [...prev, newPlaylist]);
    setShowCreateModal(false);
    setPlaylistForm({
      name: "",
      description: "",
      isPublic: true,
      coverImageURL: "",
    });

    toast({
      title: "Playlist Created",
      description: `"${newPlaylist.name}" has been created successfully`,
    });
  };

  // Handle playlist deletion
  const handleDeletePlaylist = (playlistId: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
    setShowDeleteModal(false);
    if (currentPlaylist?.id === playlistId) {
      setCurrentPlaylist(null);
      navigate("/playlists");
    }

    toast({
      title: "Playlist Deleted",
      description: "Playlist has been deleted successfully",
    });
  };

  // Handle song play
  const handlePlaySong = (song: Song) => {
    if (currentSong?.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
    }
  };

  // Handle like toggle
  const handleToggleLike = (songId: string) => {
    if (currentPlaylist) {
      const updatedSongs = currentPlaylist.songs.map((song) =>
        song.id === songId ? { ...song, liked: !song.liked } : song,
      );

      const updatedPlaylist = { ...currentPlaylist, songs: updatedSongs };
      setCurrentPlaylist(updatedPlaylist);

      setPlaylists((prev) =>
        prev.map((p) => (p.id === currentPlaylist.id ? updatedPlaylist : p)),
      );
    }
  };

  // Filtered songs based on search
  const filteredSongs =
    currentPlaylist?.songs.filter(
      (song) =>
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  // Playlist overview view
  if (!currentPlaylist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-darker via-purple-dark to-background text-white relative overflow-hidden">
        {/* Background Effects */}
        <div className="fixed inset-0 bg-gradient-to-br from-purple-primary/8 via-purple-secondary/4 to-purple-accent/6"></div>

        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Header */}
          <motion.header
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-xl border-b border-purple-primary/20"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-purple-dark/50 backdrop-blur-sm flex items-center justify-center border border-purple-primary/30"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>

            <h1 className="text-xl font-bold">Your Playlists</h1>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="w-10 h-10 rounded-full bg-neon-green/20 border border-neon-green/50 flex items-center justify-center"
            >
              <Plus className="w-5 h-5 text-neon-green" />
            </motion.button>
          </motion.header>

          {/* Playlists Grid */}
          <main className="flex-1 p-6 pb-32">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {playlists.map((playlist, index) => (
                <motion.div
                  key={playlist.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => navigate(`/playlists/${playlist.id}`)}
                  className="bg-gradient-to-br from-purple-dark/40 to-purple-primary/20 backdrop-blur-sm rounded-2xl p-4 border border-purple-primary/30 cursor-pointer group"
                >
                  <div className="relative mb-4">
                    <img
                      src={playlist.coverImageURL}
                      alt={playlist.name}
                      className="w-full aspect-square rounded-xl object-cover"
                    />
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ opacity: 1, scale: 1 }}
                      className="absolute bottom-2 right-2 w-12 h-12 bg-neon-green rounded-full flex items-center justify-center shadow-xl shadow-neon-green/30 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Play className="w-6 h-6 text-white ml-0.5" />
                    </motion.button>
                  </div>

                  <h3 className="font-bold text-lg text-white mb-1">
                    {playlist.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                    {playlist.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      {playlist.isPublic ? (
                        <Globe className="w-3 h-3" />
                      ) : (
                        <Lock className="w-3 h-3" />
                      )}
                      <span>{playlist.isPublic ? "Public" : "Private"}</span>
                    </div>
                    <span>{playlist.songs.length} songs</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </main>

          <MobileFooter />
        </div>

        {/* Create Playlist Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-gradient-to-br from-purple-dark to-purple-darker border border-purple-primary/30 rounded-2xl p-6 w-full max-w-md"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">
                    Create Playlist
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 rounded-full hover:bg-purple-primary/20 text-gray-400"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={playlistForm.name}
                      onChange={(e) =>
                        setPlaylistForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="My Playlist"
                      className="w-full p-3 bg-purple-dark/50 border border-purple-primary/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-neon-green/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={playlistForm.description}
                      onChange={(e) =>
                        setPlaylistForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Describe your playlist..."
                      rows={3}
                      className="w-full p-3 bg-purple-dark/50 border border-purple-primary/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-neon-green/50 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-300">
                      Make Public
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        setPlaylistForm((prev) => ({
                          ...prev,
                          isPublic: !prev.isPublic,
                        }))
                      }
                      className={`relative w-12 h-6 rounded-full transition-all ${
                        playlistForm.isPublic ? "bg-neon-green" : "bg-gray-600"
                      }`}
                    >
                      <motion.div
                        animate={{ x: playlistForm.isPublic ? 24 : 2 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full"
                      />
                    </motion.button>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 p-3 bg-gray-600/50 border border-gray-500/50 rounded-xl text-white font-medium"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCreatePlaylist}
                      className="flex-1 p-3 bg-neon-green/20 border border-neon-green/50 rounded-xl text-neon-green font-medium"
                    >
                      Create
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Individual playlist view
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-darker via-purple-dark to-background text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-primary/8 via-purple-secondary/4 to-purple-accent/6"></div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-xl border-b border-purple-primary/20"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/playlists")}
            className="w-10 h-10 rounded-full bg-purple-dark/50 backdrop-blur-sm flex items-center justify-center border border-purple-primary/30"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>

          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-full bg-purple-dark/50 text-gray-400 hover:text-white transition-colors"
            >
              <Search className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-full bg-purple-dark/50 text-gray-400 hover:text-white transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.header>

        {/* Playlist Info */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="p-6"
        >
          <div className="flex items-start space-x-4 mb-6">
            <div className="relative">
              <img
                src={currentPlaylist.coverImageURL}
                alt={currentPlaylist.name}
                className="w-32 h-32 rounded-2xl object-cover shadow-xl shadow-purple-primary/20"
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute bottom-2 right-2 w-10 h-10 bg-neon-green rounded-full flex items-center justify-center shadow-lg shadow-neon-green/30"
              >
                <Play className="w-5 h-5 text-white ml-0.5" />
              </motion.button>
            </div>

            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                {currentPlaylist.isPublic ? (
                  <Globe className="w-4 h-4 text-gray-400" />
                ) : (
                  <Lock className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm text-gray-400">
                  {currentPlaylist.isPublic
                    ? "Public Playlist"
                    : "Private Playlist"}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-white mb-2">
                {currentPlaylist.name}
              </h1>
              <p className="text-gray-400 mb-3">
                {currentPlaylist.description}
              </p>

              <div className="text-sm text-gray-500">
                <p>
                  {currentPlaylist.songs.length} songs •{" "}
                  {formatTime(currentPlaylist.totalDuration)}
                </p>
                {currentPlaylist.followers && currentPlaylist.followers > 0 && (
                  <p>{currentPlaylist.followers} followers</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4 mb-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 py-3 bg-neon-green/20 border border-neon-green/50 rounded-xl text-neon-green font-medium flex items-center justify-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>Play All</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 bg-purple-dark/50 border border-purple-primary/30 rounded-xl text-gray-400 hover:text-white transition-colors"
            >
              <Shuffle className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 bg-purple-dark/50 border border-purple-primary/30 rounded-xl text-gray-400 hover:text-white transition-colors"
            >
              <Share className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 bg-purple-dark/50 border border-purple-primary/30 rounded-xl text-gray-400 hover:text-white transition-colors"
            >
              <Download className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.section>

        {/* Songs List */}
        <main className="flex-1 px-6 pb-32">
          {currentPlaylist.songs.length > 0 ? (
            <div className="space-y-2">
              {filteredSongs.map((song, index) => (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ backgroundColor: "rgba(158, 64, 252, 0.1)" }}
                  className="flex items-center space-x-4 p-3 rounded-xl cursor-pointer group transition-all"
                  onClick={() => handlePlaySong(song)}
                >
                  <div className="relative">
                    <img
                      src={song.coverImageURL}
                      alt={song.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <motion.button
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center transition-opacity"
                    >
                      {currentSong?.id === song.id && isPlaying ? (
                        <Pause className="w-4 h-4 text-white" />
                      ) : (
                        <Play className="w-4 h-4 text-white ml-0.5" />
                      )}
                    </motion.button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white truncate">
                      {song.title}
                    </h4>
                    <p className="text-sm text-gray-400 truncate">
                      {song.artist}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleLike(song.id);
                      }}
                      className={`p-2 rounded-full transition-all ${
                        song.liked
                          ? "text-neon-green"
                          : "text-gray-400 hover:text-neon-green"
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${song.liked ? "fill-current" : ""}`}
                      />
                    </motion.button>

                    <span className="text-sm text-gray-400 min-w-[40px] text-right">
                      {formatSongDuration(song.duration)}
                    </span>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-full text-gray-400 hover:text-white transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                No songs yet
              </h3>
              <p className="text-gray-500 mb-6">
                Add some songs to get started
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-neon-green/20 border border-neon-green/50 rounded-xl text-neon-green font-medium"
              >
                Add Songs
              </motion.button>
            </motion.div>
          )}
        </main>

        <MobileFooter />
      </div>
    </div>
  );
}
