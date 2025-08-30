import { RequestHandler } from "express";

// Mock database for artists
const artists = [
  {
    id: "550e8400-e29b-41d4-a716-446655440020",
    name: "Taylor Swift",
    bio: "American singer-songwriter known for her narrative songwriting, which often centers around her personal life and has received widespread media coverage.",
    genre: "Pop",
    image_url: "https://example.com/artists/taylor-swift.jpg",
    verified: true,
    monthly_listeners: 83_000_000,
    follower_count: 45_000_000,
    total_plays: 15_000_000_000,
    top_tracks_count: 200,
    albums_count: 12,
    country: "United States",
    created_at: "2020-01-01T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440021",
    name: "The Weeknd",
    bio: "Canadian singer, songwriter, and record producer. Noted for his versatility in vocal style, music production, and eccentric presentation.",
    genre: "R&B",
    image_url: "https://example.com/artists/the-weeknd.jpg",
    verified: true,
    monthly_listeners: 78_000_000,
    follower_count: 42_000_000,
    total_plays: 12_000_000_000,
    top_tracks_count: 150,
    albums_count: 8,
    country: "Canada",
    created_at: "2020-01-01T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440022",
    name: "Ed Sheeran",
    bio: "English singer-songwriter. Born in Halifax, West Yorkshire, he began writing songs around the age of eleven.",
    genre: "Pop",
    image_url: "https://example.com/artists/ed-sheeran.jpg",
    verified: true,
    monthly_listeners: 68_000_000,
    follower_count: 38_000_000,
    total_plays: 10_000_000_000,
    top_tracks_count: 180,
    albums_count: 6,
    country: "United Kingdom",
    created_at: "2020-01-01T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440023",
    name: "Dua Lipa",
    bio: "English singer and songwriter. Her music style blends elements of pop, disco, and electronic dance music.",
    genre: "Pop",
    image_url: "https://example.com/artists/dua-lipa.jpg",
    verified: true,
    monthly_listeners: 62_000_000,
    follower_count: 35_000_000,
    total_plays: 8_000_000_000,
    top_tracks_count: 120,
    albums_count: 4,
    country: "United Kingdom",
    created_at: "2020-01-01T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440024",
    name: "Drake",
    bio: "Canadian rapper, singer, songwriter, actor, and entrepreneur. A prominent figure in popular music.",
    genre: "Hip-Hop",
    image_url: "https://example.com/artists/drake.jpg",
    verified: true,
    monthly_listeners: 95_000_000,
    follower_count: 55_000_000,
    total_plays: 20_000_000_000,
    top_tracks_count: 300,
    albums_count: 15,
    country: "Canada",
    created_at: "2020-01-01T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440025",
    name: "Ariana Grande",
    bio: "American singer, songwriter, and actress. Known for her wide vocal range and pop music.",
    genre: "Pop",
    image_url: "https://example.com/artists/ariana-grande.jpg",
    verified: true,
    monthly_listeners: 72_000_000,
    follower_count: 41_000_000,
    total_plays: 11_000_000_000,
    top_tracks_count: 160,
    albums_count: 7,
    country: "United States",
    created_at: "2020-01-01T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440026",
    name: "Post Malone",
    bio: "American rapper, singer, songwriter, and record producer known for his introspective songwriting.",
    genre: "Hip-Hop",
    image_url: "https://example.com/artists/post-malone.jpg",
    verified: true,
    monthly_listeners: 58_000_000,
    follower_count: 32_000_000,
    total_plays: 9_000_000_000,
    top_tracks_count: 140,
    albums_count: 5,
    country: "United States",
    created_at: "2020-01-01T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440027",
    name: "Billie Eilish",
    bio: "American singer and songwriter. She first gained attention in 2015 for her unique style and sound.",
    genre: "Alternative",
    image_url: "https://example.com/artists/billie-eilish.jpg",
    verified: true,
    monthly_listeners: 64_000_000,
    follower_count: 36_000_000,
    total_plays: 7_500_000_000,
    top_tracks_count: 100,
    albums_count: 4,
    country: "United States",
    created_at: "2020-01-01T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  }
];

// User followed artists
const userFollowedArtists = new Map<string, Set<string>>();

// Get all artists
export const getAllArtists: RequestHandler = async (req, res) => {
  try {
    const { page = 1, limit = 20, genre, search, sort_by = "monthly_listeners" } = req.query;
    
    let filteredArtists = [...artists];
    
    // Filter by genre
    if (genre) {
      filteredArtists = filteredArtists.filter(artist => 
        artist.genre.toLowerCase() === (genre as string).toLowerCase()
      );
    }
    
    // Search functionality
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredArtists = filteredArtists.filter(artist =>
        artist.name.toLowerCase().includes(searchTerm) ||
        artist.bio.toLowerCase().includes(searchTerm) ||
        artist.genre.toLowerCase().includes(searchTerm)
      );
    }
    
    // Sort artists
    filteredArtists.sort((a, b) => {
      switch (sort_by) {
        case "monthly_listeners":
          return b.monthly_listeners - a.monthly_listeners;
        case "follower_count":
          return b.follower_count - a.follower_count;
        case "total_plays":
          return b.total_plays - a.total_plays;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return b.monthly_listeners - a.monthly_listeners;
      }
    });
    
    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedArtists = filteredArtists.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedArtists,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredArtists.length,
        pages: Math.ceil(filteredArtists.length / limitNum)
      }
    });
  } catch (error) {
    console.error("Get artists error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch artists"
    });
  }
};

// Get artist by ID
export const getArtistById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    const artist = artists.find(a => a.id === id);
    
    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found"
      });
    }
    
    res.json({
      success: true,
      data: artist
    });
  } catch (error) {
    console.error("Get artist by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch artist"
    });
  }
};

// Search artists
export const searchArtists: RequestHandler = async (req, res) => {
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
    
    const searchResults = artists
      .filter(artist =>
        artist.name.toLowerCase().includes(searchTerm) ||
        artist.bio.toLowerCase().includes(searchTerm) ||
        artist.genre.toLowerCase().includes(searchTerm)
      )
      .slice(0, limitNum);
    
    res.json({
      success: true,
      data: searchResults,
      total: searchResults.length
    });
  } catch (error) {
    console.error("Search artists error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search artists"
    });
  }
};

// Get trending artists
export const getTrendingArtists: RequestHandler = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const limitNum = parseInt(limit as string);
    
    // Sort by monthly listeners (simplified trending algorithm)
    const trendingArtists = [...artists]
      .sort((a, b) => b.monthly_listeners - a.monthly_listeners)
      .slice(0, limitNum);
    
    res.json({
      success: true,
      data: trendingArtists,
      total: trendingArtists.length
    });
  } catch (error) {
    console.error("Get trending artists error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch trending artists"
    });
  }
};

// Follow/unfollow artist
export const toggleArtistFollow: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required"
      });
    }
    
    const artist = artists.find(a => a.id === id);
    
    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found"
      });
    }
    
    // Get user's followed artists
    if (!userFollowedArtists.has(userId)) {
      userFollowedArtists.set(userId, new Set());
    }
    
    const userFollows = userFollowedArtists.get(userId)!;
    const isCurrentlyFollowed = userFollows.has(id);
    
    if (isCurrentlyFollowed) {
      // Unfollow artist
      userFollows.delete(id);
      artist.follower_count = Math.max(0, artist.follower_count - 1);
    } else {
      // Follow artist
      userFollows.add(id);
      artist.follower_count += 1;
    }
    
    artist.updated_at = new Date().toISOString();
    
    res.json({
      success: true,
      data: {
        artist_id: artist.id,
        is_following: !isCurrentlyFollowed,
        follower_count: artist.follower_count
      }
    });
  } catch (error) {
    console.error("Toggle artist follow error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle follow"
    });
  }
};

// Get user's followed artists
export const getUserFollowedArtists: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers['user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required"
      });
    }
    
    const userFollows = userFollowedArtists.get(userId) || new Set();
    const followedArtists = artists.filter(artist => userFollows.has(artist.id));
    
    res.json({
      success: true,
      data: followedArtists,
      total: followedArtists.length
    });
  } catch (error) {
    console.error("Get user followed artists error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch followed artists"
    });
  }
};

// Get artists by genre
export const getArtistsByGenre: RequestHandler = async (req, res) => {
  try {
    const { genre } = req.params;
    const { limit = 20 } = req.query;
    const limitNum = parseInt(limit as string);
    
    const genreArtists = artists
      .filter(artist => artist.genre.toLowerCase() === genre.toLowerCase())
      .sort((a, b) => b.monthly_listeners - a.monthly_listeners)
      .slice(0, limitNum);
    
    res.json({
      success: true,
      data: genreArtists,
      total: genreArtists.length,
      genre: genre
    });
  } catch (error) {
    console.error("Get artists by genre error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch artists by genre"
    });
  }
};

// Get artist's top tracks
export const getArtistTopTracks: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit as string);
    
    const artist = artists.find(a => a.id === id);
    
    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found"
      });
    }
    
    // Mock top tracks data (in real app, fetch from tracks table)
    const topTracks = [
      {
        id: "550e8400-e29b-41d4-a716-446655440040",
        title: "Anti-Hero",
        play_count: 50_000_000,
        like_count: 1_500_000,
        duration_ms: 200_000
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440045",
        title: "Lavender Haze",
        play_count: 35_000_000,
        like_count: 900_000,
        duration_ms: 202_000
      }
    ].slice(0, limitNum);
    
    res.json({
      success: true,
      data: {
        artist: artist,
        top_tracks: topTracks
      }
    });
  } catch (error) {
    console.error("Get artist top tracks error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch artist top tracks"
    });
  }
};

// Get similar artists
export const getSimilarArtists: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit as string);
    
    const artist = artists.find(a => a.id === id);
    
    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found"
      });
    }
    
    // Find artists with similar genre (simplified similarity algorithm)
    const similarArtists = artists
      .filter(a => a.id !== id && a.genre === artist.genre)
      .sort((a, b) => b.monthly_listeners - a.monthly_listeners)
      .slice(0, limitNum);
    
    res.json({
      success: true,
      data: similarArtists,
      total: similarArtists.length
    });
  } catch (error) {
    console.error("Get similar artists error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch similar artists"
    });
  }
};
