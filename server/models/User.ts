import mongoose from "mongoose";

// User Schema
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: false, // Not required for social logins
    },
    name: {
      type: String,
      required: true,
    },
    display_name: {
      type: String,
      default: function () {
        return this.name;
      },
    },
    profile_image_url: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
    },
    dob: {
      type: Date,
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
    email_verified: {
      type: Boolean,
      default: false,
    },
    is_artist: {
      type: Boolean,
      default: false,
    },
    follower_count: {
      type: Number,
      default: 0,
    },
    following_count: {
      type: Number,
      default: 0,
    },
    last_login: {
      type: Date,
    },
    provider: {
      type: String,
      default: "email",
      enum: ["email", "phone", "google", "facebook"],
    },
    is_admin: {
      type: Boolean,
      default: false,
    },
    is_banned: {
      type: Boolean,
      default: false,
    },
    ban_reason: {
      type: String,
    },
    phone: {
      type: String,
    },
    google_id: {
      type: String,
    },
    facebook_id: {
      type: String,
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
userSchema.index({ google_id: 1 });
userSchema.index({ facebook_id: 1 });
userSchema.index({ created_at: -1 });

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Generate user ID in the same format as existing system
userSchema.pre("save", function (next) {
  if (this.isNew && !this.id) {
    this.set("_id", new mongoose.Types.ObjectId());
  }
  next();
});

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
