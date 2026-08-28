"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  getProjects,
  deleteProject,
} from "@/services/api";

interface Project {
  id: number;
  name: string;
  status: string;
  created_at?: string;
}

export default function AdEditorPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(projectId: number) {
    const ok = window.confirm(
      "Delete this project?\n\nThis will permanently delete:\n\n• Project\n• Segments\n• Advertisements"
    );

    if (!ok) return;

    try {
      await deleteProject(projectId);

      setProjects((prev) =>
        prev.filter((project) => project.id !== projectId)
      );

    } catch (error) {
      console.error(error);
      alert("Failed to delete project.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ================= HEADER ================= */}
      <div className="border-b border-slate-200 bg-white px-8 py-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Ad Editor
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Select a project to edit advertisement segments.
        </p>
      </div>

      <div className="mx-auto max-w-5xl p-8">

        {/* ================= LOADING ================= */}
        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            Loading projects...
          </div>
        )}

        {/* ================= EMPTY ================= */}
        {!loading && projects.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            No projects found.
          </div>
        )}

        {/* ================= PROJECT LIST ================= */}
        {!loading && projects.length > 0 && (
          <div className="space-y-3">

            {projects.map((project) => (

              <div
                key={project.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >

                {/* Left */}
                <div>

                  <h2 className="text-base font-semibold text-slate-900">
                    {project.name}
                  </h2>

                  <div className="mt-2 flex items-center gap-3">

                    <span
                      className={`rounded-md border px-2 py-0.5 text-xs font-medium ${
                        project.status === "completed"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                    >
                      {project.status}
                    </span>

                    <span className="text-xs text-slate-400">
                      {project.created_at
                        ? new Date(
                            project.created_at
                          ).toLocaleDateString()
                        : "No date"}
                    </span>

                  </div>

                </div>

                {/* Right */}
                <div className="flex items-center gap-2">

                  <Link
                    href={`/ad-editor/${project.id}?name=${encodeURIComponent(
                      project.name
                    )}`}
                    className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    <Pencil size={15} />
                    Open Editor
                  </Link>

                  <button
                    onClick={() => handleDelete(project.id)}
                    aria-label="Delete project"
                    className="flex items-center justify-center rounded-lg border border-slate-200 p-2.5 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>

                </div>

              </div>

            ))}

          </div>
        )}
      </div>
    </div>
  );
}
