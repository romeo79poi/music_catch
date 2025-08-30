import mongoose from "mongoose";

const playHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    song: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Song",
      required: true,
    },
    play_duration: {
      type: Number, // Duration played in seconds
      required: true,
    },
    total_duration: {
      type: Number, // Total song duration
      required: true,
    },
    completion_percentage: {
      type: Number, // Percentage of song completed (0-100)
      required: true,
    },
    device_type: {
      type: String,
      enum: ["web", "mobile", "desktop", "smart_speaker"],
      default: "web",
    },
    play_source: {
      type: String,
      enum: ["search", "playlist", "album", "radio", "recommendation"],
      default: "search",
    },
    playlist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Playlist",
      required: false,
    },
    album_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Album",
      required: false,
    },
    skipped: {
      type: Boolean,
      default: false,
    },
    liked_during_play: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: {
      createdAt: "played_at",
      updatedAt: "updated_at",
    },
  },
);

// Indexes for analytics and recommendations
playHistorySchema.index({ user: 1, played_at: -1 });
playHistorySchema.index({ song: 1, played_at: -1 });
playHistorySchema.index({ user: 1, song: 1 });
playHistorySchema.index({ play_source: 1 });
playHistorySchema.index({ completion_percentage: 1 });
playHistorySchema.index({ played_at: -1 });

export const PlayHistory =
  mongoose.models.PlayHistory ||
  mongoose.model("PlayHistory", playHistorySchema);
export default PlayHistory;
