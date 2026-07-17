/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { handleChat } from "./src/server/handleChat";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

if (!process.env.MINIMAX_API_KEY) {
  console.warn("WARNING: MINIMAX_API_KEY environment variable is not set. Chat assistant will run in mock mode.");
}

// API Endpoint for Agent Reasoning & Simulated MCP Coordination.
// The full orchestration (MiniMax call + remote MCP tool chain + local fallback)
// lives in src/server/handleChat.ts so it can be shared with the cloud deployment.
app.post("/api/agent/chat", async (req, res) => {
  try {
    const result = await handleChat(req.body, {
      MINIMAX_API_KEY: process.env.MINIMAX_API_KEY,
      MCP_REMOTE_URL: process.env.MCP_REMOTE_URL,
      USE_REMOTE_MCP: process.env.USE_REMOTE_MCP
    });
    return res.json(result);
  } catch (error: any) {
    console.error("Chat handler error:", error);
    return res.status(500).json({ error: error?.message || "Internal server error during chat reasoning." });
  }
});

// Serve static assets in production, and run Vite in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`McDonald's Server running on http://localhost:${PORT}`);
  });
}

startServer();
