import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./artisti.module.css";

export function Artisti() {
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("spotifyAccessToken") || ""
  );
  const [playlist, setPlaylist] = useState(null);
  const [sortedTracks, setSortedTracks] = useState(null);
  const [expandedArtist, setExpandedArtist] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Categorii predefinite
  const categories = {
    female: "Fete",
    male: "Baieti",
    dj: "DJ",
    rapper: "Rapari/Trapari",
    band: "Trupe",
    soundtrack: "Coloana Sonora",
    unsorted: "Artisti cu o piesa in playlist",
  };

  // Verifică dacă avem token de acces
  useEffect(() => {
    if (!accessToken) {
      // Dacă nu avem token, redirecționăm către login
      navigate("/");
    }
  }, [accessToken, navigate]);

  // Funcție pentru a obține playlistul de pe Spotify
  const fetchPlaylist = async () => {
    if (!accessToken) return;

    setIsLoading(true);
    try {
      // Folosim ID-ul playlistului tău
      const playlistId = "3aUY5hCQoliumlMGmFB3E4";
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch playlist");
      }

      const data = await response.json();
      setPlaylist(data);
      sortTracks(data.tracks.items);
    } catch (error) {
      console.error("Error fetching playlist:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Funcție pentru a sorta melodiile în categorii
  const sortTracks = (tracks) => {
    const sorted = {
      female: {},
      male: {},
      dj: {},
      rapper: {},
      band: {},
      soundtrack: {},
      unsorted: {},
    };

    // Verifică dacă artistul are mai multe piese
    const artistTrackCount = {};
    tracks.forEach((item) => {
      const artistId = item.track.artists[0].id;
      artistTrackCount[artistId] = (artistTrackCount[artistId] || 0) + 1;
    });

    // Sortare în categorii
    tracks.forEach((item) => {
      const track = item.track;
      const artist = track.artists[0];
      const artistId = artist.id;

      // Determină categoria bazată pe genul artistului (aici ar trebui logica ta specifică)
      // Pentru demo, folosim o logică simplă de determinare
      let category = "unsorted";

      if (
        artist.name.includes("DJ") ||
        artist.name.includes("Dj") ||
        artist.name.includes("dj")
      ) {
        category = "dj";
      } else if (artistTrackCount[artistId] === 1) {
        category = "unsorted";
      } else {
        // Aici ai nevoie de o logică mai complexă pentru a determina genul artistului
        // Poți folosi API-ul Spotify pentru detalii artist sau să folosești o listă predefinită
        category = "male"; // Valoare implicită pentru demo
      }

      if (!sorted[category][artistId]) {
        sorted[category][artistId] = {
          artist: artist,
          tracks: [],
        };
      }

      sorted[category][artistId].tracks.push(track);
    });

    // Sortare alfabetică artiști în fiecare categorie
    Object.keys(sorted).forEach((category) => {
      const artistsArray = Object.values(sorted[category]);
      artistsArray.sort((a, b) => a.artist.name.localeCompare(b.artist.name));
      sorted[category] = artistsArray;
    });

    setSortedTracks(sorted);
  };

  // Funcție pentru a deschide/închide lista de piese a unui artist
  const toggleArtist = (category, artistId) => {
    const key = `${category}-${artistId}`;
    if (expandedArtist === key) {
      setExpandedArtist(null);
    } else {
      setExpandedArtist(key);
    }
  };

  // Funcție pentru deconectare
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

      {!playlist && !isLoading && (
        <div className={styles.placeholder}>
          <p>Apasă "Încarcă Playlist" pentru a vedea melodiile sortate</p>
        </div>
      )}

      {isLoading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Se încarcă playlist-ul...</p>
        </div>
      )}

      {sortedTracks ? (
        <div className={styles.sortedContainer}>
          {Object.keys(categories).map((category) => (
            <div key={category} className={styles.category}>
              <h3 className={styles.categoryTitle}>{categories[category]}</h3>
              <div className={styles.artistsList}>
                {sortedTracks[category].map((artistData) => (
                  <div key={artistData.artist.id} className={styles.artistItem}>
                    <div
                      className={styles.artistName}
                      onClick={() =>
                        toggleArtist(category, artistData.artist.id)
                      }
                    >
                      {artistData.artist.name}
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
                          <div key={track.id} className={styles.track}>
                            {track.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.tableContainer}>
          {/* Header-ul tabelului */}
          <div className={styles.tableHeader}>Fete</div>
          <div className={styles.tableHeader}>Baieti</div>
          <div className={styles.tableHeader}>DJ</div>
          <div className={styles.tableHeader}>Rapari/Trapari</div>
          <div className={styles.tableHeader}>Trupe</div>
          <div className={styles.tableHeader}>Coloana Sonora</div>
          <div className={styles.tableHeader}>
            Artisti cu o piesa in playlist
          </div>

          {/* Secțiunea de conținut, care va conține liniile verticale care merg până jos */}
          <div className={styles.tableContentCell}></div>
          <div className={styles.tableContentCell}></div>
          <div className={styles.tableContentCell}></div>
          <div className={styles.tableContentCell}></div>
          <div className={styles.tableContentCell}></div>
          <div className={styles.tableContentCell}></div>
          <div className={styles.tableContentCell}></div>
        </div>
      )}
    </div>
  );
}
