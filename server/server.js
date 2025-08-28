require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// --- MONGO DB ---
const mongoURI = process.env.MONGO_URI; // pune aici URI-ul tău MongoDB Atlas în .env
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB conectat"))
  .catch((err) => console.error("MongoDB error:", err));

// --- SCHEMA ---
const orderSchema = new mongoose.Schema({
  spotifyUserId: { type: String, required: true, unique: true },
  order: { type: Object, required: true },
});
const Order = mongoose.model("Order", orderSchema);

// --- ROUTE PENTRU SPOTIFY TOKEN ---
app.post("/get-token", async (req, res) => {
  const { code, redirect_uri } = req.body;

  console.log("Requesting token with:");
  console.log("client_id:", process.env.SPOTIFY_CLIENT_ID);
  console.log("client_secret:", process.env.SPOTIFY_CLIENT_SECRET);
  console.log("code:", code);
  console.log("redirect_uri:", redirect_uri);

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

    res.json(response.data); // va conține access_token, refresh_token, expires_in
  } catch (err) {
    if (err.response) {
      console.error("Spotify response error:", err.response.data);
    } else {
      console.error("Other error:", err.message);
    }
    res.status(400).json({ error: "Nu s-a putut obține token-ul" });
  }
});

// --- ROUTE PENTRU SALVARE ORDINE ARTISTI ---
app.post("/saveOrder", async (req, res) => {
  const { spotifyUserId, order } = req.body;
  if (!spotifyUserId || !order) return res.status(400).send("Missing data");

  try {
    const existing = await Order.findOne({ spotifyUserId });
    if (existing) {
      existing.order = order;
      await existing.save();
    } else {
      await Order.create({ spotifyUserId, order });
    }
    res.send({ success: true });
  } catch (err) {
    console.error("Error saving order:", err);
    res.status(500).send({ error: "Eroare la salvarea ordinii" });
  }
});

// --- ROUTE PENTRU OBTINERE ORDINE ARTISTI ---
app.get("/getOrder/:spotifyUserId", async (req, res) => {
  const userId = req.params.spotifyUserId;
  try {
    const data = await Order.findOne({ spotifyUserId: userId });
    res.send(data ? data.order : {});
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).send({ error: "Eroare la încărcarea ordinii" });
  }
});

const PORT = process.env.PORT || 8888;
app.listen(PORT, () => {
  console.log(`Serverul rulează pe port ${PORT}`);
});
