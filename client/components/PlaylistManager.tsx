import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Play,
  Pause,
  Heart,
  MoreHorizontal,
  Download,
  Share2,
  Edit3,
  Trash2,
  Copy,
  Lock,
  Globe,
  Users,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Clock,
  Calendar,
  Music,
  X,
  Check,
  Image as ImageIcon,
} from "lucide-react";

interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  image: string;
  isLiked: boolean;
  dateAdded: string;
  playCount: number;
}

interface Playlist {
  id: number;
  name: string;
  description: string;
  image: string;
  songs: Song[];
  isPublic: boolean;
  isCollaborative: boolean;
  owner: string;
  followers: number;
  totalDuration: string;
  dateCreated: string;
  lastModified: string;
}

interface PlaylistManagerProps {
  playlist: Playlist;
  onClose: () => void;
  onUpdate: (playlist: Playlist) => void;
}

export function PlaylistManager({
  playlist,
  onClose,
  onUpdate,
}: PlaylistManagerProps) {
  const [editMode, setEditMode] = useState(false);
  const [playlistName, setPlaylistName] = useState(playlist.name);
  const [playlistDescription, setPlaylistDescription] = useState(
    playlist.description,
  );
  const [isPublic, setIsPublic] = useState(playlist.isPublic);
  const [isCollaborative, setIsCollaborative] = useState(
    playlist.isCollaborative,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("dateAdded");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedSongs, setSelectedSongs] = useState<number[]>([]);
  const [showAddSongs, setShowAddSongs] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);

  const filteredSongs = playlist.songs
    .filter(
      (song) =>
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.album.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "artist":
          comparison = a.artist.localeCompare(b.artist);
          break;
        case "album":
          comparison = a.album.localeCompare(b.album);
          break;
        case "duration":
          comparison =
            parseInt(a.duration.split(":")[0]) * 60 +
            parseInt(a.duration.split(":")[1]) -
            (parseInt(b.duration.split(":")[0]) * 60 +
              parseInt(b.duration.split(":")[1]));
          break;
        case "dateAdded":
          comparison =
            new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
          break;
        case "playCount":
          comparison = a.playCount - b.playCount;
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const handleSave = () => {
    const updatedPlaylist = {
      ...playlist,
      name: playlistName,
      description: playlistDescription,
      isPublic,
      isCollaborative,
      lastModified: new Date().toISOString(),
    };
    onUpdate(updatedPlaylist);
    setEditMode(false);
  };

  const toggleSongSelection = (songId: number) => {
    setSelectedSongs((prev) =>
      prev.includes(songId)
        ? prev.filter((id) => id !== songId)
        : [...prev, songId],
    );
  };

  const handlePlaySong = (songId: number) => {
    setCurrentlyPlaying(songId);
    setIsPlaying(true);
  };

  const handleRemoveSelected = () => {
    const updatedPlaylist = {
      ...playlist,
      songs: playlist.songs.filter((song) => !selectedSongs.includes(song.id)),
      lastModified: new Date().toISOString(),
    };
    onUpdate(updatedPlaylist);
    setSelectedSongs([]);
  };

  const availableSongs: Song[] = [
    {
      id: 101,
      title: "Good 4 U",
      artist: "Olivia Rodrigo",
      album: "SOUR",
      duration: "2:58",
      image:
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop",
      isLiked: false,
      dateAdded: "2024-01-10",
      playCount: 15,
    },
    {
      id: 102,
      title: "Heat Waves",
      artist: "Glass Animals",
      album: "Dreamland",
      duration: "3:58",
      image:
        "https://images.unsplash.com/photo-1571974599782-87624638275c?w=100&h=100&fit=crop",
      isLiked: true,
      dateAdded: "2024-01-12",
      playCount: 22,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gradient-to-br from-dark-surface to-darker-surface rounded-3xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={playlist.image}
                alt={playlist.name}
                className="w-16 h-16 rounded-xl object-cover"
              />
              {editMode && (
                <button className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-white" />
                </button>
              )}
            </div>
            <div>
              {editMode ? (
                <input
                  type="text"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  className="text-2xl font-bold bg-transparent border-b border-neon-green text-white outline-none"
                />
              ) : (
                <h1 className="text-2xl font-bold">{playlist.name}</h1>
              )}
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                <span>{playlist.songs.length} songs</span>
                <span>{playlist.totalDuration}</span>
                <span>{playlist.followers} followers</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {editMode ? (
              <>
                <button
                  onClick={() => setEditMode(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-neon-green rounded-full text-black font-semibold hover:bg-neon-green/80 transition-colors"
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditMode(true)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Description & Settings */}
        <div className="p-6 border-b border-white/10">
          {editMode ? (
            <div className="space-y-4">
              <textarea
                value={playlistDescription}
                onChange={(e) => setPlaylistDescription(e.target.value)}
                placeholder="Add a description..."
                className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-gray-400 resize-none h-20 outline-none focus:ring-2 focus:ring-neon-green/50"
              />
              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 accent-neon-green"
                  />
                  <Globe className="w-4 h-4" />
                  <span>Public</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCollaborative}
                    onChange={(e) => setIsCollaborative(e.target.checked)}
                    className="w-4 h-4 accent-neon-green"
                  />
                  <Users className="w-4 h-4" />
                  <span>Collaborative</span>
                </label>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-300 mb-4">{playlist.description}</p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {playlist.isPublic ? (
                    <Globe className="w-4 h-4 text-neon-green" />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm">
                    {playlist.isPublic ? "Public" : "Private"}
                  </span>
                </div>
                {playlist.isCollaborative && (
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-neon-green" />
                    <span className="text-sm">Collaborative</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">
                    Created{" "}
                    {new Date(playlist.dateCreated).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-14 h-14 bg-gradient-to-r from-neon-green to-neon-blue rounded-full flex items-center justify-center hover:scale-105 transition-transform"
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 text-black" />
                ) : (
                  <Play className="w-7 h-7 text-black ml-1" />
                )}
              </button>
              <button className="p-3 hover:bg-white/10 rounded-full transition-colors">
                <Heart className="w-5 h-5 text-gray-400" />
              </button>
              <button className="p-3 hover:bg-white/10 rounded-full transition-colors">
                <Download className="w-5 h-5 text-gray-400" />
              </button>
              <button
                onClick={() => setShowAddSongs(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Songs</span>
              </button>
            </div>

            {selectedSongs.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">
                  {selectedSongs.length} selected
                </span>
                <button
                  onClick={handleRemoveSelected}
                  className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30 transition-colors"
                >
                  Remove
                </button>
                <button
                  onClick={() => setSelectedSongs([])}
                  className="px-3 py-1 bg-white/10 text-gray-400 rounded-full hover:bg-white/20 transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search & Filter */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in playlist..."
                className="w-full bg-white/10 border border-white/20 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-neon-green/50 focus:border-neon-green/50 placeholder-gray-400"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm outline-none"
            >
              <option value="dateAdded">Date Added</option>
              <option value="title">Title</option>
              <option value="artist">Artist</option>
              <option value="album">Album</option>
              <option value="duration">Duration</option>
              <option value="playCount">Play Count</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {sortOrder === "asc" ? (
                <SortAsc className="w-4 h-4" />
              ) : (
                <SortDesc className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Songs List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="space-y-2">
              {filteredSongs.map((song, index) => (
                <div
                  key={song.id}
                  className={`flex items-center space-x-4 p-3 rounded-lg hover:bg-white/5 transition-colors group ${
                    selectedSongs.includes(song.id) ? "bg-neon-green/10" : ""
                  }`}
                >
                  <button
                    onClick={() => toggleSongSelection(song.id)}
                    className="w-4 h-4 border border-gray-400 rounded flex items-center justify-center"
                  >
                    {selectedSongs.includes(song.id) && (
                      <Check className="w-3 h-3 text-neon-green" />
                    )}
                  </button>
                  <span className="text-gray-400 text-sm w-8">{index + 1}</span>
                  <div className="relative">
                    <img
                      src={song.image}
                      alt={song.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <button
                      onClick={() => handlePlaySong(song.id)}
                      className="absolute inset-0 bg-black/60 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">
                      {song.title}
                    </h4>
                    <p className="text-gray-400 text-xs truncate">
                      {song.artist}
                    </p>
                  </div>
                  <div className="hidden md:block text-gray-400 text-sm">
                    {song.album}
                  </div>
                  <div className="text-gray-400 text-sm">{song.dateAdded}</div>
                  <div className="flex items-center space-x-2">
                    {song.isLiked && (
                      <Heart className="w-4 h-4 text-red-500 fill-current" />
                    )}
                    <span className="text-gray-400 text-sm">
                      {song.duration}
                    </span>
                    <button className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-full transition-all">
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Add Songs Modal */}
        <AnimatePresence>
          {showAddSongs && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-dark-surface rounded-2xl p-6 w-full max-w-2xl max-h-[80%] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Add Songs</h3>
                  <button
                    onClick={() => setShowAddSongs(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {availableSongs.map((song) => (
                    <div
                      key={song.id}
                      className="flex items-center space-x-3 p-3 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <img
                        src={song.image}
                        alt={song.title}
                        className="w-10 h-10 rounded object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{song.title}</h4>
                        <p className="text-gray-400 text-xs">{song.artist}</p>
                      </div>
                      <button className="px-3 py-1 bg-neon-green rounded-full text-black text-sm font-medium hover:bg-neon-green/80 transition-colors">
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
