"use client";

import { useState, useEffect, useId } from "react";
import { uploadAudio, getUploadStatus } from "@/services/api";

interface Props {
  projectId: number;
  onComplete?: () => void;
}

export default function UploadPanel({
  projectId,
  onComplete,
}: Props) {
  const fileInputId = useId();

  const [file, setFile] = useState<File | null>(null);
  const [uploadTime, setUploadTime] = useState("01");
  const [sessionId, setSessionId] = useState("");
  const [status, setStatus] = useState<any>(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload() {
    if (!file || uploading) return;

    try {
      setUploading(true);
      setError("");
      setStatus(null);

      /*
       * The backend upload endpoint is responsible for:
       *
       * 1. Getting the logged-in user
       * 2. Getting the current upload fee
       * 3. Checking wallet balance
       * 4. Deducting the upload fee
       * 5. Creating the wallet transaction
       * 6. Starting the upload
       *
       * Therefore, DO NOT call debitWallet() here.
       */

      const result = await uploadAudio(
        projectId,
        file,
        uploadTime
      );

      setSessionId(result.session_id);
    } catch (error: any) {
      console.error("Upload failed:", error);

      let message = "Upload failed.";

      if (error?.response?.data?.detail) {
        message = error.response.data.detail;
      } else if (error?.message) {
        message = error.message;
      }

      setError(message);
      setUploading(false);
    }
  }

  // Monitor upload status
  useEffect(() => {
    if (!sessionId) return;

    const timer = setInterval(async () => {
      try {
        const data = await getUploadStatus(sessionId);

        setStatus(data);

        if (
          data.status === "completed" ||
          data.status === "error"
        ) {
          clearInterval(timer);
          setUploading(false);
          onComplete?.();
        }
      } catch (error) {
        console.error("Status check failed", error);

        clearInterval(timer);
        setUploading(false);
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [sessionId, onComplete]);

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
            setFile(e.target.files?.[0] || null);
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

        <select
          value={uploadTime}
          onChange={(e) => setUploadTime(e.target.value)}
          disabled={uploading}
          className="w-48 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
        >
          {Array.from({ length: 24 }, (_, index) => {
            const hour = String(index + 1).padStart(2, "0");

            return (
              <option key={hour} value={hour}>
                {hour}:00
              </option>
            );
          })}
        </select>
      </div>

      {/* ================= UPLOAD BUTTON ================= */}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className={`rounded-xl px-6 py-3 font-semibold text-white shadow transition ${
          !file || uploading
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
                status.status === "completed"
                  ? "bg-green-100 text-green-700"
                  : status.status === "processing"
                  ? "bg-blue-100 text-blue-700"
                  : status.status === "error"
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {status.status}
            </span>

          </div>

          <div className="mb-2 flex justify-between text-sm text-gray-600">

            <span>
              Chunk {status.current_chunk} /{" "}
              {status.total_chunks}
            </span>

            <span>
              {status.progress_percent || 0}%
            </span>

          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">

            <div
              className="h-3 rounded-full bg-blue-600 transition-all duration-500"
              style={{
                width: `${status.progress_percent || 0}%`,
              }}
            />

          </div>

        </div>
      )}

    </div>
  );
}