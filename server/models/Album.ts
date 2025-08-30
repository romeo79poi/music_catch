import mongoose from "mongoose";

const albumSchema = new mongoose.Schema(
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
    description: {
      type: String,
      default: "",
    },
    cover_image_url: {
      type: String,
      default: "",
    },
    release_date: {
      type: Date,
      required: true,
    },
    genre: {
      type: String,
      required: true,
    },
    total_tracks: {
      type: Number,
      default: 0,
    },
    total_duration: {
      type: Number, // Total duration in seconds
      default: 0,
    },
    album_type: {
      type: String,
      enum: ["album", "single", "ep", "compilation"],
      default: "album",
    },
    record_label: {
      type: String,
      default: "",
    },
    is_explicit: {
      type: Boolean,
      default: false,
    },
    is_premium: {
      type: Boolean,
      default: false,
    },
    play_count: {
      type: Number,
      default: 0,
    },
    like_count: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
albumSchema.index({ title: "text", artist: 1 });
albumSchema.index({ genre: 1 });
albumSchema.index({ release_date: -1 });
albumSchema.index({ album_type: 1 });
albumSchema.index({ status: 1 });
albumSchema.index({ play_count: -1 });

export const Album =
  mongoose.models.Album || mongoose.model("Album", albumSchema);
export default Album;
