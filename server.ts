import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini Setup
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: "Anda adalah asisten cerdas untuk aplikasi 'Kurban AI' di Masjid Miftahul Huda. Tugas Anda adalah membantu calon mudhohi memahami ibadah qurban. Berikan informasi tentang: 1. Perbedaan qurban Sapi (patungan/kolektif) vs Kambing (individu). 2. Manfaat qurban digital (transparansi, kemudahan). 3. Hukum fiqh dasar qurban secara ramah dan edukatif. 4. Harga di aplikasi kami: Kambing 3.5jt, Sapi Patungan 3.8jt. Gunakan gaya bahasa santun, inspiratif, dan persuasif. Singkat dan padat.",
  });

  // API Routes
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid messages format" });
      }

      // Convert to Gemini history format (excluding the last message which is the current input)
      const history = messages.slice(0, -1).map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));
      
      const userMessage = messages[messages.length - 1].content;

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(userMessage);
      const response = result.response;
      
      res.json({ text: response.text() });
    } catch (error: any) {
      console.error("AI Error:", error);
      res.status(500).json({ error: error.message || "Something went wrong" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
