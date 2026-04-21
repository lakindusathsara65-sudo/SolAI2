import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Facebook Page Info
  app.get("/api/fb-page-info", async (req, res) => {
    const { pageId } = req.query;
    const token = process.env.FACEBOOK_GRAPH_TOKEN;

    if (!token) {
      return res.status(401).json({ error: "Facebook Graph Token not configured." });
    }

    if (!pageId) {
      return res.status(400).json({ error: "Page ID or Link is required." });
    }

    try {
      // Basic info fetch. Note: Real production use requires specific permissions/tokens
      const response = await axios.get(`https://graph.facebook.com/v21.0/${pageId}`, {
        params: {
          fields: "name,about,description,link,picture,location",
          access_token: token
        }
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("FB Graph error:", error.response?.data || error.message);
      res.status(500).json({ 
        error: "Failed to fetch Facebook data.",
        details: error.response?.data?.error?.message || error.message 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
