import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Heart,
  Music,
  UserPlus,
  Star,
  TrendingUp,
  MessageCircle,
  Download,
  Play,
  Settings,
  Check,
  X,
  Clock,
  Users,
  Radio,
  Calendar,
  Zap,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import MobileFooter from "../components/MobileFooter";
import { useFirebase } from "../context/FirebaseContext";
import { useSocial } from "../context/SocialContext";

interface Notification {
  id: string;
  type:
    | "like"
    | "follow"
    | "release"
    | "comment"
    | "achievement"
    | "playlist"
    | "system";
  title: string;
  description: string;
  timestamp: Date;
  isRead: boolean;
  imageUrl?: string;
  actionable?: boolean;
  data?: any;
}

const sampleNotifications: Notification[] = [
  {
    id: "1",
    type: "like",
    title: "New Likes on Your Song",
    description: "Your song 'Midnight Dreams' received 25 new likes",
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    isRead: false,
    imageUrl:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=60&h=60&fit=crop",
    actionable: true,
  },
  {
    id: "2",
    type: "follow",
    title: "New Follower",
    description: "Sarah Johnson started following you",
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    isRead: false,
    imageUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop",
    actionable: true,
  },
  {
    id: "3",
    type: "release",
    title: "New Release Alert",
    description: "The Weeknd just dropped a new album 'Dawn FM'",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isRead: false,
    imageUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop",
    actionable: true,
  },
  {
    id: "4",
    type: "comment",
    title: "New Comment",
    description: "Alex commented on your playlist 'Summer Vibes'",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    isRead: true,
    imageUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop",
    actionable: true,
  },
  {
    id: "5",
    type: "achievement",
    title: "Milestone Reached!",
    description: "Your song reached 10K plays! 🎉",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    isRead: true,
    imageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=60&h=60&fit=crop",
    actionable: false,
  },
  {
    id: "6",
    type: "playlist",
    title: "Added to Playlist",
    description: "Your song was added to 'Top Hits 2024' playlist",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    isRead: true,
    actionable: true,
  },
  {
    id: "7",
    type: "system",
    title: "Weekly Report",
    description: "Your music stats for this week are ready",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    isRead: true,
    actionable: true,
  },
];

export default function Notifications() {
  const navigate = useNavigate();
  const { user: firebaseUser } = useFirebase();
  const { toast } = useToast();
  const {
    notifications: socialNotifications,
    unreadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useSocial();

  const [notifications, setNotifications] =
    useState<Notification[]>(sampleNotifications);
  const [selectedTab, setSelectedTab] = useState("all");
  const [showSettings, setShowSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    likes: true,
    follows: true,
    releases: true,
    comments: true,
    achievements: true,
    playlists: true,
    pushNotifications: true,
    emailNotifications: false,
  });

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return timestamp.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return Heart;
      case "follow":
        return UserPlus;
      case "release":
        return Music;
      case "comment":
        return MessageCircle;
      case "achievement":
        return Star;
      case "playlist":
        return Radio;
      case "system":
        return Bell;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "like":
        return "text-red-400";
      case "follow":
        return "text-blue-400";
      case "release":
        return "text-purple-400";
      case "comment":
        return "text-green-400";
      case "achievement":
        return "text-yellow-400";
      case "playlist":
        return "text-pink-400";
      case "system":
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, isRead: true } : notif,
      ),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, isRead: true })),
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    toast({
      title: "Notification deleted",
      description: "The notification has been removed",
    });
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (selectedTab === "all") return true;
    if (selectedTab === "unread") return !notif.isRead;
    return notif.type === selectedTab;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const tabs = [
    { id: "all", label: "All", count: notifications.length },
    { id: "unread", label: "Unread", count: unreadCount },
    { id: "like", label: "Likes", icon: Heart },
    { id: "follow", label: "Follows", icon: UserPlus },
    { id: "release", label: "Releases", icon: Music },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-darker via-background to-purple-dark relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-primary/8 via-purple-secondary/4 to-purple-accent/6"></div>

      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-xl border-b border-purple-primary/20"
        >
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-purple-dark/50 backdrop-blur-sm flex items-center justify-center border border-purple-primary/30"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>

            <div>
              <h1 className="text-xl font-bold text-white">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-400">{unreadCount} unread</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={markAllAsRead}
                className="px-3 py-1.5 bg-purple-primary/20 border border-purple-primary/50 rounded-full text-sm text-white hover:bg-purple-primary/30 transition-colors"
              >
                Mark all read
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 rounded-full bg-purple-dark/50 backdrop-blur-sm flex items-center justify-center border border-purple-primary/30"
            >
              <Settings className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </motion.header>

        {/* Tabs */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex space-x-1 p-4 overflow-x-auto"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedTab === tab.id
                    ? "bg-purple-primary text-white"
                    : "bg-purple-dark/30 text-gray-400 hover:text-white hover:bg-purple-dark/50"
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span className="text-sm font-medium">{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      selectedTab === tab.id
                        ? "bg-white/20"
                        : "bg-purple-primary/20"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto px-4 pb-24">
          <AnimatePresence mode="wait">
            {filteredNotifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <Bell className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No notifications
                </h3>
                <p className="text-gray-400">
                  {selectedTab === "unread"
                    ? "You're all caught up!"
                    : "You'll see notifications here when you get them"}
                </p>
              </motion.div>
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map((notification, index) => {
                  const Icon = getNotificationIcon(notification.type);
                  const iconColor = getNotificationColor(notification.type);

                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative p-4 rounded-xl border transition-all cursor-pointer group ${
                        notification.isRead
                          ? "bg-purple-dark/20 border-purple-primary/10"
                          : "bg-purple-primary/10 border-purple-primary/30"
                      }`}
                      onClick={() =>
                        !notification.isRead && markAsRead(notification.id)
                      }
                    >
                      <div className="flex items-start space-x-3">
                        {/* Icon/Image */}
                        <div className="flex-shrink-0">
                          {notification.imageUrl ? (
                            <div className="relative">
                              <img
                                src={notification.imageUrl}
                                alt=""
                                className="w-12 h-12 rounded-full object-cover"
                              />
                              <div
                                className={`absolute -bottom-1 -right-1 w-6 h-6 bg-purple-dark rounded-full flex items-center justify-center border-2 border-purple-dark`}
                              >
                                <Icon className={`w-3 h-3 ${iconColor}`} />
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`w-12 h-12 rounded-full bg-purple-dark/50 flex items-center justify-center`}
                            >
                              <Icon className={`w-6 h-6 ${iconColor}`} />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-white text-sm mb-1">
                                {notification.title}
                              </h3>
                              <p className="text-gray-400 text-sm leading-relaxed">
                                {notification.description}
                              </p>
                              <div className="flex items-center mt-2">
                                <Clock className="w-3 h-3 text-gray-500 mr-1" />
                                <span className="text-xs text-gray-500">
                                  {formatTimeAgo(notification.timestamp)}
                                </span>
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-purple-primary rounded-full ml-2" />
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {notification.actionable && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="p-2 rounded-full bg-purple-primary/20 text-purple-primary hover:bg-purple-primary/30 transition-colors"
                                >
                                  <Play className="w-3 h-3" />
                                </motion.button>
                              )}

                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowSettings(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-purple-dark rounded-2xl p-6 w-full max-w-md border border-purple-primary/30"
              >
                <h2 className="text-xl font-bold text-white mb-6">
                  Notification Settings
                </h2>

                <div className="space-y-4">
                  {Object.entries(notificationSettings).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between"
                    >
                      <span className="text-white capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            [key]: !value,
                          }))
                        }
                        className={`w-12 h-6 rounded-full transition-colors ${
                          value ? "bg-purple-primary" : "bg-gray-600"
                        }`}
                      >
                        <motion.div
                          animate={{ x: value ? 24 : 2 }}
                          className="w-5 h-5 bg-white rounded-full"
                        />
                      </motion.button>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-3 mt-8">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowSettings(false)}
                    className="flex-1 py-3 bg-gray-600 rounded-xl text-white font-medium"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowSettings(false);
                      toast({
                        title: "Settings saved",
                        description:
                          "Your notification preferences have been updated",
                      });
                    }}
                    className="flex-1 py-3 bg-purple-primary rounded-xl text-white font-medium"
                  >
                    Save
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Footer */}
        <MobileFooter />
      </div>
    </div>
  );
}
