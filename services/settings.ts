
// ============================================================
// SYSTEM SETTINGS API
// ============================================================

const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";


// ============================================================
// TYPES
// ============================================================

export interface SystemSetting {
    id: number;
    key: string;
    value: string;
    description?: string | null;
    created_at?: string;
    updated_at?: string;
}


// ============================================================
// SYSTEM USAGE TYPES
// ============================================================

export interface SystemUsage {
    cpu_percent: number;

    memory_percent: number;
    memory_used_mb: number;
    memory_total_mb: number;

    disk_percent: number;
    disk_used_gb: number;
    disk_total_gb: number;

    pm2: {
        name: string;
        status: string;
        pid: number | null;
        uptime: number | null;
        restarts: number;
        cpu: number;
        memory_mb: number;
    };
}


// ============================================================
// SYSTEM RESTART RESPONSE
// ============================================================

export interface SystemRestartResponse {
    success: boolean;
    message: string;
    process: string;
}


// ============================================================
// API HEALTH RESPONSE
// ============================================================

export interface ApiHealthResponse {
    app?: string;
    version?: string;
    status?: string;
}


// ============================================================
// AUTH HEADER
// ============================================================

function getAuthHeaders(): HeadersInit {

    const token =
        typeof window !== "undefined"
            ? localStorage.getItem("access_token")
            : null;

    return {
        "Content-Type": "application/json",

        ...(token
            ? {
                Authorization:
                    `Bearer ${token}`,
            }
            : {}),
    };
}


// ============================================================
// GET ALL SETTINGS
//
// GET /system/settings
// ============================================================

export async function getSettings(): Promise<SystemSetting[]> {

    const response = await fetch(
        `${API_URL}/system/settings`,
        {
            method: "GET",
            headers: getAuthHeaders(),
            cache: "no-store",
        }
    );

    if (!response.ok) {

        let message =
            "Failed to load system settings.";

        try {

            const data =
                await response.json();

            message =
                data.detail || message;

        } catch {
            // Ignore JSON parsing error
        }

        throw new Error(message);
    }

    return response.json();
}


// ============================================================
// GET SETTING BY KEY
//
// GET /system/settings/{key}
// ============================================================

export async function getSetting(
    key: string
): Promise<SystemSetting> {

    const response = await fetch(
        `${API_URL}/system/settings/${encodeURIComponent(key)}`,
        {
            method: "GET",
            headers: getAuthHeaders(),
            cache: "no-store",
        }
    );

    if (!response.ok) {

        let message =
            `Failed to load setting: ${key}`;

        try {

            const data =
                await response.json();

            message =
                data.detail || message;

        } catch {
            // Ignore JSON parsing error
        }

        throw new Error(message);
    }

    return response.json();
}


// ============================================================
// UPDATE SETTING
//
// PUT /system/settings/{key}
// ============================================================

export async function updateSetting(
    key: string,
    value: string,
    description?: string
): Promise<SystemSetting> {

    const response = await fetch(
        `${API_URL}/system/settings/${encodeURIComponent(key)}`,
        {
            method: "PUT",

            headers: getAuthHeaders(),

            body: JSON.stringify({
                value,
                description:
                    description ?? null,
            }),
        }
    );

    if (!response.ok) {

        let message =
            `Failed to update setting: ${key}`;

        try {

            const data =
                await response.json();

            message =
                data.detail || message;

        } catch {
            // Ignore JSON parsing error
        }

        throw new Error(message);
    }

    return response.json();
}


// ============================================================
// GET UPLOAD FEE
//
// GET /system/settings/upload-fee
// ============================================================

export async function getUploadFee(): Promise<number> {

    const response = await fetch(
        `${API_URL}/system/settings/upload-fee`,
        {
            method: "GET",
            headers: getAuthHeaders(),
            cache: "no-store",
        }
    );

    if (!response.ok) {

        let message =
            "Failed to load upload fee.";

        try {

            const data =
                await response.json();

            message =
                data.detail || message;

        } catch {
            // Ignore JSON parsing error
        }

        throw new Error(message);
    }

    const data =
        await response.json();

    return Number(
        data.value
    );
}


// ============================================================
// UPDATE UPLOAD FEE
//
// PUT /system/settings/upload-fee
// ============================================================

export async function updateUploadFee(
    amount: number
): Promise<SystemSetting> {

    if (!Number.isFinite(amount)) {

        throw new Error(
            "Upload fee must be a valid number."
        );
    }

    if (amount < 0) {

        throw new Error(
            "Upload fee cannot be negative."
        );
    }

    const response = await fetch(
        `${API_URL}/system/settings/upload-fee`,
        {
            method: "PUT",

            headers: getAuthHeaders(),

            body: JSON.stringify({
                value:
                    amount.toFixed(2),

                description:
                    "Fee charged to the user's wallet for each uploaded file.",
            }),
        }
    );

    if (!response.ok) {

        let message =
            "Failed to update upload fee.";

        try {

            const data =
                await response.json();

            message =
                data.detail || message;

        } catch {
            // Ignore JSON parsing error
        }

        throw new Error(message);
    }

    return response.json();
}


// ============================================================
// DELETE SETTING
//
// DELETE /system/settings/{key}
// ============================================================

export async function deleteSetting(
    key: string
): Promise<void> {

    const response = await fetch(
        `${API_URL}/system/settings/${encodeURIComponent(key)}`,
        {
            method: "DELETE",
            headers: getAuthHeaders(),
        }
    );

    if (!response.ok) {

        let message =
            `Failed to delete setting: ${key}`;

        try {

            const data =
                await response.json();

            message =
                data.detail || message;

        } catch {
            // Ignore JSON parsing error
        }

        throw new Error(message);
    }
}


// ============================================================
// GET SYSTEM USAGE
//
// GET /system/settings/usage
//
// Returns:
//
// CPU
// RAM
// Disk
// PM2
// ============================================================

export async function getSystemUsage(): Promise<SystemUsage> {

    const response = await fetch(
        `${API_URL}/system/settings/usage`,
        {
            method: "GET",

            headers:
                getAuthHeaders(),

            cache:
                "no-store",
        }
    );

    if (!response.ok) {

        let message =
            "Failed to load system usage.";

        try {

            const data =
                await response.json();

            message =
                data.detail || message;

        } catch {
            // Ignore JSON parsing error
        }

        throw new Error(message);
    }

    return response.json();
}


// ============================================================
// RESTART API / PM2
//
// POST /system/settings/restart
//
// PM2 PROCESS:
//
// audio-api
//
// ADMIN ONLY
// ============================================================

export async function restartApi(): Promise<SystemRestartResponse> {

    const response = await fetch(
        `${API_URL}/system/settings/restart`,
        {
            method: "POST",

            headers:
                getAuthHeaders(),

            cache:
                "no-store",
        }
    );

    if (!response.ok) {

        let message =
            "Failed to restart API.";

        try {

            const data =
                await response.json();

            message =
                data.detail || message;

        } catch {
            // Ignore JSON parsing error
        }

        throw new Error(message);
    }

    return response.json();
}


// ============================================================
// CHECK API HEALTH
//
// GET /
//
// Used to verify that FastAPI is online.
// ============================================================

export async function getApiHealth(): Promise<ApiHealthResponse> {

    const response = await fetch(
        `${API_URL}/`,
        {
            method: "GET",

            cache:
                "no-store",

            headers: {
                "Content-Type":
                    "application/json",
            },
        }
    );

    if (!response.ok) {

        throw new Error(
            `API health check failed: HTTP ${response.status}`
        );
    }

    return response.json();
}
