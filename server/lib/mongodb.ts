import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL || "";

let isConnected = false;

export async function connectDB() {
  // Skip MongoDB connection in development if no URI provided
  if (!MONGODB_URI) {
    console.log(
      "⚠️  No MongoDB URI provided - running in development mode without database",
    );
    console.log("✅ Backend server ready (no database connection)");
    return {
      success: false,
      message: "Development mode - no database connection",
    };
  }

  if (isConnected) {
    console.log("📊 MongoDB already connected");
    return { success: true, message: "Already connected" };
  }

  try {
    console.log("🔌 Connecting to MongoDB...");

    const connection = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 10000, // Close sockets after 10s of inactivity
    });

    isConnected = true;
    console.log("✅ Connected to MongoDB successfully");

    // Handle connection events
    mongoose.connection.on("disconnected", () => {
      isConnected = false;
      console.log("⚠️ MongoDB disconnected");
    });

    mongoose.connection.on("error", (err) => {
      console.log("❌ MongoDB connection error:", err.message);
    });

    return { success: true, connection };
  } catch (error: any) {
    console.log("❌ Error connecting to MongoDB:", error.message);
    console.log("⚠️ Continuing without MongoDB in development mode...");

    // Don't throw error in development - allow app to continue
    return { success: false, error: error.message };
  }
}

export async function disconnectDB() {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log("✅ Disconnected from MongoDB");
  } catch (error: any) {
    console.log("❌ Error disconnecting from MongoDB:", error.message);
  }
}

export function getConnectionStatus() {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  };
}

export function isMongoConnected() {
  return isConnected;
}
