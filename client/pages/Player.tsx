import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  Volume2,
  VolumeX,
  Volume1,
  ChevronDown,
  MoreHorizontal,
  Share,
  Download,
  Plus,
  Mic2,
  ListMusic,
  Cast,
  PictureInPicture,
  Monitor,
  Smartphone,
  Speaker,
  Headphones,
} from "lucide-react";
import { useEnhancedMusic } from "../context/EnhancedMusicContext";
import { useToast } from "../hooks/use-toast";

export default function Player() {
  const navigate = useNavigate();
  const { toast } = useToast();
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

  const [showLyrics, setShowLyrics] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showDevices, setShowDevices] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const { currentSong, isPlaying, currentTime, duration, volume, isMuted } =
    audioState;
  const { isShuffle, repeatMode } = playbackSettings;

  if (!currentSong) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4 border-2 border-white/20 border-t-white rounded-full"
          />
          <h2 className="text-xl font-semibold mb-2">No song selected</h2>
          <p className="text-gray-400 mb-6">
            Choose a song from the library to start playing
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/home")}
            className="px-6 py-3 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 transition-colors"
          >
            Browse Music
          </motion.button>
        </div>
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
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

  // Sample lyrics for demonstration
  const lyrics = [
    { time: 0, text: "🎵 Music is playing..." },
    { time: 10, text: "Feel the rhythm in your heart" },
    { time: 20, text: "Let the melody take you away" },
    { time: 30, text: "Dance to the beat of life" },
    { time: 40, text: "Music connects us all" },
    { time: 50, text: "🎵 Instrumental break" },
    { time: 60, text: "The power of sound and emotion" },
    { time: 70, text: "Creating memories through music" },
    { time: 80, text: "Every note tells a story" },
    { time: 90, text: "🎵 Fade out..." },
  ];

  const getCurrentLyric = () => {
    const currentLyric = lyrics
      .slice()
      .reverse()
      .find((lyric) => currentTime >= lyric.time);
    return currentLyric?.text || "🎵 Music is playing...";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/10 to-green-900/20" />

      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 flex items-center justify-between p-4 bg-black/20 backdrop-blur-xl border-b border-white/10"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.button>

        <div className="text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide">
            Playing from
          </p>
          <h1 className="text-sm font-semibold">CATCH Music</h1>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <MoreHorizontal className="w-5 h-5" />
        </motion.button>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8 pb-32">
        {/* Album Art */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="relative mb-8"
        >
          <div className="relative">
            <motion.img
              animate={{
                rotate: isPlaying ? 360 : 0,
                scale: isPlaying ? 1.02 : 1,
              }}
              transition={{
                rotate: {
                  duration: 20,
                  repeat: isPlaying ? Infinity : 0,
                  ease: "linear",
                },
                scale: { duration: 0.3 },
              }}
              src={currentSong.coverImageURL}
              alt={currentSong.title}
              className="w-72 h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-2xl object-cover shadow-2xl"
            />

            {/* Vinyl effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 via-transparent to-black/20" />

            {/* Glow effect */}
            <motion.div
              animate={{
                boxShadow: isPlaying
                  ? [
                      "0 0 20px rgba(34, 197, 94, 0.3)",
                      "0 0 40px rgba(34, 197, 94, 0.6)",
                      "0 0 20px rgba(34, 197, 94, 0.3)",
                    ]
                  : "0 0 20px rgba(34, 197, 94, 0.3)",
              }}
              transition={{ duration: 2, repeat: isPlaying ? Infinity : 0 }}
              className="absolute inset-0 rounded-2xl"
            />
          </div>
        </motion.div>

        {/* Song Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-8 max-w-md"
        >
          <div className="flex items-center justify-center space-x-2 mb-2">
            {currentSong.explicit && (
              <span className="bg-gray-500 text-white text-xs px-1.5 py-0.5 rounded">
                E
              </span>
            )}
            <span className="text-xs text-gray-400 uppercase tracking-wide">
              {currentSong.genre} • {currentSong.year}
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">
            {currentSong.title}
          </h2>
          <p className="text-lg text-gray-300 mb-4">{currentSong.artist}</p>

          {/* Current Lyric */}
          {showLyrics && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/40 backdrop-blur-sm rounded-lg p-4 mb-4"
            >
              <p className="text-green-400 text-lg font-medium">
                {getCurrentLyric()}
              </p>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => toggleLikeSong(currentSong.id)}
              className={`p-3 rounded-full transition-all ${
                userPreferences.likedSongs.has(currentSong.id)
                  ? "bg-green-500/20 text-green-500"
                  : "bg-white/10 text-gray-400 hover:text-white"
              }`}
            >
              <Heart
                className={`w-6 h-6 ${
                  userPreferences.likedSongs.has(currentSong.id)
                    ? "fill-current"
                    : ""
                }`}
              />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-3 rounded-full bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <Download className="w-6 h-6" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-3 rounded-full bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <Share className="w-6 h-6" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-3 rounded-full bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <Plus className="w-6 h-6" />
            </motion.button>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="w-full max-w-2xl mb-8"
        >
          <div
            onClick={handleSeek}
            className="relative h-2 bg-white/20 rounded-full cursor-pointer group mb-2"
          >
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
              style={{ width: `${progress}%` }}
            />
            <motion.div
              className="absolute top-1/2 w-4 h-4 bg-white rounded-full shadow-lg transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${progress}%` }}
              whileHover={{ scale: 1.2 }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </motion.div>

        {/* Player Controls */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-center space-x-6 mb-8"
        >
          {/* Shuffle */}
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

          {/* Previous */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={previousSong}
            className="p-3 rounded-full text-white hover:bg-white/20 transition-all"
          >
            <SkipBack className="w-6 h-6" />
          </motion.button>

          {/* Play/Pause */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={isPlaying ? pauseSong : resumeSong}
            className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1" />
            )}
          </motion.button>

          {/* Next */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={nextSong}
            className="p-3 rounded-full text-white hover:bg-white/20 transition-all"
          >
            <SkipForward className="w-6 h-6" />
          </motion.button>

          {/* Repeat */}
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
        </motion.div>

        {/* Bottom Controls */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="flex items-center justify-between w-full max-w-2xl"
        >
          {/* Left controls */}
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowLyrics(!showLyrics)}
              className={`p-2 rounded-full transition-all ${
                showLyrics
                  ? "bg-green-500/20 text-green-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Mic2 className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowQueue(!showQueue)}
              className={`p-2 rounded-full transition-all ${
                showQueue
                  ? "bg-blue-500/20 text-blue-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <ListMusic className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowDevices(!showDevices)}
              className={`p-2 rounded-full transition-all ${
                showDevices
                  ? "bg-purple-500/20 text-purple-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Cast className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Volume control */}
          <div
            className="flex items-center space-x-3"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleMute}
              className="p-2 rounded-full text-gray-400 hover:text-white transition-colors"
            >
              <VolumeIcon className="w-5 h-5" />
            </motion.button>

            <AnimatePresence>
              {showVolumeSlider && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 120 }}
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
        </motion.div>
      </main>

      {/* Devices Overlay */}
      <AnimatePresence>
        {showDevices && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 h-96 bg-black/95 backdrop-blur-xl border-t border-white/10 z-50 rounded-t-3xl"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Connect to a device</h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowDevices(false)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20"
                >
                  <ChevronDown className="w-4 h-4" />
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
                      className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${
                        device.active
                          ? "bg-green-500/20 border border-green-500/50"
                          : "bg-white/5"
                      }`}
                    >
                      <div className="flex items-center space-x-4">
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
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        .slider::-webkit-slider-track {
          background: rgba(255, 255, 255, 0.2);
          height: 4px;
          border-radius: 2px;
        }

        .slider::-moz-range-track {
          background: rgba(255, 255, 255, 0.2);
          height: 4px;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
