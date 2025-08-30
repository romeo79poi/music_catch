import { RequestHandler } from "express";

// Mock database for tracks (in production, connect to PostgreSQL)
const tracks = [
  {
    id: "550e8400-e29b-41d4-a716-446655440040",
    title: "Anti-Hero",
    artist_id: "550e8400-e29b-41d4-a716-446655440020",
    artist_name: "Taylor Swift",
    album_id: "550e8400-e29b-41d4-a716-446655440030",
    album_name: "Midnights",
    track_number: 1,
    duration_ms: 200000,
    explicit: false,
    preview_url: "https://example.com/preview/anti-hero.mp3",
    cover_image_url: "https://example.com/covers/midnights.jpg",
    genre: "Pop",
    mood: "Reflective",
    energy_level: 6,
    release_date: "2022-10-21",
    is_active: true,
    play_count: 50000000,
    like_count: 1500000,
    audio_quality: "high",
    created_at: "2022-10-21T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440041",
    title: "Blinding Lights",
    artist_id: "550e8400-e29b-41d4-a716-446655440021",
    artist_name: "The Weeknd",
    album_id: "550e8400-e29b-41d4-a716-446655440031",
    album_name: "After Hours",
    track_number: 1,
    duration_ms: 200831,
    explicit: false,
    preview_url: "https://example.com/preview/blinding-lights.mp3",
    cover_image_url: "https://example.com/covers/after-hours.jpg",
    genre: "R&B",
    mood: "Energetic",
    energy_level: 9,
    release_date: "2020-03-20",
    is_active: true,
    play_count: 75000000,
    like_count: 2000000,
    audio_quality: "high",
    created_at: "2020-03-20T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440042",
    title: "Shape of You",
    artist_id: "550e8400-e29b-41d4-a716-446655440022",
    artist_name: "Ed Sheeran",
    album_id: "550e8400-e29b-41d4-a716-446655440032",
    album_name: "÷ (Divide)",
    track_number: 1,
    duration_ms: 233712,
    explicit: false,
    preview_url: "https://example.com/preview/shape-of-you.mp3",
    cover_image_url: "https://example.com/covers/divide.jpg",
    genre: "Pop",
    mood: "Happy",
    energy_level: 8,
    release_date: "2017-03-03",
    is_active: true,
    play_count: 60000000,
    like_count: 1800000,
    audio_quality: "high",
    created_at: "2017-03-03T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440043",
    title: "Levitating",
    artist_id: "550e8400-e29b-41d4-a716-446655440023",
    artist_name: "Dua Lipa",
    album_id: "550e8400-e29b-41d4-a716-446655440033",
    album_name: "Future Nostalgia",
    track_number: 2,
    duration_ms: 203000,
    explicit: false,
    preview_url: "https://example.com/preview/levitating.mp3",
    cover_image_url: "https://example.com/covers/future-nostalgia.jpg",
    genre: "Pop",
    mood: "Dance",
    energy_level: 9,
    release_date: "2020-03-27",
    is_active: true,
    play_count: 45000000,
    like_count: 1200000,
    audio_quality: "high",
    created_at: "2020-03-27T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440044",
    title: "God's Plan",
    artist_id: "550e8400-e29b-41d4-a716-446655440024",
    artist_name: "Drake",
    album_id: "550e8400-e29b-41d4-a716-446655440034",
    album_name: "Certified Lover Boy",
    track_number: 3,
    duration_ms: 198973,
    explicit: true,
    preview_url: "https://example.com/preview/gods-plan.mp3",
    cover_image_url: "https://example.com/covers/clb.jpg",
    genre: "Hip-Hop",
    mood: "Motivational",
    energy_level: 7,
    release_date: "2021-09-03",
    is_active: true,
    play_count: 80000000,
    like_count: 2500000,
    audio_quality: "high",
    created_at: "2021-09-03T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440045",
    title: "Lavender Haze",
    artist_id: "550e8400-e29b-41d4-a716-446655440020",
    artist_name: "Taylor Swift",
    album_id: "550e8400-e29b-41d4-a716-446655440030",
    album_name: "Midnights",
    track_number: 2,
    duration_ms: 202000,
    explicit: false,
    preview_url: "https://example.com/preview/lavender-haze.mp3",
    cover_image_url: "https://example.com/covers/midnights.jpg",
    genre: "Pop",
    mood: "Dreamy",
    energy_level: 6,
    release_date: "2022-10-21",
    is_active: true,
    play_count: 35000000,
    like_count: 900000,
    audio_quality: "high",
    created_at: "2022-10-21T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440046",
    title: "Save Your Tears",
    artist_id: "550e8400-e29b-41d4-a716-446655440021",
    artist_name: "The Weeknd",
    album_id: "550e8400-e29b-41d4-a716-446655440031",
    album_name: "After Hours",
    track_number: 3,
    duration_ms: 215000,
    explicit: false,
    preview_url: "https://example.com/preview/save-your-tears.mp3",
    cover_image_url: "https://example.com/covers/after-hours.jpg",
    genre: "R&B",
    mood: "Emotional",
    energy_level: 7,
    release_date: "2020-03-20",
    is_active: true,
    play_count: 40000000,
    like_count: 1100000,
    audio_quality: "high",
    created_at: "2020-03-20T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  }
];

// User liked tracks (mock data)
const userLikedTracks = new Map<string, Set<string>>();

// Get all tracks
export const getAllTracks: RequestHandler = async (req, res) => {
  try {
    const { page = 1, limit = 20, genre, search, sort_by = "play_count" } = req.query;
    
    let filteredTracks = [...tracks];
    
    // Filter by genre
    if (genre) {
      filteredTracks = filteredTracks.filter(track => 
        track.genre.toLowerCase() === (genre as string).toLowerCase()
      );
    }
    
    // Search functionality
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredTracks = filteredTracks.filter(track =>
        track.title.toLowerCase().includes(searchTerm) ||
        track.artist_name.toLowerCase().includes(searchTerm) ||
        track.album_name.toLowerCase().includes(searchTerm)
      );
    }
    
    // Sort tracks
    filteredTracks.sort((a, b) => {
      switch (sort_by) {
        case "play_count":
          return b.play_count - a.play_count;
        case "like_count":
          return b.like_count - a.like_count;
        case "release_date":
          return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return b.play_count - a.play_count;
      }
    });
    
    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedTracks = filteredTracks.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedTracks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredTracks.length,
        pages: Math.ceil(filteredTracks.length / limitNum)
      }
    });
  } catch (error) {
    console.error("Get tracks error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tracks"
    });
  }
};

// Get track by ID
export const getTrackById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    const track = tracks.find(t => t.id === id);
    
    if (!track) {
      return res.status(404).json({
        success: false,
        message: "Track not found"
      });
    }
    
    res.json({
      success: true,
      data: track
    });
  } catch (error) {
    console.error("Get track by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch track"
    });
  }
};

// Record track play
export const recordTrackPlay: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] as string;
    
    const track = tracks.find(t => t.id === id);
    
    if (!track) {
      return res.status(404).json({
        success: false,
        message: "Track not found"
      });
    }
    
    // Increment play count
    track.play_count += 1;
    track.updated_at = new Date().toISOString();
    
    // In a real app, this would be stored in user_play_history table
    console.log(`🎵 Track played: ${track.title} by ${track.artist_name} (User: ${userId || 'anonymous'})`);
    
    res.json({
      success: true,
      message: "Play recorded successfully",
      data: {
        track_id: track.id,
        play_count: track.play_count
      }
    });
  } catch (error) {
    console.error("Record track play error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record play"
    });
  }
};

// Search tracks
export const searchTracks: RequestHandler = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }
    
    const searchTerm = (q as string).toLowerCase();
    const limitNum = parseInt(limit as string);
    
    const searchResults = tracks
      .filter(track =>
        track.title.toLowerCase().includes(searchTerm) ||
        track.artist_name.toLowerCase().includes(searchTerm) ||
        track.album_name.toLowerCase().includes(searchTerm) ||
        track.genre.toLowerCase().includes(searchTerm)
      )
      .slice(0, limitNum);
    
    res.json({
      success: true,
      data: searchResults,
      total: searchResults.length
    });
  } catch (error) {
    console.error("Search tracks error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search tracks"
    });
  }
};

// Get trending tracks
export const getTrendingTracks: RequestHandler = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const limitNum = parseInt(limit as string);
    
    // Sort by play count and recent activity (simplified trending algorithm)
    const trendingTracks = [...tracks]
      .sort((a, b) => {
        // Weight recent tracks higher
        const aRecency = new Date(a.updated_at).getTime();
        const bRecency = new Date(b.updated_at).getTime();
        const aScore = a.play_count + (aRecency / 1000000);
        const bScore = b.play_count + (bRecency / 1000000);
        return bScore - aScore;
      })
      .slice(0, limitNum);
    
    res.json({
      success: true,
      data: trendingTracks,
      total: trendingTracks.length
    });
  } catch (error) {
    console.error("Get trending tracks error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch trending tracks"
    });
  }
};

// Like/unlike track
export const toggleTrackLike: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required"
      });
    }
    
    const track = tracks.find(t => t.id === id);
    
    if (!track) {
      return res.status(404).json({
        success: false,
        message: "Track not found"
      });
    }
    
    // Get user's liked tracks
    if (!userLikedTracks.has(userId)) {
      userLikedTracks.set(userId, new Set());
    }
    
    const userLikes = userLikedTracks.get(userId)!;
    const isCurrentlyLiked = userLikes.has(id);
    
    if (isCurrentlyLiked) {
      // Unlike track
      userLikes.delete(id);
      track.like_count = Math.max(0, track.like_count - 1);
    } else {
      // Like track
      userLikes.add(id);
      track.like_count += 1;
    }
    
    track.updated_at = new Date().toISOString();
    
    res.json({
      success: true,
      data: {
        track_id: track.id,
        is_liked: !isCurrentlyLiked,
        like_count: track.like_count
      }
    });
  } catch (error) {
    console.error("Toggle track like error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle like"
    });
  }
};

// Get user's liked tracks
export const getUserLikedTracks: RequestHandler = async (req, res) => {
  try {
    const userId = req.userId || "dev_user"; // Use default user ID in development mode

    // In development mode without authentication, return empty liked tracks
    if (!req.userId) {
      return res.json({
        success: true,
        data: [],
        total: 0,
        message: "Development mode - no authentication"
      });
    }
    
    const userLikes = userLikedTracks.get(userId) || new Set();
    const likedTracks = tracks.filter(track => userLikes.has(track.id));
    
    res.json({
      success: true,
      data: likedTracks,
      total: likedTracks.length
    });
  } catch (error) {
    console.error("Get user liked tracks error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch liked tracks"
    });
  }
};

// Get tracks by artist
export const getTracksByArtist: RequestHandler = async (req, res) => {
  try {
    const { artist_id } = req.params;
    const { limit = 20 } = req.query;
    const limitNum = parseInt(limit as string);
    
    const artistTracks = tracks
      .filter(track => track.artist_id === artist_id)
      .sort((a, b) => b.play_count - a.play_count)
      .slice(0, limitNum);
    
    res.json({
      success: true,
      data: artistTracks,
      total: artistTracks.length
    });
  } catch (error) {
    console.error("Get tracks by artist error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch artist tracks"
    });
  }
};

// Get tracks by album
export const getTracksByAlbum: RequestHandler = async (req, res) => {
  try {
    const { album_id } = req.params;
    
    const albumTracks = tracks
      .filter(track => track.album_id === album_id)
      .sort((a, b) => a.track_number - b.track_number);
    
    res.json({
      success: true,
      data: albumTracks,
      total: albumTracks.length
    });
  } catch (error) {
    console.error("Get tracks by album error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch album tracks"
    });
  }
};
