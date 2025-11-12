const express = require('express');
const serverless = require('serverless-http');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// --- Import routes ---
const authRoutes = require('../BACKEND/routes/auth.js');
const accountsRoutes = require('../BACKEND/routes/accounts_v2.js');
const antropometriRoutes = require('../BACKEND/routes/antropometri.js');
const jadwalRoutes = require('../BACKEND/routes/jadwal.js');

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/antropometri', antropometriRoutes);
app.use('/api/jadwal', jadwalRoutes);

// --- Gemini API ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

app.post('/api/generate-recommendation', async (req, res) => {
  try {
    const { namaAnak, umur, jenisKelamin, beratBadan, tinggiBadan, bmi, statusGizi } = req.body;

    const prompt = `
      Anda adalah seorang ahli gizi anak dari Posyandu Melati 1.
      Berikan 2–3 rekomendasi singkat untuk orang tua berdasarkan data berikut:
      Nama: ${namaAnak}
      Umur: ${umur} bulan
      Jenis Kelamin: ${jenisKelamin}
      Berat: ${beratBadan} kg
      Tinggi: ${tinggiBadan} cm
      BMI: ${bmi.toFixed(1)}
      Status Gizi: ${statusGizi}
    `;

    const result = await model.generateContent(prompt);
    const recommendationText = (await result.response).text();

    res.json({ recommendation: recommendationText });
  } catch (error) {
    console.error('Error generating recommendation:', error);
    res.status(500).json({ error: 'Gagal menghasilkan rekomendasi.' });
  }
});

// --- Default route ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../login.html'));
});

// === Ekspor ke Vercel ===
module.exports = app;
module.exports.handler = serverless(app);
