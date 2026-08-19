const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000";

// ============================================================
// TYPES
// ============================================================

export type Wallet = {
    id: number;
    user_id: number;
    balance: number | string;
    created_at?: string;
    updated_at?: string;
};

export type WalletTransaction = {
    id: number;
    wallet_id: number;

    // User associated with this transaction
    user_id?: number | null;

    username: string;
    project_id?: number | null;

    type: string;

    amount: number | string;
    balance_before: number | string;
    balance_after: number | string;

    reference: string;
    description?: string | null;
    status: string;

    created_at?: string;
};

export type WalletUser = {
    id: number;
    username: string;
    email?: string | null;

    // ========================================================
    // USER WALLET
    // ========================================================

    wallet_id?: number | null;
    balance: number | string;
};

export type WalletDepositRequest = {
    user_id: number;
    amount: number;
    reference: string;
    description?: string;
};

export type WalletDebitRequest = {
    amount: number;
    project_id?: number | null;
    reference: string;
    description?: string;
};

export type WalletRefundRequest = {
    amount: number;
    project_id?: number | null;
    reference: string;
    description?: string;
};

export type WalletTransferRequest = {
    user_id: number;
    amount: number;
    reference: string;
    description?: string;
};


// ============================================================
// AUTH
// ============================================================

function getToken(): string | null {
    if (
        typeof window ===
        "undefined"
    ) {
        return null;
    }

    return localStorage.getItem(
        "access_token"
    );
}


// ============================================================
// REQUEST HELPER
// ============================================================

async function request<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();

    const response = await fetch(
        `${API_URL}${path}`,
        {
            ...options,

            headers: {
                "Content-Type":
                    "application/json",

                ...(token
                    ? {
                          Authorization:
                              `Bearer ${token}`,
                      }
                    : {}),

                ...(options.headers || {}),
            },
        }
    );

    if (!response.ok) {
        let message =
            "Request failed";

        try {
            const data =
                await response.json();

            message =
                data?.detail ||
                data?.message ||
                message;

        } catch {
            // Ignore JSON parse errors
        }

        throw new Error(
            `${response.status}: ${message}`
        );
    }

    return response.json();
}


// ============================================================
// GET ADMIN WALLET
// ============================================================

export async function getWallet(): Promise<Wallet> {
    return request<Wallet>(
        "/wallet/"
    );
}


// ============================================================
// GET TRANSACTIONS
// ============================================================

export async function getWalletTransactions(
    params?: {
        limit?: number;
        offset?: number;
    }
): Promise<WalletTransaction[]> {
    const search =
        new URLSearchParams();

    if (
        params?.limit !==
        undefined
    ) {
        search.set(
            "limit",
            String(params.limit)
        );
    }

    if (
        params?.offset !==
        undefined
    ) {
        search.set(
            "offset",
            String(params.offset)
        );
    }

    const query =
        search.toString();

    return request<WalletTransaction[]>(
        `/wallet/transactions${
            query
                ? `?${query}`
                : ""
        }`
    );
}


// ============================================================
// GET USERS
// ============================================================

export async function getWalletUsers(): Promise<
    WalletUser[]
> {
    return request<WalletUser[]>(
        "/wallet/users"
    );
}


// ============================================================
// DEPOSIT
// ============================================================

export async function depositWallet(
    data: WalletDepositRequest
) {
    return request(
        "/wallet/deposit",
        {
            method: "POST",

            body: JSON.stringify(
                data
            ),
        }
    );
}


// ============================================================
// ADMIN -> USER TRANSFER
// ============================================================

export async function transferWallet(
    data: WalletTransferRequest
) {
    return request(
        "/wallet/transfer",
        {
            method: "POST",

            body: JSON.stringify(
                data
            ),
        }
    );
}


// ============================================================
// DEBIT
// ============================================================

export async function debitWallet(
    data: WalletDebitRequest
) {
    return request(
        "/wallet/debit",
        {
            method: "POST",

            body: JSON.stringify(
                data
            ),
        }
    );
}


// ============================================================
// REFUND
// ============================================================

export async function refundWallet(
    data: WalletRefundRequest
) {
    return request(
        "/wallet/refund",
        {
            method: "POST",

            body: JSON.stringify(
                data
            ),
        }
    );
}