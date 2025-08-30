import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Music,
  Search as SearchIcon,
  ChevronRight,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  MoreHorizontal,
  Home,
  Library,
  Clock,
  User,
  Loader2,
  Users,
  Disc,
  Heart,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import MobileFooter from "../components/MobileFooter";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  album_title: string;
  duration: number;
  cover_image_url: string;
  genre?: string;
}

interface Artist {
  id: string;
  name: string;
  avatar_url: string;
  monthly_listeners: number;
  is_verified: boolean;
}

interface Album {
  id: string;
  title: string;
  artist_name: string;
  cover_image_url: string;
  release_date: string;
  track_count: number;
}

export default function Search() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, firebaseUser } = useAuth();
  const { user: fbUser } = useFirebase();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchResults, setSearchResults] = useState<{
    tracks?: Track[];
    albums?: Album[];
    artists?: Artist[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentSong, setCurrentSong] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());

  // Check Firebase authentication
  useEffect(() => {
    if (fbUser) {
      console.log("🔥 Firebase user detected in Search:", fbUser.email);
      loadUserLikes();
    }
  }, [fbUser]);

  const loadUserLikes = async () => {
    try {
      if (!fbUser) {
        console.log("🔥 No Firebase user, using mock likes");
        // Mock some liked songs for better UX
        setLikedSongs(new Set(["1", "3", "5"]));
        return;
      }

      console.log("🔥 Loading likes for Firebase user:", fbUser.email);

      // Try to load from backend with Firebase user ID
      const response = await fetch(`/api/v1/users/${fbUser.uid}/liked-tracks`, {
        headers: {
          "user-id": fbUser.uid,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const likedTrackIds = new Set(
          data.liked_tracks?.map((track: any) => track.id) || [],
        );
        setLikedSongs(likedTrackIds);
      }
    } catch (error) {
      console.error("Error loading user likes:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsLoading(true);
      setHasSearched(true);

      let results: any = {};

      if (selectedTab === "all" || selectedTab === "songs") {
        try {
          const data = await api.search.searchSongs(searchQuery, 20);
          results.tracks = data.tracks || data.data || [];
        } catch (error) {
          console.error("Track search error:", error);
        }
      }

      if (selectedTab === "all" || selectedTab === "albums") {
        try {
          const data = await api.search.searchAlbums(searchQuery, 20);
          results.albums = data.albums || data.data || [];
        } catch (error) {
          console.error("Album search error:", error);
        }
      }

      if (selectedTab === "all" || selectedTab === "artists") {
        try {
          const data = await api.search.searchArtists(searchQuery, 20);
          results.artists = data.artists || data.data || [];
        } catch (error) {
          console.error("Artist search error:", error);
        }
      }

      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Error",
        description: "Failed to search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaySong = async (track: Track) => {
    try {
      if (currentSong?.id === track.id) {
        setIsPlaying(!isPlaying);
      } else {
        setCurrentSong(track);
        setIsPlaying(true);

        // Add to listening history
        if (currentUser) {
          const token = localStorage.getItem("token");
          if (token) {
            await fetch(`/api/v1/users/play-history`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ track_id: track.id }),
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to play song:", error);
      // Still allow playback even if history fails
      if (currentSong?.id === track.id) {
        setIsPlaying(!isPlaying);
      } else {
        setCurrentSong(track);
        setIsPlaying(true);
      }
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

      const isCurrentlyLiked = likedSongs.has(trackId);
      const method = isCurrentlyLiked ? "DELETE" : "POST";

      const response = await fetch(`/api/v1/users/liked-tracks/${trackId}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Update local state
        setLikedSongs((prev) => {
          const newSet = new Set(prev);
          if (isCurrentlyLiked) {
            newSet.delete(trackId);
          } else {
            newSet.add(trackId);
          }
          return newSet;
        });

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
      console.error("❌ Error toggling like:", error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    }
  };

  // URL parameter handling
  useEffect(() => {
    const genreParam = searchParams.get("genre");
    if (genreParam) {
      setSearchQuery(genreParam);
      setSelectedTab("songs");
      setTimeout(() => handleSearch(), 100);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length > 2) {
      const timeoutId = setTimeout(() => {
        handleSearch();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else if (searchQuery.length === 0) {
      setSearchResults(null);
      setHasSearched(false);
    }
  }, [searchQuery, selectedTab]);

  const tabs = [
    { id: "all", label: "All", icon: SearchIcon },
    { id: "songs", label: "Songs", icon: Music },
    { id: "albums", label: "Albums", icon: Disc },
    { id: "artists", label: "Artists", icon: Users },
  ];

  const quickSearchButtons = [
    "Pop",
    "Hip-Hop",
    "Rock",
    "Electronic",
    "Jazz",
    "Classical",
    "R&B",
    "Country",
  ];

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const renderSearchResults = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-primary animate-spin" />
          <span className="ml-2 text-gray-400">Searching...</span>
        </div>
      );
    }

    if (!searchResults && hasSearched) {
      return (
        <div className="text-center py-12">
          <SearchIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            No results found
          </h3>
          <p className="text-gray-500">Try searching with different keywords</p>
        </div>
      );
    }

    if (!searchResults) return null;

    return (
      <div className="space-y-6">
        {/* Tracks Results */}
        {searchResults.tracks && searchResults.tracks.length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Music className="w-5 h-5 mr-2 text-purple-primary" />
              Tracks
            </h3>
            <div className="space-y-2">
              {searchResults.tracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all group cursor-pointer"
                  onClick={() => handlePlaySong(track)}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={track.cover_image_url}
                      alt={track.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlaySong(track);
                      }}
                      className="absolute inset-0 bg-black/60 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {currentSong?.id === track.id && isPlaying ? (
                        <Pause className="w-4 h-4 text-white" />
                      ) : (
                        <Play className="w-4 h-4 text-white ml-0.5" />
                      )}
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate text-white">
                      {track.title}
                    </h4>
                    <p className="text-gray-400 text-xs truncate">
                      {track.artist_name} {track.genre && `• ${track.genre}`}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 text-xs">
                      {formatDuration(track.duration)}
                    </span>
                    <button
                      onClick={(e) => handleToggleLike(track.id, e)}
                      className={`opacity-0 group-hover:opacity-100 transition-all hover:scale-110 ${
                        likedSongs.has(track.id)
                          ? "text-red-500 hover:text-red-600"
                          : "text-gray-400 hover:text-red-500"
                      }`}
                      title={likedSongs.has(track.id) ? "Unlike" : "Like"}
                    >
                      <Heart
                        className={`w-4 h-4 transition-all ${
                          likedSongs.has(track.id) ? "fill-current" : ""
                        }`}
                      />
                    </button>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Albums Results */}
        {searchResults.albums && searchResults.albums.length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Disc className="w-5 h-5 mr-2 text-purple-secondary" />
              Albums
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {searchResults.albums.map((album) => (
                <div
                  key={album.id}
                  className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer"
                >
                  <img
                    src={album.cover_image_url}
                    alt={album.title}
                    className="w-full aspect-square rounded-lg object-cover mb-3"
                  />
                  <h4 className="font-medium text-white mb-1 truncate">
                    {album.title}
                  </h4>
                  <p className="text-xs text-gray-400">{album.artist_name}</p>
                  <p className="text-xs text-gray-500">
                    {album.track_count} tracks
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Artists Results */}
        {searchResults.artists && searchResults.artists.length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-accent" />
              Artists
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {searchResults.artists.map((artist) => (
                <div
                  key={artist.id}
                  className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer"
                >
                  <img
                    src={
                      artist.avatar_url ||
                      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop"
                    }
                    alt={artist.name}
                    className="w-full aspect-square rounded-lg object-cover mb-3"
                  />
                  <div className="flex items-center space-x-1 mb-1">
                    <h4 className="font-medium text-white truncate">
                      {artist.name}
                    </h4>
                    {artist.is_verified && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {artist.monthly_listeners.toLocaleString()} monthly
                    listeners
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-darker via-background to-purple-dark dark:from-purple-darker dark:via-background dark:to-purple-dark light:from-gray-50 light:via-white light:to-purple-50 relative overflow-hidden theme-transition">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-primary/8 via-purple-secondary/4 to-purple-accent/6 dark:from-purple-primary/8 dark:via-purple-secondary/4 dark:to-purple-accent/6 light:from-purple-primary/3 light:via-purple-secondary/2 light:to-purple-accent/3 theme-transition"></div>

      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <Music className="w-6 h-6 text-purple-primary" />
          <button
            onClick={() => navigate("/profile")}
            className="w-8 h-8 bg-gradient-to-r from-purple-primary to-purple-secondary rounded-full flex items-center justify-center"
          >
            <User className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-6 overflow-y-auto">
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold text-white mb-6"
          >
            Search
          </motion.h1>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="flex items-center space-x-2 mb-6"
          >
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search Catch"
                className="w-full h-12 bg-white rounded-full pl-12 pr-4 text-black placeholder-slate-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleSearch}
              className="w-12 h-12 bg-purple-primary rounded-full flex items-center justify-center hover:bg-purple-secondary transition-colors"
            >
              <SearchIcon className="w-5 h-5 text-white" />
            </button>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="flex space-x-6 mb-6 overflow-x-auto"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center space-x-2 text-sm font-medium whitespace-nowrap pb-2 border-b-2 transition-colors ${
                  selectedTab === tab.id
                    ? "text-white border-purple-primary"
                    : "text-slate-400 border-transparent hover:text-white"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </motion.div>

          {/* Quick Search Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="flex flex-wrap gap-2 mb-6"
          >
            {quickSearchButtons.map((genre, index) => (
              <button
                key={index}
                onClick={() => {
                  setSearchQuery(genre);
                  setSelectedTab("songs");
                }}
                className="h-10 px-4 rounded-full flex items-center justify-center text-sm font-medium transition-colors bg-purple-dark/50 text-white hover:bg-purple-primary/20 hover:text-purple-primary border border-purple-primary/20"
              >
                {genre}
              </button>
            ))}
          </motion.div>

          {/* Search Results or Browse Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mb-6"
          >
            {searchQuery || hasSearched ? (
              renderSearchResults()
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Browse Music</h2>
                </div>

                {/* Browse Categories Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {quickSearchButtons.slice(0, 4).map((genre, index) => (
                    <motion.div
                      key={genre}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.6 }}
                      onClick={() => {
                        setSearchQuery(genre);
                        setSelectedTab("songs");
                      }}
                      className="aspect-square rounded-2xl bg-gradient-to-br from-purple-primary to-purple-secondary text-white flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                    >
                      <Music className="w-8 h-8 mb-2" />
                      <span className="font-medium">{genre}</span>
                      <span className="text-xs opacity-75">
                        Browse {genre.toLowerCase()}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Welcome Message */}
                <div className="text-center py-8">
                  <SearchIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Search for Music
                  </h3>
                  <p className="text-gray-400">
                    Find songs, albums, and playlists
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Mobile Footer */}
        <MobileFooter />
      </div>
    </div>
  );
}
