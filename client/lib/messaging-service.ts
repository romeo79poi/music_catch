import { useEffect, useState, useCallback } from "react";
import { useFirebase } from "../context/FirebaseContext";

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: "text" | "image" | "voice" | "video" | "sticker" | "gif";
  timestamp: Date;
  isRead: boolean;
  reactions?: Array<{
    emoji: string;
    userId: string;
  }>;
  replyTo?: string;
  isForwarded?: boolean;
  isDisappearing?: boolean;
  metadata?: any;
}

export interface Chat {
  id: string;
  participants: string[];
  type: "direct" | "group" | "ai";
  name?: string;
  avatar?: string;
  lastMessage?: Message;
  updatedAt: Date;
  isArchived: boolean;
  isPinned: boolean;
  unreadCount?: number;
  isOnline?: boolean;
  isTyping?: boolean;
  isVerified?: boolean;
  lastSeen?: string;
  groupMembers?: number;
}

class FirebaseMessagingService {
  private baseUrl = "/api/messages";
  private fallbackToMock = true; // Use mock data for now

  constructor() {
    console.log("🔥 Firebase Messaging Service initialized");
  }

  // Get current user ID from Firebase auth or fallback
  private getCurrentUserId(firebaseUser?: any): string {
    if (firebaseUser?.uid) {
      return firebaseUser.uid;
    }
    // Check localStorage for user
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        return userData.id || userData.uid || "user";
      } catch (e) {
        console.warn("Failed to parse stored user data");
      }
    }
    return "user"; // Fallback for demo
  }

  // Mock data methods for immediate functionality
  private getMockChats(userId: string): Chat[] {
    return [
      {
        id: "ai-chat",
        participants: [userId, "ai"],
        type: "ai",
        name: "AI Assistant",
        avatar: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=100&h=100&fit=crop&crop=face",
        updatedAt: new Date(),
        isArchived: false,
        isPinned: true,
        isOnline: true,
        isVerified: true,
        lastSeen: "Always active",
        unreadCount: 0,
        lastMessage: {
          id: "ai-1",
          chatId: "ai-chat",
          senderId: "ai",
          content: "Hi! I'm your AI music assistant. How can I help you discover new music today?",
          type: "text",
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          isRead: false,
        }
      },
      {
        id: "chat-1",
        participants: [userId, "priya"],
        type: "direct",
        name: "Priya Sharma",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=100&h=100&fit=crop&crop=face",
        updatedAt: new Date(Date.now() - 1000 * 60 * 30),
        isArchived: false,
        isPinned: false,
        isOnline: true,
        isVerified: true,
        lastSeen: "Active now",
        unreadCount: 2,
        lastMessage: {
          id: "msg-1",
          chatId: "chat-1",
          senderId: "priya",
          content: "That new album is incredible! Have you listened to it yet? 🎵",
          type: "text",
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          isRead: false,
        }
      },
      {
        id: "chat-2",
        participants: [userId, "alex"],
        type: "direct",
        name: "Alex Johnson",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        isArchived: false,
        isPinned: false,
        isOnline: false,
        isVerified: false,
        lastSeen: "Last seen 2 hours ago",
        unreadCount: 0,
        lastMessage: {
          id: "msg-2",
          chatId: "chat-2",
          senderId: userId,
          content: "See you at the concert! 🎤",
          type: "text",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          isRead: true,
        }
      },
      {
        id: "group-1",
        participants: [userId, "sara", "mike", "jenny"],
        type: "group",
        name: "Music Lovers 🎶",
        avatar: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop",
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
        isArchived: false,
        isPinned: false,
        isOnline: true,
        isVerified: false,
        lastSeen: "Active now",
        unreadCount: 1,
        groupMembers: 4,
        lastMessage: {
          id: "msg-group-1",
          chatId: "group-1",
          senderId: "sara",
          content: "Who's going to the festival this weekend?",
          type: "text",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
          isRead: false,
        }
      },
      {
        id: "chat-3",
        participants: [userId, "maya"],
        type: "direct",
        name: "Maya Patel",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
        isArchived: false,
        isPinned: false,
        isOnline: false,
        isVerified: true,
        lastSeen: "Last seen 6 hours ago",
        unreadCount: 0,
        lastMessage: {
          id: "msg-3",
          chatId: "chat-3",
          senderId: "maya",
          content: "Thanks for the playlist recommendation! 😊",
          type: "text",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
          isRead: true,
        }
      }
    ];
  }

  private getMockMessages(chatId: string): Message[] {
    const mockMessages: { [key: string]: Message[] } = {
      "ai-chat": [
        {
          id: "ai-1",
          chatId: "ai-chat",
          senderId: "ai",
          content: "Hi! I'm your AI music assistant. I can help you discover new music, create playlists, and chat about anything music-related! What would you like to know?",
          type: "text",
          timestamp: new Date(Date.now() - 1000 * 60 * 10),
          isRead: false,
        },
        {
          id: "ai-2",
          chatId: "ai-chat",
          senderId: "user",
          content: "Can you recommend some good indie rock songs?",
          type: "text",
          timestamp: new Date(Date.now() - 1000 * 60 * 8),
          isRead: true,
        },
        {
          id: "ai-3",
          chatId: "ai-chat",
          senderId: "ai",
          content: "Absolutely! I'd recommend checking out Arctic Monkeys, Tame Impala, and The Strokes. Would you like me to create a playlist for you? 🎵",
          type: "text",
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          isRead: false,
        }
      ],
      "chat-1": [
        {
          id: "msg-1",
          chatId: "chat-1",
          senderId: "priya",
          content: "Hey! Did you listen to that new track I sent you?",
          type: "text",
          timestamp: new Date(Date.now() - 1000 * 60 * 60),
          isRead: true,
        },
        {
          id: "msg-2",
          chatId: "chat-1",
          senderId: "user",
          content: "Yes! It's amazing. The beat is so catchy 🎵",
          type: "text",
          timestamp: new Date(Date.now() - 1000 * 60 * 50),
          isRead: true,
          reactions: [{ emoji: "❤️", userId: "priya" }]
        },
        {
          id: "msg-3",
          chatId: "chat-1",
          senderId: "priya",
          content: "That new album is incredible! Have you listened to it yet? 🎵",
          type: "text",
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          isRead: false,
        }
      ],
      "chat-2": [
        {
          id: "msg-4",
          chatId: "chat-2",
          senderId: "alex",
          content: "Are you going to the concert next week?",
          type: "text",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
          isRead: true,
        },
        {
          id: "msg-5",
          chatId: "chat-2",
          senderId: "user",
          content: "See you at the concert! 🎤",
          type: "text",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          isRead: true,
        }
      ],
      "group-1": [
        {
          id: "group-msg-1",
          chatId: "group-1",
          senderId: "sara",
          content: "Hey everyone! Who's excited for the music festival?",
          type: "text",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
          isRead: true,
        },
        {
          id: "group-msg-2",
          chatId: "group-1",
          senderId: "mike",
          content: "I can't wait! The lineup looks amazing 🎉",
          type: "text",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4.5),
          isRead: true,
        },
        {
          id: "group-msg-3",
          chatId: "group-1",
          senderId: "sara",
          content: "Who's going to the festival this weekend?",
          type: "text",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
          isRead: false,
        }
      ],
      "chat-3": [
        {
          id: "msg-maya-1",
          chatId: "chat-3",
          senderId: "user",
          content: "Check out this playlist I made for you!",
          type: "text",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 7),
          isRead: true,
        },
        {
          id: "msg-maya-2",
          chatId: "chat-3",
          senderId: "maya",
          content: "Thanks for the playlist recommendation! 😊",
          type: "text",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
          isRead: true,
        }
      ]
    };

    return mockMessages[chatId] || [];
  }

  private createMockMessage(
    chatId: string,
    senderId: string,
    content: string,
    type: string = "text"
  ): Message {
    return {
      id: `mock-${Date.now()}`,
      chatId,
      senderId,
      content,
      type: type as any,
      timestamp: new Date(),
      isRead: false,
      reactions: [],
      isForwarded: false,
      isDisappearing: false,
      metadata: {},
    };
  }

  // Public API methods
  async getChats(firebaseUser?: any): Promise<Chat[]> {
    const userId = this.getCurrentUserId(firebaseUser);
    
    console.log("🔥 Getting chats for user:", userId);
    
    if (this.fallbackToMock) {
      return this.getMockChats(userId);
    }

    try {
      const response = await fetch(`${this.baseUrl}/chats/${userId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        return data.data.map((chat: any) => ({
          ...chat,
          updatedAt: new Date(chat.updatedAt),
          lastMessage: chat.lastMessage ? {
            ...chat.lastMessage,
            timestamp: new Date(chat.lastMessage.timestamp)
          } : undefined,
        }));
      }
      return this.getMockChats(userId);
    } catch (error) {
      console.error("Failed to get chats from API, using mock data:", error);
      return this.getMockChats(userId);
    }
  }

  async getChatMessages(chatId: string): Promise<Message[]> {
    console.log("🔥 Getting messages for chat:", chatId);
    
    if (this.fallbackToMock) {
      return this.getMockMessages(chatId);
    }

    try {
      const response = await fetch(`${this.baseUrl}/${chatId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        return data.data.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
      return this.getMockMessages(chatId);
    } catch (error) {
      console.error("Failed to get messages from API, using mock data:", error);
      return this.getMockMessages(chatId);
    }
  }

  async sendMessage(
    chatId: string,
    content: string,
    type: string = "text",
    metadata?: any,
    firebaseUser?: any
  ): Promise<Message | null> {
    const senderId = this.getCurrentUserId(firebaseUser);
    
    console.log("🔥 Sending message:", { chatId, senderId, content, type });

    // For mock mode, immediately return the message
    if (this.fallbackToMock) {
      return this.createMockMessage(chatId, senderId, content, type);
    }

    try {
      const response = await fetch(`${this.baseUrl}/${chatId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId, content, type, metadata }),
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        return {
          ...data.data,
          timestamp: new Date(data.data.timestamp)
        };
      }
      
      // Fallback to mock message
      return this.createMockMessage(chatId, senderId, content, type);
    } catch (error) {
      console.error("Failed to send message via API, using mock:", error);
      return this.createMockMessage(chatId, senderId, content, type);
    }
  }

  async markAsRead(chatId: string): Promise<boolean> {
    if (this.fallbackToMock) {
      console.log("🔥 Mock: Marking chat as read:", chatId);
      return true;
    }

    try {
      const response = await fetch(`${this.baseUrl}/${chatId}/read`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "user" }),
      });
      return response.ok;
    } catch (error) {
      console.error("Failed to mark as read:", error);
      return false;
    }
  }

  async addReaction(messageId: string, emoji: string): Promise<boolean> {
    if (this.fallbackToMock) {
      console.log("🔥 Mock: Adding reaction:", { messageId, emoji });
      return true;
    }

    try {
      const response = await fetch(`${this.baseUrl}/reaction/${messageId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji, userId: "user" }),
      });
      return response.ok;
    } catch (error) {
      console.error("Failed to add reaction:", error);
      return false;
    }
  }

  async setTyping(chatId: string, isTyping: boolean): Promise<boolean> {
    if (this.fallbackToMock) {
      console.log("🔥 Mock: Setting typing:", { chatId, isTyping });
      return true;
    }

    try {
      const response = await fetch(`${this.baseUrl}/${chatId}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTyping, userId: "user" }),
      });
      return response.ok;
    } catch (error) {
      console.error("Failed to set typing:", error);
      return false;
    }
  }

  async getTypingUsers(chatId: string): Promise<string[]> {
    if (this.fallbackToMock) {
      // Randomly show typing for demo
      return Math.random() > 0.9 ? ["priya"] : [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/${chatId}/typing`);
      const data = await response.json();
      return data.typingUsers || [];
    } catch (error) {
      console.error("Failed to get typing users:", error);
      return [];
    }
  }
}

// Singleton instance
export const messagingService = new FirebaseMessagingService();

// React hook for real-time messaging with Firebase integration
export const useMessaging = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get Firebase user if available
  let firebaseUser = null;
  try {
    const firebase = useFirebase();
    firebaseUser = firebase.user;
  } catch (e) {
    // Firebase context not available, use fallback
    console.log("🔥 Firebase context not available, using fallback");
  }

  const refreshChats = useCallback(async () => {
    try {
      setError(null);
      const updatedChats = await messagingService.getChats(firebaseUser);
      setChats(updatedChats);
      console.log("🔥 Chats loaded:", updatedChats.length);
    } catch (err) {
      console.error("Error refreshing chats:", err);
      setError("Failed to load chats");
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    refreshChats();
    
    // Refresh every 10 seconds for real-time updates (reduce frequency for better performance)
    const interval = setInterval(refreshChats, 10000);
    
    return () => clearInterval(interval);
  }, [refreshChats]);

  return {
    chats,
    loading,
    error,
    refreshChats,
    messagingService,
  };
};

// React hook for individual chat with Firebase integration
export const useChat = (chatId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Get Firebase user if available
  let firebaseUser = null;
  try {
    const firebase = useFirebase();
    firebaseUser = firebase.user;
  } catch (e) {
    // Firebase context not available, use fallback
    console.log("🔥 Firebase context not available for chat, using fallback");
  }

  const refreshMessages = useCallback(async () => {
    if (!chatId) return;

    try {
      setError(null);
      const updatedMessages = await messagingService.getChatMessages(chatId);
      setMessages(updatedMessages);
      console.log("🔥 Messages loaded for chat:", chatId, "count:", updatedMessages.length);
      
      // Mark messages as read
      await messagingService.markAsRead(chatId);
    } catch (err) {
      console.error("Error refreshing messages:", err);
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  const refreshTyping = useCallback(async () => {
    if (!chatId) return;

    try {
      const users = await messagingService.getTypingUsers(chatId);
      setTypingUsers(users.filter((user) => user !== "user" && user !== firebaseUser?.uid));
    } catch (err) {
      console.error("Error refreshing typing:", err);
    }
  }, [chatId, firebaseUser?.uid]);

  useEffect(() => {
    if (!chatId) return;

    refreshMessages();
    
    // Refresh every 3 seconds for real-time updates
    const interval = setInterval(() => {
      refreshMessages();
      refreshTyping();
    }, 3000);

    return () => clearInterval(interval);
  }, [chatId, refreshMessages, refreshTyping]);

  const sendMessage = async (
    content: string,
    type: string = "text",
    metadata?: any
  ) => {
    try {
      const message = await messagingService.sendMessage(
        chatId,
        content,
        type,
        metadata,
        firebaseUser
      );
      
      if (message) {
        setMessages((prev) => [...prev, message]);
        console.log("🔥 Message sent successfully:", message);
        return message;
      }
      throw new Error("Failed to send message");
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
      return null;
    }
  };

  const setTyping = async (isTyping: boolean) => {
    try {
      await messagingService.setTyping(chatId, isTyping);
    } catch (err) {
      console.error("Error setting typing:", err);
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      await messagingService.addReaction(messageId, emoji);
      refreshMessages(); // Refresh to show updated reactions
      console.log("🔥 Reaction added:", { messageId, emoji });
    } catch (err) {
      console.error("Error adding reaction:", err);
      setError("Failed to add reaction");
    }
  };

  return {
    messages,
    loading,
    typingUsers,
    error,
    sendMessage,
    setTyping,
    addReaction,
    refreshMessages,
  };
};
