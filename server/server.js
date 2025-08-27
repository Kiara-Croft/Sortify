require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/get-token", async (req, res) => {
  const { code, redirect_uri } = req.body;

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
    console.error(err.response.data);
    res.status(400).json({ error: "Nu s-a putut obține token-ul" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Serverul rulează pe port ${process.env.PORT}`);
});
