
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { getWallet } from "@/services/wallet";
import {
    getAdvertisements,
    getSegmentsByProject,
    getUploadStatuses,
    type UploadStatus,
} from "@/services/api";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000";

type Project = {
    id: number;
    name: string;
    created_at?: string;
    broadcast_date?: string;
};

type DashboardStats = {
    projects: number;
    broadcasts: number;
    advertisements: number;
    segments: number;
    completed: number;
    processing: number;
    failed: number;
    cancelled: number;
};

type ActivityItem = {
    id: string;
    projectId: number;
    projectName: string;
    filename: string;
    broadcastHour: number | null;
    status: string;
    progress: number;
    updatedAt: string;
    message: string | null;
};

export default function DashboardPage() {
    const router = useRouter();

    const [projects, setProjects] =
        useState<Project[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [mobileMenu, setMobileMenu] =
        useState(false);

    const [username, setUsername] =
        useState("User");

    const [role, setRole] =
        useState("USER");

    // ============================================================
    // WALLET
    // ============================================================

    const [balance, setBalance] =
        useState<number | null>(null);

    const [balanceLoading, setBalanceLoading] =
        useState(false);

    // ============================================================
    // DASHBOARD STATS
    // ============================================================

    const [stats, setStats] =
        useState<DashboardStats>({
            projects: 0,
            broadcasts: 0,
            advertisements: 0,
            segments: 0,
            completed: 0,
            processing: 0,
            failed: 0,
            cancelled: 0,
        });

    const [statsLoading, setStatsLoading] =
        useState(false);

    // ============================================================
    // ACTIVITY
    // ============================================================

    const [activities, setActivities] =
        useState<ActivityItem[]>([]);

    // ============================================================
    // INITIAL LOAD
    // ============================================================

    useEffect(() => {
        const token =
            localStorage.getItem(
                "access_token"
            );

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

        loadDashboard(token);

        if (
            savedRole.toUpperCase() ===
            "USER"
        ) {
            loadWallet();
        }
    }, [router]);

    // ============================================================
    // LOAD EVERYTHING
    // ============================================================

    async function loadDashboard(
        token: string
    ) {
        if (!token) {
            router.replace("/login");
            return;
        }

        setLoading(true);
        setStatsLoading(true);

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

            const projectList: Project[] =
                Array.isArray(data)
                    ? data
                    : [];

            setProjects(
                projectList
            );

            await loadProjectStats(
                projectList
            );
        } catch (error) {
            console.error(
                "Failed to load dashboard:",
                error
            );

            setProjects([]);

            setStats({
                projects: 0,
                broadcasts: 0,
                advertisements: 0,
                segments: 0,
                completed: 0,
                processing: 0,
                failed: 0,
                cancelled: 0,
            });

            setActivities([]);
        } finally {
            setLoading(false);
            setStatsLoading(false);
        }
    }

    // ============================================================
    // LOAD PROJECT STATISTICS
    // ============================================================

    async function loadProjectStats(
        projectList: Project[]
    ) {
        if (
            projectList.length ===
            0
        ) {
            setStats({
                projects: 0,
                broadcasts: 0,
                advertisements: 0,
                segments: 0,
                completed: 0,
                processing: 0,
                failed: 0,
                cancelled: 0,
            });

            setActivities([]);

            return;
        }

        let totalAdvertisements = 0;
        let totalSegments = 0;

        let completed = 0;
        let processing = 0;
        let failed = 0;
        let cancelled = 0;

        const allActivities: ActivityItem[] =
            [];

        await Promise.all(
            projectList.map(
                async (project) => {
                    try {
                        const [
                            advertisements,
                            segments,
                            uploadStatuses,
                        ] =
                            await Promise.all([
                                getAdvertisements(
                                    project.id
                                ).catch(
                                    () => []
                                ),

                                getSegmentsByProject(
                                    project.id
                                ).catch(
                                    () => []
                                ),

                                getUploadStatuses(
                                    project.id
                                ).catch(
                                    () => []
                                ),
                            ]);

                        if (
                            Array.isArray(
                                advertisements
                            )
                        ) {
                            totalAdvertisements +=
                                advertisements.length;
                        }

                        if (
                            Array.isArray(
                                segments
                            )
                        ) {
                            totalSegments +=
                                segments.length;
                        }

                        if (
                            Array.isArray(
                                uploadStatuses
                            )
                        ) {
                            uploadStatuses.forEach(
                                (
                                    upload: UploadStatus
                                ) => {
                                    const status =
                                        String(
                                            upload.status ||
                                                ""
                                        ).toUpperCase();

                                    if (
                                        status ===
                                        "COMPLETED"
                                    ) {
                                        completed++;
                                    } else if (
                                        status ===
                                            "PROCESSING" ||
                                        status ===
                                            "STARTING" ||
                                        status ===
                                            "CANCELLING"
                                    ) {
                                        processing++;
                                    } else if (
                                        status ===
                                        "FAILED"
                                    ) {
                                        failed++;
                                    } else if (
                                        status ===
                                        "CANCELLED"
                                    ) {
                                        cancelled++;
                                    }

                                    allActivities.push(
                                        {
                                            id: `${project.id}-${upload.id}`,

                                            // IMPORTANT:
                                            // Used to open the
                                            // correct Ad Editor.
                                            projectId:
                                                project.id,

                                            projectName:
                                                project.name,

                                            filename:
                                                upload.filename,

                                            broadcastHour:
                                                upload.broadcast_hour,

                                            status,

                                            progress:
                                                Number(
                                                    upload.progress ||
                                                        0
                                                ),

                                            updatedAt:
                                                upload.updated_at ||
                                                upload.created_at,

                                            message:
                                                upload.message,
                                        }
                                    );
                                }
                            );
                        }
                    } catch (
                        error
                    ) {
                        console.error(
                            `Failed loading project ${project.id}:`,
                            error
                        );
                    }
                }
            )
        );

        // ========================================================
        // BROADCAST COUNT
        // ========================================================

        const broadcastKeys =
            new Set<string>();

        allActivities.forEach(
            (activity) => {
                const hour =
                    activity.broadcastHour;

                if (
                    hour !== null &&
                    hour !== undefined
                ) {
                    broadcastKeys.add(
                        `${activity.projectId}-${hour}`
                    );
                }
            }
        );

        const broadcasts =
            broadcastKeys.size > 0
                ? broadcastKeys.size
                : allActivities.length;

        // ========================================================
        // SORT ACTIVITY
        // ========================================================

        allActivities.sort(
            (
                a,
                b
            ) => {
                const dateA =
                    new Date(
                        a.updatedAt
                    ).getTime();

                const dateB =
                    new Date(
                        b.updatedAt
                    ).getTime();

                return (
                    dateB - dateA
                );
            }
        );

        setActivities(
            allActivities.slice(
                0,
                8
            )
        );

        // ========================================================
        // SET STATS
        // ========================================================

        setStats({
            projects:
                projectList.length,

            broadcasts,

            advertisements:
                totalAdvertisements,

            segments:
                totalSegments,

            completed,

            processing,

            failed,

            cancelled,
        });
    }

    // ============================================================
    // REFRESH
    // ============================================================

    async function refreshDashboard() {
        const token =
            localStorage.getItem(
                "access_token"
            );

        if (!token) {
            router.replace("/login");
            return;
        }

        setRefreshing(true);

        try {
            await loadDashboard(
                token
            );

            if (
                role.toUpperCase() ===
                "USER"
            ) {
                await loadWallet();
            }
        } finally {
            setRefreshing(false);
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

        localStorage.removeItem(
            "user"
        );

        localStorage.removeItem(
            "auth"
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
    // OPEN AD EDITOR
    // ============================================================

    function openAdEditor(
        activity: ActivityItem
    ) {
        const hour =
            activity.broadcastHour !==
                null &&
            activity.broadcastHour !==
                undefined
                ? activity.broadcastHour
                : 1;

        router.push(
            `/ad-editor/${activity.projectId}?name=${encodeURIComponent(
                activity.projectName
            )}&hour=${hour}`
        );
    }

    // ============================================================
    // QUICK ACTION
    // ============================================================

    function openProjects() {
        router.push(
            "/projects"
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
    // RECENT PROJECTS
    // ============================================================

    const recentProjects =
        useMemo(() => {
            return [
                ...projects,
            ]
                .sort(
                    (
                        a,
                        b
                    ) => {
                        if (
                            !a.created_at ||
                            !b.created_at
                        ) {
                            return (
                                b.id -
                                a.id
                            );
                        }

                        return (
                            new Date(
                                b.created_at
                            ).getTime() -
                            new Date(
                                a.created_at
                            ).getTime()
                        );
                    }
                )
                .slice(
                    0,
                    6
                );
        }, [projects]);

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

                        <button
                            type="button"
                            onClick={() => {
                                setMobileMenu(
                                    false
                                );

                                openProjects();
                            }}
                            className="w-full text-left px-3 py-3 rounded-lg text-sm hover:bg-slate-50"
                        >
                            Projects
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
                                className="w-full text-left px-3 py-3 rounded-lg text-sm hover:bg-slate-50"
                            >
                                User Management
                            </button>
                        )}

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

                <div className="h-20 px-6 flex items-center border-b border-white/10">
                    <Logo dark />
                </div>

                <nav className="flex-1 p-4">

                    <button
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600 text-sm font-semibold"
                    >
                        <DashboardIcon />
                        Dashboard
                    </button>

                    <button
                        type="button"
                        onClick={openProjects}
                        className="w-full flex items-center gap-3 px-4 py-3 mt-1 rounded-xl text-sm text-slate-400 hover:bg-white/5 hover:text-white"
                    >
                        <FolderIcon />
                        Projects
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

                {/* DESKTOP HEADER */}

                <header className="hidden lg:flex h-20 bg-white border-b border-slate-200 px-8 items-center justify-between">

                    <div>

                        <h1 className="text-lg font-bold">
                            Dashboard
                        </h1>

                        <p className="text-sm text-slate-500 mt-1">
                            Monitor your radio intelligence projects.
                        </p>

                    </div>

                    <div className="flex items-center gap-6">

                        <button
                            type="button"
                            onClick={
                                refreshDashboard
                            }
                            disabled={
                                refreshing
                            }
                            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
                            title="Refresh dashboard"
                        >
                            <span
                                className={
                                    refreshing
                                        ? "animate-spin"
                                        : ""
                                }
                            >
                                <RefreshIcon />
                            </span>
                        </button>

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

                    {/* MOBILE HEADING */}

                    <div className="lg:hidden mb-6 flex items-start justify-between gap-4">

                        <div>

                            <h1 className="text-xl font-bold">
                                Dashboard
                            </h1>

                            <p className="text-sm text-slate-500 mt-1">
                                Welcome back,{" "}
                                {username}.
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={
                                refreshDashboard
                            }
                            disabled={
                                refreshing
                            }
                            className="w-10 h-10 shrink-0 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 disabled:opacity-50"
                        >
                            <span
                                className={
                                    refreshing
                                        ? "animate-spin"
                                        : ""
                                }
                            >
                                <RefreshIcon />
                            </span>
                        </button>

                    </div>


                    {/* WELCOME CARD */}

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

                            <div className="mt-5 flex flex-wrap gap-2">

                                <button
                                    type="button"
                                    onClick={
                                        openProjects
                                    }
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-700 text-sm font-semibold hover:bg-indigo-50 transition"
                                >
                                    <FolderIcon />
                                    View Projects
                                </button>

                            </div>

                        </div>

                        <div className="absolute -right-16 -top-20 w-64 h-64 rounded-full bg-white/10" />

                        <div className="absolute right-10 bottom-[-80px] w-48 h-48 rounded-full bg-white/5" />

                    </div>


                    {/* STATISTICS */}

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">

                        <StatCard
                            title="Projects"
                            value={
                                statsLoading
                                    ? "..."
                                    : stats.projects
                            }
                            icon={
                                <FolderIcon />
                            }
                        />

                        <StatCard
                            title="Broadcast Hours"
                            value={
                                statsLoading
                                    ? "..."
                                    : stats.broadcasts
                            }
                            icon={
                                <RadioIcon />
                            }
                        />

                        <StatCard
                            title="Advertisements"
                            value={
                                statsLoading
                                    ? "..."
                                    : stats.advertisements
                            }
                            icon={
                                <AdIcon />
                            }
                        />

                        <StatCard
                            title="Segments"
                            value={
                                statsLoading
                                    ? "..."
                                    : stats.segments
                            }
                            icon={
                                <AudioIcon />
                            }
                        />

                    </div>


                    {/* PROCESSING + QUICK ACTIONS */}

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">

                        <section className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6">

                            <div className="flex items-center justify-between mb-5">

                                <div>

                                    <h2 className="font-bold">
                                        Processing Activity
                                    </h2>

                                    <p className="text-xs text-slate-500 mt-1">
                                        Current upload and processing status.
                                    </p>

                                </div>

                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                    <RadioIcon />
                                </div>

                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                                <StatusSummary
                                    label="Completed"
                                    value={
                                        stats.completed
                                    }
                                    type="completed"
                                />

                                <StatusSummary
                                    label="Processing"
                                    value={
                                        stats.processing
                                    }
                                    type="processing"
                                />

                                <StatusSummary
                                    label="Failed"
                                    value={
                                        stats.failed
                                    }
                                    type="failed"
                                />

                                <StatusSummary
                                    label="Cancelled"
                                    value={
                                        stats.cancelled
                                    }
                                    type="cancelled"
                                />

                            </div>

                            {stats.processing >
                                0 && (
                                <div className="mt-5 rounded-xl bg-indigo-50 border border-indigo-100 p-4">

                                    <div className="flex items-center gap-3">

                                        <div className="w-8 h-8 rounded-lg bg-white text-indigo-600 flex items-center justify-center">
                                            <Spinner />
                                        </div>

                                        <div>

                                            <p className="text-sm font-semibold text-indigo-900">
                                                Processing in progress
                                            </p>

                                            <p className="text-xs text-indigo-600 mt-0.5">
                                                Your audio is currently being processed.
                                            </p>

                                        </div>

                                    </div>

                                </div>
                            )}

                        </section>


                        {/* QUICK ACTIONS */}

                        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6">

                            <h2 className="font-bold">
                                Quick Actions
                            </h2>

                            <p className="text-xs text-slate-500 mt-1 mb-5">
                                Common actions.
                            </p>

                            <div className="space-y-2">

                                <QuickAction
                                    icon={
                                        <FolderIcon />
                                    }
                                    title="View Projects"
                                    description="Open your radio projects"
                                    onClick={
                                        openProjects
                                    }
                                />

                                <QuickAction
                                    icon={
                                        <RadioIcon />
                                    }
                                    title="Refresh Data"
                                    description="Reload dashboard statistics"
                                    onClick={
                                        refreshDashboard
                                    }
                                />

                                {role.toUpperCase() ===
                                    "ADMIN" && (
                                    <QuickAction
                                        icon={
                                            <UsersIcon />
                                        }
                                        title="User Management"
                                        description="Manage system users"
                                        onClick={() =>
                                            router.push(
                                                "/admin/users"
                                            )
                                        }
                                    />
                                )}

                            </div>

                        </section>

                    </div>


                    {/* RECENT PROJECTS */}

                    <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">

                        <div className="px-5 sm:px-6 py-5 border-b border-slate-200 flex items-center justify-between">

                            <div>

                                <h2 className="font-bold">
                                    Recent Projects
                                </h2>

                                <p className="text-xs text-slate-500 mt-1">
                                    Your most recently created projects.
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={
                                    openProjects
                                }
                                className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                            >
                                View all →
                            </button>

                        </div>

                        {loading ? (

                            <div className="py-12 flex justify-center">
                                <Spinner />
                            </div>

                        ) : recentProjects.length ===
                          0 ? (

                            <div className="py-14 px-6 text-center">

                                <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                    <FolderIcon />
                                </div>

                                <h3 className="mt-3 font-semibold">
                                    No projects yet
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Your radio projects will appear here.
                                </p>

                            </div>

                        ) : (

                            <div className="divide-y divide-slate-100">

                                {recentProjects.map(
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
                                            className="w-full text-left px-5 sm:px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition"
                                        >

                                            <div className="w-11 h-11 shrink-0 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                                <FolderIcon />
                                            </div>

                                            <div className="min-w-0 flex-1">

                                                <p className="font-semibold text-sm truncate">
                                                    {
                                                        project.name
                                                    }
                                                </p>

                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">

                                                    <span className="text-xs text-slate-400">
                                                        Project #
                                                        {
                                                            project.id
                                                        }
                                                    </span>

                                                    {project.broadcast_date && (
                                                        <span className="text-xs text-slate-400">
                                                            {formatDate(
                                                                project.broadcast_date
                                                            )}
                                                        </span>
                                                    )}

                                                </div>

                                            </div>

                                            <div className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-slate-300 hover:bg-indigo-50 hover:text-indigo-600">
                                                <ArrowIcon />
                                            </div>

                                        </button>

                                    )
                                )}

                            </div>

                        )}

                    </section>


                    {/* =================================================
                        RECENT ACTIVITY
                    ================================================== */}

                    <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

                        <div className="px-5 sm:px-6 py-5 border-b border-slate-200">

                            <h2 className="font-bold">
                                Recent Upload Activity
                            </h2>

                            <p className="text-xs text-slate-500 mt-1">
                                Latest audio processing history.
                            </p>

                        </div>

                        {activities.length ===
                        0 ? (

                            <div className="py-14 px-6 text-center">

                                <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                    <AudioIcon />
                                </div>

                                <h3 className="mt-3 font-semibold">
                                    No upload activity
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Upload activity will appear here.
                                </p>

                            </div>

                        ) : (

                            <div className="divide-y divide-slate-100">

                                {activities.map(
                                    (
                                        activity
                                    ) => {

                                        const isCompleted =
                                            activity.status ===
                                            "COMPLETED";

                                        return (
                                            <div
                                                key={
                                                    activity.id
                                                }
                                                onClick={() => {
                                                    if (
                                                        isCompleted
                                                    ) {
                                                        openAdEditor(
                                                            activity
                                                        );
                                                    }
                                                }}
                                                role={
                                                    isCompleted
                                                        ? "button"
                                                        : undefined
                                                }
                                                tabIndex={
                                                    isCompleted
                                                        ? 0
                                                        : undefined
                                                }
                                                onKeyDown={(
                                                    event
                                                ) => {
                                                    if (
                                                        isCompleted &&
                                                        (
                                                            event.key ===
                                                                "Enter" ||
                                                            event.key ===
                                                                " "
                                                        )
                                                    ) {
                                                        event.preventDefault();

                                                        openAdEditor(
                                                            activity
                                                        );
                                                    }
                                                }}
                                                className={`px-5 sm:px-6 py-4 ${
                                                    isCompleted
                                                        ? "cursor-pointer hover:bg-indigo-50/50 transition"
                                                        : ""
                                                }`}
                                            >

                                                <div className="flex items-start gap-3">

                                                    <ActivityStatusIcon
                                                        status={
                                                            activity.status
                                                        }
                                                    />

                                                    <div className="min-w-0 flex-1">

                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">

                                                            <p className="text-sm font-semibold truncate">
                                                                {
                                                                    activity.projectName
                                                                }
                                                            </p>

                                                            <StatusBadge
                                                                status={
                                                                    activity.status
                                                                }
                                                            />

                                                        </div>

                                                        <p className="text-xs text-slate-500 mt-1 truncate">
                                                            {
                                                                activity.filename
                                                            }
                                                        </p>

                                                        <div className="flex flex-wrap items-center gap-2 mt-2">

                                                            {activity.broadcastHour !==
                                                                null &&
                                                                activity.broadcastHour !==
                                                                    undefined && (
                                                                    <span className="text-[11px] font-medium px-2 py-1 rounded-md bg-slate-100 text-slate-600">
                                                                        Hour{" "}
                                                                        {formatHour(
                                                                            activity.broadcastHour
                                                                        )}
                                                                    </span>
                                                                )}

                                                            {activity.status ===
                                                                "PROCESSING" && (
                                                                <span className="text-[11px] text-indigo-600 font-medium">
                                                                    {
                                                                        activity.progress
                                                                    }
                                                                    %
                                                                </span>
                                                            )}

                                                            <span className="text-[11px] text-slate-400">
                                                                {formatDateTime(
                                                                    activity.updatedAt
                                                                )}
                                                            </span>

                                                        </div>

                                                        {activity.message && (
                                                            <p className="text-xs text-slate-400 mt-2 line-clamp-1">
                                                                {
                                                                    activity.message
                                                                }
                                                            </p>
                                                        )}

                                                        {isCompleted && (
                                                            <p className="text-[11px] text-indigo-600 font-medium mt-2">
                                                                Open Ad Editor →
                                                            </p>
                                                        )}

                                                    </div>

                                                </div>

                                            </div>
                                        );
                                    }
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
   STATUS SUMMARY
================================================================ */

function StatusSummary({
    label,
    value,
    type,
}: {
    label: string;
    value: number;
    type:
        | "completed"
        | "processing"
        | "failed"
        | "cancelled";
}) {
    const classes = {
        completed:
            "bg-emerald-50 text-emerald-700",

        processing:
            "bg-indigo-50 text-indigo-700",

        failed:
            "bg-red-50 text-red-700",

        cancelled:
            "bg-slate-100 text-slate-600",
    };

    return (
        <div className="rounded-xl border border-slate-100 p-3">

            <div className="flex items-center gap-2">

                <div
                    className={`w-2 h-2 rounded-full ${
                        classes[type]
                            .split(" ")[1]
                            .replace(
                                "text-",
                                "bg-"
                            )
                    }`}
                />

                <p className="text-xs text-slate-500">
                    {label}
                </p>

            </div>

            <p className="mt-2 text-xl font-bold">
                {value}
            </p>

        </div>
    );
}


/* ================================================================
   QUICK ACTION
================================================================ */

function QuickAction({
    icon,
    title,
    description,
    onClick,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition text-left"
        >

            <div className="w-9 h-9 shrink-0 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                {icon}
            </div>

            <div className="min-w-0 flex-1">

                <p className="text-sm font-semibold">
                    {title}
                </p>

                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {description}
                </p>

            </div>

            <ArrowIcon />

        </button>
    );
}


/* ================================================================
   STATUS BADGE
================================================================ */

function StatusBadge({
    status,
}: {
    status: string;
}) {
    const normalized =
        status.toUpperCase();

    let className =
        "bg-slate-100 text-slate-600";

    let label =
        normalized;

    if (
        normalized ===
        "COMPLETED"
    ) {
        className =
            "bg-emerald-50 text-emerald-700";

        label =
            "Completed";
    } else if (
        normalized ===
        "PROCESSING"
    ) {
        className =
            "bg-indigo-50 text-indigo-700";

        label =
            "Processing";
    } else if (
        normalized ===
        "STARTING"
    ) {
        className =
            "bg-blue-50 text-blue-700";

        label =
            "Starting";
    } else if (
        normalized ===
        "CANCELLING"
    ) {
        className =
            "bg-amber-50 text-amber-700";

        label =
            "Cancelling";
    } else if (
        normalized ===
        "FAILED"
    ) {
        className =
            "bg-red-50 text-red-700";

        label =
            "Failed";
    } else if (
        normalized ===
        "CANCELLED"
    ) {
        className =
            "bg-slate-100 text-slate-600";

        label =
            "Cancelled";
    }

    return (
        <span
            className={`inline-flex w-fit px-2 py-1 rounded-md text-[10px] font-semibold ${className}`}
        >
            {label}
        </span>
    );
}


/* ================================================================
   ACTIVITY STATUS ICON
================================================================ */

function ActivityStatusIcon({
    status,
}: {
    status: string;
}) {
    const normalized =
        status.toUpperCase();

    if (
        normalized ===
        "COMPLETED"
    ) {
        return (
            <div className="w-9 h-9 shrink-0 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckIcon />
            </div>
        );
    }

    if (
        normalized ===
            "PROCESSING" ||
        normalized ===
            "STARTING" ||
        normalized ===
            "CANCELLING"
    ) {
        return (
            <div className="w-9 h-9 shrink-0 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <RadioIcon />
            </div>
        );
    }

    if (
        normalized ===
        "FAILED"
    ) {
        return (
            <div className="w-9 h-9 shrink-0 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <AlertIcon />
            </div>
        );
    }

    return (
        <div className="w-9 h-9 shrink-0 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
            <AudioIcon />
        </div>
    );
}


/* ================================================================
   DATE HELPERS
================================================================ */

function formatDate(
    value?: string
) {
    if (!value) {
        return "";
    }

    try {
        return new Date(
            value
        ).toLocaleDateString(
            "en-PH",
            {
                year: "numeric",
                month: "short",
                day: "numeric",
            }
        );
    } catch {
        return value;
    }
}


function formatDateTime(
    value?: string
) {
    if (!value) {
        return "";
    }

    try {
        return new Date(
            value
        ).toLocaleString(
            "en-PH",
            {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
            }
        );
    } catch {
        return value;
    }
}


function formatHour(
    hour: number
) {
    const normalized =
        Number(hour);

    if (
        Number.isNaN(
            normalized
        )
    ) {
        return String(hour);
    }

    const suffix =
        normalized >= 12
            ? "PM"
            : "AM";

    let display =
        normalized % 12;

    if (
        display === 0
    ) {
        display = 12;
    }

    return `${display}:00 ${suffix}`;
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

                <p className="text-[10px] text-slate-500">
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
                ?.toUpperCase() ||
                "U"}
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
   CHECK ICON
================================================================ */

function CheckIcon() {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m5 12 4 4L19 6" />
        </svg>
    );
}


/* ================================================================
   ALERT ICON
================================================================ */

function AlertIcon() {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M10.3 3.7 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />

            <path d="M12 9v4" />

            <path d="M12 17h.01" />
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
            width="22"
            height="22"
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
