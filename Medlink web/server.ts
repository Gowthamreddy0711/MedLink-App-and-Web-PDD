import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", appName: "MedLink", time: new Date().toISOString() });
});

// Sentiment Analysis endpoint
app.post("/api/sentiment", async (req, res) => {
  try {
    const { reviewText } = req.body;
    if (!reviewText || typeof reviewText !== 'string' || !reviewText.trim()) {
      return res.json({ sentiment: "NEUTRAL", score: 50 });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.error("Missing GEMINI_API_KEY in environment");
      return res.status(500).json({ error: "Server misconfiguration" });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;
    const payload = {
      contents: [{
        parts: [{
          text: `Analyze the sentiment of this review for a doctor in a clinical setting. 
Determine if it is POSITIVE, NEUTRAL, or NEGATIVE. 
Assign a score based strictly on these rules: POSITIVE = 100, NEUTRAL = 50, NEGATIVE = 0.

Review: "${reviewText}"`
        }]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            sentiment: { type: "STRING", enum: ["POSITIVE", "NEUTRAL", "NEGATIVE"] },
            score: { type: "INTEGER" }
          },
          required: ["sentiment", "score"]
        }
      }
    };

    const apiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!apiRes.ok) {
      console.error("Gemini API error:", await apiRes.text());
      return res.json({ sentiment: "NEUTRAL", score: 50 });
    }

    const data = await apiRes.json();
    const textRes = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (textRes) {
      const parsed = JSON.parse(textRes);
      return res.json({
        sentiment: parsed.sentiment,
        score: parsed.score
      });
    }

    res.json({ sentiment: "NEUTRAL", score: 50 });
  } catch (error) {
    console.error("Error in /api/sentiment:", error);
    res.json({ sentiment: "NEUTRAL", score: 50 });
  }
});

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
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "localhost", () => {
    console.log(`MedLink server running on http://localhost:${PORT}`);
  });
}

startServer();
