import mongoose from "mongoose";

// Chat Schema
const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: String,
        required: true,
      },
    ],
    type: {
      type: String,
      enum: ["direct", "group", "ai"],
      default: "direct",
    },
    name: {
      type: String,
    },
    avatar: {
      type: String,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
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
chatSchema.index({ participants: 1 });
chatSchema.index({ updated_at: -1 });
chatSchema.index({ type: 1 });

export const Chat = mongoose.models.Chat || mongoose.model("Chat", chatSchema);
export default Chat;
