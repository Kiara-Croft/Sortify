import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import styles from "./artisti.module.css";

// CONFIGURARE SPOTIFY
const SPOTIFY_CLIENT_ID = "5c850d0891ff424abb1f7816057eee8f";
const SPOTIFY_REDIRECT_URI = "https://melody-lab.netlify.app/callback";
const SPOTIFY_SCOPES = [
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-read-private",
  "user-read-email",
].join("%20");

// Funcție mică pentru reordonare
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

// Funcție proxy pentru a evita CORS
const fetchWithCorsProxy = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) return response;

    const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
    const proxyResponse = await fetch(proxyUrl, {
      ...options,
      headers: {
        ...options.headers,
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    return proxyResponse;
  } catch (error) {
    console.error("Eroare la fetch:", error);
    throw error;
  }
};

export function Artisti() {
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("spotifyAccessToken") || ""
  );
  const [playlist, setPlaylist] = useState(null);
  const [sortedTracks, setSortedTracks] = useState(null);
  const [expandedArtist, setExpandedArtist] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalTracks, setTotalTracks] = useState(0);

  const categories = {
    female: "Fete",
    male: "Baieti",
    dj: "DJ",
    rapper: "Rapari/Trapari",
    band: "Trupe",
    soundtrack: "Coloana Sonora",
    unsorted: "Artisti cu o piesa in playlist",
  };

  // Verifică token și autentificare
  useEffect(() => {
    const hash = window.location.hash;
    let token = localStorage.getItem("spotifyAccessToken");

    if (!token && hash) {
      token = hash
        .substring(1)
        .split("&")
        .find((elem) => elem.startsWith("access_token"))
        .split("=")[1];

      if (token) {
        localStorage.setItem("spotifyAccessToken", token);
        setAccessToken(token);
        window.location.hash = "";
      }
    }

    if (!token) {
      navigate("/");
    } else if (!accessToken) {
      setAccessToken(token);
    }
  }, [accessToken, navigate]);

  const handleLogin = () => {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      SPOTIFY_REDIRECT_URI
    )}&scope=${SPOTIFY_SCOPES}&response_type=token&show_dialog=true`;
    window.location.href = authUrl;
  };

  const fetchAllPlaylistTracks = async (playlistId) => {
    let allTracks = [];
    let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`;
    let fetched = 0;
    let total = 0;

    const initialResponse = await fetchWithCorsProxy(
      `https://api.spotify.com/v1/playlists/${playlistId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (initialResponse.ok) {
      const playlistData = await initialResponse.json();
      total = playlistData.tracks.total;
      setTotalTracks(total);
    }

    while (nextUrl) {
      const response = await fetchWithCorsProxy(nextUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("spotifyAccessToken");
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

  const fetchArtistDetails = async (artistId) => {
    try {
      const response = await fetchWithCorsProxy(
        `https://api.spotify.com/v1/artists/${artistId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.ok) return await response.json();
    } catch (error) {
      console.error("Error fetching artist:", error);
    }
    return null;
  };

  const determineArtistCategory = (artistName, genres, trackCount) => {
    const name = artistName.toLowerCase();
    if (name.includes("dj ") || name.startsWith("dj") || name.endsWith("dj"))
      return "dj";
    if (genres && genres.length > 0) {
      const genreStr = genres.join(" ").toLowerCase();
      if (
        genreStr.includes("rap") ||
        genreStr.includes("hip hop") ||
        genreStr.includes("trap") ||
        genreStr.includes("drill")
      )
        return "rapper";
    }
    if (
      name.includes("&") ||
      name.includes(" and ") ||
      name.includes(" vs ") ||
      name.includes(" x ") ||
      name.includes("+") ||
      name.includes(",") ||
      name.includes("band") ||
      name.includes("crew") ||
      name.includes("collective") ||
      name.includes("project") ||
      name.includes("group") ||
      name.includes("trupa")
    )
      return "band";
    if (
      name.includes("soundtrack") ||
      name.includes("score") ||
      name.includes("original") ||
      name.includes("motion picture")
    )
      return "soundtrack";
    if (trackCount === 1) return "unsorted";
    if (genres && genres.length > 0) {
      const genreStr = genres.join(" ").toLowerCase();
      if (
        genreStr.includes("pop") ||
        genreStr.includes("r&b") ||
        genreStr.includes("soul") ||
        genreStr.includes("latin") ||
        genreStr.includes("dance pop") ||
        genreStr.includes("electropop")
      )
        return "female";
      if (
        genreStr.includes("rock") ||
        genreStr.includes("metal") ||
        genreStr.includes("indie") ||
        genreStr.includes("alternative") ||
        genreStr.includes("edm") ||
        genreStr.includes("electronic")
      )
        return "male";
    }
    return "male";
  };

  // --- FETCH PLAYLIST + LOAD ORDINE DIN BACKEND ---
  const fetchPlaylist = async () => {
    if (!accessToken) {
      handleLogin();
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setTotalTracks(0);

    try {
      const playlistId = "3aUY5hCQoliumlMGmFB3E4";
      const allTracks = await fetchAllPlaylistTracks(playlistId);

      if (allTracks.length === 0)
        throw new Error("Nu s-au putut obține melodiile din playlist");

      const sorted = {
        female: {},
        male: {},
        dj: {},
        rapper: {},
        band: {},
        soundtrack: {},
        unsorted: {},
      };

      const artistCache = {};
      const artistTrackCount = {};

      allTracks.forEach((item) => {
        if (item.track && item.track.artists && item.track.artists.length > 0) {
          const artistId = item.track.artists[0].id;
          artistTrackCount[artistId] = (artistTrackCount[artistId] || 0) + 1;
        }
      });

      for (let i = 0; i < allTracks.length; i++) {
        const item = allTracks[i];
        setProgress(Math.round((i / allTracks.length) * 100));

        if (
          !item.track ||
          !item.track.artists ||
          item.track.artists.length === 0
        )
          continue;

        const track = item.track;
        const artist = track.artists[0];
        const artistId = artist.id;
        const trackCount = artistTrackCount[artistId] || 0;

        if (!artistCache[artistId]) {
          artistCache[artistId] = await fetchArtistDetails(artistId);
          await new Promise((resolve) => setTimeout(resolve, 20));
        }

        const artistDetails = artistCache[artistId];
        const genres = artistDetails ? artistDetails.genres : [];

        let category = determineArtistCategory(artist.name, genres, trackCount);

        if (!sorted[category][artistId])
          sorted[category][artistId] = { artist: artist, tracks: [] };

        sorted[category][artistId].tracks.push(track);
      }

      Object.keys(sorted).forEach((category) => {
        const artistsArray = Object.values(sorted[category]);
        artistsArray.sort((a, b) => a.artist.name.localeCompare(b.artist.name));
        sorted[category] = artistsArray;
      });

      // 🔹 Încarcă ordinea din backend
      const spotifyUserId = localStorage.getItem("spotifyUserId"); // trebuie să-l ai deja salvat
      if (spotifyUserId) {
        const res = await fetch(
          `https://backend-tau.onrender.com/getOrder/${spotifyUserId}`
        );
        if (res.ok) {
          const savedOrder = await res.json();
          Object.keys(savedOrder).forEach((cat) => {
            if (sorted[cat]) {
              sorted[cat].sort(
                (a, b) =>
                  savedOrder[cat].indexOf(a.artist.id) -
                  savedOrder[cat].indexOf(b.artist.id)
              );
            }
          });
        }
      }

      setSortedTracks(sorted);
      setProgress(100);
    } catch (error) {
      console.error("Eroare la încărcarea playlist-ului:", error);
      alert("Eroare: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- DRAG & DROP ---
  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const sourceCategory = result.source.droppableId;
    const destCategory = result.destination.droppableId;
    const newSorted = { ...sortedTracks };

    if (sourceCategory === destCategory) {
      newSorted[sourceCategory] = reorder(
        sortedTracks[sourceCategory],
        result.source.index,
        result.destination.index
      );
    } else {
      const [movedArtist] = newSorted[sourceCategory].splice(
        result.source.index,
        1
      );
      newSorted[destCategory].splice(result.destination.index, 0, movedArtist);
    }

    setSortedTracks(newSorted);

    // 🔹 Salvează ordinea în backend
    const orderToSave = {};
    Object.keys(newSorted).forEach((cat) => {
      orderToSave[cat] = newSorted[cat].map((a) => a.artist.id);
    });

    const spotifyUserId = localStorage.getItem("spotifyUserId");
    if (spotifyUserId) {
      await fetch(`https://backend-tau.onrender.com/saveOrder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotifyUserId, order: orderToSave }),
      });
    }
  };

  const toggleArtist = (category, artistId) => {
    const key = `${category}-${artistId}`;
    setExpandedArtist(expandedArtist === key ? null : key);
  };

  const handleLogout = () => {
    localStorage.removeItem("spotifyAccessToken");
    setAccessToken("");
  };

  const handleNavigateToTabel = () => {
    navigate("/tabel");
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>MELODY LAB</h1>
        <div className={styles.logoContainer}>
          <img src="/logo.png" alt="Spotify Logo" className={styles.logo} />
        </div>

        <div className={styles.headerButtons}>
          <button
            className={styles.spotifyButton}
            onClick={fetchPlaylist}
            disabled={isLoading}
          >
            {isLoading ? "Se încarcă..." : "Încarcă Playlist"}
          </button>
          <button className={styles.logoutButton} onClick={handleLogout}>
            Deconectare
          </button>
        </div>
      </header>

      <h2 className={styles.mainHeading}>ARTISTI TAI INDRAGITI</h2>

      <div className={styles.buttonContainer}>
        <button
          className={styles.navigationButton}
          onClick={handleNavigateToTabel}
        >
          Vezi Tabelul
        </button>
      </div>

      {isLoading && (
        <div className={styles.loading}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p>Se încarcă playlist-ul... {progress}%</p>
          <p>Procesez {totalTracks} piese...</p>
        </div>
      )}

      {!isLoading && !sortedTracks && (
        <div className={styles.placeholder}>
          <p>Apasă "Încarcă Playlist" pentru a vedea melodiile sortate</p>
        </div>
      )}

      {sortedTracks && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className={styles.sortedContainer}>
            {Object.keys(categories).map(
              (category) =>
                sortedTracks[category] &&
                sortedTracks[category].length > 0 && (
                  <div key={category} className={styles.category}>
                    <h3 className={styles.categoryTitle}>
                      {categories[category]} ({sortedTracks[category].length})
                    </h3>

                    <Droppable droppableId={category}>
                      {(provided) => (
                        <div
                          className={styles.artistsList}
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >
                          {sortedTracks[category].map((artistData, index) => (
                            <Draggable
                              key={artistData.artist.id}
                              draggableId={artistData.artist.id}
                              index={index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={styles.artistItem}
                                >
                                  <div
                                    className={styles.artistName}
                                    onClick={() =>
                                      toggleArtist(
                                        category,
                                        artistData.artist.id
                                      )
                                    }
                                  >
                                    {artistData.artist.name}
                                    <span className={styles.trackCount}>
                                      ({artistData.tracks.length})
                                    </span>
                                    <span className={styles.toggleIcon}>
                                      {expandedArtist ===
                                      `${category}-${artistData.artist.id}`
                                        ? "▲"
                                        : "▼"}
                                    </span>
                                  </div>

                                  {expandedArtist ===
                                    `${category}-${artistData.artist.id}` && (
                                    <div className={styles.tracksList}>
                                      {artistData.tracks.map((track) => (
                                        <div
                                          key={track.id}
                                          className={styles.track}
                                        >
                                          {track.name}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                )
            )}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}
