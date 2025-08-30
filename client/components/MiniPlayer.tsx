import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Volume1,
  Shuffle,
  Repeat,
  MoreHorizontal,
  Maximize2,
  ChevronUp,
  List,
} from "lucide-react";
import { useEnhancedMusic } from "../context/EnhancedMusicContext";
import LikeButton from "./LikeButton";
import { useFirebase } from "../context/FirebaseContext";

export function MiniPlayer() {
  const {
    currentSong,
    isPlaying,
    pauseSong,
    resumeSong,
    nextSong,
    previousSong,
    volume,
    setVolume,
    currentTime,
    duration,
    isShuffle,
    isRepeat,
    toggleShuffle,
    toggleRepeat,
  } = useEnhancedMusic();

  const togglePlay = () => {
    if (isPlaying) {
      pauseSong();
    } else {
      resumeSong();
    }
  };
  const { user: firebaseUser } = useFirebase();

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Save playback preferences to Firebase user's profile
  useEffect(() => {
    if (firebaseUser && volume !== undefined) {
      // Save volume preference
      localStorage.setItem(`firebase_${firebaseUser.uid}_volume`, volume.toString());
    }
  }, [volume, firebaseUser]);

  useEffect(() => {
    if (firebaseUser && (isShuffle !== undefined || isRepeat !== undefined)) {
      // Save playback mode preferences
      localStorage.setItem(`firebase_${firebaseUser.uid}_shuffle`, isShuffle.toString());
      localStorage.setItem(`firebase_${firebaseUser.uid}_repeat`, isRepeat.toString());
    }
  }, [isShuffle, isRepeat, firebaseUser]);

  // Load user preferences on mount
  useEffect(() => {
    if (firebaseUser) {
      const savedVolume = localStorage.getItem(`firebase_${firebaseUser.uid}_volume`);
      const savedShuffle = localStorage.getItem(`firebase_${firebaseUser.uid}_shuffle`);
      const savedRepeat = localStorage.getItem(`firebase_${firebaseUser.uid}_repeat`);

      if (savedVolume && setVolume) {
        setVolume(parseFloat(savedVolume));
      }
      if (savedShuffle && toggleShuffle) {
        // Only update if different from current state
        const shouldShuffle = savedShuffle === 'true';
        if (shouldShuffle !== isShuffle) {
          console.log('🔥 Loading Firebase user shuffle preference:', shouldShuffle);
        }
      }
      if (savedRepeat && toggleRepeat) {
        // Only update if different from current state
        const shouldRepeat = savedRepeat === 'true';
        if (shouldRepeat !== isRepeat) {
          console.log('🔥 Loading Firebase user repeat preference:', shouldRepeat);
        }
      }
    }
  }, [firebaseUser]);

  if (!currentSong) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    // In a real app, you'd set the current time here
  };

  const getVolumeIcon = () => {
    if (volume === 0) return VolumeX;
    if (volume < 50) return Volume1;
    return Volume2;
  };

  const VolumeIcon = getVolumeIcon();

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-purple-primary/30 z-50"
    >
      {/* Progress Bar */}
      <div
        className="h-1.5 bg-purple-dark/40 cursor-pointer relative group"
        onClick={handleProgressClick}
      >
        <div
          className="h-full bg-gradient-to-r from-purple-primary to-purple-secondary relative rounded-full"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-gradient-to-r from-purple-primary to-purple-secondary rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-purple-primary/50" />
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Song Info */}
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <Link to="/player" className="flex items-center space-x-3 min-w-0">
            <img
              src={currentSong.image}
              alt={currentSong.title}
              className="w-14 h-14 rounded-xl object-cover shadow-lg"
            />
            <div className="min-w-0">
              <h3 className="text-white font-medium text-sm truncate">
                {currentSong.title}
              </h3>
              <p className="text-gray-400 text-xs truncate">
                {currentSong.artist}
              </p>
            </div>
          </Link>

          <LikeButton
            songId={currentSong.id}
            size="sm"
            className="opacity-80 hover:opacity-100"
          />
        </div>

        {/* Center: Player Controls */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleShuffle}
            className={`p-2 rounded-full transition-all duration-200 ${
              isShuffle ? "text-purple-primary bg-purple-primary/20" : "text-gray-400 hover:text-purple-primary hover:bg-purple-primary/10"
            }`}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={previousSong}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={togglePlay}
            className="w-12 h-12 bg-gradient-to-r from-purple-primary to-purple-secondary rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 shadow-lg shadow-purple-primary/40"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" />
            )}
          </button>

          <button
            onClick={nextSong}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          <button
            onClick={toggleRepeat}
            className={`p-2 rounded-full transition-all duration-200 ${
              isRepeat ? "text-purple-primary bg-purple-primary/20" : "text-gray-400 hover:text-purple-primary hover:bg-purple-primary/10"
            }`}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Volume & Additional Controls */}
        <div className="flex items-center space-x-4 flex-1 justify-end">
          <div className="hidden md:flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <List className="w-4 h-4" />
            </button>

            <div
              className="relative flex items-center space-x-2"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <VolumeIcon className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showVolumeSlider && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="w-24"
                  >
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-full h-1.5 bg-purple-dark/40 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>

          <Link
            to="/player"
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Mobile Controls Overlay */}
      <div className="md:hidden">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-white/10 p-4 space-y-4"
            >
              {/* Volume Control */}
              <div className="flex items-center space-x-4">
                <VolumeIcon className="w-5 h-5 text-gray-400" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="flex-1 h-2 bg-purple-dark/40 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Additional Controls */}
              <div className="flex justify-around">
                <button
                  onClick={toggleShuffle}
                  className={`p-3 rounded-full transition-all duration-200 ${
                    isShuffle
                      ? "bg-purple-primary/20 text-purple-primary"
                      : "text-gray-400 hover:text-purple-primary hover:bg-purple-primary/10"
                  }`}
                >
                  <Shuffle className="w-5 h-5" />
                </button>

                <button
                  onClick={toggleRepeat}
                  className={`p-3 rounded-full transition-all duration-200 ${
                    isRepeat
                      ? "bg-purple-primary/20 text-purple-primary"
                      : "text-gray-400 hover:text-purple-primary hover:bg-purple-primary/10"
                  }`}
                >
                  <Repeat className="w-5 h-5" />
                </button>

                <button className="p-3 text-gray-400">
                  <List className="w-5 h-5" />
                </button>

                <button className="p-3 text-gray-400">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/10 rounded-full p-1"
        >
          <ChevronUp
            className={`w-4 h-4 text-white transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: linear-gradient(135deg, hsl(267, 83%, 58%), hsl(285, 85%, 65%));
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(167, 139, 250, 0.3);
        }

        .slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: linear-gradient(135deg, hsl(267, 83%, 58%), hsl(285, 85%, 65%));
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(167, 139, 250, 0.3);
        }

        .slider::-webkit-slider-track {
          background: linear-gradient(to right, hsl(267, 83%, 58%), hsl(285, 85%, 65%));
          height: 6px;
          border-radius: 3px;
        }

        .slider::-moz-range-track {
          background: linear-gradient(to right, hsl(267, 83%, 58%), hsl(285, 85%, 65%));
          height: 6px;
          border-radius: 3px;
        }
      `}</style>
    </motion.div>
  );
}

export default MiniPlayer;
