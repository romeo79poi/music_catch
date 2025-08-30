import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Filter,
  MapPin,
  Music,
  Users,
  UserPlus,
  UserCheck,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Sparkles,
  TrendingUp,
  Globe,
  Camera,
  Mic,
  Headphones,
  Star,
  Crown,
  Award,
  Verified,
  Eye,
  RefreshCw,
  Settings,
  SlidersHorizontal,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import MobileFooter from "../components/MobileFooter";
import { useFirebase } from "../context/FirebaseContext";

interface DiscoverUser {
  id: string;
  displayName: string;
  username: string;
  avatar: string;
  bio: string;
  location?: string;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen?: Date;
  followers: number;
  following: number;
  mutualFriends: number;
  isFollowing: boolean;
  tags: string[];
  coverImage?: string;
  stats: {
    totalTracks: number;
    totalPlays: number;
    monthlyListeners: number;
  };
  badges: string[];
  distance?: number; // in km
  matchPercentage?: number;
}

interface DiscoverFilter {
  genre: string[];
  location: string;
  age: { min: number; max: number };
  distance: number; // in km
  onlineOnly: boolean;
  verifiedOnly: boolean;
  hasProfilePicture: boolean;
}

// Sample discover users
const sampleUsers: DiscoverUser[] = [
  {
    id: "user1",
    displayName: "Emma Watson",
    username: "emmawatson",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b1bb?w=200&h=200&fit=crop&crop=face",
    bio: "Singer-songwriter 🎵 | Love indie and acoustic music | London based 🇬🇧",
    location: "London, UK",
    isVerified: true,
    isOnline: true,
    followers: 12500,
    following: 890,
    mutualFriends: 8,
    isFollowing: false,
    tags: ["singer", "songwriter", "indie", "acoustic"],
    coverImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=200&fit=crop",
    stats: {
      totalTracks: 45,
      totalPlays: 890000,
      monthlyListeners: 25000,
    },
    badges: ["verified", "top_artist"],
    distance: 2.5,
    matchPercentage: 95,
  },
  {
    id: "user2",
    displayName: "Alex Rodriguez",
    username: "alexrodriguez",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    bio: "DJ & Producer 🎧 | Electronic & House Music | NYC vibes 🌆",
    location: "New York, USA",
    isVerified: false,
    isOnline: false,
    lastSeen: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    followers: 8900,
    following: 1200,
    mutualFriends: 3,
    isFollowing: true,
    tags: ["dj", "producer", "electronic", "house"],
    stats: {
      totalTracks: 67,
      totalPlays: 450000,
      monthlyListeners: 15000,
    },
    badges: ["trending"],
    distance: 5.2,
    matchPercentage: 87,
  },
  {
    id: "user3",
    displayName: "Sophia Chen",
    username: "sophiachen",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    bio: "Classical pianist 🎹 | Music teacher | Sharing the love of music ✨",
    location: "San Francisco, USA",
    isVerified: true,
    isOnline: true,
    followers: 15600,
    following: 670,
    mutualFriends: 12,
    isFollowing: false,
    tags: ["pianist", "classical", "teacher", "composer"],
    stats: {
      totalTracks: 23,
      totalPlays: 320000,
      monthlyListeners: 8500,
    },
    badges: ["verified", "collaboration_king"],
    distance: 8.7,
    matchPercentage: 92,
  },
  {
    id: "user4",
    displayName: "Marcus Johnson",
    username: "marcusjohnson",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    bio: "Hip-hop artist 🎤 | Rapper & Songwriter | Telling stories through music",
    location: "Atlanta, USA",
    isVerified: false,
    isOnline: false,
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    followers: 22000,
    following: 450,
    mutualFriends: 5,
    isFollowing: false,
    tags: ["rapper", "hip-hop", "songwriter", "storyteller"],
    stats: {
      totalTracks: 89,
      totalPlays: 1200000,
      monthlyListeners: 45000,
    },
    badges: ["trending", "top_artist"],
    distance: 12.3,
    matchPercentage: 89,
  },
];

const genres = ["Pop", "Rock", "Hip-Hop", "Electronic", "Classical", "Jazz", "Country", "R&B", "Indie", "Folk"];

export default function Discover() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: firebaseUser } = useFirebase();

  // State management
  const [users, setUsers] = useState<DiscoverUser[]>(sampleUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<"discover" | "nearby" | "trending">("discover");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<DiscoverFilter>({
    genre: [],
    location: "",
    age: { min: 18, max: 65 },
    distance: 50,
    onlineOnly: false,
    verifiedOnly: false,
    hasProfilePicture: true,
  });

  const handleFollow = (userId: string) => {
    setUsers(prev => 
      prev.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              isFollowing: !user.isFollowing,
              followers: user.isFollowing ? user.followers - 1 : user.followers + 1
            }
          : user
      )
    );

    const user = users.find(u => u.id === userId);
    if (user) {
      toast({
        title: user.isFollowing ? "Unfollowed" : "Following",
        description: user.isFollowing 
          ? `You unfollowed ${user.displayName}`
          : `You're now following ${user.displayName}`,
      });
    }
  };

  const handleMessage = (user: DiscoverUser) => {
    navigate('/messages', { 
      state: { 
        profileUser: {
          id: user.id,
          displayName: user.displayName,
          username: user.username,
          avatar: user.avatar,
        }
      }
    });
  };

  const handleViewProfile = (user: DiscoverUser) => {
    navigate(`/profile/${user.username}`, { 
      state: { 
        userProfile: user
      }
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const getBadgeInfo = (badge: string) => {
    switch (badge) {
      case "verified":
        return { icon: Verified, color: "text-blue-400", label: "Verified" };
      case "top_artist":
        return { icon: Crown, color: "text-yellow-400", label: "Top Artist" };
      case "trending":
        return { icon: TrendingUp, color: "text-purple-400", label: "Trending" };
      case "collaboration_king":
        return { icon: Users, color: "text-green-400", label: "Collab Pro" };
      default:
        return { icon: Award, color: "text-gray-400", label: badge };
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.bio.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filters.onlineOnly && !user.isOnline) return false;
    if (filters.verifiedOnly && !user.isVerified) return false;
    if (filters.distance < (user.distance || 0)) return false;
    
    return matchesSearch;
  });

  const sortedUsers = filteredUsers.sort((a, b) => {
    switch (selectedTab) {
      case "nearby":
        return (a.distance || 0) - (b.distance || 0);
      case "trending":
        return b.stats.monthlyListeners - a.stats.monthlyListeners;
      default:
        return (b.matchPercentage || 0) - (a.matchPercentage || 0);
    }
  });

  return (
    <div className="h-screen bg-background text-foreground relative overflow-hidden theme-transition max-w-sm mx-auto">
      <div className="fixed inset-0 bg-gradient-to-b from-background to-secondary/30 theme-transition"></div>
      
      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border theme-transition"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>

          <h1 className="text-lg font-bold text-foreground">Discover</h1>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5 text-foreground" />
          </motion.button>
        </motion.header>

        {/* Search */}
        <div className="px-4 py-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-muted rounded-full text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {[
            { id: "discover", label: "For You", icon: Sparkles },
            { id: "nearby", label: "Nearby", icon: MapPin },
            { id: "trending", label: "Trending", icon: TrendingUp },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 transition-colors ${
                selectedTab === tab.id
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-muted/50 border-b border-border overflow-hidden"
            >
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Filters</h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFilters({
                      genre: [],
                      location: "",
                      age: { min: 18, max: 65 },
                      distance: 50,
                      onlineOnly: false,
                      verifiedOnly: false,
                      hasProfilePicture: true,
                    })}
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    Clear All
                  </motion.button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.onlineOnly}
                      onChange={(e) => setFilters(prev => ({ ...prev, onlineOnly: e.target.checked }))}
                      className="rounded border-border text-primary focus:ring-primary/50"
                    />
                    <span className="text-sm text-foreground">Online only</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.verifiedOnly}
                      onChange={(e) => setFilters(prev => ({ ...prev, verifiedOnly: e.target.checked }))}
                      className="rounded border-border text-primary focus:ring-primary/50"
                    />
                    <span className="text-sm text-foreground">Verified only</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Distance: {filters.distance}km
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={filters.distance}
                    onChange={(e) => setFilters(prev => ({ ...prev, distance: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto pb-20">
          <AnimatePresence>
            {sortedUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ delay: index * 0.1 }}
                className="relative bg-card/30 backdrop-blur-sm rounded-2xl m-4 p-4 border border-border/50 shadow-lg"
              >
                {/* Cover Image */}
                {user.coverImage && (
                  <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-20">
                    <img
                      src={user.coverImage}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
                  </div>
                )}

                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={user.avatar || `https://via.placeholder.com/64?text=${user.displayName.charAt(0)}`}
                          alt={user.displayName}
                          className="w-16 h-16 rounded-full object-cover border-2 border-background shadow-md cursor-pointer"
                          onClick={() => handleViewProfile(user)}
                        />
                        {user.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background"></div>
                        )}
                        
                        {/* Match percentage */}
                        {user.matchPercentage && selectedTab === "discover" && (
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                            <span className="text-xs font-bold text-primary-foreground">
                              {user.matchPercentage}%
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-bold text-foreground cursor-pointer" onClick={() => handleViewProfile(user)}>
                            {user.displayName}
                          </h3>
                          {user.isVerified && (
                            <Verified className="w-4 h-4 text-blue-500" />
                          )}
                          {user.badges.length > 0 && (
                            <div className="flex space-x-1">
                              {user.badges.slice(0, 2).map((badge, i) => {
                                const badgeInfo = getBadgeInfo(badge);
                                const IconComponent = badgeInfo.icon;
                                return (
                                  <IconComponent key={i} className={`w-3 h-3 ${badgeInfo.color}`} />
                                );
                              })}
                            </div>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-1">@{user.username}</p>
                        
                        {user.location && (
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span>{user.location}</span>
                            {user.distance && (
                              <span>• {user.distance}km away</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </motion.button>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-foreground mb-4 leading-relaxed">{user.bio}</p>

                  {/* Tags */}
                  {user.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {user.tags.slice(0, 4).map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-sm font-bold text-foreground">
                        {formatNumber(user.followers)}
                      </p>
                      <p className="text-xs text-muted-foreground">Followers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-foreground">
                        {formatNumber(user.stats.totalPlays)}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Plays</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-foreground">
                        {user.stats.totalTracks}
                      </p>
                      <p className="text-xs text-muted-foreground">Tracks</p>
                    </div>
                  </div>

                  {/* Mutual Friends */}
                  {user.mutualFriends > 0 && (
                    <div className="flex items-center space-x-2 mb-4 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{user.mutualFriends} mutual friends</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleFollow(user.id)}
                      className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium transition-all ${
                        user.isFollowing
                          ? "bg-green-500/20 text-green-500 border border-green-500/30"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {user.isFollowing ? (
                        <UserCheck className="w-4 h-4" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      <span>{user.isFollowing ? "Following" : "Follow"}</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleMessage(user)}
                      className="flex items-center justify-center py-3 px-4 bg-muted hover:bg-muted/80 rounded-xl transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 text-foreground" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center justify-center py-3 px-4 bg-muted hover:bg-muted/80 rounded-xl transition-colors"
                    >
                      <Share2 className="w-4 h-4 text-foreground" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {sortedUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <Users className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No users found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filters
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSearchQuery("");
                  setShowFilters(false);
                }}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium"
              >
                <RefreshCw className="w-4 h-4 mr-2 inline" />
                Reset Search
              </motion.button>
            </div>
          )}
        </div>
      </div>

      <MobileFooter />
    </div>
  );
}
