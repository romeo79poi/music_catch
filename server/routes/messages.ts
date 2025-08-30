import { Request, Response } from "express";
import { connectDB, isMongoConnected } from "../lib/mongodb";
import Chat from "../models/Chat";
import Message from "../models/Message";
import User from "../models/User";

// In-memory storage for typing status (in production, use Redis)
const typingUsers = new Map<string, Set<string>>();

// Import socket manager (will be available after server starts)
let socketManager: any = null;
if (process.env.NODE_ENV === "production") {
  try {
    // Dynamically import to avoid circular dependency
    import("../node-build").then((module) => {
      socketManager = module.socketManager;
    });
  } catch (error) {
    console.log("⚠️ SocketManager not available yet");
  }
}

// Initialize MongoDB connection
async function initConnection() {
  if (!isMongoConnected()) {
    const result = await connectDB();
    if (!result.success) {
      return false;
    }
  }
  return true;
}

// GET /api/messages/chats/:userId? - Get user's chat list
export async function getChats(req: Request, res: Response) {
  try {
    const connected = await initConnection();
    if (!connected) {
      return res.status(503).json({
        success: false,
        message: "Database not available",
      });
    }

    const userId = req.params.userId || (req as any).user?.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    console.log(`📬 Getting chats for user: ${userId}`);

    const chats = await Chat.find({
      participants: userId,
    })
      .populate({
        path: "participants",
        select: "username display_name profile_image_url last_login",
      })
      .populate({
        path: "lastMessage",
        select: "content type timestamp senderId",
        populate: {
          path: "senderId",
          select: "username display_name",
        },
      })
      .sort({ updatedAt: -1 })
      .limit(50);

    // Transform chats for frontend
    const transformedChats = chats.map((chat) => {
      const otherParticipants = chat.participants.filter(
        (p: any) => p._id.toString() !== userId,
      );

      return {
        id: chat._id,
        type: chat.type,
        participants: chat.participants,
        otherParticipants,
        lastMessage: chat.lastMessage,
        unreadCount: 0, // TODO: Implement unread count
        updatedAt: chat.updatedAt,
        createdAt: chat.createdAt,
      };
    });

    res.json({
      success: true,
      chats: transformedChats,
    });
  } catch (error: any) {
    console.error("❌ Error getting chats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

// GET /api/messages/:chatId - Get messages for a chat
export async function getChatMessages(req: Request, res: Response) {
  try {
    const connected = await initConnection();
    if (!connected) {
      return res.status(503).json({
        success: false,
        message: "Database not available",
      });
    }

    const { chatId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    console.log(`💬 Getting messages for chat: ${chatId}`);

    // Verify chat exists and user has access
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    const userId = (req as any).user?.userId;
    if (userId && !chat.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const messages = await Message.find({ chatId })
      .populate({
        path: "senderId",
        select: "username display_name profile_image_url",
      })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const totalMessages = await Message.countDocuments({ chatId });

    res.json({
      success: true,
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        total: totalMessages,
        pages: Math.ceil(totalMessages / limit),
        hasMore: skip + messages.length < totalMessages,
      },
    });
  } catch (error: any) {
    console.error("❌ Error getting messages:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

// POST /api/messages/:chatId - Send a message
export async function sendMessage(req: Request, res: Response) {
  try {
    const connected = await initConnection();
    if (!connected) {
      return res.status(503).json({
        success: false,
        message: "Database not available",
      });
    }

    const { chatId } = req.params;
    const { content, type = "text", recipientId } = req.body;
    const senderId = (req as any).user?.userId;

    if (!senderId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    console.log(`📤 Sending message to chat: ${chatId}`);

    // Verify chat exists
    let chat = await Chat.findById(chatId);
    if (!chat) {
      // Create new chat if it doesn't exist (for direct messages)
      if (recipientId) {
        chat = await Chat.create({
          participants: [senderId, recipientId],
          type: "direct",
        });
        console.log(`🆕 Created new chat: ${chat._id}`);
      } else {
        return res.status(404).json({
          success: false,
          message: "Chat not found",
        });
      }
    }

    // Verify user is participant
    if (!chat.participants.includes(senderId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Create message
    const message = await Message.create({
      chatId: chat._id,
      senderId,
      content: content.trim(),
      type,
      timestamp: new Date(),
    });

    // Update chat's last message
    chat.lastMessage = message._id;
    chat.updatedAt = new Date();
    await chat.save();

    // Populate sender info
    await message.populate({
      path: "senderId",
      select: "username display_name profile_image_url",
    });

    // Send real-time notification via Socket.IO
    if (socketManager) {
      const recipients = chat.participants.filter(
        (participantId: string) => participantId !== senderId,
      );

      recipients.forEach((recipientId: string) => {
        socketManager.sendToUser(recipientId, "message:receive", {
          chatId: chat._id,
          message: {
            id: message._id,
            content: message.content,
            type: message.type,
            senderId: message.senderId,
            timestamp: message.timestamp,
          },
        });
      });
    }

    res.status(201).json({
      success: true,
      message: {
        id: message._id,
        chatId: message.chatId,
        content: message.content,
        type: message.type,
        senderId: message.senderId,
        timestamp: message.timestamp,
      },
    });
  } catch (error: any) {
    console.error("❌ Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

// PUT /api/messages/:chatId/read - Mark messages as read
export async function markAsRead(req: Request, res: Response) {
  try {
    const connected = await initConnection();
    if (!connected) {
      return res.status(503).json({
        success: false,
        message: "Database not available",
      });
    }

    const { chatId } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // TODO: Implement read receipts
    // For now, just return success
    res.json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (error: any) {
    console.error("❌ Error marking as read:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

// POST /api/messages/reaction/:messageId - Add reaction to message
export async function addReaction(req: Request, res: Response) {
  try {
    const connected = await initConnection();
    if (!connected) {
      return res.status(503).json({
        success: false,
        message: "Database not available",
      });
    }

    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Initialize reactions if not exists
    if (!message.reactions) {
      message.reactions = new Map();
    }

    // Toggle reaction
    const currentReaction = message.reactions.get(emoji) || [];
    const userIndex = currentReaction.indexOf(userId);

    if (userIndex > -1) {
      // Remove reaction
      currentReaction.splice(userIndex, 1);
      if (currentReaction.length === 0) {
        message.reactions.delete(emoji);
      } else {
        message.reactions.set(emoji, currentReaction);
      }
    } else {
      // Add reaction
      currentReaction.push(userId);
      message.reactions.set(emoji, currentReaction);
    }

    await message.save();

    res.json({
      success: true,
      reactions: Object.fromEntries(message.reactions),
    });
  } catch (error: any) {
    console.error("❌ Error adding reaction:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

// POST /api/messages/:chatId/typing - Set typing status
export async function setTyping(req: Request, res: Response) {
  try {
    const { chatId } = req.params;
    const { isTyping = true } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!typingUsers.has(chatId)) {
      typingUsers.set(chatId, new Set());
    }

    const chatTypingUsers = typingUsers.get(chatId)!;

    if (isTyping) {
      chatTypingUsers.add(userId);
    } else {
      chatTypingUsers.delete(userId);
    }

    // Clean up empty sets
    if (chatTypingUsers.size === 0) {
      typingUsers.delete(chatId);
    }

    // Send real-time typing notification
    if (socketManager) {
      socketManager.sendToRoom(`chat:${chatId}`, "message:typing", {
        chatId,
        userId,
        isTyping,
        typingUsers: Array.from(chatTypingUsers),
      });
    }

    res.json({
      success: true,
      typingUsers: Array.from(chatTypingUsers),
    });
  } catch (error: any) {
    console.error("❌ Error setting typing status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

// GET /api/messages/:chatId/typing - Get typing users
export async function getTypingUsers(req: Request, res: Response) {
  try {
    const { chatId } = req.params;
    const typingUsersList = typingUsers.get(chatId) || new Set();

    res.json({
      success: true,
      typingUsers: Array.from(typingUsersList),
    });
  } catch (error: any) {
    console.error("❌ Error getting typing users:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

// POST /api/messages/chats - Create new chat
export async function createChat(req: Request, res: Response) {
  try {
    const connected = await initConnection();
    if (!connected) {
      return res.status(503).json({
        success: false,
        message: "Database not available",
      });
    }

    const { participantIds, type = "direct", name } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!participantIds || !Array.isArray(participantIds)) {
      return res.status(400).json({
        success: false,
        message: "Participant IDs are required",
      });
    }

    // Add current user to participants
    const allParticipants = [...new Set([userId, ...participantIds])];

    // For direct chats, check if chat already exists
    if (type === "direct" && allParticipants.length === 2) {
      const existingChat = await Chat.findOne({
        type: "direct",
        participants: { $all: allParticipants, $size: 2 },
      });

      if (existingChat) {
        return res.json({
          success: true,
          chat: {
            id: existingChat._id,
            type: existingChat.type,
            participants: existingChat.participants,
            createdAt: existingChat.createdAt,
            message: "Chat already exists",
          },
        });
      }
    }

    const chat = await Chat.create({
      participants: allParticipants,
      type,
      name,
    });

    await chat.populate({
      path: "participants",
      select: "username display_name profile_image_url",
    });

    res.status(201).json({
      success: true,
      chat: {
        id: chat._id,
        type: chat.type,
        name: chat.name,
        participants: chat.participants,
        createdAt: chat.createdAt,
      },
    });
  } catch (error: any) {
    console.error("❌ Error creating chat:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

// DELETE /api/messages/message/:messageId - Delete message
export async function deleteMessage(req: Request, res: Response) {
  try {
    const connected = await initConnection();
    if (!connected) {
      return res.status(503).json({
        success: false,
        message: "Database not available",
      });
    }

    const { messageId } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Only sender can delete their message
    if (message.senderId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await Message.findByIdAndDelete(messageId);

    // Send real-time notification
    if (socketManager) {
      const chat = await Chat.findById(message.chatId);
      if (chat) {
        chat.participants.forEach((participantId: string) => {
          socketManager.sendToUser(participantId, "message:deleted", {
            messageId,
            chatId: message.chatId,
          });
        });
      }
    }

    res.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error deleting message:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
