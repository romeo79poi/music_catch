import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Send,
  MoreHorizontal,
  Phone,
  Video,
  Image,
  Smile,
  Paperclip,
  User,
  Check,
  CheckCheck,
  Circle,
  MessageCircle,
  Plus,
  Edit3,
  Camera,
  Mic,
  X,
  Heart,
  Reply,
  Forward,
  Info,
  UserPlus,
  Users,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import MobileFooter from "../components/MobileFooter";
import { useAuth } from "../context/AuthContext";
import { fetchUserData } from "../lib/auth";
import { useFirebase } from "../context/FirebaseContext";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: Date;
  type: "text" | "image" | "voice" | "emoji";
  status: "sending" | "sent" | "delivered" | "read";
  replyTo?: string;
  edited?: boolean;
  reactions?: { emoji: string; userId: string; userName: string }[];
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  participantUsername: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
  lastSeen?: Date;
  isTyping?: boolean;
  isGroup?: boolean;
  groupName?: string;
  groupAvatar?: string;
  participants?: string[];
}

// Sample conversations data
const sampleConversations: Conversation[] = [
  {
    id: "conv1",
    participantId: "user1",
    participantName: "Emma Watson",
    participantAvatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b1bb?w=150&h=150&fit=crop&crop=face",
    participantUsername: "emmawatson",
    lastMessage: "Hey! How are you doing? 😊",
    lastMessageTime: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: "conv2",
    participantId: "user2",
    participantName: "John Doe",
    participantAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    participantUsername: "johndoe",
    lastMessage: "Thanks for the music recommendation!",
    lastMessageTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    unreadCount: 0,
    isOnline: false,
    lastSeen: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    id: "conv3",
    participantId: "user3",
    participantName: "Sarah Johnson",
    participantAvatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    participantUsername: "sarahjohnson",
    lastMessage: "Can't wait for the concert! 🎵",
    lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    unreadCount: 1,
    isOnline: true,
  },
];

// Sample messages for active conversation
const sampleMessages: Message[] = [
  {
    id: "msg1",
    senderId: "user1",
    senderName: "Emma Watson",
    senderAvatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b1bb?w=150&h=150&fit=crop&crop=face",
    content: "Hey! How are you doing? 😊",
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    type: "text",
    status: "read",
  },
  {
    id: "msg2",
    senderId: "currentUser",
    senderName: "You",
    senderAvatar: "",
    content:
      "Hi Emma! I'm good, thanks for asking. Just listening to some new music 🎵",
    timestamp: new Date(Date.now() - 3 * 60 * 1000),
    type: "text",
    status: "read",
  },
  {
    id: "msg3",
    senderId: "user1",
    senderName: "Emma Watson",
    senderAvatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b1bb?w=150&h=150&fit=crop&crop=face",
    content: "That's awesome! What genre are you into lately?",
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    type: "text",
    status: "delivered",
  },
];

export default function Messages() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user: firebaseUser } = useFirebase();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // State management
  const [conversations, setConversations] =
    useState<Conversation[]>(sampleConversations);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<any>(null);

  // Check if navigated from profile with specific user
  const profileUser = location.state?.profileUser;

  useEffect(() => {
    // Load current user data
    const loadUserData = async () => {
      const localUserData = localStorage.getItem("currentUser");
      if (localUserData) {
        try {
          const userData = JSON.parse(localUserData);
          setCurrentUserData(userData);
        } catch (error) {
          console.warn("Failed to parse user data:", error);
        }
      }
    };

    loadUserData();

    // If coming from profile, start conversation with that user
    if (profileUser) {
      const existingConv = conversations.find(
        (conv) => conv.participantId === profileUser.id,
      );
      if (existingConv) {
        setActiveConversation(existingConv);
        setMessages(sampleMessages);
      } else {
        // Create new conversation
        const newConv: Conversation = {
          id: `conv_${Date.now()}`,
          participantId: profileUser.id,
          participantName: profileUser.displayName,
          participantAvatar: profileUser.avatar,
          participantUsername: profileUser.username,
          lastMessage: "",
          lastMessageTime: new Date(),
          unreadCount: 0,
          isOnline: Math.random() > 0.5, // Random online status
        };
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversation(newConv);
        setMessages([]);
      }
    }
  }, [profileUser, conversations]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeConversation) return;

    const message: Message = {
      id: `msg_${Date.now()}`,
      senderId: "currentUser",
      senderName: currentUserData?.name || "You",
      senderAvatar: currentUserData?.profileImageURL || "",
      content: newMessage,
      timestamp: new Date(),
      type: "text",
      status: "sending",
    };

    setMessages((prev) => [...prev, message]);

    // Update conversation last message
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConversation.id
          ? { ...conv, lastMessage: newMessage, lastMessageTime: new Date() }
          : conv,
      ),
    );

    setNewMessage("");

    // Simulate message sent
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === message.id ? { ...msg, status: "sent" as const } : msg,
        ),
      );
    }, 1000);

    // Simulate delivery
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === message.id
            ? { ...msg, status: "delivered" as const }
            : msg,
        ),
      );
    }, 2000);
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setActiveConversation(conversation);

    // Mark conversation as read
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv,
      ),
    );

    // Load messages for this conversation
    if (conversation.id === "conv1") {
      setMessages(sampleMessages);
    } else {
      setMessages([]);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getMessageStatusIcon = (status: Message["status"]) => {
    switch (status) {
      case "sending":
        return <Circle className="w-3 h-3 text-gray-400" />;
      case "sent":
        return <Check className="w-3 h-3 text-gray-400" />;
      case "delivered":
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case "read":
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.participantUsername
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  // Show conversation list if no active conversation
  if (!activeConversation) {
    return (
      <div className="h-screen bg-background text-foreground relative overflow-hidden theme-transition max-w-sm mx-auto">
        <div className="fixed inset-0 bg-gradient-to-b from-background to-secondary/30 theme-transition"></div>

        <div className="relative z-10 flex flex-col h-screen">
          {/* Header */}
          <motion.header
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border theme-transition"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </motion.button>

            <h1 className="text-lg font-bold text-foreground">Messages</h1>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/discover")}
              className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors"
            >
              <Plus className="w-5 h-5 text-primary-foreground" />
            </motion.button>
          </motion.header>

          {/* Search */}
          <div className="px-4 py-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-muted rounded-full text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto pb-20">
            <AnimatePresence>
              {filteredConversations.map((conversation, index) => (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleConversationSelect(conversation)}
                  className="flex items-center space-x-3 p-4 cursor-pointer transition-colors border-b border-border/50 last:border-b-0"
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={
                        conversation.participantAvatar ||
                        `https://via.placeholder.com/48?text=${conversation.participantName.charAt(0)}`
                      }
                      alt={conversation.participantName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-background"
                    />
                    {conversation.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                    )}
                    {conversation.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-primary-foreground">
                          {conversation.unreadCount > 9
                            ? "9+"
                            : conversation.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Conversation Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {conversation.participantName}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {formatLastSeen(conversation.lastMessageTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate flex-1">
                        {conversation.isTyping ? (
                          <span className="text-primary">typing...</span>
                        ) : (
                          conversation.lastMessage || "Start a conversation"
                        )}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <div className="w-2 h-2 bg-primary rounded-full ml-2"></div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredConversations.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchQuery ? "No conversations found" : "No messages yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? "Try searching for a different name or username"
                    : "Start a conversation with someone new"}
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/discover")}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium"
                >
                  Discover People
                </motion.button>
              </div>
            )}
          </div>
        </div>

        <MobileFooter />
      </div>
    );
  }

  // Show active chat interface
  return (
    <div className="h-screen bg-background text-foreground relative overflow-hidden theme-transition max-w-sm mx-auto">
      <div className="fixed inset-0 bg-gradient-to-b from-background to-secondary/30 theme-transition"></div>

      <div className="relative z-10 flex flex-col h-screen">
        {/* Chat Header */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border theme-transition"
        >
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveConversation(null)}
              className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </motion.button>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src={
                    activeConversation.participantAvatar ||
                    `https://via.placeholder.com/40?text=${activeConversation.participantName.charAt(0)}`
                  }
                  alt={activeConversation.participantName}
                  className="w-10 h-10 rounded-full object-cover border border-border"
                />
                {activeConversation.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-background"></div>
                )}
              </div>

              <div>
                <h2 className="font-semibold text-foreground">
                  {activeConversation.participantName}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {activeConversation.isOnline
                    ? activeConversation.isTyping
                      ? "typing..."
                      : "online"
                    : `last seen ${formatLastSeen(activeConversation.lastSeen || new Date())}`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
            >
              <Phone className="w-4 h-4 text-foreground" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
            >
              <Video className="w-4 h-4 text-foreground" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
            >
              <Info className="w-4 h-4 text-foreground" />
            </motion.button>
          </div>
        </motion.header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-2 pb-24">
          <AnimatePresence>
            {messages.map((message, index) => {
              const isCurrentUser = message.senderId === "currentUser";
              const showAvatar =
                !isCurrentUser &&
                (index === 0 ||
                  messages[index - 1].senderId !== message.senderId);

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-end space-x-2 mb-4 ${
                    isCurrentUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Other user avatar */}
                  {!isCurrentUser && (
                    <div className="w-8 h-8 flex-shrink-0">
                      {showAvatar && (
                        <img
                          src={
                            message.senderAvatar ||
                            `https://via.placeholder.com/32?text=${message.senderName.charAt(0)}`
                          }
                          alt={message.senderName}
                          className="w-8 h-8 rounded-full object-cover border border-border"
                        />
                      )}
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`max-w-[70%] ${
                      isCurrentUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    } rounded-2xl px-4 py-2 relative`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>

                    {/* Message info */}
                    <div
                      className={`flex items-center space-x-1 mt-1 ${
                        isCurrentUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span
                        className={`text-xs ${
                          isCurrentUser
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </span>
                      {isCurrentUser && (
                        <div className="ml-1">
                          {getMessageStatusIcon(message.status)}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4">
          <div className="flex items-end space-x-3">
            <div className="flex-1 bg-muted rounded-full overflow-hidden">
              <div className="flex items-center px-4 py-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none"
                />

                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Paperclip className="w-4 h-4" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Smile className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={newMessage.trim() ? handleSendMessage : undefined}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                newMessage.trim()
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {newMessage.trim() ? (
                <Send className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
