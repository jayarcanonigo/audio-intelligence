"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import { useRouter } from "next/navigation";

import {
    Wallet,
    WalletTransaction,
    WalletUser,
    depositWallet,
    debitWallet,
    refundWallet,
    getWallet,
    getWalletTransactions,
    getWalletUsers,
} from "@/services/wallet";

import styles from "./Wallet.module.css";

type ModalType =
    | "deposit"
    | "debit"
    | "refund"
    | null;


// ============================================================
// HELPERS
// ============================================================

function money(
    value: number | string | null | undefined
) {
    const amount = Number(value ?? 0);

    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(
        Number.isFinite(amount) ? amount : 0
    );
}


function formatDate(
    value: string | undefined,
    mounted: boolean
) {
    if (!mounted || !value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}


function transactionLabel(type: string) {
    switch (type.toUpperCase()) {

        case "DEPOSIT":
            return "Deposit";

        case "DEBIT":
            return "Debit";

        case "REFUND":
            return "Refund";

        case "TRANSFER":
            return "Transfer";

        default:
            return type;

    }
}


// ============================================================
// PAGE
// ============================================================

export default function WalletPage() {

    const router = useRouter();


    // ========================================================
    // HYDRATION
    // ========================================================

    const [mounted, setMounted] =
        useState(false);

    const [username, setUsername] =
        useState("Admin");


    // ========================================================
    // WALLET
    // ========================================================

    const [wallet, setWallet] =
        useState<Wallet | null>(null);

    const [transactions, setTransactions] =
        useState<WalletTransaction[]>([]);


    // ========================================================
    // USERS
    // ========================================================

    const [users, setUsers] =
        useState<WalletUser[]>([]);

    const [selectedUserId, setSelectedUserId] =
        useState("");


    // ========================================================
    // LOADING
    // ========================================================

    const [loading, setLoading] =
        useState(true);

    const [transactionLoading, setTransactionLoading] =
        useState(false);

    const [submitting, setSubmitting] =
        useState(false);


    // ========================================================
    // MESSAGES
    // ========================================================

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    // ========================================================
    // MODAL
    // ========================================================

    const [modal, setModal] =
        useState<ModalType>(null);

    const [amount, setAmount] =
        useState("");

    const [reference, setReference] =
        useState("");

    const [description, setDescription] =
        useState("");

    const [projectId, setProjectId] =
        useState("");


    // ========================================================
    // FILTERS
    // ========================================================

    const [transactionType, setTransactionType] =
        useState("");

    const [status, setStatus] =
        useState("");


    // ========================================================
    // MOBILE MENU
    // ========================================================

    const [mobileMenu, setMobileMenu] =
        useState(false);


    // ========================================================
    // LOGOUT
    // ========================================================

    const logout = useCallback(() => {

        if (typeof window !== "undefined") {

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

        }

        router.replace("/login");

    }, [router]);


    // ========================================================
    // LOAD DATA
    // ========================================================

    const loadWallet = useCallback(
        async () => {

            try {

                setLoading(true);

                setError("");

                const [
                    walletData,
                    transactionData,
                    userData,
                ] = await Promise.all([

                    getWallet(),

                    getWalletTransactions({
                        limit: 100,
                    }),

                    getWalletUsers(),

                ]);

                setWallet(walletData);

                setTransactions(
                    transactionData
                );

                setUsers(userData);

            } catch (err: any) {

                console.error(
                    "Wallet loading error:",
                    err
                );

                const message =
                    err?.message || "";

                const lowerMessage =
                    message.toLowerCase();

                if (
                    message.includes("401") ||
                    lowerMessage.includes(
                        "unauthorized"
                    )
                ) {

                    logout();

                    return;
                }

                setError(
                    message ||
                    "Unable to load wallet."
                );

            } finally {

                setLoading(false);

            }

        },
        [logout]
    );


    // ========================================================
    // AUTH + INITIAL LOAD
    // ========================================================

    useEffect(() => {

        setMounted(true);

        const token =
            localStorage.getItem(
                "access_token"
            );

        const role =
            localStorage.getItem(
                "role"
            );

        const storedUsername =
            localStorage.getItem(
                "username"
            );

        if (storedUsername) {

            setUsername(
                storedUsername
            );

        }

        if (!token) {

            router.replace(
                "/login"
            );

            return;

        }

        if (
            role !== "ADMIN" &&
            role !== "admin"
        ) {

            router.replace(
                "/dashboard"
            );

            return;

        }

        loadWallet();

    }, [
        router,
        loadWallet,
    ]);


    // ========================================================
    // FILTER TRANSACTIONS
    // ========================================================

    const filteredTransactions =
        useMemo(() => {

            return transactions.filter(
                (transaction) => {

                    if (
                        transactionType &&
                        transaction.type
                            .toUpperCase() !==
                        transactionType
                    ) {

                        return false;

                    }

                    if (
                        status &&
                        transaction.status
                            .toUpperCase() !==
                        status
                    ) {

                        return false;

                    }

                    return true;

                }
            );

        }, [
            transactions,
            transactionType,
            status,
        ]);


    // ========================================================
    // TRANSACTION STATS
    // ========================================================

    const stats = useMemo(() => {

        let deposits = 0;

        let debits = 0;

        let refunds = 0;

        for (
            const transaction
            of transactions
        ) {

            const value =
                Number(
                    transaction.amount ?? 0
                );

            if (!Number.isFinite(value)) {
                continue;
            }

            switch (
                transaction.type.toUpperCase()
            ) {

                case "DEPOSIT":

                    deposits += value;

                    break;

                case "DEBIT":

                    debits += value;

                    break;

                case "REFUND":

                    refunds += value;

                    break;

            }

        }

        return {
            deposits,
            debits,
            refunds,
        };

    }, [
        transactions,
    ]);


    // Prevent unused variable warnings while
    // keeping the stats available for future UI.
    void stats;


    // ========================================================
    // DASHBOARD SUMMARY
    // ========================================================

    const dashboardStats = useMemo(() => {

        // ----------------------------------------------------
        // USERS TOTAL BALANCE
        // ----------------------------------------------------

        const usersBalance =
            users.reduce(
                (
                    total,
                    user
                ) => {

                    const balance =
                        Number(
                            user.balance ?? 0
                        );

                    if (
                        !Number.isFinite(
                            balance
                        )
                    ) {

                        return total;

                    }

                    return (
                        total +
                        balance
                    );

                },
                0
            );


        // ----------------------------------------------------
        // TODAY
        // ----------------------------------------------------

        const now =
            new Date();

        const todayYear =
            now.getFullYear();

        const todayMonth =
            now.getMonth();

        const todayDate =
            now.getDate();


        // ----------------------------------------------------
        // TODAY'S TRANSACTIONS
        // ----------------------------------------------------

        const todayTransactions =
            transactions.filter(
                (transaction) => {

                    if (
                        !transaction.created_at
                    ) {

                        return false;

                    }

                    const date =
                        new Date(
                            transaction.created_at
                        );

                    if (
                        Number.isNaN(
                            date.getTime()
                        )
                    ) {

                        return false;

                    }

                    return (
                        date.getFullYear() ===
                            todayYear &&
                        date.getMonth() ===
                            todayMonth &&
                        date.getDate() ===
                            todayDate
                    );

                }
            );


        // ----------------------------------------------------
        // UPLOADS TODAY
        // ----------------------------------------------------

        const uploadsToday =
            todayTransactions.filter(
                (transaction) => {

                    const reference =
                        String(
                            transaction.reference ??
                            ""
                        ).toUpperCase();

                    const description =
                        String(
                            transaction.description ??
                            ""
                        ).toLowerCase();

                    return (
                        reference.startsWith(
                            "UPLOAD-"
                        ) ||
                        description.includes(
                            "audio upload charge"
                        )
                    );

                }
            ).length;


        // ----------------------------------------------------
        // REVENUE TODAY
        // ----------------------------------------------------

        const revenueToday =
            todayTransactions.reduce(
                (
                    total,
                    transaction
                ) => {

                    const reference =
                        String(
                            transaction.reference ??
                            ""
                        ).toUpperCase();

                    const description =
                        String(
                            transaction.description ??
                            ""
                        ).toLowerCase();

                    const isUpload =
                        reference.startsWith(
                            "UPLOAD-"
                        ) ||
                        description.includes(
                            "audio upload charge"
                        );

                    if (!isUpload) {

                        return total;

                    }

                    if (
                        transaction.type
                            .toUpperCase() !==
                        "DEBIT"
                    ) {

                        return total;

                    }

                    if (
                        String(
                            transaction.status ??
                            ""
                        ).toUpperCase() !==
                        "COMPLETED"
                    ) {

                        return total;

                    }

                    const value =
                        Number(
                            transaction.amount ??
                            0
                        );

                    if (
                        !Number.isFinite(
                            value
                        )
                    ) {

                        return total;

                    }

                    return (
                        total +
                        value
                    );

                },
                0
            );


        return {

            usersBalance,

            uploadsToday,

            revenueToday,

        };

    }, [
        users,
        transactions,
    ]);


    // ========================================================
    // SELECTED USER
    // ========================================================

    const selectedUser =
        useMemo(() => {

            if (!selectedUserId) {

                return null;

            }

            return (
                users.find(
                    (user) =>
                        String(user.id) ===
                        selectedUserId
                ) ||
                null
            );

        }, [
            users,
            selectedUserId,
        ]);


    // ========================================================
    // OPEN MODAL
    // ========================================================

    function openModal(
        type: ModalType
    ) {

        setError("");

        setSuccess("");

        setModal(type);

        setAmount("");

        setReference("");

        setDescription("");

        setProjectId("");

        if (type !== "deposit") {

            setSelectedUserId("");

        }

    }


    // ========================================================
    // CLOSE MODAL
    // ========================================================

    function closeModal() {

        if (submitting) {

            return;

        }

        setModal(null);

        setAmount("");

        setReference("");

        setDescription("");

        setProjectId("");

        setSelectedUserId("");

    }


    // ========================================================
    // SUBMIT
    // ========================================================

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {

        event.preventDefault();

        setError("");

        setSuccess("");

        const numericAmount =
            Number(amount);

        if (
            !Number.isFinite(
                numericAmount
            ) ||
            numericAmount <= 0
        ) {

            setError(
                "Please enter a valid amount."
            );

            return;

        }

        if (!reference.trim()) {

            setError(
                "Reference is required."
            );

            return;

        }


        // ====================================================
        // DEPOSIT VALIDATION
        // ====================================================

        if (modal === "deposit") {

            if (!selectedUserId) {

                setError(
                    "Please select a user."
                );

                return;

            }

        }


        try {

            setSubmitting(true);


            // ==================================================
            // DEPOSIT
            // ==================================================

            if (modal === "deposit") {

                await depositWallet({

                    user_id:
                        Number(
                            selectedUserId
                        ),

                    amount:
                        numericAmount,

                    reference:
                        reference.trim(),

                    description:
                        description.trim() ||
                        undefined,

                });

                const selectedUsername =
                    selectedUser?.username ||
                    `User #${selectedUserId}`;

                setSuccess(
                    `Successfully deposited ${money(
                        numericAmount
                    )} to ${selectedUsername}.`
                );

            }


            // ==================================================
            // DEBIT
            // ==================================================

            if (modal === "debit") {

                await debitWallet({

                    amount:
                        numericAmount,

                    project_id:
                        projectId
                            ? Number(
                                projectId
                            )
                            : null,

                    reference:
                        reference.trim(),

                    description:
                        description.trim() ||
                        undefined,

                });

                setSuccess(
                    `Successfully debited ${money(
                        numericAmount
                    )}.`
                );

            }


            // ==================================================
            // REFUND
            // ==================================================

            if (modal === "refund") {

                await refundWallet({

                    amount:
                        numericAmount,

                    project_id:
                        projectId
                            ? Number(
                                projectId
                            )
                            : null,

                    reference:
                        reference.trim(),

                    description:
                        description.trim() ||
                        undefined,

                });

                setSuccess(
                    `Successfully refunded ${money(
                        numericAmount
                    )}.`
                );

            }


            // Close modal manually because
            // closeModal() ignores itself while submitting.
            setModal(null);

            setAmount("");

            setReference("");

            setDescription("");

            setProjectId("");

            setSelectedUserId("");

            await loadWallet();

        } catch (err: any) {

            console.error(
                "Wallet operation error:",
                err
            );

            setError(
                err?.message ||
                "Wallet operation failed."
            );

        } finally {

            setSubmitting(false);

        }

    }


    // ========================================================
    // REFRESH
    // ========================================================

    async function refreshWallet() {

        try {

            setTransactionLoading(
                true
            );

            setError("");

            await loadWallet();

        } finally {

            setTransactionLoading(
                false
            );

        }

    }


    // ========================================================
    // LOADING
    // ========================================================

    if (loading) {

        return (

            <main className="min-h-screen bg-slate-100">

                <div
                    className={
                        styles.loading
                    }
                >
                    Loading wallet...
                </div>

            </main>

        );

    }


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <main className="min-h-screen bg-slate-100 text-slate-900">


            {/* ====================================================
                MOBILE HEADER
            ==================================================== */}

            <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200">

                <div className="h-16 px-4 flex items-center justify-between">

                    <div className="flex items-center gap-3">

                        <Logo />

                        <div>

                            <p className="text-sm font-bold">
                                Radio Intelligence
                            </p>

                            <p className="text-[11px] text-slate-500">
                                Administration
                            </p>

                        </div>

                    </div>


                    <button
                        onClick={() =>
                            setMobileMenu(
                                !mobileMenu
                            )
                        }
                        className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center"
                    >

                        {mobileMenu ? (
                            <CloseIcon />
                        ) : (
                            <MenuIcon />
                        )}

                    </button>

                </div>


                {mobileMenu && (

                    <div className="border-t border-slate-100 bg-white px-4 py-4">

                        <div className="mb-4 flex items-center gap-3 p-3 rounded-xl bg-slate-50">

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
                                    Administrator
                                </p>

                            </div>

                        </div>


                        <button
                            onClick={() =>
                                router.push(
                                    "/dashboard"
                                )
                            }
                            className="w-full text-left rounded-lg px-3 py-3 text-sm hover:bg-slate-50"
                        >
                            Dashboard
                        </button>


                        <button
                            onClick={() =>
                                router.push(
                                    "/admin/users"
                                )
                            }
                            className="w-full text-left rounded-lg px-3 py-3 text-sm hover:bg-slate-50"
                        >
                            User Management
                        </button>


                        <button
                            className="w-full text-left rounded-lg px-3 py-3 text-sm bg-indigo-50 text-indigo-700 font-semibold"
                        >
                            Wallet Management
                        </button>


                        <button
                            onClick={logout}
                            className="w-full text-left rounded-lg px-3 py-3 text-sm text-red-600 hover:bg-red-50"
                        >
                            Logout
                        </button>

                    </div>

                )}

            </header>


            {/* ====================================================
                DESKTOP SIDEBAR
            ==================================================== */}

            <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-slate-950 text-white flex-col">

                <div className="h-20 px-6 flex items-center border-b border-white/10">

                    <Logo dark />

                    <div className="ml-3">

                        <p className="text-sm font-bold">
                            Radio Intelligence
                        </p>

                        <p className="text-[10px] text-slate-500">
                            Administration
                        </p>

                    </div>

                </div>


                <nav className="flex-1 p-4">

                    <button
                        onClick={() =>
                            router.push(
                                "/dashboard"
                            )
                        }
                        className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
                    >

                        <DashboardIcon />

                        Dashboard

                    </button>


                    <button
                        onClick={() =>
                            router.push(
                                "/admin/users"
                            )
                        }
                        className="w-full flex items-center gap-3 rounded-xl px-4 py-3 mt-1 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
                    >

                        <UsersIcon />

                        User Management

                    </button>


                    <button
                        className="w-full flex items-center gap-3 rounded-xl px-4 py-3 mt-1 text-sm bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    >

                        <WalletIcon />

                        Wallet Management

                    </button>

                </nav>


                <div className="p-4 border-t border-white/10">

                    <div className="flex items-center gap-3 mb-3 px-2">

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
                                Administrator
                            </p>

                        </div>

                    </div>


                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                    >

                        <LogoutIcon />

                        Logout

                    </button>

                </div>

            </aside>


            {/* ====================================================
                MAIN
            ==================================================== */}

            <div className="lg:ml-64 min-h-screen">


                {/* =================================================
                    TOP BAR
                ================================================= */}

                <header className="hidden lg:flex h-20 bg-white border-b border-slate-200 items-center justify-between px-8">

                    <div>

                        <h1 className="text-lg font-bold">
                            Wallet Management
                        </h1>

                        <p className="text-sm text-slate-500">
                            Manage user wallet balance
                            and transactions.
                        </p>

                    </div>


                    <button
                        onClick={
                            refreshWallet
                        }
                        disabled={
                            transactionLoading
                        }
                        className="h-10 px-4 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                    >

                        <span className="flex items-center gap-2">

                            <RefreshIcon />

                            {transactionLoading
                                ? "Refreshing..."
                                : "Refresh"}

                        </span>

                    </button>

                </header>


                {/* =================================================
                    CONTENT
                ================================================= */}

                <div className="p-4 sm:p-6 lg:p-8">


                    {/* =================================================
                        MOBILE TITLE
                    ================================================= */}

                    <div className="lg:hidden mb-5">

                        <div className="flex items-start justify-between gap-4">

                            <div>

                                <h1 className="text-xl font-bold">
                                    Wallet Management
                                </h1>

                                <p className="text-sm text-slate-500 mt-1">
                                    Manage user wallet
                                    transactions.
                                </p>

                            </div>


                            <button
                                onClick={
                                    refreshWallet
                                }
                                disabled={
                                    transactionLoading
                                }
                                className="h-10 px-3 rounded-lg border border-slate-200 text-sm font-semibold bg-white"
                            >

                                <RefreshIcon />

                            </button>

                        </div>

                    </div>


                    {/* =================================================
                        ALERT
                    ================================================= */}

                    {error && (

                        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 text-red-700 p-4">

                            <div className="flex items-center justify-between gap-3">

                                <div className="flex items-center gap-3 text-sm">

                                    <AlertIcon />

                                    {error}

                                </div>


                                <button
                                    onClick={() =>
                                        setError("")
                                    }
                                    type="button"
                                >
                                    <CloseIcon />
                                </button>

                            </div>

                        </div>

                    )}


                    {success && (

                        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 text-green-700 p-4">

                            <div className="flex items-center justify-between gap-3">

                                <div className="flex items-center gap-3 text-sm">

                                    <CheckIcon />

                                    {success}

                                </div>


                                <button
                                    onClick={() =>
                                        setSuccess("")
                                    }
                                    type="button"
                                >
                                    <CloseIcon />
                                </button>

                            </div>

                        </div>

                    )}


                    {/* =================================================
                        DASHBOARD SUMMARY
                    ================================================= */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">


                        {/* ADMIN BALANCE */}

                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">

                            <div className="flex items-start justify-between gap-4">

                                <div className="flex-1 min-w-0">

                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Admin Balance
                                    </p>

                                    <p className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 whitespace-nowrap">

                                        {money(
                                            wallet?.balance
                                        )}

                                    </p>

                                </div>


                                <div className="w-11 h-11 shrink-0 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">

                                    <WalletIcon />

                                </div>

                            </div>


                            <div className="mt-4">

                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">

                                    Wallet #
                                    {wallet?.id ?? "-"}

                                </span>

                            </div>

                        </div>


                        {/* USERS BALANCE */}

                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">

                            <div className="flex items-start justify-between gap-4">

                                <div className="flex-1 min-w-0">

                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Users Balance
                                    </p>

                                    <p className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 whitespace-nowrap">

                                        {money(
                                            dashboardStats.usersBalance
                                        )}

                                    </p>

                                </div>


                                <div className="w-11 h-11 shrink-0 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">

                                    <UsersIcon />

                                </div>

                            </div>


                            <div className="mt-4">

                                <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-medium text-green-700">

                                    {users.length} users

                                </span>

                            </div>

                        </div>


                        {/* UPLOADS TODAY */}

                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">

                            <div className="flex items-start justify-between gap-4">

                                <div className="min-w-0">

                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Uploads Today
                                    </p>

                                    <p className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">

                                        {
                                            dashboardStats.uploadsToday
                                        }

                                    </p>

                                </div>


                                <div className="w-11 h-11 shrink-0 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">

                                    <UploadIcon />

                                </div>

                            </div>


                            <div className="mt-4">

                                <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-medium text-purple-700">

                                    Audio uploads

                                </span>

                            </div>

                        </div>


                        {/* REVENUE TODAY */}

                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">

                            <div className="flex items-start justify-between gap-4">

                                <div className="min-w-0">

                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Revenue Today
                                    </p>

                                    <p className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 truncate">

                                        {money(
                                            dashboardStats.revenueToday
                                        )}

                                    </p>

                                </div>


                                <div className="w-11 h-11 shrink-0 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">

                                    <RevenueIcon />

                                </div>

                            </div>


                            <div className="mt-4">

                                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">

                                    Completed uploads

                                </span>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        WALLET ACTIONS
                    ================================================= */}

                    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-6 shadow-sm">

                        <div className="mb-4">

                            <h2 className="font-bold">
                                Wallet Actions
                            </h2>

                            <p className="text-xs text-slate-500 mt-1">
                                Only administrators can
                                perform wallet operations.
                            </p>

                        </div>


                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                            <button
                                onClick={() =>
                                    openModal(
                                        "deposit"
                                    )
                                }
                                className="h-12 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700"
                            >

                                <span className="flex items-center justify-center gap-2">

                                    <PlusIcon />

                                    Deposit to User

                                </span>

                            </button>


                            <button
                                onClick={() =>
                                    openModal(
                                        "debit"
                                    )
                                }
                                className="h-12 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700"
                            >

                                <span className="flex items-center justify-center gap-2">

                                    <MinusIcon />

                                    Debit

                                </span>

                            </button>


                            <button
                                onClick={() =>
                                    openModal(
                                        "refund"
                                    )
                                }
                                className="h-12 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                            >

                                <span className="flex items-center justify-center gap-2">

                                    <RefundIcon />

                                    Refund

                                </span>

                            </button>

                        </div>

                    </div>


                    {/* =================================================
                        TRANSACTION HISTORY
                    ================================================= */}

                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">


                        {/* HEADER */}

                        <div className="px-5 sm:px-6 py-5 border-b border-slate-200">

                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                                <div>

                                    <h2 className="font-bold">
                                        Transaction History
                                    </h2>

                                    <p className="text-xs text-slate-500 mt-1">

                                        {
                                            filteredTransactions.length
                                        }{" "}

                                        transaction

                                        {filteredTransactions.length !==
                                        1
                                            ? "s"
                                            : ""}{" "}

                                        displayed

                                    </p>

                                </div>


                                <div className="flex flex-col sm:flex-row gap-2">

                                    <select
                                        value={
                                            transactionType
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setTransactionType(
                                                event.target.value
                                            )
                                        }
                                        className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
                                    >

                                        <option value="">
                                            All Types
                                        </option>

                                        <option value="DEPOSIT">
                                            Deposits
                                        </option>

                                        <option value="DEBIT">
                                            Debits
                                        </option>

                                        <option value="REFUND">
                                            Refunds
                                        </option>

                                        <option value="TRANSFER">
                                            Transfers
                                        </option>

                                    </select>


                                    <select
                                        value={
                                            status
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setStatus(
                                                event.target.value
                                            )
                                        }
                                        className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
                                    >

                                        <option value="">
                                            All Status
                                        </option>

                                        <option value="COMPLETED">
                                            Completed
                                        </option>

                                        <option value="PENDING">
                                            Pending
                                        </option>

                                        <option value="FAILED">
                                            Failed
                                        </option>

                                    </select>

                                </div>

                            </div>

                        </div>


                        {/* =================================================
                            DESKTOP TABLE
                        ================================================= */}

                        <div className="hidden md:block overflow-x-auto">

                            <table className="w-full table-fixed">

                                <thead className="bg-slate-50 border-b border-slate-200">

                                    <tr>

                                        <th className="w-[15%] text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                            Date
                                        </th>

                                        <th className="w-[14%] text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                            User
                                        </th>

                                        <th className="w-[9%] text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                            Type
                                        </th>

                                        <th className="w-[27%] text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                            Reference
                                        </th>

                                        <th className="w-[8%] text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                            Project
                                        </th>

                                        <th className="w-[12%] text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                            Amount
                                        </th>

                                        <th className="w-[15%] text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                            Status
                                        </th>

                                    </tr>

                                </thead>


                                <tbody className="divide-y divide-slate-100">

                                    {filteredTransactions.length ===
                                    0 ? (

                                        <tr>

                                            <td
                                                colSpan={7}
                                                className="px-6 py-16 text-center text-sm text-slate-500"
                                            >
                                                No transactions
                                                found.
                                            </td>

                                        </tr>

                                    ) : (

                                        filteredTransactions.map(
                                            (
                                                transaction
                                            ) => {

                                                const type =
                                                    transaction.type.toUpperCase();

                                                return (

                                                    <tr
                                                        key={
                                                            transaction.id
                                                        }
                                                        className="hover:bg-slate-50/70"
                                                    >

                                                        <td className="px-4 py-3 text-xs text-slate-500">

                                                            <span className="block truncate">

                                                                {formatDate(
                                                                    transaction.created_at,
                                                                    mounted
                                                                )}

                                                            </span>

                                                        </td>


                                                        <td className="px-4 py-3">

                                                            <div className="flex items-center gap-2 min-w-0">

                                                                <Avatar
                                                                    username={
                                                                        transaction.username ||
                                                                        "?"
                                                                    }
                                                                />

                                                                <div className="min-w-0">

                                                                    <p className="text-xs font-semibold text-slate-800 truncate">

                                                                        {
                                                                            transaction.username ||
                                                                            "Unknown"
                                                                        }

                                                                    </p>

                                                                    <p className="text-[10px] text-slate-400">

                                                                        #
                                                                        {
                                                                            transaction.user_id ??
                                                                            "-"
                                                                        }

                                                                    </p>

                                                                </div>

                                                            </div>

                                                        </td>


                                                        <td className="px-4 py-3">

                                                            <TypeBadge
                                                                type={
                                                                    transaction.type
                                                                }
                                                            />

                                                        </td>


                                                        <td className="px-4 py-3">

                                                            <div className="min-w-0">

                                                                <p
                                                                    className="text-xs font-semibold text-slate-800 truncate"
                                                                    title={
                                                                        transaction.reference
                                                                    }
                                                                >

                                                                    {
                                                                        transaction.reference
                                                                    }

                                                                </p>


                                                                {transaction.description && (

                                                                    <p
                                                                        className="text-[10px] text-slate-400 mt-1 truncate"
                                                                        title={
                                                                            transaction.description
                                                                        }
                                                                    >

                                                                        {
                                                                            transaction.description
                                                                        }

                                                                    </p>

                                                                )}

                                                            </div>

                                                        </td>


                                                        <td className="px-4 py-3 text-xs text-slate-500">

                                                            {
                                                                transaction.project_id ??
                                                                "-"
                                                            }

                                                        </td>


                                                        <td className="px-4 py-3 text-right">

                                                            <span
                                                                className={
                                                                    type ===
                                                                    "DEBIT"

                                                                        ? "font-bold text-xs text-red-600"

                                                                        : "font-bold text-xs text-green-600"
                                                                }
                                                            >

                                                                {type ===
                                                                "DEBIT"
                                                                    ? "-"
                                                                    : "+"}

                                                                {money(
                                                                    transaction.amount
                                                                )}

                                                            </span>

                                                        </td>


                                                        <td className="px-4 py-3">

                                                            <StatusBadge
                                                                status={
                                                                    transaction.status
                                                                }
                                                            />

                                                        </td>

                                                    </tr>

                                                );

                                            }
                                        )

                                    )}

                                </tbody>

                            </table>

                        </div>


                        {/* =================================================
                            MOBILE
                        ================================================= */}

                        <div className="md:hidden divide-y divide-slate-100">

                            {filteredTransactions.length ===
                            0 ? (

                                <div className="p-10 text-center text-sm text-slate-500">

                                    No transactions
                                    found.

                                </div>

                            ) : (

                                filteredTransactions.map(
                                    (
                                        transaction
                                    ) => {

                                        const type =
                                            transaction.type.toUpperCase();

                                        return (

                                            <div
                                                key={
                                                    transaction.id
                                                }
                                                className="p-4"
                                            >

                                                <div className="flex items-start justify-between gap-3">

                                                    <div className="min-w-0">

                                                        <div className="flex items-center gap-2 flex-wrap">

                                                            <TypeBadge
                                                                type={
                                                                    transaction.type
                                                                }
                                                            />

                                                            <StatusBadge
                                                                status={
                                                                    transaction.status
                                                                }
                                                            />

                                                        </div>


                                                        <p
                                                            className="mt-2 text-sm font-semibold truncate"
                                                            title={
                                                                transaction.reference
                                                            }
                                                        >

                                                            {
                                                                transaction.reference
                                                            }

                                                        </p>

                                                    </div>


                                                    <p
                                                        className={
                                                            type ===
                                                            "DEBIT"

                                                                ? "font-bold text-red-600 whitespace-nowrap"

                                                                : "font-bold text-green-600 whitespace-nowrap"
                                                        }
                                                    >

                                                        {type ===
                                                        "DEBIT"
                                                            ? "-"
                                                            : "+"}

                                                        {money(
                                                            transaction.amount
                                                        )}

                                                    </p>

                                                </div>


                                                <div className="mt-4 rounded-lg bg-indigo-50 border border-indigo-100 p-3">

                                                    <div className="flex items-center gap-3">

                                                        <Avatar
                                                            username={
                                                                transaction.username ||
                                                                "?"
                                                            }
                                                        />

                                                        <div className="min-w-0">

                                                            <p className="text-[10px] uppercase tracking-wide text-indigo-400">
                                                                User
                                                            </p>

                                                            <p className="mt-1 text-sm font-semibold text-indigo-900 truncate">

                                                                {
                                                                    transaction.username ||
                                                                    "Unknown user"
                                                                }

                                                            </p>

                                                            <p className="text-xs text-indigo-500">

                                                                User #
                                                                {
                                                                    transaction.user_id ??
                                                                    "-"
                                                                }

                                                            </p>

                                                        </div>

                                                    </div>

                                                </div>


                                                <div className="mt-4 grid grid-cols-2 gap-3">

                                                    <div className="rounded-lg bg-slate-50 p-3">

                                                        <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                                            Date
                                                        </p>

                                                        <p className="mt-1 text-xs font-medium">

                                                            {formatDate(
                                                                transaction.created_at,
                                                                mounted
                                                            )}

                                                        </p>

                                                    </div>


                                                    <div className="rounded-lg bg-slate-50 p-3">

                                                        <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                                            Project
                                                        </p>

                                                        <p className="mt-1 text-xs font-medium">

                                                            {
                                                                transaction.project_id ??
                                                                "-"
                                                            }

                                                        </p>

                                                    </div>


                                                    <div className="rounded-lg bg-slate-50 p-3">

                                                        <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                                            Transaction
                                                        </p>

                                                        <p className="mt-1 text-xs font-medium">

                                                            #
                                                            {
                                                                transaction.id
                                                            }

                                                        </p>

                                                    </div>


                                                    <div className="rounded-lg bg-slate-50 p-3">

                                                        <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                                            Amount
                                                        </p>

                                                        <p className="mt-1 text-xs font-semibold">

                                                            {money(
                                                                transaction.amount
                                                            )}

                                                        </p>

                                                    </div>

                                                </div>


                                                {transaction.description && (

                                                    <div className="mt-3 rounded-lg bg-slate-50 p-3">

                                                        <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                                            Description
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-600">

                                                            {
                                                                transaction.description
                                                            }

                                                        </p>

                                                    </div>

                                                )}

                                            </div>

                                        );

                                    }
                                )

                            )}

                        </div>

                    </div>

                </div>

            </div>


            {/* ====================================================
                MODAL
            ==================================================== */}

            {modal && (

                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {

                            closeModal();

                        }

                    }}
                >

                    <div
                        className="
                            w-full
                            max-w-md
                            max-h-[90vh]
                            bg-white
                            rounded-2xl
                            shadow-2xl
                            overflow-hidden
                            flex
                            flex-col
                        "
                    >

                        {/* HEADER */}

                        <div
                            className="
                                shrink-0
                                px-5
                                sm:px-6
                                py-5
                                border-b
                                border-slate-200
                                flex
                                items-center
                                justify-between
                                bg-white
                            "
                        >

                            <div className="min-w-0">

                                <h2 className="text-lg font-bold truncate">

                                    {modal === "deposit"
                                        ? "Deposit to User"
                                        : modal === "debit"
                                            ? "Debit Wallet"
                                            : "Refund Wallet"}

                                </h2>

                                <p className="text-xs text-slate-500 mt-1">

                                    Enter the transaction
                                    details below.

                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={submitting}
                                className="
                                    shrink-0
                                    ml-3
                                    w-9
                                    h-9
                                    rounded-lg
                                    flex
                                    items-center
                                    justify-center
                                    text-slate-400
                                    hover:bg-slate-100
                                    hover:text-slate-700
                                    disabled:opacity-50
                                "
                            >

                                <CloseIcon />

                            </button>

                        </div>


                        {/* FORM */}

                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="
                                flex-1
                                overflow-y-auto
                                p-5
                                sm:p-6
                                space-y-5
                            "
                        >

                            {/* USER */}

                            {modal === "deposit" && (

                                <div>

                                    <label className="block text-sm font-semibold mb-2">
                                        User
                                    </label>


                                    <select
                                        value={
                                            selectedUserId
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setSelectedUserId(
                                                event.target.value
                                            )
                                        }
                                        required
                                        className="
                                            w-full
                                            h-12
                                            rounded-xl
                                            border
                                            border-slate-300
                                            bg-white
                                            px-4
                                            text-sm
                                            outline-none
                                            focus:border-indigo-500
                                            focus:ring-4
                                            focus:ring-indigo-500/10
                                        "
                                    >

                                        <option value="">
                                            Select a user
                                        </option>


                                        {users.map(
                                            (user) => (

                                                <option
                                                    key={
                                                        user.id
                                                    }
                                                    value={
                                                        user.id
                                                    }
                                                >

                                                    {
                                                        user.username
                                                    }

                                                    {user.email
                                                        ? ` - ${user.email}`
                                                        : ""}

                                                </option>

                                            )
                                        )}

                                    </select>


                                    {selectedUser && (

                                        <div
                                            className="
                                                mt-3
                                                rounded-xl
                                                bg-slate-50
                                                border
                                                border-slate-200
                                                p-4
                                            "
                                        >

                                            <div className="flex items-center justify-between gap-4">

                                                <div className="min-w-0">

                                                    <p className="text-xs text-slate-500">
                                                        Selected User
                                                    </p>

                                                    <p className="text-sm font-semibold mt-1 truncate">

                                                        {
                                                            selectedUser.username
                                                        }

                                                    </p>

                                                    {selectedUser.email && (

                                                        <p className="text-xs text-slate-500 mt-1 truncate">

                                                            {
                                                                selectedUser.email
                                                            }

                                                        </p>

                                                    )}

                                                </div>


                                                <div className="text-right shrink-0">

                                                    <p className="text-xs text-slate-500">
                                                        Current Balance
                                                    </p>

                                                    <p className="text-sm font-semibold mt-1 text-green-600">

                                                        {money(
                                                            selectedUser.balance
                                                        )}

                                                    </p>

                                                </div>

                                            </div>

                                        </div>

                                    )}

                                </div>

                            )}


                            {/* AMOUNT */}

                            <div>

                                <label className="block text-sm font-semibold mb-2">
                                    Amount
                                </label>


                                <div className="relative">

                                    <span
                                        className="
                                            absolute
                                            left-4
                                            top-1/2
                                            -translate-y-1/2
                                            text-slate-500
                                            font-semibold
                                        "
                                    >
                                        ₱
                                    </span>


                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={
                                            amount
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setAmount(
                                                event.target.value
                                            )
                                        }
                                        required
                                        className="
                                            w-full
                                            h-12
                                            rounded-xl
                                            border
                                            border-slate-300
                                            pl-9
                                            pr-4
                                            text-sm
                                            outline-none
                                            focus:border-indigo-500
                                            focus:ring-4
                                            focus:ring-indigo-500/10
                                        "
                                    />

                                </div>

                            </div>


                            {/* PROJECT */}

                            {(modal === "debit" ||
                                modal === "refund") && (

                                <div>

                                    <label className="block text-sm font-semibold mb-2">
                                        Project ID
                                    </label>


                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Optional"
                                        value={
                                            projectId
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setProjectId(
                                                event.target.value
                                            )
                                        }
                                        className="
                                            w-full
                                            h-12
                                            rounded-xl
                                            border
                                            border-slate-300
                                            px-4
                                            text-sm
                                            outline-none
                                            focus:border-indigo-500
                                            focus:ring-4
                                            focus:ring-indigo-500/10
                                        "
                                    />

                                </div>

                            )}


                            {/* REFERENCE */}

                            <div>

                                <label className="block text-sm font-semibold mb-2">
                                    Reference
                                </label>


                                <input
                                    type="text"
                                    placeholder="e.g. ADMIN-DEP-001"
                                    value={
                                        reference
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setReference(
                                            event.target.value
                                        )
                                    }
                                    required
                                    className="
                                        w-full
                                        h-12
                                        rounded-xl
                                        border
                                        border-slate-300
                                        px-4
                                        text-sm
                                        outline-none
                                        focus:border-indigo-500
                                        focus:ring-4
                                        focus:ring-indigo-500/10
                                    "
                                />

                            </div>


                            {/* DESCRIPTION */}

                            <div>

                                <label className="block text-sm font-semibold mb-2">
                                    Description
                                </label>


                                <textarea
                                    rows={3}
                                    placeholder="Optional description"
                                    value={
                                        description
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setDescription(
                                            event.target.value
                                        )
                                    }
                                    className="
                                        w-full
                                        rounded-xl
                                        border
                                        border-slate-300
                                        px-4
                                        py-3
                                        text-sm
                                        outline-none
                                        resize-none
                                        focus:border-indigo-500
                                        focus:ring-4
                                        focus:ring-indigo-500/10
                                    "
                                />

                            </div>


                            {/* BUTTONS */}

                            <div
                                className="
                                    flex
                                    flex-col-reverse
                                    sm:flex-row
                                    gap-3
                                    pt-1
                                    pb-1
                                "
                            >

                                <button
                                    type="button"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        submitting
                                    }
                                    className="
                                        w-full
                                        sm:flex-1
                                        h-11
                                        rounded-xl
                                        border
                                        border-slate-300
                                        text-sm
                                        font-semibold
                                        hover:bg-slate-50
                                        disabled:opacity-50
                                    "
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    disabled={
                                        submitting
                                    }
                                    className={`w-full sm:flex-1 h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-60 ${
                                        modal === "deposit"
                                            ? "bg-green-600 hover:bg-green-700"
                                            : modal === "debit"
                                                ? "bg-red-600 hover:bg-red-700"
                                                : "bg-indigo-600 hover:bg-indigo-700"
                                    }`}
                                >

                                    {submitting
                                        ? "Processing..."
                                        : modal ===
                                            "deposit"
                                            ? "Deposit"
                                            : modal ===
                                                "debit"
                                                ? "Debit"
                                                : "Refund"}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </main>

    );

}


// ============================================================
// TYPE BADGE
// ============================================================

function TypeBadge({
    type,
}: {
    type: string;
}) {

    const normalized =
        type.toUpperCase();


    const classes =
        normalized === "DEPOSIT"

            ? "bg-green-50 text-green-700 border-green-200"

            : normalized === "DEBIT"

                ? "bg-red-50 text-red-700 border-red-200"

                : normalized === "TRANSFER"

                    ? "bg-purple-50 text-purple-700 border-purple-200"

                    : "bg-indigo-50 text-indigo-700 border-indigo-200";


    return (

        <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${classes}`}
        >

            {transactionLabel(type)}

        </span>

    );

}


// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
    status,
}: {
    status: string;
}) {

    const normalized =
        String(status ?? "").toUpperCase();


    const classes =
        normalized === "COMPLETED"

            ? "bg-green-50 text-green-700 border-green-200"

            : normalized === "PENDING"

                ? "bg-amber-50 text-amber-700 border-amber-200"

                : normalized === "FAILED"

                    ? "bg-red-50 text-red-700 border-red-200"

                    : "bg-slate-50 text-slate-600 border-slate-200";


    return (

        <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${classes}`}
        >

            {status || "-"}

        </span>

    );

}


// ============================================================
// AVATAR
// ============================================================

function Avatar({
    username,
}: {
    username: string;
}) {

    const letter =
        username?.charAt(0)?.toUpperCase() ||
        "?";


    return (

        <div className="w-8 h-8 shrink-0 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">

            {letter}

        </div>

    );

}


// ============================================================
// LOGO
// ============================================================

function Logo({
    dark = false,
}: {
    dark?: boolean;
}) {

    return (

        <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                dark
                    ? "bg-indigo-600 text-white"
                    : "bg-indigo-600 text-white"
            }`}
        >

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

    );

}


// ============================================================
// DASHBOARD ICON
// ============================================================

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


// ============================================================
// USERS ICON
// ============================================================

function UsersIcon() {

    return (

        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
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


// ============================================================
// WALLET ICON
// ============================================================

function WalletIcon() {

    return (

        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >

            <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />

            <path d="M3 9h18" />

            <path d="M16 14h2" />

        </svg>

    );

}


// ============================================================
// REFUND ICON
// ============================================================

function RefundIcon() {

    return (

        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >

            <path d="M9 14 4 9l5-5" />

            <path d="M4 9h10a6 6 0 0 1 6 6v1" />

        </svg>

    );

}


// ============================================================
// UPLOAD ICON
// ============================================================

function UploadIcon() {

    return (

        <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >

            <path d="M12 16V4" />

            <path d="m7 9 5-5 5 5" />

            <path d="M5 20h14" />

        </svg>

    );

}


// ============================================================
// REVENUE ICON
// ============================================================

function RevenueIcon() {

    return (

        <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >

            <circle
                cx="12"
                cy="12"
                r="9"
            />

            <path d="M12 7v10" />

            <path d="M15 9.5c0-1.1-1.3-2-3-2s-3 .9-3 2 1.3 2 3 2 3 .9 3 2-1.3 2-3 2-3-.9-3-2" />

        </svg>

    );

}


// ============================================================
// PLUS ICON
// ============================================================

function PlusIcon() {

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

            <path d="M12 5v14" />

            <path d="M5 12h14" />

        </svg>

    );

}


// ============================================================
// MINUS ICON
// ============================================================

function MinusIcon() {

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

        </svg>

    );

}


// ============================================================
// MENU ICON
// ============================================================

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


// ============================================================
// CLOSE ICON
// ============================================================

function CloseIcon() {

    return (

        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        >

            <path d="M6 6l12 12" />

            <path d="M18 6 6 18" />

        </svg>

    );

}


// ============================================================
// REFRESH ICON
// ============================================================

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
            strokeLinejoin="round"
        >

            <path d="M20 11a8.1 8.1 0 0 0-15.5-2" />

            <path d="M4 4v5h5" />

            <path d="M4 13a8.1 8.1 0 0 0 15.5 2" />

            <path d="M20 20v-5h-5" />

        </svg>

    );

}


// ============================================================
// LOGOUT ICON
// ============================================================

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
            strokeLinejoin="round"
        >

            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />

            <path d="M16 17l5-5-5-5" />

            <path d="M21 12H9" />

        </svg>

    );

}


// ============================================================
// ALERT ICON
// ============================================================

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
        >

            <circle
                cx="12"
                cy="12"
                r="10"
            />

            <path d="M12 8v4" />

            <path d="M12 16h.01" />

        </svg>

    );

}


// ============================================================
// CHECK ICON
// ============================================================

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