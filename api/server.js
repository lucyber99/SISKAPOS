import express from "express";
import serverless from "serverless-http";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "../BACKEND/routes/auth.js";
import accountsRoutes from "../BACKEND/routes/accounts_v2.js";
import antropometriRoutes from "../BACKEND/routes/antropometri.js";
import jadwalRoutes from "../BACKEND/routes/jadwal.js";

// Load environment variables
dotenv.config();

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static(process.cwd()));

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountsRoutes);
app.use("/api/antropometri", antropometriRoutes);
app.use("/api/jadwal", jadwalRoutes);

// --- AI Setup ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// --- Endpoint ---
app.post("/api/generate-recommendation", async (req, res) => {
  try {
    const { namaAnak, umur, jenisKelamin, beratBadan, tinggiBadan, bmi, statusGizi } = req.body;

    const prompt = `
      Anda adalah seorang ahli gizi anak yang ramah dan membantu dari Posyandu Melati 1.
      Berikan 2-3 rekomendasi singkat, jelas, dan dapat ditindaklanjuti untuk orang tua berdasarkan data anak berikut.
      Gunakan bahasa Indonesia yang mudah dimengerti. Jangan gunakan format markdown.

      Data Anak:
      - Nama: ${namaAnak}
      - Umur: ${umur} bulan
      - Jenis Kelamin: ${jenisKelamin}
      - Berat Badan: ${beratBadan} kg
      - Tinggi Badan: ${tinggiBadan} cm
      - BMI: ${bmi.toFixed(1)}
      - Status Gizi: ${statusGizi}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const recommendationText = response.text();

    res.json({ recommendation: recommendationText });
  } catch (error) {
    console.error("Error generating recommendation:", error);
    res.status(500).json({ error: "Gagal menghasilkan rekomendasi." });
  }
});

export default serverless(app);
