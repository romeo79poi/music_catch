import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import VoiceRoom from "../models/VoiceRoom";
import { connectDB, isMongoConnected } from "./mongodb";

export interface SocketUser {
  userId: string;
  username: string;
  socketId: string;
  currentRoom?: string;
  voiceRoom?: string;
  lastSeen: Date;
}

export class EnhancedSocketManager {
  private io: SocketIOServer;
  private connectedUsers = new Map<string, SocketUser>();
  private userSockets = new Map<string, string>(); // userId -> socketId
  private voiceRooms = new Map<string, Set<string>>(); // roomId -> Set of userIds

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupVoiceStreamingHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error"));
      }

      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "fallback-secret",
        ) as any;

        socket.userId = decoded.userId;
        socket.username = decoded.username || decoded.email;
        next();
      } catch (err) {
        next(new Error("Authentication error"));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket) => {
      console.log(`🔌 User connected: ${socket.username} (${socket.userId})`);

      // Store user connection
      const user: SocketUser = {
        userId: socket.userId,
        username: socket.username,
        socketId: socket.id,
        lastSeen: new Date(),
      };

      this.connectedUsers.set(socket.id, user);
      this.userSockets.set(socket.userId, socket.id);

      // Join user's personal room
      socket.join(`user:${socket.userId}`);

      // Handle music sync events
      this.setupMusicEvents(socket);

      // Handle messaging events
      this.setupMessagingEvents(socket);

      // Handle friend activity events
      this.setupFriendActivityEvents(socket);

      // Handle voice room events
      this.setupVoiceRoomEvents(socket);

      // Handle disconnect
      socket.on("disconnect", () => {
        console.log(`🔌 User disconnected: ${socket.username}`);
        this.handleUserDisconnect(socket);
      });

      // Handle connection errors
      socket.on("error", (error) => {
        console.error(`🔌 Socket error for ${socket.username}:`, error);
      });

      // Send initial connection success
      socket.emit("connection:success", {
        userId: socket.userId,
        username: socket.username,
        timestamp: new Date(),
      });
    });
  }

  private setupMusicEvents(socket: any) {
    // Current song sync
    socket.on(
      "music:now-playing",
      (data: {
        songId: string;
        title: string;
        artist: string;
        timestamp: number;
        isPlaying: boolean;
        progress?: number;
      }) => {
        // Update user's current activity
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          user.lastSeen = new Date();
        }

        // Broadcast to friends (would need friends list from database)
        socket.broadcast.emit("friend:now-playing", {
          userId: socket.userId,
          username: socket.username,
          ...data,
          timestamp: new Date(),
        });
      },
    );

    // Listen party feature
    socket.on(
      "music:join-party",
      (data: { partyId: string; songId?: string }) => {
        socket.join(`party:${data.partyId}`);
        socket.to(`party:${data.partyId}`).emit("party:user-joined", {
          userId: socket.userId,
          username: socket.username,
          partyId: data.partyId,
        });
      },
    );

    socket.on("music:leave-party", (data: { partyId: string }) => {
      socket.leave(`party:${data.partyId}`);
      socket.to(`party:${data.partyId}`).emit("party:user-left", {
        userId: socket.userId,
        username: socket.username,
        partyId: data.partyId,
      });
    });

    socket.on("music:party-sync", (data: any) => {
      socket.to(`party:${data.partyId}`).emit("party:sync", {
        ...data,
        syncedBy: socket.userId,
        timestamp: new Date(),
      });
    });

    // Playlist collaboration
    socket.on("playlist:join", (data: { playlistId: string }) => {
      socket.join(`playlist:${data.playlistId}`);
    });

    socket.on(
      "playlist:update",
      (data: { playlistId: string; action: string; songId?: string }) => {
        socket.to(`playlist:${data.playlistId}`).emit("playlist:changed", {
          ...data,
          userId: socket.userId,
          timestamp: new Date(),
        });
      },
    );
  }

  private setupMessagingEvents(socket: any) {
    // Join chat rooms
    socket.on("chat:join", (data: { chatId: string }) => {
      socket.join(`chat:${data.chatId}`);
    });

    socket.on("chat:leave", (data: { chatId: string }) => {
      socket.leave(`chat:${data.chatId}`);
    });

    // Real-time messaging (complement to HTTP endpoints)
    socket.on(
      "message:send",
      (data: { chatId: string; content: string; type?: string }) => {
        // Emit to chat room
        socket.to(`chat:${data.chatId}`).emit("message:receive", {
          chatId: data.chatId,
          content: data.content,
          type: data.type || "text",
          senderId: socket.userId,
          senderUsername: socket.username,
          timestamp: new Date(),
          tempId: data.tempId, // For optimistic updates
        });
      },
    );

    // Typing indicators
    socket.on(
      "message:typing",
      (data: { chatId: string; isTyping: boolean }) => {
        socket.to(`chat:${data.chatId}`).emit("message:typing", {
          chatId: data.chatId,
          userId: socket.userId,
          username: socket.username,
          isTyping: data.isTyping,
        });
      },
    );

    // Message reactions
    socket.on(
      "message:reaction",
      (data: { messageId: string; emoji: string; chatId: string }) => {
        socket.to(`chat:${data.chatId}`).emit("message:reaction-added", {
          messageId: data.messageId,
          emoji: data.emoji,
          userId: socket.userId,
          timestamp: new Date(),
        });
      },
    );
  }

  private setupFriendActivityEvents(socket: any) {
    socket.on(
      "activity:update",
      (activity: {
        type: "listening" | "browsing" | "creating" | "voice_room";
        details: string;
        metadata?: any;
      }) => {
        // Update user activity
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          user.lastSeen = new Date();
        }

        // Broadcast to friends (would need friends list)
        socket.broadcast.emit("friend:activity", {
          userId: socket.userId,
          username: socket.username,
          activity,
          timestamp: new Date(),
        });
      },
    );

    // Friend requests and notifications
    socket.on("friend:request", (data: { targetUserId: string }) => {
      this.sendToUser(data.targetUserId, "friend:request-received", {
        fromUserId: socket.userId,
        fromUsername: socket.username,
        timestamp: new Date(),
      });
    });
  }

  private setupVoiceRoomEvents(socket: any) {
    // Join voice room lobby
    socket.on("voice:join-lobby", () => {
      socket.join("voice:lobby");
    });

    // Leave voice room lobby
    socket.on("voice:leave-lobby", () => {
      socket.leave("voice:lobby");
    });

    // Join specific voice room
    socket.on("voice:join-room", async (data: { roomId: string }) => {
      try {
        const room = await VoiceRoom.findById(data.roomId);
        if (!room || !room.is_active) {
          socket.emit("voice:error", { message: "Room not found or inactive" });
          return;
        }

        socket.join(`voice:${data.roomId}`);

        // Add to voice room tracking
        if (!this.voiceRooms.has(data.roomId)) {
          this.voiceRooms.set(data.roomId, new Set());
        }
        this.voiceRooms.get(data.roomId)!.add(socket.userId);

        // Update user's voice room
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          user.voiceRoom = data.roomId;
        }

        // Notify others in the room
        socket.to(`voice:${data.roomId}`).emit("voice:user-joined", {
          userId: socket.userId,
          username: socket.username,
          roomId: data.roomId,
          timestamp: new Date(),
        });

        console.log(`🎤 ${socket.username} joined voice room ${data.roomId}`);
      } catch (error) {
        console.error("Error joining voice room:", error);
        socket.emit("voice:error", { message: "Failed to join room" });
      }
    });

    // Leave voice room
    socket.on("voice:leave-room", (data: { roomId: string }) => {
      this.handleVoiceRoomLeave(socket, data.roomId);
    });

    // Voice streaming events
    socket.on("voice:start-speaking", (data: { roomId: string }) => {
      socket.to(`voice:${data.roomId}`).emit("voice:user-speaking", {
        userId: socket.userId,
        username: socket.username,
        speaking: true,
        timestamp: new Date(),
      });
    });

    socket.on("voice:stop-speaking", (data: { roomId: string }) => {
      socket.to(`voice:${data.roomId}`).emit("voice:user-speaking", {
        userId: socket.userId,
        username: socket.username,
        speaking: false,
        timestamp: new Date(),
      });
    });

    // Audio data for real-time streaming
    socket.on(
      "voice:audio-data",
      (data: { roomId: string; audioData: ArrayBuffer }) => {
        // Forward audio data to other participants
        socket.to(`voice:${data.roomId}`).emit("voice:audio-stream", {
          userId: socket.userId,
          audioData: data.audioData,
          timestamp: new Date(),
        });
      },
    );

    // Mute/unmute events
    socket.on("voice:mute", (data: { roomId: string; isMuted: boolean }) => {
      socket.to(`voice:${data.roomId}`).emit("voice:user-muted", {
        userId: socket.userId,
        username: socket.username,
        isMuted: data.isMuted,
        timestamp: new Date(),
      });
    });

    // Room settings updates
    socket.on("voice:room-update", (data: { roomId: string; updates: any }) => {
      socket.to(`voice:${data.roomId}`).emit("voice:room-updated", {
        roomId: data.roomId,
        updates: data.updates,
        updatedBy: socket.userId,
        timestamp: new Date(),
      });
    });
  }

  private setupVoiceStreamingHandlers() {
    // Handle WebRTC signaling for peer-to-peer voice
    this.io.on("connection", (socket) => {
      // WebRTC offer
      socket.on(
        "webrtc:offer",
        (data: { roomId: string; targetUserId: string; offer: any }) => {
          this.sendToUser(data.targetUserId, "webrtc:offer", {
            fromUserId: socket.userId,
            roomId: data.roomId,
            offer: data.offer,
          });
        },
      );

      // WebRTC answer
      socket.on(
        "webrtc:answer",
        (data: { roomId: string; targetUserId: string; answer: any }) => {
          this.sendToUser(data.targetUserId, "webrtc:answer", {
            fromUserId: socket.userId,
            roomId: data.roomId,
            answer: data.answer,
          });
        },
      );

      // ICE candidates
      socket.on(
        "webrtc:ice-candidate",
        (data: { roomId: string; targetUserId: string; candidate: any }) => {
          this.sendToUser(data.targetUserId, "webrtc:ice-candidate", {
            fromUserId: socket.userId,
            roomId: data.roomId,
            candidate: data.candidate,
          });
        },
      );
    });
  }

  private handleVoiceRoomLeave(socket: any, roomId: string) {
    socket.leave(`voice:${roomId}`);

    // Remove from voice room tracking
    if (this.voiceRooms.has(roomId)) {
      this.voiceRooms.get(roomId)!.delete(socket.userId);
      if (this.voiceRooms.get(roomId)!.size === 0) {
        this.voiceRooms.delete(roomId);
      }
    }

    // Update user's voice room
    const user = this.connectedUsers.get(socket.id);
    if (user) {
      user.voiceRoom = undefined;
    }

    // Notify others in the room
    socket.to(`voice:${roomId}`).emit("voice:user-left", {
      userId: socket.userId,
      username: socket.username,
      roomId,
      timestamp: new Date(),
    });

    console.log(`🎤 ${socket.username} left voice room ${roomId}`);
  }

  private handleUserDisconnect(socket: any) {
    const user = this.connectedUsers.get(socket.id);

    if (user) {
      // Leave voice room if in one
      if (user.voiceRoom) {
        this.handleVoiceRoomLeave(socket, user.voiceRoom);
      }

      // Clean up user data
      this.connectedUsers.delete(socket.id);
      this.userSockets.delete(socket.userId);

      // Notify friends of offline status
      socket.broadcast.emit("friend:status-change", {
        userId: socket.userId,
        username: socket.username,
        status: "offline",
        lastSeen: new Date(),
      });
    }
  }

  // Helper methods for server-side usage
  public sendToUser(userId: string, event: string, data: any): boolean {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  public sendToRoom(room: string, event: string, data: any): void {
    this.io.to(room).emit(event, data);
  }

  public sendToVoiceRoom(roomId: string, event: string, data: any): void {
    this.io.to(`voice:${roomId}`).emit(event, data);
  }

  public getConnectedUsers(): SocketUser[] {
    return Array.from(this.connectedUsers.values());
  }

  public getUsersInVoiceRoom(roomId: string): string[] {
    return Array.from(this.voiceRooms.get(roomId) || []);
  }

  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  public getUserActivity(userId: string): SocketUser | undefined {
    const socketId = this.userSockets.get(userId);
    return socketId ? this.connectedUsers.get(socketId) : undefined;
  }

  // Broadcast to all connected users
  public broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }

  // Get room statistics
  public getRoomStats() {
    return {
      totalConnected: this.connectedUsers.size,
      voiceRooms: Array.from(this.voiceRooms.entries()).map(
        ([roomId, users]) => ({
          roomId,
          userCount: users.size,
        }),
      ),
    };
  }
}

export default EnhancedSocketManager;
