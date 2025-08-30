import mongoose from "mongoose";

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      required: true,
    },
    album: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Album",
      required: false,
    },
    duration: {
      type: Number, // Duration in seconds
      required: true,
    },
    file_url: {
      type: String,
      required: true,
    },
    file_size: {
      type: Number, // File size in bytes
    },
    genre: {
      type: String,
      required: true,
    },
    release_date: {
      type: Date,
    },
    cover_image_url: {
      type: String,
      default: "",
    },
    lyrics: {
      type: String,
      default: "",
    },
    play_count: {
      type: Number,
      default: 0,
    },
    like_count: {
      type: Number,
      default: 0,
    },
    is_explicit: {
      type: Boolean,
      default: false,
    },
    is_premium: {
      type: Boolean,
      default: false,
    },
    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    tags: [String],
    audio_features: {
      tempo: Number,
      key: String,
      energy: Number,
      danceability: Number,
      valence: Number,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

// Indexes for better performance
songSchema.index({ title: "text", artist: 1 });
songSchema.index({ genre: 1 });
songSchema.index({ play_count: -1 });
songSchema.index({ created_at: -1 });
songSchema.index({ uploaded_by: 1 });
songSchema.index({ status: 1 });

export const Song = mongoose.models.Song || mongoose.model("Song", songSchema);
export default Song;
