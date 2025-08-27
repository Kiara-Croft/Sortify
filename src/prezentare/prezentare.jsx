import styles from "./prezentare.module.css";

export function Prezentare() {
  const authEndpoint = "https://accounts.spotify.com/authorize";
  // ⚡ Modifică aici Client ID-ul și redirect URI-ul
  const clientId = ""; // Pune Client ID-ul tău de la Spotify
  const redirectUri = "https://melody-lab.netlify.app/callback"; // Redirect-ul tău Netlify
  const scopes = [
    "playlist-read-private",
    "user-library-read",
    "playlist-modify-private",
    "playlist-modify-public",
  ];

  const loginUrl = `${authEndpoint}?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${scopes.join("%20")}&response_type=code&show_dialog=true`;

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <div className={styles.card}>
          <div className={styles.titleContainer}>
            <p>PREIA CONTROLUL</p>
            <p>ASUPRA PLAYLISTURILOR</p>
            <p>TALE CU MELODY LAB</p>
          </div>
          <button
            className={styles.loginButton}
            onClick={() => {
              console.log("LOGIN CLICK"); // test să vedem dacă apasă
              window.location.href = loginUrl;
            }}
          >
            LOGIN CU CONTUL DE SPOTIFY
          </button>
        </div>
        <div className={styles.playerSection}>
          <div className={styles.header}>
            <h2 className={styles.logoText}>MELODY LAB</h2>
            <img
              src="/logo.png"
              alt="Melody Lab Logo"
              className={styles.logoImage}
            />
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressKnob}></div>
          </div>
          <div className={styles.controls}>
            <span className={styles.icon}>&times;</span>
            <span className={styles.icon}>&lt;&lt;</span>
            <span className={`${styles.icon} ${styles.playButton}`}>
              &#9658;
            </span>
            <span className={styles.icon}>&gt;&gt;</span>
            <span className={styles.icon}>&#x239A;</span>
          </div>
          <div className={styles.soundWave}>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
