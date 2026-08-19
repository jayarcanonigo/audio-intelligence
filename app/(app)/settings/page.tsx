"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Cpu,
  Headphones,
  Filter,
  Tags,
  Server,
  ArrowRight,
  Wallet,
  Save,
  FlaskConical,
} from "lucide-react";

import {
  toast,
  ToastContainer,
} from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

import { getRole } from "@/services/auth";

// ============================================================
// API
// ============================================================

const API_URL = "http://localhost:8000";

// ============================================================
// SETTINGS PAGE
// ============================================================

export default function SettingsPage() {
  const router = useRouter();

  // ==========================================================
  // USER
  // ==========================================================

  const [role, setRole] = useState("");

  const [loadingUser, setLoadingUser] =
    useState(true);

  // ==========================================================
  // WHISPER SETTINGS
  // ==========================================================

  const [model, setModel] =
    useState("medium");

  const [chunkSize, setChunkSize] =
    useState("300");

  // ==========================================================
  // RESTART
  // ==========================================================

  const [restarting, setRestarting] =
    useState(false);

  // ==========================================================
  // UPLOAD FEE
  // ==========================================================

  const [uploadFee, setUploadFee] =
    useState("");

  const [loadingUploadFee, setLoadingUploadFee] =
    useState(false);

  const [savingUploadFee, setSavingUploadFee] =
    useState(false);

  // ==========================================================
  // BETA SETTING
  // ==========================================================

  const [betaEnabled, setBetaEnabled] =
    useState(false);

  const [loadingBeta, setLoadingBeta] =
    useState(false);

  const [savingBeta, setSavingBeta] =
    useState(false);

  // ==========================================================
  // AUTH TOKEN
  // ==========================================================

  function getToken() {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem(
      "access_token"
    );
  }

  // ==========================================================
  // LOAD USER
  // ==========================================================

  useEffect(() => {
    const storedRole = getRole();

    if (storedRole) {
      setRole(
        storedRole.toUpperCase()
      );
    }

    setLoadingUser(false);
  }, []);

  // ==========================================================
  // ADMIN
  // ==========================================================

  const isAdmin =
    role === "ADMIN";

  // ==========================================================
  // LOAD ADMIN SETTINGS
  // ==========================================================

  useEffect(() => {
    if (loadingUser) {
      return;
    }

    if (!isAdmin) {
      return;
    }

    loadUploadFee();
    loadBetaSetting();
  }, [
    loadingUser,
    isAdmin,
  ]);

  // ==========================================================
  // LOAD UPLOAD FEE
  // ==========================================================

  async function loadUploadFee() {
    try {
      setLoadingUploadFee(true);

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found."
        );
      }

      const res = await fetch(
        `${API_URL}/system/settings/upload-fee`,
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

      const data =
        await res.json().catch(
          () => null
        );

      if (!res.ok) {
        throw new Error(
          data?.detail ||
            "Failed to load upload fee."
        );
      }

      setUploadFee(
        String(
          data.value ??
            data.amount ??
            "0"
        )
      );
    } catch (error) {
      console.error(
        "Failed to load upload fee:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load upload fee."
      );
    } finally {
      setLoadingUploadFee(false);
    }
  }

  // ==========================================================
  // SAVE UPLOAD FEE
  // ==========================================================

  async function saveUploadFee() {
    if (!uploadFee.trim()) {
      toast.error(
        "Please enter an upload fee."
      );

      return;
    }

    const amount =
      Number(uploadFee);

    if (!Number.isFinite(amount)) {
      toast.error(
        "Upload fee must be a valid number."
      );

      return;
    }

    if (amount < 0) {
      toast.error(
        "Upload fee cannot be negative."
      );

      return;
    }

    try {
      setSavingUploadFee(true);

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found."
        );
      }

      const res = await fetch(
        `${API_URL}/system/settings/upload-fee`,
        {
          method: "PUT",

          headers: {
            Authorization:
              `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            value:
              amount.toFixed(2),
          }),
        }
      );

      const data =
        await res.json().catch(
          () => null
        );

      if (!res.ok) {
        throw new Error(
          data?.detail ||
            "Failed to save upload fee."
        );
      }

      setUploadFee(
        String(
          data.value ??
            amount.toFixed(2)
        )
      );

      toast.success(
        "Upload fee updated successfully."
      );
    } catch (error) {
      console.error(
        "Failed to save upload fee:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save upload fee."
      );
    } finally {
      setSavingUploadFee(false);
    }
  }

  // ==========================================================
  // LOAD BETA SETTING
  // ==========================================================

  async function loadBetaSetting() {
    try {
      setLoadingBeta(true);

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found."
        );
      }

      const res = await fetch(
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

      const data =
        await res.json().catch(
          () => null
        );

      if (!res.ok) {
        throw new Error(
          data?.detail ||
            "Failed to load beta setting."
        );
      }

      const value =
        String(
          data.value ??
            "false"
        ).toLowerCase();

      const enabled =
        value === "true" ||
        value === "1" ||
        value === "yes" ||
        value === "on";

      setBetaEnabled(
        enabled
      );
    } catch (error) {
      console.error(
        "Failed to load beta setting:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load beta setting."
      );
    } finally {
      setLoadingBeta(false);
    }
  }

  // ==========================================================
  // SAVE BETA SETTING
  // ==========================================================

  async function saveBetaSetting(
    enabled: boolean
  ) {
    try {
      setSavingBeta(true);

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found."
        );
      }

      const res = await fetch(
        `${API_URL}/system/settings/beta`,
        {
          method: "PUT",

          headers: {
            Authorization:
              `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            value: enabled
              ? "true"
              : "false",
          }),
        }
      );

      const data =
        await res.json().catch(
          () => null
        );

      if (!res.ok) {
        throw new Error(
          data?.detail ||
            "Failed to update beta setting."
        );
      }

      setBetaEnabled(
        enabled
      );

      toast.success(
        enabled
          ? "Beta features enabled."
          : "Beta features disabled."
      );
    } catch (error) {
      console.error(
        "Failed to save beta setting:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update beta setting."
      );
    } finally {
      setSavingBeta(false);
    }
  }

  // ==========================================================
  // TOGGLE BETA
  // ==========================================================

  async function toggleBeta() {
    if (
      savingBeta ||
      loadingBeta
    ) {
      return;
    }

    const newValue =
      !betaEnabled;

    await saveBetaSetting(
      newValue
    );
  }

  // ==========================================================
  // RESTART API
  // ==========================================================

  async function restartAPI() {
    try {
      setRestarting(true);

      const token = getToken();

      const res = await fetch(
        `${API_URL}/system/restart`,
        {
          method: "POST",

          headers: token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : undefined,
        }
      );

      if (!res.ok) {
        throw new Error(
          "Restart failed."
        );
      }

      toast.success(
        "API restarted successfully."
      );
    } catch (error) {
      console.error(
        "Restart failed:",
        error
      );

      toast.error(
        "Restart failed."
      );
    } finally {
      setRestarting(false);
    }
  }

  // ==========================================================
  // LOADING USER
  // ==========================================================

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">

        <div className="max-w-6xl mx-auto">

          <h1 className="text-3xl font-bold">
            ⚙️ Settings
          </h1>

          <div className="mt-8 bg-white rounded-xl shadow p-6">
            Loading settings...
          </div>

        </div>

      </div>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      <ToastContainer />

      <div className="max-w-6xl mx-auto">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="flex items-center justify-between mb-8">

          <div>

            <h1 className="text-3xl font-bold">
              ⚙️ Settings
            </h1>

            <p className="text-gray-500 mt-1">
              Configure system settings.
            </p>

          </div>

        </div>

        <div className="grid gap-6">

          {/* ==================================================
              WHISPER MODEL
          ================================================== */}

          <div className="bg-white rounded-xl shadow p-6">

            <div className="flex items-center gap-2 mb-5">

              <Cpu className="w-5 h-5 text-blue-600" />

              <h2 className="font-semibold text-lg">
                Whisper Model
              </h2>

            </div>

            <label className="block mb-2">
              Model Size
            </label>

            <select
              value={model}
              onChange={(e) =>
                setModel(
                  e.target.value
                )
              }
              className="
                border
                rounded-lg
                px-3
                py-2
                w-full
              "
            >

              <option value="base">
                Base (Fast)
              </option>

              <option value="small">
                Small (Balanced)
              </option>

              <option value="medium">
                Medium (Accurate)
              </option>

            </select>

          </div>

          {/* ==================================================
              AUDIO PROCESSING
          ================================================== */}

          <div className="bg-white rounded-xl shadow p-6">

            <div className="flex items-center gap-2 mb-5">

              <Headphones className="w-5 h-5 text-green-600" />

              <h2 className="font-semibold text-lg">
                Audio Processing
              </h2>

            </div>

            <label className="block mb-2">
              Chunk Duration (seconds)
            </label>

            <input
              type="number"
              min="1"
              value={chunkSize}
              onChange={(e) =>
                setChunkSize(
                  e.target.value
                )
              }
              className="
                border
                rounded-lg
                px-3
                py-2
                w-full
              "
            />

          </div>

          {/* ==================================================
              BETA FEATURES
              ADMIN ONLY
          ================================================== */}

          {isAdmin && (
            <div className="bg-white rounded-xl shadow p-6">

              <div className="flex items-center justify-between">

                <div>

                  <div className="flex items-center gap-2">

                    <FlaskConical
                      className="
                        w-5
                        h-5
                        text-purple-600
                      "
                    />

                    <h2 className="font-semibold text-lg">
                      Beta Features
                    </h2>

                  </div>

                  <p className="text-sm text-gray-500 mt-1">
                    Enable or disable experimental
                    features in the system.
                  </p>

                </div>

                {/* ==========================================
                    TOGGLE
                ========================================== */}

                <button
                  type="button"
                  onClick={
                    toggleBeta
                  }
                  disabled={
                    loadingBeta ||
                    savingBeta
                  }
                  aria-label={
                    betaEnabled
                      ? "Disable beta features"
                      : "Enable beta features"
                  }
                  aria-pressed={
                    betaEnabled
                  }
                  className={`
                    relative
                    inline-flex
                    h-7
                    w-14
                    flex-shrink-0
                    rounded-full
                    border-2
                    border-transparent
                    transition-colors
                    duration-200
                    ease-in-out
                    focus:outline-none
                    focus:ring-2
                    focus:ring-purple-500
                    focus:ring-offset-2
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                    ${
                      betaEnabled
                        ? "bg-purple-600"
                        : "bg-gray-300"
                    }
                  `}
                >

                  <span
                    className={`
                      pointer-events-none
                      inline-block
                      h-6
                      w-6
                      rounded-full
                      bg-white
                      shadow
                      ring-0
                      transition
                      duration-200
                      ease-in-out
                      ${
                        betaEnabled
                          ? "translate-x-7"
                          : "translate-x-0"
                      }
                    `}
                  />

                </button>

              </div>

              {/* ==========================================
                  BETA STATUS
              ========================================== */}

              <div className="mt-5 flex items-center justify-between">

                <div>

                  <p className="text-sm font-medium">

                    Status:{" "}

                    <span
                      className={
                        betaEnabled
                          ? "text-purple-600"
                          : "text-gray-500"
                      }
                    >

                      {loadingBeta
                        ? "Loading..."
                        : betaEnabled
                          ? "Enabled"
                          : "Disabled"}

                    </span>

                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    This setting is saved in the
                    database.
                  </p>

                </div>

                {savingBeta && (
                  <span className="text-sm text-gray-500">
                    Saving...
                  </span>
                )}

              </div>

            </div>
          )}

          {/* ==================================================
              UPLOAD FEE
              ADMIN ONLY
          ================================================== */}

          {isAdmin && (
            <div className="bg-white rounded-xl shadow p-6">

              <div className="flex items-center justify-between mb-5">

                <div>

                  <div className="flex items-center gap-2">

                    <Wallet className="w-5 h-5 text-green-600" />

                    <h2 className="font-semibold text-lg">
                      Upload Fee
                    </h2>

                  </div>

                  <p className="text-sm text-gray-500 mt-1">
                    Amount charged from the user's
                    wallet for each uploaded file.
                  </p>

                </div>

              </div>

              <div className="flex flex-col md:flex-row gap-3">

                <div className="relative flex-1">

                  <span
                    className="
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-gray-500
                      font-medium
                    "
                  >
                    ₱
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      uploadFee
                    }
                    disabled={
                      loadingUploadFee
                    }
                    onChange={(e) =>
                      setUploadFee(
                        e.target.value
                      )
                    }
                    className="
                      border
                      rounded-lg
                      px-3
                      py-2
                      pl-8
                      w-full
                      disabled:bg-gray-100
                    "
                    placeholder="10.00"
                  />

                </div>

                <button
                  type="button"
                  onClick={
                    saveUploadFee
                  }
                  disabled={
                    loadingUploadFee ||
                    savingUploadFee
                  }
                  className="
                    bg-green-600
                    hover:bg-green-700
                    disabled:opacity-50
                    text-white
                    px-5
                    py-2
                    rounded-lg
                    flex
                    items-center
                    justify-center
                    gap-2
                    min-w-[140px]
                  "
                >

                  <Save className="w-4 h-4" />

                  {savingUploadFee
                    ? "Saving..."
                    : "Save Fee"}

                </button>

              </div>

              {!loadingUploadFee && (
                <p
                  className="
                    text-xs
                    text-gray-500
                    mt-3
                  "
                >

                  Current fee: ₱
                  {Number(
                    uploadFee || 0
                  ).toLocaleString(
                    "en-PH",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}

                  {" "}per file

                </p>
              )}

            </div>
          )}

          {/* ==================================================
              KEYWORD MANAGEMENT
          ================================================== */}

          <div className="bg-white rounded-xl shadow p-6">

            <div className="flex items-center justify-between">

              <div>

                <div className="flex items-center gap-2 mb-2">

                  <Filter className="w-5 h-5 text-purple-600" />

                  <h2 className="font-semibold text-lg">
                    Advertisement Keywords
                  </h2>

                </div>

                <p className="text-sm text-gray-500">
                  Manage keywords used for
                  advertisement detection.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/settings/keywords"
                  )
                }
                className="
                  bg-purple-600
                  hover:bg-purple-700
                  text-white
                  px-5
                  py-2
                  rounded-lg
                  flex
                  items-center
                  gap-2
                "
              >

                Manage

                <ArrowRight className="w-4 h-4" />

              </button>

            </div>

          </div>

          {/* ==================================================
              BRAND MANAGEMENT
          ================================================== */}

          <div className="bg-white rounded-xl shadow p-6">

            <div className="flex items-center justify-between">

              <div>

                <div className="flex items-center gap-2 mb-2">

                  <Tags className="w-5 h-5 text-orange-600" />

                  <h2 className="font-semibold text-lg">
                    Brand Management
                  </h2>

                </div>

                <p className="text-sm text-gray-500">
                  Create, edit and delete
                  advertisement brands.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/settings/brands"
                  )
                }
                className="
                  bg-blue-600
                  hover:bg-blue-700
                  text-white
                  px-5
                  py-2
                  rounded-lg
                  flex
                  items-center
                  gap-2
                "
              >

                Manage

                <ArrowRight className="w-4 h-4" />

              </button>

            </div>

          </div>

          {/* ==================================================
              SYSTEM
          ================================================== */}

          <div className="bg-white rounded-xl shadow p-6">

            <div className="flex items-center gap-2 mb-5">

              <Server className="w-5 h-5 text-red-600" />

              <h2 className="font-semibold text-lg">
                System
              </h2>

            </div>

            <div className="flex justify-between items-center">

              <div>

                <p className="font-medium">
                  Backend
                </p>

                <p className="text-green-600 text-sm">
                  ● Online
                </p>

              </div>

              <button
                type="button"
                onClick={
                  restartAPI
                }
                disabled={
                  restarting
                }
                className="
                  bg-red-600
                  hover:bg-red-700
                  disabled:opacity-50
                  text-white
                  px-5
                  py-2
                  rounded-lg
                "
              >

                {restarting
                  ? "Restarting..."
                  : "Restart API"}

              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}