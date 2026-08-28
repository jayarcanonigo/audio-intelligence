
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getWallet } from "@/services/wallet";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000";

type Project = {
    id: number;
    name: string;
    created_at?: string;
};

export default function DashboardPage() {
    const router = useRouter();

    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [mobileMenu, setMobileMenu] = useState(false);

    const [username, setUsername] = useState("User");
    const [role, setRole] = useState("USER");

    // ============================================================
    // WALLET
    // ============================================================

    const [balance, setBalance] =
        useState<number | null>(null);

    const [balanceLoading, setBalanceLoading] =
        useState(false);

    // ============================================================
    // INITIAL LOAD
    // ============================================================

    useEffect(() => {
        const token =
            localStorage.getItem("access_token");

        if (!token) {
            router.replace("/login");
            return;
        }

        const savedUsername =
            localStorage.getItem("username") ||
            "User";

        const savedRole =
            localStorage.getItem("role") ||
            "USER";

        setUsername(savedUsername);
        setRole(savedRole);

        loadProjects(token);

        if (
            savedRole.toUpperCase() ===
            "USER"
        ) {
            loadWallet();
        }
    }, [router]);

    // ============================================================
    // LOAD PROJECTS
    // ============================================================

    async function loadProjects(
        token: string
    ) {
        if (!token) {
            router.replace("/login");
            return;
        }

        setLoading(true);

        try {
            const response =
                await fetch(
                    `${API_URL}/projects`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );

            if (
                response.status ===
                401
            ) {
                logout();
                return;
            }

            if (!response.ok) {
                setProjects([]);
                return;
            }

            const data =
                await response.json();

            setProjects(
                Array.isArray(data)
                    ? data
                    : []
            );
        } catch (error) {
            console.error(
                "Failed to load projects:",
                error
            );

            setProjects([]);
        } finally {
            setLoading(false);
        }
    }

    // ============================================================
    // LOAD WALLET
    // ============================================================

    async function loadWallet() {
        setBalanceLoading(true);

        try {
            const wallet =
                await getWallet();

            setBalance(
                Number(wallet.balance)
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
    }

    // ============================================================
    // LOGOUT
    // ============================================================

    function logout() {
        localStorage.removeItem(
            "access_token"
        );

        localStorage.removeItem(
            "token_type"
        );

        localStorage.removeItem(
            "user_id"
        );

        localStorage.removeItem(
            "username"
        );

        localStorage.removeItem(
            "role"
        );

        router.replace("/login");
    }

    // ============================================================
    // OPEN PROJECT
    // ============================================================

    function openProject(
        project: Project
    ) {
        router.push(
            `/projects/${project.id}?projectName=${encodeURIComponent(
                project.name
            )}`
        );
    }

    // ============================================================
    // FORMAT BALANCE
    // ============================================================

    function formatBalance() {
        if (balanceLoading) {
            return "...";
        }

        return `₱${(
            balance ?? 0
        ).toLocaleString(
            "en-PH",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        )}`;
    }

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <main className="min-h-screen bg-slate-100">

            {/* =====================================================
                MOBILE HEADER
            ====================================================== */}

            <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200">

                <div className="h-16 px-4 flex items-center justify-between">

                    <div className="flex items-center gap-3">

                        <Logo />

                        <div>
                            <p className="text-sm font-bold">
                                Radio Intelligence
                            </p>

                            <p className="text-[11px] text-slate-500">
                                Dashboard
                            </p>
                        </div>

                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setMobileMenu(
                                !mobileMenu
                            )
                        }
                        aria-label={
                            mobileMenu
                                ? "Close menu"
                                : "Open menu"
                        }
                        className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                    >
                        {mobileMenu ? (
                            <CloseIcon />
                        ) : (
                            <MenuIcon />
                        )}
                    </button>

                </div>

                {mobileMenu && (
                    <div className="border-t border-slate-100 bg-white p-4">

                        {/* Mobile User */}

                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 mb-3">

                            <Avatar
                                username={
                                    username
                                }
                            />

                            <div>
                                <p className="text-sm font-semibold">
                                    {username}
                                </p>

                                <p className="text-xs text-slate-500">
                                    {role}
                                </p>
                            </div>

                        </div>

                        {/* Mobile Balance */}

                        {role.toUpperCase() ===
                            "USER" && (
                            <div className="mb-3 p-4 rounded-xl bg-indigo-50 border border-indigo-100">

                                <div className="flex items-center justify-between">

                                    <div>

                                        <p className="text-xs font-medium text-indigo-600">
                                            Current Balance
                                        </p>

                                        <p className="mt-1 text-xl font-bold text-indigo-900">
                                            {formatBalance()}
                                        </p>

                                    </div>

                                    <div className="w-10 h-10 rounded-lg bg-white text-indigo-600 flex items-center justify-center">
                                        <WalletIcon />
                                    </div>

                                </div>

                            </div>
                        )}

                        {/* Dashboard */}

                        <button
                            type="button"
                            onClick={() =>
                                setMobileMenu(
                                    false
                                )
                            }
                            className="w-full text-left px-3 py-3 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-semibold"
                        >
                            Dashboard
                        </button>

                        {/* Admin */}

                        {role.toUpperCase() ===
                            "ADMIN" && (
                            <button
                                type="button"
                                onClick={() =>
                                    router.push(
                                        "/admin/users"
                                    )
                                }
                                className="w-full text-left px-3 py-3 rounded-lg text-sm hover:bg-slate-50"
                            >
                                User Management
                            </button>
                        )}

                        {/* Logout */}

                        <button
                            type="button"
                            onClick={logout}
                            className="w-full text-left px-3 py-3 rounded-lg text-sm text-red-600 hover:bg-red-50"
                        >
                            Logout
                        </button>

                    </div>
                )}

            </header>


            {/* =====================================================
                DESKTOP SIDEBAR
            ====================================================== */}

            <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-slate-950 text-white flex-col">

                {/* Logo */}

                <div className="h-20 px-6 flex items-center border-b border-white/10">

                    <Logo dark />

                </div>


                {/* Navigation */}

                <nav className="flex-1 p-4">

                    <button
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600 text-sm font-semibold"
                    >
                        <DashboardIcon />

                        Dashboard
                    </button>

                    {role.toUpperCase() ===
                        "ADMIN" && (
                        <button
                            type="button"
                            onClick={() =>
                                router.push(
                                    "/admin/users"
                                )
                            }
                            className="w-full flex items-center gap-3 px-4 py-3 mt-1 rounded-xl text-sm text-slate-400 hover:bg-white/5 hover:text-white"
                        >
                            <UsersIcon />

                            User Management
                        </button>
                    )}

                </nav>


                {/* User */}

                <div className="p-4 border-t border-white/10">

                    <div className="flex items-center gap-3 px-2 mb-3">

                        <Avatar
                            username={
                                username
                            }
                        />

                        <div className="min-w-0">

                            <p className="text-sm font-semibold truncate">
                                {username}
                            </p>

                            <p className="text-xs text-slate-500">
                                {role}
                            </p>

                        </div>

                    </div>

                    <button
                        type="button"
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                    >
                        <LogoutIcon />

                        Logout
                    </button>

                </div>

            </aside>


            {/* =====================================================
                MAIN
            ====================================================== */}

            <div className="lg:ml-64 min-h-screen">

                {/* =================================================
                    DESKTOP HEADER
                ================================================== */}

                <header className="hidden lg:flex h-20 bg-white border-b border-slate-200 px-8 items-center justify-between">

                    {/* Header Title */}

                    <div>

                        <h1 className="text-lg font-bold">
                            Dashboard
                        </h1>

                        <p className="text-sm text-slate-500 mt-1">
                            Monitor your radio intelligence projects.
                        </p>

                    </div>


                    {/* Header Right */}

                    <div className="flex items-center gap-6">

                        {/* Current Balance */}

                        {role.toUpperCase() ===
                            "USER" && (
                            <div className="flex items-center gap-3 pr-6 border-r border-slate-200">

                                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                    <WalletIcon />
                                </div>

                                <div>

                                    <p className="text-[11px] font-medium text-slate-400">
                                        Current Balance
                                    </p>

                                    <p className="mt-0.5 text-sm font-bold text-slate-900">
                                        {formatBalance()}
                                    </p>

                                </div>

                            </div>
                        )}

                        {/* User */}

                        <div className="text-right">

                            <p className="text-sm font-semibold">
                                {username}
                            </p>

                            <p className="text-xs text-slate-400">
                                {role}
                            </p>

                        </div>

                        <Avatar
                            username={
                                username
                            }
                        />

                    </div>

                </header>


                {/* =================================================
                    CONTENT
                ================================================== */}

                <div className="p-4 sm:p-6 lg:p-8">

                    {/* Mobile heading */}

                    <div className="lg:hidden mb-6">

                        <h1 className="text-xl font-bold">
                            Dashboard
                        </h1>

                        <p className="text-sm text-slate-500 mt-1">
                            Welcome back,{" "}
                            {username}.
                        </p>

                    </div>


                    {/* =================================================
                        WELCOME CARD
                    ================================================== */}

                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 to-indigo-600 p-5 sm:p-7 text-white shadow-lg shadow-indigo-600/20 mb-6">

                        <div className="relative z-10">

                            <p className="text-indigo-200 text-sm font-medium">
                                Welcome back
                            </p>

                            <h2 className="mt-1 text-2xl sm:text-3xl font-bold">
                                {username}
                            </h2>

                            <p className="mt-2 text-sm text-indigo-100 max-w-xl">
                                Analyze broadcasts,
                                detect
                                advertisements,
                                and search your
                                radio intelligence
                                data.
                            </p>

                        </div>

                        <div className="absolute -right-16 -top-20 w-64 h-64 rounded-full bg-white/10" />

                        <div className="absolute right-10 bottom-[-80px] w-48 h-48 rounded-full bg-white/5" />

                    </div>


                    {/* =================================================
                        STATISTICS
                    ================================================== */}

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">

                        <StatCard
                            title="Projects"
                            value={
                                projects.length
                            }
                            icon={
                                <FolderIcon />
                            }
                        />

                        <StatCard
                            title="Broadcasts"
                            value="—"
                            icon={
                                <RadioIcon />
                            }
                        />

                        <StatCard
                            title="Advertisements"
                            value="—"
                            icon={
                                <AdIcon />
                            }
                        />

                        <StatCard
                            title="Segments"
                            value="—"
                            icon={
                                <AudioIcon />
                            }
                        />

                    </div>


                    {/* =================================================
                        PROJECTS
                    ================================================== */}

                    <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

                        <div className="px-5 sm:px-6 py-5 border-b border-slate-200 flex items-center justify-between">

                            <div>

                                <h2 className="font-bold">
                                    Radio Projects
                                </h2>

                                <p className="text-xs text-slate-500 mt-1">
                                    Select a project to
                                    continue.
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    loadProjects(
                                        localStorage.getItem(
                                            "access_token"
                                        ) || ""
                                    )
                                }
                                className="hidden sm:flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600"
                            >
                                <RefreshIcon />

                                Refresh
                            </button>

                        </div>


                        {/* Loading */}

                        {loading ? (

                            <div className="py-20 flex flex-col items-center">

                                <Spinner />

                                <p className="mt-3 text-sm text-slate-500">
                                    Loading projects...
                                </p>

                            </div>

                        ) : projects.length ===
                          0 ? (

                            <div className="py-20 px-6 text-center">

                                <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                                    <FolderIcon />
                                </div>

                                <h3 className="mt-4 font-bold">
                                    No projects yet
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Your radio projects
                                    will appear here.
                                </p>

                            </div>

                        ) : (

                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4 sm:p-6">

                                {projects.map(
                                    (
                                        project
                                    ) => (

                                        <button
                                            type="button"
                                            key={
                                                project.id
                                            }
                                            onClick={() =>
                                                openProject(
                                                    project
                                                )
                                            }
                                            className="group text-left rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-100 transition-all"
                                        >

                                            <div className="flex items-start justify-between">

                                                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                                    <FolderIcon />
                                                </div>

                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition">
                                                    <ArrowIcon />
                                                </div>

                                            </div>

                                            <h3 className="mt-5 font-bold text-base truncate">
                                                {
                                                    project.name
                                                }
                                            </h3>

                                            <p className="mt-1 text-xs text-slate-400">
                                                Project #
                                                {
                                                    project.id
                                                }
                                            </p>

                                            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">

                                                <span className="text-xs text-slate-500">
                                                    Radio
                                                    Intelligence
                                                </span>

                                                <span className="text-xs font-semibold text-indigo-600">
                                                    Open →
                                                </span>

                                            </div>

                                        </button>

                                    )
                                )}

                            </div>

                        )}

                    </section>

                </div>

            </div>

        </main>
    );
}


/* ================================================================
   STAT CARD
================================================================ */

function StatCard({
    title,
    value,
    icon,
}: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
}) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">

            <div className="flex items-start justify-between">

                <div>

                    <p className="text-xs font-medium text-slate-500">
                        {title}
                    </p>

                    <p className="mt-2 text-2xl sm:text-3xl font-bold">
                        {value}
                    </p>

                </div>

                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    {icon}
                </div>

            </div>

        </div>
    );
}


/* ================================================================
   LOGO
================================================================ */

function Logo({
    dark = false,
}: {
    dark?: boolean;
}) {
    return (
        <div className="flex items-center gap-3">

            <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-600 text-white flex items-center justify-center">

                <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                >
                    <path d="M3 12h2" />
                    <path d="M7 8v8" />
                    <path d="M11 4v16" />
                    <path d="M15 8v8" />
                    <path d="M19 6v12" />
                    <path d="M21 10v4" />
                </svg>

            </div>

            <div className="hidden sm:block lg:block">

                <p
                    className={`text-sm font-bold ${
                        dark
                            ? "text-white"
                            : "text-slate-900"
                    }`}
                >
                    Radio Intelligence
                </p>

                <p
                    className={`text-[10px] ${
                        dark
                            ? "text-slate-500"
                            : "text-slate-500"
                    }`}
                >
                    Audio Intelligence Platform
                </p>

            </div>

        </div>
    );
}


/* ================================================================
   AVATAR
================================================================ */

function Avatar({
    username,
}: {
    username: string;
}) {
    return (
        <div className="w-9 h-9 shrink-0 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">
            {username
                ?.charAt(0)
                ?.toUpperCase() || "U"}
        </div>
    );
}


/* ================================================================
   DASHBOARD ICON
================================================================ */

function DashboardIcon() {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
        >
            <rect
                x="3"
                y="3"
                width="7"
                height="7"
                rx="1"
            />

            <rect
                x="14"
                y="3"
                width="7"
                height="7"
                rx="1"
            />

            <rect
                x="3"
                y="14"
                width="7"
                height="7"
                rx="1"
            />

            <rect
                x="14"
                y="14"
                width="7"
                height="7"
                rx="1"
            />
        </svg>
    );
}


/* ================================================================
   USERS ICON
================================================================ */

function UsersIcon() {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />

            <circle
                cx="9"
                cy="7"
                r="4"
            />

            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />

            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}


/* ================================================================
   FOLDER ICON
================================================================ */

function FolderIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
        </svg>
    );
}


/* ================================================================
   WALLET ICON
================================================================ */

function WalletIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />

            <path d="M3 7h16" />

            <path d="M16 13h5" />

            <circle
                cx="16"
                cy="13"
                r="1"
            />
        </svg>
    );
}


/* ================================================================
   RADIO ICON
================================================================ */

function RadioIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
        >
            <circle
                cx="12"
                cy="12"
                r="2"
            />

            <path d="M7.8 7.8a6 6 0 0 0 0 8.4" />

            <path d="M16.2 7.8a6 6 0 0 1 0 8.4" />

            <path d="M4.9 4.9a10 10 0 0 0 0 14.2" />

            <path d="M19.1 4.9a10 10 0 0 1 0 14.2" />
        </svg>
    );
}


/* ================================================================
   AD ICON
================================================================ */

function AdIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4 5h16v14H4z" />

            <path d="M8 9h8" />

            <path d="M8 13h5" />
        </svg>
    );
}


/* ================================================================
   AUDIO ICON
================================================================ */

function AudioIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
        >
            <path d="M4 12h2" />

            <path d="M8 8v8" />

            <path d="M12 4v16" />

            <path d="M16 8v8" />

            <path d="M20 10v4" />
        </svg>
    );
}


/* ================================================================
   ARROW ICON
================================================================ */

function ArrowIcon() {
    return (
        <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        >
            <path d="M5 12h14" />

            <path d="m13 6 6 6-6 6" />
        </svg>
    );
}


/* ================================================================
   MENU ICON
================================================================ */

function MenuIcon() {
    return (
        <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M4 6h16" />

            <path d="M4 12h16" />

            <path d="M4 18h16" />
        </svg>
    );
}


/* ================================================================
   CLOSE ICON
================================================================ */

function CloseIcon() {
    return (
        <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M6 6l12 12" />

            <path d="M18 6 6 18" />
        </svg>
    );
}


/* ================================================================
   REFRESH ICON
================================================================ */

function RefreshIcon() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        >
            <path d="M20 11a8 8 0 0 0-15.5-2" />

            <path d="M4 4v5h5" />

            <path d="M4 13a8 8 0 0 0 15.5 2" />

            <path d="M20 20v-5h-5" />
        </svg>
    );
}


/* ================================================================
   LOGOUT ICON
================================================================ */

function LogoutIcon() {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
        >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />

            <path d="m16 17 5-5-5-5" />

            <path d="M21 12H9" />
        </svg>
    );
}


/* ================================================================
   SPINNER
================================================================ */

function Spinner() {
    return (
        <svg
            className="animate-spin text-indigo-600"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
        >
            <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="3"
                opacity="0.25"
            />

            <path
                d="M21 12a9 9 0 0 0-9-9"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    );
}

