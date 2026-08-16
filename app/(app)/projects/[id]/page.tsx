"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import UploadPanel from "@/components/upload/UploadPanel";

export default function ProjectPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const projectId = Number(params.id);
  const projectName =
    searchParams.get("name") || `Project #${projectId}`;

  const [uploadPanels, setUploadPanels] = useState<number[]>([Date.now()]);

  const addUploadPanel = () => {
    setUploadPanels((prev) => [...prev, Date.now() + Math.random()]);
  };

  const removeUploadPanel = (id: number) => {
    setUploadPanels((prev) => prev.filter((panelId) => panelId !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl p-6">

        {/* ================= HEADER ================= */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-xl">

          <p className="text-sm uppercase tracking-[0.25em] text-blue-100">
            Audio Intelligence
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            {projectName}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">

            <span className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold backdrop-blur">
              🎯 Final Round
            </span>

            <span className="rounded-full bg-green-500/20 px-4 py-1.5 text-sm font-medium text-green-100">
              📡 AI Advertisement Detection
            </span>

            <span className="rounded-full bg-yellow-400/20 px-4 py-1.5 text-sm font-medium text-yellow-100">
              🎧 Multi Upload Supported
            </span>

          </div>

          <p className="mt-5 max-w-3xl text-blue-100">
            Upload one or more audio files to begin transcription,
            advertisement detection, and brand identification.
            Each upload is processed independently and can be monitored
            separately.
          </p>

        </div>

        {/* ================= UPLOAD PANELS ================= */}
        <div className="space-y-6">

          {uploadPanels.map((panelId, index) => (
            <div
              key={panelId}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >

              {/* Card Header */}
              <div className="flex items-center justify-between border-b bg-slate-50 px-6 py-4">

                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    📤 Upload #{index + 1}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Select an audio file to start processing.
                  </p>
                </div>

                {uploadPanels.length > 1 && (
                  <button
                    onClick={() => removeUploadPanel(panelId)}
                    className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                )}

              </div>

              {/* Upload Component */}
              <div className="p-6">
                <UploadPanel
                  projectId={projectId}
                  onComplete={() => {}}
                />
              </div>

            </div>
          ))}

          {/* ================= ADD UPLOAD BUTTON ================= */}
          <div className="flex justify-center pt-2 pb-8">

            <button
              onClick={addUploadPanel}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-700 hover:shadow-xl"
            >
              <Plus size={18} />
              Add Another Upload
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}