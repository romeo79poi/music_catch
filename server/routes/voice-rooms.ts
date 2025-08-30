import { Request, Response } from "express";
import { connectDB, isMongoConnected } from "../lib/mongodb";
import VoiceRoom from "../models/VoiceRoom";
import User from "../models/User";

// Import socket manager for real-time updates
let socketManager: any = null;
if (process.env.NODE_ENV === "production") {
  try {
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

// GET /api/voice-rooms - Get active voice rooms
export async function getVoiceRooms(req: Request, res: Response) {
  try {
    const connected = await initConnection();
    if (!connected) {
      return res.status(503).json({
        success: false,
        message: "Database not available",
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const roomType = req.query.type as string;
    const isPublic = req.query.public === "true";

    let filter: any = { is_active: true };

    if (roomType) {
      filter.room_type = roomType;
    }

    if (isPublic !== undefined) {
      filter.is_public = isPublic;
    }

    const rooms = await VoiceRoom.find(filter)
      .populate({
        path: "host",
        select: "username display_name profile_image_url verified",
      })
      .populate({
        path: "moderators",
        select: "username display_name profile_image_url",
      })
      .populate({
        path: "participants.user",
        select: "username display_name profile_image_url",
      })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const totalRooms = await VoiceRoom.countDocuments(filter);

    res.json({
      success: true,
      rooms: rooms.map((room) => ({
        id: room._id,
        name: room.name,
        description: room.description,
        cover_image_url: room.cover_image_url,
        host: room.host,
        moderators: room.moderators,
        current_participants: room.participants.length,
        max_participants: room.max_participants,
        is_public: room.is_public,
        room_type: room.room_type,
        current_topic: room.current_topic,
        tags: room.tags,
        created_at: room.created_at,
        peak_participants: room.peak_participants,
        participants: room.participants,
      })),
      pagination: {
        page,
        limit,
        total: totalRooms,
        pages: Math.ceil(totalRooms / limit),
        hasMore: skip + rooms.length < totalRooms,
      },
    });
  } catch (error: any) {
    console.error("❌ Error getting voice rooms:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

// POST /api/voice-rooms - Create new voice room
export async function createVoiceRoom(req: Request, res: Response) {
  try {
    const connected = await initConnection();
    if (!connected) {
      return res.status(503).json({
        success: false,
        message: "Database not available",
      });
    }

    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const {
      name,
      description = "",
      cover_image_url = "",
      max_participants = 50,
      is_public = true,
      room_type = "open",
      current_topic = "",
      tags = [],
      recording_enabled = false,
      settings = {},
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Room name is required",
      });
    }

    const room = await VoiceRoom.create({
      name: name.trim(),
      description,
      cover_image_url,
      host: userId,
      max_participants,
      is_public,
      room_type,
      current_topic,
      tags,
      recording_enabled,
      settings: {
        allow_requests: settings.allow_requests ?? true,
        auto_approve_speakers: settings.auto_approve_speakers ?? false,
        max_speaking_time: settings.max_speaking_time ?? 300,
      },
      participants: [
        {
          user: userId,
          role: "speaker",
          is_muted: false,
          joined_at: new Date(),
        },
      ],
      peak_participants: 1,
    });

    await room.populate([
      {
        path: "host",
        select: "username display_name profile_image_url verified",
      },
      {
        path: "participants.user",
        select: "username display_name profile_image_url",
      },
    ]);

    // Broadcast room creation
    if (socketManager && is_public) {
      socketManager.sendToRoom("voice:lobby", "voice:room-created", {
        room: {
          id: room._id,
          name: room.name,
          host: room.host,
          current_participants: room.participants.length,
          max_participants: room.max_participants,
          room_type: room.room_type,
        },
      });
    }

    res.status(201).json({
      success: true,
      room: {
        id: room._id,
        name: room.name,
        description: room.description,
        cover_image_url: room.cover_image_url,
        host: room.host,
        current_participants: room.participants.length,
        max_participants: room.max_participants,
        is_public: room.is_public,
        room_type: room.room_type,
        current_topic: room.current_topic,
        tags: room.tags,
        recording_enabled: room.recording_enabled,
        settings: room.settings,
        participants: room.participants,
        created_at: room.created_at,
      },
    });
  } catch (error: any) {
    console.error("❌ Error creating voice room:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

// GET /api/voice-rooms/:roomId - Get voice room details
export async function getVoiceRoom(req: Request, res: Response) {
  try {
    const connected = await initConnection();
    if (!connected) {
      return res.status(503).json({
        success: false,
        message: "Database not available",
      });
    }

    const { roomId } = req.params;
    const userId = (req as any).user?.userId;

    const room = await VoiceRoom.findById(roomId)
      .populate({
        path: "host",
        select: "username display_name profile_image_url verified",
      })
      .populate({
        path: "moderators",
        select: "username display_name profile_image_url",
      })
      .populate({
        path: "participants.user",
        select: "username display_name profile_image_url",
      });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Voice room not found",
      });
    }

    // Check access for private rooms
    if (!room.is_public && userId) {
      const isParticipant = room.participants.some(
        (p: any) => p.user._id.toString() === userId,
      );
      const isHost = room.host._id.toString() === userId;
      const isModerator = room.moderators.some(
        (m: any) => m._id.toString() === userId,
      );

      if (!isParticipant && !isHost && !isModerator) {
        return res.status(403).json({
          success: false,
          message: "Access denied - private room",
        });
      }
    }

    res.json({
      success: true,
      room: {
        id: room._id,
        name: room.name,
        description: room.description,
        cover_image_url: room.cover_image_url,
        host: room.host,
        moderators: room.moderators,
        current_participants: room.participants.length,
        max_participants: room.max_participants,
        is_public: room.is_public,
        is_active: room.is_active,
        room_type: room.room_type,
        current_topic: room.current_topic,
        scheduled_for: room.scheduled_for,
        total_duration: room.total_duration,
        peak_participants: room.peak_participants,
        tags: room.tags,
        recording_enabled: room.recording_enabled,
        recording_url: room.recording_url,
        settings: room.settings,
        participants: room.participants,
        created_at: room.created_at,
        updated_at: room.updated_at,
      },
    });
  } catch (error: any) {
    console.error("❌ Error getting voice room:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

// POST /api/voice-rooms/:roomId/join - Join voice room
export async function joinVoiceRoom(req: Request, res: Response) {
  try {
    const connected = await initConnection();
    if (!connected) {
      return res.status(503).json({
        success: false,
        message: "Database not available",
      });
    }

    const { roomId } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const room = await VoiceRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Voice room not found",
      });
    }

    if (!room.is_active) {
      return res.status(400).json({
        success: false,
        message: "Room is not active",
      });
    }

    // Check if user is already in the room
    const existingParticipant = room.participants.find(
      (p: any) => p.user.toString() === userId,
    );

    if (existingParticipant) {
      return res.status(400).json({
        success: false,
        message: "Already in room",
      });
    }

    // Check room capacity
    if (room.participants.length >= room.max_participants) {
      return res.status(400).json({
        success: false,
        message: "Room is full",
      });
    }

    // Add user to room
    room.participants.push({
      user: userId,
      role: "listener", // Start as listener, can be promoted to speaker
      is_muted: false,
      joined_at: new Date(),
      speaking_time: 0,
    });

    // Update peak participants
    if (room.participants.length > room.peak_participants) {
      room.peak_participants = room.participants.length;
    }

    await room.save();

    // Populate user info
    await room.populate({
      path: "participants.user",
      select: "username display_name profile_image_url",
    });

    // Get the newly added participant
    const newParticipant = room.participants[room.participants.length - 1];

    // Broadcast join event
    if (socketManager) {
      socketManager.sendToRoom(`voice:${roomId}`, "voice:user-joined", {
        roomId,
        participant: newParticipant,
        current_participants: room.participants.length,
      });
    }

    res.json({
      success: true,
      message: "Joined room successfully",
      participant: newParticipant,
      current_participants: room.participants.length,
    });
  } catch (error: any) {
    console.error("❌ Error joining voice room:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

// POST /api/voice-rooms/:roomId/leave - Leave voice room
export async function leaveVoiceRoom(req: Request, res: Response) {
  try {
    const connected = await initConnection();
    if (!connected) {
      return res.status(503).json({
        success: false,
        message: "Database not available",
      });
    }

    const { roomId } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const room = await VoiceRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Voice room not found",
      });
    }

    // Remove user from participants
    const participantIndex = room.participants.findIndex(
      (p: any) => p.user.toString() === userId,
    );

    if (participantIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "Not in room",
      });
    }

    room.participants.splice(participantIndex, 1);

    // If host left and room has other participants, assign new host
    if (room.host.toString() === userId && room.participants.length > 0) {
      room.host = room.participants[0].user;
    }

    // If no participants left, end the room
    if (room.participants.length === 0) {
      room.is_active = false;
      room.ended_at = new Date();
    }

    await room.save();

    // Broadcast leave event
    if (socketManager) {
      socketManager.sendToRoom(`voice:${roomId}`, "voice:user-left", {
        roomId,
        userId,
        current_participants: room.participants.length,
        new_host: room.participants.length > 0 ? room.host : null,
      });

      if (!room.is_active) {
        socketManager.sendToRoom(`voice:${roomId}`, "voice:room-ended", {
          roomId,
        });
      }
    }

    res.json({
      success: true,
      message: "Left room successfully",
      current_participants: room.participants.length,
    });
  } catch (error: any) {
    console.error("❌ Error leaving voice room:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

// POST /api/voice-rooms/:roomId/mute/:userId - Mute/unmute user
export async function toggleMute(req: Request, res: Response) {
  try {
    const connected = await initConnection();
    if (!connected) {
      return res.status(503).json({
        success: false,
        message: "Database not available",
      });
    }

    const { roomId, userId: targetUserId } = req.params;
    const { is_muted } = req.body;
    const currentUserId = (req as any).user?.userId;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const room = await VoiceRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Voice room not found",
      });
    }

    // Check permissions: host, moderator, or self
    const isHost = room.host.toString() === currentUserId;
    const isModerator = room.moderators.some(
      (m: any) => m.toString() === currentUserId,
    );
    const isSelf = targetUserId === currentUserId;

    if (!isHost && !isModerator && !isSelf) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    // Find and update participant
    const participant = room.participants.find(
      (p: any) => p.user.toString() === targetUserId,
    );

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "User not in room",
      });
    }

    participant.is_muted = is_muted;
    await room.save();

    // Broadcast mute event
    if (socketManager) {
      socketManager.sendToRoom(`voice:${roomId}`, "voice:user-muted", {
        roomId,
        userId: targetUserId,
        is_muted,
        muted_by: currentUserId,
      });
    }

    res.json({
      success: true,
      message: `User ${is_muted ? "muted" : "unmuted"} successfully`,
    });
  } catch (error: any) {
    console.error("❌ Error toggling mute:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

// POST /api/voice-rooms/:roomId/promote/:userId - Promote to speaker
export async function promoteToSpeaker(req: Request, res: Response) {
  try {
    const connected = await initConnection();
    if (!connected) {
      return res.status(503).json({
        success: false,
        message: "Database not available",
      });
    }

    const { roomId, userId: targetUserId } = req.params;
    const currentUserId = (req as any).user?.userId;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const room = await VoiceRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Voice room not found",
      });
    }

    // Check permissions: host or moderator
    const isHost = room.host.toString() === currentUserId;
    const isModerator = room.moderators.some(
      (m: any) => m.toString() === currentUserId,
    );

    if (!isHost && !isModerator) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    // Find and update participant
    const participant = room.participants.find(
      (p: any) => p.user.toString() === targetUserId,
    );

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "User not in room",
      });
    }

    participant.role = "speaker";
    await room.save();

    // Broadcast promotion event
    if (socketManager) {
      socketManager.sendToRoom(`voice:${roomId}`, "voice:user-promoted", {
        roomId,
        userId: targetUserId,
        role: "speaker",
        promoted_by: currentUserId,
      });
    }

    res.json({
      success: true,
      message: "User promoted to speaker",
    });
  } catch (error: any) {
    console.error("❌ Error promoting user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

// DELETE /api/voice-rooms/:roomId - End voice room
export async function endVoiceRoom(req: Request, res: Response) {
  try {
    const connected = await initConnection();
    if (!connected) {
      return res.status(503).json({
        success: false,
        message: "Database not available",
      });
    }

    const { roomId } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const room = await VoiceRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Voice room not found",
      });
    }

    // Only host can end the room
    if (room.host.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only host can end the room",
      });
    }

    // Calculate total duration
    const startTime = room.created_at;
    const endTime = new Date();
    const duration = Math.floor(
      (endTime.getTime() - startTime.getTime()) / 1000,
    );

    room.is_active = false;
    room.ended_at = endTime;
    room.total_duration = duration;
    await room.save();

    // Broadcast room end
    if (socketManager) {
      socketManager.sendToRoom(`voice:${roomId}`, "voice:room-ended", {
        roomId,
        ended_by: userId,
        total_duration: duration,
      });
    }

    res.json({
      success: true,
      message: "Room ended successfully",
      total_duration: duration,
    });
  } catch (error: any) {
    console.error("❌ Error ending voice room:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
