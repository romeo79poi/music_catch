import mongoose from "mongoose";

const userLikesSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    item_type: {
      type: String,
      enum: ["song", "album", "playlist", "artist"],
      required: true,
    },
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
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

// Compound indexes for efficient queries
userLikesSchema.index({ user: 1, item_type: 1 });
userLikesSchema.index({ user: 1, item_id: 1 }, { unique: true });
userLikesSchema.index({ item_type: 1, item_id: 1 });
userLikesSchema.index({ created_at: -1 });

export const UserLikes =
  mongoose.models.UserLikes || mongoose.model("UserLikes", userLikesSchema);
export default UserLikes;
