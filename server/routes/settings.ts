import { RequestHandler } from "express";
import {
  UserSettings,
  SubscriptionInfo,
  SubscriptionUpdateRequest,
  SubscriptionResponse,
  ApiError,
  NotificationSettings,
  PrivacySettings,
  PlaybackSettings,
} from "@shared/api";

// In-memory storage for settings and subscriptions
let userSettings: Map<string, UserSettings> = new Map();
let userSubscriptions: Map<string, SubscriptionInfo> = new Map();

// Initialize with mock data
initializeSettingsData();

function initializeSettingsData() {
  const defaultSettings: UserSettings = {
    theme: "dark",
    language: "en",
    notifications: {
      email: true,
      push: true,
      newFollowers: true,
      newMusic: true,
      recommendations: true,
      socialActivity: false,
    },
    privacy: {
      profileVisibility: "public",
      showRecentlyPlayed: true,
      showLikedSongs: true,
      showPlaylists: true,
      allowFollowers: true,
    },
    playback: {
      volume: 80,
      shuffle: false,
      repeat: "off",
      gaplessPlayback: true,
      normalization: true,
    },
  };

  const defaultSubscription: SubscriptionInfo = {
    plan: "premium",
    status: "active",
    startDate: "2023-01-15",
    features: [
      "Unlimited skips",
      "Ad-free listening",
      "High-quality audio",
      "Offline downloads",
    ],
    autoRenew: true,
  };

  userSettings.set("user1", defaultSettings);
  userSubscriptions.set("user1", defaultSubscription);
}

// Get user settings
export const getUserSettings: RequestHandler = (req, res) => {
  try {
    const userId = req.params.userId || "user1";

    const settings = userSettings.get(userId);
    if (!settings) {
      const error: ApiError = {
        success: false,
        message: "User settings not found",
        code: "SETTINGS_NOT_FOUND",
      };
      return res.status(404).json(error);
    }

    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    const errorResponse: ApiError = {
      success: false,
      message: "Failed to get user settings",
      details: error,
    };
    res.status(500).json(errorResponse);
  }
};

// Update user settings
export const updateUserSettings: RequestHandler = (req, res) => {
  try {
    const userId = req.params.userId || "user1";
    const updates: Partial<UserSettings> = req.body;

    const currentSettings = userSettings.get(userId);
    if (!currentSettings) {
      const error: ApiError = {
        success: false,
        message: "User settings not found",
        code: "SETTINGS_NOT_FOUND",
      };
      return res.status(404).json(error);
    }

    const updatedSettings: UserSettings = {
      ...currentSettings,
      ...updates,
      notifications: updates.notifications
        ? { ...currentSettings.notifications, ...updates.notifications }
        : currentSettings.notifications,
      privacy: updates.privacy
        ? { ...currentSettings.privacy, ...updates.privacy }
        : currentSettings.privacy,
      playback: updates.playback
        ? { ...currentSettings.playback, ...updates.playback }
        : currentSettings.playback,
    };

    userSettings.set(userId, updatedSettings);

    res.json({
      success: true,
      settings: updatedSettings,
      message: "Settings updated successfully",
    });
  } catch (error) {
    const errorResponse: ApiError = {
      success: false,
      message: "Failed to update user settings",
      details: error,
    };
    res.status(500).json(errorResponse);
  }
};

// Update notification settings
export const updateNotificationSettings: RequestHandler = (req, res) => {
  try {
    const userId = req.params.userId || "user1";
    const notificationUpdates: Partial<NotificationSettings> = req.body;

    const currentSettings = userSettings.get(userId);
    if (!currentSettings) {
      const error: ApiError = {
        success: false,
        message: "User settings not found",
        code: "SETTINGS_NOT_FOUND",
      };
      return res.status(404).json(error);
    }

    const updatedSettings: UserSettings = {
      ...currentSettings,
      notifications: {
        ...currentSettings.notifications,
        ...notificationUpdates,
      },
    };

    userSettings.set(userId, updatedSettings);

    res.json({
      success: true,
      notifications: updatedSettings.notifications,
      message: "Notification settings updated successfully",
    });
  } catch (error) {
    const errorResponse: ApiError = {
      success: false,
      message: "Failed to update notification settings",
      details: error,
    };
    res.status(500).json(errorResponse);
  }
};

// Update privacy settings
export const updatePrivacySettings: RequestHandler = (req, res) => {
  try {
    const userId = req.params.userId || "user1";
    const privacyUpdates: Partial<PrivacySettings> = req.body;

    const currentSettings = userSettings.get(userId);
    if (!currentSettings) {
      const error: ApiError = {
        success: false,
        message: "User settings not found",
        code: "SETTINGS_NOT_FOUND",
      };
      return res.status(404).json(error);
    }

    const updatedSettings: UserSettings = {
      ...currentSettings,
      privacy: {
        ...currentSettings.privacy,
        ...privacyUpdates,
      },
    };

    userSettings.set(userId, updatedSettings);

    res.json({
      success: true,
      privacy: updatedSettings.privacy,
      message: "Privacy settings updated successfully",
    });
  } catch (error) {
    const errorResponse: ApiError = {
      success: false,
      message: "Failed to update privacy settings",
      details: error,
    };
    res.status(500).json(errorResponse);
  }
};

// Update playback settings
export const updatePlaybackSettings: RequestHandler = (req, res) => {
  try {
    const userId = req.params.userId || "user1";
    const playbackUpdates: Partial<PlaybackSettings> = req.body;

    const currentSettings = userSettings.get(userId);
    if (!currentSettings) {
      const error: ApiError = {
        success: false,
        message: "User settings not found",
        code: "SETTINGS_NOT_FOUND",
      };
      return res.status(404).json(error);
    }

    const updatedSettings: UserSettings = {
      ...currentSettings,
      playback: {
        ...currentSettings.playback,
        ...playbackUpdates,
      },
    };

    userSettings.set(userId, updatedSettings);

    res.json({
      success: true,
      playback: updatedSettings.playback,
      message: "Playback settings updated successfully",
    });
  } catch (error) {
    const errorResponse: ApiError = {
      success: false,
      message: "Failed to update playback settings",
      details: error,
    };
    res.status(500).json(errorResponse);
  }
};

// Get subscription info
export const getSubscription: RequestHandler = (req, res) => {
  try {
    const userId = req.params.userId || "user1";

    const subscription = userSubscriptions.get(userId);
    if (!subscription) {
      const error: ApiError = {
        success: false,
        message: "Subscription not found",
        code: "SUBSCRIPTION_NOT_FOUND",
      };
      return res.status(404).json(error);
    }

    const response: SubscriptionResponse = {
      subscription,
      success: true,
    };

    res.json(response);
  } catch (error) {
    const errorResponse: ApiError = {
      success: false,
      message: "Failed to get subscription",
      details: error,
    };
    res.status(500).json(errorResponse);
  }
};

// Update subscription
export const updateSubscription: RequestHandler = (req, res) => {
  try {
    const userId = req.params.userId || "user1";
    const updates: SubscriptionUpdateRequest = req.body;

    const currentSubscription = userSubscriptions.get(userId);
    if (!currentSubscription) {
      const error: ApiError = {
        success: false,
        message: "Subscription not found",
        code: "SUBSCRIPTION_NOT_FOUND",
      };
      return res.status(404).json(error);
    }

    // Define features for each plan
    const planFeatures = {
      free: [
        "Limited skips",
        "Ads between songs",
        "Standard audio quality",
        "Shuffle play only",
      ],
      premium: [
        "Unlimited skips",
        "Ad-free listening",
        "High-quality audio",
        "Offline downloads",
        "Any song, any time",
      ],
      family: [
        "6 Premium accounts",
        "Family mix playlist",
        "Safe listening for kids",
        "All Premium features",
      ],
    };

    const updatedSubscription: SubscriptionInfo = {
      ...currentSubscription,
      plan: updates.plan || currentSubscription.plan,
      autoRenew: updates.autoRenew ?? currentSubscription.autoRenew,
      features: planFeatures[updates.plan || currentSubscription.plan],
      startDate:
        updates.plan !== currentSubscription.plan
          ? new Date().toISOString()
          : currentSubscription.startDate,
    };

    // If upgrading/downgrading, set new start date
    if (updates.plan && updates.plan !== currentSubscription.plan) {
      updatedSubscription.startDate = new Date().toISOString();
      if (updates.plan !== "free") {
        // Calculate end date (30 days from now for paid plans)
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        updatedSubscription.endDate = endDate.toISOString();
      } else {
        delete updatedSubscription.endDate;
      }
    }

    userSubscriptions.set(userId, updatedSubscription);

    const response: SubscriptionResponse = {
      subscription: updatedSubscription,
      success: true,
      message: `Successfully ${
        updates.plan !== currentSubscription.plan
          ? updates.plan === "free"
            ? "downgraded to"
            : "upgraded to"
          : "updated"
      } ${updates.plan || currentSubscription.plan} plan`,
    };

    res.json(response);
  } catch (error) {
    const errorResponse: ApiError = {
      success: false,
      message: "Failed to update subscription",
      details: error,
    };
    res.status(500).json(errorResponse);
  }
};

// Cancel subscription
export const cancelSubscription: RequestHandler = (req, res) => {
  try {
    const userId = req.params.userId || "user1";

    const currentSubscription = userSubscriptions.get(userId);
    if (!currentSubscription) {
      const error: ApiError = {
        success: false,
        message: "Subscription not found",
        code: "SUBSCRIPTION_NOT_FOUND",
      };
      return res.status(404).json(error);
    }

    if (currentSubscription.plan === "free") {
      const error: ApiError = {
        success: false,
        message: "Cannot cancel free plan",
        code: "INVALID_OPERATION",
      };
      return res.status(400).json(error);
    }

    const updatedSubscription: SubscriptionInfo = {
      ...currentSubscription,
      status: "cancelled",
      autoRenew: false,
      endDate: currentSubscription.endDate || new Date().toISOString(),
    };

    userSubscriptions.set(userId, updatedSubscription);

    const response: SubscriptionResponse = {
      subscription: updatedSubscription,
      success: true,
      message:
        "Subscription cancelled successfully. You can continue using premium features until the end of your billing period.",
    };

    res.json(response);
  } catch (error) {
    const errorResponse: ApiError = {
      success: false,
      message: "Failed to cancel subscription",
      details: error,
    };
    res.status(500).json(errorResponse);
  }
};

// Reset settings to default
export const resetSettings: RequestHandler = (req, res) => {
  try {
    const userId = req.params.userId || "user1";

    const defaultSettings: UserSettings = {
      theme: "dark",
      language: "en",
      notifications: {
        email: true,
        push: true,
        newFollowers: true,
        newMusic: true,
        recommendations: true,
        socialActivity: false,
      },
      privacy: {
        profileVisibility: "public",
        showRecentlyPlayed: true,
        showLikedSongs: true,
        showPlaylists: true,
        allowFollowers: true,
      },
      playback: {
        volume: 80,
        shuffle: false,
        repeat: "off",
        gaplessPlayback: true,
        normalization: true,
      },
    };

    userSettings.set(userId, defaultSettings);

    res.json({
      success: true,
      settings: defaultSettings,
      message: "Settings reset to default successfully",
    });
  } catch (error) {
    const errorResponse: ApiError = {
      success: false,
      message: "Failed to reset settings",
      details: error,
    };
    res.status(500).json(errorResponse);
  }
};
