import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Trophy,
  DollarSign,
  TrendingUp,
  Star,
  Crown,
  Gift,
  Music,
  Play,
  Users,
  Heart,
  Download,
  Share2,
  Award,
  Target,
  Zap,
  Calendar,
  BarChart3,
  Coins,
  CreditCard,
  ExternalLink,
  Clock,
  Flame,
  Medal,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import MobileFooter from "../components/MobileFooter";

interface EarningsData {
  totalEarnings: number;
  thisMonth: number;
  lastMonth: number;
  totalPlays: number;
  totalDownloads: number;
  averageEarningPerPlay: number;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  plays: number;
  earnings: number;
  isCurrentUser?: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
  reward: number;
  type: "plays" | "earnings" | "social" | "streak";
}

interface RewardItem {
  id: string;
  title: string;
  description: string;
  cost: number;
  type: "gift_card" | "merchandise" | "premium" | "exclusive";
  imageUrl: string;
  available: boolean;
}

const sampleEarnings: EarningsData = {
  totalEarnings: 2847.5,
  thisMonth: 423.8,
  lastMonth: 289.3,
  totalPlays: 125430,
  totalDownloads: 8934,
  averageEarningPerPlay: 0.023,
};

const sampleLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    name: "DJ Shadow",
    avatar:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=60&h=60&fit=crop",
    plays: 2450000,
    earnings: 12450.0,
  },
  {
    rank: 2,
    name: "Luna Wave",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop",
    plays: 1890000,
    earnings: 9876.0,
  },
  {
    rank: 3,
    name: "Beat Master",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop",
    plays: 1650000,
    earnings: 8234.0,
  },
  {
    rank: 4,
    name: "You",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop",
    plays: 125430,
    earnings: 2847.5,
    isCurrentUser: true,
  },
  {
    rank: 5,
    name: "Melody Maker",
    avatar:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=60&h=60&fit=crop",
    plays: 98750,
    earnings: 2156.0,
  },
];

const sampleAchievements: Achievement[] = [
  {
    id: "first_upload",
    title: "First Upload",
    description: "Upload your first track",
    icon: "🎵",
    unlockedAt: new Date("2024-01-15"),
    reward: 10,
    type: "plays",
  },
  {
    id: "hundred_plays",
    title: "Century Club",
    description: "Reach 100 total plays",
    icon: "💯",
    unlockedAt: new Date("2024-01-20"),
    reward: 25,
    type: "plays",
  },
  {
    id: "thousand_plays",
    title: "Rising Star",
    description: "Reach 1,000 total plays",
    icon: "⭐",
    unlockedAt: new Date("2024-02-01"),
    reward: 50,
    type: "plays",
  },
  {
    id: "ten_thousand_plays",
    title: "Hit Maker",
    description: "Reach 10,000 total plays",
    icon: "🔥",
    unlockedAt: new Date("2024-02-15"),
    reward: 100,
    type: "plays",
  },
  {
    id: "hundred_thousand_plays",
    title: "Viral Sensation",
    description: "Reach 100,000 total plays",
    icon: "🚀",
    unlockedAt: new Date("2024-03-01"),
    reward: 500,
    type: "plays",
  },
  {
    id: "first_hundred_dollars",
    title: "First Payday",
    description: "Earn your first $100",
    icon: "💰",
    unlockedAt: new Date("2024-02-20"),
    reward: 20,
    type: "earnings",
  },
  {
    id: "thousand_dollars",
    title: "Big Earner",
    description: "Earn $1,000 in total",
    icon: "💎",
    unlockedAt: new Date("2024-03-10"),
    reward: 100,
    type: "earnings",
  },
  {
    id: "hundred_followers",
    title: "Growing Fanbase",
    description: "Get 100 followers",
    icon: "👥",
    progress: 67,
    maxProgress: 100,
    reward: 30,
    type: "social",
  },
  {
    id: "seven_day_streak",
    title: "Consistent Creator",
    description: "Upload for 7 days straight",
    icon: "📅",
    progress: 4,
    maxProgress: 7,
    reward: 40,
    type: "streak",
  },
];

const sampleRewards: RewardItem[] = [
  {
    id: "music_gift_card",
    title: "Music Gift Card $25",
    description: "Enjoy premium music streaming",
    cost: 1000,
    type: "gift_card",
    imageUrl:
      "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=200&h=150&fit=crop",
    available: true,
  },
  {
    id: "apple_music_gift_card",
    title: "Apple Music Gift Card $25",
    description: "Stream millions of songs",
    cost: 1000,
    type: "gift_card",
    imageUrl:
      "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=200&h=150&fit=crop",
    available: true,
  },
  {
    id: "catch_hoodie",
    title: "Catch Music Hoodie",
    description: "Official merchandise",
    cost: 2500,
    type: "merchandise",
    imageUrl:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200&h=150&fit=crop",
    available: true,
  },
  {
    id: "premium_month",
    title: "Premium Account (1 Month)",
    description: "Ad-free listening and exclusive features",
    cost: 500,
    type: "premium",
    imageUrl:
      "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=200&h=150&fit=crop",
    available: true,
  },
  {
    id: "studio_session",
    title: "Exclusive Studio Session",
    description: "Record with professional equipment",
    cost: 10000,
    type: "exclusive",
    imageUrl:
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=200&h=150&fit=crop",
    available: false,
  },
];

export default function Rewards() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedTab, setSelectedTab] = useState("overview");
  const [userPoints, setUserPoints] = useState(3247);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatNumber = (number: number) => {
    return new Intl.NumberFormat("en-US").format(number);
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const handleRedeemReward = (reward: RewardItem) => {
    if (userPoints < reward.cost) {
      toast({
        title: "Insufficient points",
        description: `You need ${reward.cost - userPoints} more points to redeem this reward`,
        variant: "destructive",
      });
      return;
    }

    setSelectedReward(reward);
    setShowRedeemModal(true);
  };

  const confirmRedeem = () => {
    if (selectedReward) {
      setUserPoints((prev) => prev - selectedReward.cost);
      setShowRedeemModal(false);
      toast({
        title: "Reward redeemed!",
        description: `You've successfully redeemed ${selectedReward.title}`,
      });
      setSelectedReward(null);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "earnings", label: "Earnings", icon: DollarSign },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "achievements", label: "Achievements", icon: Award },
    { id: "rewards", label: "Rewards", icon: Gift },
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
              <h1 className="text-xl font-bold text-white">Rewards</h1>
              <p className="text-sm text-gray-400">Earn and redeem points</p>
            </div>
          </div>

          {/* Points Display */}
          <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-primary/20 to-purple-secondary/20 rounded-full px-4 py-2 border border-purple-primary/30">
            <Coins className="w-5 h-5 text-yellow-400" />
            <span className="font-bold text-white">
              {formatNumber(userPoints)}
            </span>
            <span className="text-xs text-gray-400">points</span>
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
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-24">
          <AnimatePresence mode="wait">
            {/* Overview Tab */}
            {selectedTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-dark/30 rounded-2xl p-4 border border-purple-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-400">
                        Total Earnings
                      </h3>
                      <DollarSign className="w-4 h-4 text-green-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(sampleEarnings.totalEarnings)}
                    </p>
                    <p className="text-xs text-green-400">
                      +
                      {calculateGrowth(
                        sampleEarnings.thisMonth,
                        sampleEarnings.lastMonth,
                      ).toFixed(1)}
                      % this month
                    </p>
                  </div>

                  <div className="bg-purple-dark/30 rounded-2xl p-4 border border-purple-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-400">
                        Total Plays
                      </h3>
                      <Play className="w-4 h-4 text-purple-primary" />
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {formatNumber(sampleEarnings.totalPlays)}
                    </p>
                    <p className="text-xs text-purple-accent">
                      Across all tracks
                    </p>
                  </div>
                </div>

                {/* Recent Achievements */}
                <div className="bg-purple-dark/30 rounded-2xl p-6 border border-purple-primary/20">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <Star className="w-5 h-5 mr-2 text-yellow-400" />
                    Recent Achievements
                  </h3>
                  <div className="space-y-3">
                    {sampleAchievements
                      .filter((a) => a.unlockedAt)
                      .slice(0, 3)
                      .map((achievement) => (
                        <div
                          key={achievement.id}
                          className="flex items-center space-x-3 p-3 bg-purple-primary/10 rounded-xl"
                        >
                          <div className="text-2xl">{achievement.icon}</div>
                          <div className="flex-1">
                            <h4 className="font-medium text-white">
                              {achievement.title}
                            </h4>
                            <p className="text-sm text-gray-400">
                              {achievement.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-1 text-yellow-400">
                              <Coins className="w-4 h-4" />
                              <span className="font-bold">
                                +{achievement.reward}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Top Rewards */}
                <div className="bg-purple-dark/30 rounded-2xl p-6 border border-purple-primary/20">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <Gift className="w-5 h-5 mr-2 text-pink-400" />
                    Featured Rewards
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {sampleRewards.slice(0, 4).map((reward) => (
                      <div
                        key={reward.id}
                        className="bg-purple-primary/5 rounded-xl p-4 border border-purple-primary/10"
                      >
                        <img
                          src={reward.imageUrl}
                          alt={reward.title}
                          className="w-full h-24 rounded-lg object-cover mb-3"
                        />
                        <h4 className="font-medium text-white mb-1">
                          {reward.title}
                        </h4>
                        <p className="text-xs text-gray-400 mb-2">
                          {reward.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 text-yellow-400">
                            <Coins className="w-3 h-3" />
                            <span className="text-sm font-bold">
                              {formatNumber(reward.cost)}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRedeemReward(reward)}
                            disabled={
                              !reward.available || userPoints < reward.cost
                            }
                            className="px-3 py-1 bg-purple-primary rounded-lg text-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {userPoints < reward.cost ? "Need more" : "Redeem"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Earnings Tab */}
            {selectedTab === "earnings" && (
              <motion.div
                key="earnings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Earnings Overview */}
                <div className="bg-gradient-to-r from-purple-primary/20 to-purple-secondary/20 rounded-2xl p-6 border border-purple-primary/30">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Total Earnings
                  </h3>
                  <p className="text-4xl font-bold text-transparent bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text mb-4">
                    {formatCurrency(sampleEarnings.totalEarnings)}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">This Month</p>
                      <p className="text-xl font-bold text-white">
                        {formatCurrency(sampleEarnings.thisMonth)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Last Month</p>
                      <p className="text-xl font-bold text-white">
                        {formatCurrency(sampleEarnings.lastMonth)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Earnings Breakdown */}
                <div className="bg-purple-dark/30 rounded-2xl p-6 border border-purple-primary/20">
                  <h3 className="text-lg font-bold text-white mb-4">
                    Earnings Breakdown
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-purple-primary/10 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Play className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="font-medium text-white">
                            Streaming Revenue
                          </p>
                          <p className="text-sm text-gray-400">
                            {formatNumber(sampleEarnings.totalPlays)} plays
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-green-400">
                        {formatCurrency(
                          sampleEarnings.totalPlays *
                            sampleEarnings.averageEarningPerPlay,
                        )}
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-primary/10 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Download className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="font-medium text-white">
                            Download Revenue
                          </p>
                          <p className="text-sm text-gray-400">
                            {formatNumber(sampleEarnings.totalDownloads)}{" "}
                            downloads
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-blue-400">
                        {formatCurrency(sampleEarnings.totalDownloads * 0.15)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-primary/10 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Gift className="w-5 h-5 text-purple-400" />
                        <div>
                          <p className="font-medium text-white">
                            Bonus Rewards
                          </p>
                          <p className="text-sm text-gray-400">
                            Achievements & milestones
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-purple-400">$142.50</p>
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="bg-purple-dark/30 rounded-2xl p-6 border border-purple-primary/20">
                  <h3 className="text-lg font-bold text-white mb-4">
                    Payment Methods
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-purple-primary/10 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="font-medium text-white">PayPal</p>
                          <p className="text-sm text-gray-400">
                            user@email.com
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                        Active
                      </span>
                    </div>

                    <button className="w-full p-3 border-2 border-dashed border-purple-primary/50 rounded-xl text-purple-primary hover:border-purple-primary transition-colors">
                      + Add Payment Method
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Leaderboard Tab */}
            {selectedTab === "leaderboard" && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Top Artists
                  </h2>
                  <p className="text-gray-400">This month's highest earners</p>
                </div>

                {sampleLeaderboard.map((entry, index) => (
                  <motion.div
                    key={entry.rank}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative p-4 rounded-2xl border transition-all ${
                      entry.isCurrentUser
                        ? "bg-gradient-to-r from-purple-primary/20 to-purple-secondary/20 border-purple-primary/50"
                        : "bg-purple-dark/30 border-purple-primary/20"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Rank */}
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                          entry.rank === 1
                            ? "bg-yellow-500 text-black"
                            : entry.rank === 2
                              ? "bg-gray-400 text-black"
                              : entry.rank === 3
                                ? "bg-amber-600 text-white"
                                : "bg-purple-primary/20 text-white"
                        }`}
                      >
                        {entry.rank <= 3 ? (
                          entry.rank === 1 ? (
                            <Crown className="w-5 h-5" />
                          ) : entry.rank === 2 ? (
                            <Medal className="w-5 h-5" />
                          ) : (
                            <Award className="w-5 h-5" />
                          )
                        ) : (
                          entry.rank
                        )}
                      </div>

                      {/* Avatar */}
                      <img
                        src={entry.avatar}
                        alt={entry.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />

                      {/* Info */}
                      <div className="flex-1">
                        <h3
                          className={`font-medium ${entry.isCurrentUser ? "text-purple-accent" : "text-white"}`}
                        >
                          {entry.name}
                          {entry.isCurrentUser && (
                            <span className="ml-2 px-2 py-1 bg-purple-primary/20 text-purple-accent rounded-full text-xs">
                              You
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span>{formatNumber(entry.plays)} plays</span>
                          <span>{formatCurrency(entry.earnings)}</span>
                        </div>
                      </div>

                      {/* Trending */}
                      {entry.rank <= 3 && (
                        <div className="flex items-center space-x-1 text-green-400">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-sm font-medium">Hot</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                <div className="text-center pt-4">
                  <p className="text-gray-400 text-sm">
                    Rankings update daily based on monthly earnings
                  </p>
                </div>
              </motion.div>
            )}

            {/* Achievements Tab */}
            {selectedTab === "achievements" && (
              <motion.div
                key="achievements"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Achievements
                  </h2>
                  <p className="text-gray-400">
                    Complete challenges to earn rewards
                  </p>
                </div>

                <div className="grid gap-4">
                  {sampleAchievements.map((achievement, index) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-2xl border transition-all ${
                        achievement.unlockedAt
                          ? "bg-gradient-to-r from-green-500/20 to-blue-500/20 border-green-500/50"
                          : "bg-purple-dark/30 border-purple-primary/20"
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`text-3xl ${achievement.unlockedAt ? "" : "grayscale opacity-50"}`}
                        >
                          {achievement.icon}
                        </div>

                        <div className="flex-1">
                          <h3
                            className={`font-bold mb-1 ${achievement.unlockedAt ? "text-white" : "text-gray-400"}`}
                          >
                            {achievement.title}
                          </h3>
                          <p className="text-sm text-gray-400 mb-2">
                            {achievement.description}
                          </p>

                          {/* Progress Bar for incomplete achievements */}
                          {!achievement.unlockedAt &&
                            achievement.progress !== undefined &&
                            achievement.maxProgress && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-400">
                                    Progress
                                  </span>
                                  <span className="text-white">
                                    {achievement.progress}/
                                    {achievement.maxProgress}
                                  </span>
                                </div>
                                <div className="w-full bg-purple-dark/50 rounded-full h-2">
                                  <motion.div
                                    className="bg-gradient-to-r from-purple-primary to-purple-secondary h-2 rounded-full"
                                    style={{
                                      width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                          {achievement.unlockedAt && (
                            <div className="flex items-center space-x-2 text-xs text-green-400">
                              <Check className="w-4 h-4" />
                              <span>
                                Unlocked{" "}
                                {achievement.unlockedAt.toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <div
                            className={`flex items-center space-x-1 ${achievement.unlockedAt ? "text-yellow-400" : "text-gray-500"}`}
                          >
                            <Coins className="w-4 h-4" />
                            <span className="font-bold">
                              +{achievement.reward}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">points</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Rewards Tab */}
            {selectedTab === "rewards" && (
              <motion.div
                key="rewards"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Redeem Rewards
                  </h2>
                  <p className="text-gray-400">
                    Use your points to get amazing rewards
                  </p>
                </div>

                <div className="grid gap-6">
                  {sampleRewards.map((reward, index) => (
                    <motion.div
                      key={reward.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-purple-dark/30 rounded-2xl p-6 border border-purple-primary/20 ${
                        !reward.available ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex space-x-4">
                        <img
                          src={reward.imageUrl}
                          alt={reward.title}
                          className="w-24 h-24 rounded-xl object-cover"
                        />

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-bold text-white">
                              {reward.title}
                            </h3>
                            {!reward.available && (
                              <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
                                Sold Out
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm mb-4">
                            {reward.description}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Coins className="w-5 h-5 text-yellow-400" />
                              <span className="text-xl font-bold text-white">
                                {formatNumber(reward.cost)}
                              </span>
                              <span className="text-sm text-gray-400">
                                points
                              </span>
                            </div>

                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleRedeemReward(reward)}
                              disabled={
                                !reward.available || userPoints < reward.cost
                              }
                              className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                                !reward.available || userPoints < reward.cost
                                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                  : "bg-purple-primary text-white hover:bg-purple-secondary"
                              }`}
                            >
                              {!reward.available
                                ? "Unavailable"
                                : userPoints < reward.cost
                                  ? "Need More Points"
                                  : "Redeem"}
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Redeem Confirmation Modal */}
        <AnimatePresence>
          {showRedeemModal && selectedReward && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowRedeemModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-purple-dark rounded-2xl p-6 w-full max-w-md border border-purple-primary/30"
              >
                <h2 className="text-xl font-bold text-white mb-4">
                  Confirm Redemption
                </h2>

                <div className="flex items-center space-x-4 mb-6">
                  <img
                    src={selectedReward.imageUrl}
                    alt={selectedReward.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-white">
                      {selectedReward.title}
                    </h3>
                    <div className="flex items-center space-x-1 text-yellow-400">
                      <Coins className="w-4 h-4" />
                      <span className="font-bold">
                        {formatNumber(selectedReward.cost)} points
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Current Points:</span>
                    <span className="text-white">
                      {formatNumber(userPoints)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Cost:</span>
                    <span className="text-red-400">
                      -{formatNumber(selectedReward.cost)}
                    </span>
                  </div>
                  <hr className="border-purple-primary/20 my-2" />
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-gray-400">Remaining Points:</span>
                    <span className="text-white">
                      {formatNumber(userPoints - selectedReward.cost)}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowRedeemModal(false)}
                    className="flex-1 py-3 bg-gray-600 rounded-xl text-white font-medium"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmRedeem}
                    className="flex-1 py-3 bg-purple-primary rounded-xl text-white font-medium"
                  >
                    Redeem Now
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
