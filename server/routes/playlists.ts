import { RequestHandler } from "express";

// Mock database for playlists
const playlists = [];

// Mock playlist tracks
const playlistTracks = new Map();

// Helper function to get user playlists
export const getUserPlaylists: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const includePrivate = req.query.includePrivate !== 'false';

    // Filter playlists for the user
    const userPlaylists = playlists.filter(playlist => 
      playlist.user_id === userId && (includePrivate || playlist.is_public)
    );

    res.json({
      success: true,
      playlists: userPlaylists,
      pagination: {
        page: 1,
        limit: 50,
        total: userPlaylists.length,
        pages: 1
      }
    });
  } catch (error) {
    console.error("Get user playlists error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get specific playlist
export const getPlaylist: RequestHandler = async (req, res) => {
  try {
    const { playlistId, userId } = req.params;

    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found"
      });
    }

    // Check if user can view this playlist
    if (!playlist.is_public && playlist.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    // Get tracks for this playlist
    const tracks = playlistTracks.get(playlistId) || [];

    res.json({
      success: true,
      playlist: {
        ...playlist,
        tracks
      }
    });
  } catch (error) {
    console.error("Get playlist error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Create new playlist
export const createPlaylist: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, description, is_public = true, is_collaborative = false } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Playlist name is required"
      });
    }

    const newPlaylist = {
      id: `playlist-${Date.now()}`,
      name,
      description: description || "",
      user_id: userId,
      creator_name: "User",
      cover_image_url: "",
      is_public,
      is_collaborative,
      track_count: 0,
      total_duration_ms: 0,
      follower_count: 0,
      play_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    playlists.push(newPlaylist);
    playlistTracks.set(newPlaylist.id, []);

    res.status(201).json({
      success: true,
      playlist: newPlaylist
    });
  } catch (error) {
    console.error("Create playlist error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Update playlist
export const updatePlaylist: RequestHandler = async (req, res) => {
  try {
    const { playlistId, userId } = req.params;
    const updates = req.body;

    const playlistIndex = playlists.findIndex(p => p.id === playlistId);
    if (playlistIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found"
      });
    }

    const playlist = playlists[playlistIndex];
    if (playlist.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    // Update playlist
    playlists[playlistIndex] = {
      ...playlist,
      ...updates,
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      playlist: playlists[playlistIndex]
    });
  } catch (error) {
    console.error("Update playlist error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Delete playlist
export const deletePlaylist: RequestHandler = async (req, res) => {
  try {
    const { playlistId, userId } = req.params;

    const playlistIndex = playlists.findIndex(p => p.id === playlistId);
    if (playlistIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found"
      });
    }

    const playlist = playlists[playlistIndex];
    if (playlist.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    // Remove playlist and its tracks
    playlists.splice(playlistIndex, 1);
    playlistTracks.delete(playlistId);

    res.json({
      success: true,
      message: "Playlist deleted successfully"
    });
  } catch (error) {
    console.error("Delete playlist error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Add song to playlist
export const addSongToPlaylist: RequestHandler = async (req, res) => {
  try {
    const { playlistId, userId } = req.params;
    const { songId } = req.body;

    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found"
      });
    }

    if (playlist.user_id !== userId && !playlist.is_collaborative) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const tracks = playlistTracks.get(playlistId) || [];
    const newTrack = {
      id: `pt-${Date.now()}`,
      playlist_id: playlistId,
      track_id: songId,
      added_at: new Date().toISOString()
    };

    tracks.push(newTrack);
    playlistTracks.set(playlistId, tracks);

    // Update playlist track count
    const playlistIndex = playlists.findIndex(p => p.id === playlistId);
    if (playlistIndex !== -1) {
      playlists[playlistIndex].track_count = tracks.length;
      playlists[playlistIndex].updated_at = new Date().toISOString();
    }

    res.json({
      success: true,
      message: "Song added to playlist"
    });
  } catch (error) {
    console.error("Add song to playlist error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Remove song from playlist
export const removeSongFromPlaylist: RequestHandler = async (req, res) => {
  try {
    const { playlistId, songId, userId } = req.params;

    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found"
      });
    }

    if (playlist.user_id !== userId && !playlist.is_collaborative) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const tracks = playlistTracks.get(playlistId) || [];
    const filteredTracks = tracks.filter(track => track.track_id !== songId);

    playlistTracks.set(playlistId, filteredTracks);

    // Update playlist track count
    const playlistIndex = playlists.findIndex(p => p.id === playlistId);
    if (playlistIndex !== -1) {
      playlists[playlistIndex].track_count = filteredTracks.length;
      playlists[playlistIndex].updated_at = new Date().toISOString();
    }

    res.json({
      success: true,
      message: "Song removed from playlist"
    });
  } catch (error) {
    console.error("Remove song from playlist error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Additional exports for compatibility
export const getAllPlaylists: RequestHandler = async (req, res) => {
  try {
    res.json({
      success: true,
      playlists: playlists,
      pagination: {
        page: 1,
        limit: 50,
        total: playlists.length,
        pages: 1
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getPlaylistById = getPlaylist;
export const getPlaylistTracks: RequestHandler = async (req, res) => {
  const tracks = playlistTracks.get(req.params.playlistId) || [];
  res.json({ success: true, tracks });
};

export const addTrackToPlaylist = addSongToPlaylist;
export const removeTrackFromPlaylist = removeSongFromPlaylist;

export const togglePlaylistFollow: RequestHandler = async (req, res) => {
  res.json({ success: true, message: "Follow toggled" });
};

export const searchPlaylists: RequestHandler = async (req, res) => {
  const query = req.query.q as string;
  const filtered = playlists.filter(p => 
    p.name.toLowerCase().includes(query?.toLowerCase() || '') ||
    p.description.toLowerCase().includes(query?.toLowerCase() || '')
  );
  res.json({ success: true, playlists: filtered });
};
