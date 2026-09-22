"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Pencil, Trash2, SquarePen, X } from "lucide-react";
import { getProjects, deleteProject, updateProject } from "@/services/api";

interface Project {
  id: number;
  name: string;
  status: string;
  created_at?: string;
  broadcast_date?: string;
}

export default function AdEditorPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // EDIT PROJECT STATE
  // ============================================================

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState("");
  const [editDate, setEditDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  // ============================================================
  // LOAD PROJECTS
  // ============================================================

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

  // ============================================================
  // DELETE PROJECT
  // ============================================================

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

  // ============================================================
  // OPEN EDIT MODAL
  // ============================================================

  function handleOpenEdit(project: Project) {
    setEditingProject(project);

    // Project name
    setEditName(project.name || "");

    // Project CREATED DATE
    // Convert ISO datetime to YYYY-MM-DD for date input
    setEditDate(
      project.created_at
        ? new Date(project.created_at).toISOString().slice(0, 10)
        : ""
    );
  }

  // ============================================================
  // CLOSE EDIT MODAL
  // ============================================================

  function handleCloseEdit() {
    if (saving) return;

    setEditingProject(null);
    setEditName("");
    setEditDate("");
  }

  // ============================================================
  // SAVE PROJECT
  // ============================================================

  async function handleSaveEdit() {
    if (!editingProject) return;

    const trimmedName = editName.trim();

    if (!trimmedName) {
      alert("Project name cannot be empty.");
      return;
    }

    if (!editDate) {
      alert("Project created date cannot be empty.");
      return;
    }

    setSaving(true);

    try {
      // Send CREATED DATE, NOT broadcast_date
      const updated = await updateProject(editingProject.id, {
        name: trimmedName,
        created_at: `${editDate}T00:00:00`,
      });

      setProjects((prev) =>
        prev.map((project) =>
          project.id === editingProject.id
            ? {
                ...project,
                name: updated?.name ?? trimmedName,
                created_at:
                  updated?.created_at ??
                  `${editDate}T00:00:00`,
              }
            : project
        )
      );

      setEditingProject(null);
      setEditName("");
      setEditDate("");
    } catch (error) {
      console.error(error);
      alert("Failed to update project.");
    } finally {
      setSaving(false);
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
                {/* LEFT */}

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

                    {/* CREATED DATE */}

                    <span className="text-xs text-slate-400">
                      {project.created_at
                        ? new Date(
                            project.created_at
                          ).toLocaleDateString()
                        : "No date"}
                    </span>
                  </div>
                </div>

                {/* RIGHT */}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(project)}
                    aria-label="Edit project"
                    className="flex items-center justify-center rounded-lg border border-slate-200 p-2.5 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                  >
                    <SquarePen size={16} />
                  </button>

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

      {/* ================= EDIT PROJECT MODAL ================= */}

      {editingProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-900">
                Edit Project
              </h3>

              <button
                onClick={handleCloseEdit}
                disabled={saving}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>

            {/* BODY */}

            <div className="space-y-4 p-5">
              {/* PROJECT NAME */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Project Name
                </label>

                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              {/* PROJECT CREATED DATE */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Created Date
                </label>

                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
            </div>

            {/* FOOTER */}

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
              <button
                type="button"
                onClick={handleCloseEdit}
                disabled={saving}
                className="h-9 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={
                  saving ||
                  !editName.trim() ||
                  !editDate
                }
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}