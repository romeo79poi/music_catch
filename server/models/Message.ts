import mongoose from "mongoose";

// Message Schema
const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: String,
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "image", "voice", "video", "sticker", "gif"],
      default: "text",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    reactions: [
      {
        emoji: String,
        userId: String,
      },
    ],
    replyTo: {
      type: String,
      ref: "Message",
    },
    isForwarded: {
      type: Boolean,
      default: false,
    },
    isDisappearing: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: {
      createdAt: "timestamp",
      updatedAt: "updated_at",
    },
  },
);

// Indexes for better performance
messageSchema.index({ chatId: 1, timestamp: -1 });
messageSchema.index({ senderId: 1, timestamp: -1 });

export const Message =
  mongoose.models.Message || mongoose.model("Message", messageSchema);
export default Message;
