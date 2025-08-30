import { RequestHandler } from "express";
import {
  Playlist,
  PlaylistResponse,
  PlaylistCreateRequest,
  PlaylistUpdateRequest,
  ApiError,
} from "@shared/api";

// In-memory playlist storage (in production, use a real database)
let playlists: Map<string, Playlist> = new Map();
let userPlaylists: Map<string, string[]> = new Map(); // userId -> playlistIds

// Initialize with mock data
initializePlaylistData();

function initializePlaylistData() {
  const mockPlaylists: Playlist[] = [
    {
      id: "playlist1",
      name: "My Vibes",
      description: "Songs that match my mood",
      coverImage:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
      songs: ["song1", "song2", "song3"],
      isPublic: true,
      createdAt: "2023-12-01",
      updatedAt: "2023-12-01",
      createdBy: "user1",
      totalDuration: 720,
    },
    {
      id: "playlist2",
      name: "Late Night Sessions",
      description: "Perfect for coding and creating",
      coverImage:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
      songs: ["song4", "song5"],
      isPublic: false,
      createdAt: "2023-11-15",
      updatedAt: "2023-11-15",
      createdBy: "user1",
      totalDuration: 480,
    },
    {
      id: "playlist3",
      name: "Workout Mix",
      description: "High energy songs for working out",
      coverImage:
        "https://images.unsplash.com/photo-1571974599782-87624638275c?w=400&h=400&fit=crop",
      songs: ["song1", "song4", "song5"],
      isPublic: true,
      createdAt: "2023-10-01",
      updatedAt: "2023-10-01",
      createdBy: "user1",
      totalDuration: 579,
    },
  ];

  mockPlaylists.forEach((playlist) => {
    playlists.set(playlist.id, playlist);
  });

  userPlaylists.set("user1", ["playlist1", "playlist2", "playlist3"]);
}

// Get all playlists for a user
export const getUserPlaylists: RequestHandler = (req, res) => {
  try {
    const userId = req.params.userId || "user1";
    const includePrivate = req.query.includePrivate === "true";

    const playlistIds = userPlaylists.get(userId) || [];
    const userPlaylistData = playlistIds
      .map((id) => playlists.get(id))
      .filter((playlist): playlist is Playlist => {
        if (!playlist) return false;
        if (!includePrivate && !playlist.isPublic) return false;
        return true;
      });

    res.json({
      success: true,
      playlists: userPlaylistData,
      total: userPlaylistData.length,
    });
  } catch (error) {
    const errorResponse: ApiError = {
      success: false,
      message: "Failed to get user playlists",
      details: error,
    };
    res.status(500).json(errorResponse);
  }
};

// Get a specific playlist
export const getPlaylist: RequestHandler = (req, res) => {
  try {
    const playlistId = req.params.playlistId;
    const userId = req.params.userId || "user1";

    const playlist = playlists.get(playlistId);
    if (!playlist) {
      const error: ApiError = {
        success: false,
        message: "Playlist not found",
        code: "PLAYLIST_NOT_FOUND",
      };
      return res.status(404).json(error);
    }

    // Check if user has permission to view this playlist
    if (!playlist.isPublic && playlist.createdBy !== userId) {
      const error: ApiError = {
        success: false,
        message: "Access denied to private playlist",
        code: "ACCESS_DENIED",
      };
      return res.status(403).json(error);
    }

    const response: PlaylistResponse = {
      playlist,
      success: true,
    };

    res.json(response);
  } catch (error) {
    const errorResponse: ApiError = {
      success: false,
      message: "Failed to get playlist",
      details: error,
    };
    res.status(500).json(errorResponse);
  }
};

// Create a new playlist
export const createPlaylist: RequestHandler = (req, res) => {
  try {
    const userId = req.params.userId || "user1";
    const playlistData: PlaylistCreateRequest = req.body;

    if (!playlistData.name || playlistData.name.trim().length === 0) {
      const error: ApiError = {
        success: false,
        message: "Playlist name is required",
        code: "VALIDATION_ERROR",
      };
      return res.status(400).json(error);
    }

    const playlistId = `playlist_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const newPlaylist: Playlist = {
      id: playlistId,
      name: playlistData.name.trim(),
      description: playlistData.description?.trim() || "",
      coverImage:
        playlistData.coverImage ||
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
      songs: [],
      isPublic: playlistData.isPublic,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
      totalDuration: 0,
    };

    playlists.set(playlistId, newPlaylist);

    // Add to user's playlists
    const currentUserPlaylists = userPlaylists.get(userId) || [];
    userPlaylists.set(userId, [...currentUserPlaylists, playlistId]);

    const response: PlaylistResponse = {
      playlist: newPlaylist,
      success: true,
      message: "Playlist created successfully",
    };

    res.status(201).json(response);
  } catch (error) {
    const errorResponse: ApiError = {
      success: false,
      message: "Failed to create playlist",
      details: error,
    };
    res.status(500).json(errorResponse);
  }
};

// Update a playlist
export const updatePlaylist: RequestHandler = (req, res) => {
  try {
    const playlistId = req.params.playlistId;
    const userId = req.params.userId || "user1";
    const updates: PlaylistUpdateRequest = req.body;

    const playlist = playlists.get(playlistId);
    if (!playlist) {
      const error: ApiError = {
        success: false,
        message: "Playlist not found",
        code: "PLAYLIST_NOT_FOUND",
      };
      return res.status(404).json(error);
    }

    // Check if user owns this playlist
    if (playlist.createdBy !== userId) {
      const error: ApiError = {
        success: false,
        message: "Access denied. You can only edit your own playlists.",
        code: "ACCESS_DENIED",
      };
      return res.status(403).json(error);
    }

    // Calculate total duration if songs are updated
    let totalDuration = playlist.totalDuration;
    if (updates.songs) {
      // Mock duration calculation (in production, fetch from song database)
      totalDuration = updates.songs.length * 180; // Average 3 minutes per song
    }

    const updatedPlaylist: Playlist = {
      ...playlist,
      name: updates.name?.trim() || playlist.name,
      description: updates.description?.trim() ?? playlist.description,
      isPublic: updates.isPublic ?? playlist.isPublic,
      coverImage: updates.coverImage || playlist.coverImage,
      songs: updates.songs || playlist.songs,
      totalDuration,
      updatedAt: new Date().toISOString(),
    };

    playlists.set(playlistId, updatedPlaylist);

    const response: PlaylistResponse = {
      playlist: updatedPlaylist,
      success: true,
      message: "Playlist updated successfully",
    };

    res.json(response);
  } catch (error) {
    const errorResponse: ApiError = {
      success: false,
      message: "Failed to update playlist",
      details: error,
    };
    res.status(500).json(errorResponse);
  }
};

// Delete a playlist
export const deletePlaylist: RequestHandler = (req, res) => {
  try {
    const playlistId = req.params.playlistId;
    const userId = req.params.userId || "user1";

    const playlist = playlists.get(playlistId);
    if (!playlist) {
      const error: ApiError = {
        success: false,
        message: "Playlist not found",
        code: "PLAYLIST_NOT_FOUND",
      };
      return res.status(404).json(error);
    }

    // Check if user owns this playlist
    if (playlist.createdBy !== userId) {
      const error: ApiError = {
        success: false,
        message: "Access denied. You can only delete your own playlists.",
        code: "ACCESS_DENIED",
      };
      return res.status(403).json(error);
    }

    // Remove from playlists
    playlists.delete(playlistId);

    // Remove from user's playlist list
    const currentUserPlaylists = userPlaylists.get(userId) || [];
    const updatedUserPlaylists = currentUserPlaylists.filter(
      (id) => id !== playlistId,
    );
    userPlaylists.set(userId, updatedUserPlaylists);

    res.json({
      success: true,
      message: "Playlist deleted successfully",
    });
  } catch (error) {
    const errorResponse: ApiError = {
      success: false,
      message: "Failed to delete playlist",
      details: error,
    };
    res.status(500).json(errorResponse);
  }
};

// Add song to playlist
export const addSongToPlaylist: RequestHandler = (req, res) => {
  try {
    const playlistId = req.params.playlistId;
    const userId = req.params.userId || "user1";
    const { songId } = req.body;

    if (!songId) {
      const error: ApiError = {
        success: false,
        message: "Song ID is required",
        code: "VALIDATION_ERROR",
      };
      return res.status(400).json(error);
    }

    const playlist = playlists.get(playlistId);
    if (!playlist) {
      const error: ApiError = {
        success: false,
        message: "Playlist not found",
        code: "PLAYLIST_NOT_FOUND",
      };
      return res.status(404).json(error);
    }

    // Check if user owns this playlist
    if (playlist.createdBy !== userId) {
      const error: ApiError = {
        success: false,
        message: "Access denied. You can only modify your own playlists.",
        code: "ACCESS_DENIED",
      };
      return res.status(403).json(error);
    }

    // Check if song is already in playlist
    if (playlist.songs.includes(songId)) {
      const error: ApiError = {
        success: false,
        message: "Song is already in this playlist",
        code: "DUPLICATE_SONG",
      };
      return res.status(400).json(error);
    }

    const updatedPlaylist: Playlist = {
      ...playlist,
      songs: [...playlist.songs, songId],
      totalDuration: playlist.totalDuration + 180, // Mock 3 minutes per song
      updatedAt: new Date().toISOString(),
    };

    playlists.set(playlistId, updatedPlaylist);

    res.json({
      success: true,
      message: "Song added to playlist successfully",
      playlist: updatedPlaylist,
    });
  } catch (error) {
    const errorResponse: ApiError = {
      success: false,
      message: "Failed to add song to playlist",
      details: error,
    };
    res.status(500).json(errorResponse);
  }
};

// Remove song from playlist
export const removeSongFromPlaylist: RequestHandler = (req, res) => {
  try {
    const playlistId = req.params.playlistId;
    const songId = req.params.songId;
    const userId = req.params.userId || "user1";

    const playlist = playlists.get(playlistId);
    if (!playlist) {
      const error: ApiError = {
        success: false,
        message: "Playlist not found",
        code: "PLAYLIST_NOT_FOUND",
      };
      return res.status(404).json(error);
    }

    // Check if user owns this playlist
    if (playlist.createdBy !== userId) {
      const error: ApiError = {
        success: false,
        message: "Access denied. You can only modify your own playlists.",
        code: "ACCESS_DENIED",
      };
      return res.status(403).json(error);
    }

    // Check if song is in playlist
    if (!playlist.songs.includes(songId)) {
      const error: ApiError = {
        success: false,
        message: "Song is not in this playlist",
        code: "SONG_NOT_FOUND",
      };
      return res.status(400).json(error);
    }

    const updatedPlaylist: Playlist = {
      ...playlist,
      songs: playlist.songs.filter((id) => id !== songId),
      totalDuration: Math.max(0, playlist.totalDuration - 180), // Mock 3 minutes per song
      updatedAt: new Date().toISOString(),
    };

    playlists.set(playlistId, updatedPlaylist);

    res.json({
      success: true,
      message: "Song removed from playlist successfully",
      playlist: updatedPlaylist,
    });
  } catch (error) {
    const errorResponse: ApiError = {
      success: false,
      message: "Failed to remove song from playlist",
      details: error,
    };
    res.status(500).json(errorResponse);
  }
};
