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
  const [artistDetails, setArtistDetails] = useState({});

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
      navigate("/");
    }
  }, [accessToken, navigate]);

  // Funcție pentru a obține detalii despre artist de la Spotify
  const fetchArtistDetails = async (artistId) => {
    if (!accessToken || artistDetails[artistId]) return;

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/artists/${artistId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setArtistDetails((prev) => ({ ...prev, [artistId]: data }));
      }
    } catch (error) {
      console.error("Error fetching artist details:", error);
    }
  };

  // Funcție pentru a obține playlistul de pe Spotify
  const fetchPlaylist = async () => {
    if (!accessToken) return;

    setIsLoading(true);
    try {
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

      // Obține toate melodiile (paginate)
      let allTracks = [...data.tracks.items];
      if (data.tracks.next) {
        let nextUrl = data.tracks.next;
        while (nextUrl) {
          const nextResponse = await fetch(nextUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (nextResponse.ok) {
            const nextData = await nextResponse.json();
            allTracks = [...allTracks, ...nextData.items];
            nextUrl = nextData.next;
          } else {
            nextUrl = null;
          }
        }
      }

      sortTracks(allTracks);
    } catch (error) {
      console.error("Error fetching playlist:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Listă de artiști feminini cunoscuți (poți extinde lista)
  const femaleArtists = [
    "beyonce",
    "rihanna",
    "taylor swift",
    "lady gaga",
    "adele",
    "ariana grande",
    "dua lipa",
    "billie eilish",
    "doja cat",
    "halsey",
    "miley cyrus",
    "selena gomez",
    "shakira",
    "nicki minaj",
    "cardi b",
    "megan thee stallion",
    "lizzo",
    "sza",
    "anne-marie",
    "ava max",
    "camila cabello",
    "dua lipa",
    "ellie goulding",
    "halsey",
    "jessie j",
    "katy perry",
    "kesha",
    "pink",
    "rita ora",
    "anne marie",
  ];

  // Listă de DJs (poți extinde lista)
  const djs = [
    "david guetta",
    "calvin harris",
    "tiësto",
    "martin garrix",
    "armin van buuren",
    "afrojack",
    "hardwell",
    "steve aoki",
    "kygo",
    "avicii",
    "alan walker",
    "dj snake",
    "major lazer",
    "zedd",
    "skrillex",
    "diplo",
    "alok",
    "don diablo",
    "kSHMR",
    "vicetone",
  ];

  // Listă de rap/trap artists (poți extinde lista)
  const rappers = [
    "eminem",
    "kendrick lamar",
    "drake",
    "kanye west",
    "jay-z",
    "travis scott",
    "post malone",
    "j. cole",
    "lil wayne",
    "nicki minaj",
    "cardi b",
    "snoop dogg",
    "ice cube",
    "50 cent",
    "future",
    "migos",
    "lil baby",
    "da baby",
    "tyga",
    "asap rocky",
    "lil uzi vert",
    "playboi carti",
    "roddy ricch",
    "meek mill",
  ];

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
      if (item.track && item.track.artists && item.track.artists.length > 0) {
        const artistId = item.track.artists[0].id;
        artistTrackCount[artistId] = (artistTrackCount[artistId] || 0) + 1;

        // Obține detalii despre artist
        fetchArtistDetails(artistId);
      }
    });

    // Sortare în categorii
    tracks.forEach((item) => {
      if (!item.track || !item.track.artists || item.track.artists.length === 0)
        return;

      const track = item.track;
      const artist = track.artists[0];
      const artistId = artist.id;
      const artistName = artist.name.toLowerCase();

      // Determină categoria bazată pe numele artistului și alte criterii
      let category = "unsorted";

      if (femaleArtists.some((female) => artistName.includes(female))) {
        category = "female";
      } else if (
        djs.some(
          (dj) => artistName.includes(dj) || artistName.startsWith("dj ")
        )
      ) {
        category = "dj";
      } else if (rappers.some((rapper) => artistName.includes(rapper))) {
        category = "rapper";
      } else if (
        artistName.includes("band") ||
        artistName.includes("trupa") ||
        artistName.includes("&") ||
        artistName.includes("and the") ||
        (track.artists.length > 1 && !artistName.includes("feat"))
      ) {
        category = "band";
      } else if (artistTrackCount[artistId] === 1) {
        category = "unsorted";
      } else {
        // Presupunem că este băiat dacă nu s-a încadrat în alte categorii
        category = "male";
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
          {Object.keys(categories).map(
            (category) =>
              sortedTracks[category].length > 0 && (
                <div key={category} className={styles.category}>
                  <h3 className={styles.categoryTitle}>
                    {categories[category]} ({sortedTracks[category].length})
                  </h3>
                  <div className={styles.artistsList}>
                    {sortedTracks[category].map((artistData) => (
                      <div
                        key={artistData.artist.id}
                        className={styles.artistItem}
                      >
                        <div
                          className={styles.artistName}
                          onClick={() =>
                            toggleArtist(category, artistData.artist.id)
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
              )
          )}
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
