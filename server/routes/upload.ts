import { RequestHandler } from "express";
import { UploadResponse, ApiError } from "@shared/api";
import path from "path";
import fs from "fs";

// In production, you would use cloud storage like AWS S3, Cloudinary, etc.
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "profile-pictures");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Upload profile picture
export const uploadProfilePicture: RequestHandler = async (req, res) => {
  try {
    // Handle actual file upload with data URL
    const { fileName, fileSize, fileType, dataUrl } = req.body;

    if (!fileName || !fileType) {
      const error: ApiError = {
        success: false,
        message: "File name and type are required",
        code: "VALIDATION_ERROR",
      };
      return res.status(400).json(error);
    }

    if (!dataUrl) {
      const error: ApiError = {
        success: false,
        message: "File data is required",
        code: "VALIDATION_ERROR",
      };
      return res.status(400).json(error);
    }

    // Validate file size
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      const error: ApiError = {
        success: false,
        message: "File size too large. Maximum size is 5MB",
        code: "FILE_TOO_LARGE",
      };
      return res.status(400).json(error);
    }

    // Validate file type
    const extension = path.extname(fileName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      const error: ApiError = {
        success: false,
        message: `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(", ")}`,
        code: "INVALID_FILE_TYPE",
      };
      return res.status(400).json(error);
    }

    // Validate data URL format
    if (!dataUrl.startsWith("data:image/")) {
      const error: ApiError = {
        success: false,
        message: "Invalid image data format",
        code: "INVALID_FILE_DATA",
      };
      return res.status(400).json(error);
    }

    // Generate unique filename for reference
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const uniqueFileName = `profile_${timestamp}_${randomString}${extension}`;

    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In production, you'd upload the dataUrl content to cloud storage
    // For demo, we'll return the data URL directly so the actual uploaded image shows
    const response: UploadResponse = {
      url: dataUrl, // Return the actual uploaded image data
      filename: uniqueFileName,
      size: fileSize || 0,
      success: true,
      message: "Profile picture uploaded successfully",
    };

    res.json(response);
  } catch (error) {
    const errorResponse: ApiError = {
      success: false,
      message: "Failed to upload profile picture",
      details: error,
    };
    res.status(500).json(errorResponse);
  }
};

// Delete profile picture
export const deleteProfilePicture: RequestHandler = async (req, res) => {
  try {
    const { fileName } = req.params;

    if (!fileName) {
      const error: ApiError = {
        success: false,
        message: "File name is required",
        code: "VALIDATION_ERROR",
      };
      return res.status(400).json(error);
    }

    // In production, delete from cloud storage
    // For demo, we'll simulate deletion
    await new Promise((resolve) => setTimeout(resolve, 500));

    res.json({
      success: true,
      message: "Profile picture deleted successfully",
    });
  } catch (error) {
    const errorResponse: ApiError = {
      success: false,
      message: "Failed to delete profile picture",
      details: error,
    };
    res.status(500).json(errorResponse);
  }
};

// Upload playlist cover image
export const uploadPlaylistCover: RequestHandler = async (req, res) => {
  try {
    const { fileName, fileSize, fileType } = req.body;

    if (!fileName || !fileType) {
      const error: ApiError = {
        success: false,
        message: "File name and type are required",
        code: "VALIDATION_ERROR",
      };
      return res.status(400).json(error);
    }

    // Validate file size
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      const error: ApiError = {
        success: false,
        message: "File size too large. Maximum size is 5MB",
        code: "FILE_TOO_LARGE",
      };
      return res.status(400).json(error);
    }

    // Validate file type
    const extension = path.extname(fileName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      const error: ApiError = {
        success: false,
        message: `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(", ")}`,
        code: "INVALID_FILE_TYPE",
      };
      return res.status(400).json(error);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const uniqueFileName = `playlist_${timestamp}_${randomString}${extension}`;

    // In production, upload to cloud storage
    const mockUrl = `https://api.musiccatch.com/uploads/playlist-covers/${uniqueFileName}`;

    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const response: UploadResponse = {
      url: mockUrl,
      filename: uniqueFileName,
      size: fileSize || 0,
      success: true,
      message: "Playlist cover uploaded successfully",
    };

    res.json(response);
  } catch (error) {
    const errorResponse: ApiError = {
      success: false,
      message: "Failed to upload playlist cover",
      details: error,
    };
    res.status(500).json(errorResponse);
  }
};

// Get upload configuration
export const getUploadConfig: RequestHandler = (req, res) => {
  res.json({
    success: true,
    config: {
      maxFileSize: MAX_FILE_SIZE,
      allowedExtensions: ALLOWED_EXTENSIONS,
      uploadLimits: {
        profilePicture: {
          maxSize: MAX_FILE_SIZE,
          allowedTypes: ALLOWED_EXTENSIONS,
        },
        playlistCover: {
          maxSize: MAX_FILE_SIZE,
          allowedTypes: ALLOWED_EXTENSIONS,
        },
      },
    },
  });
};
