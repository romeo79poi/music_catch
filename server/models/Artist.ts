import mongoose from "mongoose";

const artistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    bio: {
      type: String,
      default: "",
    },
    profile_image_url: {
      type: String,
      default: "",
    },
    cover_image_url: {
      type: String,
      default: "",
    },
    genres: [String],
    country: {
      type: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    follower_count: {
      type: Number,
      default: 0,
    },
    monthly_listeners: {
      type: Number,
      default: 0,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Some artists might not have user accounts
    },
    social_links: {
      twitter: String,
      youtube: String,
      website: String,
      musicPlatform: String,
      socialPlatform: String,
    },
    is_featured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "banned"],
      default: "active",
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
artistSchema.index({ name: "text" });
artistSchema.index({ genres: 1 });
artistSchema.index({ follower_count: -1 });
artistSchema.index({ verified: 1 });
artistSchema.index({ is_featured: 1 });
artistSchema.index({ status: 1 });

export const Artist =
  mongoose.models.Artist || mongoose.model("Artist", artistSchema);
export default Artist;
