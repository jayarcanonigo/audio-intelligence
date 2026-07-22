"use client";

import { useParams, useSearchParams } from "next/navigation";
import UploadPanel from "@/components/upload/UploadPanel";

export default function ProjectPage() {
 const params = useParams();
  const searchParams = useSearchParams();

const projectId = Number(params.id);
const projectName =
  searchParams.get("name") || `Project #${projectId}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto p-6">

        {/* Header */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-lg">
          <p className="text-sm uppercase tracking-widest text-blue-100">
            Audio Intelligence
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            {projectName}
          </h1>

          <p className="mt-2 text-blue-100">
            Upload an audio file to begin transcription and advertisement detection.
          </p>
        </div>

        {/* Upload Card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-800">
              📤 Upload Audio
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose an audio file from your computer to start processing.
            </p>
          </div>

          <div className="p-6">
            <UploadPanel
              projectId={projectId}
              onComplete={() => {}}
            />
          </div>
        </div>

      </div>
    </div>
  );
}