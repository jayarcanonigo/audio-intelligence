
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
  HardDrive,
  MemoryStick,
  Activity,
  RefreshCw,
  RotateCw,
} from "lucide-react";

import {
  toast,
  ToastContainer,
} from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

import { getRole } from "@/services/auth";

import {
  getUploadFee,
  updateUploadFee,
  getSystemUsage,
  restartApi,
  getApiHealth,
  type SystemUsage,
} from "@/services/settings";


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
  // SYSTEM USAGE
  // ==========================================================

  const [systemUsage, setSystemUsage] =
    useState<SystemUsage | null>(null);

  const [loadingUsage, setLoadingUsage] =
    useState(false);

  const [usageError, setUsageError] =
    useState("");


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
    loadSystemUsage();

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

      const value =
        await getUploadFee();

      setUploadFee(
        String(value)
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

      const result =
        await updateUploadFee(amount);

      setUploadFee(
        String(
          result.value ??
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

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem(
              "access_token"
            )
          : null;


      if (!token) {

        throw new Error(
          "Authentication token not found."
        );

      }


      const API_URL =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:8000";


      const res =
        await fetch(
          `${API_URL}/system/settings/beta`,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",
            },

            cache: "no-store",
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
          data?.value ??
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


      const token =
        typeof window !== "undefined"
          ? localStorage.getItem(
              "access_token"
            )
          : null;


      if (!token) {

        throw new Error(
          "Authentication token not found."
        );

      }


      const API_URL =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:8000";


      const res =
        await fetch(
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
              value:
                enabled
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
  // LOAD SYSTEM USAGE
  // ==========================================================

  async function loadSystemUsage() {

    if (!isAdmin) {
      return;
    }


    try {

      setLoadingUsage(true);
      setUsageError("");


      const usage =
        await getSystemUsage();


      setSystemUsage(
        usage
      );

    } catch (error) {

      console.error(
        "Failed to load system usage:",
        error
      );


      const message =
        error instanceof Error
          ? error.message
          : "Failed to load system usage.";


      setUsageError(
        message
      );

    } finally {

      setLoadingUsage(false);

    }

  }


  // ==========================================================
  // REFRESH SYSTEM USAGE
  // ==========================================================

  async function refreshSystemUsage() {

    await loadSystemUsage();

    toast.success(
      "System usage refreshed."
    );

  }


  // ==========================================================
  // RESTART API
  // ==========================================================

  async function restartAPI() {

    if (restarting) {
      return;
    }


    try {

      setRestarting(true);


      toast.info(
        "Restarting audio-api..."
      );


      const result =
        await restartApi();


      if (!result.success) {

        throw new Error(
          result.message ||
          "Restart failed."
        );

      }


      toast.success(
        result.message ||
        "API restart requested successfully."
      );


      /*
       * The current API process is being restarted.
       *
       * Give PM2 time to restart the process
       * before checking health.
       */

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            3000
          )
      );


      let online = false;


      for (
        let attempt = 0;
        attempt < 10;
        attempt++
      ) {

        try {

          await getApiHealth();

          online = true;

          break;

        } catch {

          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                1000
              )
          );

        }

      }


      if (online) {

        toast.success(
          "Backend is online again."
        );

        await loadSystemUsage();

      } else {

        toast.warning(
          "Restart requested, but backend health check is still unavailable."
        );

      }

    } catch (error) {

      console.error(
        "Restart failed:",
        error
      );


      toast.error(
        error instanceof Error
          ? error.message
          : "Restart failed."
      );

    } finally {

      setRestarting(false);

    }

  }


  // ==========================================================
  // FORMAT MB
  // ==========================================================

  function formatMB(
    value: number
  ) {

    if (!Number.isFinite(value)) {
      return "0 MB";
    }


    if (value >= 1024) {

      return (
        (value / 1024)
          .toFixed(2) +
        " GB"
      );

    }


    return (
      value.toFixed(0) +
      " MB"
    );

  }


  // ==========================================================
  // FORMAT GB
  // ==========================================================

  function formatGB(
    value: number
  ) {

    if (!Number.isFinite(value)) {
      return "0 GB";
    }


    return (
      value.toFixed(2) +
      " GB"
    );

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

      <ToastContainer
        position="top-right"
        autoClose={3000}
      />


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
              SYSTEM USAGE
              ADMIN ONLY
          ================================================== */}

          {isAdmin && (

            <div className="bg-white rounded-xl shadow p-6">

              <div className="flex items-center justify-between mb-6">

                <div>

                  <div className="flex items-center gap-2">

                    <Activity className="w-5 h-5 text-blue-600" />

                    <h2 className="font-semibold text-lg">
                      System Usage
                    </h2>

                  </div>


                  <p className="text-sm text-gray-500 mt-1">
                    Current server and backend process
                    resource usage.
                  </p>

                </div>


                <button
                  type="button"
                  onClick={
                    refreshSystemUsage
                  }
                  disabled={
                    loadingUsage
                  }
                  className="
                    border
                    border-gray-300
                    hover:bg-gray-50
                    disabled:opacity-50
                    px-4
                    py-2
                    rounded-lg
                    flex
                    items-center
                    gap-2
                  "
                >

                  <RefreshCw
                    className={`
                      w-4
                      h-4
                      ${
                        loadingUsage
                          ? "animate-spin"
                          : ""
                      }
                    `}
                  />

                  {loadingUsage
                    ? "Refreshing..."
                    : "Refresh"}

                </button>

              </div>


              {usageError && (

                <div
                  className="
                    mb-5
                    rounded-lg
                    bg-red-50
                    border
                    border-red-200
                    text-red-700
                    px-4
                    py-3
                    text-sm
                  "
                >

                  {usageError}

                </div>

              )}


              {loadingUsage &&
                !systemUsage && (

                <div className="py-10 text-center text-gray-500">

                  Loading system usage...

                </div>

              )}


              {systemUsage && (

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">


                  {/* CPU */}

                  <div className="border rounded-xl p-5">

                    <div className="flex items-center gap-3">

                      <div className="p-2 rounded-lg bg-blue-50">

                        <Cpu className="w-5 h-5 text-blue-600" />

                      </div>


                      <div>

                        <p className="text-sm text-gray-500">
                          CPU Usage
                        </p>

                        <p className="text-2xl font-bold">
                          {systemUsage.cpu_percent.toFixed(1)}%
                        </p>

                      </div>

                    </div>


                    <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">

                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{
                          width: `${Math.min(
                            Math.max(
                              systemUsage.cpu_percent,
                              0
                            ),
                            100
                          )}%`,
                        }}
                      />

                    </div>

                  </div>


                  {/* MEMORY */}

                  <div className="border rounded-xl p-5">

                    <div className="flex items-center gap-3">

                      <div className="p-2 rounded-lg bg-purple-50">

                        <MemoryStick className="w-5 h-5 text-purple-600" />

                      </div>


                      <div>

                        <p className="text-sm text-gray-500">
                          Memory Usage
                        </p>

                        <p className="text-2xl font-bold">
                          {systemUsage.memory_percent.toFixed(1)}%
                        </p>

                      </div>

                    </div>


                    <p className="text-sm text-gray-500 mt-4">

                      {formatMB(
                        systemUsage.memory_used_mb
                      )}

                      {" / "}

                      {formatMB(
                        systemUsage.memory_total_mb
                      )}

                    </p>


                    <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">

                      <div
                        className="h-full bg-purple-600 rounded-full"
                        style={{
                          width: `${Math.min(
                            Math.max(
                              systemUsage.memory_percent,
                              0
                            ),
                            100
                          )}%`,
                        }}
                      />

                    </div>

                  </div>


                  {/* DISK */}

                  <div className="border rounded-xl p-5">

                    <div className="flex items-center gap-3">

                      <div className="p-2 rounded-lg bg-orange-50">

                        <HardDrive className="w-5 h-5 text-orange-600" />

                      </div>


                      <div>

                        <p className="text-sm text-gray-500">
                          Disk Usage
                        </p>

                        <p className="text-2xl font-bold">
                          {systemUsage.disk_percent.toFixed(1)}%
                        </p>

                      </div>

                    </div>


                    <p className="text-sm text-gray-500 mt-4">

                      {formatGB(
                        systemUsage.disk_used_gb
                      )}

                      {" / "}

                      {formatGB(
                        systemUsage.disk_total_gb
                      )}

                    </p>


                    <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">

                      <div
                        className="h-full bg-orange-600 rounded-full"
                        style={{
                          width: `${Math.min(
                            Math.max(
                              systemUsage.disk_percent,
                              0
                            ),
                            100
                          )}%`,
                        }}
                      />

                    </div>

                  </div>

                </div>

              )}


              {/* PM2 */}

              {systemUsage?.pm2 && (

                <div className="mt-5 border rounded-xl p-5">

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                    <div>

                      <div className="flex items-center gap-3">

                        <Server className="w-5 h-5 text-gray-700" />

                        <div>

                          <p className="font-semibold">
                            PM2 Process
                          </p>

                          <p className="text-sm text-gray-500">
                            {systemUsage.pm2.name}
                          </p>

                        </div>

                      </div>

                    </div>


                    <div className="flex flex-wrap items-center gap-4 text-sm">


                      <div>

                        <span className="text-gray-500">
                          Status:
                        </span>{" "}

                        <span
                          className={
                            systemUsage.pm2.status === "online"
                              ? "font-semibold text-green-600"
                              : "font-semibold text-red-600"
                          }
                        >

                          ●{" "}
                          {systemUsage.pm2.status}

                        </span>

                      </div>


                      <div>

                        <span className="text-gray-500">
                          PID:
                        </span>{" "}

                        <span className="font-medium">

                          {systemUsage.pm2.pid ??
                            "—"}

                        </span>

                      </div>


                      <div>

                        <span className="text-gray-500">
                          Restarts:
                        </span>{" "}

                        <span className="font-medium">

                          {systemUsage.pm2.restarts}

                        </span>

                      </div>


                      <div>

                        <span className="text-gray-500">
                          CPU:
                        </span>{" "}

                        <span className="font-medium">

                          {Number(
                            systemUsage.pm2.cpu
                          ).toFixed(1)}%

                        </span>

                      </div>


                      <div>

                        <span className="text-gray-500">
                          RAM:
                        </span>{" "}

                        <span className="font-medium">

                          {formatMB(
                            systemUsage.pm2.memory_mb
                          )}

                        </span>

                      </div>

                    </div>

                  </div>

                </div>

              )}

            </div>

          )}


          {/* ==================================================
              SYSTEM / RESTART
              ADMIN ONLY
          ================================================== */}

          {isAdmin && (

            <div className="bg-white rounded-xl shadow p-6">

              <div className="flex items-center gap-2 mb-5">

                <Server className="w-5 h-5 text-red-600" />

                <h2 className="font-semibold text-lg">
                  System
                </h2>

              </div>


              <div className="flex flex-col md:flex-row justify-between md:items-center gap-5">

                <div>

                  <p className="font-medium">
                    Backend API
                  </p>


                  <p
                    className={`
                      text-sm
                      ${
                        systemUsage?.pm2?.status === "online"
                          ? "text-green-600"
                          : "text-gray-500"
                      }
                    `}
                  >

                    {systemUsage?.pm2?.status === "online"
                      ? "● Online"
                      : "● Status unavailable"}

                  </p>


                  <p className="text-xs text-gray-400 mt-1">
                    PM2 process: audio-api
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
                    disabled:cursor-not-allowed
                    text-white
                    px-5
                    py-2
                    rounded-lg
                    flex
                    items-center
                    justify-center
                    gap-2
                    min-w-[160px]
                  "
                >

                  <RotateCw
                    className={`
                      w-4
                      h-4
                      ${
                        restarting
                          ? "animate-spin"
                          : ""
                      }
                    `}
                  />


                  {restarting
                    ? "Restarting..."
                    : "Restart API"}

                </button>

              </div>

            </div>

          )}

        </div>

      </div>

    </div>

  );

}

