import path from "path";
import http from "http";
import * as express from "express";
import path from "path";
import fs from "fs";
import { createServer } from "./index";
import { EnhancedSocketManager } from "./lib/socket-enhanced";
import { initializeDatabase } from "./lib/database-init";

const app = createServer();
const port = process.env.PORT || 3000;

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// Initialize Enhanced Socket.IO server
const socketManager = new EnhancedSocketManager(server);
console.log(
  "🔌 Enhanced Socket.IO server initialized with voice streaming support",
);

// Initialize database on startup
initializeDatabase().catch(console.error);

// In production, serve the built SPA files only when available
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");

if (process.env.NODE_ENV === "production" && fs.existsSync(distPath)) {
  // Serve static files
  app.use(express.static(distPath));

  // Handle React Router - serve index.html for all non-API routes
  app.get("*", (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }

    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Export socket manager for use in other modules
export { socketManager };

// Start server with Socket.IO support (production only)
if (process.env.NODE_ENV === "production") {
  server.listen(port, () => {
    console.log(`🚀 Fusion Starter server running on port ${port}`);
    console.log(`📱 Frontend: http://localhost:${port}`);
    console.log(`🔧 API: http://localhost:${port}/api`);
    console.log(`🔌 WebSocket: Connected and ready for real-time features`);
  });
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
