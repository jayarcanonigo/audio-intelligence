"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
Plus,
Trash2,
Radio,
FileAudio,
Layers,
Copy,
Check,
} from "lucide-react";
import UploadPanel from "@/components/upload/UploadPanel";

export default function ProjectPage() {
const params = useParams();
const searchParams = useSearchParams();

const projectId = Number(params.id);

const projectName =
searchParams.get("name") || `Project #${projectId}`;

const [uploadPanels, setUploadPanels] = useState<number[]>([
Date.now(),
]);

const [copied, setCopied] = useState(false);

// ============================================================
// ADD UPLOAD PANEL
// ============================================================

const addUploadPanel = () => {
setUploadPanels((prev) => [
...prev,
Date.now() + Math.random(),
]);
};

// ============================================================
// REMOVE UPLOAD PANEL
// ============================================================

const removeUploadPanel = (id: number) => {
setUploadPanels((prev) =>
prev.filter((panelId) => panelId !== id)
);
};

// ============================================================
// COPY PROJECT TITLE
// ============================================================

const copyProjectTitle = async () => {
try {
if (navigator.clipboard) {
await navigator.clipboard.writeText(projectName);
} else {
const textarea = document.createElement("textarea");

    textarea.value = projectName;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";

    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();

    document.execCommand("copy");

    document.body.removeChild(textarea);
  }

  setCopied(true);

  setTimeout(() => {
    setCopied(false);
  }, 1500);
} catch (error) {
  console.error(
    "Failed to copy project title:",
    error
  );

  alert("Failed to copy project title.");
}


};

// ============================================================
// RENDER
// ============================================================

return ( <div className="min-h-screen bg-slate-50"> <div className="mx-auto max-w-5xl p-6">


    {/* ======================================================
        HEADER
    ====================================================== */}

    <div className="mb-8 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">

      {/* HEADER LABEL */}

      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        Audio Intelligence
      </p>

      {/* PROJECT TITLE */}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">

        <h1 className="min-w-0 flex-1 break-words text-3xl font-semibold tracking-tight text-slate-900">
          {projectName}
        </h1>

        {/* COPY TITLE BUTTON */}

        <button
          type="button"
          onClick={copyProjectTitle}
          className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
            copied
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white hover:text-slate-900"
          }`}
          title={
            copied
              ? "Project title copied"
              : "Copy project title"
          }
        >
          {copied ? (
            <>
              <Check size={15} />
              Copied!
            </>
          ) : (
            <>
              <Copy size={15} />
              Copy Title
            </>
          )}
        </button>

      </div>

      {/* PROJECT TAGS */}

      <div className="mt-5 flex flex-wrap items-center gap-2">

        <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          <Layers
            size={13}
            className="text-slate-500"
          />
          Final Round
        </span>

        <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          <Radio
            size={13}
            className="text-slate-500"
          />
          Advertisement Detection
        </span>

        <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          <FileAudio
            size={13}
            className="text-slate-500"
          />
          Multi-file Upload
        </span>

      </div>

      {/* DESCRIPTION */}

      <p className="mt-5 max-w-3xl text-sm leading-relaxed text-slate-600">
        Upload one or more audio files to begin
        transcription, advertisement detection,
        and brand identification. Each upload
        is processed independently and can be
        monitored separately.
      </p>

    </div>

    {/* ======================================================
        UPLOAD PANELS
    ====================================================== */}

    <div className="space-y-5">

      {uploadPanels.map((panelId, index) => (
        <div
          key={panelId}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >

          {/* UPLOAD HEADER */}

          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/60 px-6 py-4">

            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Upload {index + 1}
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Select an audio file to start processing.
              </p>
            </div>

            {/* REMOVE BUTTON */}

            {uploadPanels.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  removeUploadPanel(panelId)
                }
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={14} />
                Remove
              </button>
            )}

          </div>

          {/* UPLOAD PANEL */}

          <div className="p-6">
            <UploadPanel
              projectId={projectId}
              onComplete={() => {}}
            />
          </div>

        </div>
      ))}

      {/* ====================================================
          ADD ANOTHER UPLOAD
      ==================================================== */}

      <div className="flex justify-center pb-8 pt-1">

        <button
          type="button"
          onClick={addUploadPanel}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
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
