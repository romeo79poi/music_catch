import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  User,
  Play,
  Pause,
  MessageCircle,
  Heart,
  MoreHorizontal,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Music,
  Star,
  Check,
} from "lucide-react";
import { MusicCatchLogo } from "../components/MusicCatchLogo";
import { useToast } from "../hooks/use-toast";
import MobileFooter from "../components/MobileFooter";
import ActivityFeed from "../components/ActivityFeed";
import EnhancedMiniPlayer from "../components/EnhancedMiniPlayer";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useMusic } from "../context/MusicContextSupabase";
import { useEnhancedMusic, type Song } from "../context/EnhancedMusicContext";
import { userDataService, EnhancedUserData } from "../lib/user-data-service";

// Real data will be fetched from backend APIs - no more mock data

// Sample albums removed - will be fetched from backend

// New releases removed - will be fetched from backend

// Mood playlists removed - will be fetched from backend

// Sample songs removed - will be fetched from backend

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300,
    },
  },
};

const floatAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

const glowVariants = {
  initial: {
    boxShadow: "0 0 0px rgba(158, 64, 252, 0)",
  },
  animate: {
    boxShadow: [
      "0 0 5px rgba(158, 64, 252, 0.3)",
      "0 0 20px rgba(158, 64, 252, 0.6)",
      "0 0 5px rgba(158, 64, 252, 0.3)",
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export default function Home() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const {
    trendingSongs,
    trendingAlbums,
    userPlaylists,
    recentlyPlayed,
    playSong,
    currentSong,
    isPlaying,
    loading,
    likeSong,
    unlikeSong,
  } = useMusic();

  const enhancedMusic = useEnhancedMusic();

  const [hoveredAlbum, setHoveredAlbum] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userData, setUserData] = useState<EnhancedUserData | null>(null);
  const [userDataLoading, setUserDataLoading] = useState(false);
  const [albums, setAlbums] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [apiDataLoaded, setApiDataLoaded] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isAutoSliding, setIsAutoSliding] = useState(true);

  // Create top10Today from trendingSongs
  const top10Today = trendingSongs ? trendingSongs.slice(0, 10) : [];

  // Auto-slide effect for Top 10 Today
  useEffect(() => {
    if (!isAutoSliding || top10Today.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlideIndex((prevIndex) =>
        prevIndex === top10Today.length - 1 ? 0 : prevIndex + 1,
      );
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [isAutoSliding, top10Today.length]);

  // Update time for greeting
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Load user data from comprehensive user data service
  useEffect(() => {
    const loadUserData = async () => {
      // Don't run if already loading or if we have fresh data
      if (userDataLoading) return;

      try {
        setUserDataLoading(true);

        // Check if we have a backend authenticated user
        if (user) {
          // Use the user data from AuthContext
          setUserData(user);
          setUserAvatar(user.avatar_url);
          setUserDataLoading(false);
        } else {
          // Try to load from localStorage as fallback
          const savedUserData = localStorage.getItem("currentUser");
          if (savedUserData) {
            try {
              const parsedUserData = JSON.parse(savedUserData);
              if (parsedUserData.id) {
                setUserData(parsedUserData);
                setUserAvatar(
                  parsedUserData.avatar_url || parsedUserData.profileImageURL,
                );
              }
            } catch (error) {
              console.error("Error parsing localStorage user data:", error);
              localStorage.removeItem("currentUser");
            }
          }
        }
      } catch (error) {
        console.error("�� Error loading user data for Home:", error);
        // Don't clear existing data on error
      } finally {
        setUserDataLoading(false);
      }
    };

    if (!authLoading) {
      loadUserData();
    }
  }, [user, authLoading]);

  // Additional fallback for avatar only
  useEffect(() => {
    if (!userData) {
      const savedAvatar = localStorage.getItem("userAvatar");
      if (savedAvatar) {
        setUserAvatar(savedAvatar);
      }
    }
  }, [userData]);

  // Load data from new backend APIs
  useEffect(() => {
    const loadApiData = async () => {
      if (apiDataLoaded) return;

      try {
        // Load home feed data using homeApi with timeout
        const apiTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("API timeout")), 5000); // 5 second timeout
        });

        const [newReleases, trending] = await Promise.all([
          Promise.race([api.home.getNewReleases(10), apiTimeout]).catch(() => ({
            data: [],
          })),
          Promise.race([api.home.getTrending(10), apiTimeout]).catch(() => ({
            data: [],
          })),
        ]);

        // Update albums with new releases
        if (newReleases?.data?.length > 0) {
          const formattedAlbums = newReleases.data.map((album: any) => ({
            id: album.id,
            name: album.title || album.name,
            artist: album.artist_name || album.artist,
            coverImageURL: album.cover_image_url || album.coverImageURL,
            isNew: true,
          }));
          setAlbums(formattedAlbums);
        }

        // Update tracks with trending
        if (trending?.data?.length > 0) {
          const formattedTracks = trending.data.map((track: any) => ({
            id: track.id,
            title: track.title || track.name,
            artist: track.artist_name || track.artist,
            coverImageURL: track.cover_image_url || track.coverImageURL,
            duration: track.duration || "3:30",
          }));
          setTracks(formattedTracks);
        }

        setApiDataLoaded(true);
      } catch (error) {
        console.error("Error loading API data:", error);

        // Fallback to sample data to keep UI working
        if (albums.length === 0) {
          setAlbums(sampleAlbums);
        }
        if (tracks.length === 0) {
          setTracks(sampleSongs);
        }

        // Show warning toast instead of error
        toast({
          title: "Using offline content",
          description: "Some content may be limited while offline",
          variant: "default",
        });
        setApiDataLoaded(true);
      }
    };

    loadApiData();
  }, [apiDataLoaded]);

  // Get appropriate greeting
  const getGreeting = () => {
    const hour = currentTime.getHours();

    let timeGreeting = "";
    if (hour >= 0 && hour < 6) timeGreeting = "Good Midnight";
    else if (hour < 12) timeGreeting = "Good Morning";
    else if (hour < 17) timeGreeting = "Good Afternoon";
    else timeGreeting = "Good Evening";

    return <p>{timeGreeting}</p>;
  };

  const handlePlaySong = (songId: string) => {
    if (currentSong === songId) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(songId);
      setIsPlaying(true);
    }
  };

  const handleLikeSong = (songId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newLikedSongs = new Set(likedSongs);
    if (likedSongs.has(songId)) {
      newLikedSongs.delete(songId);
    } else {
      newLikedSongs.add(songId);
    }
    setLikedSongs(newLikedSongs);
  };

  // Helper function to convert sample song data to Enhanced format
  const convertToEnhancedSong = (sampleSong: any): Song => ({
    id: sampleSong.id,
    title: sampleSong.title,
    artist: sampleSong.artist,
    album: sampleSong.album || "Unknown Album",
    coverImageURL: sampleSong.coverImageURL,
    duration:
      typeof sampleSong.duration === "string"
        ? 180
        : sampleSong.duration || 180,
    url: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${sampleSong.id}.mp3`,
    genre: "Pop",
    year: 2023,
    explicit: false,
  });

  // Function to handle playing songs with the enhanced player
  const handlePlayEnhancedSong = (sampleSong: any) => {
    const enhancedSong = convertToEnhancedSong(sampleSong);

    // Create a sample playlist from the current context
    const samplePlaylist = {
      id: "sample-playlist-1",
      name: "CATCH Radio",
      description: "The best hits on CATCH",
      songs: tracks.slice(0, 10).map(convertToEnhancedSong),
      isPublic: true,
      createdBy: "catch-radio",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    enhancedMusic.playSong(enhancedSong, samplePlaylist, 0);
    navigate("/player");
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden theme-transition">
      {/* Main Container */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 flex flex-col min-h-screen"
      >
        {/* Clean Header - Claude/AI Style */}
        <motion.header
          variants={itemVariants}
          className="flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur-sm claude-shadow dark:claude-dark-shadow theme-transition"
        >
          {/* Profile Icon with enhanced glow */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            variants={glowVariants}
            initial="initial"
            animate="animate"
            onClick={() => navigate("/profile")}
            className="w-10 h-10 bg-black rounded-full flex items-center justify-center shadow-lg hover:shadow-lg transition-all duration-300 relative overflow-hidden"
            style={{
              boxShadow: `
                0 0 0 1px rgba(236, 72, 153, 0.6),
                inset 0 0 0 1px rgba(236, 72, 153, 0.3)
              `,
            }}
          >
            <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center relative z-10 overflow-hidden">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
            </div>
            <motion.div
              animate={{
                rotate: 360,
                transition: { duration: 3, repeat: Infinity, ease: "linear" },
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
          </motion.button>

          {/* Enhanced Logo */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2"
          >
            <div>
              <MusicCatchLogo className="w-12 h-12" animated={false} />
            </div>
          </motion.div>

          {/* Static Message Icon */}
          <button
            onClick={() => navigate("/messages", { state: { from: "home" } })}
            className="group relative flex items-center justify-center"
          >
            {/* Traditional message icon container */}
            <div
              className="relative w-9 h-9 rounded-full bg-black shadow-lg hover:shadow-xl transition-shadow duration-300 flex items-center justify-center"
              style={{
                boxShadow: `
                  0 0 0 1px rgba(236, 72, 153, 0.6),
                  inset 0 0 0 1px rgba(236, 72, 153, 0.3)
                `,
              }}
            >
              {/* Message Circle icon with black background */}
              <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                <MessageCircle className="w-3 h-3 text-white" />
              </div>
            </div>

            {/* Notification Badge */}
            <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center px-1.5 shadow-lg border-2 border-white dark:border-gray-800">
              <span className="text-xs font-bold text-white leading-none">
                3
              </span>
            </div>
          </button>
        </motion.header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-24 px-4 space-y-6">
          {/* Enhanced Welcome Section */}
          <motion.div
            variants={itemVariants}
            className="mb-12 mt-8 text-center"
          >
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 1,
                duration: 3,
                type: "spring",
                damping: 30,
                stiffness: 50,
              }}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 purple-gradient-text dark:purple-gradient-text light:text-foreground"
            >
              {getGreeting()}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, type: "spring", damping: 15 }}
              className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-lg flex items-center justify-center space-x-3 max-w-md mx-auto"
            >
              <Sparkles className="w-5 h-5 text-purple-primary animate-pulse" />
              <span className="font-medium">
                Ready to discover amazing music?
              </span>
              <Sparkles className="w-5 h-5 text-purple-primary animate-pulse" />
            </motion.p>
          </motion.div>

          {/* Top 10 Today - Sliding Section */}
          <motion.section variants={itemVariants} className="mb-8">
            <div className="relative overflow-hidden rounded-lg">
              <motion.div
                animate={{
                  x: `-${currentSlideIndex * 100}%`,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                className="flex"
              >
                {top10Today.length > 0 &&
                  top10Today.map((song, index) => (
                    <motion.div
                      key={song.id}
                      className="w-full flex-shrink-0 relative"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div
                        className="relative bg-gradient-to-br from-black via-gray-900 to-black rounded-lg p-6 overflow-hidden cursor-pointer"
                        style={{
                          boxShadow: `
                          0 0 0 2px rgba(236, 72, 153, 0.8),
                          inset 0 0 0 1px rgba(236, 72, 153, 0.3),
                          0 10px 30px rgba(236, 72, 153, 0.2)
                        `,
                        }}
                        onClick={() => {
                          const enhancedSong = {
                            id: song.id,
                            title: song.title,
                            artist: song.artist,
                            album: "Top Hits",
                            coverImageURL: song.coverImageURL,
                            duration: 180,
                            url: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${song.rank}.mp3`,
                            genre: "Pop",
                            year: 2024,
                            explicit: false,
                          };

                          const topHitsPlaylist = {
                            id: "top-10-today",
                            name: "Top 10 Today",
                            description: "The hottest tracks today",
                            songs:
                              top10Today.length > 0
                                ? top10Today.map((s, i) => ({
                                    id: s.id,
                                    title: s.title,
                                    artist: s.artist,
                                    album: "Top Hits",
                                    coverImageURL: s.coverImageURL,
                                    duration: 180,
                                    url: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${i + 1}.mp3`,
                                    genre: "Pop",
                                    year: 2024,
                                    explicit: false,
                                  }))
                                : [],
                            isPublic: true,
                            createdBy: "catch-charts",
                            createdAt: new Date(),
                            updatedAt: new Date(),
                          };

                          enhancedMusic.playSong(
                            enhancedSong,
                            topHitsPlaylist,
                            song.rank - 1,
                          );
                          navigate("/player");

                          toast({
                            title: "Playing Top Hit",
                            description: `Now playing: ${song.title} by ${song.artist}`,
                          });
                        }}
                      >
                        {/* Animated background gradient */}
                        <motion.div
                          animate={{
                            background: [
                              "linear-gradient(45deg, rgba(236, 72, 153, 0.1), rgba(168, 85, 247, 0.1))",
                              "linear-gradient(45deg, rgba(168, 85, 247, 0.1), rgba(59, 130, 246, 0.1))",
                              "linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(236, 72, 153, 0.1))",
                            ],
                          }}
                          transition={{
                            duration: 6,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="absolute opacity-50"
                          style={{
                            left: "80px",
                            top: "80px",
                            right: 0,
                            bottom: 0,
                          }}
                        />

                        <div className="relative z-10 flex items-center gap-6">
                          {/* Album Cover */}
                          <div className="relative">
                            <motion.img
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              src={song.coverImageURL}
                              alt={song.title}
                              className="rounded-xl object-cover shadow-2xl cursor-pointer"
                              style={{ width: "110px", height: "110px" }}
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent card click
                                const enhancedSong = {
                                  id: song.id,
                                  title: song.title,
                                  artist: song.artist,
                                  album: "Top Hits",
                                  coverImageURL: song.coverImageURL,
                                  duration: 180,
                                  url: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${song.rank}.mp3`,
                                  genre: "Pop",
                                  year: 2024,
                                  explicit: false,
                                };

                                const topHitsPlaylist = {
                                  id: "top-hits-today",
                                  name: "Top 10 Today",
                                  description: "The most listened songs today",
                                  songs:
                                    top10Today.length > 0
                                      ? top10Today.map((s, i) => ({
                                          id: s.id,
                                          title: s.title,
                                          artist: s.artist,
                                          album: "Top Hits",
                                          coverImageURL: s.coverImageURL,
                                          duration: 180,
                                          url: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${i + 1}.mp3`,
                                          genre: "Pop",
                                          year: 2024,
                                          explicit: false,
                                        }))
                                      : [],
                                  isPublic: true,
                                  createdBy: "catch-charts",
                                  createdAt: new Date(),
                                  updatedAt: new Date(),
                                };

                                enhancedMusic.playSong(
                                  enhancedSong,
                                  topHitsPlaylist,
                                  song.rank - 1,
                                );
                                navigate("/player");

                                toast({
                                  title: "���� Now Playing",
                                  description: `${song.title} by ${song.artist}`,
                                });
                              }}
                            />
                          </div>

                          {/* Song Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <motion.span
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1"
                              >
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                <span>LIVE</span>
                              </motion.span>
                              {song.isRising && (
                                <motion.span
                                  animate={{ y: [-2, 2, -2] }}
                                  transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                  }}
                                  className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1"
                                >
                                  <TrendingUp className="w-3 h-3" />
                                  <span>RISING</span>
                                </motion.span>
                              )}
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-1 leading-tight">
                              {song.title}
                            </h3>
                            <p className="text-purple-accent text-lg font-medium mb-3">
                              {song.artist}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-300">
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                <span className="font-semibold">
                                  {song.views} views today
                                </span>
                              </div>
                              <span>{song.playCount} total plays</span>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="text-center">
                            <motion.div
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: index * 0.2,
                              }}
                              className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500 mb-1"
                            >
                              #{song.rank}
                            </motion.div>
                            <div className="text-xs text-gray-400">TODAY</div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                {top10Today.length === 0 && (
                  <div className="w-full flex-shrink-0 relative">
                    <div className="relative bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg p-6 overflow-hidden">
                      <div className="text-center text-gray-400">
                        <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No trending songs available</p>
                        <p className="text-sm mt-2">
                          Check back later for the latest hits!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.section>

          <section />
          {/* Removed user profile section */}

          {/* YouTube Music-like Listen Again Section */}
          <motion.section variants={itemVariants} className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <motion.h2
                whileHover={{ scale: 1.02 }}
                className="text-2xl font-bold text-white"
              >
                Listen again
              </motion.h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
              >
                Show all
              </motion.button>
            </div>

            <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
              {[
                {
                  id: "recent1",
                  title: "Blinding Lights",
                  artist: "The Weeknd",
                  type: "song",
                  coverImageURL:
                    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop",
                  duration: "3:20",
                },
                {
                  id: "recent2",
                  title: "After Hours",
                  artist: "The Weeknd",
                  type: "album",
                  coverImageURL:
                    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop",
                  year: "2020",
                },
                {
                  id: "recent3",
                  title: "Watermelon Sugar",
                  artist: "Harry Styles",
                  type: "song",
                  coverImageURL:
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
                  duration: "2:54",
                },
                {
                  id: "recent4",
                  title: "Chill Vibes",
                  artist: "Various Artists",
                  type: "playlist",
                  coverImageURL:
                    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop",
                  tracks: "45 songs",
                },
                {
                  id: "recent5",
                  title: "Good 4 U",
                  artist: "Olivia Rodrigo",
                  type: "song",
                  coverImageURL:
                    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=200&h=200&fit=crop",
                  duration: "2:58",
                },
                {
                  id: "recent6",
                  title: "Harry Styles",
                  artist: "2.1M subscribers",
                  type: "artist",
                  coverImageURL:
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
                  verified: true,
                },
              ].map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="flex-shrink-0 w-44 cursor-pointer group"
                >
                  <div className="relative mb-3">
                    <motion.img
                      whileHover={{ scale: 1.05 }}
                      src={item.coverImageURL}
                      alt={item.title}
                      className={`w-full h-44 object-cover cursor-pointer ${item.type === "artist" ? "rounded-full" : "rounded-lg"}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const enhancedSong = {
                          id: item.id,
                          title: item.title,
                          artist: item.artist,
                          album: item.type === "album" ? item.title : "Single",
                          coverImageURL: item.coverImageURL,
                          duration: 180,
                          url: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${Math.floor(Math.random() * 5) + 1}.mp3`,
                          genre: "Pop",
                          year: 2024,
                          explicit: false,
                        };
                        enhancedMusic.playSong(enhancedSong);
                        navigate("/player");

                        toast({
                          title: "🎵 Now Playing",
                          description: `${item.title} by ${item.artist}`,
                        });
                      }}
                    />
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ opacity: 1, scale: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const enhancedSong = {
                          id: item.id,
                          title: item.title,
                          artist: item.artist,
                          album: item.type === "album" ? item.title : "Single",
                          coverImageURL: item.coverImageURL,
                          duration: 180,
                          url: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${Math.floor(Math.random() * 5) + 1}.mp3`,
                          genre: "Pop",
                          year: 2024,
                          explicit: false,
                        };
                        enhancedMusic.playSong(enhancedSong);
                        navigate("/player");
                      }}
                      className="absolute bottom-3 right-3 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg transition-all group-hover:opacity-100 opacity-0"
                    >
                      <Play className="w-5 h-5 text-black ml-0.5" />
                    </motion.button>
                    {item.type === "album" && (
                      <div className="absolute top-3 left-3 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        Album
                      </div>
                    )}
                    {item.type === "playlist" && (
                      <div className="absolute top-3 left-3 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        Playlist
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-white text-sm mb-1 truncate leading-tight">
                    {item.title}
                  </h3>
                  <div className="flex items-center space-x-1">
                    <p className="text-gray-400 text-xs truncate leading-tight">
                      {item.type === "song"
                        ? `Song • ${item.artist}`
                        : item.type === "album"
                          ? `Album • ${item.artist} • ${item.year}`
                          : item.type === "playlist"
                            ? `Playlist • ${item.tracks}`
                            : `Artist �� ${item.artist}`}
                    </p>
                    {item.verified && (
                      <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Quick Picks Section */}
          <motion.section variants={itemVariants} className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <motion.h2
                whileHover={{ scale: 1.02 }}
                className="text-2xl font-bold text-white"
              >
                Quick picks
              </motion.h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
              >
                Show all
              </motion.button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                {
                  id: "quick1",
                  title: "As It Was",
                  artist: "Harry Styles",
                  coverImageURL:
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
                  duration: "2:47",
                  plays: "1.2B",
                },
                {
                  id: "quick2",
                  title: "Heat Waves",
                  artist: "Glass Animals",
                  coverImageURL:
                    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop",
                  duration: "3:58",
                  plays: "2.1B",
                },
                {
                  id: "quick3",
                  title: "Stay",
                  artist: "The Kid LAROI, Justin Bieber",
                  coverImageURL:
                    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=100&h=100&fit=crop",
                  duration: "2:21",
                  plays: "1.8B",
                },
                {
                  id: "quick4",
                  title: "Industry Baby",
                  artist: "Lil Nas X, Jack Harlow",
                  coverImageURL:
                    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop",
                  duration: "3:32",
                  plays: "1.4B",
                },
                {
                  id: "quick5",
                  title: "Good 4 U",
                  artist: "Olivia Rodrigo",
                  coverImageURL:
                    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=100&h=100&fit=crop",
                  duration: "2:58",
                  plays: "1.1B",
                },
                {
                  id: "quick6",
                  title: "Levitating",
                  artist: "Dua Lipa",
                  coverImageURL:
                    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop",
                  duration: "3:23",
                  plays: "1.5B",
                },
              ].map((song, index) => (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                  className="flex items-center space-x-3 p-2 rounded-lg cursor-pointer group transition-all"
                >
                  <div className="relative">
                    <img
                      src={song.coverImageURL}
                      alt={song.title}
                      className="w-12 h-12 rounded object-cover cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        const enhancedSong = {
                          id: song.id,
                          title: song.title,
                          artist: song.artist,
                          album: "Top Hits",
                          coverImageURL: song.coverImageURL,
                          duration: 180,
                          url: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${Math.floor(Math.random() * 5) + 1}.mp3`,
                          genre: "Pop",
                          year: 2024,
                          explicit: false,
                        };
                        enhancedMusic.playSong(enhancedSong);
                        navigate("/player");

                        toast({
                          title: "🎵 Now Playing",
                          description: `${song.title} by ${song.artist}`,
                        });
                      }}
                    />
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ opacity: 1, scale: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const enhancedSong = {
                          id: song.id,
                          title: song.title,
                          artist: song.artist,
                          album: "Top Hits",
                          coverImageURL: song.coverImageURL,
                          duration: 180,
                          url: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${Math.floor(Math.random() * 5) + 1}.mp3`,
                          genre: "Pop",
                          year: 2024,
                          explicit: false,
                        };
                        enhancedMusic.playSong(enhancedSong);
                        navigate("/player");
                      }}
                      className="absolute inset-0 bg-black/50 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    </motion.button>
                  </div>
                  <div className="flex-1 min-w-0 font-medium text-white text-sm truncate">
                    {song.title}
                  </div>
                  <p className="text-gray-400 text-xs truncate">
                    {song.artist} • {song.plays} plays
                  </p>
                  <div className="text-gray-400 text-xs">{song.duration}</div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* YouTube Music-like Made for You Section */}
          <motion.section variants={itemVariants} className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <motion.h2
                whileHover={{ scale: 1.02 }}
                className="text-2xl font-bold text-white"
              >
                Made for you
              </motion.h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
              >
                Show all
              </motion.button>
            </div>

            <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
              {[
                {
                  id: "discover1",
                  title: "Discover Weekly",
                  description: "Your weekly mixtape of fresh music",
                  coverImageURL:
                    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop",
                  gradient: "from-purple-600 to-purple-800",
                },
                {
                  id: "discover2",
                  title: "Release Radar",
                  description: "New music from artists you follow",
                  coverImageURL:
                    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop",
                  gradient: "from-green-600 to-green-800",
                },
                {
                  id: "discover3",
                  title: "Daily Mix 1",
                  description: "Harry Styles, The Weeknd, Dua Lipa and more",
                  coverImageURL:
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
                  gradient: "from-blue-600 to-blue-800",
                },
                {
                  id: "discover4",
                  title: "Daily Mix 2",
                  description:
                    "Olivia Rodrigo, Taylor Swift, Billie Eilish and more",
                  coverImageURL:
                    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=200&h=200&fit=crop",
                  gradient: "from-pink-600 to-pink-800",
                },
                {
                  id: "discover5",
                  title: "Liked Songs",
                  description: "Your favorite tracks all in one place",
                  coverImageURL:
                    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop",
                  gradient: "from-purple-600 to-pink-600",
                  isLiked: true,
                },
              ].map((playlist, index) => (
                <motion.div
                  key={playlist.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="flex-shrink-0 w-44 cursor-pointer group"
                >
                  <div className="relative mb-3">
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${playlist.gradient} rounded-lg opacity-80`}
                    ></div>
                    <motion.img
                      whileHover={{ scale: 1.05 }}
                      src={playlist.coverImageURL}
                      alt={playlist.title}
                      className="w-full h-44 object-cover rounded-lg relative z-10 mix-blend-overlay cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        const enhancedSong = {
                          id: `playlist-${playlist.id}`,
                          title: playlist.title,
                          artist: "CATCH",
                          album: playlist.title,
                          coverImageURL: playlist.coverImageURL,
                          duration: 180,
                          url: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${Math.floor(Math.random() * 5) + 1}.mp3`,
                          genre: "Playlist",
                          year: 2024,
                          explicit: false,
                        };
                        enhancedMusic.playSong(enhancedSong);
                        navigate("/player");

                        toast({
                          title: "🎵 Now Playing",
                          description: `${playlist.title} playlist`,
                        });
                      }}
                    />
                    {playlist.isLiked && (
                      <div className="absolute top-3 left-3 z-20">
                        <Heart className="w-8 h-8 text-white fill-current" />
                      </div>
                    )}
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ opacity: 1, scale: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const enhancedSong = {
                          id: `playlist-${playlist.id}`,
                          title: playlist.title,
                          artist: "CATCH",
                          album: playlist.title,
                          coverImageURL: playlist.coverImageURL,
                          duration: 180,
                          url: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${Math.floor(Math.random() * 5) + 1}.mp3`,
                          genre: "Playlist",
                          year: 2024,
                          explicit: false,
                        };
                        enhancedMusic.playSong(enhancedSong);
                        navigate("/player");
                      }}
                      className="absolute bottom-3 right-3 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg transition-all group-hover:opacity-100 opacity-0 z-20"
                    >
                      <Play className="w-5 h-5 text-black ml-0.5" />
                    </motion.button>
                  </div>
                  <h3 className="font-medium text-white text-sm mb-1 truncate leading-tight">
                    {playlist.title}
                  </h3>
                  <p className="text-gray-400 text-xs leading-tight line-clamp-2">
                    {playlist.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* New Albums & Singles Section */}
          <motion.section variants={itemVariants} className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <motion.h2
                whileHover={{ scale: 1.02 }}
                className="text-2xl font-bold text-white"
              >
                New albums & singles
              </motion.h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
              >
                Show all
              </motion.button>
            </div>

            <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
              {albums.map((album, index) => (
                <motion.div
                  key={album.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ y: -4 }}
                  onHoverStart={() => setHoveredAlbum(album.id)}
                  onHoverEnd={() => setHoveredAlbum(null)}
                  className="flex-shrink-0 w-44 cursor-pointer group"
                >
                  <div className="relative mb-3">
                    <motion.img
                      src={album.coverImageURL}
                      alt={album.name}
                      className="w-full h-44 rounded-lg object-cover cursor-pointer"
                      whileHover={{ scale: 1.05 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const enhancedSong = {
                          id: album.id,
                          title: album.name,
                          artist: album.artist,
                          album: album.name,
                          coverImageURL: album.coverImageURL,
                          duration: 180,
                          url: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${Math.floor(Math.random() * 5) + 1}.mp3`,
                          genre: "Pop",
                          year: 2024,
                          explicit: false,
                        };
                        enhancedMusic.playSong(enhancedSong);
                        navigate("/player");

                        toast({
                          title: "🎵 Now Playing",
                          description: `${album.name} by ${album.artist}`,
                        });
                      }}
                    />
                    {album.isNew && (
                      <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                        NEW
                      </div>
                    )}
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ opacity: 1, scale: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const enhancedSong = {
                          id: album.id,
                          title: album.name,
                          artist: album.artist,
                          album: album.name,
                          coverImageURL: album.coverImageURL,
                          duration: 180,
                          url: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${Math.floor(Math.random() * 5) + 1}.mp3`,
                          genre: "Pop",
                          year: 2024,
                          explicit: false,
                        };
                        enhancedMusic.playSong(enhancedSong);
                        navigate("/player");
                      }}
                      className="absolute bottom-3 right-3 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg transition-all group-hover:opacity-100 opacity-0"
                    >
                      <Play className="w-5 h-5 text-black ml-0.5" />
                    </motion.button>
                  </div>
                  <h3 className="font-medium text-white text-sm mb-1 truncate leading-tight">
                    {album.name}
                  </h3>
                  <p className="text-gray-400 text-xs truncate leading-tight">
                    Album • {album.artist} • 2024
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Trending Music Section */}
          <motion.section variants={itemVariants} className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <motion.h2
                whileHover={{ scale: 1.02 }}
                className="text-2xl font-bold text-white"
              >
                Trending music
              </motion.h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
              >
                Show all
              </motion.button>
            </div>

            <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
              {[
                {
                  id: "trending1",
                  title: "Flowers",
                  artist: "Miley Cyrus",
                  coverImageURL:
                    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop",
                  trend: "↗ #1 in trending",
                },
                {
                  id: "trending2",
                  title: "Kill Bill",
                  artist: "SZA",
                  coverImageURL:
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
                  trend: "↗ #2 in trending",
                },
                {
                  id: "trending3",
                  title: "Anti-Hero",
                  artist: "Taylor Swift",
                  coverImageURL:
                    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=200&h=200&fit=crop",
                  trend: "��� #3 in trending",
                },
                {
                  id: "trending4",
                  title: "Unholy",
                  artist: "Sam Smith, Kim Petras",
                  coverImageURL:
                    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop",
                  trend: "↗ #4 in trending",
                },
                {
                  id: "trending5",
                  title: "Creepin'",
                  artist: "Metro Boomin, The Weeknd, 21 Savage",
                  coverImageURL:
                    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop",
                  trend: "↗ #5 in trending",
                },
              ].map((track, index) => (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="flex-shrink-0 w-44 cursor-pointer group"
                >
                  <div className="relative mb-3">
                    <motion.img
                      whileHover={{ scale: 1.05 }}
                      src={track.coverImageURL}
                      alt={track.title}
                      className="w-full h-44 rounded-lg object-cover cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        const enhancedSong = {
                          id: track.id,
                          title: track.title,
                          artist: track.artist,
                          album: "Trending Hits",
                          coverImageURL: track.coverImageURL,
                          duration: 180,
                          url: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${Math.floor(Math.random() * 5) + 1}.mp3`,
                          genre: "Pop",
                          year: 2024,
                          explicit: false,
                        };
                        enhancedMusic.playSong(enhancedSong);
                        navigate("/player");

                        toast({
                          title: "🔥 Now Playing",
                          description: `${track.title} by ${track.artist} (Trending)`,
                        });
                      }}
                    />
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                      🔥 TRENDING
                    </div>
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ opacity: 1, scale: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const enhancedSong = {
                          id: track.id,
                          title: track.title,
                          artist: track.artist,
                          album: "Trending Hits",
                          coverImageURL: track.coverImageURL,
                          duration: 180,
                          url: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${Math.floor(Math.random() * 5) + 1}.mp3`,
                          genre: "Pop",
                          year: 2024,
                          explicit: false,
                        };
                        enhancedMusic.playSong(enhancedSong);
                        navigate("/player");
                      }}
                      className="absolute bottom-3 right-3 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg transition-all group-hover:opacity-100 opacity-0"
                    >
                      <Play className="w-5 h-5 text-black ml-0.5" />
                    </motion.button>
                  </div>
                  <h3 className="font-medium text-white text-sm mb-1 truncate leading-tight">
                    {track.title}
                  </h3>
                  <p className="text-gray-400 text-xs truncate leading-tight mb-1">
                    Song • {track.artist}
                  </p>
                  <p className="text-green-400 text-xs font-medium">
                    {track.trend}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Album Tracks Section */}
          <motion.section variants={itemVariants} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <motion.h2
                whileHover={{ scale: 1.02 }}
                className="text-xl font-bold flex items-center space-x-2"
              >
                <Music className="w-5 h-5 text-foreground" />
                <span>Album Tracks</span>
              </motion.h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="text-gray-400 dark:text-gray-400 light:text-gray-600 hover:text-white dark:hover:text-white light:hover:text-black text-sm font-medium transition-colors"
              >
                View All
              </motion.button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {[
                {
                  id: "album1",
                  title: "After Hours",
                  artist: "The Weeknd",
                  tracks: [
                    "Blinding Lights",
                    "Heartless",
                    "In Your Eyes",
                    "Save Your Tears",
                  ],
                  coverImageURL:
                    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
                },
                {
                  id: "album2",
                  title: "Fine Line",
                  artist: "Harry Styles",
                  tracks: [
                    "Watermelon Sugar",
                    "Adore You",
                    "Golden",
                    "Falling",
                  ],
                  coverImageURL:
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop",
                },
              ].map((album, index) => (
                <motion.div
                  key={album.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.2 }}
                  className="bg-black rounded-lg p-4 overflow-hidden"
                  style={{
                    boxShadow: `
                      0 0 0 1px rgba(236, 72, 153, 0.6),
                      inset 0 0 0 1px rgba(236, 72, 153, 0.3)
                    `,
                  }}
                >
                  <div className="flex items-start space-x-4 mb-4">
                    <img
                      src={album.coverImageURL}
                      alt={album.title}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg mb-1">
                        {album.title}
                      </h3>
                      <p className="text-purple-accent text-sm">
                        {album.artist}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {album.tracks.map((track, trackIndex) => (
                      <motion.div
                        key={track}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.8 + index * 0.2 + trackIndex * 0.1,
                        }}
                        whileHover={{
                          backgroundColor: "rgba(158, 64, 252, 0.15)",
                        }}
                        className="flex items-center justify-between p-2 rounded cursor-pointer hover:bg-purple-primary/10 transition-all group"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-400 text-sm w-6">
                            {trackIndex + 1}
                          </span>
                          <span className="text-white group-hover:text-purple-accent transition-colors">
                            {track}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <motion.button
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-8 h-8 bg-black rounded-full flex items-center justify-center transition-all relative"
                            style={{
                              boxShadow: `
                                0 0 0 1px rgba(236, 72, 153, 0.6),
                                inset 0 0 0 1px rgba(236, 72, 153, 0.3)
                              `,
                            }}
                          >
                            <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                              <Play className="w-2 h-2 text-white ml-0.5" />
                            </div>
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Enhanced Songs Section */}
          <motion.section variants={itemVariants}>
            <div className="flex items-center justify-between mb-4">
              <motion.h2
                whileHover={{ scale: 1.02 }}
                className="text-xl font-bold flex items-center space-x-2"
              >
                <Music className="w-5 h-5 text-foreground" />
                <span>Popular Songs</span>
              </motion.h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="text-gray-400 dark:text-gray-400 light:text-gray-600 hover:text-white dark:hover:text-white light:hover:text-black text-sm font-medium transition-colors flex items-center space-x-1"
              >
                <span>Show all</span>
                <Star className="w-3 h-3" />
              </motion.button>
            </div>

            <div className="space-y-2">
              {tracks.map((song, index) => (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  whileHover={{
                    scale: 1.02,
                    backgroundColor: "rgba(158, 64, 252, 0.15)",
                    transition: { type: "spring", stiffness: 400, damping: 25 },
                  }}
                  onClick={() => handlePlayEnhancedSong(song)}
                  className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-900 transition-all cursor-pointer group bg-black"
                  style={{
                    boxShadow: `
                      0 0 0 1px rgba(236, 72, 153, 0.6),
                      inset 0 0 0 1px rgba(236, 72, 153, 0.3)
                    `,
                  }}
                >
                  <div className="relative">
                    <motion.img
                      src={song.coverImageURL}
                      alt={song.title}
                      className="w-24 h-24 rounded-lg object-cover"
                      whileHover={{ scale: 1.1 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                      }}
                    />
                    <motion.button
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      className="absolute inset-0 bg-black/60 rounded-md flex items-center justify-center transition-opacity"
                    >
                      {currentSong === song.id && isPlaying ? (
                        <Pause className="w-4 h-4 text-white" />
                      ) : (
                        <Play className="w-4 h-4 text-white ml-0.5" />
                      )}
                    </motion.button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-base truncate leading-tight">
                      {song.title}
                    </h3>
                    <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-sm truncate leading-tight">
                      {song.artist}
                    </p>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileHover={{ opacity: 1, x: 0 }}
                    className="flex items-center space-x-3"
                  >
                    <motion.button
                      onClick={(e) => handleLikeSong(song.id, e)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 bg-black rounded-full transition-all relative"
                      style={{
                        boxShadow: `
                          0 0 0 1px rgba(236, 72, 153, 0.6),
                          inset 0 0 0 1px rgba(236, 72, 153, 0.3)
                        `,
                      }}
                    >
                      <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                        <Heart
                          className={`w-3 h-3 transition-all ${
                            likedSongs.has(song.id)
                              ? "fill-current text-neon-green"
                              : "text-white"
                          }`}
                        />
                      </div>
                    </motion.button>

                    <span className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-sm min-w-[40px]">
                      {song.duration}
                    </span>

                    <motion.button
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 bg-black rounded-full transition-all relative"
                      style={{
                        boxShadow: `
                          0 0 0 1px rgba(236, 72, 153, 0.6),
                          inset 0 0 0 1px rgba(236, 72, 153, 0.3)
                        `,
                      }}
                    >
                      <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                        <MoreHorizontal className="w-3 h-3 text-white" />
                      </div>
                    </motion.button>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Activity Feed Section */}
          {userData && (
            <motion.section variants={itemVariants} className="mb-8">
              <ActivityFeed limit={5} showHeader={true} />
            </motion.section>
          )}
        </main>

        {/* Enhanced Music Player */}
        <EnhancedMiniPlayer />

        {/* Mobile Footer */}
        <MobileFooter />
      </motion.div>
    </div>
  );
}
