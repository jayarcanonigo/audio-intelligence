"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

export default function WalletPage() {
  const router = useRouter();

  // ============================================================
  // STATE
  // ============================================================

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [users, setUsers] = useState<WalletUser[]>([]);

  const [selectedUserId, setSelectedUserId] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modal, setModal] = useState<
    "deposit" | "debit" | "refund" | null
  >(null);

  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");

  const [transactionType, setTransactionType] = useState("ALL");
  const [transactionStatus, setTransactionStatus] = useState("ALL");

  const [mobileMenu, setMobileMenu] = useState(false);
  const [username, setUsername] = useState("");

  // ============================================================
  // TRANSACTION TYPE HELPER
  // ============================================================

  /*
   * The current WalletTransaction interface does not declare
   * transaction_type, but the API/page expects this field.
   *
   * Using this helper keeps this page compatible with the current
   * WalletTransaction type while still reading transaction_type
   * from the API response.
   */
  const getTransactionType = (
    transaction: WalletTransaction
  ): string => {
    const transactionWithType = transaction as WalletTransaction & {
      transaction_type?: string | null;
    };

    return String(
      transactionWithType.transaction_type || ""
    ).toUpperCase();
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    localStorage.removeItem("role");

    router.replace("/login");
  }, [router]);

  // ============================================================
  // LOAD WALLET
  // ============================================================

  const loadWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [walletData, transactionData, userData] =
        await Promise.all([
          getWallet(),
          getWalletTransactions({ limit: 100 }),
          getWalletUsers(),
        ]);

      setWallet(walletData);
      setTransactions(transactionData);

      // ========================================================
      // INCLUDE CURRENT ADMIN IN USER DROPDOWN
      // ========================================================

      const storedAdminId = localStorage.getItem("user_id");
      const storedAdminUsername = localStorage.getItem("username");
      const storedAdminRole = localStorage.getItem("role");

      let walletUsers = [...userData];

      const isAdmin =
        storedAdminRole === "ADMIN" ||
        storedAdminRole === "admin";

      if (
        storedAdminId &&
        storedAdminUsername &&
        isAdmin
      ) {
        const adminId = Number(storedAdminId);

        const adminAlreadyExists = walletUsers.some(
          (user) => Number(user.id) === adminId
        );

        if (!adminAlreadyExists) {
          walletUsers.unshift({
            id: adminId,
            username: storedAdminUsername,
            email: "",
            balance: walletData?.balance ?? 0,
          });
        }
      }

      setUsers(walletUsers);
    } catch (err: any) {
      console.error("Failed to load wallet:", err);

      const message =
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to load wallet information.";

      if (
        err?.response?.status === 401 ||
        message.toLowerCase().includes("unauthorized")
      ) {
        logout();
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }, [logout]);

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedUsername = localStorage.getItem("username");
    const storedRole = localStorage.getItem("role");

    if (!token) {
      router.replace("/login");
      return;
    }

    if (
      storedRole !== "ADMIN" &&
      storedRole !== "admin"
    ) {
      router.replace("/dashboard");
      return;
    }

    setUsername(storedUsername || "");

    loadWallet();
  }, [router, loadWallet]);

  // ============================================================
  // SELECTED USER
  // ============================================================

  const selectedUser = useMemo(() => {
    if (!selectedUserId) {
      return null;
    }

    return (
      users.find(
        (user) => Number(user.id) === Number(selectedUserId)
      ) || null
    );
  }, [users, selectedUserId]);

  // ============================================================
  // FILTER TRANSACTIONS
  // ============================================================

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const typeMatch =
        transactionType === "ALL" ||
        getTransactionType(transaction) === transactionType;

      const statusMatch =
        transactionStatus === "ALL" ||
        String(transaction.status || "").toUpperCase() ===
          transactionStatus;

      return typeMatch && statusMatch;
    });
  }, [
    transactions,
    transactionType,
    transactionStatus,
  ]);

  // ============================================================
  // DASHBOARD STATS
  // ============================================================

  const totalUserBalance = useMemo(() => {
    return users.reduce(
      (total, user) => total + Number(user.balance || 0),
      0
    );
  }, [users]);

  const todayTransactions = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);

    return transactions.filter((transaction) => {
      const transactionDate =
        transaction.created_at?.slice(0, 10);

      return transactionDate === today;
    });
  }, [transactions]);

  const uploadsToday = useMemo(() => {
    return todayTransactions.filter((transaction) => {
      const referenceValue =
        String(transaction.reference || "").toUpperCase();

      const descriptionValue =
        String(transaction.description || "").toLowerCase();

      return (
        referenceValue.startsWith("UPLOAD-") ||
        descriptionValue.includes("audio upload charge")
      );
    }).length;
  }, [todayTransactions]);

  const revenueToday = useMemo(() => {
    return todayTransactions
      .filter((transaction) => {
        const type = getTransactionType(transaction);

        const status =
          String(transaction.status || "").toUpperCase();

        const referenceValue =
          String(transaction.reference || "").toUpperCase();

        const descriptionValue =
          String(transaction.description || "").toLowerCase();

        const isUpload =
          referenceValue.startsWith("UPLOAD-") ||
          descriptionValue.includes("audio upload charge");

        return (
          type === "DEBIT" &&
          status === "COMPLETED" &&
          isUpload
        );
      })
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount || 0),
        0
      );
  }, [todayTransactions]);

  // ============================================================
  // RESET MODAL
  // ============================================================

  const closeModal = () => {
    setModal(null);
    setAmount("");
    setReference("");
    setDescription("");
    setProjectId("");
    setSelectedUserId("");
    setError("");
  };

  // ============================================================
  // OPEN MODAL
  // ============================================================

  const openModal = (
    type: "deposit" | "debit" | "refund"
  ) => {
    setError("");
    setSuccess("");
    setAmount("");
    setReference("");
    setDescription("");
    setProjectId("");
    setSelectedUserId("");

    setModal(type);
  };

  // ============================================================
  // SUBMIT TRANSACTION
  // ============================================================

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!reference.trim()) {
      setError("Reference is required.");
      return;
    }

    if (modal === "deposit" && !selectedUserId) {
      setError("Please select a user.");
      return;
    }

    try {
      setSubmitting(true);

      if (modal === "deposit") {
        await depositWallet({
          user_id: Number(selectedUserId),
          amount: numericAmount,
          reference: reference.trim(),
          description: description.trim(),
        });

        setSuccess(
          `₱${numericAmount.toLocaleString(
            "en-PH",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )} deposited successfully.`
        );
      }

      if (modal === "debit") {
        await debitWallet({
          amount: numericAmount,
          project_id: projectId
            ? Number(projectId)
            : undefined,
          reference: reference.trim(),
          description: description.trim(),
        });

        setSuccess(
          `₱${numericAmount.toLocaleString(
            "en-PH",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )} debited successfully.`
        );
      }

      if (modal === "refund") {
        await refundWallet({
          amount: numericAmount,
          project_id: projectId
            ? Number(projectId)
            : undefined,
          reference: reference.trim(),
          description: description.trim(),
        });

        setSuccess(
          `₱${numericAmount.toLocaleString(
            "en-PH",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )} refunded successfully.`
        );
      }

      closeModal();

      await loadWallet();
    } catch (err: any) {
      console.error(
        "Wallet transaction failed:",
        err
      );

      const message =
        err?.response?.data?.detail ||
        err?.message ||
        "Transaction failed.";

      if (
        err?.response?.status === 401 ||
        message.toLowerCase().includes("unauthorized")
      ) {
        logout();
        return;
      }

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // FORMAT CURRENCY
  // ============================================================

  const formatCurrency = (
    value: number | string
  ) => {
    return `₱${Number(value || 0).toLocaleString(
      "en-PH",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">
          Loading wallet...
        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Wallet Management
              </h1>

              <p className="text-xs text-gray-500">
                Manage user wallet balances and transactions
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium text-gray-900">
                  {username}
                </div>

                <div className="text-xs text-gray-500">
                  Administrator
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                Logout
              </button>

              <button
                type="button"
                onClick={() =>
                  setMobileMenu(!mobileMenu)
                }
                className="sm:hidden px-3 py-2 rounded-lg bg-gray-100"
              >
                ☰
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* ====================================================
            STATS
        ==================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* ADMIN BALANCE */}

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500">
              Admin Wallet
            </div>

            <div className="mt-2 text-2xl font-bold text-gray-900">
              {formatCurrency(wallet?.balance || 0)}
            </div>
          </div>

          {/* TOTAL USER BALANCE */}

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500">
              Total User Balance
            </div>

            <div className="mt-2 text-2xl font-bold text-gray-900">
              {formatCurrency(totalUserBalance)}
            </div>
          </div>

          {/* UPLOADS TODAY */}

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500">
              Uploads Today
            </div>

            <div className="mt-2 text-2xl font-bold text-gray-900">
              {uploadsToday}
            </div>
          </div>

          {/* REVENUE TODAY */}

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500">
              Revenue Today
            </div>

            <div className="mt-2 text-2xl font-bold text-gray-900">
              {formatCurrency(revenueToday)}
            </div>
          </div>
        </div>

        {/* ====================================================
            ACTIONS
        ==================================================== */}

        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Wallet Actions
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Add, debit, or refund wallet funds.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openModal("deposit")}
                className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
              >
                Deposit
              </button>

              <button
                type="button"
                onClick={() => openModal("debit")}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
              >
                Debit
              </button>

              <button
                type="button"
                onClick={() => openModal("refund")}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
              >
                Refund
              </button>

              <button
                type="button"
                onClick={loadWallet}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* ====================================================
            USER BALANCES
        ==================================================== */}

        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Wallet Users
            </h2>

            <p className="text-sm text-gray-500">
              All available wallet accounts
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    User
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Email
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                    Balance
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-8 text-center text-sm text-gray-500"
                    >
                      No wallet users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const isAdmin =
                      Number(user.id) ===
                      Number(
                        localStorage.getItem("user_id")
                      );

                    return (
                      <tr key={user.id}>
                        <td className="px-5 py-4">
                          <div className="font-medium text-gray-900">
                            {user.username}

                            {isAdmin && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                                ADMIN
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-500">
                          {user.email || "—"}
                        </td>

                        <td className="px-5 py-4 text-right font-semibold text-gray-900">
                          {formatCurrency(user.balance)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ====================================================
            TRANSACTIONS
        ==================================================== */}

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Transactions
                </h2>

                <p className="text-sm text-gray-500">
                  Recent wallet activity
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <select
                  value={transactionType}
                  onChange={(event) =>
                    setTransactionType(event.target.value)
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="ALL">
                    All Types
                  </option>

                  <option value="DEPOSIT">
                    Deposit
                  </option>

                  <option value="DEBIT">
                    Debit
                  </option>

                  <option value="REFUND">
                    Refund
                  </option>

                  <option value="TRANSFER">
                    Transfer
                  </option>
                </select>

                <select
                  value={transactionStatus}
                  onChange={(event) =>
                    setTransactionStatus(
                      event.target.value
                    )
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="ALL">
                    All Statuses
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

                  <option value="CANCELLED">
                    Cancelled
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Date
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Type
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Amount
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Reference
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Description
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-8 text-center text-sm text-gray-500"
                    >
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map(
                    (transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {transaction.created_at
                            ? new Date(
                                transaction.created_at
                              ).toLocaleString()
                            : "—"}
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm font-medium">
                            {getTransactionType(transaction) ||
                              "—"}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-semibold text-gray-900 whitespace-nowrap">
                          {formatCurrency(
                            transaction.amount
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {transaction.reference || "—"}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {transaction.description || "—"}
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm">
                            {transaction.status || "—"}
                          </span>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ======================================================
          MODAL
      ====================================================== */}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {modal === "deposit" &&
                    "Deposit Wallet"}

                  {modal === "debit" &&
                    "Debit Wallet"}

                  {modal === "refund" &&
                    "Refund Wallet"}
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  Complete the transaction details below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>

            {/* MODAL FORM */}

            <form
              onSubmit={handleSubmit}
              className="p-5 space-y-4"
            >
              {/* USER */}

              {modal === "deposit" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User
                  </label>

                  <select
                    value={selectedUserId}
                    onChange={(event) =>
                      setSelectedUserId(
                        event.target.value
                      )
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                    required
                  >
                    <option value="">
                      Select user
                    </option>

                    {users.map((user) => {
                      const isAdmin =
                        Number(user.id) ===
                        Number(
                          localStorage.getItem(
                            "user_id"
                          )
                        );

                      return (
                        <option
                          key={user.id}
                          value={user.id}
                        >
                          {user.username}
                          {isAdmin
                            ? " (ADMIN)"
                            : ""}{" "}
                          -{" "}
                          {formatCurrency(
                            user.balance
                          )}
                        </option>
                      );
                    })}
                  </select>

                  {/* SELECTED USER BALANCE */}

                  {selectedUser && (
                    <div className="mt-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                      <div className="text-xs text-gray-500">
                        Current Balance
                      </div>

                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(
                          selectedUser.balance
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AMOUNT */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) =>
                    setAmount(event.target.value)
                  }
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>

              {/* PROJECT ID */}

              {(modal === "debit" ||
                modal === "refund") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project ID
                    <span className="text-gray-400">
                      {" "}
                      (optional)
                    </span>
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={projectId}
                    onChange={(event) =>
                      setProjectId(
                        event.target.value
                      )
                    }
                    placeholder="Project ID"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              )}

              {/* REFERENCE */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference
                </label>

                <input
                  type="text"
                  value={reference}
                  onChange={(event) =>
                    setReference(event.target.value)
                  }
                  placeholder="Transaction reference"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>

              {/* DESCRIPTION */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  placeholder="Optional description"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50 ${
                    modal === "deposit"
                      ? "bg-green-600 hover:bg-green-700"
                      : modal === "debit"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {submitting
                    ? "Processing..."
                    : modal === "deposit"
                    ? "Deposit"
                    : modal === "debit"
                    ? "Debit"
                    : "Refund"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}