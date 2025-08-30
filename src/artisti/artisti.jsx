import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Configurație Spotify
const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID || "your-client-id";
const SPOTIFY_REDIRECT_URI = process.env.REACT_APP_SPOTIFY_REDIRECT_URI || "http://localhost:3000";
const SPOTIFY_SCOPES = "user-read-email user-read-private playlist-read-private playlist-read-collaborative";

export default function Artisti() {
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState("");
  const [spotifyUserId, setSpotifyUserId] = useState("");
  const [progress, setProgress] = useState(0);
  const [totalTracks, setTotalTracks] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  /* === LOGIN === */
  const handleLogin = () => {
    if (!SPOTIFY_CLIENT_ID || SPOTIFY_CLIENT_ID === "your-client-id") {
      setError("Configurația Spotify lipsește. Verifică variabilele de environment.");
      return;
    }

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      SPOTIFY_REDIRECT_URI
    )}&scope=${encodeURIComponent(SPOTIFY_SCOPES)}&response_type=token&show_dialog=true`;
    
    window.location.href = authUrl;
  };

  /* === FETCH WRAPPER ÎMBUNĂTĂȚIT === */
  const fetchWithRetry = async (url, options = {}, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          return response;
        } else if (response.status === 401) {
          // Token expirat
          handleTokenExpired();
          throw new Error("Token expired");
        } else if (response.status === 429) {
          // Rate limit - așteaptă și încearcă din nou
          const retryAfter = response.headers.get('Retry-After') || '1';
          await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000));
          continue;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
      }
    }
  };

  /* === HANDLE TOKEN EXPIRED === */
  const handleTokenExpired = () => {
    localStorage.removeItem("spotifyAccessToken");
    localStorage.removeItem("spotifyUserId");
    setAccessToken("");
    setError("Token-ul a expirat. Te rog să te conectezi din nou.");
  };

  /* === FETCH USER INFO === */
  const fetchUserInfo = async () => {
    try {
      const response = await fetchWithRetry(
        "https://api.spotify.com/v1/me",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response?.ok) {
        const userData = await response.json();
        setSpotifyUserId(userData.id);
        localStorage.setItem("spotifyUserId", userData.id);
        return userData.id;
      }
    } catch (err) {
      console.error("Error fetching user info:", err);
      setError("Nu s-au putut încărca informațiile utilizatorului");
    }
    return null;
  };

  /* === FETCH PLAYLIST TRACKS === */
  const fetchAllPlaylistTracks = async (playlistId) => {
    if (!playlistId) return [];
    
    setIsLoading(true);
    setError("");
    
    let allTracks = [];
    let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`;
    let fetched = 0;
    let total = 0;

    try {
      // Obținem totalul
      const initialResponse = await fetchWithRetry(
        `https://api.spotify.com/v1/playlists/${playlistId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (initialResponse?.ok) {
        const playlistData = await initialResponse.json();
        total = playlistData.tracks.total;
        setTotalTracks(total);
      }

      // Fetch paginat
      while (nextUrl) {
        const response = await fetchWithRetry(nextUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response?.ok) {
          const data = await response.json();
          allTracks = [...allTracks, ...data.items];
          fetched += data.items.length;
          setProgress(Math.min(100, Math.round((fetched / total) * 100)));
          nextUrl = data.next;

          // Rate limiting protection
          await new Promise((resolve) => setTimeout(resolve, 100));
        } else {
          break;
        }
      }

      setIsLoading(false);
      return allTracks;
    } catch (err) {
      console.error("Error fetching playlist tracks:", err);
      setError(`Eroare la încărcarea playlist-ului: ${err.message}`);
      setIsLoading(false);
      return [];
    }
  };

  /* === FETCH ARTIST DETAILS === */
  const fetchArtistDetails = async (artistId) => {
    if (!artistId) return null;
    
    try {
      const response = await fetchWithRetry(
        `https://api.spotify.com/v1/artists/${artistId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response?.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error("Error fetching artist:", error);
    }
    return null;
  };

  /* === TOKEN VALIDATION === */
  const validateToken = async (token) => {
    try {
      const response = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  /* === EFFECT PENTRU TOKEN === */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Verifică hash-ul pentru token nou
        const hash = window.location.hash;
        if (hash.includes("access_token")) {
          const params = new URLSearchParams(hash.replace("#", "?"));
          const token = params.get("access_token");
          
          if (token) {
            const isValid = await validateToken(token);
            if (isValid) {
              setAccessToken(token);
              localStorage.setItem("spotifyAccessToken", token);
              await fetchUserInfo();
            } else {
              setError("Token-ul primit nu este valid");
            }
            
            // Curăță URL-ul
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } else {
          // Verifică token-ul stocat
          const storedToken = localStorage.getItem("spotifyAccessToken");
          const storedUserId = localStorage.getItem("spotifyUserId");
          
          if (storedToken) {
            const isValid = await validateToken(storedToken);
            if (isValid) {
              setAccessToken(storedToken);
              if (storedUserId) {
                setSpotifyUserId(storedUserId);
              } else {
                await fetchUserInfo();
              }
            } else {
              // Token expirat
              localStorage.removeItem("spotifyAccessToken");
              localStorage.removeItem("spotifyUserId");
            }
          }
        }
      } catch (err) {
        console.error("Error initializing auth:", err);
        setError("Eroare la inițializarea autentificării");
      }
    };

    initializeAuth();
  }, []);

  /* === EFFECT PENTRU FETCH USER INFO === */
  useEffect(() => {
    if (accessToken && !spotifyUserId) {
      fetchUserInfo();
    }
  }, [accessToken]);

  return (
    <div className="p-6 flex flex-col items-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Sortify
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {!accessToken ? (
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Conectează-te la Spotify pentru a începe
            </p>
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full px-6 py-3 bg-green-500 text-white rounded-lg shadow-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Se încarcă..." : "Login cu Spotify"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-gray-600 mb-2">
                Conectat ca: <span className="font-semibold">{spotifyUserId}</span>
              </p>
              {totalTracks > 0 && (
                <p className="text-lg font-semibold mb-4">
                  {totalTracks} melodii în playlist
                </p>
              )}
            </div>

            {progress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progress:</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                localStorage.removeItem("spotifyAccessToken");
                localStorage.removeItem("spotifyUserId");
                setAccessToken("");
                setSpotifyUserId("");
                setProgress(0);
                setTotalTracks(0);
                setError("");
              }}
              className="w-full mt-4 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Deconectează-te
            </button>
          </div>
        )}
      </div>
    </div>
  );
}