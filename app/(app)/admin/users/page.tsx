"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type User = {
    id: number;
    username: string;
    role: string;
    status: string;
    created_at?: string;
    approved_at?: string | null;
    approved_by?: number | null;
};

export default function AdminUsersPage() {
    const router = useRouter();

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const [showAddUser, setShowAddUser] = useState(false);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [mobileMenu, setMobileMenu] = useState(false);

    /* ============================================================
       AUTH
    ============================================================ */

    function getToken() {
        if (typeof window === "undefined") {
            return null;
        }

        return localStorage.getItem("access_token");
    }

    function getCurrentUsername() {
        if (typeof window === "undefined") {
            return "";
        }

        return localStorage.getItem("username") || "Admin";
    }

    function checkAdmin() {
        const token = getToken();
        const role = localStorage.getItem("role");

        if (!token) {
            router.replace("/login");
            return false;
        }

        if (role !== "ADMIN") {
            router.replace("/dashboard");
            return false;
        }

        return true;
    }

    /* ============================================================
       LOAD USERS
    ============================================================ */

    async function loadUsers() {
        if (!checkAdmin()) {
            return;
        }

        setLoading(true);
        setError("");

        try {
            const token = getToken();

            const response = await fetch(`${API_URL}/users`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                logout();
                return;
            }

            if (response.status === 403) {
                router.replace("/dashboard");
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.detail || "Unable to load users"
                );
            }

            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Unable to load users"
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadUsers();
    }, []);

    /* ============================================================
       CREATE USER
    ============================================================ */

    async function createUser(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 8) {
            setError(
                "Password must be at least 8 characters."
            );
            return;
        }

        setActionLoading(-1);

        try {
            const token = getToken();

            const response = await fetch(`${API_URL}/users`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    username: username.trim(),
                    password,
                }),
            });

            const data = await response.json();

            if (response.status === 401) {
                logout();
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data?.detail || "Unable to create user"
                );
            }

            setUsername("");
            setPassword("");
            setConfirmPassword("");

            setShowAddUser(false);

            setSuccess(
                `User "${data.username || username}" created successfully.`
            );

            await loadUsers();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Unable to create user"
            );
        } finally {
            setActionLoading(null);
        }
    }

    /* ============================================================
       USER STATUS
    ============================================================ */

    async function updateStatus(
        userId: number,
        action:
            | "approve"
            | "reject"
            | "activate"
            | "deactivate"
    ) {
        setError("");
        setSuccess("");
        setActionLoading(userId);

        try {
            const token = getToken();

            const response = await fetch(
                `${API_URL}/users/${userId}/${action}`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (response.status === 401) {
                logout();
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data?.detail ||
                        `Unable to ${action} user`
                );
            }

            setSuccess(
                `User successfully ${action}d.`
            );

            await loadUsers();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Unable to update user"
            );
        } finally {
            setActionLoading(null);
        }
    }

    /* ============================================================
       LOGOUT
    ============================================================ */

    function logout() {
        localStorage.removeItem("access_token");
        localStorage.removeItem("token_type");
        localStorage.removeItem("user_id");
        localStorage.removeItem("username");
        localStorage.removeItem("role");

        router.replace("/login");
    }

    /* ============================================================
       STATS
    ============================================================ */

    const totalUsers = users.length;

    const pendingUsers = users.filter(
        (user) => user.status === "PENDING"
    ).length;

    const approvedUsers = users.filter(
        (user) => user.status === "APPROVED"
    ).length;

    const inactiveUsers = users.filter(
        (user) =>
            user.status === "INACTIVE" ||
            user.status === "REJECTED"
    ).length;

    /* ============================================================
       RENDER
    ============================================================ */

    return (
        <main className="min-h-screen bg-slate-100 text-slate-900">

            {/* ========================================================
                MOBILE HEADER
            ========================================================= */}

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
                            setMobileMenu(!mobileMenu)
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
                                username={getCurrentUsername()}
                            />

                            <div>
                                <p className="text-sm font-semibold">
                                    {getCurrentUsername()}
                                </p>

                                <p className="text-xs text-slate-500">
                                    Administrator
                                </p>
                            </div>

                        </div>

                        <button
                            onClick={() => router.push("/dashboard")}
                            className="w-full text-left rounded-lg px-3 py-3 text-sm hover:bg-slate-50"
                        >
                            Dashboard
                        </button>

                        <button
                            className="w-full text-left rounded-lg px-3 py-3 text-sm bg-indigo-50 text-indigo-700 font-semibold"
                        >
                            User Management
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

            {/* ========================================================
                DESKTOP SIDEBAR
            ========================================================= */}

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
                            router.push("/dashboard")
                        }
                        className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
                    >
                        <DashboardIcon />

                        Dashboard
                    </button>

                    <button
                        className="w-full flex items-center gap-3 rounded-xl px-4 py-3 mt-1 text-sm bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    >
                        <UsersIcon />

                        User Management
                    </button>

                </nav>

                <div className="p-4 border-t border-white/10">

                    <div className="flex items-center gap-3 mb-3 px-2">

                        <Avatar
                            username={getCurrentUsername()}
                        />

                        <div className="min-w-0">

                            <p className="text-sm font-semibold truncate">
                                {getCurrentUsername()}
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

            {/* ========================================================
                MAIN
            ========================================================= */}

            <div className="lg:ml-64 min-h-screen">

                {/* Desktop topbar */}
                <header className="hidden lg:flex h-20 bg-white border-b border-slate-200 items-center justify-between px-8">

                    <div>
                        <h1 className="text-lg font-bold">
                            User Management
                        </h1>

                        <p className="text-sm text-slate-500">
                            Manage system users and approval requests.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">

                        <button
                            onClick={loadUsers}
                            className="h-10 px-4 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50"
                        >
                            <span className="flex items-center gap-2">
                                <RefreshIcon />
                                Refresh
                            </span>
                        </button>

                        <button
                            onClick={() => {
                                setError("");
                                setSuccess("");
                                setShowAddUser(true);
                            }}
                            className="h-10 px-4 rounded-lg bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm"
                        >
                            <span className="flex items-center gap-2">
                                <PlusIcon />
                                Add User
                            </span>
                        </button>

                    </div>

                </header>

                {/* Content */}
                <div className="p-4 sm:p-6 lg:p-8">

                    {/* Mobile title */}
                    <div className="lg:hidden mb-5">

                        <div className="flex items-start justify-between gap-4">

                            <div>
                                <h1 className="text-xl font-bold">
                                    User Management
                                </h1>

                                <p className="text-sm text-slate-500 mt-1">
                                    Manage users and approvals.
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    setError("");
                                    setSuccess("");
                                    setShowAddUser(true);
                                }}
                                className="shrink-0 h-10 px-3 rounded-lg bg-indigo-600 text-white text-sm font-semibold"
                            >
                                <span className="flex items-center gap-1.5">
                                    <PlusIcon />
                                    Add
                                </span>
                            </button>

                        </div>

                    </div>

                    {/* =================================================
                        ALERTS
                    ================================================== */}

                    {error && (
                        <Alert
                            type="error"
                            message={error}
                            onClose={() => setError("")}
                        />
                    )}

                    {success && (
                        <Alert
                            type="success"
                            message={success}
                            onClose={() => setSuccess("")}
                        />
                    )}

                    {/* =================================================
                        STATISTICS
                    ================================================== */}

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">

                        <StatCard
                            title="Total Users"
                            value={totalUsers}
                            icon={<UsersIcon />}
                        />

                        <StatCard
                            title="Pending"
                            value={pendingUsers}
                            icon={<ClockIcon />}
                            warning
                        />

                        <StatCard
                            title="Approved"
                            value={approvedUsers}
                            icon={<CheckIcon />}
                        />

                        <StatCard
                            title="Inactive"
                            value={inactiveUsers}
                            icon={<UserOffIcon />}
                        />

                    </div>

                    {/* =================================================
                        USERS
                    ================================================== */}

                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

                        {/* Table header */}
                        <div className="hidden md:flex items-center justify-between px-6 py-4 border-b border-slate-200">

                            <div>
                                <h2 className="font-bold">
                                    System Users
                                </h2>

                                <p className="text-xs text-slate-500 mt-1">
                                    {totalUsers} user
                                    {totalUsers !== 1
                                        ? "s"
                                        : ""}{" "}
                                    registered
                                </p>
                            </div>

                            <button
                                onClick={loadUsers}
                                className="text-sm text-slate-500 hover:text-indigo-600"
                            >
                                Refresh
                            </button>

                        </div>

                        {/* Loading */}
                        {loading ? (
                            <LoadingState />
                        ) : users.length === 0 ? (
                            <EmptyState
                                onAdd={() =>
                                    setShowAddUser(true)
                                }
                            />
                        ) : (
                            <>
                                {/* =================================================
                                    DESKTOP TABLE
                                ================================================== */}

                                <div className="hidden md:block overflow-x-auto">

                                    <table className="w-full">

                                        <thead className="bg-slate-50 border-b border-slate-200">

                                            <tr>

                                                <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    User
                                                </th>

                                                <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    Role
                                                </th>

                                                <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    Status
                                                </th>

                                                <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    Created
                                                </th>

                                                <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    Actions
                                                </th>

                                            </tr>

                                        </thead>

                                        <tbody className="divide-y divide-slate-100">

                                            {users.map((user) => (
                                                <tr
                                                    key={user.id}
                                                    className="hover:bg-slate-50/70"
                                                >

                                                    <td className="px-6 py-4">

                                                        <div className="flex items-center gap-3">

                                                            <Avatar
                                                                username={
                                                                    user.username
                                                                }
                                                            />

                                                            <div>

                                                                <p className="font-semibold text-sm">
                                                                    {
                                                                        user.username
                                                                    }
                                                                </p>

                                                                <p className="text-xs text-slate-400">
                                                                    ID #
                                                                    {user.id}
                                                                </p>

                                                            </div>

                                                        </div>

                                                    </td>

                                                    <td className="px-6 py-4">

                                                        <RoleBadge
                                                            role={
                                                                user.role
                                                            }
                                                        />

                                                    </td>

                                                    <td className="px-6 py-4">

                                                        <StatusBadge
                                                            status={
                                                                user.status
                                                            }
                                                        />

                                                    </td>

                                                    <td className="px-6 py-4 text-sm text-slate-500">

                                                        {formatDate(
                                                            user.created_at
                                                        )}

                                                    </td>

                                                    <td className="px-6 py-4">

                                                        <div className="flex justify-end gap-2">

                                                            <Actions
                                                                user={
                                                                    user
                                                                }
                                                                loading={
                                                                    actionLoading ===
                                                                    user.id
                                                                }
                                                                onAction={
                                                                    updateStatus
                                                                }
                                                            />

                                                        </div>

                                                    </td>

                                                </tr>
                                            ))}

                                        </tbody>

                                    </table>

                                </div>

                                {/* =================================================
                                    MOBILE CARDS
                                ================================================== */}

                                <div className="md:hidden divide-y divide-slate-100">

                                    {users.map((user) => (
                                        <div
                                            key={user.id}
                                            className="p-4"
                                        >

                                            <div className="flex items-start justify-between gap-3">

                                                <div className="flex items-center gap-3 min-w-0">

                                                    <Avatar
                                                        username={
                                                            user.username
                                                        }
                                                    />

                                                    <div className="min-w-0">

                                                        <p className="font-semibold text-sm truncate">
                                                            {
                                                                user.username
                                                            }
                                                        </p>

                                                        <p className="text-xs text-slate-400">
                                                            User ID #
                                                            {user.id}
                                                        </p>

                                                    </div>

                                                </div>

                                                <StatusBadge
                                                    status={
                                                        user.status
                                                    }
                                                />

                                            </div>

                                            <div className="mt-4 grid grid-cols-2 gap-3">

                                                <div className="rounded-lg bg-slate-50 p-3">

                                                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                                        Role
                                                    </p>

                                                    <div className="mt-1">
                                                        <RoleBadge
                                                            role={
                                                                user.role
                                                            }
                                                        />
                                                    </div>

                                                </div>

                                                <div className="rounded-lg bg-slate-50 p-3">

                                                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                                        Created
                                                    </p>

                                                    <p className="mt-1 text-xs font-medium">
                                                        {formatDate(
                                                            user.created_at
                                                        )}
                                                    </p>

                                                </div>

                                            </div>

                                            <div className="mt-4">

                                                <Actions
                                                    user={user}
                                                    loading={
                                                        actionLoading ===
                                                        user.id
                                                    }
                                                    onAction={
                                                        updateStatus
                                                    }
                                                    mobile
                                                />

                                            </div>

                                        </div>
                                    ))}

                                </div>
                            </>
                        )}

                    </div>

                </div>

            </div>

            {/* ========================================================
                ADD USER MODAL
            ========================================================= */}

            {showAddUser && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            setShowAddUser(false);
                        }
                    }}
                >

                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

                        {/* Modal header */}
                        <div className="px-5 sm:px-6 py-5 border-b border-slate-200 flex items-center justify-between">

                            <div>

                                <h2 className="text-lg font-bold">
                                    Add New User
                                </h2>

                                <p className="text-xs text-slate-500 mt-1">
                                    The user will require approval.
                                </p>

                            </div>

                            <button
                                onClick={() =>
                                    setShowAddUser(false)
                                }
                                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                                <CloseIcon />
                            </button>

                        </div>

                        {/* Form */}
                        <form
                            onSubmit={createUser}
                            className="p-5 sm:p-6 space-y-5"
                        >

                            {/* Username */}
                            <div>

                                <label className="block text-sm font-semibold mb-2">
                                    Username
                                </label>

                                <input
                                    type="text"
                                    value={username}
                                    onChange={(event) =>
                                        setUsername(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Enter username"
                                    autoComplete="off"
                                    required
                                    className="w-full h-12 rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                />

                            </div>

                            {/* Password */}
                            <div>

                                <label className="block text-sm font-semibold mb-2">
                                    Password
                                </label>

                                <input
                                    type="password"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Minimum 8 characters"
                                    autoComplete="new-password"
                                    required
                                    minLength={8}
                                    className="w-full h-12 rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                />

                            </div>

                            {/* Confirm */}
                            <div>

                                <label className="block text-sm font-semibold mb-2">
                                    Confirm Password
                                </label>

                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(event) =>
                                        setConfirmPassword(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Confirm password"
                                    autoComplete="new-password"
                                    required
                                    minLength={8}
                                    className="w-full h-12 rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                />

                            </div>

                            {/* Notice */}
                            <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">

                                <div className="flex gap-3">

                                    <ClockIcon />

                                    <p className="text-xs text-amber-700 leading-5">
                                        New users are created with
                                        <strong> PENDING </strong>
                                        status and must be approved
                                        by an administrator before
                                        they can log in.
                                    </p>

                                </div>

                            </div>

                            {/* Buttons */}
                            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowAddUser(false)
                                    }
                                    className="w-full sm:w-auto flex-1 h-11 rounded-xl border border-slate-300 text-sm font-semibold hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        actionLoading === -1
                                    }
                                    className="w-full sm:w-auto flex-1 h-11 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                                >
                                    {actionLoading === -1
                                        ? "Creating..."
                                        : "Create User"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

        </main>
    );
}


/* ================================================================
   ACTIONS
================================================================ */

function Actions({
    user,
    loading,
    onAction,
    mobile = false,
}: {
    user: User;
    loading: boolean;
    onAction: (
        id: number,
        action:
            | "approve"
            | "reject"
            | "activate"
            | "deactivate"
    ) => void;
    mobile?: boolean;
}) {
    if (user.role === "ADMIN") {
        return (
            <span className="text-xs text-slate-400">
                Administrator
            </span>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-xs text-slate-500">
                <Spinner />
                Updating...
            </div>
        );
    }

    if (user.status === "PENDING") {
        return (
            <div
                className={
                    mobile
                        ? "grid grid-cols-2 gap-2"
                        : "flex gap-2"
                }
            >
                <button
                    onClick={() =>
                        onAction(
                            user.id,
                            "approve"
                        )
                    }
                    className="h-9 px-3 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700"
                >
                    Approve
                </button>

                <button
                    onClick={() =>
                        onAction(
                            user.id,
                            "reject"
                        )
                    }
                    className="h-9 px-3 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
                >
                    Reject
                </button>
            </div>
        );
    }

    if (user.status === "APPROVED") {
        return (
            <button
                onClick={() =>
                    onAction(
                        user.id,
                        "deactivate"
                    )
                }
                className="h-9 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
                Deactivate
            </button>
        );
    }

    if (
        user.status === "INACTIVE" ||
        user.status === "REJECTED"
    ) {
        return (
            <button
                onClick={() =>
                    onAction(
                        user.id,
                        "activate"
                    )
                }
                className="h-9 px-3 rounded-lg bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700"
            >
                Activate
            </button>
        );
    }

    return null;
}


/* ================================================================
   STATUS BADGE
================================================================ */

function StatusBadge({
    status,
}: {
    status: string;
}) {
    const styles: Record<string, string> = {
        APPROVED:
            "bg-green-50 text-green-700 border-green-200",
        PENDING:
            "bg-amber-50 text-amber-700 border-amber-200",
        REJECTED:
            "bg-red-50 text-red-700 border-red-200",
        INACTIVE:
            "bg-slate-100 text-slate-600 border-slate-200",
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                styles[status] ||
                "bg-slate-100 text-slate-600 border-slate-200"
            }`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${
                    status === "APPROVED"
                        ? "bg-green-500"
                        : status === "PENDING"
                          ? "bg-amber-500"
                          : status === "REJECTED"
                            ? "bg-red-500"
                            : "bg-slate-400"
                }`}
            />

            {status}
        </span>
    );
}


/* ================================================================
   ROLE BADGE
================================================================ */

function RoleBadge({
    role,
}: {
    role: string;
}) {
    return (
        <span className="inline-flex rounded-lg bg-indigo-50 border border-indigo-100 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
            {role}
        </span>
    );
}


/* ================================================================
   STAT CARD
================================================================ */

function StatCard({
    title,
    value,
    icon,
    warning = false,
}: {
    title: string;
    value: number;
    icon: React.ReactNode;
    warning?: boolean;
}) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">

            <div className="flex items-start justify-between">

                <div>
                    <p className="text-xs font-medium text-slate-500">
                        {title}
                    </p>

                    <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
                        {value}
                    </p>
                </div>

                <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${
                        warning
                            ? "bg-amber-50 text-amber-600"
                            : "bg-indigo-50 text-indigo-600"
                    }`}
                >
                    {icon}
                </div>

            </div>

        </div>
    );
}


/* ================================================================
   ALERT
================================================================ */

function Alert({
    type,
    message,
    onClose,
}: {
    type: "error" | "success";
    message: string;
    onClose: () => void;
}) {
    return (
        <div
            className={`mb-5 rounded-xl border p-4 ${
                type === "error"
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-green-50 border-green-200 text-green-700"
            }`}
        >

            <div className="flex items-center justify-between gap-3">

                <div className="flex items-center gap-3 text-sm">

                    {type === "error" ? (
                        <AlertIcon />
                    ) : (
                        <CheckIcon />
                    )}

                    {message}

                </div>

                <button
                    onClick={onClose}
                    className="opacity-60 hover:opacity-100"
                >
                    <CloseIcon />
                </button>

            </div>

        </div>
    );
}


/* ================================================================
   LOADING
================================================================ */

function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center py-20">

            <Spinner large />

            <p className="mt-4 text-sm text-slate-500">
                Loading users...
            </p>

        </div>
    );
}


/* ================================================================
   EMPTY
================================================================ */

function EmptyState({
    onAdd,
}: {
    onAdd: () => void;
}) {
    return (
        <div className="py-20 px-6 text-center">

            <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <UsersIcon />
            </div>

            <h3 className="mt-4 font-bold">
                No users found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
                Create your first user account.
            </p>

            <button
                onClick={onAdd}
                className="mt-5 h-10 px-4 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
            >
                + Add User
            </button>

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
    const letter =
        username?.charAt(0)?.toUpperCase() || "U";

    return (
        <div className="w-9 h-9 shrink-0 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">
            {letter}
        </div>
    );
}


/* ================================================================
   FORMAT DATE
================================================================ */

function formatDate(date?: string) {
    if (!date) {
        return "—";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return "—";
    }

    return parsed.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
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


/* ================================================================
   ICONS
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
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
    );
}

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
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

function UserOffIcon() {
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
            <circle cx="9" cy="7" r="4" />
            <path d="M3 21v-2a4 4 0 0 1 4-4h4" />
            <path d="m16 16 5 5" />
            <path d="m21 16-5 5" />
        </svg>
    );
}

function ClockIcon() {
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
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </svg>
    );
}

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
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
        </svg>
    );
}

function Spinner({
    large = false,
}: {
    large?: boolean;
}) {
    return (
        <svg
            className="animate-spin"
            width={large ? 28 : 16}
            height={large ? 28 : 16}
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