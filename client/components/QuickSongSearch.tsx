import React, { useState, useEffect } from "react";
import { Search, Music, Play, Pause, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEnhancedMusic } from "../context/EnhancedMusicContext";
import { songApi } from "../lib/api";
import LikeButton from "./LikeButton";
import { cn } from "../lib/utils";

interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  image: string;
  duration: string;
}

interface QuickSongSearchProps {
  className?: string;
  placeholder?: string;
  maxResults?: number;
  onSongSelect?: (song: Song) => void;
  showLikeButton?: boolean;
}

export const QuickSongSearch: React.FC<QuickSongSearchProps> = ({
  className,
  placeholder = "Search for songs...",
  maxResults = 5,
  onSongSelect,
  showLikeButton = true,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { currentSong, isPlaying, playSong, pauseSong, resumeSong } = useEnhancedMusic();

  const setCurrentSong = (song: Song) => {
    playSong(song);
  };

  const togglePlay = () => {
    if (isPlaying) {
      pauseSong();
    } else {
      resumeSong();
    }
  };

  const searchSongs = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await songApi.searchSongs(searchQuery, maxResults);
      setResults(response.results || []);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length > 2) {
        searchSongs(query);
        setIsOpen(true);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, maxResults]);

  const handleSongPlay = (song: Song) => {
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      setCurrentSong(song);
    }

    if (onSongSelect) {
      onSongSelect(song);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding to allow clicks on results
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 2 && setIsOpen(true)}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="w-full h-12 bg-white/10 border border-white/20 rounded-lg pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-neon-green transition-colors"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neon-green animate-spin" />
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && (query.length > 2 || results.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 z-50 mt-2 bg-dark-surface border border-white/10 rounded-lg shadow-xl max-h-80 overflow-y-auto"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-neon-green animate-spin" />
                <span className="ml-2 text-gray-400">Searching...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((song) => (
                  <div
                    key={song.id}
                    className="flex items-center space-x-3 px-4 py-3 hover:bg-white/10 transition-colors cursor-pointer group"
                    onClick={() => handleSongPlay(song)}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={song.image}
                        alt={song.title}
                        className="w-10 h-10 object-cover rounded"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSongPlay(song);
                        }}
                        className="absolute inset-0 bg-black/60 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {currentSong?.id === song.id && isPlaying ? (
                          <Pause className="w-3 h-3 text-white" />
                        ) : (
                          <Play className="w-3 h-3 text-white ml-0.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate text-white">
                        {song.title}
                      </h4>
                      <p className="text-gray-400 text-xs truncate">
                        {song.artist} {song.album && `• ${song.album}`}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400 text-xs">
                        {song.duration}
                      </span>
                      {showLikeButton && (
                        <LikeButton
                          songId={song.id}
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : query.length > 2 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Music className="w-8 h-8 mb-2" />
                <p className="text-sm">No songs found for "{query}"</p>
                <p className="text-xs">Try different keywords</p>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuickSongSearch;
