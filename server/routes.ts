import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Simple session management for demo purposes
  let sessions: Map<string, any> = new Map();

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Create session token
      const token = Math.random().toString(36).substring(2);
      sessions.set(token, { userId: user.id, username: user.username });

      res.json({ 
        access_token: token, 
        token_type: "bearer",
        user: {
          id: user.id.toString(),
          username: user.username,
          isAdmin: user.isAdmin
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token) {
      sessions.delete(token);
    }
    res.json({ message: "Logged out successfully" });
  });

  // Get current user
  app.get("/api/auth/me", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      
      if (!token || !sessions.has(token)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const session = sessions.get(token);
      const user = await storage.getUser(session.userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: user.id.toString(),
        username: user.username,
        isAdmin: user.isAdmin
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
