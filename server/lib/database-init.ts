import { connectDB } from "./mongodb";
import {
  User,
  Song,
  Artist,
  Album,
  Playlist,
  VoiceRoom,
  Chat,
  Message,
  UserLikes,
  UserFollows,
  PlayHistory,
} from "../models";

/**
 * Initialize database with sample data for development
 */
export async function initializeDatabase() {
  console.log("🔧 Initializing database...");

  try {
    // Connect to MongoDB
    const connection = await connectDB();
    if (!connection.success) {
      console.log("⚠️ Skipping database initialization - no connection");
      return;
    }

    // Check if we already have data
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log("✅ Database already has data, skipping initialization");
      return;
    }

    console.log("🌱 Seeding database with sample data...");

    // Create sample artists
    const artist1 = await Artist.create({
      name: "The Midnight",
      bio: "Synthwave duo from Los Angeles",
      genres: ["Synthwave", "Electronic", "Retro"],
      verified: true,
      follower_count: 150000,
      monthly_listeners: 80000,
    });

    const artist2 = await Artist.create({
      name: "ODESZA",
      bio: "Electronic music duo from Seattle",
      genres: ["Electronic", "Future Bass", "Chillwave"],
      verified: true,
      follower_count: 500000,
      monthly_listeners: 200000,
    });

    // Create sample albums
    const album1 = await Album.create({
      title: "Endless Summer",
      artist: artist1._id,
      description: "A nostalgic journey through synthwave sounds",
      release_date: new Date("2016-08-05"),
      genre: "Synthwave",
      album_type: "album",
      total_tracks: 10,
      status: "approved",
      uploaded_by: artist1._id,
    });

    const album2 = await Album.create({
      title: "In Return",
      artist: artist2._id,
      description: "Melodic electronic masterpiece",
      release_date: new Date("2014-09-09"),
      genre: "Electronic",
      album_type: "album",
      total_tracks: 12,
      status: "approved",
      uploaded_by: artist2._id,
    });

    // Create sample songs
    const songs = await Song.insertMany([
      {
        title: "Vampires",
        artist: artist1._id,
        album: album1._id,
        duration: 248,
        file_url: "https://example.com/audio/vampires.mp3",
        genre: "Synthwave",
        release_date: new Date("2016-08-05"),
        play_count: 1250000,
        like_count: 85000,
        status: "approved",
        uploaded_by: artist1._id,
      },
      {
        title: "Sunset",
        artist: artist1._id,
        album: album1._id,
        duration: 312,
        file_url: "https://example.com/audio/sunset.mp3",
        genre: "Synthwave",
        release_date: new Date("2016-08-05"),
        play_count: 980000,
        like_count: 65000,
        status: "approved",
        uploaded_by: artist1._id,
      },
      {
        title: "Say My Name",
        artist: artist2._id,
        album: album2._id,
        duration: 267,
        file_url: "https://example.com/audio/say-my-name.mp3",
        genre: "Electronic",
        release_date: new Date("2014-09-09"),
        play_count: 2100000,
        like_count: 120000,
        status: "approved",
        uploaded_by: artist2._id,
      },
      {
        title: "Bloom",
        artist: artist2._id,
        album: album2._id,
        duration: 301,
        file_url: "https://example.com/audio/bloom.mp3",
        genre: "Electronic",
        release_date: new Date("2014-09-09"),
        play_count: 1800000,
        like_count: 95000,
        status: "approved",
        uploaded_by: artist2._id,
      },
    ]);

    // Create sample user
    const sampleUser = await User.create({
      email: "demo@catch.com",
      username: "demo_user",
      name: "Demo User",
      display_name: "Demo User",
      bio: "Sample user for testing Catch app",
      is_verified: true,
      email_verified: true,
      provider: "email",
    });

    // Create sample playlist
    const playlist = await Playlist.create({
      name: "Synthwave Essentials",
      description: "The best synthwave tracks for your night drives",
      owner: sampleUser._id,
      songs: songs.map((song) => ({
        song: song._id,
        added_by: sampleUser._id,
      })),
      is_public: true,
      category: "featured",
      follower_count: 15000,
    });

    console.log("✅ Database initialized successfully with sample data");
    console.log(
      `📊 Created: ${songs.length} songs, 2 artists, 2 albums, 1 playlist`,
    );
  } catch (error: any) {
    console.error("❌ Error initializing database:", error.message);
  }
}

/**
 * Clear all data from database (for testing)
 */
export async function clearDatabase() {
  console.log("🧹 Clearing database...");

  try {
    await Promise.all([
      User.deleteMany({}),
      Song.deleteMany({}),
      Artist.deleteMany({}),
      Album.deleteMany({}),
      Playlist.deleteMany({}),
      VoiceRoom.deleteMany({}),
      Chat.deleteMany({}),
      Message.deleteMany({}),
      UserLikes.deleteMany({}),
      UserFollows.deleteMany({}),
      PlayHistory.deleteMany({}),
    ]);

    console.log("✅ Database cleared successfully");
  } catch (error: any) {
    console.error("❌ Error clearing database:", error.message);
  }
}
