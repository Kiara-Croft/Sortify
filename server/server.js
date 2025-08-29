require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// Enable CORS for all routes
app.use(
  cors({
    origin: ["https://melody-lab.netlify.app", "http://localhost:8888"],
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  })
);

// Handle preflight requests
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
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB conectat"))
  .catch((err) => {
    console.error("❌ MongoDB error:", err.message);
    if (err.message.includes("authentication failed")) {
      console.log("🔍 Verifică:");
      console.log("1. Username-ul și parola din connection string");
      console.log("2. Dacă parola conține caractere speciale");
      console.log("3. Dacă userul are permisiuni pentru database");
    }
  });

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

/* === Get Order === */
app.get("/getOrder/:spotifyUserId", async (req, res) => {
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

// Error handling middleware
app.use((err, req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://melody-lab.netlify.app"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  console.error("Server error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 8888;
app.listen(PORT, () => {
  console.log(`🚀 Serverul rulează pe portul ${PORT}`);
});
