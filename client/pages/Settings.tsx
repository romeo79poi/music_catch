import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Camera,
  Bell,
  Shield,
  Palette,
  Download,
  Volume2,
  Headphones,
  Smartphone,
  Moon,
  Sun,
  ChevronRight,
  LogOut,
  Trash2,
  Edit3,
  Save,
  X,
  Check,
  AlertTriangle,
  Settings as SettingsIcon,
  Globe,
  HelpCircle,
  Star,
  Share,
  MessageCircle,
  ExternalLink,
  FileText,
  Info,
  Phone,
  Bug,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import MobileFooter from "../components/MobileFooter";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../context/ThemeContext";
import { settingsApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, actualTheme, setTheme } = useTheme();
  const {
    user: authUser,
    signOut,
    getSettings,
    updateSettings,
    loading: authLoading,
  } = useAuth();

  // User data state - will be loaded from backend
  const [userProfile, setUserProfile] = useState({
    name: "Loading...",
    email: "Loading...",
    profileImage: "",
    joinDate: "Loading...",
    premium: false,
  });
  const [loading, setLoading] = useState(true);
  const [showSupportMenu, setShowSupportMenu] = useState(false);

  // Support options
  const supportOptions = [
    {
      key: "help-center",
      label: "Help Center",
      icon: FileText,
      description: "Browse our comprehensive help documentation",
      action: () => {
        window.open("https://help.musicapp.com/docs", "_blank");
        toast({
          title: "Help Center",
          description: "Opening help documentation",
        });
        setShowSupportMenu(false);
      },
    },
    {
      key: "contact-support",
      label: "Contact Support",
      icon: MessageCircle,
      description: "Get help from our support team",
      action: () => {
        window.open(
          "mailto:support@musicapp.com?subject=Support Request from Settings",
          "_blank",
        );
        toast({
          title: "Contact Support",
          description: "Opening email client",
        });
        setShowSupportMenu(false);
      },
    },
    {
      key: "live-chat",
      label: "Live Chat",
      icon: MessageCircle,
      description: "Chat with support in real-time",
      action: () => {
        window.open("https://chat.musicapp.com", "_blank");
        toast({
          title: "Live Chat",
          description: "Opening live chat window",
        });
        setShowSupportMenu(false);
      },
    },
    {
      key: "phone-support",
      label: "Phone Support",
      icon: Phone,
      description: "Call us: +1 (555) 123-MUSIC",
      action: () => {
        window.open("tel:+15551234687", "_self");
        toast({
          title: "Phone Support",
          description: "Calling support team",
        });
        setShowSupportMenu(false);
      },
    },
    {
      key: "bug-report",
      label: "Report Bug",
      icon: Bug,
      description: "Report technical issues or bugs",
      action: () => {
        window.open("https://bugs.musicapp.com/report", "_blank");
        toast({
          title: "Bug Report",
          description: "Opening bug report form",
        });
        setShowSupportMenu(false);
      },
    },
    {
      key: "feature-request",
      label: "Feature Request",
      icon: Star,
      description: "Suggest new features",
      action: () => {
        window.open("https://feedback.musicapp.com/features", "_blank");
        toast({
          title: "Feature Request",
          description: "Opening feature request form",
        });
        setShowSupportMenu(false);
      },
    },
    {
      key: "feedback",
      label: "Send Feedback",
      icon: Share,
      description: "Share your thoughts about the app",
      action: () => {
        window.open("https://feedback.musicapp.com", "_blank");
        toast({
          title: "Send Feedback",
          description: "Opening feedback form",
        });
        setShowSupportMenu(false);
      },
    },
    {
      key: "faq",
      label: "FAQ",
      icon: HelpCircle,
      description: "Frequently asked questions",
      action: () => {
        window.open("https://help.musicapp.com/faq", "_blank");
        toast({
          title: "FAQ",
          description: "Opening FAQ page",
        });
        setShowSupportMenu(false);
      },
    },
    {
      key: "community",
      label: "Community Forum",
      icon: User,
      description: "Join the community discussion",
      action: () => {
        window.open("https://community.musicapp.com", "_blank");
        toast({
          title: "Community Forum",
          description: "Opening community forum",
        });
        setShowSupportMenu(false);
      },
    },
    {
      key: "status",
      label: "Service Status",
      icon: Info,
      description: "Check current service status",
      action: () => {
        window.open("https://status.musicapp.com", "_blank");
        toast({
          title: "Service Status",
          description: "Opening status page",
        });
        setShowSupportMenu(false);
      },
    },
  ];

  // Settings state
  const [settings, setSettings] = useState({
    darkTheme: true,
    notifications: true,
    autoDownload: true,
    highQuality: true,
    offlineMode: true,
    publicProfile: true,
    showActivity: true,
    autoPlay: true,
    crossfade: true,
    normalization: true,
    language: "English",
    region: "United States",
  });

  // Modal states
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load user profile and settings when backend auth user is available
  useEffect(() => {
    if (!authLoading && authUser) {
      loadUserData();
      loadUserSettings();
    } else if (!authLoading && !authUser) {
      // Redirect to login if not authenticated
      navigate("/login");
    }
  }, [authUser, authLoading]);

  // Close support menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showSupportMenu && !target.closest(".support-dropdown")) {
        setShowSupportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSupportMenu]);

  const loadUserData = async () => {
    try {
      if (!authUser) {
        setLoading(false);
        return;
      }

      // Load user data from backend authentication context
      const backendProfile = {
        name: authUser.name || "User",
        email: authUser.email || "No email",
        profileImage:
          authUser.avatar_url ||
          `https://ui-avatars.io/api/?name=${encodeURIComponent(authUser.name || "User")}&background=6366f1&color=fff&size=64`,
        joinDate: authUser.created_at
          ? new Date(authUser.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "Unknown",
        premium: authUser.premium || false,
        backendUserId: authUser.id,
        emailVerified: authUser.verified || false,
        lastSignIn: authUser.updated_at
          ? new Date(authUser.updated_at).toLocaleDateString()
          : "Unknown",
        // Additional profile data from backend
        username: authUser.username || "user",
        bio: authUser.bio || "",
        location: authUser.location || "",
        website: authUser.website || "",
      };

      setUserProfile(backendProfile);
      console.log(
        "✅ Profile loaded from backend authentication:",
        backendProfile,
      );
      setLoading(false);
      return;

      // This code block is no longer needed as we use backend authentication

      // Try to sync with backend or create user profile
      try {
        // Backend profile data is already loaded from AuthContext

        if (getResponse.ok) {
          const result = await getResponse.json();
          if (result.success && result.data) {
            const backendData = result.data;
            const enhancedProfile = {
              ...firebaseProfile,
              name:
                backendData.display_name ||
                backendData.name ||
                firebaseProfile.name,
              profileImage:
                backendData.profile_image_url || firebaseProfile.profileImage,
              premium: backendData.premium || false,
              joinDate: backendData.created_at
                ? new Date(backendData.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : firebaseProfile.joinDate,
            };
            setUserProfile(enhancedProfile);
            console.log("✅ Enhanced profile from backend:", enhancedProfile);
            return;
          }
        }

        // User profile is automatically managed by backend JWT authentication

        if (createResponse.ok) {
          const createResult = await createResponse.json();
          console.log("✅ User created in backend:", createResult);

          // Try to fetch the user data again after creation
          const retryResponse = await fetch(
            `/api/v1/users/${firebaseUser.uid}`,
            {
              headers: {
                "user-id": firebaseUser.uid,
                "Content-Type": "application/json",
              },
            },
          );

          if (retryResponse.ok) {
            const retryResult = await retryResponse.json();
            if (retryResult.success && retryResult.data) {
              const backendData = retryResult.data;
              const enhancedProfile = {
                ...firebaseProfile,
                username: backendData.username || firebaseProfile.username,
                bio: backendData.bio || firebaseProfile.bio,
                dateOfBirth: backendData.date_of_birth || "",
                gender: backendData.gender || "",
              };
              setUserProfile(enhancedProfile);
              console.log(
                "✅ Enhanced profile after backend creation:",
                enhancedProfile,
              );
              return;
            }
          }
        }
      } catch (error) {
        console.error(
          "⚠️ Backend sync failed (using Firebase data only):",
          error,
        );
        // Continue with Firebase-only data
      }
    } catch (error) {
      console.error("❌ Error loading user data:", error);
      toast({
        title: "Error Loading Profile",
        description: "Failed to load user profile. Please try refreshing.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserSettings = async () => {
    try {
      if (!authUser) return;

      console.log("🔥 Loading settings for backend user:", authUser.id);

      // Try to load settings from backend
      const result = await getSettings();

      if (result.success && result.data) {
        // Map backend settings to component settings format
        const backendSettings = result.data;
        const componentSettings = {
          darkTheme: backendSettings.preferences?.theme === "dark",
          notifications: backendSettings.notifications?.email || true,
          autoDownload: backendSettings.preferences?.autoDownload || false,
          highQuality: backendSettings.preferences?.highQuality || true,
          offlineMode: backendSettings.preferences?.offlineMode || false,
          publicProfile: backendSettings.privacy?.publicProfile || true,
          showActivity: backendSettings.privacy?.showActivity || true,
          autoPlay: backendSettings.preferences?.autoplay || true,
          crossfade: backendSettings.preferences?.crossfade || false,
          normalization: backendSettings.preferences?.normalization || true,
          language: backendSettings.preferences?.language || "English",
          region: backendSettings.preferences?.region || "United States",
        };

        setSettings(componentSettings);
        console.log("✅ Settings loaded from backend:", componentSettings);
      } else {
        // Use default settings if backend fails
        const defaultSettings = {
          darkTheme: true,
          notifications: true,
          autoDownload: false,
          highQuality: true,
          offlineMode: false,
          publicProfile: true,
          showActivity: true,
          autoPlay: true,
          crossfade: false,
          normalization: true,
          language: "English",
          region: "United States",
        };

        setSettings(defaultSettings);
        console.log("✅ Using default settings:", defaultSettings);
      }
    } catch (error) {
      console.error("❌ Error loading settings:", error);
      // Set default settings on error
      const defaultSettings = {
        darkTheme: true,
        notifications: true,
        autoDownload: false,
        highQuality: true,
        offlineMode: false,
        publicProfile: true,
        showActivity: true,
        autoPlay: true,
        crossfade: false,
        normalization: true,
        language: "English",
        region: "United States",
      };
      setSettings(defaultSettings);
    }
  };

  const settingsSections = [
    {
      title: "Account",
      icon: User,
      items: [
        {
          key: "editAccount",
          label: "Edit Account",
          icon: Edit3,
          action: () => navigate("/edit-account"),
          description: "Edit detailed account information",
        },
        // Only show subscription section if user has premium
        ...(userProfile?.isPremium
          ? [
              {
                key: "subscription",
                label: "Premium Subscription",
                icon: Star,
                action: () => navigate("/premium-dashboard"),
                description: "Manage your premium membership",
                badge: "PREMIUM",
                isPremium: true,
              },
            ]
          : []),
        {
          key: "privacy",
          label: "Privacy Settings",
          icon: Shield,
          action: () => {},
          description: "Control who can see your activity",
        },
      ],
    },
    {
      title: "Audio & Playback",
      icon: Volume2,
      items: [
        {
          key: "highQuality",
          label: "High Quality Audio",
          icon: Headphones,
          toggle: true,
          value: settings.highQuality,
          description: "Stream music in higher quality",
        },
        {
          key: "autoPlay",
          label: "Autoplay",
          icon: Volume2,
          toggle: true,
          value: settings.autoPlay,
          description: "Automatically play similar songs when your music ends",
        },
        {
          key: "crossfade",
          label: "Crossfade",
          icon: Volume2,
          toggle: true,
          value: settings.crossfade,
          description: "Smooth transition between songs",
        },
        {
          key: "normalization",
          label: "Audio Normalization",
          icon: Volume2,
          toggle: true,
          value: settings.normalization,
          description: "Set the same volume level for all tracks",
        },
      ],
    },
    {
      title: "App Preferences",
      icon: SettingsIcon,
      items: [
        {
          key: "theme",
          label: "Appearance",
          icon: actualTheme === "dark" ? Moon : Sun,
          description: `Switch between light and dark theme`,
          action: () => {},
          customComponent: true,
        },
        {
          key: "notifications",
          label: "Push Notifications",
          icon: Bell,
          toggle: true,
          value: settings.notifications,
          description: "Get notified about new releases and updates",
        },
        {
          key: "autoDownload",
          label: "Auto Download",
          icon: Download,
          toggle: true,
          value: settings.autoDownload,
          description:
            "Automatically download liked songs for offline listening",
        },
        {
          key: "language",
          label: "Language",
          icon: Globe,
          action: () => {},
          description: settings.language,
        },
      ],
    },
    {
      title: "Social",
      icon: Share,
      items: [
        {
          key: "publicProfile",
          label: "Public Profile",
          icon: User,
          toggle: true,
          value: settings.publicProfile,
          description: "Make your profile visible to other users",
        },
        {
          key: "showActivity",
          label: "Show Activity",
          icon: User,
          toggle: true,
          value: settings.showActivity,
          description: "Let others see what you're listening to",
        },
      ],
    },
    {
      title: "Support",
      icon: HelpCircle,
      items: [
        {
          key: "help",
          label: "Help Center",
          icon: HelpCircle,
          action: () => {
            window.open("https://help.musicapp.com", "_blank");
            toast({
              title: "Help Center",
              description: "Opening help center in new tab",
            });
          },
          description: "Get help and find answers",
        },
        {
          key: "contact",
          label: "Contact Support",
          icon: HelpCircle,
          action: () => {
            window.open(
              "mailto:support@musicapp.com?subject=Support Request",
              "_blank",
            );
            toast({
              title: "Contact Support",
              description: "Opening email client",
            });
          },
          description: "Get direct help from our team",
        },
        {
          key: "feedback",
          label: "Send Feedback",
          icon: Share,
          action: () => {
            window.open("https://feedback.musicapp.com", "_blank");
            toast({
              title: "Send Feedback",
              description: "Opening feedback form",
            });
          },
          description: "Share your thoughts about the app",
        },
        {
          key: "about",
          label: "About Catch",
          icon: SettingsIcon,
          action: () => {
            toast({
              title: "About Catch Music",
              description: "Version 1.0.0 - Built with Firebase integration",
            });
          },
          description: "Version 1.0.0",
        },
      ],
    },
  ];

  const handleToggleSetting = async (key: string) => {
    const newValue = !settings[key as keyof typeof settings];

    // Update local state immediately for responsiveness
    setSettings((prev) => ({
      ...prev,
      [key]: newValue,
    }));

    try {
      if (authUser) {
        console.log("🔥 Updating setting for backend user:", key, newValue);

        // Create settings object based on the key being updated
        let settingsUpdate: any = {};

        if (key === "darkTheme") {
          settingsUpdate = {
            preferences: { theme: newValue ? "dark" : "light" },
          };
        } else if (
          [
            "autoDownload",
            "highQuality",
            "offlineMode",
            "autoPlay",
            "crossfade",
            "normalization",
          ].includes(key)
        ) {
          settingsUpdate = {
            preferences: { [key]: newValue },
          };
        } else if (["publicProfile", "showActivity"].includes(key)) {
          settingsUpdate = {
            privacy: { [key]: newValue },
          };
        } else if (key === "notifications") {
          settingsUpdate = {
            notifications: { email: newValue },
          };
        } else {
          settingsUpdate = {
            preferences: { [key]: newValue },
          };
        }

        // Update the setting using backend JWT API
        const result = await updateSettings(settingsUpdate);

        if (result.success) {
          const friendlyName = key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase());
          toast({
            title: "Setting Updated",
            description: `${friendlyName} has been ${newValue ? "enabled" : "disabled"}`,
          });
          console.log("��� Setting updated successfully:", key, newValue);
        } else {
          throw new Error(result.message || "Backend settings service failed");
        }
      }
    } catch (error) {
      console.error("❌ Error updating setting:", error);

      // Revert local state on error
      setSettings((prev) => ({
        ...prev,
        [key]: !newValue,
      }));

      toast({
        title: "Update Failed",
        description: "Failed to update setting. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      // Sign out using backend authentication
      await signOut();

      console.log(
        "✅ User logged out successfully from backend authentication",
      );

      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
      navigate("/login");
    } catch (error) {
      console.error("❌ Backend logout error:", error);
      toast({
        title: "Logout Error",
        description: "There was an issue logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = () => {
    // Add delete account logic here
    toast({
      title: "Account Deleted",
      description: "Your account has been permanently deleted",
      variant: "destructive",
    });
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-darker via-purple-dark to-background dark:from-purple-darker dark:via-purple-dark dark:to-background light:from-gray-50 light:via-white light:to-purple-50 text-white dark:text-white light:text-gray-900 relative overflow-hidden theme-transition">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-primary/8 via-purple-secondary/4 to-purple-accent/6 dark:from-purple-primary/8 dark:via-purple-secondary/4 dark:to-purple-accent/6 light:from-purple-primary/3 light:via-purple-secondary/2 light:to-purple-accent/3 theme-transition"></div>

      {/* Animated Background */}
      <div className="fixed inset-0 opacity-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 right-1/4 w-24 h-24 border border-purple-primary/20 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/3 left-1/4 w-16 h-16 border border-purple-secondary/20 rounded-full"
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between p-4 bg-black/20 dark:bg-black/20 light:bg-white/80 backdrop-blur-xl border-b border-purple-primary/20 theme-transition"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-purple-dark/50 backdrop-blur-sm flex items-center justify-center border border-purple-primary/30 hover:bg-purple-primary/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>

          <div>
            <h1 className="text-xl font-bold text-white dark:text-white light:text-gray-900">
              Settings
            </h1>
            {authUser && (
              <p className="text-xs text-white/70 mt-1">
                {authUser.email} •{" "}
                {(authUser as any).provider
                  ? `Signed in with ${(authUser as any).provider}`
                  : ""}
              </p>
            )}
          </div>

          <div className="relative support-dropdown">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSupportMenu(!showSupportMenu)}
              className="w-10 h-10 rounded-full bg-purple-dark/50 backdrop-blur-sm flex items-center justify-center border border-purple-primary/30 hover:bg-purple-primary/20 transition-colors"
            >
              <HelpCircle className="w-5 h-5 text-white" />
            </motion.button>

            {/* Support Dropdown Menu */}
            <AnimatePresence>
              {showSupportMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-12 w-80 bg-gradient-to-br from-purple-dark to-purple-darker border border-purple-primary/30 rounded-2xl shadow-2xl backdrop-blur-sm z-50"
                >
                  {/* Header */}
                  <div className="p-4 border-b border-purple-primary/20">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white flex items-center">
                        <HelpCircle className="w-5 h-5 mr-2 text-purple-primary" />
                        Help & Support
                      </h3>
                      <button
                        onClick={() => setShowSupportMenu(false)}
                        className="p-1 hover:bg-purple-primary/20 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Support Options */}
                  <div className="max-h-96 overflow-y-auto">
                    {supportOptions.map((option, index) => (
                      <motion.button
                        key={option.key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={option.action}
                        className="w-full p-4 flex items-start space-x-3 hover:bg-purple-primary/10 transition-colors text-left border-b border-purple-primary/10 last:border-b-0"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-primary/20 flex items-center justify-center">
                          <option.icon className="w-4 h-4 text-purple-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-white font-medium truncate">
                              {option.label}
                            </h4>
                            <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0 ml-2" />
                          </div>
                          <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                            {option.description}
                          </p>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t border-purple-primary/20 bg-purple-primary/5">
                    <div className="text-center">
                      <p className="text-xs text-gray-400">
                        Need immediate help? Call us at{" "}
                        <a
                          href="tel:+15551234687"
                          className="text-purple-primary hover:underline"
                        >
                          +1 (555) 123-MUSIC
                        </a>
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-32">
          {/* Profile Section */}
          <motion.section
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="p-6"
          >
            <div className="bg-gradient-to-r from-purple-dark/40 to-purple-primary/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-primary/30">
              <div className="flex items-center space-x-4">
                {userProfile && (
                  <>
                    <div className="relative">
                      <img
                        src={
                          userProfile.profileImage ||
                          `https://ui-avatars.io/api/?name=${encodeURIComponent(userProfile.name)}&background=6366f1&color=fff&size=64`
                        }
                        alt={userProfile.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-neon-green/50"
                      />
                      {userProfile.isPremium && (
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"
                        >
                          <Star className="w-3 h-3 text-white fill-current" />
                        </motion.div>
                      )}
                      {userProfile.isVerified && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-background">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h2 className="text-xl font-bold text-white">
                          {loading ? "Loading..." : userProfile.name}
                        </h2>
                        {userProfile.isPremium && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-black">
                            PREMIUM
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400">@{userProfile.username}</p>
                      <p className="text-gray-400">{userProfile.email}</p>
                      <p className="text-sm text-purple-primary">
                        Member since {userProfile.memberSince}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.section>

          {/* Settings Sections */}
          <div className="px-6 space-y-6">
            {settingsSections.map((section, sectionIndex) => (
              <motion.section
                key={section.title}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 + sectionIndex * 0.1 }}
                className="bg-purple-dark/30 backdrop-blur-sm rounded-2xl border border-purple-primary/20 overflow-hidden"
              >
                <div className="p-4 border-b border-purple-primary/20">
                  <div className="flex items-center space-x-3">
                    <section.icon className="w-5 h-5 text-purple-primary" />
                    <h3 className="text-lg font-semibold text-white">
                      {section.title}
                    </h3>
                  </div>
                </div>

                <div className="divide-y divide-purple-primary/10">
                  {section.items.map((item) => (
                    <motion.div
                      key={item.key}
                      whileHover={{
                        backgroundColor: item.isPremium
                          ? "rgba(251, 191, 36, 0.1)"
                          : "rgba(158, 64, 252, 0.1)",
                      }}
                      className={`p-4 transition-all ${
                        item.isPremium
                          ? "bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-yellow-500/10 border-l-4 border-yellow-400"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <item.icon className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-white">
                                {item.label}
                              </h4>
                              {item.badge && (
                                <motion.span
                                  animate={{
                                    boxShadow: [
                                      "0 0 0 0 rgba(251, 191, 36, 0.4)",
                                      "0 0 0 6px rgba(251, 191, 36, 0)",
                                      "0 0 0 0 rgba(251, 191, 36, 0.4)",
                                    ],
                                  }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                  }}
                                  className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 text-black rounded-full shadow-lg flex items-center space-x-1"
                                >
                                  <Star className="w-3 h-3 fill-current" />
                                  <span>{item.badge}</span>
                                </motion.span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {item.key === "theme" && item.customComponent ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              const newTheme =
                                actualTheme === "dark" ? "light" : "dark";
                              setTheme(newTheme);
                              toast({
                                title: "Theme Changed",
                                description: `Switched to ${newTheme} mode`,
                              });
                            }}
                            className={`relative w-16 h-8 rounded-full transition-all duration-300 ${
                              actualTheme === "dark"
                                ? "bg-gradient-to-r from-purple-primary to-purple-secondary shadow-lg shadow-purple-primary/30"
                                : "bg-gray-600"
                            }`}
                          >
                            <motion.div
                              animate={{ x: actualTheme === "dark" ? 32 : 2 }}
                              transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                              }}
                              className={`absolute top-1 w-6 h-6 rounded-full transition-all duration-300 ${
                                actualTheme === "dark"
                                  ? "bg-white shadow-lg"
                                  : "bg-white"
                              } flex items-center justify-center`}
                            >
                              {actualTheme === "dark" ? (
                                <Moon className="w-3 h-3 text-purple-primary" />
                              ) : (
                                <Sun className="w-3 h-3 text-orange-500" />
                              )}
                            </motion.div>
                          </motion.button>
                        ) : item.toggle ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleToggleSetting(item.key)}
                            className={`relative w-12 h-6 rounded-full transition-all ${
                              item.value
                                ? "bg-gradient-to-r from-purple-primary to-purple-secondary shadow-lg shadow-purple-primary/30"
                                : "bg-gray-600"
                            }`}
                          >
                            <motion.div
                              animate={{ x: item.value ? 24 : 2 }}
                              transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                              }}
                              className="absolute top-1 w-4 h-4 bg-white rounded-full"
                            />
                          </motion.button>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={item.action}
                            className="p-2 rounded-full hover:bg-purple-primary/20 transition-colors"
                          >
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            ))}
          </div>

          {/* Danger Zone */}
          <motion.section
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="p-6 space-y-4"
          >
            <h3 className="text-lg font-semibold text-red-400 mb-4">
              <p>
                <br />
              </p>
            </h3>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowLogoutModal(true)}
              className="w-full p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 font-medium flex items-center justify-center space-x-2 hover:bg-red-500/30 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Log Out</span>
            </motion.button>
          </motion.section>
        </main>

        {/* Logout Confirmation Modal */}
        <AnimatePresence>
          {showLogoutModal && (
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
                <div className="text-center">
                  <LogOut className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Log Out</h3>
                  <p className="text-gray-400 mb-6">
                    Are you sure you want to log out of your account?
                  </p>

                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowLogoutModal(false)}
                      className="flex-1 p-3 bg-gray-600/50 border border-gray-500/50 rounded-xl text-white font-medium"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleLogout}
                      className="flex-1 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 font-medium"
                    >
                      Log Out
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Account Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
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
                className="bg-gradient-to-br from-purple-dark to-purple-darker border border-red-500/50 rounded-2xl p-6 w-full max-w-md"
              >
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    Delete Account
                  </h3>
                  <p className="text-gray-400 mb-6">
                    This action cannot be undone. This will permanently delete
                    your account and all your data.
                  </p>

                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1 p-3 bg-gray-600/50 border border-gray-500/50 rounded-xl text-white font-medium"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDeleteAccount}
                      className="flex-1 p-3 bg-red-600/20 border border-red-600/50 rounded-xl text-red-500 font-medium"
                    >
                      Delete
                    </motion.button>
                  </div>
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
