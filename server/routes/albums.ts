import { RequestHandler } from "express";

// Mock database for albums
const albums = [
  {
    id: "550e8400-e29b-41d4-a716-446655440030",
    title: "Midnights",
    artist_id: "550e8400-e29b-41d4-a716-446655440020",
    artist_name: "Taylor Swift",
    release_date: "2022-10-21",
    album_type: "album",
    cover_image_url: "https://example.com/covers/midnights.jpg",
    total_tracks: 13,
    duration_ms: 2640000, // 44 minutes
    genre: "Pop",
    label: "Republic Records",
    is_active: true,
    play_count: 500000000,
    like_count: 8500000,
    created_at: "2022-10-21T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440031",
    title: "After Hours",
    artist_id: "550e8400-e29b-41d4-a716-446655440021",
    artist_name: "The Weeknd",
    release_date: "2020-03-20",
    album_type: "album",
    cover_image_url: "https://example.com/covers/after-hours.jpg",
    total_tracks: 14,
    duration_ms: 3360000, // 56 minutes
    genre: "R&B",
    label: "XO/Republic Records",
    is_active: true,
    play_count: 750000000,
    like_count: 12000000,
    created_at: "2020-03-20T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440032",
    title: "÷ (Divide)",
    artist_id: "550e8400-e29b-41d4-a716-446655440022",
    artist_name: "Ed Sheeran",
    release_date: "2017-03-03",
    album_type: "album",
    cover_image_url: "https://example.com/covers/divide.jpg",
    total_tracks: 16,
    duration_ms: 3840000, // 64 minutes
    genre: "Pop",
    label: "Asylum Records",
    is_active: true,
    play_count: 600000000,
    like_count: 9500000,
    created_at: "2017-03-03T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440033",
    title: "Future Nostalgia",
    artist_id: "550e8400-e29b-41d4-a716-446655440023",
    artist_name: "Dua Lipa",
    release_date: "2020-03-27",
    album_type: "album",
    cover_image_url: "https://example.com/covers/future-nostalgia.jpg",
    total_tracks: 11,
    duration_ms: 2280000, // 38 minutes
    genre: "Pop",
    label: "Warner Records",
    is_active: true,
    play_count: 450000000,
    like_count: 7200000,
    created_at: "2020-03-27T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440034",
    title: "Certified Lover Boy",
    artist_id: "550e8400-e29b-41d4-a716-446655440024",
    artist_name: "Drake",
    release_date: "2021-09-03",
    album_type: "album",
    cover_image_url: "https://example.com/covers/clb.jpg",
    total_tracks: 21,
    duration_ms: 5160000, // 86 minutes
    genre: "Hip-Hop",
    label: "OVO Sound/Republic Records",
    is_active: true,
    play_count: 800000000,
    like_count: 15000000,
    created_at: "2021-09-03T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440035",
    title: "Positions",
    artist_id: "550e8400-e29b-41d4-a716-446655440025",
    artist_name: "Ariana Grande",
    release_date: "2020-10-30",
    album_type: "album",
    cover_image_url: "https://example.com/covers/positions.jpg",
    total_tracks: 14,
    duration_ms: 2520000, // 42 minutes
    genre: "Pop",
    label: "Republic Records",
    is_active: true,
    play_count: 350000000,
    like_count: 6800000,
    created_at: "2020-10-30T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440036",
    title: "Hollywood's Bleeding",
    artist_id: "550e8400-e29b-41d4-a716-446655440026",
    artist_name: "Post Malone",
    release_date: "2019-09-06",
    album_type: "album",
    cover_image_url: "https://example.com/covers/hollywoods-bleeding.jpg",
    total_tracks: 17,
    duration_ms: 3060000, // 51 minutes
    genre: "Hip-Hop",
    label: "Republic Records",
    is_active: true,
    play_count: 400000000,
    like_count: 7500000,
    created_at: "2019-09-06T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440037",
    title: "When We All Fall Asleep, Where Do We Go?",
    artist_id: "550e8400-e29b-41d4-a716-446655440027",
    artist_name: "Billie Eilish",
    release_date: "2019-03-29",
    album_type: "album",
    cover_image_url: "https://example.com/covers/when-we-all-fall-asleep.jpg",
    total_tracks: 14,
    duration_ms: 2580000, // 43 minutes
    genre: "Alternative",
    label: "Darkroom/Interscope Records",
    is_active: true,
    play_count: 320000000,
    like_count: 5900000,
    created_at: "2019-03-29T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  }
];

// User liked albums
const userLikedAlbums = new Map<string, Set<string>>();

// Get all albums
export const getAllAlbums: RequestHandler = async (req, res) => {
  try {
    const { page = 1, limit = 20, artist_id, genre, search, sort_by = "play_count", album_type } = req.query;
    
    let filteredAlbums = [...albums];
    
    // Filter by artist
    if (artist_id) {
      filteredAlbums = filteredAlbums.filter(album => 
        album.artist_id === artist_id
      );
    }
    
    // Filter by genre
    if (genre) {
      filteredAlbums = filteredAlbums.filter(album => 
        album.genre.toLowerCase() === (genre as string).toLowerCase()
      );
    }
    
    // Filter by album type
    if (album_type) {
      filteredAlbums = filteredAlbums.filter(album => 
        album.album_type === album_type
      );
    }
    
    // Search functionality
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredAlbums = filteredAlbums.filter(album =>
        album.title.toLowerCase().includes(searchTerm) ||
        album.artist_name.toLowerCase().includes(searchTerm) ||
        album.genre.toLowerCase().includes(searchTerm)
      );
    }
    
    // Sort albums
    filteredAlbums.sort((a, b) => {
      switch (sort_by) {
        case "play_count":
          return b.play_count - a.play_count;
        case "like_count":
          return b.like_count - a.like_count;
        case "release_date":
          return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        case "total_tracks":
          return b.total_tracks - a.total_tracks;
        default:
          return b.play_count - a.play_count;
      }
    });
    
    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedAlbums = filteredAlbums.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedAlbums,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredAlbums.length,
        pages: Math.ceil(filteredAlbums.length / limitNum)
      }
    });
  } catch (error) {
    console.error("Get albums error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch albums"
    });
  }
};

// Get album by ID
export const getAlbumById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    const album = albums.find(a => a.id === id);
    
    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found"
      });
    }
    
    res.json({
      success: true,
      data: album
    });
  } catch (error) {
    console.error("Get album by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch album"
    });
  }
};

// Search albums
export const searchAlbums: RequestHandler = async (req, res) => {
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
    
    const searchResults = albums
      .filter(album =>
        album.title.toLowerCase().includes(searchTerm) ||
        album.artist_name.toLowerCase().includes(searchTerm) ||
        album.genre.toLowerCase().includes(searchTerm) ||
        album.label.toLowerCase().includes(searchTerm)
      )
      .slice(0, limitNum);
    
    res.json({
      success: true,
      data: searchResults,
      total: searchResults.length
    });
  } catch (error) {
    console.error("Search albums error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search albums"
    });
  }
};

// Get new releases
export const getNewReleases: RequestHandler = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const limitNum = parseInt(limit as string);
    
    // Get albums released in the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const newReleases = albums
      .filter(album => new Date(album.release_date) >= sixMonthsAgo)
      .sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime())
      .slice(0, limitNum);
    
    res.json({
      success: true,
      data: newReleases,
      total: newReleases.length
    });
  } catch (error) {
    console.error("Get new releases error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch new releases"
    });
  }
};

// Get trending albums
export const getTrendingAlbums: RequestHandler = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const limitNum = parseInt(limit as string);
    
    // Sort by play count and recent activity (simplified trending algorithm)
    const trendingAlbums = [...albums]
      .sort((a, b) => {
        // Weight recent albums higher
        const aRecency = new Date(a.updated_at).getTime();
        const bRecency = new Date(b.updated_at).getTime();
        const aScore = a.play_count + (aRecency / 1000000);
        const bScore = b.play_count + (bRecency / 1000000);
        return bScore - aScore;
      })
      .slice(0, limitNum);
    
    res.json({
      success: true,
      data: trendingAlbums,
      total: trendingAlbums.length
    });
  } catch (error) {
    console.error("Get trending albums error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch trending albums"
    });
  }
};

// Like/unlike album
export const toggleAlbumLike: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required"
      });
    }
    
    const album = albums.find(a => a.id === id);
    
    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found"
      });
    }
    
    // Get user's liked albums
    if (!userLikedAlbums.has(userId)) {
      userLikedAlbums.set(userId, new Set());
    }
    
    const userLikes = userLikedAlbums.get(userId)!;
    const isCurrentlyLiked = userLikes.has(id);
    
    if (isCurrentlyLiked) {
      // Unlike album
      userLikes.delete(id);
      album.like_count = Math.max(0, album.like_count - 1);
    } else {
      // Like album
      userLikes.add(id);
      album.like_count += 1;
    }
    
    album.updated_at = new Date().toISOString();
    
    res.json({
      success: true,
      data: {
        album_id: album.id,
        is_liked: !isCurrentlyLiked,
        like_count: album.like_count
      }
    });
  } catch (error) {
    console.error("Toggle album like error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle like"
    });
  }
};

// Get user's liked albums
export const getUserLikedAlbums: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers['user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required"
      });
    }
    
    const userLikes = userLikedAlbums.get(userId) || new Set();
    const likedAlbums = albums.filter(album => userLikes.has(album.id));
    
    res.json({
      success: true,
      data: likedAlbums,
      total: likedAlbums.length
    });
  } catch (error) {
    console.error("Get user liked albums error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch liked albums"
    });
  }
};

// Get albums by artist
export const getAlbumsByArtist: RequestHandler = async (req, res) => {
  try {
    const { artist_id } = req.params;
    const { album_type, limit = 20 } = req.query;
    const limitNum = parseInt(limit as string);
    
    let artistAlbums = albums.filter(album => album.artist_id === artist_id);
    
    // Filter by album type if specified
    if (album_type) {
      artistAlbums = artistAlbums.filter(album => album.album_type === album_type);
    }
    
    // Sort by release date (newest first)
    artistAlbums.sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime());
    
    const paginatedAlbums = artistAlbums.slice(0, limitNum);
    
    res.json({
      success: true,
      data: paginatedAlbums,
      total: artistAlbums.length
    });
  } catch (error) {
    console.error("Get albums by artist error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch artist albums"
    });
  }
};

// Get albums by genre
export const getAlbumsByGenre: RequestHandler = async (req, res) => {
  try {
    const { genre } = req.params;
    const { limit = 20 } = req.query;
    const limitNum = parseInt(limit as string);
    
    const genreAlbums = albums
      .filter(album => album.genre.toLowerCase() === genre.toLowerCase())
      .sort((a, b) => b.play_count - a.play_count)
      .slice(0, limitNum);
    
    res.json({
      success: true,
      data: genreAlbums,
      total: genreAlbums.length,
      genre: genre
    });
  } catch (error) {
    console.error("Get albums by genre error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch albums by genre"
    });
  }
};

// Get album statistics
export const getAlbumStats: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    const album = albums.find(a => a.id === id);
    
    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found"
      });
    }
    
    // Calculate additional statistics (mock data)
    const stats = {
      album_id: album.id,
      total_plays: album.play_count,
      total_likes: album.like_count,
      average_track_duration: Math.round(album.duration_ms / album.total_tracks),
      daily_plays: Math.round(album.play_count / 365), // Simplified
      monthly_growth: "+12.5%", // Mock data
      top_countries: [
        { country: "United States", percentage: 35.2 },
        { country: "United Kingdom", percentage: 18.7 },
        { country: "Canada", percentage: 12.4 },
        { country: "Australia", percentage: 8.9 },
        { country: "Germany", percentage: 7.1 }
      ],
      age_demographics: {
        "13-17": 15.2,
        "18-24": 28.7,
        "25-34": 31.4,
        "35-44": 16.8,
        "45-54": 5.9,
        "55+": 2.0
      }
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Get album stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch album statistics"
    });
  }
};
