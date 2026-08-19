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

const API_URL = "http://localhost:8000";


// ============================================================
// MENUS
// ============================================================

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


// ============================================================
// NAVBAR
// ============================================================

export default function Navbar() {

    const [menuOpen, setMenuOpen] =
        useState(false);

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
        useState(true);


    // ========================================================
    // BETA
    // ========================================================

    const [betaEnabled, setBetaEnabled] =
        useState(false);

    const [betaLoading, setBetaLoading] =
        useState(true);


    // ========================================================
    // GET TOKEN
    // ========================================================

    function getToken() {

        if (
            typeof window === "undefined"
        ) {
            return null;
        }

        return localStorage.getItem(
            "access_token"
        );
    }


    // ========================================================
    // LOAD BETA SETTING
    // ========================================================

    const loadBetaSetting =
        useCallback(async () => {

            try {

                setBetaLoading(true);

                const token =
                    getToken();

                if (!token) {

                    setBetaEnabled(false);

                    return;
                }


                const res =
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
                        }
                    );


                if (!res.ok) {

                    /*
                     * If the endpoint does not exist
                     * or returns an error, safely assume
                     * beta is disabled.
                     */

                    setBetaEnabled(false);

                    return;
                }


                const data =
                    await res.json();


                const value =
                    String(
                        data?.value ??
                        data?.enabled ??
                        "false"
                    ).toLowerCase();


                setBetaEnabled(
                    value === "true" ||
                    value === "1" ||
                    value === "yes" ||
                    value === "on" ||
                    value === "enabled"
                );

            } catch (error) {

                console.error(
                    "Failed to load beta setting:",
                    error
                );

                setBetaEnabled(false);

            } finally {

                setBetaLoading(false);

            }

        }, []);


    // ========================================================
    // LOAD WALLET
    // ========================================================

    const loadWallet =
        useCallback(async () => {

            /*
             * IMPORTANT:
             *
             * If beta is enabled,
             * do not display/load wallet balance.
             *
             * We still allow this function to be called,
             * but the actual hiding is handled by the UI.
             */

            try {

                const wallet =
                    await getWallet();

                setBalance(
                    Number(
                        wallet.balance
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

        }, []);


    // ========================================================
    // INITIAL LOAD
    // ========================================================

    useEffect(() => {

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
    // LOAD WALLET AFTER BETA SETTING
    // ========================================================

    useEffect(() => {

        /*
         * Wait until beta status is known.
         */

        if (betaLoading) {
            return;
        }


        /*
         * If beta is enabled,
         * do not need wallet balance.
         */

        if (betaEnabled) {

            setBalance(null);
            setBalanceLoading(false);

            return;
        }


        /*
         * Beta disabled.
         * Load wallet normally.
         */

        loadWallet();

    }, [
        betaEnabled,
        betaLoading,
        loadWallet,
    ]);


    // ========================================================
    // BETA UPDATED EVENT
    //
    // Other pages can call:
    //
    // window.dispatchEvent(
    //     new Event("betaUpdated")
    // );
    // ========================================================

    useEffect(() => {

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
        loadBetaSetting,
    ]);


    // ========================================================
    // WALLET UPDATED EVENT
    //
    // Other pages can call:
    //
    // window.dispatchEvent(
    //     new Event("walletUpdated")
    // );
    // ========================================================

    useEffect(() => {

        const handleWalletUpdated =
            () => {

                /*
                 * No reason to reload balance
                 * when beta is enabled.
                 */

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
        betaEnabled,
        loadWallet,
    ]);


    // ========================================================
    // REFRESH WHEN TAB BECOMES ACTIVE
    // ========================================================

    useEffect(() => {

        const handleVisibilityChange =
            () => {

                if (
                    document.visibilityState !==
                    "visible"
                ) {
                    return;
                }


                /*
                 * Always check beta.
                 */

                loadBetaSetting();


                /*
                 * Only load wallet if
                 * beta is disabled.
                 */

                if (!betaEnabled) {

                    loadWallet();

                }

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
        betaEnabled,
        loadBetaSetting,
        loadWallet,
    ]);


    // ========================================================
    // REFRESH WHEN WINDOW GETS FOCUS
    // ========================================================

    useEffect(() => {

        const handleFocus =
            () => {

                loadBetaSetting();


                if (!betaEnabled) {

                    loadWallet();

                }

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
        betaEnabled,
        loadBetaSetting,
        loadWallet,
    ]);


    // ========================================================
    // AUTO REFRESH
    //
    // Check beta every 10 seconds.
    //
    // Wallet is only checked when beta is OFF.
    // ========================================================

    useEffect(() => {

        const interval =
            window.setInterval(() => {

                loadBetaSetting();


                if (!betaEnabled) {

                    loadWallet();

                }

            }, 10000);


        return () => {

            window.clearInterval(
                interval
            );

        };

    }, [
        betaEnabled,
        loadBetaSetting,
        loadWallet,
    ]);


    // ========================================================
    // LOGOUT
    // ========================================================

    const handleLogout =
        () => {

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
                    href="/"
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
                    DESKTOP ADMIN / USER
                ================================================== */}

                <div
                    className={
                        styles.desktopAdmin
                    }
                >

                    {/* ==================================================
                        DESKTOP BETA / BALANCE
                    ================================================== */}

                    {betaEnabled ? (

                        <div
                            className="
                                flex
                                items-center
                                gap-2
                                px-3
                                py-2
                                rounded-lg
                                bg-purple-100
                                text-purple-700
                                font-semibold
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
                    MOBILE BETA / BALANCE
                ================================================== */}

                <div
                    className={
                        styles.mobileBalance
                    }
                >

                    {betaEnabled ? (

                        <span
                            className="
                                inline-flex
                                items-center
                                gap-1
                                px-2
                                py-1
                                rounded-md
                                bg-purple-100
                                text-purple-700
                                font-semibold
                                text-sm
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
                        MOBILE BETA / BALANCE CARD
                    ================================================== */}

                    {betaEnabled ? (

                        <div
                            className="
                                flex
                                items-center
                                gap-3
                                p-4
                                mb-3
                                rounded-xl
                                bg-purple-50
                                border
                                border-purple-200
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
                                        text-purple-600
                                        font-medium
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