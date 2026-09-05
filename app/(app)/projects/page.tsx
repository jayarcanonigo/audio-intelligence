
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Layers,
  Download,
  BookmarkCheck,
  Clock,
} from "lucide-react";
import { getProjects, getAdvertisements } from "@/services/api";

// ============================================================
// TIME HELPERS
// ============================================================

function timeToSeconds(time: string): number {
  if (!time) return 0;

  const parts = String(time).trim().split(":").map(Number);

  if (
    parts.length !== 3 ||
    parts.some((value) => !Number.isFinite(value))
  ) {
    return 0;
  }

  const [hours, minutes, seconds] = parts;

  return hours * 3600 + minutes * 60 + seconds;
}

function secondsToTime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(remainingSeconds).padStart(2, "0"),
  ].join(":");
}

function calculateDuration(start: string, end: string): number {
  const startSeconds = timeToSeconds(start);
  const endSeconds = timeToSeconds(end);

  if (!start || !end) return 0;

  if (endSeconds < startSeconds) {
    return 0;
  }

  return endSeconds - startSeconds;
}

function calculateEndTime(
  start: string,
  duration: number
): string {
  const startSeconds = timeToSeconds(start);

  if (!start || !Number.isFinite(duration)) {
    return "";
  }

  return secondsToTime(startSeconds + duration);
}

function cleanText(value: any): string {
  return String(value ?? "")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ============================================================
// GET BROADCAST HOUR
// ============================================================

function getHourFromTime(time: string): string | null {
  if (!time) return null;

  const match = String(time).trim().match(/^(\d{1,2}):/);

  if (!match) return null;

  const hour = Number(match[1]);

  if (!Number.isFinite(hour) || hour < 0 || hour > 23) {
    return null;
  }

  return `${String(hour).padStart(2, "0")}:00`;
}

// ============================================================
// PROJECT PAGE
// ============================================================

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [downloading, setDownloading] = useState<number | null>(
    null
  );

  // Saved ads grouped by project
  const [savedAdsByProject, setSavedAdsByProject] = useState<
    Record<number, any[]>
  >({});

  // Loading state for hourly data
  const [loadingAds, setLoadingAds] = useState<
    Record<number, boolean>
  >({});

  // ============================================================
  // LOAD PROJECTS
  // ============================================================

  async function loadProjects() {
    try {
      const data = await getProjects();

      setProjects(data);

      // Load saved advertisements for every project
      for (const project of data) {
        loadSavedAds(project.id);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // LOAD SAVED ADS
  // ============================================================

  async function loadSavedAds(projectId: number) {
    try {
      setLoadingAds((prev) => ({
        ...prev,
        [projectId]: true,
      }));

      const ads = await getAdvertisements(projectId);

      const savedAds = (ads || []).filter(
        (ad: any) =>
          ad.status === "SAVED" ||
          ad.is_saved === true ||
          ad.saved === true
      );

      setSavedAdsByProject((prev) => ({
        ...prev,
        [projectId]: savedAds,
      }));
    } catch (err) {
      console.error(
        `Failed to load advertisements for project ${projectId}:`,
        err
      );

      setSavedAdsByProject((prev) => ({
        ...prev,
        [projectId]: [],
      }));
    } finally {
      setLoadingAds((prev) => ({
        ...prev,
        [projectId]: false,
      }));
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  // ============================================================
  // GROUP SAVED ADS BY HOUR
  // ============================================================

  function getHourlyCounts(projectId: number) {
    const ads = savedAdsByProject[projectId] || [];

    const counts: Record<string, number> = {};

    ads.forEach((ad: any) => {
      const start =
        ad.start_time ??
        ad.start ??
        "";

      const hour = getHourFromTime(start);

      if (!hour) return;

      counts[hour] = (counts[hour] || 0) + 1;
    });

    return counts;
  }

  // ============================================================
  // DOWNLOAD SAVED ADS
  // ============================================================

  async function downloadSavedAds(project: any) {
    try {
      setDownloading(project.id);

      let savedAds = savedAdsByProject[project.id];

      // If ads haven't been loaded yet, load them now
      if (!savedAds) {
        const ads = await getAdvertisements(project.id);

        savedAds = (ads || []).filter(
          (ad: any) =>
            ad.status === "SAVED" ||
            ad.is_saved === true ||
            ad.saved === true
        );
      }

      if (!savedAds || savedAds.length === 0) {
        alert("No saved advertisements found.");
        return;
      }

      const headers = [
        "START",
        "END",
        "Duration",
        "AD NAME",
        "COMPLETE TEXT",
      ];

      // ========================================================
      // CSV ESCAPE
      // ========================================================

      function escapeCsv(value: any) {
        const text = String(value ?? "")
          .replace(/\r?\n/g, " ")
          .trim();

        return `"${text.replace(/"/g, '""')}"`;
      }

      // ========================================================
      // PREPARE ROWS
      // ========================================================

      const rows = savedAds.map((ad: any) => {
        const start = cleanText(
          ad.start_time ??
            ad.start ??
            ""
        );

        const existingEnd = cleanText(
          ad.end_time ??
            ad.end ??
            ""
        );

        // Calculate duration from START and END
        let duration = calculateDuration(
          start,
          existingEnd
        );

        // If END is missing/invalid, use stored duration
        if (duration <= 0) {
          const storedDuration = Number(
            ad.duration_seconds ??
              ad.duration ??
              0
          );

          if (
            Number.isFinite(storedDuration) &&
            storedDuration > 0
          ) {
            duration = Math.round(storedDuration);
          }
        }

        // Calculate END from START + duration
        const end = calculateEndTime(
          start,
          duration
        );

        // AD NAME = BRAND
        const adName = cleanText(
          ad.brand_name ??
            ad.brand ??
            ad.ad_name ??
            ""
        );

        // Complete advertisement text
        const completeText = cleanText(
          ad.text ??
            ad.complete_text ??
            ad.copyline ??
            ""
        );

        return [
          start,
          end,
          duration,
          adName,
          completeText,
        ];
      });

      // ========================================================
      // CREATE CSV
      // ========================================================

      const csv = [
        headers.map(escapeCsv).join(","),
        ...rows.map((row: any[]) =>
          row.map(escapeCsv).join(",")
        ),
      ].join("\r\n");

      const blob = new Blob(
        ["\ufeff" + csv],
        {
          type: "text/csv;charset=utf-8;",
        }
      );

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `${cleanText(
        project.name
      )
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}_saved_ads.csv`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        "Failed to download saved ads:",
        err
      );

      alert(
        "Failed to download saved advertisements."
      );
    } finally {
      setDownloading(null);
    }
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Projects
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create projects, upload audio and manage processing.
            </p>
          </div>

          <Link
            href="/projects/new"
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus size={16} />

            New Project
          </Link>
        </div>

        {/* ======================================================
            LOADING
        ====================================================== */}

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            Loading projects...
          </div>
        )}

        {/* ======================================================
            EMPTY
        ====================================================== */}

        {!loading && projects.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            No projects found.
          </div>
        )}

        {/* ======================================================
            PROJECT GRID
        ====================================================== */}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

          {projects.map((project) => {
            const hourlyCounts =
              getHourlyCounts(project.id);

            const savedAds =
              savedAdsByProject[project.id] || [];

            const isLoadingAds =
              loadingAds[project.id];

            // Only display hours that have saved ads
            const hours = Object.keys(
              hourlyCounts
            ).sort();

            return (
              <div
                key={project.id}
                className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >

                {/* ==================================================
                    PROJECT TITLE
                ================================================== */}

                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-slate-900">
                    {project.name}
                  </h3>

                  <span className="shrink-0 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    {project.status}
                  </span>
                </div>

                {/* ==================================================
                    STATISTICS
                ================================================== */}

                <div className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-100 py-4">

                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Layers size={13} />

                      Segments
                    </div>

                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {project.total_segments ?? 0}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <BookmarkCheck size={13} />

                      Saved Ads
                    </div>

                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {savedAds.length ||
                        project.saved_ads ||
                        0}
                    </p>
                  </div>

                </div>

                {/* ==================================================
                    SAVED ADS BY HOUR
                ================================================== */}

                <div className="mt-4">

                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Saved Ads by Hour
                    </p>

                    {!isLoadingAds && (
                      <span className="text-xs text-slate-400">
                        {savedAds.length} total
                      </span>
                    )}
                  </div>

                  {isLoadingAds ? (
                    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-4 text-center text-xs text-slate-400">
                      Loading hourly data...
                    </div>
                  ) : hours.length === 0 ? (
                    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-4 text-center text-xs text-slate-400">
                      No saved advertisements.
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-1.5">

                      {hours.map((hour) => (
                        <div
                          key={hour}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2.5 text-center transition hover:border-slate-300 hover:bg-white"
                        >
                          <div className="text-[11px] font-medium text-slate-500">
                            {hour}
                          </div>

                          <div className="mt-1 text-base font-bold text-slate-900">
                            {hourlyCounts[hour]}
                          </div>
                        </div>
                      ))}

                    </div>
                  )}

                </div>

                {/* ==================================================
                    UPLOAD TIME
                ================================================== */}

                <div className="mt-4 text-xs text-slate-500">

                  <div className="flex items-center gap-1.5 font-medium text-slate-600">
                    <Clock size={13} />

                    Upload Time
                  </div>

                  <p className="mt-1 text-slate-600">
                    {project.upload_times?.length
                      ? project.upload_times.join(", ")
                      : "None"}
                  </p>

                </div>

                {/* ==================================================
                    CREATED
                ================================================== */}

                <p className="mt-3 text-xs text-slate-400">
                  Created{" "}

                  {project.created_at
                    ? new Date(
                        project.created_at
                      ).toLocaleString()
                    : "—"}
                </p>

                {/* ==================================================
                    ACTION BUTTONS
                ================================================== */}

                <div className="mt-5 flex gap-2 pt-1">

                  <Link
                    href={`/projects/${project.id}?name=${encodeURIComponent(
                      project.name
                    )}`}
                    className="flex-1 rounded-lg bg-slate-900 py-2.5 text-center text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Open
                  </Link>

                  <Link
                    href={`/ad-editor/${project.id}?name=${encodeURIComponent(
                      project.name
                    )}`}
                    className="flex-1 rounded-lg border border-slate-300 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    Edit Ads
                  </Link>

                </div>

                {/* ==================================================
                    DOWNLOAD
                ================================================== */}

                <button
                  onClick={() =>
                    downloadSavedAds(project)
                  }
                  disabled={
                    downloading === project.id
                  }
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 py-2.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Download size={16} />

                  {downloading === project.id
                    ? "Preparing Excel..."
                    : "Download Excel"}
                </button>

              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}

