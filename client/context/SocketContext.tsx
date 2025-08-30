import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
  sendMessage: (chatId: string, content: string, recipientId: string) => void;
  joinMusicParty: (partyId: string) => void;
  syncNowPlaying: (songData: {
    songId: string;
    title: string;
    artist: string;
    timestamp: number;
    isPlaying: boolean;
  }) => void;
  updateActivity: (activity: {
    type: "listening" | "browsing" | "creating";
    details: string;
  }) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  // Try to get auth context - will be null if not available
  const authContext = React.useContext(require("./AuthContext").AuthContext);
  const user = authContext?.user || null;
  const token = authContext?.token || null;

  useEffect(() => {
    if (user && token) {
      // Connect to Socket.IO server
      const newSocket = io(window.location.origin, {
        auth: {
          token: token,
        },
      });

      newSocket.on("connect", () => {
        console.log("🔌 Connected to server");
        setIsConnected(true);
      });

      newSocket.on("disconnect", () => {
        console.log("🔌 Disconnected from server");
        setIsConnected(false);
      });

      newSocket.on("connect_error", (error) => {
        console.error("🔌 Connection error:", error);
        setIsConnected(false);
      });

      // Listen for friend activity
      newSocket.on("friend:now-playing", (data) => {
        console.log("🎵 Friend now playing:", data);
        // You can dispatch this to a friends activity context
      });

      newSocket.on("friend:activity", (data) => {
        console.log("👥 Friend activity:", data);
        // Update friends activity UI
      });

      // Listen for messages
      newSocket.on("message:receive", (data) => {
        console.log("💬 Message received:", data);
        // Dispatch to messages context or show notification
      });

      newSocket.on("message:typing", (data) => {
        console.log("⌨️ User typing:", data);
        // Show typing indicator
      });

      // Listen for party events
      newSocket.on("party:user-joined", (data) => {
        console.log("🎉 User joined party:", data);
      });

      newSocket.on("party:sync", (data) => {
        console.log("🎵 Party sync:", data);
        // Sync music playback
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user, token]);

  const sendMessage = (
    chatId: string,
    content: string,
    recipientId: string,
  ) => {
    if (socket) {
      socket.emit("message:send", { chatId, content, recipientId });
    }
  };

  const joinMusicParty = (partyId: string) => {
    if (socket) {
      socket.emit("music:join-party", partyId);
    }
  };

  const syncNowPlaying = (songData: {
    songId: string;
    title: string;
    artist: string;
    timestamp: number;
    isPlaying: boolean;
  }) => {
    if (socket) {
      socket.emit("music:now-playing", songData);
    }
  };

  const updateActivity = (activity: {
    type: "listening" | "browsing" | "creating";
    details: string;
  }) => {
    if (socket) {
      socket.emit("activity:update", activity);
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    onlineUsers,
    sendMessage,
    joinMusicParty,
    syncNowPlaying,
    updateActivity,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
