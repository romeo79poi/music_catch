import { Request, Response } from "express";
import { connectDB, isMongoConnected } from "../lib/mongodb";
import Song from "../models/Song";
import Album from "../models/Album";
import Artist from "../models/Artist";
import Playlist from "../models/Playlist";
import PlayHistory from "../models/PlayHistory";
import UserLikes from "../models/UserLikes";
import User from "../models/User";

// Initialize MongoDB connection
async function initConnection() {
  if (!isMongoConnected()) {
    const result = await connectDB();
    if (!result.success) {
      return false;
    }
  }
  return true;
}

// GET /api/music/stream/:songId - Stream music file with analytics
export async function streamSong(req: Request, res: Response) {
  try {
    const connected = await initConnection();
    if (!connected) {
      return res.status(503).json({
        success: false,
        message: "Database not available",
      });
    }

    const { songId } = req.params;
    const userId = (req as any).user?.userId;
    const range = req.headers.range;

    const song = await Song.findById(songId)
      .populate("artist", "name verified")
      .populate("album", "title");

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Song not found",
      });
    }

    // Check if song is approved
    if (song.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Song not available",
      });
    }

    // Record play history if user is logged in
    if (userId) {
      // Create play history record
      await PlayHistory.create({
        user: userId,
        song: songId,
        play_duration: 0, // Will be updated via separate endpoint
        total_duration: song.duration,
        completion_percentage: 0,
        play_source: req.query.source || "direct",
        playlist_id: req.query.playlist || null,
        album_id: song.album || null,
      });

      // Increment play count
      await Song.findByIdAndUpdate(songId, {
        $inc: { play_count: 1 },
      });
    }

    // For now, redirect to the file URL (in production, implement proper streaming)
    if (song.file_url.startsWith("http")) {
      return res.redirect(song.file_url);
    }

    // Handle range requests for local files
    if (range && song.file_url.startsWith("/uploads/")) {
      // This would require implementing range request handling for local files
      // For now, just redirect
      return res.redirect(song.file_url);
    }

    // Return song URL for client-side streaming
    res.json({
      success: true,
      stream_url: song.file_url,
      song: {
        id: song._id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        duration: song.duration,
        play_count: song.play_count,
      },
    });
  } catch (error: any) {
    console.error("❌ Error streaming song:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

// POST /api/music/play-progress - Update play progress
export async function updatePlayProgress(req: Request, res: Response) {
  try {
    const connected = await initConnection();
    if (!connected) {
      return res.status(503).json({
        success: false,
        message: "Database not available",
      });
    }

    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { songId, playDuration, totalDuration, completed } = req.body;

    if (!songId || playDuration === undefined) {
      return res.status(400).json({
        success: false,
        message: "Song ID and play duration are required",
      });
    }

    const completionPercentage = totalDuration
      ? Math.round((playDuration / totalDuration) * 100)
      : 0;

    // Find the most recent play history record for this user and song
    await PlayHistory.findOneAndUpdate(
      {
        user: userId,
        song: songId,
      },
      {
        play_duration: playDuration,
        completion_percentage: completionPercentage,
        skipped: !completed && completionPercentage < 80,
      },
      {
        sort: { played_at: -1 },
      },
    );

    res.json({
      success: true,
      message: "Play progress updated",
    });
  } catch (error: any) {
    console.error("❌ Error updating play progress:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

// GET /api/music/trending - Get trending songs
export async function getTrendingSongs(req: Request, res: Response) {
  try {
    const connected = await initConnection();
    if (!connected) {
      return res.status(503).json({
        success: false,
        message: "Database not available",
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const genre = req.query.genre as string;

    let filter: any = { status: "approved" };
    if (genre) {
      filter.genre = genre;
    }

    const songs = await Song.find(filter)
      .populate("artist", "name verified profile_image_url")
      .populate("album", "title cover_image_url")
      .sort({ play_count: -1, created_at: -1 })
      .skip(skip)
      .limit(limit);

    const totalSongs = await Song.countDocuments(filter);

    res.json({
      success: true,
      songs: songs.map((song) => ({
        id: song._id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        duration: song.duration,
        cover_image_url: song.cover_image_url || song.album?.cover_image_url,
        play_count: song.play_count,
        like_count: song.like_count,
        genre: song.genre,
        is_explicit: song.is_explicit,
        created_at: song.created_at,
      })),
      pagination: {
        page,
        limit,
        total: totalSongs,
        pages: Math.ceil(totalSongs / limit),
        hasMore: skip + songs.length < totalSongs,
      },
    });
  } catch (error: any) {
    console.error("❌ Error getting trending songs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

// GET /api/music/search - Search songs, artists, albums
export async function searchMusic(req: Request, res: Response) {
  try {
    const connected = await initConnection();
    if (!connected) {
      return res.status(503).json({
        success: false,
        message: "Database not available",
      });
    }

    const query = req.query.q as string;
    const type = (req.query.type as string) || "all";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters",
      });
    }

    const searchRegex = new RegExp(query.trim(), "i");
    const results: any = {};

    if (type === "all" || type === "songs") {
      const songs = await Song.find({
        status: "approved",
        $or: [
          { title: searchRegex },
          { genre: searchRegex },
          { tags: { $in: [searchRegex] } },
        ],
      })
        .populate("artist", "name verified")
        .populate("album", "title")
        .sort({ play_count: -1 })
        .limit(type === "songs" ? limit : 10);

      results.songs = songs.map((song) => ({
        id: song._id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        duration: song.duration,
        play_count: song.play_count,
        genre: song.genre,
      }));
    }

    if (type === "all" || type === "artists") {
      const artists = await Artist.find({
        name: searchRegex,
        status: "active",
      })
        .sort({ follower_count: -1 })
        .limit(type === "artists" ? limit : 10);

      results.artists = artists.map((artist) => ({
        id: artist._id,
        name: artist.name,
        bio: artist.bio,
        profile_image_url: artist.profile_image_url,
        follower_count: artist.follower_count,
        verified: artist.verified,
        genres: artist.genres,
      }));
    }

    if (type === "all" || type === "albums") {
      const albums = await Album.find({
        status: "approved",
        $or: [{ title: searchRegex }, { genre: searchRegex }],
      })
        .populate("artist", "name verified")
        .sort({ play_count: -1 })
        .limit(type === "albums" ? limit : 10);

      results.albums = albums.map((album) => ({
        id: album._id,
        title: album.title,
        artist: album.artist,
        cover_image_url: album.cover_image_url,
        release_date: album.release_date,
        total_tracks: album.total_tracks,
        genre: album.genre,
      }));
    }

    if (type === "all" || type === "playlists") {
      const playlists = await Playlist.find({
        is_public: true,
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { tags: { $in: [searchRegex] } },
        ],
      })
        .populate("owner", "username display_name")
        .sort({ follower_count: -1 })
        .limit(type === "playlists" ? limit : 10);

      results.playlists = playlists.map((playlist) => ({
        id: playlist._id,
        name: playlist.name,
        description: playlist.description,
        cover_image_url: playlist.cover_image_url,
        owner: playlist.owner,
        song_count: playlist.songs.length,
        follower_count: playlist.follower_count,
      }));
    }

    res.json({
      success: true,
      query,
      results,
      pagination: {
        page,
        limit,
      },
    });
  } catch (error: any) {
    console.error("❌ Error searching music:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

// GET /api/music/recommendations/:userId - Get personalized recommendations
export async function getRecommendations(req: Request, res: Response) {
  try {
    const connected = await initConnection();
    if (!connected) {
      return res.status(503).json({
        success: false,
        message: "Database not available",
      });
    }

    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    // Get user's listening history
    const recentPlays = await PlayHistory.find({ user: userId })
      .populate("song")
      .sort({ played_at: -1 })
      .limit(50);

    if (recentPlays.length === 0) {
      // No history, return trending songs
      return getTrendingSongs(req, res);
    }

    // Get user's favorite genres
    const genreCounts = new Map<string, number>();
    recentPlays.forEach((play) => {
      if (play.song && play.song.genre) {
        const current = genreCounts.get(play.song.genre) || 0;
        genreCounts.set(play.song.genre, current + 1);
      }
    });

    const topGenres = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((entry) => entry[0]);

    // Get liked songs to exclude from recommendations
    const likedSongs = await UserLikes.find({
      user: userId,
      item_type: "song",
    }).select("item_id");

    const likedSongIds = likedSongs.map((like) => like.item_id);
    const playedSongIds = recentPlays.map((play) => play.song._id);
    const excludeIds = [...likedSongIds, ...playedSongIds];

    // Find recommendations based on genres
    const recommendations = await Song.find({
      status: "approved",
      genre: { $in: topGenres },
      _id: { $nin: excludeIds },
    })
      .populate("artist", "name verified")
      .populate("album", "title cover_image_url")
      .sort({ play_count: -1, like_count: -1 })
      .limit(limit);

    res.json({
      success: true,
      recommendations: recommendations.map((song) => ({
        id: song._id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        duration: song.duration,
        cover_image_url: song.cover_image_url || song.album?.cover_image_url,
        genre: song.genre,
        play_count: song.play_count,
        like_count: song.like_count,
        reason: `Based on your love for ${song.genre}`,
      })),
      based_on_genres: topGenres,
    });
  } catch (error: any) {
    console.error("❌ Error getting recommendations:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

// POST /api/music/like/:songId - Like/unlike a song
export async function toggleSongLike(req: Request, res: Response) {
  try {
    const connected = await initConnection();
    if (!connected) {
      return res.status(503).json({
        success: false,
        message: "Database not available",
      });
    }

    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { songId } = req.params;

    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Song not found",
      });
    }

    // Check if already liked
    const existingLike = await UserLikes.findOne({
      user: userId,
      item_type: "song",
      item_id: songId,
    });

    let liked = false;

    if (existingLike) {
      // Unlike
      await UserLikes.deleteOne({ _id: existingLike._id });
      await Song.findByIdAndUpdate(songId, { $inc: { like_count: -1 } });
    } else {
      // Like
      await UserLikes.create({
        user: userId,
        item_type: "song",
        item_id: songId,
      });
      await Song.findByIdAndUpdate(songId, { $inc: { like_count: 1 } });
      liked = true;
    }

    res.json({
      success: true,
      liked,
      message: liked ? "Song liked" : "Song unliked",
    });
  } catch (error: any) {
    console.error("❌ Error toggling song like:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

// GET /api/music/liked/:userId - Get user's liked songs
export async function getLikedSongs(req: Request, res: Response) {
  try {
    const connected = await initConnection();
    if (!connected) {
      return res.status(503).json({
        success: false,
        message: "Database not available",
      });
    }

    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const likes = await UserLikes.find({
      user: userId,
      item_type: "song",
    })
      .populate({
        path: "item_id",
        model: "Song",
        populate: [
          { path: "artist", select: "name verified" },
          { path: "album", select: "title cover_image_url" },
        ],
      })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const totalLikes = await UserLikes.countDocuments({
      user: userId,
      item_type: "song",
    });

    const songs = likes
      .filter((like) => like.item_id) // Filter out deleted songs
      .map((like) => {
        const song = like.item_id as any;
        return {
          id: song._id,
          title: song.title,
          artist: song.artist,
          album: song.album,
          duration: song.duration,
          cover_image_url: song.cover_image_url || song.album?.cover_image_url,
          genre: song.genre,
          liked_at: like.created_at,
        };
      });

    res.json({
      success: true,
      songs,
      pagination: {
        page,
        limit,
        total: totalLikes,
        pages: Math.ceil(totalLikes / limit),
        hasMore: skip + songs.length < totalLikes,
      },
    });
  } catch (error: any) {
    console.error("❌ Error getting liked songs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

// GET /api/music/genres - Get available genres
export async function getGenres(req: Request, res: Response) {
  try {
    const connected = await initConnection();
    if (!connected) {
      return res.status(503).json({
        success: false,
        message: "Database not available",
      });
    }

    const genres = await Song.distinct("genre", { status: "approved" });

    // Get song count for each genre
    const genreStats = await Promise.all(
      genres.map(async (genre) => {
        const count = await Song.countDocuments({
          genre,
          status: "approved",
        });
        return { name: genre, song_count: count };
      }),
    );

    res.json({
      success: true,
      genres: genreStats.sort((a, b) => b.song_count - a.song_count),
    });
  } catch (error: any) {
    console.error("❌ Error getting genres:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
