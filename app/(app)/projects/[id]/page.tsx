"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Plus, Trash2, Radio, FileAudio, Layers } from "lucide-react";
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
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Audio Intelligence
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {projectName}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-2">

            <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              <Layers size={13} className="text-slate-500" />
              Final Round
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              <Radio size={13} className="text-slate-500" />
              Advertisement Detection
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              <FileAudio size={13} className="text-slate-500" />
              Multi-file Upload
            </span>

          </div>

          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-slate-600">
            Upload one or more audio files to begin transcription,
            advertisement detection, and brand identification. Each upload
            is processed independently and can be monitored separately.
          </p>

        </div>

        {/* ================= UPLOAD PANELS ================= */}
        <div className="space-y-5">

          {uploadPanels.map((panelId, index) => (
            <div
              key={panelId}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >

              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/60 px-6 py-4">

                <div>
                  <h2 className="text-sm font-semibold text-slate-800">
                    Upload {index + 1}
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Select an audio file to start processing.
                  </p>
                </div>

                {uploadPanels.length > 1 && (
                  <button
                    onClick={() => removeUploadPanel(panelId)}
                    className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={14} />
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
          <div className="flex justify-center pb-8 pt-1">

            <button
              onClick={addUploadPanel}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
            >
              <Plus size={16} />
              Add Another Upload
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}
