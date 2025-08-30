import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Settings,
  User,
  Music,
  Play,
  Pause,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Edit3,
  Camera,
  Users,
  UserPlus,
  UserCheck,
  Star,
  TrendingUp,
  Calendar,
  MapPin,
  Link2,
  Instagram,
  Twitter,
  Youtube,
  Globe,
  Verified,
  Crown,
  Award,
  Headphones,
  Download,
  Eye,
  BarChart3,
  DollarSign,
  Plus,
  Grid3X3,
  ListMusic,
  Clock,
  Flame,
  Sparkles,
  Upload as UploadIcon,
  Save,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import MobileFooter from "../components/MobileFooter";
import { UserProfile as BackendUserProfile, Song } from "@shared/api";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useMusic } from "../context/MusicContextSupabase";
import { userDataService, EnhancedUserData } from "../lib/user-data-service";

// Use enhanced user data type
type UserProfile = EnhancedUserData & {
  coverImage: string;
  location: string;
  joinedDate: Date;
  stats: {
    followers: number;
    following: number;
    totalPlays: number;
    totalTracks: number;
    totalPlaylists: number;
    monthlyListeners: number;
  };
  badges: string[];
};

interface Track {
  id: string;
  title: string;
  coverUrl: string;
  duration: number;
  plays: number;
  likes: number;
  comments: number;
  uploadDate: Date;
  isPublic: boolean;
  genre?: string;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  trackCount: number;
  isPublic: boolean;
  createdDate: Date;
  plays: number;
}

// No more sample data - all data will be fetched from backend

interface RecentlyPlayedTrack {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  playedAt: string;
  duration: number;
  isCurrentlyPlaying?: boolean;
}

// No more sample data - all data will be fetched from backend

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: authUser, loading: authLoading } = useAuth();
  // Social features will be implemented with backend later
  const socialFollowersCount = 0;
  const socialFollowingCount = 0;

  // State management
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayedTrack[]>(
    [],
  );
  const [selectedTab, setSelectedTab] = useState("tracks");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentPlayingTrack, setCurrentPlayingTrack] = useState<string | null>(
    null,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Real data fetching functions
  const fetchUserTracks = async (userId: string) => {
    try {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`/api/v1/users/${userId}/tracks`, {
        credentials: "include",
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setTracks(data.tracks || []);
      } else {
        // Handle non-OK responses gracefully
        console.warn(
          `Failed to fetch user tracks: ${response.status} ${response.statusText}`,
        );
        const text = await response.text();
        if (text.startsWith("<!DOCTYPE") || text.startsWith("<html")) {
          console.error(
            "Server returned HTML instead of JSON - API endpoint might not exist",
          );
        } else {
          console.error("Response body:", text);
        }
        setTracks([]); // Set empty array as fallback
      }
    } catch (error) {
      console.error("Error fetching user tracks:", error);
      setTracks([]); // Set empty array as fallback
    }
  };

  const fetchUserPlaylists = async (userId: string) => {
    try {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`/api/v1/users/${userId}/playlists`, {
        credentials: "include",
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setPlaylists(data.playlists || []);
      } else {
        // Handle non-OK responses gracefully
        console.warn(
          `Failed to fetch user playlists: ${response.status} ${response.statusText}`,
        );
        const text = await response.text();
        if (text.startsWith("<!DOCTYPE") || text.startsWith("<html")) {
          console.error(
            "Server returned HTML instead of JSON - API endpoint might not exist",
          );
        } else {
          console.error("Response body:", text);
        }
        setPlaylists([]); // Set empty array as fallback
      }
    } catch (error) {
      console.error("Error fetching user playlists:", error);
      setPlaylists([]); // Set empty array as fallback
    }
  };

  const fetchRecentlyPlayed = async (userId: string) => {
    try {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`/api/profile/${userId}/recently-played`, {
        credentials: "include",
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setRecentlyPlayed(data.recently_played || []);
      }
    } catch (error) {
      console.error("Error fetching recently played:", error);
    }
  };

  // Real social functions
  const isFollowingUser = (userId: string) => {
    return isFollowing;
  };

  const followUser = async (userId: string, userProfile: any) => {
    try {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`/api/v1/users/${userId}/follow`, {
        method: "POST",
        credentials: "include",
        headers,
      });

      if (response.ok) {
        setIsFollowing(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error following user:", error);
      return false;
    }
  };

  const unfollowUser = async (userId: string) => {
    try {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`/api/v1/users/${userId}/follow`, {
        method: "DELETE",
        credentials: "include",
        headers,
      });

      if (response.ok) {
        setIsFollowing(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error unfollowing user:", error);
      return false;
    }
  };

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: "",
    username: "",
    bio: "",
    location: "",
    socialLinks: {
      instagram: "",
      twitter: "",
      youtube: "",
    },
  });

  // Helper function to repair localStorage data if needed
  const repairLocalStorageData = () => {
    try {
      const localUserData = localStorage.getItem("currentUser");
      const userAvatar = localStorage.getItem("userAvatar");

      if (localUserData) {
        const userData = JSON.parse(localUserData);

        // If userAvatar exists but userData doesn't have profileImageURL, sync them
        if (userAvatar && !userData.profileImageURL && !userData.avatar) {
          userData.profileImageURL = userAvatar;
          userData.avatar = userAvatar;
          localStorage.setItem("currentUser", JSON.stringify(userData));
        }

        // If userData has profileImageURL but userAvatar is missing, sync them
        if ((userData.profileImageURL || userData.avatar) && !userAvatar) {
          const imageURL = userData.profileImageURL || userData.avatar;
          localStorage.setItem("userAvatar", imageURL);
        }
      }
    } catch (error) {}
  };

  // Fetch profile data using enhanced user data service
  const fetchProfile = async () => {
    try {
      setLoading(true);

      if (!authUser) {
        toast({
          title: "Authentication required",
          description: "Please sign in to view your profile",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      // Load user data from backend JWT authentication
      console.log("🔄 Loading user profile from backend...");

      // Decide data source: enhanced (uid present) vs backend JWT
      const enhancedUserData: any = (authUser as any)?.uid
        ? (authUser as any)
        : null;

      if (enhancedUserData) {
        // Convert enhanced user data to profile format
        const enhancedProfile: UserProfile = {
          ...enhancedUserData,
          id: enhancedUserData.uid,
          displayName: enhancedUserData.name,
          isVerified: enhancedUserData.isVerified,
          isArtist: enhancedUserData.isArtist,
          avatar: enhancedUserData.avatar || enhancedUserData.profileImageURL,
          coverImage: "",
          location:
            enhancedUserData.city && enhancedUserData.country
              ? `${enhancedUserData.city}, ${enhancedUserData.country}`
              : enhancedUserData.city || enhancedUserData.country || "",
          joinedDate: new Date(enhancedUserData.creationTime),
          socialLinks: {
            instagram: "",
            twitter: "",
            youtube: "",
          },
          stats: {
            followers: enhancedUserData.followersCount,
            following: enhancedUserData.followingCount,
            totalPlays: 0,
            totalTracks: 0,
            totalPlaylists: 0,
            monthlyListeners: 0,
          },
          badges: enhancedUserData.isPremium ? ["premium"] : [],
        };

        setProfile(enhancedProfile);

        // Load user content data
        await Promise.all([
          fetchUserTracks(enhancedProfile.id),
          fetchUserPlaylists(enhancedProfile.id),
          fetchRecentlyPlayed(enhancedProfile.id),
        ]);

        // Update edit form with enhanced data
        setEditForm({
          displayName: enhancedProfile.displayName,
          username: enhancedProfile.username,
          bio: enhancedProfile.bio || "",
          location: enhancedProfile.location,
          socialLinks: enhancedProfile.socialLinks,
        });
      } else {
        // Fallback to basic user profile from backend auth
        const backendProfile: UserProfile = {
          uid: authUser.id,
          id: authUser.id,
          displayName: authUser.name || "User",
          name: authUser.name || "User",
          username: authUser.username || "user",
          email: authUser.email || "",
          emailVerified: authUser.verified || false,
          bio: authUser.bio || "Music lover 🎵",
          avatar: authUser.avatar_url || "",
          profileImageURL: authUser.avatar_url || "",
          photoURL: authUser.avatar_url || "",
          coverImage: "",
          location: authUser.location || "",
          website: authUser.website || "",
          isVerified: authUser.verified || false,
          isArtist: false,
          isPremium: authUser.premium || false,
          accountType: authUser.premium ? "Premium" : ("Free" as const),
          memberSince: authUser.created_at || "",
          followersCount: authUser.followers_count || 0,
          followingCount: authUser.following_count || 0,
          isPublic: true,
          joinedDate: new Date(authUser.created_at || Date.now()),
          creationTime: authUser.created_at || new Date().toISOString(),
          lastSignInTime: authUser.updated_at || new Date().toISOString(),
          socialLinks: {
            instagram: "",
            twitter: "",
            youtube: "",
          },
          stats: {
            followers: authUser.followers_count || 0,
            following: authUser.following_count || 0,
            totalPlays: 0,
            totalTracks: 0,
            totalPlaylists: 0,
            monthlyListeners: 0,
          },
          badges: authUser.premium ? ["premium"] : [],
          dataSource: "backend" as const,
        };

        setProfile(backendProfile);

        // Load user content data
        await Promise.all([
          fetchUserTracks(backendProfile.id),
          fetchUserPlaylists(backendProfile.id),
          fetchRecentlyPlayed(backendProfile.id),
        ]);

        // Update edit form with backend data
        setEditForm({
          displayName: backendProfile.displayName,
          username: backendProfile.username,
          bio: backendProfile.bio,
          location: backendProfile.location,
          socialLinks: backendProfile.socialLinks,
        });
      }
    } catch (error) {
      console.error("❌ Error fetching profile:", error);
      toast({
        title: "Failed to load profile",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Load data when backend auth user is available
  useEffect(() => {
    if (!authLoading) {
      fetchProfile();
    }
  }, [authUser, authLoading]);

  const formatNumber = (num: number | undefined | null) => {
    if (num == null || isNaN(num)) {
      return "0";
    }

    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handlePlay = (trackId: string) => {
    if (currentPlayingTrack === trackId) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentPlayingTrack(trackId);
      setIsPlaying(true);
    }
  };

  const handleFollow = async () => {
    if (!profile) return;

    const currentlyFollowing = isFollowingUser(profile.id);

    try {
      if (currentlyFollowing) {
        const success = await unfollowUser(profile.id);
        if (success) {
          setProfile((prev) =>
            prev
              ? {
                  ...prev,
                  stats: {
                    ...prev.stats,
                    followers: Math.max(0, prev.stats.followers - 1),
                  },
                }
              : null,
          );
          toast({
            title: "Unfollowed",
            description: `You unfollowed ${profile.displayName}`,
          });
        }
      } else {
        const socialUser = {
          id: profile.id,
          displayName: profile.displayName,
          username: profile.username,
          avatar: profile.avatar,
          bio: profile.bio,
          isVerified: profile.isVerified,
          isOnline: true, // Assume online for now
          location: profile.location,
        };

        const success = await followUser(profile.id, socialUser);
        if (success) {
          setProfile((prev) =>
            prev
              ? {
                  ...prev,
                  stats: {
                    ...prev.stats,
                    followers: prev.stats.followers + 1,
                  },
                }
              : null,
          );
          toast({
            title: "Following",
            description: `You're now following ${profile.displayName}`,
          });
        }
      }
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = () => {
    if (!profile) return;

    if (navigator.share) {
      navigator.share({
        title: `${profile.displayName} on Catch Music`,
        text: profile.bio,
        url: `https://catchmusic.app/profile/${profile.username}`,
      });
    } else {
      navigator.clipboard.writeText(
        `https://catchmusic.app/profile/${profile.username}`,
      );
      toast({
        title: "Profile link copied!",
        description: "Share this link with your friends",
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!profile || !authUser) return;

    try {
      setUploading(true);

      // Validate required fields
      if (!editForm.displayName.trim()) {
        toast({
          title: "Validation Error",
          description: "Display name is required",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      if (!editForm.username.trim()) {
        toast({
          title: "Validation Error",
          description: "Username is required",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      // Use backend authentication to update profile
      const updateData = {
        name: editForm.displayName,
        username: editForm.username,
        bio: editForm.bio,
        avatar_url: profile.avatar,
      };

      const result = await updateProfile(updateData);

      if (result.success) {
        // Update local state with saved data
        const updatedProfile = {
          ...profile,
          displayName: editForm.displayName,
          name: editForm.displayName,
          username: editForm.username,
          bio: editForm.bio,
          location: editForm.location,
          socialLinks: {
            instagram: editForm.socialLinks.instagram || "",
            twitter: editForm.socialLinks.twitter || "",
            youtube: editForm.socialLinks.youtube || "",
          },
        };

        setProfile(updatedProfile);
        setIsEditing(false);

        toast({
          title: "Profile Updated",
          description:
            "Your profile has been successfully updated across all platforms",
        });
      } else {
        toast({
          title: "Update Failed",
          description: result.error || "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Network Error",
        description: "Please check your connection and try again",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCancelEdit = () => {
    if (!profile) return;

    setEditForm({
      displayName: profile.displayName,
      username: profile.username,
      bio: profile.bio,
      location: profile.location || "",
      socialLinks: {
        instagram: profile.socialLinks.instagram || "",
        twitter: profile.socialLinks.twitter || "",
        youtube: profile.socialLinks.youtube || "",
      },
    });
    setIsEditing(false);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && profile) {
      setUploading(true);

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const newAvatar = e.target?.result as string;

        // Update profile state
        setProfile((prev) => (prev ? { ...prev, avatar: newAvatar } : null));

        // Update profile via backend API
        try {
          await updateProfile({ avatar_url: newAvatar });
        } catch (error) {
          console.warn("⚠️ Failed to update avatar in backend:", error);
        }

        setUploading(false);
        toast({
          title: "Profile Image Updated",
          description: "Your profile image has been updated successfully",
        });
      };

      reader.onerror = (error) => {
        console.error("❌ Failed to read image file:", error);
        setUploading(false);
        toast({
          title: "Upload Failed",
          description: "Failed to read the image file",
          variant: "destructive",
        });
      };

      reader.readAsDataURL(file);
    }
  };

  const getBadgeInfo = (badge: string) => {
    switch (badge) {
      case "verified":
        return {
          icon: Verified,
          color: "text-blue-400",
          label: "Verified Artist",
        };
      case "top_artist":
        return { icon: Crown, color: "text-yellow-400", label: "Top Artist" };
      case "trending":
        return {
          icon: TrendingUp,
          color: "text-purple-400",
          label: "Trending",
        };
      case "collaboration_king":
        return {
          icon: Users,
          color: "text-green-400",
          label: "Collaboration Pro",
        };
      default:
        return { icon: Award, color: "text-gray-400", label: badge };
    }
  };

  // Show loading state
  if (authLoading || loading || !profile) {
    return (
      <div className="h-screen bg-background text-foreground relative overflow-hidden theme-transition max-w-sm mx-auto">
        <div className="fixed inset-0 bg-gradient-to-b from-background to-secondary/30 theme-transition"></div>
        <div className="relative z-10 flex flex-col h-screen">
          {/* Header */}
          <motion.header
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between px-3 py-2 bg-background/95 backdrop-blur-sm border-b border-border theme-transition"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </motion.button>
            <h1 className="text-base font-bold text-foreground">Profile</h1>
            <div className="w-8 h-8"></div>
          </motion.header>

          {/* Loading Content */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading profile...</p>
              {authUser && (
                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                  <p>🔥 Signed in as {authUser.email}</p>
                  <p>User ID: {authUser.id}</p>
                  <p>Email verified: {authUser.verified ? "Yes" : "No"}</p>
                  <p className="text-green-400">
                    ✓ Backend JWT authentication active
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Build tabs array with null checking
  const tabs = [
    { id: "tracks", label: "Tracks", count: tracks.length },
    { id: "playlists", label: "Playlists", count: playlists.length },
    { id: "history", label: "History", count: recentlyPlayed.length },
    { id: "about", label: "About" },
  ];

  if (profile?.isArtist) {
    tabs.splice(3, 0, { id: "analytics", label: "Analytics" });
  }

  return (
    <div className="h-screen bg-background text-foreground relative overflow-hidden theme-transition max-w-sm mx-auto">
      {/* App background */}
      <div className="fixed inset-0 bg-gradient-to-b from-background to-secondary/30 theme-transition"></div>

      <div className="relative z-10 flex flex-col h-screen">
        {/* Compact App Header */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between px-3 py-2 bg-background/95 backdrop-blur-sm border-b border-border theme-transition"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/home")}
            className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </motion.button>

          <h1 className="text-base font-bold text-foreground">Profile</h1>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/settings")}
            className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
          >
            <Settings className="w-5 h-5 text-foreground" />
          </motion.button>
        </motion.header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto pb-20">
          {/* Profile Info */}
          <div className="px-3 relative z-10 mt-4">
            {/* Avatar */}
            <div className="flex items-end justify-between mb-2">
              <div className="relative">
                <img
                  src={
                    profile.avatar ||
                    `https://via.placeholder.com/64?text=${profile.displayName.charAt(0)}`
                  }
                  alt={profile.displayName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-background shadow-md cursor-pointer"
                  onClick={() =>
                    document.getElementById("avatar-upload")?.click()
                  }
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://via.placeholder.com/64?text=${profile.displayName.charAt(0)}`;
                  }}
                />

                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              {/* Action Buttons */}
              {!isEditing && (
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 rounded-lg font-medium transition-all bg-muted hover:bg-muted/80 text-foreground border border-border"
                  >
                    <Edit3 className="w-4 h-4" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleFollow}
                    className={`px-6 py-3 rounded-lg font-bold text-sm transition-all border border-border min-w-[90px] ${
                      isFollowingUser(profile.id)
                        ? "bg-green-500/20 text-green-500 border-green-500/30 hover:bg-green-500/30"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {isFollowingUser(profile.id) ? (
                        <UserCheck className="w-4 h-4" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      <span>
                        {isFollowingUser(profile.id) ? "Following" : "Follow"}
                      </span>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      navigate("/messages", {
                        state: {
                          profileUser: {
                            id: profile.id,
                            displayName: profile.displayName,
                            username: profile.username,
                            avatar: profile.avatar,
                          },
                        },
                      })
                    }
                    className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg font-medium transition-all border border-border text-foreground"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </motion.button>
                </div>
              )}
            </div>

            {/* Name and Bio */}
            <div className="mb-2">
              {isEditing ? (
                <div className="space-y-4">
                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={editForm.displayName}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          displayName: e.target.value,
                        })
                      }
                      className="w-full p-3 bg-card border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-purple-primary/50"
                      placeholder="Your display name"
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) =>
                        setEditForm({ ...editForm, username: e.target.value })
                      }
                      className="w-full p-3 bg-card border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-purple-primary/50"
                      placeholder="@username"
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Bio
                    </label>
                    <textarea
                      rows={3}
                      value={editForm.bio}
                      onChange={(e) =>
                        setEditForm({ ...editForm, bio: e.target.value })
                      }
                      className="w-full p-3 bg-card border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-purple-primary/50"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) =>
                        setEditForm({ ...editForm, location: e.target.value })
                      }
                      className="w-full p-3 bg-card border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-purple-primary/50"
                      placeholder="Your location"
                    />
                  </div>

                  {/* Edit Mode Action Buttons */}
                  <div className="flex items-center space-x-2 mt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCancelEdit}
                      className="px-4 py-2 rounded-lg font-medium transition-all bg-muted hover:bg-muted/80 text-foreground border border-border"
                    >
                      <X className="w-4 h-4 mr-2 inline" />
                      Cancel
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSaveProfile}
                      disabled={uploading}
                      className="px-4 py-2 rounded-lg font-medium transition-all bg-purple-primary text-white disabled:opacity-50"
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2 inline" />
                      )}
                      {uploading ? "Saving..." : "Save"}
                    </motion.button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-2 mb-1">
                    <h1 className="text-lg font-bold text-foreground">
                      {profile.displayName}
                    </h1>
                    {profile.isArtist && (
                      <div className="px-1 py-0.5 bg-primary/10 rounded-full">
                        <span className="text-[10px] text-primary font-medium">
                          Artist
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    @{profile.username}
                  </p>
                  <p className="text-xs text-foreground leading-relaxed mb-2">
                    {profile.bio}
                  </p>

                  {/* Additional Profile Info from Signup */}
                  {(profile.gender || profile.dateOfBirth) && (
                    <div className="bg-card/50 rounded-lg p-2 mb-2 border border-border/50">
                      <p className="text-[10px] text-muted-foreground font-medium mb-1">
                        Profile Details
                      </p>
                      <div className="space-y-1">
                        {(profile as any).email && (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">
                              Email:
                            </span>
                            <span className="text-[10px] text-foreground">
                              {(profile as any).email}
                            </span>
                          </div>
                        )}
                        {(profile as any).provider && (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">
                              Sign-in method:
                            </span>
                            <span className="text-[10px] text-foreground capitalize">
                              {(profile as any).provider}
                            </span>
                          </div>
                        )}
                        {profile.email && (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">
                              Email:
                            </span>
                            <span className="text-[10px] text-foreground">
                              {profile.email}
                            </span>
                          </div>
                        )}
                        {profile.gender && (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">
                              Gender:
                            </span>
                            <span className="text-[10px] text-foreground">
                              {profile.gender}
                            </span>
                          </div>
                        )}
                        {profile.dateOfBirth && (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">
                              Age:
                            </span>
                            <span className="text-[10px] text-foreground">
                              {new Date().getFullYear() -
                                new Date(profile.dateOfBirth).getFullYear()}
                            </span>
                          </div>
                        )}
                        {profile.phone && (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">
                              Phone:
                            </span>
                            <span className="text-[10px] text-foreground">
                              {profile.phone.replace(
                                /(\d{3})(\d{3})(\d{4})/,
                                "($1) $2-$3",
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Location and Website */}
                  <div className="flex items-center space-x-3 text-xs text-muted-foreground mb-2">
                    {profile.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {formatDate(profile.joinedDate)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Stats */}
            {!isEditing && (
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setShowStats(true)}
                  className="text-center p-2 bg-card hover:bg-card/80 rounded-lg transition-colors border border-border"
                >
                  <p className="text-sm font-bold text-foreground">
                    {formatNumber(profile.stats.followers)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Followers</p>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setShowStats(true)}
                  className="text-center p-2 bg-card hover:bg-card/80 rounded-lg transition-colors border border-border"
                >
                  <p className="text-sm font-bold text-foreground">
                    {formatNumber(profile.stats.following)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Following</p>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setShowStats(true)}
                  className="text-center p-2 bg-card hover:bg-card/80 rounded-lg transition-colors border border-border"
                >
                  <p className="text-sm font-bold text-foreground">
                    {formatNumber(profile.stats.totalPlays)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Total Plays
                  </p>
                </motion.button>
              </div>
            )}

            {/* Recent Activity */}
            {!isEditing && (
              <div className="bg-card rounded-xl p-4 border border-border">
                <h3 className="text-sm font-medium text-foreground mb-3 flex items-center">
                  <Music className="w-4 h-4 mr-2 text-purple-primary" />
                  Recent Activity
                </h3>
                <div className="space-y-2">
                  {recentlyPlayed.slice(0, 3).map((track, index) => (
                    <div
                      key={track.id}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-8 h-8 rounded object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground text-sm">
                          {track.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {track.artist}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {track.playedAt}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Footer */}
        <MobileFooter />
      </div>
    </div>
  );
}
