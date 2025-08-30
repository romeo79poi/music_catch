import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    cover_image_url: {
      type: String,
      default: "",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    songs: [
      {
        song: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Song",
          required: true,
        },
        added_at: {
          type: Date,
          default: Date.now,
        },
        added_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      },
    ],
    collaborators: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["editor", "viewer"],
          default: "viewer",
        },
        added_at: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    is_public: {
      type: Boolean,
      default: true,
    },
    is_collaborative: {
      type: Boolean,
      default: false,
    },
    follower_count: {
      type: Number,
      default: 0,
    },
    play_count: {
      type: Number,
      default: 0,
    },
    total_duration: {
      type: Number, // Total duration in seconds
      default: 0,
    },
    tags: [String],
    category: {
      type: String,
      enum: ["user", "featured", "mood", "genre", "activity"],
      default: "user",
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
playlistSchema.index({ name: "text", owner: 1 });
playlistSchema.index({ is_public: 1 });
playlistSchema.index({ category: 1 });
playlistSchema.index({ follower_count: -1 });
playlistSchema.index({ created_at: -1 });
playlistSchema.index({ "collaborators.user": 1 });

// Virtual for song count
playlistSchema.virtual("song_count").get(function () {
  return this.songs.length;
});

export const Playlist =
  mongoose.models.Playlist || mongoose.model("Playlist", playlistSchema);
export default Playlist;
