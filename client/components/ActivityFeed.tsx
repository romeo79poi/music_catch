import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Share2,
  UserPlus,
  Music,
  Play,
  Pause,
  Download,
  MoreHorizontal,
  Eye,
  Headphones,
  Users,
  Star,
  TrendingUp,
  Clock,
  Calendar,
} from "lucide-react";
import { useSocial } from "../context/SocialContext";
import { useFirebase } from "../context/FirebaseContext";

interface ActivityItem {
  id: string;
  type: 'follow' | 'track_upload' | 'track_like' | 'playlist_create' | 'collaboration' | 'comment';
  userId: string;
  userName: string;
  userAvatar: string;
  userUsername: string;
  isVerified?: boolean;
  content: string;
  timestamp: Date;
  data?: {
    trackId?: string;
    trackTitle?: string;
    trackCover?: string;
    playlistId?: string;
    playlistName?: string;
    targetUserId?: string;
    targetUserName?: string;
    collaboratorId?: string;
    collaboratorName?: string;
  };
  metrics?: {
    likes: number;
    comments: number;
    shares: number;
    plays?: number;
  };
  isLiked?: boolean;
}

// Sample activity data
const sampleActivities: ActivityItem[] = [
  {
    id: "act1",
    type: "track_upload",
    userId: "user1",
    userName: "Emma Watson",
    userAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b1bb?w=150&h=150&fit=crop&crop=face",
    userUsername: "emmawatson",
    isVerified: true,
    content: "uploaded a new track",
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    data: {
      trackId: "track1",
      trackTitle: "Midnight Dreams",
      trackCover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
    },
    metrics: {
      likes: 156,
      comments: 23,
      shares: 12,
      plays: 2340,
    },
    isLiked: false,
  },
  {
    id: "act2",
    type: "follow",
    userId: "user2",
    userName: "Alex Rodriguez",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    userUsername: "alexrodriguez",
    content: "started following",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    data: {
      targetUserId: "user3",
      targetUserName: "Sophia Chen",
    },
    metrics: {
      likes: 45,
      comments: 8,
      shares: 3,
    },
    isLiked: true,
  },
  {
    id: "act3",
    type: "collaboration",
    userId: "user3",
    userName: "Sophia Chen",
    userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    userUsername: "sophiachen",
    isVerified: true,
    content: "collaborated with",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    data: {
      collaboratorId: "user4",
      collaboratorName: "Marcus Johnson",
      trackId: "track2",
      trackTitle: "Piano & Beats",
      trackCover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop",
    },
    metrics: {
      likes: 289,
      comments: 67,
      shares: 34,
      plays: 5670,
    },
    isLiked: false,
  },
  {
    id: "act4",
    type: "playlist_create",
    userId: "user4",
    userName: "Marcus Johnson",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    userUsername: "marcusjohnson",
    content: "created a new playlist",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    data: {
      playlistId: "playlist1",
      playlistName: "Hip-Hop Essentials",
    },
    metrics: {
      likes: 123,
      comments: 19,
      shares: 8,
    },
    isLiked: true,
  },
];

interface ActivityFeedProps {
  limit?: number;
  showHeader?: boolean;
  userId?: string; // If provided, show activities for specific user
}

export default function ActivityFeed({ limit = 10, showHeader = true, userId }: ActivityFeedProps) {
  const navigate = useNavigate();
  const { user: firebaseUser } = useFirebase();
  const { 
    isFollowing, 
    followUser, 
    unfollowUser, 
    getUserActivity,
    recordActivity 
  } = useSocial();

  // State
  const [activities, setActivities] = useState<ActivityItem[]>(sampleActivities);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadActivities();
  }, [userId]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      if (userId) {
        // Load activities for specific user
        const userActivities = await getUserActivity(userId);
        // Transform to ActivityItem format
        setActivities(sampleActivities.filter(act => act.userId === userId));
      } else {
        // Load activities from followed users
        setActivities(sampleActivities.slice(0, limit));
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadActivities();
    setRefreshing(false);
  };

  const handleLike = async (activityId: string) => {
    setActivities(prev => 
      prev.map(activity => 
        activity.id === activityId 
          ? { 
              ...activity, 
              isLiked: !activity.isLiked,
              metrics: {
                ...activity.metrics!,
                likes: activity.isLiked 
                  ? activity.metrics!.likes - 1 
                  : activity.metrics!.likes + 1
              }
            }
          : activity
      )
    );

    // Record activity
    await recordActivity('like', { activityId, type: 'activity_like' });
  };

  const handleComment = (activityId: string) => {
    // Navigate to activity detail with comment focus
    console.log('Comment on activity:', activityId);
  };

  const handleShare = (activityId: string) => {
    const activity = activities.find(act => act.id === activityId);
    if (activity && navigator.share) {
      navigator.share({
        title: `${activity.userName} ${activity.content}`,
        text: activity.content,
        url: `${window.location.origin}/activity/${activityId}`,
      });
    }
  };

  const handleUserClick = (userId: string, username: string) => {
    navigate(`/profile/${username}`);
  };

  const handleTrackClick = (trackId: string) => {
    // Navigate to track player
    navigate(`/player?track=${trackId}`);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'track_upload':
        return <Music className="w-4 h-4 text-purple-500" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'collaboration':
        return <Users className="w-4 h-4 text-green-500" />;
      case 'playlist_create':
        return <Star className="w-4 h-4 text-yellow-500" />;
      case 'track_like':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <TrendingUp className="w-4 h-4 text-gray-500" />;
    }
  };

  const renderActivityContent = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'track_upload':
        return (
          <div className="mt-3">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleTrackClick(activity.data?.trackId || '')}
              className="flex items-center space-x-3 p-3 bg-muted/50 rounded-xl cursor-pointer"
            >
              <img
                src={activity.data?.trackCover}
                alt={activity.data?.trackTitle}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{activity.data?.trackTitle}</h4>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Headphones className="w-3 h-3" />
                    <span>{formatNumber(activity.metrics?.plays || 0)}</span>
                  </div>
                  <span>3:24</span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full bg-primary/20 hover:bg-primary/30 flex items-center justify-center"
              >
                <Play className="w-4 h-4 text-primary" />
              </motion.button>
            </motion.div>
          </div>
        );

      case 'collaboration':
        return (
          <div className="mt-3">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-primary font-medium cursor-pointer" onClick={() => handleUserClick(activity.data?.collaboratorId || '', activity.data?.collaboratorName || '')}>
                @{activity.data?.collaboratorName}
              </span>
              <span className="text-muted-foreground">on</span>
            </div>
            {activity.data?.trackId && (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTrackClick(activity.data?.trackId || '')}
                className="flex items-center space-x-3 p-3 bg-muted/50 rounded-xl cursor-pointer"
              >
                <img
                  src={activity.data?.trackCover}
                  alt={activity.data?.trackTitle}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{activity.data?.trackTitle}</h4>
                  <p className="text-sm text-muted-foreground">Collaboration</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 rounded-full bg-primary/20 hover:bg-primary/30 flex items-center justify-center"
                >
                  <Play className="w-4 h-4 text-primary" />
                </motion.button>
              </motion.div>
            )}
          </div>
        );

      case 'follow':
        return (
          <div className="mt-2">
            <span className="text-primary font-medium cursor-pointer" onClick={() => handleUserClick(activity.data?.targetUserId || '', activity.data?.targetUserName || '')}>
              @{activity.data?.targetUserName}
            </span>
          </div>
        );

      case 'playlist_create':
        return (
          <div className="mt-2">
            <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-xl">
              <Star className="w-8 h-8 text-yellow-500" />
              <div>
                <h4 className="font-medium text-foreground">{activity.data?.playlistName}</h4>
                <p className="text-sm text-muted-foreground">Playlist</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-card/30 rounded-xl p-4 animate-pulse">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-muted rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
            <div className="h-20 bg-muted rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Activity Feed</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <motion.div
              animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 1, repeat: refreshing ? Infinity : 0 }}
            >
              <Clock className="w-4 h-4" />
            </motion.div>
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {activities.slice(0, limit).map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card/30 backdrop-blur-sm rounded-xl p-4 border border-border/50"
          >
            {/* Activity Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleUserClick(activity.userId, activity.userUsername)}
                  className="relative cursor-pointer"
                >
                  <img
                    src={activity.userAvatar}
                    alt={activity.userName}
                    className="w-10 h-10 rounded-full object-cover border border-border"
                  />
                  <div className="absolute -bottom-1 -right-1">
                    {getActivityIcon(activity.type)}
                  </div>
                </motion.div>

                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <motion.h3
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleUserClick(activity.userId, activity.userUsername)}
                      className="font-semibold text-foreground cursor-pointer"
                    >
                      {activity.userName}
                    </motion.h3>
                    {activity.isVerified && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>{activity.content}</span>
                    <span>•</span>
                    <span>{formatTime(activity.timestamp)}</span>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Activity Content */}
            {renderActivityContent(activity)}

            {/* Activity Actions */}
            {activity.metrics && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                <div className="flex items-center space-x-6">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleLike(activity.id)}
                    className={`flex items-center space-x-1 ${
                      activity.isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'
                    } transition-colors`}
                  >
                    <Heart className={`w-4 h-4 ${activity.isLiked ? 'fill-current' : ''}`} />
                    <span className="text-sm">{formatNumber(activity.metrics.likes)}</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleComment(activity.id)}
                    className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">{formatNumber(activity.metrics.comments)}</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleShare(activity.id)}
                    className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm">{formatNumber(activity.metrics.shares)}</span>
                  </motion.button>
                </div>

                {activity.metrics.plays && (
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">{formatNumber(activity.metrics.plays)}</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {activities.length === 0 && !loading && (
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No activity yet</h3>
          <p className="text-muted-foreground mb-4">
            Follow some users to see their latest activity
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/discover')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium"
          >
            Discover People
          </motion.button>
        </div>
      )}
    </div>
  );
}
