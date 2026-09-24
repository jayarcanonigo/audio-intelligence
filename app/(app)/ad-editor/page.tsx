
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Pencil, Trash2, SquarePen, X } from "lucide-react";
import {
  getProjects,
  deleteProject,
  updateProject,
  getAdvertisements,
  getUploadStatuses,
} from "@/services/api";

interface Project {
  id: number;
  name: string;
  status: string;
  created_at?: string;
  broadcast_date?: string;
}

interface ProjectStats {
  completedUploads: number;
  savedAdvertisementHours: number[];
}

interface SavedAdView {
  start?: string | null;
  end?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  status?: string | null;
  is_saved?: boolean;
  saved?: boolean;
  [key: string]: unknown;
}

interface UploadStatus {
  status?: string;
  broadcast_hour?: number | string | null;
}

export default function AdEditorPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // PROJECT STATS
  // ============================================================

  const [projectStats, setProjectStats] = useState<
    Record<number, ProjectStats>
  >({});

  const [statsLoading, setStatsLoading] = useState(false);

  // ============================================================
  // EDIT PROJECT STATE
  // ============================================================

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState("");
  const [editDate, setEditDate] = useState("");
  const [saving, setSaving] = useState(false);

  // ============================================================
  // GET AD START
  // ============================================================

  function getAdStart(ad: SavedAdView): string | null {
    const value =
      ad.start ??
      ad.start_time ??
      null;

    if (value === null || value === undefined) {
      return null;
    }

    return String(value);
  }

  // ============================================================
  // GET SAVED ADVERTISEMENT HOURS
  //
  // SAME LOGIC USED BY THE AD EDITOR
  // ============================================================

  function getSavedAdHours(
    advertisements: SavedAdView[],
  ): number[] {
    const hours = new Set<number>();

    advertisements.forEach((ad) => {
      const start = getAdStart(ad);

      if (!start) {
        return;
      }

      const match = String(start).match(
        /(?:^|T|\s)(\d{1,2}):\d{2}(?::\d{2})?/,
      );

      if (!match) {
        return;
      }

      const hour = Number(match[1]);

      if (
        Number.isFinite(hour) &&
        hour >= 0 &&
        hour <= 23
      ) {
        hours.add(hour);
      }
    });

    return Array.from(hours).sort(
      (a, b) => a - b,
    );
  }

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadProjects();
  }, []);

  // ============================================================
  // LOAD PROJECTS
  // ============================================================

  async function loadProjects() {
    try {
      setLoading(true);

      const data = await getProjects();

      setProjects(data);

      await loadProjectStats(data);
    } catch (error) {
      console.error(
        "Failed to load projects:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // LOAD PROJECT STATISTICS
  // ============================================================

  async function loadProjectStats(
    projectList: Project[],
  ) {
    try {
      setStatsLoading(true);

      const results = await Promise.all(
        projectList.map(async (project) => {
          try {
            const [
              advertisements,
              uploadStatuses,
            ] = await Promise.all([
              getAdvertisements(project.id).catch(
                () => [],
              ),
              getUploadStatuses(project.id).catch(
                () => [],
              ),
            ]);

            const ads =
              (advertisements || []) as SavedAdView[];

            const uploads =
              (uploadStatuses || []) as UploadStatus[];

            // ==================================================
            // COMPLETED UPLOADS
            // ==================================================

            const completedUploads =
              uploads.filter(
                (upload) =>
                  String(
                    upload.status || "",
                  ).toUpperCase() ===
                  "COMPLETED",
              ).length;

            // ==================================================
            // ONLY SAVED ADVERTISEMENTS
            //
            // Keep the same saved logic:
            // status = SAVED
            // OR is_saved = true
            // OR saved = true
            // ==================================================

            const savedAds = ads.filter((ad) => {
              return (
                String(
                  ad.status || "",
                ).toUpperCase() === "SAVED" ||
                ad.is_saved === true ||
                ad.saved === true
              );
            });

            // ==================================================
            // SAVED ADVERTISEMENT HOURS
            //
            // IMPORTANT:
            // This uses the advertisement START timestamp,
            // NOT broadcast_hour.
            //
            // Example:
            //
            // 01:05:20
            // 01:15:40
            // 01:59:10
            // 04:10:20
            //
            // Result:
            //
            // [1, 4]
            // ==================================================

            const savedAdvertisementHours =
              getSavedAdHours(savedAds);

            return {
              projectId: project.id,

              stats: {
                completedUploads,
                savedAdvertisementHours,
              },
            };
          } catch (error) {
            console.error(
              `Failed to load statistics for project ${project.id}:`,
              error,
            );

            return {
              projectId: project.id,

              stats: {
                completedUploads: 0,
                savedAdvertisementHours: [],
              },
            };
          }
        }),
      );

      const statsMap: Record<
        number,
        ProjectStats
      > = {};

      results.forEach((result) => {
        statsMap[result.projectId] =
          result.stats;
      });

      setProjectStats(statsMap);
    } catch (error) {
      console.error(
        "Failed to load project statistics:",
        error,
      );
    } finally {
      setStatsLoading(false);
    }
  }

  // ============================================================
  // DELETE PROJECT
  // ============================================================

  async function handleDelete(
    projectId: number,
  ) {
    const ok = window.confirm(
      "Delete this project?\n\nThis will permanently delete:\n\n• Project\n• Segments\n• Advertisements",
    );

    if (!ok) return;

    try {
      await deleteProject(projectId);

      setProjects((prev) =>
        prev.filter(
          (project) =>
            project.id !== projectId,
        ),
      );

      setProjectStats((prev) => {
        const next = { ...prev };

        delete next[projectId];

        return next;
      });
    } catch (error) {
      console.error(error);

      alert("Failed to delete project.");
    }
  }

  // ============================================================
  // OPEN EDIT MODAL
  // ============================================================

  function handleOpenEdit(
    project: Project,
  ) {
    setEditingProject(project);

    setEditName(
      project.name || "",
    );

    setEditDate(
      project.created_at
        ? new Date(
            project.created_at,
          )
            .toISOString()
            .slice(0, 10)
        : "",
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
    if (!editingProject) {
      return;
    }

    const trimmedName =
      editName.trim();

    if (!trimmedName) {
      alert(
        "Project name cannot be empty.",
      );

      return;
    }

    if (!editDate) {
      alert(
        "Project created date cannot be empty.",
      );

      return;
    }

    setSaving(true);

    try {
      // Send CREATED DATE, NOT broadcast_date
      const updated =
        await updateProject(
          editingProject.id,
          {
            name: trimmedName,
            created_at:
              `${editDate}T00:00:00`,
          },
        );

      setProjects((prev) =>
        prev.map((project) =>
          project.id ===
          editingProject.id
            ? {
                ...project,
                name:
                  updated?.name ??
                  trimmedName,
                created_at:
                  updated?.created_at ??
                  `${editDate}T00:00:00`,
              }
            : project,
        ),
      );

      setEditingProject(null);
      setEditName("");
      setEditDate("");
    } catch (error) {
      console.error(error);

      alert(
        "Failed to update project.",
      );
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // FORMAT SAVED HOURS
  // ============================================================

  function formatSavedHours(
    hours: number[],
  ) {
    if (
      !hours ||
      hours.length === 0
    ) {
      return "None";
    }

    return hours
      .map((hour) =>
        String(hour).padStart(
          2,
          "0",
        ),
      )
      .join(", ");
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="border-b border-slate-200 bg-white px-8 py-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Ad Editor
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Select a project to edit advertisement segments.
        </p>
      </div>

      <div className="mx-auto max-w-5xl p-8">
        {/* ======================================================
            LOADING
        ====================================================== */}

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            Loading projects...
          </div>
        )}

        {/* ======================================================
            EMPTY
        ====================================================== */}

        {!loading &&
          projects.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              No projects found.
            </div>
          )}

        {/* ======================================================
            PROJECT LIST
        ====================================================== */}

        {!loading &&
          projects.length > 0 && (
            <div className="space-y-3">
              {projects.map(
                (project) => {
                  const stats =
                    projectStats[
                      project.id
                    ];

                  return (
                    <div
                      key={project.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                    >
                      {/* ==========================================
                          LEFT
                      ========================================== */}

                      <div className="min-w-0">
                        {/* PROJECT NAME */}

                        <h2 className="text-base font-semibold text-slate-900">
                          {project.name}
                        </h2>

                        {/* STATUS + DATE */}

                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-xs font-medium ${
                              project.status ===
                              "completed"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            }`}
                          >
                            {
                              project.status
                            }
                          </span>

                          <span className="text-xs text-slate-400">
                            {project.created_at
                              ? new Date(
                                  project.created_at,
                                ).toLocaleDateString()
                              : "No date"}
                          </span>
                        </div>

                        {/* ==========================================
                            PROJECT STATISTICS
                        ========================================== */}

                        <div className="mt-4 flex flex-wrap gap-2">
                          {/* COMPLETED UPLOADS */}

                          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                              Completed Uploads
                            </div>

                            <div className="mt-0.5 text-sm font-bold text-emerald-800">
                              {statsLoading &&
                              !stats
                                ? "..."
                                : stats?.completedUploads ??
                                  0}
                            </div>
                          </div>

                          {/* SAVED ADVERTISEMENT HOURS */}

                     <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                        Processed Hours Ads
                      </div>

                      <div className="mt-0.5 text-sm font-bold text-blue-800">
                        {statsLoading && !stats
                          ? "..."
                          : stats?.savedAdvertisementHours?.length ?? 0}
                      </div>
                    </div>
                        </div>
                      </div>

                      {/* ==========================================
                          RIGHT ACTIONS
                      ========================================== */}

                      <div className="ml-4 flex shrink-0 items-center gap-2">
                        {/* EDIT */}

                        <button
                          onClick={() =>
                            handleOpenEdit(
                              project,
                            )
                          }
                          aria-label="Edit project"
                          className="flex items-center justify-center rounded-lg border border-slate-200 p-2.5 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                        >
                          <SquarePen
                            size={16}
                          />
                        </button>

                        {/* OPEN EDITOR */}

                        <Link
                          href={`/ad-editor/${project.id}?name=${encodeURIComponent(
                            project.name,
                          )}`}
                          className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                        >
                          <Pencil
                            size={15}
                          />
                          Open Editor
                        </Link>

                        {/* DELETE */}

                        <button
                          onClick={() =>
                            handleDelete(
                              project.id,
                            )
                          }
                          aria-label="Delete project"
                          className="flex items-center justify-center rounded-lg border border-slate-200 p-2.5 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2
                            size={16}
                          />
                        </button>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
      </div>

      {/* ========================================================
          EDIT PROJECT MODAL
      ======================================================== */}

      {editingProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-900">
                Edit Project
              </h3>

              <button
                onClick={
                  handleCloseEdit
                }
                disabled={saving}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>

            {/* MODAL BODY */}

            <div className="space-y-4 p-5">
              {/* PROJECT NAME */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Project Name
                </label>

                <input
                  type="text"
                  value={editName}
                  onChange={(e) =>
                    setEditName(
                      e.target.value,
                    )
                  }
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              {/* CREATED DATE */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Created Date
                </label>

                <input
                  type="date"
                  value={editDate}
                  onChange={(e) =>
                    setEditDate(
                      e.target.value,
                    )
                  }
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
            </div>

            {/* MODAL FOOTER */}

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
              <button
                type="button"
                onClick={
                  handleCloseEdit
                }
                disabled={saving}
                className="h-9 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleSaveEdit
                }
                disabled={
                  saving ||
                  !editName.trim() ||
                  !editDate
                }
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
