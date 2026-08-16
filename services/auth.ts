const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export type LoginResponse = {
    access_token: string;
    token_type: string;
    user_id: number;
    username: string;
    role: string;
};

export type LoginCredentials = {
    username: string;
    password: string;
};


/* ============================================================
   LOGIN
============================================================ */

export async function login(
    credentials: LoginCredentials
): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data?.detail || "Invalid username or password"
        );
    }

    return data;
}


/* ============================================================
   SAVE AUTH
============================================================ */

export function saveAuth(data: LoginResponse) {
    if (typeof window === "undefined") {
        return;
    }

    localStorage.setItem(
        "access_token",
        data.access_token
    );

    localStorage.setItem(
        "token_type",
        data.token_type || "bearer"
    );

    localStorage.setItem(
        "user_id",
        String(data.user_id)
    );

    localStorage.setItem(
        "username",
        data.username
    );

    localStorage.setItem(
        "role",
        data.role
    );
}


/* ============================================================
   GET ACCESS TOKEN
============================================================ */

export function getAccessToken(): string | null {
    if (typeof window === "undefined") {
        return null;
    }

    return localStorage.getItem("access_token");
}


/* ============================================================
   GET TOKEN TYPE
============================================================ */

export function getTokenType(): string {
    if (typeof window === "undefined") {
        return "bearer";
    }

    return localStorage.getItem("token_type") || "bearer";
}


/* ============================================================
   GET USER ID
============================================================ */

export function getUserId(): number | null {
    if (typeof window === "undefined") {
        return null;
    }

    const value = localStorage.getItem("user_id");

    if (!value) {
        return null;
    }

    const id = Number(value);

    return Number.isNaN(id) ? null : id;
}


/* ============================================================
   GET USERNAME
============================================================ */

export function getUsername(): string | null {
    if (typeof window === "undefined") {
        return null;
    }

    return localStorage.getItem("username");
}


/* ============================================================
   GET ROLE
============================================================ */

export function getRole(): string | null {
    if (typeof window === "undefined") {
        return null;
    }

    return localStorage.getItem("role");
}


/* ============================================================
   CHECK AUTH
============================================================ */

export function isAuthenticated(): boolean {
    return !!getAccessToken();
}


/* ============================================================
   LOGOUT
============================================================ */

export function logout() {
    if (typeof window === "undefined") {
        return;
    }

    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    localStorage.removeItem("role");

    // Remove old authentication keys if they exist
    localStorage.removeItem("user");
    localStorage.removeItem("auth");

    window.location.href = "/login";
}