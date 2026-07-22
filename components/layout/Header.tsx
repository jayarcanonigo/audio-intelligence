"use client";

import styles from "./Header.module.css";

type HeaderProps = {
  onToggle?: () => void;
};

export default function Header({ onToggle }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button
          className={styles.menuBtn}
          onClick={onToggle}
        >
          ☰
        </button>

        <h2>📻 Radio Search Dashboard</h2>
      </div>

      <div className={styles.right}>
        👤 Admin
      </div>
    </header>
  );
}
