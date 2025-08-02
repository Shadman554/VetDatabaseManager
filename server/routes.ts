import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fs from 'fs';
import path from 'path';

export async function registerRoutes(app: Express): Promise<Server> {
  // Simple persistent session management
  const sessionsFile = path.join(process.cwd(), '.sessions.json');
  
  // Load existing sessions
  let sessions: Map<string, any> = new Map();
  try {
    if (fs.existsSync(sessionsFile)) {
      const data = JSON.parse(fs.readFileSync(sessionsFile, 'utf8'));
      sessions = new Map(Object.entries(data));
    }
  } catch (error) {
    console.log('No existing sessions found, starting fresh');
  }

  // Save sessions to file
  const saveSessions = () => {
    try {
      const data = Object.fromEntries(sessions);
      fs.writeFileSync(sessionsFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save sessions:', error);
    }
  };

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
      saveSessions(); // Persist session to file

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
      saveSessions(); // Persist session changes
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

  // External API authentication endpoint
  app.get('/api/vet-auth', async (req, res) => {
    try {
      const username = process.env.VET_API_USERNAME;
      const password = process.env.VET_API_PASSWORD;
      const demoMode = process.env.DEMO_MODE === 'true';
      
      if (!username || !password) {
        return res.status(500).json({ error: 'API credentials not configured' });
      }

      // Demo mode for testing without real API credentials
      if (demoMode) {
        console.log('🚀 Running in DEMO MODE - using mock API token');
        const mockToken = 'demo_token_' + Math.random().toString(36).substring(2);
        return res.json({ token: mockToken });
      }

      // Authenticate with external API
      const response = await fetch('https://python-database-production.up.railway.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('API Authentication Error:', response.status, errorText);
        return res.status(response.status).json({ 
          error: errorText,
          message: 'Invalid API credentials'
        });
      }

      const { access_token } = await response.json();
      res.json({ token: access_token });
    } catch (error) {
      console.error('External API auth error:', error);
      res.status(500).json({ error: 'Failed to authenticate with external API' });
    }
  });

  // Notification management routes
  app.get("/api/notifications/", async (req, res) => {
    try {
      const response = await fetch('https://python-database-production.up.railway.app/api/notifications/', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to fetch notifications' });
      }

      const notifications = await response.json();
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get("/api/notifications/recent/latest", async (req, res) => {
    try {
      const response = await fetch('https://python-database-production.up.railway.app/api/notifications/recent/latest', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to fetch recent notifications' });
      }

      const notifications = await response.json();
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching recent notifications:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post("/api/notifications/", async (req, res) => {
    try {
      const { title, content, type, image_url } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      // Get authentication token
      const username = process.env.VET_API_USERNAME || 'admin';
      const password = process.env.VET_API_PASSWORD || 'admin123';
      
      const authResponse = await fetch('https://python-database-production.up.railway.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!authResponse.ok) {
        return res.status(401).json({ error: 'Authentication failed' });
      }

      const { access_token } = await authResponse.json();

      // Create notification with authentication (API expects 'body' field not 'content')
      const response = await fetch('https://python-database-production.up.railway.app/api/notifications/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        },
        body: JSON.stringify({ 
          title, 
          body: content, // API expects 'body' field
          image_url: image_url || null
          // Note: type field not supported by external API database
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Notification creation error:', response.status, errorText);
        return res.status(response.status).json({ error: 'Failed to create notification', details: errorText });
      }

      const notification = await response.json();
      res.json(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get authentication token
      const username = process.env.VET_API_USERNAME || 'admin';
      const password = process.env.VET_API_PASSWORD || 'admin123';
      
      const authResponse = await fetch('https://python-database-production.up.railway.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!authResponse.ok) {
        return res.status(401).json({ error: 'Authentication failed' });
      }

      const { access_token } = await authResponse.json();
      
      const response = await fetch(`https://python-database-production.up.railway.app/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to mark notification as read' });
      }

      const result = await response.json();
      res.json(result);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put("/api/notifications/mark-all-read", async (req, res) => {
    try {
      // Get authentication token
      const username = process.env.VET_API_USERNAME || 'admin';
      const password = process.env.VET_API_PASSWORD || 'admin123';
      
      const authResponse = await fetch('https://python-database-production.up.railway.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!authResponse.ok) {
        return res.status(401).json({ error: 'Authentication failed' });
      }

      const { access_token } = await authResponse.json();

      const response = await fetch('https://python-database-production.up.railway.app/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to mark all notifications as read' });
      }

      const result = await response.json();
      res.json(result);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get authentication token
      const username = process.env.VET_API_USERNAME || 'admin';
      const password = process.env.VET_API_PASSWORD || 'admin123';
      
      const authResponse = await fetch('https://python-database-production.up.railway.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!authResponse.ok) {
        return res.status(401).json({ error: 'Authentication failed' });
      }

      const { access_token } = await authResponse.json();
      
      const response = await fetch(`https://python-database-production.up.railway.app/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to delete notification' });
      }

      res.json({ success: true, message: 'Notification deleted successfully' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
