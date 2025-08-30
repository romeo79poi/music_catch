import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  MoreHorizontal,
  User,
  UserPlus,
  UserCheck,
  Camera,
  VideoIcon,
  Mic,
  Sparkles,
  TrendingUp,
  Flame,
  Hash,
  Download,
  Flag,
  Plus,
  Search,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useFirebase } from "../context/FirebaseContext";
import MobileFooter from "../components/MobileFooter";

interface Reel {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  hashtags: string[];
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    isVerified: boolean;
    isFollowing: boolean;
  };
  audio: {
    id: string;
    title: string;
    artist: string;
    coverUrl: string;
    duration: number;
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  isLiked: boolean;
  isPlaying: boolean;
  viralScore: number;
  createdAt: Date;
}

interface Comment {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  text: string;
  likes: number;
  isLiked: boolean;
  createdAt: Date;
  replies?: Comment[];
}

const sampleReels: Reel[] = [
  {
    id: "1",
    videoUrl: "https://example.com/video1.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=600&fit=crop",
    title: "Epic Guitar Solo 🎸",
    description:
      "When the beat drops and you feel the music in your soul! 🔥 #guitar #music #vibes",
    hashtags: ["guitar", "music", "vibes", "epic", "solo"],
    author: {
      id: "user1",
      name: "Alex Johnson",
      username: "@alexguitar",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop",
      isVerified: true,
      isFollowing: false,
    },
    audio: {
      id: "audio1",
      title: "Epic Guitar Solo",
      artist: "Alex Johnson",
      coverUrl:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=60&h=60&fit=crop",
      duration: 30,
    },
    stats: {
      likes: 15420,
      comments: 342,
      shares: 89,
      views: 45230,
    },
    isLiked: false,
    isPlaying: false,
    viralScore: 89,
    createdAt: new Date("2024-01-15T10:30:00Z"),
  },
  {
    id: "2",
    videoUrl: "https://example.com/video2.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop",
    title: "Piano Freestyle 🎹",
    description:
      "Late night studio sessions hit different ✨ What's your favorite time to create music?",
    hashtags: ["piano", "freestyle", "latenight", "studio", "creativity"],
    author: {
      id: "user2",
      name: "Luna Wave",
      username: "@lunawave",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop",
      isVerified: true,
      isFollowing: true,
    },
    audio: {
      id: "audio2",
      title: "Midnight Keys",
      artist: "Luna Wave",
      coverUrl:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop",
      duration: 25,
    },
    stats: {
      likes: 23890,
      comments: 567,
      shares: 156,
      views: 78450,
    },
    isLiked: true,
    isPlaying: false,
    viralScore: 94,
    createdAt: new Date("2024-01-14T22:15:00Z"),
  },
  {
    id: "3",
    videoUrl: "https://example.com/video3.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop",
    title: "Beatbox Skills 🎤",
    description: "No instruments, just pure talent! Can you beat this? 💫",
    hashtags: ["beatbox", "vocal", "talent", "skills", "challenge"],
    author: {
      id: "user3",
      name: "Beat Master",
      username: "@beatmaster",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop",
      isVerified: false,
      isFollowing: false,
    },
    audio: {
      id: "audio3",
      title: "Vocal Beats",
      artist: "Beat Master",
      coverUrl:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop",
      duration: 20,
    },
    stats: {
      likes: 8930,
      comments: 234,
      shares: 67,
      views: 29340,
    },
    isLiked: false,
    isPlaying: false,
    viralScore: 76,
    createdAt: new Date("2024-01-13T16:45:00Z"),
  },
];

const sampleComments: Comment[] = [
  {
    id: "1",
    userId: "commenter1",
    username: "musiclover23",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop",
    text: "This is absolutely incredible! 🔥🔥🔥",
    likes: 45,
    isLiked: false,
    createdAt: new Date("2024-01-15T11:00:00Z"),
  },
  {
    id: "2",
    userId: "commenter2",
    username: "guitargeek",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop",
    text: "What guitar are you using? The tone is perfect!",
    likes: 23,
    isLiked: true,
    createdAt: new Date("2024-01-15T11:15:00Z"),
  },
  {
    id: "3",
    userId: "commenter3",
    username: "producer_pro",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop",
    text: "Need to collab ASAP! This is fire! 🎸✨",
    likes: 67,
    isLiked: false,
    createdAt: new Date("2024-01-15T12:30:00Z"),
  },
];

export default function Reels() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: firebaseUser, loading: firebaseLoading } = useFirebase();

  const [reels, setReels] = useState<Reel[]>(sampleReels);
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>(sampleComments);
  const [commentText, setCommentText] = useState("");
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentReel = reels[currentReelIndex];

  // Auto-play current video
  useEffect(() => {
    const currentVideo = videoRefs.current[currentReelIndex];
    if (currentVideo) {
      currentVideo.currentTime = 0;
      currentVideo.play().catch(console.error);

      // Update playing state
      setReels((prev) =>
        prev.map((reel, index) => ({
          ...reel,
          isPlaying: index === currentReelIndex,
        })),
      );
    }

    // Pause other videos
    videoRefs.current.forEach((video, index) => {
      if (video && index !== currentReelIndex) {
        video.pause();
      }
    });
  }, [currentReelIndex]);

  // Handle scroll to change reels
  const handleScroll = () => {
    if (!containerRef.current) return;

    const scrollTop = containerRef.current.scrollTop;
    const reelHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / reelHeight);

    if (
      newIndex !== currentReelIndex &&
      newIndex >= 0 &&
      newIndex < reels.length
    ) {
      setCurrentReelIndex(newIndex);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleLike = (reelId: string) => {
    setReels((prev) =>
      prev.map((reel) =>
        reel.id === reelId
          ? {
              ...reel,
              isLiked: !reel.isLiked,
              stats: {
                ...reel.stats,
                likes: reel.isLiked
                  ? reel.stats.likes - 1
                  : reel.stats.likes + 1,
              },
            }
          : reel,
      ),
    );
  };

  const handleFollow = (userId: string) => {
    setReels((prev) =>
      prev.map((reel) =>
        reel.author.id === userId
          ? {
              ...reel,
              author: {
                ...reel.author,
                isFollowing: !reel.author.isFollowing,
              },
            }
          : reel,
      ),
    );

    toast({
      title: reels.find((r) => r.author.id === userId)?.author.isFollowing
        ? "Unfollowed"
        : "Following",
      description: reels.find((r) => r.author.id === userId)?.author.isFollowing
        ? `You unfollowed ${reels.find((r) => r.author.id === userId)?.author.name}`
        : `You're now following ${reels.find((r) => r.author.id === userId)?.author.name}`,
    });
  };

  const handleShare = (reel: Reel) => {
    if (navigator.share) {
      navigator.share({
        title: reel.title,
        text: reel.description,
        url: `https://catchmusic.app/reels/${reel.id}`,
      });
    } else {
      navigator.clipboard.writeText(`https://catchmusic.app/reels/${reel.id}`);
      toast({
        title: "Link copied!",
        description: "Reel link copied to clipboard",
      });
    }
  };

  const addComment = () => {
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      userId: "current_user",
      username: "You",
      avatar:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=40&h=40&fit=crop",
      text: commentText,
      likes: 0,
      isLiked: false,
      createdAt: new Date(),
    };

    setComments((prev) => [newComment, ...prev]);
    setCommentText("");

    // Update comment count
    setReels((prev) =>
      prev.map((reel) =>
        reel.id === currentReel.id
          ? {
              ...reel,
              stats: { ...reel.stats, comments: reel.stats.comments + 1 },
            }
          : reel,
      ),
    );

    toast({
      title: "Comment added!",
      description: "Your comment has been posted",
    });
  };

  const likeComment = (commentId: string) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              isLiked: !comment.isLiked,
              likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
            }
          : comment,
      ),
    );
  };

  return (
    <div className="h-screen bg-black relative overflow-hidden">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent"
      >
        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/home")}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>

          <h1 className="text-lg font-bold text-white">Reels</h1>
        </div>

        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
          >
            <Search className="w-5 h-5 text-white" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/upload")}
            className="w-10 h-10 rounded-full bg-purple-primary backdrop-blur-sm flex items-center justify-center"
          >
            <Camera className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </motion.header>

      {/* Reels Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {reels.map((reel, index) => (
          <div key={reel.id} className="h-screen w-full relative snap-start">
            {/* Background Video */}
            <video
              ref={(el) => (videoRefs.current[index] = el)}
              src={reel.videoUrl}
              poster={reel.thumbnailUrl}
              loop
              muted={isMuted}
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              onEnded={() => {
                // Auto advance to next reel when current ends
                if (index < reels.length - 1) {
                  setCurrentReelIndex(index + 1);
                  containerRef.current?.scrollTo({
                    top: (index + 1) * window.innerHeight,
                    behavior: "smooth",
                  });
                }
              }}
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/40" />

            {/* Content */}
            <div className="absolute inset-0 flex">
              {/* Left side - Video interaction area */}
              <div
                className="flex-1 flex items-center justify-center"
                onClick={() => {
                  const video = videoRefs.current[index];
                  if (video) {
                    if (video.paused) {
                      video.play();
                    } else {
                      video.pause();
                    }
                  }
                }}
              >
                {/* Play/Pause indicator */}
                <AnimatePresence>
                  {!reel.isPlaying && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
                    >
                      <Play className="w-8 h-8 text-white ml-1" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right side - Actions */}
              <div className="flex flex-col items-center justify-end space-y-4 p-4 pb-32">
                {/* Author */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="relative">
                    <img
                      src={reel.author.avatar}
                      alt={reel.author.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white"
                    />
                    {reel.author.isVerified && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-3 h-3 bg-white rounded-full"
                        />
                      </div>
                    )}
                  </div>

                  {!reel.author.isFollowing && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleFollow(reel.author.id)}
                      className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </motion.button>
                  )}
                </div>

                {/* Like */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleLike(reel.id)}
                  className="flex flex-col items-center space-y-1"
                >
                  <div
                    className={`w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center ${
                      reel.isLiked ? "bg-red-500/20" : ""
                    }`}
                  >
                    <Heart
                      className={`w-6 h-6 ${reel.isLiked ? "text-red-500 fill-current" : "text-white"}`}
                    />
                  </div>
                  <span className="text-white text-xs font-medium">
                    {formatNumber(reel.stats.likes)}
                  </span>
                </motion.button>

                {/* Comments */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowComments(true)}
                  className="flex flex-col items-center space-y-1"
                >
                  <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-white text-xs font-medium">
                    {formatNumber(reel.stats.comments)}
                  </span>
                </motion.button>

                {/* Share */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleShare(reel)}
                  className="flex flex-col items-center space-y-1"
                >
                  <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <Share2 className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-white text-xs font-medium">
                    {formatNumber(reel.stats.shares)}
                  </span>
                </motion.button>

                {/* More Actions */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowMoreActions(true)}
                  className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
                >
                  <MoreHorizontal className="w-6 h-6 text-white" />
                </motion.button>

                {/* Audio/Music Info */}
                <motion.div
                  animate={{ rotate: reel.isPlaying ? 360 : 0 }}
                  transition={{
                    duration: 3,
                    repeat: reel.isPlaying ? Infinity : 0,
                    ease: "linear",
                  }}
                  className="w-12 h-12 rounded-full overflow-hidden border-2 border-white"
                >
                  <img
                    src={reel.audio.coverUrl}
                    alt={reel.audio.title}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              </div>
            </div>

            {/* Bottom Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-24">
              <div className="max-w-xs">
                {/* Author Info */}
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-bold text-white">
                    @{reel.author.username}
                  </span>
                  {reel.author.isVerified && (
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                  {reel.viralScore > 80 && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-red-500/20 rounded-full">
                      <Flame className="w-3 h-3 text-red-400" />
                      <span className="text-xs text-red-400 font-medium">
                        Viral
                      </span>
                    </div>
                  )}
                </div>

                {/* Title and Description */}
                <h3 className="text-white font-semibold mb-1">{reel.title}</h3>
                <p className="text-white/90 text-sm mb-2 leading-relaxed">
                  {reel.description}
                </p>

                {/* Hashtags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {reel.hashtags.map((tag, tagIndex) => (
                    <span key={tagIndex} className="text-purple-accent text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Audio Info */}
                <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-2">
                  <Music className="w-4 h-4 text-white" />
                  <span className="text-white text-sm font-medium truncate flex-1">
                    {reel.audio.title} • {reel.audio.artist}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsMuted(!isMuted)}
                    className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-white" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-white" />
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comments Modal */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 top-1/3 bg-purple-darker/95 backdrop-blur-xl border-t border-purple-primary/30 z-50 rounded-t-3xl"
          >
            <div className="flex flex-col h-full">
              {/* Handle */}
              <div className="flex justify-center py-4">
                <div className="w-12 h-1 bg-gray-400 rounded-full"></div>
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 pb-4">
                <h3 className="text-lg font-bold text-white">
                  {formatNumber(currentReel.stats.comments)} comments
                </h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowComments(false)}
                  className="w-8 h-8 rounded-full bg-purple-dark/50 flex items-center justify-center"
                >
                  <ArrowLeft className="w-4 h-4 text-white" />
                </motion.button>
              </div>

              {/* Comments List */}
              <div className="flex-1 px-6 overflow-y-auto">
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      <img
                        src={comment.avatar}
                        alt={comment.username}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-white text-sm">
                            {comment.username}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {formatTimeAgo(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-white text-sm leading-relaxed mb-2">
                          {comment.text}
                        </p>
                        <div className="flex items-center space-x-4">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => likeComment(comment.id)}
                            className="flex items-center space-x-1"
                          >
                            <Heart
                              className={`w-3 h-3 ${comment.isLiked ? "text-red-500 fill-current" : "text-gray-400"}`}
                            />
                            <span className="text-xs text-gray-400">
                              {comment.likes > 0
                                ? formatNumber(comment.likes)
                                : ""}
                            </span>
                          </motion.button>
                          <button className="text-xs text-gray-400 hover:text-white">
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comment Input */}
              <div className="p-6 border-t border-purple-primary/20">
                <div className="flex space-x-3">
                  <img
                    src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=40&h=40&fit=crop"
                    alt="You"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1 flex space-x-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addComment()}
                      placeholder="Add a comment..."
                      className="flex-1 bg-purple-dark/50 border border-purple-primary/30 rounded-full px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-primary text-sm"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={addComment}
                      disabled={!commentText.trim()}
                      className="px-4 py-2 bg-purple-primary rounded-full text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Post
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* More Actions Modal */}
      <AnimatePresence>
        {showMoreActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center p-4"
            onClick={() => setShowMoreActions(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-purple-dark rounded-2xl w-full max-w-sm border border-purple-primary/30"
            >
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-4 text-center">
                  More Actions
                </h3>

                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-3 bg-purple-primary/20 rounded-xl text-white flex items-center space-x-3"
                  >
                    <Download className="w-5 h-5" />
                    <span>Save Video</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-3 bg-purple-primary/20 rounded-xl text-white flex items-center space-x-3"
                  >
                    <User className="w-5 h-5" />
                    <span>View Profile</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-3 bg-purple-primary/20 rounded-xl text-white flex items-center space-x-3"
                  >
                    <Flag className="w-5 h-5" />
                    <span>Report</span>
                  </motion.button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowMoreActions(false)}
                  className="w-full py-3 mt-4 bg-gray-600 rounded-xl text-white font-medium"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Footer */}
      <MobileFooter />
    </div>
  );
}
