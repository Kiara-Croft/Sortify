// server/server.js
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

/* === CORS === */
app.use(
  cors({
    origin: ["https://melody-lab.netlify.app", "http://localhost:8888"],
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  })
);

// ✅ fix pentru preflight OPTIONS
app.options("*", cors());

// Body parsers
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

/* === MongoDB === */
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error("❌ MONGO_URI lipsă din environment!");
} else {
  const safeURI = mongoURI.replace(/:[^:]*@/, ":****@");
  console.log("⏳ Încerc conectarea la:", safeURI);
}

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
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
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    mongo: mongoose.connection.readyState === 1 ? "connected" : "not-connected",
    time: new Date().toISOString(),
  });
});

/* === Spotify Token === */
app.post("/api/get-token", async (req, res) => {
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
    res.json(response.data);
  } catch (err) {
    console.error("Spotify token error:", err.response?.data || err.message);
    res.status(400).json({ error: "Nu s-a putut obține token-ul" });
  }
});

/* === Save Order === */
app.post("/api/saveOrder", async (req, res) => {
  try {
    const { spotifyUserId, order } = req.body;
    if (!spotifyUserId || !order || typeof order !== "object") {
      return res
        .status(400)
        .json({ error: "Missing sau invalid spotifyUserId/order" });
    }
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
app.get("/api/getOrder/:spotifyUserId", async (req, res) => {
  try {
    const { spotifyUserId } = req.params;
    if (!spotifyUserId) {
      return res.status(400).json({ error: "Lipsește spotifyUserId" });
    }
    const doc = await Order.findOne({ spotifyUserId });
    res.json(doc ? doc.order : {});
  } catch (err) {
    console.error("Error fetching order:", err.message);
    res.status(500).json({ error: "Eroare la încărcarea ordinii" });
  }
});

/* === Get Playlist Tracks === */
app.get("/api/playlist", async (req, res) => {
  try {
    if (!process.env.SPOTIFY_ACCESS_TOKEN || !process.env.PLAYLIST_ID) {
      return res.status(500).json({
        error: "Lipsește SPOTIFY_ACCESS_TOKEN sau PLAYLIST_ID din .env",
      });
    }
    const response = await axios.get(
      `https://api.spotify.com/v1/playlists/${process.env.PLAYLIST_ID}/tracks`,
      {
        headers: {
          Authorization: `Bearer ${process.env.SPOTIFY_ACCESS_TOKEN}`,
        },
      }
    );
    const data = response.data.items.map((item) => ({
      artist: item.track.artists[0].name,
      song: item.track.name,
    }));
    res.json(data);
  } catch (err) {
    console.error("Spotify playlist error:", err.response?.data || err.message);
    res.status(500).json({ error: "Nu s-a putut obține playlist-ul" });
  }
});

const PORT = process.env.PORT || 8888;
app.listen(PORT, () => {
  console.log(`🚀 Serverul rulează pe portul ${PORT}`);
});
