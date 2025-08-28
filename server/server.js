// server/server.js
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

/* === CORS ===
   Pune aici origin-ul frontend-ului tău (Netlify/Vercel etc.)
   Exemplu: https://melody-lab.netlify.app
   Dacă vrei rapid, lasă temporary origin: "*" până testezi.
*/
app.use(
  cors({
    origin: "*", // înlocuiește cu URL-ul frontend-ului când finalizezi
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsers (mărim limita în caz că listele sunt mari)
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

/* === MongoDB === */
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error("❌ MONGO_URI lipsă din environment!");
}

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB conectat"))
  .catch((err) => console.error("❌ MongoDB error:", err.message));

/* === Schema & Model === */
const orderSchema = new mongoose.Schema(
  {
    spotifyUserId: { type: String, required: true, unique: true },
    order: { type: Object, required: true },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

/* === Health check === */
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    mongo: mongoose.connection.readyState === 1 ? "connected" : "not-connected",
    time: new Date().toISOString(),
  });
});

/* === Spotify Token (Auth Code flow) === */
app.post("/get-token", async (req, res) => {
  const { code, redirect_uri } = req.body;

  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    return res
      .status(500)
      .json({ error: "Lipsesc SPOTIFY_CLIENT_ID/SECRET în environment" });
  }
  if (!code || !redirect_uri) {
    return res.status(400).json({ error: "Lipsesc code sau redirect_uri" });
  }

  try {
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", redirect_uri);

    const headers = {
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID +
            ":" +
            process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    };

    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      params.toString(),
      { headers }
    );

    res.json(response.data); // access_token, refresh_token, expires_in
  } catch (err) {
    console.error("Spotify token error:", err.response?.data || err.message);
    res.status(400).json({ error: "Nu s-a putut obține token-ul" });
  }
});

/* === Save Order (upsert) === */
app.post("/saveOrder", async (req, res) => {
  try {
    const { spotifyUserId, order } = req.body;
    if (!spotifyUserId || !order || typeof order !== "object") {
      return res
        .status(400)
        .json({ error: "Missing sau invalid spotifyUserId/order" });
    }

    // Upsert: dacă există -> update, altfel -> insert
    const result = await Order.findOneAndUpdate(
      { spotifyUserId },
      { $set: { order } },
      { new: true, upsert: true }
    );

    res.json({ success: true, doc: result });
  } catch (err) {
    console.error("Error saving order:", err.message);
    res.status(500).json({ error: "Eroare la salvarea ordinii" });
  }
});

/* === Get Order === */
app.get("/getOrder/:spotifyUserId", async (req, res) => {
  try {
    const { spotifyUserId } = req.params;
    if (!spotifyUserId) {
      return res.status(400).json({ error: "Lipsește spotifyUserId" });
    }

    const doc = await Order.findOne({ spotifyUserId });
    res.json(doc ? doc.order : {}); // dacă nu există, întoarcem obiect gol
  } catch (err) {
    console.error("Error fetching order:", err.message);
    res.status(500).json({ error: "Eroare la încărcarea ordinii" });
  }
});

const PORT = process.env.PORT || 8888;
app.listen(PORT, () => {
  console.log(`🚀 Serverul rulează pe portul ${PORT}`);
});
