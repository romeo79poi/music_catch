import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  MoreHorizontal,
  Play,
  Clock,
  Calendar,
  TrendingUp,
  Music,
  Heart,
  User,
  Home,
  Library,
  Loader2,
} from "lucide-react";
import { useProfileContext } from "../context/ProfileContext";
import { useEnhancedMusic } from "../context/EnhancedMusicContext";
import { useToast } from "../hooks/use-toast";
import MobileFooter from "../components/MobileFooter";
import { api } from "../lib/api";
import { useFirebase } from "../context/FirebaseContext";
import { useNavigate } from "react-router-dom";

// Firebase-aware mock data functions
const getFirebaseMockHistory = (firebaseUser) => [
  {
    id: "firebase-hist-1",
    track: {
      id: "firebase-track-1",
      title: "Midnight Dreams",
      artist: "Alex Johnson",
      album: "Digital Horizons",
      duration: 234,
      coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop",
    },
    playedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    userId: firebaseUser.uid,
  },
  {
    id: "firebase-hist-2",
    track: {
      id: "firebase-track-2",
      title: "Summer Vibes",
      artist: "Beach Boys Redux",
      album: "Coastal Dreams",
      duration: 198,
      coverUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    },
    playedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    userId: firebaseUser.uid,
  },
];

const getFirebaseMockStats = (firebaseUser) => ({
  totalPlays: 156,
  totalMinutes: 8940,
  uniqueTracks: 78,
  uniqueArtists: 45,
  topGenre: "Electronic",
  averageSessionLength: 45,
  firebaseUserId: firebaseUser.uid,
});

const getFirebaseMockArtists = (firebaseUser) => [
  {
    name: "Alex Johnson",
    plays: 45,
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop",
    firebaseUserId: firebaseUser.uid,
  },
  {
    name: "Beach Boys Redux",
    plays: 38,
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    firebaseUserId: firebaseUser.uid,
  },
  {
    name: "Electronic Dreams",
    plays: 32,
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    firebaseUserId: firebaseUser.uid,
  },
];

export default function History() {
  const { profile } = useProfileContext();
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
  const { toast } = useToast();
  const { user: firebaseUser, loading: firebaseLoading } = useFirebase();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Recent");
  const [timeFilter, setTimeFilter] = useState("Today");
  const [listeningHistory, setListeningHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [topArtists, setTopArtists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const tabs = ["Recent", "This Week", "This Month", "All Time"];
  const timeFilters = ["Today", "Yesterday", "This Week", "This Month"];

  useEffect(() => {
    if (!firebaseLoading) {
      if (firebaseUser) {
        loadHistoryData();
      } else {
        navigate("/login");
      }
    }
  }, [timeFilter, firebaseUser, firebaseLoading]);

  const loadHistoryData = async () => {
    try {
      setIsLoading(true);

      if (!firebaseUser) {
        console.log("❌ No Firebase user found");
        setIsLoading(false);
        return;
      }

      console.log("🔥 Loading history for Firebase user:", firebaseUser.email);

      // Try to load history from backend with Firebase user ID
      try {
        const historyResponse = await fetch(
          `/api/v1/users/${firebaseUser.uid}/play-history?limit=50&period=${timeFilter.toLowerCase().replace(" ", "_")}`,
          {
            headers: {
              "user-id": firebaseUser.uid,
              "Content-Type": "application/json",
            },
          },
        );

        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setListeningHistory(historyData.history || historyData.play_history || []);
          setStats(historyData.stats);
          console.log("✅ Loaded history from backend:", historyData.history?.length || 0);
        } else {
          throw new Error("Backend history fetch failed");
        }
      } catch (error) {
        console.warn("⚠️ Backend history fetch failed:", error);
        // Fallback to Firebase-aware mock data
        setListeningHistory(getFirebaseMockHistory(firebaseUser));
        setStats(getFirebaseMockStats(firebaseUser));
      }

      // Try to load analytics
      try {
        const analyticsResponse = await fetch(
          `/api/v1/users/${firebaseUser.uid}/analytics?period=${timeFilter.toLowerCase().replace(" ", "_")}`,
          {
            headers: {
              "user-id": firebaseUser.uid,
              "Content-Type": "application/json",
            },
          },
        );

        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          setTopArtists(analyticsData.top_artists || []);
          console.log("✅ Loaded analytics from backend");
        } else {
          throw new Error("Backend analytics fetch failed");
        }
      } catch (error) {
        console.warn("⚠️ Backend analytics fetch failed:", error);
        // Fallback to Firebase-aware mock artists
        setTopArtists(getFirebaseMockArtists(firebaseUser));
      }
    } catch (error) {
      console.error("Failed to load history data:", error);
      setListeningHistory(mockListeningHistory);
      setStats(mockStats);
      setTopArtists(mockTopArtists);

      toast({
        title: "Error",
        description: "Failed to load listening history. Showing cached data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaySong = async (song: any) => {
    try {
      await fetch(`/api/music/play/${song.id || song.songId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.id }),
      });

      const songData = {
        id: song.id || song.songId,
        title: song.title,
        artist: song.artist,
        album: song.album,
        image: song.image,
        duration: song.duration,
      };

      if (currentSong?.id === songData.id) {
        togglePlay();
      } else {
        setCurrentSong(songData);
      }
    } catch (error) {
      console.error("Failed to play song:", error);
    }
  };

  // Mock data for fallback
  const mockListeningHistory = [
    {
      id: 1,
      title: "Blinding Lights",
      artist: "The Weeknd",
      album: "After Hours",
      duration: "3:20",
      playedAt: "2 minutes ago",
      image:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop",
      isLiked: true,
      playCount: 12,
    },
    {
      id: 2,
      title: "Watermelon Sugar",
      artist: "Harry Styles",
      album: "Fine Line",
      duration: "2:54",
      playedAt: "15 minutes ago",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      isLiked: false,
      playCount: 8,
    },
    {
      id: 3,
      title: "Levitating",
      artist: "Dua Lipa",
      album: "Future Nostalgia",
      duration: "3:23",
      playedAt: "32 minutes ago",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
      isLiked: true,
      playCount: 15,
    },
  ];

  const mockStats = {
    totalTime: "47h 23m",
    totalPlays: 432,
    averagePlayTime: 204,
    completionRate: 78,
    mostPlayedHour: "14:00",
    topDevice: "Mobile",
  };

  const getStatsDisplay = () => [
    {
      label: "Total Listening Time",
      value: stats?.totalTime || mockStats.totalTime,
      change: "+12%",
      icon: Clock,
      color: "text-neon-green",
    },
    {
      label: "Songs Played",
      value: stats?.totalPlays?.toString() || mockStats.totalPlays.toString(),
      change: "+8%",
      icon: Music,
      color: "text-neon-blue",
    },
    {
      label: "Completion Rate",
      value: `${stats?.completionRate || mockStats.completionRate}%`,
      change: "+5%",
      icon: TrendingUp,
      color: "text-purple-400",
    },
    {
      label: "Top Device",
      value: stats?.topDevice || mockStats.topDevice,
      change: "78%",
      icon: Heart,
      color: "text-pink-400",
    },
  ];

  const mockTopArtists = [
    {
      name: "The Weeknd",
      plays: 45,
      image:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop",
    },
    {
      name: "Dua Lipa",
      plays: 38,
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    },
    {
      name: "Harry Styles",
      plays: 32,
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Glow Effects */}
      <div className="fixed inset-0 bg-black">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-green/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 md:p-6 bg-black/60 backdrop-blur-sm sticky top-0 z-20"
        >
          <Link to="/home">
            <ArrowLeft className="w-6 h-6 text-white" />
          </Link>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold">Listening History</h1>
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
            <Search className="w-6 h-6 text-gray-400" />
            <Calendar className="w-6 h-6 text-gray-400" />
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="px-4 md:px-6 mb-6"
        >
          <h2 className="text-lg font-bold mb-4">{timeFilter}'s Stats</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-neon-green animate-spin" />
              <span className="ml-2 text-gray-400">Loading stats...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {getStatsDisplay().map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  className="bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    <span className="text-xs text-neon-green">
                      {stat.change}
                    </span>
                  </div>
                  <div className="text-xl font-bold mb-1">{stat.value}</div>
                  <div className="text-xs text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Top Artists */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-4 md:px-6 mb-6"
        >
          <h2 className="text-lg font-bold mb-4">Top Artists This Week</h2>
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {(topArtists.length > 0 ? topArtists : mockTopArtists).map(
              (artist: any, index) => (
                <div key={artist.name} className="flex-shrink-0">
                  <div className="bg-white/5 rounded-xl p-4 text-center min-w-[120px] hover:bg-white/10 transition-colors cursor-pointer">
                    <img
                      src={artist.image}
                      alt={artist.name}
                      className="w-16 h-16 rounded-full mx-auto mb-3 object-cover"
                    />
                    <h3 className="font-medium text-sm mb-1">{artist.name}</h3>
                    <p className="text-xs text-gray-400">
                      {artist.plays} plays
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
        </motion.section>

        {/* Time Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="px-4 md:px-6 mb-4"
        >
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {timeFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`text-sm font-medium whitespace-nowrap px-4 py-2 rounded-full transition-colors ${
                  timeFilter === filter
                    ? "bg-neon-green text-black"
                    : "bg-white/10 text-gray-400 hover:text-white"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="px-4 md:px-6 mb-4"
        >
          <div className="flex space-x-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-sm font-medium whitespace-nowrap pb-2 border-b-2 transition-colors ${
                  activeTab === tab
                    ? "text-white border-neon-green"
                    : "text-gray-400 border-transparent hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </motion.div>

        {/* History List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex-1 px-4 md:px-6 pb-24"
        >
          <div className="space-y-2">
            {(listeningHistory.length > 0
              ? listeningHistory
              : mockListeningHistory
            ).map((song: any, index) => (
              <div
                key={song.id || index}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-all group cursor-pointer"
                onClick={() => handlePlaySong(song)}
              >
                <div className="text-gray-400 text-sm w-8">#{index + 1}</div>
                <div className="relative flex-shrink-0">
                  <img
                    src={
                      song.image ||
                      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop"
                    }
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
                    {currentSong?.id === (song.id || song.songId) &&
                    isPlaying ? (
                      <Play className="w-4 h-4 text-white ml-0.5" />
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
                    {song.artist}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-1">
                    {song.playedAt || "Recently"}
                  </p>
                  {song.playCount && (
                    <p className="text-xs text-gray-500">
                      Played {song.playCount}x
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {(song.isLiked ||
                    profile.likedSongs?.includes(song.id?.toString())) && (
                    <Heart className="w-4 h-4 text-neon-green fill-current" />
                  )}
                  <span className="text-gray-400 text-xs">{song.duration}</span>
                  <MoreHorizontal className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center py-8"
          >
            <button className="px-6 py-3 bg-white/10 rounded-full text-sm font-medium hover:bg-white/20 transition-colors">
              Load More History
            </button>
          </motion.div>
        </motion.div>

        {/* Mobile Footer */}
        <MobileFooter />
      </div>
    </div>
  );
}
