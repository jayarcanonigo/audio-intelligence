"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./Navbar.module.css";

const menus = [
  { name: "Dashboard", icon: "📊", href: "/" },
  { name: "Projects", icon: "📁", href: "/projects" },
  { name: "Ad Editor", icon: "🎧", href: "/ad-editor" },
  { name: "Reports", icon: "📑", href: "/reports" },
  { name: "Settings", icon: "⚙️", href: "/settings" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={styles.navbar}>

      <div className={styles.navbarInner}>

        {/* MENU BUTTON */}
        <button
          type="button"
          className={styles.menuButton}
          onClick={() => setMenuOpen((value) => !value)}
          aria-label="Toggle menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        {/* LOGO */}
        <Link
          href="/"
          className={styles.navbarLogo}
          onClick={() => setMenuOpen(false)}
        >
          <span>📻</span>
          <span>Radio Search</span>
        </Link>

        {/* DESKTOP MENU */}
        <nav className={styles.desktopMenu}>
          {menus.map((menu) => (
            <Link
              key={menu.name}
              href={menu.href}
              className={styles.menuLink}
            >
              <span>{menu.icon}</span>
              <span>{menu.name}</span>
            </Link>
          ))}
        </nav>

        {/* ADMIN */}
        <div className={styles.desktopAdmin}>
          <span>👤</span>
          <span>Admin</span>
        </div>

      </div>

      {/* DROPDOWN MENU */}
      {menuOpen && (
        <div className={styles.menuPanel}>

          {menus.map((menu) => (
            <Link
              key={menu.name}
              href={menu.href}
              className={styles.menuPanelLink}
              onClick={() => setMenuOpen(false)}
            >
              <span>{menu.icon}</span>
              <span>{menu.name}</span>
            </Link>
          ))}

        </div>
      )}

    </header>
  );
}