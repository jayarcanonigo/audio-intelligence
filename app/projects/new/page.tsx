"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/services/api";

export default function NewProjectPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!name.trim()) {
      alert("Please enter a project name.");
      return;
    }

    try {
      setLoading(true);

      const project = await createProject(name);

      router.push(`/projects/${project.id}?name=${encodeURIComponent(project.name)}`);
    } catch (error) {
      console.error(error);
      alert("Failed to create project.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-2xl px-6">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">
            New Project
          </h1>

          <p className="mt-2 text-slate-500">
            Create a new project to begin audio transcription and advertisement detection.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

          <div className="mb-6">
            <label
              htmlFor="projectName"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Project Name
            </label>

            <input
              id="projectName"
              type="text"
              placeholder="e.g. Morning News - July 23"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreate();
                }
              }}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => router.back()}
              className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              onClick={handleCreate}
              disabled={loading || !name.trim()}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}