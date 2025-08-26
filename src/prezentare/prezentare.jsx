import styles from "./prezentare.module.css";

export function Prezentare() {
  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <div className={styles.card}>
          <div className={styles.titleContainer}>
            <p>PREIA CONTROLUL</p>
            <p>ASUPRA PLAYLISTURILOR</p>
            <p>TALE CU MELODY LAB</p>
          </div>
          <button className={styles.loginButton}>
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
