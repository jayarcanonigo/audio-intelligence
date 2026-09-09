"use client";

import {
  useState,
  useEffect,
  useId,
} from "react";

import {
  uploadAudio,
  getUploadStatus,
} from "@/services/api";

interface Props {
  projectId: number;
  onComplete?: () => void;
  onUploadStart?: (hour: string) => void;
  unavailableHours?: string[];
}

export default function UploadPanel({
  projectId,
  onComplete,
  onUploadStart,
  unavailableHours = [],
}: Props) {
  const fileInputId = useId();

  const [file, setFile] =
    useState<File | null>(null);

  const [uploadTime, setUploadTime] =
    useState("01");

  const [sessionId, setSessionId] =
    useState("");

  const [status, setStatus] =
    useState<any>(null);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  // ============================================================
  // AVAILABLE BROADCAST HOURS
  //
  // Hours contained in unavailableHours are hidden.
  // ============================================================

  const availableHours =
    Array.from(
      { length: 24 },
      (_, index) =>
        String(index + 1).padStart(
          2,
          "0",
        ),
    ).filter(
      (hour) =>
        !unavailableHours.includes(
          hour,
        ),
    );

  // ============================================================
  // MAKE SURE SELECTED HOUR IS STILL AVAILABLE
  // ============================================================

  useEffect(() => {
    if (
      availableHours.length === 0
    ) {
      return;
    }

    if (
      !availableHours.includes(
        uploadTime,
      )
    ) {
      setUploadTime(
        availableHours[0],
      );
    }
  }, [
    availableHours,
    uploadTime,
  ]);

  // ============================================================
  // UPLOAD
  // ============================================================

  async function handleUpload() {
    if (
      !file ||
      uploading ||
      availableHours.length === 0
    ) {
      return;
    }

    // Extra protection against stale UI.
    if (
      unavailableHours.includes(
        uploadTime,
      )
    ) {
      setError(
        `Broadcast hour ${uploadTime}:00 is already used.`,
      );

      return;
    }

    try {
      setUploading(true);
      setError("");
      setStatus(null);

      /*
       * The backend is responsible for:
       *
       * 1. Getting the logged-in user
       * 2. Getting upload fee
       * 3. Checking wallet balance
       * 4. Deducting upload fee
       * 5. Creating wallet transaction
       * 6. Starting upload
       *
       * DO NOT call debitWallet() here.
       */

      const selectedHour =
        uploadTime;

      const result =
        await uploadAudio(
          projectId,
          file,
          selectedHour,
        );

      // Tell parent immediately that this hour was selected.
      onUploadStart?.(
        selectedHour,
      );

      setSessionId(
        result.session_id,
      );
    } catch (error: any) {
      console.error(
        "Upload failed:",
        error,
      );

      let message =
        "Upload failed.";

      if (
        error?.response?.data
          ?.detail
      ) {
        message =
          error.response.data.detail;
      } else if (
        error?.message
      ) {
        message =
          error.message;
      }

      setError(message);
      setUploading(false);
    }
  }

  // ============================================================
  // MONITOR UPLOAD STATUS
  // ============================================================

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const timer =
      window.setInterval(
        async () => {
          try {
            const data =
              await getUploadStatus(
                sessionId,
              );

            setStatus(data);

            const normalizedStatus =
              String(
                data.status || "",
              ).toUpperCase();

            /*
             * Terminal statuses.
             */

            if (
              normalizedStatus ===
                "COMPLETED" ||
              normalizedStatus ===
                "CANCELLED" ||
              normalizedStatus ===
                "FAILED" ||
              normalizedStatus ===
                "ERROR"
            ) {
              clearInterval(timer);

              setUploading(false);

              onComplete?.();
            }
          } catch (error) {
            console.error(
              "Status check failed",
              error,
            );

            clearInterval(timer);

            setUploading(false);

            onComplete?.();
          }
        },
        2000,
      );

    return () =>
      clearInterval(timer);
  }, [
    sessionId,
    onComplete,
  ]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6">

      {/* ================= ERROR ================= */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">
            ⚠️ {error}
          </p>
        </div>
      )}

      {/* ================= CHOOSE FILE ================= */}

      <div>
        <input
          id={fileInputId}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            setFile(
              e.target.files?.[0] ||
                null,
            );

            setError("");
          }}
        />

        <label
          htmlFor={fileInputId}
          className="inline-flex cursor-pointer items-center gap-3 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-blue-700"
        >
          📁 Choose Audio File
        </label>

        {file ? (
          <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-sm text-green-700">
              <span className="font-semibold">
                Selected File:
              </span>{" "}
              {file.name}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-500">
            No audio file selected.
          </p>
        )}
      </div>

      {/* ================= BROADCAST TIME ================= */}

      <div>
        <label className="mb-2 block font-semibold text-gray-700">
          Broadcast Time
        </label>

        {availableHours.length ===
        0 ? (
          <div className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">
              All broadcast hours are
              currently used.
            </p>

            <p className="mt-1 text-xs text-red-600">
              Cancelled or failed
              uploads will make their
              hour available again.
            </p>
          </div>
        ) : (
          <select
            value={uploadTime}
            onChange={(e) =>
              setUploadTime(
                e.target.value,
              )
            }
            disabled={uploading}
            className="w-48 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
          >
            {availableHours.map(
              (hour) => (
                <option
                  key={hour}
                  value={hour}
                >
                  {hour}:00
                </option>
              ),
            )}
          </select>
        )}

        {availableHours.length >
          0 && (
          <p className="mt-2 text-xs text-gray-400">
            Hours already uploaded are
            hidden.
          </p>
        )}
      </div>

      {/* ================= UPLOAD BUTTON ================= */}

      <button
        type="button"
        onClick={
          handleUpload
        }
        disabled={
          !file ||
          uploading ||
          availableHours.length ===
            0
        }
        className={`rounded-xl px-6 py-3 font-semibold text-white shadow transition ${
          !file ||
          uploading ||
          availableHours.length ===
            0
            ? "cursor-not-allowed bg-gray-400"
            : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {uploading
          ? "⏳ Uploading..."
          : "🚀 Upload Audio"}
      </button>

      {/* ================= PROGRESS ================= */}

      {status && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm">

          <div className="mb-4 flex items-center justify-between">

            <span className="font-semibold text-gray-700">
              Status
            </span>

            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                String(
                  status.status ||
                    "",
                ).toUpperCase() ===
                "COMPLETED"
                  ? "bg-green-100 text-green-700"
                  : String(
                        status.status ||
                          "",
                      ).toUpperCase() ===
                      "PROCESSING"
                  ? "bg-blue-100 text-blue-700"
                  : String(
                        status.status ||
                          "",
                      ).toUpperCase() ===
                      "CANCELLED"
                  ? "bg-gray-100 text-gray-700"
                  : String(
                        status.status ||
                          "",
                      ).toUpperCase() ===
                        "FAILED" ||
                    String(
                      status.status ||
                        "",
                    ).toUpperCase() ===
                      "ERROR"
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {status.status}
            </span>

          </div>

          <div className="mb-2 flex justify-between text-sm text-gray-600">

            <span>
              Chunk{" "}
              {status.current_chunk ??
                0}{" "}
              /{" "}
              {status.total_chunks ??
                0}
            </span>

            <span>
              {status.progress_percent ||
                0}
              %
            </span>

          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">

            <div
              className="h-3 rounded-full bg-blue-600 transition-all duration-500"
              style={{
                width: `${
                  status.progress_percent ||
                  0
                }%`,
              }}
            />

          </div>

        </div>
      )}

    </div>
  );
}