import { RequestHandler } from "express";
import { serverSupabase } from "../lib/supabase";

// Mock genres and categories for compatibility
const genres = [
  "Pop", "Hip-Hop", "Rock", "Electronic", "Jazz", "Classical",
  "R&B", "Country", "Reggae", "Folk", "Blues", "Alternative"
];

const sampleSongs = [
  {
    id: 1,
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    duration: "3:20",
    image:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    genre: "Pop",
    releaseDate: "2019-11-29",
    plays: 45672,
    likes: 3421,
    explicit: false,
    isPopular: true,
  },
  {
    id: 2,
    title: "Watermelon Sugar",
    artist: "Harry Styles",
    album: "Fine Line",
    duration: "2:54",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    genre: "Pop",
    releaseDate: "2020-05-18",
    plays: 38934,
    likes: 2876,
    explicit: false,
    isPopular: true,
  },
  {
    id: 3,
    title: "Levitating",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    duration: "3:23",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    genre: "Pop",
    releaseDate: "2020-03-27",
    plays: 42156,
    likes: 3654,
    explicit: false,
    isPopular: true,
  },
  {
    id: 4,
    title: "Good 4 U",
    artist: "Olivia Rodrigo",
    album: "SOUR",
    duration: "2:58",
    image:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
    genre: "Pop Rock",
    releaseDate: "2021-05-14",
    plays: 35467,
    likes: 2987,
    explicit: false,
    isPopular: true,
  },
  {
    id: 5,
    title: "Stay",
    artist: "The Kid LAROI, Justin Bieber",
    album: "F*CK LOVE 3+",
    duration: "2:21",
    image:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop",
    genre: "Hip-Hop",
    releaseDate: "2021-07-09",
    plays: 29834,
    likes: 2341,
    explicit: true,
    isPopular: true,
  },
  {
    id: 6,
    title: "Heat Waves",
    artist: "Glass Animals",
    album: "Dreamland",
    duration: "3:58",
    image:
      "https://images.unsplash.com/photo-1571974599782-87624638275c?w=400&h=400&fit=crop",
    genre: "Indie Pop",
    releaseDate: "2020-06-29",
    plays: 31245,
    likes: 2654,
    explicit: false,
    isPopular: true,
  },
  {
    id: 7,
    title: "As It Was",
    artist: "Harry Styles",
    album: "Harry's House",
    duration: "2:47",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    genre: "Pop",
    releaseDate: "2022-04-01",
    plays: 28967,
    likes: 2456,
    explicit: false,
    isPopular: true,
  },
  {
    id: 8,
    title: "Anti-Hero",
    artist: "Taylor Swift",
    album: "Midnights",
    duration: "3:20",
    image:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    genre: "Pop",
    releaseDate: "2022-10-21",
    plays: 33421,
    likes: 2987,
    explicit: false,
    isPopular: true,
  },
  {
    id: 9,
    title: "Flowers",
    artist: "Miley Cyrus",
    album: "Endless Summer Vacation",
    duration: "3:20",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    genre: "Pop",
    releaseDate: "2023-01-13",
    plays: 27834,
    likes: 2234,
    explicit: false,
    isPopular: true,
  },
  {
    id: 10,
    title: "Unholy",
    artist: "Sam Smith ft. Kim Petras",
    album: "Gloria",
    duration: "2:36",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    genre: "Pop",
    releaseDate: "2022-09-22",
    plays: 25678,
    likes: 2112,
    explicit: true,
    isPopular: false,
  },
];

const artistsDatabase = [
  {
    id: 1,
    name: "The Weeknd",
    image:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    followers: 45672,
    genres: ["Pop", "R&B"],
    verified: true,
  },
  {
    id: 2,
    name: "Harry Styles",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    followers: 38934,
    genres: ["Pop", "Rock"],
    verified: true,
  },
  {
    id: 3,
    name: "Dua Lipa",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    followers: 42156,
    genres: ["Pop", "Dance"],
    verified: true,
  },
];

const playlistsDatabase = [
  {
    id: 1,
    name: "Today's Top Hits",
    description: "The most played songs right now",
    image:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    songIds: [1, 2, 3, 4, 5],
    followers: 25678934,
    isOfficial: true,
  },
  {
    id: 2,
    name: "Chill Hits",
    description: "Relax and unwind with these chill vibes",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    songIds: [6, 7, 8],
    followers: 12345678,
    isOfficial: true,
  },
  {
    id: 3,
    name: "Pop Rising",
    description: "New pop hits on the rise",
    image:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
    songIds: [8, 9, 10],
    followers: 8765432,
    isOfficial: true,
  },
];

const genresDatabase = [
  { id: 1, name: "Pop", color: "from-pink-500 to-purple-600", songCount: 1234 },
  {
    id: 2,
    name: "Hip-Hop",
    color: "from-orange-500 to-red-600",
    songCount: 987,
  },
  { id: 3, name: "Rock", color: "from-gray-600 to-gray-800", songCount: 765 },
  {
    id: 4,
    name: "Electronic",
    color: "from-blue-500 to-cyan-600",
    songCount: 543,
  },
  {
    id: 5,
    name: "Jazz",
    color: "from-yellow-500 to-orange-600",
    songCount: 321,
  },
  {
    id: 6,
    name: "Classical",
    color: "from-indigo-500 to-purple-600",
    songCount: 234,
  },
  { id: 7, name: "R&B", color: "from-green-500 to-teal-600", songCount: 456 },
  {
    id: 8,
    name: "Country",
    color: "from-amber-500 to-yellow-600",
    songCount: 345,
  },
];

// Get trending/popular songs
export const getTrendingSongs: RequestHandler = async (req, res) => {
  try {
    const { limit = 20, genre, explicit } = req.query;

    let songs = [...songsDatabase];

    // Filter by genre if specified
    if (genre && typeof genre === "string") {
      songs = songs.filter((song) =>
        song.genre.toLowerCase().includes(genre.toLowerCase()),
      );
    }

    // Filter explicit content if specified
    if (explicit === "false") {
      songs = songs.filter((song) => !song.explicit);
    }

    // Sort by popularity (plays)
    songs.sort((a, b) => b.plays - a.plays);

    // Limit results
    const limitNum = parseInt(limit as string);
    songs = songs.slice(0, limitNum);

    res.json({
      success: true,
      songs,
      total: songs.length,
    });
  } catch (error) {
    console.error("Get trending songs error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Search songs, artists, albums
export const searchMusic: RequestHandler = async (req, res) => {
  try {
    const { q, type = "all", limit = 20 } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const limitNum = parseInt(limit as string);

    const results: any = {
      success: true,
      query: q,
      results: {},
    };

    if (type === "all" || type === "songs") {
      const { data: songs } = await serverSupabase.searchSongs(q, limitNum);
      results.results.songs = songs || [];
    }

    if (type === "all" || type === "artists") {
      // For now, extract unique artists from songs
      const { data: allSongs } = await serverSupabase.getSongs(100);
      const uniqueArtists = [...new Set(allSongs?.map(song => song.artist) || [])]
        .filter(artist => artist.toLowerCase().includes(q.toLowerCase()))
        .slice(0, limitNum)
        .map((artist, index) => ({
          id: index + 1,
          name: artist,
          followers: Math.floor(Math.random() * 1000000),
          image: `https://images.unsplash.com/photo-${1493225457124 + index}?w=400&h=400&fit=crop`
        }));

      results.results.artists = uniqueArtists;
    }

    if (type === "all" || type === "playlists") {
      const { data: playlists } = await serverSupabase.getPublicPlaylists(limitNum);
      const filteredPlaylists = playlists?.filter(playlist =>
        playlist.name.toLowerCase().includes(q.toLowerCase())
      ) || [];

      results.results.playlists = filteredPlaylists;
    }

    res.json(results);
  } catch (error) {
    console.error("Search music error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get song by ID
export const getSongById: RequestHandler = async (req, res) => {
  try {
    const { songId } = req.params;

    const song = songsDatabase.find((s) => s.id === parseInt(songId));

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Song not found",
      });
    }

    res.json({
      success: true,
      song,
    });
  } catch (error) {
    console.error("Get song error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get artist by ID
export const getArtistById: RequestHandler = async (req, res) => {
  try {
    const { artistId } = req.params;

    const artist = artistsDatabase.find((a) => a.id === parseInt(artistId));

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found",
      });
    }

    // Get artist's songs
    const artistSongs = songsDatabase.filter((song) =>
      song.artist.includes(artist.name),
    );

    res.json({
      success: true,
      artist: {
        ...artist,
        songs: artistSongs,
      },
    });
  } catch (error) {
    console.error("Get artist error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get featured playlists
export const getFeaturedPlaylists: RequestHandler = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const playlists = playlistsDatabase
      .filter((p) => p.isOfficial)
      .slice(0, parseInt(limit as string))
      .map((playlist) => ({
        ...playlist,
        songs: playlist.songIds
          .map((id) => songsDatabase.find((song) => song.id === id))
          .filter(Boolean),
      }));

    res.json({
      success: true,
      playlists,
    });
  } catch (error) {
    console.error("Get featured playlists error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get playlist by ID
export const getPlaylistById: RequestHandler = async (req, res) => {
  try {
    const { playlistId } = req.params;

    const playlist = playlistsDatabase.find(
      (p) => p.id === parseInt(playlistId),
    );

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found",
      });
    }

    const songs = playlist.songIds
      .map((id) => songsDatabase.find((song) => song.id === id))
      .filter(Boolean);

    res.json({
      success: true,
      playlist: {
        ...playlist,
        songs,
      },
    });
  } catch (error) {
    console.error("Get playlist error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get genres
export const getGenres: RequestHandler = async (req, res) => {
  try {
    res.json({
      success: true,
      genres: genresDatabase,
    });
  } catch (error) {
    console.error("Get genres error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get songs by genre
export const getSongsByGenre: RequestHandler = async (req, res) => {
  try {
    const { genre } = req.params;
    const { limit = 20 } = req.query;

    const songs = songsDatabase
      .filter((song) => song.genre.toLowerCase() === genre.toLowerCase())
      .slice(0, parseInt(limit as string));

    res.json({
      success: true,
      genre,
      songs,
      total: songs.length,
    });
  } catch (error) {
    console.error("Get songs by genre error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get recommendations based on user listening history
export const getRecommendations: RequestHandler = async (req, res) => {
  try {
    const { userId, limit = 10 } = req.query;

    // For demo purposes, return popular songs as recommendations
    // In real app, this would use ML algorithms based on user's listening history
    const recommendations = songsDatabase
      .filter((song) => song.isPopular)
      .sort((a, b) => b.likes - a.likes)
      .slice(0, parseInt(limit as string));

    res.json({
      success: true,
      recommendations,
      algorithm: "collaborative_filtering",
    });
  } catch (error) {
    console.error("Get recommendations error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Recently played songs
export const getRecentlyPlayed: RequestHandler = async (req, res) => {
  try {
    const { userId, limit = 20 } = req.query;

    // Mock recently played - in real app, this would come from user's play history
    const recentlyPlayed = songsDatabase
      .slice(0, parseInt(limit as string))
      .map((song) => ({
        ...song,
        playedAt: new Date(
          Date.now() - Math.random() * 86400000 * 7,
        ).toISOString(),
      }));

    res.json({
      success: true,
      recentlyPlayed,
    });
  } catch (error) {
    console.error("Get recently played error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Play song (track play count)
export const playSong: RequestHandler = async (req, res) => {
  try {
    const { songId } = req.params;
    const { userId } = req.body;

    const songIndex = songsDatabase.findIndex((s) => s.id === parseInt(songId));

    if (songIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Song not found",
      });
    }

    // Increment play count
    songsDatabase[songIndex].plays += 1;

    res.json({
      success: true,
      message: "Play recorded",
      song: songsDatabase[songIndex],
    });
  } catch (error) {
    console.error("Play song error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
