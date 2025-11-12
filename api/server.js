const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, ".."))); // serve file dari root project

// Routes
const authRoutes = require("../BACKEND/routes/auth.js");
const accountsRoutes = require("../BACKEND/routes/accounts_v2.js");
const antropometriRoutes = require("../BACKEND/routes/antropometri.js");
const jadwalRoutes = require("../BACKEND/routes/jadwal.js");

app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountsRoutes);
app.use("/api/antropometri", antropometriRoutes);
app.use("/api/jadwal", jadwalRoutes);

// Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// AI Recommendation endpoint
app.post("/api/generate-recommendation", async (req, res) => {
  try {
    const { namaAnak, umur, jenisKelamin, beratBadan, tinggiBadan, bmi, statusGizi } = req.body;

    const prompt = `
      Anda adalah seorang ahli gizi anak dari Posyandu Melati 1.
      Berikan 2-3 rekomendasi singkat dan jelas berdasarkan data anak berikut.
      Gunakan bahasa Indonesia yang mudah dimengerti, tanpa format markdown.

      Data Anak:
      - Nama: ${namaAnak}
      - Umur: ${umur} bulan
      - Jenis Kelamin: ${jenisKelamin}
      - Berat Badan: ${beratBadan} kg
      - Tinggi Badan: ${tinggiBadan} cm
      - BMI: ${bmi.toFixed(1)}
      - Status Gizi: ${statusGizi}

      Contoh output: "Fokus pada variasi makanan dan stimulasi motorik kasar."
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

// Jalankan server (hanya untuk lokal, Vercel akan otomatis handle)
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

// Export untuk serverless (Vercel)
module.exports = app;
