import styles from "./tabel.module.css";

export function Tabel() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>MELODY LAB</h1>
        <div className={styles.logoContainer}>
          <img src="/logo.png" alt="Melody Lab Logo" className={styles.logo} />
        </div>
      </header>
      <main>
        <h2 className={styles.mainTitle}>TABELUL CU PIESELE FRUMOS ARANJATE</h2>
        <div className={styles.tableContainer}>
          <div className={styles.tableHeader}>
            <div className={styles.column}>ARTISTUL</div>
            <div className={styles.column}>ALBUMUL</div>
            <div className={styles.column}>PIESA</div>
            <div className={styles.column}>ASCULTARI</div>
          </div>
        </div>
      </main>
    </div>
  );
}
