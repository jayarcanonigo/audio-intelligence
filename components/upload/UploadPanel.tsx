"use client";

import { useState, useEffect } from "react";
import { uploadAudio, getUploadStatus } from "@/services/api";

interface Props {
  projectId: number;
  onComplete?: () => void;
}

export default function UploadPanel({
  projectId,
  onComplete,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [keywords, setKeywords] = useState("");
  const [uploadTime, setUploadTime] = useState("01");
  const [sessionId, setSessionId] = useState("");
  const [status, setStatus] = useState<any>(null);

  const STORAGE_KEY = `keywords-${projectId}`;

  // Load saved keywords
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setKeywords(saved);
    }
  }, [STORAGE_KEY]);

  function handleSaveKeywords() {
    localStorage.setItem(STORAGE_KEY, keywords);
    alert("✅ Keywords saved successfully.");
  }

  function handleLoadKeywords() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      setKeywords(saved);
      alert("✅ Saved keywords loaded.");
    } else {
      alert("No saved keywords found.");
    }
  }

  function handleClearKeywords() {
    setKeywords("");
    localStorage.removeItem(STORAGE_KEY);
  }

  async function handleUpload() {
    if (!file) return;

    const keywordList = keywords
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

    const result = await uploadAudio(
      projectId,
      file,
      keywordList,
      uploadTime
    );

    setSessionId(result.session_id);
  }

  useEffect(() => {
    if (!sessionId) return;

    const timer = setInterval(async () => {
      const data = await getUploadStatus(sessionId);

      setStatus(data);

      if (data.status === "completed") {
        onComplete?.();
        clearInterval(timer);
      }

      if (data.status === "error") {
        clearInterval(timer);
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [sessionId, onComplete]);

  return (
    <div className="space-y-6">

      {/* Choose File */}
      <div>
        <input
          id="audio-file"
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <label
          htmlFor="audio-file"
          className="inline-flex cursor-pointer items-center gap-3 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-blue-700"
        >
          📁 Choose Audio File
        </label>

        {file ? (
          <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-sm text-green-700">
              <span className="font-semibold">Selected File:</span>{" "}
              {file.name}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-500">
            No audio file selected.
          </p>
        )}
      </div>

      {/* Broadcast Time */}
      <div>
        <label className="mb-2 block font-semibold text-gray-700">
          Broadcast Time
        </label>

        <select
          value={uploadTime}
          onChange={(e) => setUploadTime(e.target.value)}
          className="w-48 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
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

      {/* Keywords */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="font-semibold text-gray-700">
            Keywords
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveKeywords}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              💾 Save
            </button>

            <button
              type="button"
              onClick={handleLoadKeywords}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              📂 Load
            </button>

            <button
              type="button"
              onClick={handleClearKeywords}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              🗑 Clear
            </button>
          </div>
        </div>

        <textarea
          placeholder="Enter one keyword per line..."
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          className="h-40 w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Upload */}
      <button
        onClick={handleUpload}
        disabled={!file}
        className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white shadow transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        🚀 Upload Audio
      </button>

      {/* Progress */}
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
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {status.status}
            </span>
          </div>

          <div className="mb-2 flex justify-between text-sm text-gray-600">
            <span>
              Chunk {status.current_chunk} / {status.total_chunks}
            </span>

            <span>{status.progress_percent || 0}%</span>
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