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

    return Number(data.value);
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
                value: amount.toFixed(2),
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