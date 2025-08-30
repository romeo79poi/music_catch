import mongoose from "mongoose";

const userFollowsSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    follow_type: {
      type: String,
      enum: ["user", "artist"],
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

// Compound indexes for efficient queries
userFollowsSchema.index({ follower: 1, following: 1 }, { unique: true });
userFollowsSchema.index({ follower: 1, follow_type: 1 });
userFollowsSchema.index({ following: 1, follow_type: 1 });
userFollowsSchema.index({ created_at: -1 });

export const UserFollows =
  mongoose.models.UserFollows ||
  mongoose.model("UserFollows", userFollowsSchema);
export default UserFollows;
