"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./Navbar.module.css";
import {
    logout,
    getUsername,
    getRole,
} from "@/services/auth";

const menus = [
    {
        name: "Dashboard",
        icon: "📊",
        href: "/",
    },
    {
        name: "Projects",
        icon: "📁",
        href: "/projects",
    },
    {
        name: "Ad Editor",
        icon: "🎧",
        href: "/ad-editor",
    },
    {
        name: "Reports",
        icon: "📑",
        href: "/reports",
    },
    {
        name: "Settings",
        icon: "⚙️",
        href: "/settings",
    },
];

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);

    const [username, setUsername] = useState("Admin");
    const [role, setRole] = useState("Admin");

    /* ============================================================
       LOAD LOGGED-IN USER
    ============================================================ */

    useEffect(() => {
        const storedUsername = getUsername();
        const storedRole = getRole();

        if (storedUsername) {
            setUsername(storedUsername);
        }

        if (storedRole) {
            setRole(storedRole);
        }
    }, []);

    /* ============================================================
       LOGOUT
    ============================================================ */

    const handleLogout = () => {
        setMenuOpen(false);
        logout();
    };

    /* ============================================================
       USER INITIAL
    ============================================================ */

    const userInitial = username
        ? username.charAt(0).toUpperCase()
        : "A";

    return (
        <header className={styles.navbar}>

            <div className={styles.navbarInner}>

                {/* ==================================================
                    MENU BUTTON
                ================================================== */}

                <button
                    type="button"
                    className={styles.menuButton}
                    onClick={() =>
                        setMenuOpen((value) => !value)
                    }
                    aria-label={
                        menuOpen
                            ? "Close menu"
                            : "Open menu"
                    }
                    aria-expanded={menuOpen}
                >
                    {menuOpen ? "✕" : "☰"}
                </button>


                {/* ==================================================
                    LOGO
                ================================================== */}

                <Link
                    href="/"
                    className={styles.navbarLogo}
                    onClick={() => setMenuOpen(false)}
                >
                    <span>📻</span>

                    <span>
                        Radio Search
                    </span>
                </Link>


                {/* ==================================================
                    DESKTOP MENU
                ================================================== */}

                <nav className={styles.desktopMenu}>

                    {menus.map((menu) => (
                        <Link
                            key={menu.name}
                            href={menu.href}
                            className={styles.menuLink}
                        >
                            <span>
                                {menu.icon}
                            </span>

                            <span>
                                {menu.name}
                            </span>
                        </Link>
                    ))}

                </nav>


                {/* ==================================================
                    ADMIN / USER
                ================================================== */}

                <div className={styles.desktopAdmin}>

                    <div className={styles.adminInfo}>

                        {/* Avatar */}
                        <span
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                background: "#111827",
                                color: "#ffffff",
                                fontSize: "14px",
                                fontWeight: 600,
                            }}
                        >
                            {userInitial}
                        </span>

                        {/* Username + Role */}
                        <span
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                lineHeight: 1.2,
                            }}
                        >
                            <span>
                                {username}
                            </span>

                            <small
                                style={{
                                    fontSize: "11px",
                                    opacity: 0.6,
                                    textTransform: "capitalize",
                                }}
                            >
                                {role}
                            </small>
                        </span>

                    </div>


                    {/* Logout */}

                    <button
                        type="button"
                        className={styles.logoutButton}
                        onClick={handleLogout}
                    >
                        <span>🚪</span>

                        <span>
                            Logout
                        </span>
                    </button>

                </div>

            </div>


            {/* ======================================================
                MOBILE MENU
            ====================================================== */}

            {menuOpen && (
                <div className={styles.menuPanel}>

                    {menus.map((menu) => (
                        <Link
                            key={menu.name}
                            href={menu.href}
                            className={styles.menuPanelLink}
                            onClick={() =>
                                setMenuOpen(false)
                            }
                        >
                            <span>
                                {menu.icon}
                            </span>

                            <span>
                                {menu.name}
                            </span>
                        </Link>
                    ))}


                    {/* ==================================================
                        MOBILE USER
                    ================================================== */}

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "14px 16px",
                            borderTop: "1px solid rgba(0,0,0,0.08)",
                            borderBottom: "1px solid rgba(0,0,0,0.08)",
                        }}
                    >

                        <span
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "34px",
                                height: "34px",
                                borderRadius: "50%",
                                background: "#111827",
                                color: "#ffffff",
                                fontSize: "14px",
                                fontWeight: 600,
                            }}
                        >
                            {userInitial}
                        </span>

                        <span
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                lineHeight: 1.2,
                            }}
                        >
                            <span
                                style={{
                                    fontWeight: 600,
                                }}
                            >
                                {username}
                            </span>

                            <small
                                style={{
                                    fontSize: "11px",
                                    opacity: 0.6,
                                    textTransform: "capitalize",
                                }}
                            >
                                {role}
                            </small>
                        </span>

                    </div>


                    {/* ==================================================
                        MOBILE LOGOUT
                    ================================================== */}

                    <button
                        type="button"
                        className={styles.mobileLogout}
                        onClick={handleLogout}
                    >
                        <span>
                            🚪
                        </span>

                        <span>
                            Logout
                        </span>
                    </button>

                </div>
            )}

        </header>
    );
}