import styles from "./artisti.module.css";

export function Artisti() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>MELODY LAB</h1>
        <div className={styles.logoContainer}>
          <img src="/logo.png" alt="Spotify Logo" className={styles.logo} />
        </div>
      </header>

      <h2 className={styles.mainHeading}>ARTISTI TAI INDRAGITI</h2>

      <div className={styles.tableContainer}>
        {/* Header-ul tabelului */}
        <div className={styles.tableHeader}>Fete</div>
        <div className={styles.tableHeader}>Baieti</div>
        <div className={styles.tableHeader}>DJ</div>
        <div className={styles.tableHeader}>Rapari/Trapari</div>
        <div className={styles.tableHeader}>Trupe</div>
        <div className={styles.tableHeader}>Coloana Sonora</div>
        <div className={styles.tableHeader}>Artisti cu o piesa in playlist</div>

        {/* Secțiunea de conținut, care va conține liniile verticale care merg până jos */}
        <div className={styles.tableContentCell}></div>
        <div className={styles.tableContentCell}></div>
        <div className={styles.tableContentCell}></div>
        <div className={styles.tableContentCell}></div>
        <div className={styles.tableContentCell}></div>
        <div className={styles.tableContentCell}></div>
        <div className={styles.tableContentCell}></div>
      </div>
    </div>
  );
}
