import mongoose from "mongoose";

const voiceRoomSchema = new mongoose.Schema(
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
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    moderators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["speaker", "listener"],
          default: "listener",
        },
        is_muted: {
          type: Boolean,
          default: false,
        },
        joined_at: {
          type: Date,
          default: Date.now,
        },
        speaking_time: {
          type: Number, // Total speaking time in seconds
          default: 0,
        },
      },
    ],
    max_participants: {
      type: Number,
      default: 50,
    },
    is_public: {
      type: Boolean,
      default: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    room_type: {
      type: String,
      enum: ["open", "moderated", "private"],
      default: "open",
    },
    current_topic: {
      type: String,
      default: "",
    },
    scheduled_for: {
      type: Date,
    },
    ended_at: {
      type: Date,
    },
    total_duration: {
      type: Number, // Total duration in seconds
      default: 0,
    },
    peak_participants: {
      type: Number,
      default: 0,
    },
    tags: [String],
    recording_enabled: {
      type: Boolean,
      default: false,
    },
    recording_url: {
      type: String,
      default: "",
    },
    settings: {
      allow_requests: {
        type: Boolean,
        default: true,
      },
      auto_approve_speakers: {
        type: Boolean,
        default: false,
      },
      max_speaking_time: {
        type: Number, // Max speaking time per user in seconds
        default: 300, // 5 minutes
      },
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
voiceRoomSchema.index({ name: "text", host: 1 });
voiceRoomSchema.index({ is_public: 1, is_active: 1 });
voiceRoomSchema.index({ room_type: 1 });
voiceRoomSchema.index({ scheduled_for: 1 });
voiceRoomSchema.index({ created_at: -1 });
voiceRoomSchema.index({ "participants.user": 1 });

// Virtual for current participant count
voiceRoomSchema.virtual("current_participants").get(function () {
  return this.participants.length;
});

export const VoiceRoom =
  mongoose.models.VoiceRoom || mongoose.model("VoiceRoom", voiceRoomSchema);
export default VoiceRoom;
