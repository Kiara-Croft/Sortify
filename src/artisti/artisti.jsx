import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const SPOTIFY_REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const SPOTIFY_SCOPES =
  "user-read-email user-read-private playlist-read-private playlist-read-collaborative";

export default function Artisti() {
  const navigate = useNavigate();

  const [accessToken, setAccessToken] = useState("");
  const [spotifyUserId, setSpotifyUserId] = useState("");
  const [progress, setProgress] = useState(0);
  const [totalTracks, setTotalTracks] = useState(0);

  /* === LOGIN === */
  const handleLogin = () => {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      SPOTIFY_REDIRECT_URI
    )}&scope=${SPOTIFY_SCOPES}&response_type=token&show_dialog=true`;
    window.location.href = authUrl;
  };

  /* === FETCH WRAPPER CU PROXY === */
  const fetchWithCorsProxy = async (url, options = {}) => {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err) {
      console.error("CORS error, retrying via proxy:", err.message);
      return fetch(
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        options
      );
    }
  };

  /* === FETCH PLAYLIST TRACKS === */
  const fetchAllPlaylistTracks = async (playlistId) => {
    let allTracks = [];
    let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`;
    let fetched = 0;
    let total = 0;

    // Obținem totalul
    const initialResponse = await fetchWithCorsProxy(
      `https://api.spotify.com/v1/playlists/${playlistId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (initialResponse.ok) {
      const playlistData = await initialResponse.json();
      total = playlistData.tracks.total;
      setTotalTracks(total);
    }

    // Fetch paginat
    while (nextUrl) {
      const response = await fetchWithCorsProxy(nextUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // token expirat
          localStorage.removeItem("spotifyAccessToken");
          localStorage.removeItem("spotifyUserId");
          setAccessToken("");
          navigate("/");
          return [];
        }
        throw new Error("Failed to fetch playlist tracks");
      }

      const data = await response.json();
      allTracks = [...allTracks, ...data.items];
      fetched += data.items.length;
      setProgress(Math.min(100, Math.round((fetched / total) * 100)));
      nextUrl = data.next;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    return allTracks;
  };

  /* === FETCH ARTIST DETAILS === */
  const fetchArtistDetails = async (artistId) => {
    try {
      const response = await fetchWithCorsProxy(
        `https://api.spotify.com/v1/artists/${artistId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error("Error fetching artist:", error);
    }
    return null;
  };

  /* === LA MOUNT: verifica token === */
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      const token = new URLSearchParams(hash.replace("#", "?")).get(
        "access_token"
      );
      if (token) {
        setAccessToken(token);
        localStorage.setItem("spotifyAccessToken", token);
        window.location.hash = "";
      }
    } else {
      const storedToken = localStorage.getItem("spotifyAccessToken");
      if (storedToken) setAccessToken(storedToken);
    }
  }, []);

  return (
    <div className="p-6 flex flex-col items-center">
      {!accessToken ? (
        <button
          onClick={handleLogin}
          className="px-6 py-3 bg-green-500 text-white rounded-lg shadow-lg hover:bg-green-600 transition"
        >
          Login with Spotify
        </button>
      ) : (
        <div className="w-full max-w-md">
          <p className="text-center text-lg font-semibold mb-4">
            Ai {totalTracks} melodii în playlist. Progress: {progress}%
          </p>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-green-500 h-4 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
