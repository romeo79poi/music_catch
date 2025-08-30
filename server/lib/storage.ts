import { createClient } from "@supabase/supabase-js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Supabase client for file storage
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let supabaseClient: any = null;

if (supabaseUrl && supabaseServiceKey) {
  supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
}

// Local storage fallback configuration
const uploadDir = path.join(process.cwd(), "uploads");

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for local uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subDir = req.body.type || "general";
    const fullPath = path.join(uploadDir, subDir);

    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }

    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + extension);
  },
});

// File filter for different types
const createFileFilter = (allowedTypes: string[]) => {
  return (req: any, file: any, cb: any) => {
    const fileType = file.mimetype.split("/")[0];
    const extension = path.extname(file.originalname).toLowerCase();

    const isAllowedType = allowedTypes.some((type) => {
      if (type === "image") return file.mimetype.startsWith("image/");
      if (type === "audio") return file.mimetype.startsWith("audio/");
      if (type === "video") return file.mimetype.startsWith("video/");
      return file.mimetype === type;
    });

    if (isAllowedType) {
      cb(null, true);
    } else {
      cb(new Error(`Only ${allowedTypes.join(", ")} files are allowed`), false);
    }
  };
};

// Multer configurations for different file types
export const uploadImage = multer({
  storage,
  fileFilter: createFileFilter(["image"]),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for images
  },
});

export const uploadAudio = multer({
  storage,
  fileFilter: createFileFilter(["audio"]),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for audio
  },
});

export const uploadVideo = multer({
  storage,
  fileFilter: createFileFilter(["video"]),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for video
  },
});

export const uploadGeneral = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for general files
  },
});

/**
 * Upload file to Supabase Storage
 */
export async function uploadToSupabase(
  file: Express.Multer.File,
  bucket: string,
  fileName?: string,
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!supabaseClient) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    const fileBuffer = fs.readFileSync(file.path);
    const uploadFileName = fileName || `${Date.now()}-${file.originalname}`;

    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .upload(uploadFileName, fileBuffer, {
        contentType: file.mimetype,
        duplex: "half",
      });

    // Clean up local file
    fs.unlinkSync(file.path);

    if (error) {
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(uploadFileName);

    return { success: true, url: urlData.publicUrl };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFromSupabase(
  bucket: string,
  fileName: string,
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseClient) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    const { error } = await supabaseClient.storage
      .from(bucket)
      .remove([fileName]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get local file URL
 */
export function getLocalFileUrl(filePath: string): string {
  const relativePath = path.relative(uploadDir, filePath);
  return `/uploads/${relativePath.replace(/\\/g, "/")}`;
}

/**
 * Generate signed URL for private files
 */
export async function generateSignedUrl(
  bucket: string,
  fileName: string,
  expiresIn: number = 3600,
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!supabaseClient) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .createSignedUrl(fileName, expiresIn);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, url: data.signedUrl };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Storage service configuration
 */
export const storageConfig = {
  buckets: {
    music: "music-files",
    images: "user-images",
    covers: "album-covers",
    avatars: "profile-avatars",
    voice: "voice-recordings",
  },
  maxSizes: {
    image: 5 * 1024 * 1024, // 5MB
    audio: 50 * 1024 * 1024, // 50MB
    video: 100 * 1024 * 1024, // 100MB
  },
  allowedFormats: {
    image: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    audio: [".mp3", ".wav", ".flac", ".m4a", ".ogg"],
    video: [".mp4", ".webm", ".mov", ".avi"],
  },
};

/**
 * Validate file type and size
 */
export function validateFile(
  file: Express.Multer.File,
  type: "image" | "audio" | "video",
): { valid: boolean; error?: string } {
  const extension = path.extname(file.originalname).toLowerCase();
  const allowedFormats = storageConfig.allowedFormats[type];
  const maxSize = storageConfig.maxSizes[type];

  if (!allowedFormats.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file format. Allowed: ${allowedFormats.join(", ")}`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Max size: ${Math.round(maxSize / 1024 / 1024)}MB`,
    };
  }

  return { valid: true };
}

export default {
  uploadImage,
  uploadAudio,
  uploadVideo,
  uploadGeneral,
  uploadToSupabase,
  deleteFromSupabase,
  getLocalFileUrl,
  generateSignedUrl,
  validateFile,
  storageConfig,
};
