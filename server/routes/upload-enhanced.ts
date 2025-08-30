import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import {
  uploadImage,
  uploadAudio,
  uploadVideo,
  uploadToSupabase,
  deleteFromSupabase,
  validateFile,
  storageConfig,
  getLocalFileUrl,
} from "../lib/storage";
import { connectDB, isMongoConnected } from "../lib/mongodb";
import Song from "../models/Song";
import Album from "../models/Album";
import Artist from "../models/Artist";
import User from "../models/User";

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

// POST /api/upload/music - Upload music file
export const uploadMusic = [
  uploadAudio.single("music"),
  async (req: Request, res: Response) => {
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

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Music file is required",
        });
      }

      // Validate file
      const validation = validateFile(req.file, "audio");
      if (!validation.valid) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: validation.error,
        });
      }

      const { title, artist_name, album_title, genre, duration, is_explicit } =
        req.body;

      if (!title || !artist_name || !genre || !duration) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: "Title, artist, genre, and duration are required",
        });
      }

      // Find or create artist
      let artist = await Artist.findOne({ name: artist_name });
      if (!artist) {
        artist = await Artist.create({
          name: artist_name,
          user_id: userId,
        });
      }

      // Find or create album if provided
      let album = null;
      if (album_title) {
        album = await Album.findOne({ title: album_title, artist: artist._id });
        if (!album) {
          album = await Album.create({
            title: album_title,
            artist: artist._id,
            genre,
            release_date: new Date(),
            uploaded_by: userId,
          });
        }
      }

      // Upload to Supabase or use local storage
      const fileName = `${Date.now()}-${req.file.originalname}`;
      let fileUrl = getLocalFileUrl(req.file.path);

      try {
        const uploadResult = await uploadToSupabase(
          req.file,
          storageConfig.buckets.music,
          fileName,
        );

        if (uploadResult.success && uploadResult.url) {
          fileUrl = uploadResult.url;
        }
      } catch (error) {
        console.log("⚠️ Supabase upload failed, using local storage");
      }

      // Create song record
      const song = await Song.create({
        title,
        artist: artist._id,
        album: album?._id,
        duration: parseInt(duration),
        file_url: fileUrl,
        file_size: req.file.size,
        genre,
        is_explicit: is_explicit === "true",
        uploaded_by: userId,
        status: "pending", // Requires approval
      });

      await song.populate([
        { path: "artist", select: "name verified" },
        { path: "album", select: "title" },
      ]);

      res.status(201).json({
        success: true,
        message: "Music uploaded successfully",
        song: {
          id: song._id,
          title: song.title,
          artist: song.artist,
          album: song.album,
          duration: song.duration,
          file_url: song.file_url,
          genre: song.genre,
          is_explicit: song.is_explicit,
          status: song.status,
          created_at: song.created_at,
        },
      });
    } catch (error: any) {
      console.error("❌ Error uploading music:", error);

      // Clean up file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },
];

// POST /api/upload/cover - Upload album/playlist cover
export const uploadCover = [
  uploadImage.single("cover"),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Cover image is required",
        });
      }

      // Validate file
      const validation = validateFile(req.file, "image");
      if (!validation.valid) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: validation.error,
        });
      }

      // Upload to Supabase or use local storage
      const fileName = `cover-${Date.now()}-${req.file.originalname}`;
      let fileUrl = getLocalFileUrl(req.file.path);

      try {
        const uploadResult = await uploadToSupabase(
          req.file,
          storageConfig.buckets.covers,
          fileName,
        );

        if (uploadResult.success && uploadResult.url) {
          fileUrl = uploadResult.url;
        }
      } catch (error) {
        console.log("⚠️ Supabase upload failed, using local storage");
      }

      res.json({
        success: true,
        message: "Cover uploaded successfully",
        url: fileUrl,
        file_name: fileName,
      });
    } catch (error: any) {
      console.error("❌ Error uploading cover:", error);

      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },
];

// POST /api/upload/avatar - Upload profile avatar
export const uploadAvatar = [
  uploadImage.single("avatar"),
  async (req: Request, res: Response) => {
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

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Avatar image is required",
        });
      }

      // Validate file
      const validation = validateFile(req.file, "image");
      if (!validation.valid) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: validation.error,
        });
      }

      // Upload to Supabase or use local storage
      const fileName = `avatar-${userId}-${Date.now()}-${req.file.originalname}`;
      let fileUrl = getLocalFileUrl(req.file.path);

      try {
        const uploadResult = await uploadToSupabase(
          req.file,
          storageConfig.buckets.avatars,
          fileName,
        );

        if (uploadResult.success && uploadResult.url) {
          fileUrl = uploadResult.url;
        }
      } catch (error) {
        console.log("⚠️ Supabase upload failed, using local storage");
      }

      // Update user profile with new avatar
      await User.findByIdAndUpdate(userId, {
        profile_image_url: fileUrl,
      });

      res.json({
        success: true,
        message: "Avatar uploaded successfully",
        url: fileUrl,
        file_name: fileName,
      });
    } catch (error: any) {
      console.error("❌ Error uploading avatar:", error);

      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },
];

// DELETE /api/upload/delete/:bucket/:fileName - Delete uploaded file
export async function deleteUploadedFile(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { bucket, fileName } = req.params;

    // Validate bucket
    const validBuckets = Object.values(storageConfig.buckets);
    if (!validBuckets.includes(bucket)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bucket",
      });
    }

    // Try to delete from Supabase
    try {
      const deleteResult = await deleteFromSupabase(bucket, fileName);
      if (deleteResult.success) {
        return res.json({
          success: true,
          message: "File deleted successfully",
        });
      }
    } catch (error) {
      console.log("⚠️ Supabase delete failed, trying local storage");
    }

    // Try to delete from local storage
    const localPath = path.join(process.cwd(), "uploads", bucket, fileName);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
      return res.json({
        success: true,
        message: "File deleted successfully",
      });
    }

    res.status(404).json({
      success: false,
      message: "File not found",
    });
  } catch (error: any) {
    console.error("❌ Error deleting file:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

// GET /api/upload/config - Get upload configuration
export async function getUploadConfig(req: Request, res: Response) {
  try {
    res.json({
      success: true,
      config: {
        max_sizes: storageConfig.maxSizes,
        allowed_formats: storageConfig.allowedFormats,
        buckets: storageConfig.buckets,
      },
    });
  } catch (error: any) {
    console.error("❌ Error getting upload config:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

// GET /api/upload/progress/:uploadId - Get upload progress (for large files)
export async function getUploadProgress(req: Request, res: Response) {
  try {
    const { uploadId } = req.params;

    // This would typically query a Redis cache or database for upload progress
    // For now, return a mock response
    res.json({
      success: true,
      upload_id: uploadId,
      progress: 100, // Mock complete
      status: "completed",
    });
  } catch (error: any) {
    console.error("❌ Error getting upload progress:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
