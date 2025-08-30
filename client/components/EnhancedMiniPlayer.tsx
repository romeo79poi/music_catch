import React, { useState } from "react";
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
  Heart,
  MoreHorizontal,
  Maximize2,
  ChevronUp,
  ListMusic,
  Mic2,
  Cast,
  PictureInPicture,
  Monitor,
  Smartphone,
  Speaker,
  Headphones,
} from "lucide-react";
import { useEnhancedMusic } from "../context/EnhancedMusicContext";
import { CompactAudioPerformanceIndicator } from "./AudioPerformanceMonitor";

export default function EnhancedMiniPlayer() {
  const {
    audioState,
    playbackSettings,
    userPreferences,
    pauseSong,
    resumeSong,
    nextSong,
    previousSong,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    toggleLikeSong,
    seekTo,
  } = useEnhancedMusic();

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showDevices, setShowDevices] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const { currentSong, isPlaying, currentTime, duration, volume, isMuted } =
    audioState;
  const { isShuffle, repeatMode } = playbackSettings;

  if (!currentSong) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    seekTo(newTime);
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return VolumeX;
    if (volume < 0.3) return Volume1;
    return Volume2;
  };

  const VolumeIcon = getVolumeIcon();

  const devices = [
    { id: "computer", name: "This Computer", type: "computer", active: true },
    { id: "phone", name: "Your Phone", type: "smartphone", active: false },
    { id: "speaker", name: "Living Room", type: "speaker", active: false },
    {
      id: "headphones",
      name: "AirPods Pro",
      type: "headphones",
      active: false,
    },
  ];

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "computer":
        return Monitor;
      case "smartphone":
        return Smartphone;
      case "speaker":
        return Speaker;
      case "headphones":
        return Headphones;
      default:
        return Speaker;
    }
  };

  return (
    <>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 z-50"
      >
        {/* Progress Bar */}
        <div
          className="h-1 bg-white/20 cursor-pointer relative group"
          onClick={handleProgressClick}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-green-400 to-green-600 relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
          </motion.div>
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Song Info */}
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <Link
              to="/player"
              className="flex items-center space-x-3 min-w-0 group"
            >
              <div className="relative">
                <img
                  src={currentSong.coverImageURL}
                  alt={currentSong.title}
                  className="w-14 h-14 rounded-lg object-cover shadow-lg"
                />
                <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Maximize2 className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="min-w-0">
                <h3 className="text-white font-medium text-sm truncate hover:underline">
                  {currentSong.title}
                </h3>
                <p className="text-gray-400 text-xs truncate hover:underline">
                  {currentSong.artist}
                </p>
              </div>
            </Link>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => toggleLikeSong(currentSong.id)}
              className={`p-2 rounded-full transition-all ${
                userPreferences.likedSongs.has(currentSong.id)
                  ? "text-green-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Heart
                className={`w-4 h-4 ${
                  userPreferences.likedSongs.has(currentSong.id)
                    ? "fill-current"
                    : ""
                }`}
              />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowDevices(!showDevices)}
              className="p-2 rounded-full text-gray-400 hover:text-white transition-colors hidden md:block"
            >
              <PictureInPicture className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Center: Player Controls */}
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleShuffle}
              className={`p-2 rounded-full transition-all hidden md:flex ${
                isShuffle
                  ? "text-green-500 bg-green-500/20"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={previousSong}
              className="p-2 text-gray-300 hover:text-white transition-colors"
            >
              <SkipBack className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={isPlaying ? pauseSong : resumeSong}
              className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-lg"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextSong}
              className="p-2 text-gray-300 hover:text-white transition-colors"
            >
              <SkipForward className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleRepeat}
              className={`p-2 rounded-full transition-all hidden md:flex relative ${
                repeatMode !== "off"
                  ? "text-green-500 bg-green-500/20"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Repeat className="w-4 h-4" />
              {repeatMode === "one" && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full text-xs font-bold flex items-center justify-center text-white">
                  1
                </span>
              )}
            </motion.button>
          </div>

          {/* Right: Volume & Additional Controls */}
          <div className="flex items-center space-x-4 flex-1 justify-end">
            {/* C++ Performance Indicator */}
            <CompactAudioPerformanceIndicator className="hidden xl:flex" />

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 text-gray-400 hover:text-white transition-colors hidden lg:block"
            >
              <Mic2 className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 text-gray-400 hover:text-white transition-colors hidden lg:block"
            >
              <ListMusic className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowDevices(!showDevices)}
              className="p-2 text-gray-400 hover:text-white transition-colors hidden lg:block"
            >
              <Cast className="w-4 h-4" />
            </motion.button>

            <div
              className="hidden md:flex items-center space-x-2"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleMute}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <VolumeIcon className="w-4 h-4" />
              </motion.button>

              <AnimatePresence>
                {showVolumeSlider && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 100 }}
                    exit={{ opacity: 0, width: 0 }}
                    className="relative"
                  >
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer slider"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center space-x-2 text-xs text-gray-400 hidden sm:flex">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>

            <Link
              to="/player"
              className="p-2 text-gray-400 hover:text-white transition-colors hidden md:block"
            >
              <Maximize2 className="w-4 h-4" />
            </Link>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-white transition-colors md:hidden"
            >
              <ChevronUp
                className={`w-4 h-4 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </motion.button>
          </div>
        </div>

        {/* Mobile Controls Expansion */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-white/10 p-4 space-y-4 md:hidden"
            >
              {/* Volume Control */}
              <div className="flex items-center space-x-4">
                <VolumeIcon className="w-5 h-5 text-gray-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Additional Controls */}
              <div className="flex justify-around">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleShuffle}
                  className={`p-3 rounded-full transition-all ${
                    isShuffle
                      ? "bg-green-500/20 text-green-500"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Shuffle className="w-5 h-5" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleRepeat}
                  className={`p-3 rounded-full transition-all relative ${
                    repeatMode !== "off"
                      ? "bg-green-500/20 text-green-500"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Repeat className="w-5 h-5" />
                  {repeatMode === "one" && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full text-xs font-bold flex items-center justify-center text-white">
                      1
                    </span>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 text-gray-400 hover:text-white"
                >
                  <ListMusic className="w-5 h-5" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 text-gray-400 hover:text-white"
                >
                  <Mic2 className="w-5 h-5" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 text-gray-400 hover:text-white"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Devices Overlay */}
      <AnimatePresence>
        {showDevices && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-20 mx-4 md:bottom-24 md:right-4 md:left-auto md:w-80 bg-gray-900 backdrop-blur-xl border border-white/20 rounded-lg z-50 shadow-2xl"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Connect to a device
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowDevices(false)}
                  className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-gray-400"
                >
                  ×
                </motion.button>
              </div>

              <div className="space-y-3">
                {devices.map((device) => {
                  const DeviceIcon = getDeviceIcon(device.type);
                  return (
                    <motion.div
                      key={device.id}
                      whileHover={{
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                      }}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        device.active
                          ? "bg-green-500/20 border border-green-500/50"
                          : "bg-white/5"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <DeviceIcon
                          className={`w-6 h-6 ${device.active ? "text-green-500" : "text-gray-400"}`}
                        />
                        <div>
                          <p className="font-medium text-white">
                            {device.name}
                          </p>
                          <p className="text-sm text-gray-400 capitalize">
                            {device.type}
                          </p>
                        </div>
                      </div>
                      {device.active && (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-sm text-green-500">
                            Playing
                          </span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Styles */}
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .slider::-webkit-slider-track {
          background: linear-gradient(
            to right,
            #22c55e,
            rgba(255, 255, 255, 0.2)
          );
          height: 4px;
          border-radius: 2px;
        }

        .slider::-moz-range-track {
          background: linear-gradient(
            to right,
            #22c55e,
            rgba(255, 255, 255, 0.2)
          );
          height: 4px;
          border-radius: 2px;
        }
      `}</style>
    </>
  );
}
