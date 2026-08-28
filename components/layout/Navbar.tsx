
"use client";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import Link from "next/link";

import styles from "./Navbar.module.css";

import {
    logout,
    getUsername,
    getRole,
} from "@/services/auth";

import { getWallet } from "@/services/wallet";

// ============================================================
// API
// ============================================================

const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";

// ============================================================
// MENUS
// ============================================================

const menus = [
    {
        name: "Dashboard",
        icon: "📊",
        href: "/dashboard",
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

// ============================================================
// NAVBAR
// ============================================================

export default function Navbar() {

    // ========================================================
    // HYDRATION
    // ========================================================

    const [mounted, setMounted] =
        useState(false);

    // ========================================================
    // MENU
    // ========================================================

    const [menuOpen, setMenuOpen] =
        useState(false);

    // ========================================================
    // USER
    // ========================================================

    const [username, setUsername] =
        useState("Admin");

    const [role, setRole] =
        useState("Admin");

    // ========================================================
    // WALLET
    // ========================================================

    const [balance, setBalance] =
        useState<number | null>(null);

    const [balanceLoading, setBalanceLoading] =
        useState(false);

    // ========================================================
    // BETA
    // ========================================================

    const [betaEnabled, setBetaEnabled] =
        useState(false);

    const [betaLoading, setBetaLoading] =
        useState(false);

    // ========================================================
    // GET TOKEN
    // ========================================================

    const getToken = useCallback((): string | null => {

        if (typeof window === "undefined") {
            return null;
        }

        return localStorage.getItem(
            "access_token"
        );

    }, []);

    // ========================================================
    // LOAD BETA SETTING
    // ========================================================

    const loadBetaSetting = useCallback(
        async () => {

            const token = getToken();

            if (!token) {

                setBetaEnabled(false);
                setBetaLoading(false);

                return;
            }

            try {

                setBetaLoading(true);

                const response =
                    await fetch(
                        `${API_URL}/system/settings/beta`,
                        {
                            method: "GET",
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                                "Content-Type":
                                    "application/json",
                            },
                            cache: "no-store",
                        }
                    );

                if (!response.ok) {

                    setBetaEnabled(false);

                    return;
                }

                const data =
                    await response.json();

                const value =
                    String(
                        data?.value ??
                        data?.enabled ??
                        "false"
                    ).toLowerCase();

                const enabled =
                    value === "true" ||
                    value === "1" ||
                    value === "yes" ||
                    value === "on" ||
                    value === "enabled";

                setBetaEnabled(enabled);

            } catch (error) {

                console.error(
                    "Failed to load beta setting:",
                    error
                );

                setBetaEnabled(false);

            } finally {

                setBetaLoading(false);

            }

        },
        [getToken]
    );

    // ========================================================
    // LOAD WALLET
    // ========================================================

    const loadWallet = useCallback(
        async () => {

            const token = getToken();

            if (!token) {

                setBalance(null);
                setBalanceLoading(false);

                return;
            }

            try {

                setBalanceLoading(true);

                const wallet =
                    await getWallet();

                setBalance(
                    Number(
                        wallet.balance ?? 0
                    )
                );

            } catch (error) {

                console.error(
                    "Failed to load wallet:",
                    error
                );

                setBalance(null);

            } finally {

                setBalanceLoading(false);

            }

        },
        [getToken]
    );

    // ========================================================
    // INITIAL LOAD
    // ========================================================

    useEffect(() => {

        /*
         * This runs ONLY on the client after hydration.
         *
         * localStorage is never accessed during
         * the initial server render.
         */

        setMounted(true);

        const storedUsername =
            getUsername();

        const storedRole =
            getRole();

        if (storedUsername) {

            setUsername(
                storedUsername
            );

        }

        if (storedRole) {

            setRole(
                storedRole
            );

        }

        loadBetaSetting();

    }, [
        loadBetaSetting,
    ]);

    // ========================================================
    // LOAD WALLET AFTER BETA CHECK
    // ========================================================

    useEffect(() => {

        if (!mounted) {
            return;
        }

        if (betaLoading) {
            return;
        }

        if (betaEnabled) {

            setBalance(null);
            setBalanceLoading(false);

            return;
        }

        loadWallet();

    }, [
        mounted,
        betaEnabled,
        betaLoading,
        loadWallet,
    ]);

    // ========================================================
    // BETA UPDATED EVENT
    // ========================================================

    useEffect(() => {

        if (!mounted) {
            return;
        }

        const handleBetaUpdated =
            () => {

                loadBetaSetting();

            };

        window.addEventListener(
            "betaUpdated",
            handleBetaUpdated
        );

        return () => {

            window.removeEventListener(
                "betaUpdated",
                handleBetaUpdated
            );

        };

    }, [
        mounted,
        loadBetaSetting,
    ]);

    // ========================================================
    // WALLET UPDATED EVENT
    // ========================================================

    useEffect(() => {

        if (!mounted) {
            return;
        }

        const handleWalletUpdated =
            () => {

                if (betaEnabled) {
                    return;
                }

                loadWallet();

            };

        window.addEventListener(
            "walletUpdated",
            handleWalletUpdated
        );

        return () => {

            window.removeEventListener(
                "walletUpdated",
                handleWalletUpdated
            );

        };

    }, [
        mounted,
        betaEnabled,
        loadWallet,
    ]);

    // ========================================================
    // REFRESH WHEN TAB BECOMES ACTIVE
    // ========================================================

    useEffect(() => {

        if (!mounted) {
            return;
        }

        const handleVisibilityChange =
            () => {

                if (
                    document.visibilityState !==
                    "visible"
                ) {
                    return;
                }

                loadBetaSetting();

            };

        document.addEventListener(
            "visibilitychange",
            handleVisibilityChange
        );

        return () => {

            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );

        };

    }, [
        mounted,
        loadBetaSetting,
    ]);

    // ========================================================
    // WINDOW FOCUS
    // ========================================================

    useEffect(() => {

        if (!mounted) {
            return;
        }

        const handleFocus =
            () => {

                loadBetaSetting();

            };

        window.addEventListener(
            "focus",
            handleFocus
        );

        return () => {

            window.removeEventListener(
                "focus",
                handleFocus
            );

        };

    }, [
        mounted,
        loadBetaSetting,
    ]);

    // ========================================================
    // AUTO REFRESH
    // ========================================================
    //
    // IMPORTANT:
    // Removed the 10-second polling.
    //
    // This prevents:
    //
    // GET /system/settings/beta
    //
    // from being called every 10 seconds.
    //
    // The setting is refreshed on:
    //
    // 1. Initial page load
    // 2. Browser tab becoming visible
    // 3. Window focus
    // 4. betaUpdated event
    //
    // ========================================================

    // ========================================================
    // LOGOUT
    // ========================================================

    const handleLogout = () => {

        setMenuOpen(false);

        logout();

    };

    // ========================================================
    // USER INITIAL
    // ========================================================

    const userInitial =
        username
            ? username
                .charAt(0)
                .toUpperCase()
            : "A";

    // ========================================================
    // BALANCE DISPLAY
    // ========================================================

    const formattedBalance =
        balanceLoading
            ? "..."
            : `₱${(
                balance ?? 0
            ).toLocaleString(
                "en-PH",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }
            )}`;

    // ========================================================
    // RENDER
    // ========================================================

    return (

        <header
            className={
                styles.navbar
            }
        >

            <div
                className={
                    styles.navbarInner
                }
            >

                {/* ==================================================
                    MENU BUTTON
                ================================================== */}

                <button
                    type="button"
                    className={
                        styles.menuButton
                    }
                    onClick={() =>
                        setMenuOpen(
                            value => !value
                        )
                    }
                    aria-label={
                        menuOpen
                            ? "Close menu"
                            : "Open menu"
                    }
                    aria-expanded={
                        menuOpen
                    }
                >
                    {
                        menuOpen
                            ? "✕"
                            : "☰"
                    }
                </button>

                {/* ==================================================
                    LOGO
                ================================================== */}

                <Link
                    href="/dashboard"
                    className={
                        styles.navbarLogo
                    }
                    onClick={() =>
                        setMenuOpen(false)
                    }
                >

                    <span>
                        📻
                    </span>

                    <span>
                        Radio Search
                    </span>

                </Link>

                {/* ==================================================
                    DESKTOP MENU
                ================================================== */}

                <nav
                    className={
                        styles.desktopMenu
                    }
                >

                    {menus.map(
                        menu => (

                            <Link
                                key={
                                    menu.name
                                }
                                href={
                                    menu.href
                                }
                                className={
                                    styles.menuLink
                                }
                            >

                                <span>
                                    {
                                        menu.icon
                                    }
                                </span>

                                <span>
                                    {
                                        menu.name
                                    }
                                </span>

                            </Link>

                        )
                    )}

                </nav>

                {/* ==================================================
                    DESKTOP USER AREA
                ================================================== */}

                <div
                    className={
                        styles.desktopAdmin
                    }
                >

                    {/* ==================================================
                        BETA / BALANCE
                    ================================================== */}

                    {!mounted || betaLoading ? (

                        /*
                         * IMPORTANT:
                         *
                         * Server and first client render
                         * show exactly the same neutral state.
                         */

                        <div
                            className={
                                styles.desktopBalance
                            }
                        >

                            <span
                                className={
                                    styles.balanceIcon
                                }
                            >
                                💰
                            </span>

                            <div>

                                <small>
                                    Balance
                                </small>

                                <strong>
                                    ...
                                </strong>

                            </div>

                        </div>

                    ) : betaEnabled ? (

                        <div
                            className="
                                flex
                                items-center
                                gap-2
                                rounded-lg
                                bg-purple-100
                                px-3
                                py-2
                                font-semibold
                                text-purple-700
                            "
                        >

                            <span>
                                🧪
                            </span>

                            <span>
                                BETA
                            </span>

                        </div>

                    ) : (

                        <div
                            className={
                                styles.desktopBalance
                            }
                        >

                            <span
                                className={
                                    styles.balanceIcon
                                }
                            >
                                💰
                            </span>

                            <div>

                                <small>
                                    Balance
                                </small>

                                <strong>
                                    {
                                        formattedBalance
                                    }
                                </strong>

                            </div>

                        </div>

                    )}

                    {/* ==================================================
                        USER
                    ================================================== */}

                    <div
                        className={
                            styles.adminInfo
                        }
                    >

                        <span
                            className={
                                styles.avatar
                            }
                        >
                            {
                                userInitial
                            }
                        </span>

                        <span
                            className={
                                styles.userText
                            }
                        >

                            <span>
                                {
                                    username
                                }
                            </span>

                            <small>
                                {
                                    role
                                }
                            </small>

                        </span>

                    </div>

                    {/* ==================================================
                        LOGOUT
                    ================================================== */}

                    <button
                        type="button"
                        className={
                            styles.logoutButton
                        }
                        onClick={
                            handleLogout
                        }
                    >

                        <span>
                            🚪
                        </span>

                        <span>
                            Logout
                        </span>

                    </button>

                </div>

                {/* ==================================================
                    MOBILE BALANCE
                ================================================== */}

                <div
                    className={
                        styles.mobileBalance
                    }
                >

                    {!mounted || betaLoading ? (

                        <>

                            <span
                                className={
                                    styles.mobileBalanceIcon
                                }
                            >
                                💰
                            </span>

                            <span
                                className={
                                    styles.mobileBalanceValue
                                }
                            >
                                ...
                            </span>

                        </>

                    ) : betaEnabled ? (

                        <span
                            className="
                                inline-flex
                                items-center
                                gap-1
                                rounded-md
                                bg-purple-100
                                px-2
                                py-1
                                text-sm
                                font-semibold
                                text-purple-700
                            "
                        >

                            <span>
                                🧪
                            </span>

                            <span>
                                BETA
                            </span>

                        </span>

                    ) : (

                        <>

                            <span
                                className={
                                    styles.mobileBalanceIcon
                                }
                            >
                                💰
                            </span>

                            <span
                                className={
                                    styles.mobileBalanceValue
                                }
                            >
                                {
                                    formattedBalance
                                }
                            </span>

                        </>

                    )}

                </div>

            </div>

            {/* ======================================================
                MOBILE MENU
            ====================================================== */}

            {menuOpen && (

                <div
                    className={
                        styles.menuPanel
                    }
                >

                    {/* ==================================================
                        MOBILE BETA / BALANCE
                    ================================================== */}

                    {!mounted || betaLoading ? (

                        <div
                            className={
                                styles.mobileBalanceCard
                            }
                        >

                            <div
                                className={
                                    styles.mobileBalanceCardIcon
                                }
                            >
                                💰
                            </div>

                            <div>

                                <div
                                    className={
                                        styles.mobileBalanceLabel
                                    }
                                >
                                    Current Balance
                                </div>

                                <div
                                    className={
                                        styles.mobileBalanceAmount
                                    }
                                >
                                    ...
                                </div>

                            </div>

                        </div>

                    ) : betaEnabled ? (

                        <div
                            className="
                                mb-3
                                flex
                                items-center
                                gap-3
                                rounded-xl
                                border
                                border-purple-200
                                bg-purple-50
                                p-4
                            "
                        >

                            <div
                                className="
                                    text-2xl
                                "
                            >
                                🧪
                            </div>

                            <div>

                                <div
                                    className="
                                        text-sm
                                        font-medium
                                        text-purple-600
                                    "
                                >
                                    System Mode
                                </div>

                                <div
                                    className="
                                        text-lg
                                        font-bold
                                        text-purple-700
                                    "
                                >
                                    BETA
                                </div>

                            </div>

                        </div>

                    ) : (

                        <div
                            className={
                                styles.mobileBalanceCard
                            }
                        >

                            <div
                                className={
                                    styles.mobileBalanceCardIcon
                                }
                            >
                                💰
                            </div>

                            <div>

                                <div
                                    className={
                                        styles.mobileBalanceLabel
                                    }
                                >
                                    Current Balance
                                </div>

                                <div
                                    className={
                                        styles.mobileBalanceAmount
                                    }
                                >
                                    {
                                        formattedBalance
                                    }
                                </div>

                            </div>

                        </div>

                    )}

                    {/* ==================================================
                        MOBILE LINKS
                    ================================================== */}

                    {menus.map(
                        menu => (

                            <Link
                                key={
                                    menu.name
                                }
                                href={
                                    menu.href
                                }
                                className={
                                    styles.menuPanelLink
                                }
                                onClick={() =>
                                    setMenuOpen(false)
                                }
                            >

                                <span>
                                    {
                                        menu.icon
                                    }
                                </span>

                                <span>
                                    {
                                        menu.name
                                    }
                                </span>

                            </Link>

                        )
                    )}

                    {/* ==================================================
                        MOBILE USER
                    ================================================== */}

                    <div
                        className={
                            styles.mobileUser
                        }
                    >

                        <span
                            className={
                                styles.mobileAvatar
                            }
                        >
                            {
                                userInitial
                            }
                        </span>

                        <span
                            className={
                                styles.mobileUserText
                            }
                        >

                            <span>
                                {
                                    username
                                }
                            </span>

                            <small>
                                {
                                    role
                                }
                            </small>

                        </span>

                    </div>

                    {/* ==================================================
                        MOBILE LOGOUT
                    ================================================== */}

                    <button
                        type="button"
                        className={
                            styles.mobileLogout
                        }
                        onClick={
                            handleLogout
                        }
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

