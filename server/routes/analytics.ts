import { RequestHandler } from "express";

// Mock analytics data structure
const analyticsDatabase = {
  userStats: {
    totalStreams: 45672,
    uniqueListeners: 3421,
    averagePlayTime: "3:24",
    engagement: "12.4%",
    revenue: "$342.50",
    profileViews: 8934,
    saves: 1567,
    shares: 892,
    listeningHours: 234,
    songsPlayed: 1456,
    artistsDiscovered: 89,
    playlistsCreated: 12,
  },
  demographics: {
    topCountries: [
      {
        country: "United States",
        percentage: 35,
        listeners: 1197,
        flag: "🇺🇸",
      },
      {
        country: "United Kingdom",
        percentage: 22,
        listeners: 753,
        flag: "🇬🇧",
      },
      { country: "Canada", percentage: 18, listeners: 616, flag: "🇨🇦" },
      { country: "Australia", percentage: 15, listeners: 513, flag: "🇦🇺" },
      { country: "Germany", percentage: 10, listeners: 342, flag: "🇩🇪" },
    ],
    ageGroups: [
      { age: "18-24", percentage: 28, color: "bg-neon-green" },
      { age: "25-34", percentage: 45, color: "bg-neon-blue" },
      { age: "35-44", percentage: 18, color: "bg-purple-500" },
      { age: "45+", percentage: 9, color: "bg-orange-500" },
    ],
    genderSplit: { male: 58, female: 42 },
    listeningTimes: [
      { time: "Morning", percentage: 25, icon: "☀️" },
      { time: "Afternoon", percentage: 35, icon: "🌤️" },
      { time: "Evening", percentage: 30, icon: "🌅" },
      { time: "Night", percentage: 10, icon: "🌙" },
    ],
  },
  performance: {
    weeklyStats: [
      { week: "Week 1", streams: 1234, likes: 89, shares: 34, saves: 67 },
      { week: "Week 2", streams: 1456, likes: 102, shares: 41, saves: 78 },
      { week: "Week 3", streams: 1123, likes: 76, shares: 28, saves: 54 },
      { week: "Week 4", streams: 1890, likes: 134, shares: 56, saves: 98 },
    ],
    monthlyStats: [
      { month: "Jan", streams: 5234, likes: 389, shares: 134, saves: 267 },
      { month: "Feb", streams: 6456, likes: 412, shares: 151, saves: 298 },
      { month: "Mar", streams: 5123, likes: 376, shares: 128, saves: 254 },
      { month: "Apr", streams: 7890, likes: 534, shares: 186, saves: 398 },
    ],
    topTracks: [
      {
        title: "Midnight Dreams",
        plays: 8934,
        likes: 456,
        duration: "3:45",
        genre: "Electronic",
      },
      {
        title: "Electric Nights",
        plays: 7621,
        likes: 398,
        duration: "4:12",
        genre: "Synthwave",
      },
      {
        title: "Ocean Waves",
        plays: 6754,
        likes: 321,
        duration: "3:28",
        genre: "Ambient",
      },
      {
        title: "City Lights",
        plays: 5432,
        likes: 287,
        duration: "3:56",
        genre: "Pop",
      },
      {
        title: "Summer Vibes",
        plays: 4567,
        likes: 234,
        duration: "3:33",
        genre: "Chill",
      },
    ],
    recentAchievements: [
      {
        title: "10K Streams",
        icon: "🎉",
        date: "2 days ago",
        type: "milestone",
      },
      {
        title: "Featured Playlist",
        icon: "⭐",
        date: "1 week ago",
        type: "feature",
      },
      {
        title: "100 Followers",
        icon: "👥",
        date: "2 weeks ago",
        type: "social",
      },
    ],
  },
  growth: {
    followerGrowth: [
      { month: "Jan", count: 280, growth: 12 },
      { month: "Feb", count: 320, growth: 14 },
      { month: "Mar", count: 375, growth: 17 },
      { month: "Apr", count: 420, growth: 12 },
      { month: "May", count: 456, growth: 9 },
    ],
    streamGrowth: "+23.5%",
    engagementGrowth: "+15.2%",
    revenueGrowth: "+18.7%",
    viewsGrowth: "+31.2%",
  },
  insights: {
    peakHours: "2PM - 6PM",
    topDevice: "Mobile (78%)",
    avgSessionDuration: "12:34",
    repeatListeners: "67%",
    discoverySource: "Playlists (42%)",
    topGenres: [
      { genre: "Pop", percentage: 35 },
      { genre: "Electronic", percentage: 28 },
      { genre: "Hip-Hop", percentage: 22 },
      { genre: "Rock", percentage: 15 },
    ],
  },
};

// Get user analytics overview
export const getUserAnalytics: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = "month" } = req.query;

    // In a real app, you'd query the database for user-specific analytics
    const analytics = {
      ...analyticsDatabase,
      period,
      userId,
      generatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error("Get user analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get listening history analytics
export const getListeningHistory: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, period = "week" } = req.query;

    // Mock listening history
    const history = Array.from(
      { length: parseInt(limit as string) },
      (_, i) => ({
        id: i + 1,
        songId: Math.floor(Math.random() * 10) + 1,
        title: `Song ${i + 1}`,
        artist: `Artist ${Math.floor(Math.random() * 5) + 1}`,
        playedAt: new Date(
          Date.now() - Math.random() * 86400000 * 7,
        ).toISOString(),
        duration: "3:24",
        playedFor: Math.floor(Math.random() * 204) + 60, // seconds
        device: ["Mobile", "Desktop", "Tablet"][Math.floor(Math.random() * 3)],
        source: ["Search", "Playlist", "Recommendation", "Radio"][
          Math.floor(Math.random() * 4)
        ],
      }),
    );

    // Calculate stats
    const stats = {
      totalPlays: history.length,
      totalTime: history.reduce((acc, h) => acc + h.playedFor, 0),
      averagePlayTime: Math.floor(
        history.reduce((acc, h) => acc + h.playedFor, 0) / history.length,
      ),
      completionRate: Math.floor(Math.random() * 40) + 60, // 60-100%
      mostPlayedHour: "14:00",
      topDevice: "Mobile",
    };

    res.json({
      success: true,
      history,
      stats,
      period,
    });
  } catch (error) {
    console.error("Get listening history error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get user engagement metrics
export const getEngagementMetrics: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    const engagement = {
      daily: {
        sessions: 4.2,
        sessionDuration: "18:45",
        songsPerSession: 6.8,
        skips: 12,
        likes: 3,
        shares: 1,
      },
      weekly: {
        totalSessions: 28,
        totalTime: "5h 23m",
        songsPlayed: 156,
        discovery: {
          newSongs: 23,
          newArtists: 8,
          newGenres: 2,
        },
      },
      monthly: {
        totalSessions: 120,
        totalTime: "23h 45m",
        songsPlayed: 678,
        topGenres: analyticsDatabase.insights.topGenres,
        moodAnalysis: [
          { mood: "Energetic", percentage: 35 },
          { mood: "Chill", percentage: 28 },
          { mood: "Happy", percentage: 22 },
          { mood: "Focused", percentage: 15 },
        ],
      },
    };

    res.json({
      success: true,
      engagement,
    });
  } catch (error) {
    console.error("Get engagement metrics error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get user recommendations analytics
export const getRecommendationAnalytics: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    const recommendations = {
      accuracy: 78, // percentage
      clickThroughRate: 34, // percentage
      algorithmPerformance: {
        collaborative: { accuracy: 82, usage: 45 },
        contentBased: { accuracy: 74, usage: 30 },
        hybrid: { accuracy: 86, usage: 25 },
      },
      topSources: [
        { source: "Discover Weekly", clicks: 45, likes: 23 },
        { source: "Daily Mix", clicks: 38, likes: 19 },
        { source: "Similar Artists", clicks: 31, likes: 15 },
        { source: "Trending", clicks: 28, likes: 12 },
      ],
    };

    res.json({
      success: true,
      recommendations,
    });
  } catch (error) {
    console.error("Get recommendation analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Export analytics data
export const exportAnalytics: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const { format = "json", period = "month" } = req.query;

    // In a real app, you'd generate the export file
    const exportData = {
      userId,
      period,
      exportedAt: new Date().toISOString(),
      data: analyticsDatabase,
    };

    if (format === "csv") {
      // Convert to CSV format
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="analytics-${userId}-${period}.csv"`,
      );

      // Simple CSV conversion for demo
      const csv = Object.entries(analyticsDatabase.userStats)
        .map(([key, value]) => `${key},${value}`)
        .join("\n");

      res.send(csv);
    } else {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="analytics-${userId}-${period}.json"`,
      );
      res.json(exportData);
    }
  } catch (error) {
    console.error("Export analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get social analytics (followers, shares, etc.)
export const getSocialAnalytics: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    const social = {
      followers: {
        total: 1234,
        growth: "+23 this week",
        sources: {
          organic: 67,
          shared: 18,
          recommended: 15,
        },
      },
      shares: {
        total: 456,
        platforms: {
          twitter: 34,
          social_platform_a: 28,
          social_platform_b: 22,
          other: 16,
        },
        topSharedSongs: [
          { title: "Midnight Dreams", shares: 45 },
          { title: "Electric Nights", shares: 38 },
          { title: "Ocean Waves", shares: 31 },
        ],
      },
      interactions: {
        likes: 789,
        comments: 123,
        reposts: 67,
        engagement_rate: "8.4%",
      },
    };

    res.json({
      success: true,
      social,
    });
  } catch (error) {
    console.error("Get social analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
