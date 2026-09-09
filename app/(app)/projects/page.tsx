"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookmarkCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Layers,
  Plus,
  Upload,
  X,
} from "lucide-react";

import {
  getAdvertisements,
  getProjects,
  getUploadStatuses,
  type UploadStatus,
} from "@/services/api";

type Project = {
  id: number;
  name?: string;
  project_name?: string;
  status?: string;
  created_at?: string;
  upload_time?: string;
  total_segments?: number;
  segment_count?: number;
};

type SavedAdView = {
  id?: number | string;
  start_time?: string | null;
  end_time?: string | null;
  start?: string | null;
  end?: string | null;
  duration?: number | string | null;
  actual_length?: string | null;
  brand?: string | null;
  brand_name?: string | null;
  text?: string | null;
  complete_text?: string | null;
  copyline?: string | null;
  status?: string | null;
  is_saved?: boolean;
  saved?: boolean;
};

/* ============================================================
   TIME HELPERS
   ============================================================ */

function timeToSeconds(value?: string | null): number {
  if (!value) return 0;

  const parts = value.split(":").map(Number);

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  return Number(value) || 0;
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

function calculateDuration(
  start?: string | null,
  end?: string | null,
  duration?: number | string | null,
): number {
  if (
    duration !== undefined &&
    duration !== null &&
    duration !== ""
  ) {
    const parsedDuration = Number(duration);

    if (!Number.isNaN(parsedDuration) && parsedDuration > 0) {
      return Math.round(parsedDuration);
    }
  }

  if (!start || !end) {
    return 0;
  }

  const startSeconds = timeToSeconds(start);
  const endSeconds = timeToSeconds(end);

  return Math.max(0, Math.round(endSeconds - startSeconds));
}

function calculateEndTime(
  start?: string | null,
  duration?: number | string | null,
): string {
  if (!start) return "";

  const startSeconds = timeToSeconds(start);
  const durationSeconds = Number(duration) || 0;

  return secondsToTime(startSeconds + durationSeconds);
}

function cleanText(value?: string | null): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

/* ============================================================
   DATE HELPERS
   ============================================================ */

function getHourFromTime(value?: string | null): string {
  if (!value) return "";

  const hour = value.split(":")[0];

  if (!hour || Number.isNaN(Number(hour))) {
    return "";
  }

  return `${String(Number(hour)).padStart(2, "0")}:00`;
}

function dateKey(date: Date): string {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function isSameDate(first: Date, second: Date): boolean {
  return dateKey(first) === dateKey(second);
}

function getCalendarDays(monthDate: Date): Date[] {
  const firstDayOfMonth = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth(),
    1,
  );

  const firstDayIndex = firstDayOfMonth.getDay();

  const calendarStart = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth(),
    1 - firstDayIndex,
  );

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(calendarStart);

    day.setDate(calendarStart.getDate() + index);

    return day;
  });
}

/* ============================================================
   PROJECT HELPERS
   ============================================================ */

function getProjectName(project: Project): string {
  return project.name || project.project_name || "Untitled Project";
}

function getProjectDate(project: Project): Date | null {
  const value = project.created_at || project.upload_time;

  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/* ============================================================
   AD HELPERS
   ============================================================ */

function isSavedAdvertisement(ad: SavedAdView): boolean {
  return (
    ad.status === "SAVED" ||
    ad.is_saved === true ||
    ad.saved === true
  );
}

/* ============================================================
   UPLOAD HELPERS
   ============================================================ */

function getUploadStatusLabel(status?: string): string {
  switch (String(status || "").toUpperCase()) {
    case "STARTING":
      return "STARTING";

    case "PROCESSING":
      return "PROCESSING";

    case "CANCELLING":
      return "STOPPING";

    case "COMPLETED":
      return "COMPLETED";

    case "CANCELLED":
      return "CANCELLED";

    case "FAILED":
      return "FAILED";

    case "ERROR":
      return "ERROR";

    default:
      return status || "UNKNOWN";
  }
}

function formatBroadcastHour(hour?: number | null): string {
  if (hour === null || hour === undefined) {
    return "--:--";
  }

  return `${String(hour).padStart(2, "0")}:00`;
}

function getLatestUploadFromHistory(
  statuses: UploadStatus[],
): UploadStatus | undefined {
  if (!statuses.length) {
    return undefined;
  }

  return [...statuses].sort((first, second) => {
    const firstTime = new Date(
      first.created_at || first.updated_at || 0,
    ).getTime();

    const secondTime = new Date(
      second.created_at || second.updated_at || 0,
    ).getTime();

    return secondTime - firstTime;
  })[0];
}

/* ============================================================
   PAGE
   ============================================================ */

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  const [savedAdsByProject, setSavedAdsByProject] = useState<
    Record<string, SavedAdView[]>
  >({});

  const [uploadStatusesByProject, setUploadStatusesByProject] =
    useState<Record<string, UploadStatus[]>>({});

  /*
   * Upload History is HIDDEN by default.
   *
   * A project only becomes expanded when its value
   * is explicitly set to true.
   */
  const [expandedUploadHistory, setExpandedUploadHistory] =
    useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState(true);

  const [loadingAds, setLoadingAds] = useState<Record<string, boolean>>(
    {},
  );

  const [loadingUploadStatuses, setLoadingUploadStatuses] = useState<
    Record<string, boolean>
  >({});

  const [downloading, setDownloading] = useState<string | number | null>(
    null,
  );

  const [calendarDate, setCalendarDate] = useState(new Date());

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  /* ============================================================
     LOAD SAVED ADS
     ============================================================ */

  async function loadSavedAds(projectId: number) {
    const projectKey = String(projectId);

    try {
      setLoadingAds((previous) => ({
        ...previous,
        [projectKey]: true,
      }));

      const advertisements = await getAdvertisements(projectId);

      const savedAdvertisements = Array.isArray(advertisements)
        ? advertisements.filter(isSavedAdvertisement)
        : [];

      setSavedAdsByProject((previous) => ({
        ...previous,
        [projectKey]: savedAdvertisements,
      }));
    } catch (error) {
      console.error(
        `Failed to load advertisements for project ${projectId}:`,
        error,
      );

      setSavedAdsByProject((previous) => ({
        ...previous,
        [projectKey]: [],
      }));
    } finally {
      setLoadingAds((previous) => ({
        ...previous,
        [projectKey]: false,
      }));
    }
  }

  /* ============================================================
     LOAD UPLOAD HISTORY
     ============================================================ */

  async function loadUploadStatuses(projectId: number) {
    const projectKey = String(projectId);

    try {
      setLoadingUploadStatuses((previous) => ({
        ...previous,
        [projectKey]: true,
      }));

      const statuses = await getUploadStatuses(projectId);

      console.log(
        `UPLOAD HISTORY - PROJECT ${projectId}:`,
        statuses,
      );

      const sortedStatuses = [
        ...(Array.isArray(statuses) ? statuses : []),
      ].sort((first, second) => {
        const firstHour = Number(first.broadcast_hour ?? 999);

        const secondHour = Number(second.broadcast_hour ?? 999);

        if (firstHour !== secondHour) {
          return firstHour - secondHour;
        }

        const firstTime = new Date(
          first.created_at || first.updated_at || 0,
        ).getTime();

        const secondTime = new Date(
          second.created_at || second.updated_at || 0,
        ).getTime();

        return secondTime - firstTime;
      });

      setUploadStatusesByProject((previous) => ({
        ...previous,
        [projectKey]: sortedStatuses,
      }));
    } catch (error) {
      console.error(
        `Failed to load upload history for project ${projectId}:`,
        error,
      );

      setUploadStatusesByProject((previous) => ({
        ...previous,
        [projectKey]: [],
      }));
    } finally {
      setLoadingUploadStatuses((previous) => ({
        ...previous,
        [projectKey]: false,
      }));
    }
  }

  /* ============================================================
     LOAD PROJECTS
     ============================================================ */

  async function loadProjects() {
    try {
      setLoading(true);

      const response = await getProjects();

      const projectList = Array.isArray(response)
        ? response
        : response?.projects || [];

      setProjects(projectList);

      await Promise.all(
        projectList.flatMap((project: Project) => [
          loadSavedAds(project.id),
          loadUploadStatuses(project.id),
        ]),
      );
    } catch (error) {
      console.error("Failed to load projects:", error);

      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     INITIAL LOAD
     ============================================================ */

  useEffect(() => {
    loadProjects();
  }, []);

  /* ============================================================
     PROJECT DATES
     ============================================================ */

  const projectDates = useMemo(() => {
    const dates = new Set<string>();

    projects.forEach((project) => {
      const projectDate = getProjectDate(project);

      if (projectDate) {
        dates.add(dateKey(projectDate));
      }
    });

    return dates;
  }, [projects]);

  /* ============================================================
     FILTERED PROJECTS
     ============================================================ */

  const filteredProjects = useMemo(() => {
    if (!selectedDate) {
      return projects;
    }

    return projects.filter((project) => {
      const projectDate = getProjectDate(project);

      return projectDate
        ? dateKey(projectDate) === selectedDate
        : false;
    });
  }, [projects, selectedDate]);

  /* ============================================================
     CALENDAR
     ============================================================ */

  const calendarDays = useMemo(
    () => getCalendarDays(calendarDate),
    [calendarDate],
  );

  function goToPreviousMonth() {
    setCalendarDate(
      (previous) =>
        new Date(
          previous.getFullYear(),
          previous.getMonth() - 1,
          1,
        ),
    );
  }

  function goToNextMonth() {
    setCalendarDate(
      (previous) =>
        new Date(
          previous.getFullYear(),
          previous.getMonth() + 1,
          1,
        ),
    );
  }

  function goToToday() {
    const today = new Date();

    setCalendarDate(today);

    setSelectedDate(dateKey(today));
  }

  function clearDateFilter() {
    setSelectedDate(null);
  }

  function selectCalendarDate(date: Date) {
    setSelectedDate(dateKey(date));
  }

  /* ============================================================
     SAVED ADS BY HOUR
     ============================================================ */

  function getHourlyCounts(projectId: string | number) {
    const advertisements =
      savedAdsByProject[String(projectId)] || [];

    const counts: Record<string, number> = {};

    advertisements.forEach((ad) => {
      const startTime = ad.start_time || ad.start;

      const hour = getHourFromTime(startTime);

      if (!hour) return;

      counts[hour] = (counts[hour] || 0) + 1;
    });

    return Object.entries(counts).sort(([first], [second]) =>
      first.localeCompare(second),
    );
  }

  /* ============================================================
     DOWNLOAD SAVED ADS
     ============================================================ */

  async function downloadSavedAds(project: Project) {
    const projectId = project.id;

    const projectName = getProjectName(project);

    const advertisements =
      savedAdsByProject[String(projectId)] || [];

    if (!advertisements.length) {
      return;
    }

    try {
      setDownloading(projectId);

      const headers = [
        "START",
        "END",
        "Duration",
        "AD NAME",
        "COMPLETE TEXT",
      ];

      const rows = advertisements.map((ad) => {
        const start = ad.start_time || ad.start || "";

        const duration = calculateDuration(
          start,
          ad.end_time || ad.end,
          ad.duration || ad.actual_length,
        );

        const end =
          ad.end_time ||
          ad.end ||
          calculateEndTime(start, duration);

        const brand =
          ad.brand ||
          ad.brand_name ||
          "Unknown Advertisement";

        const completeText = cleanText(
          ad.text ||
            ad.complete_text ||
            ad.copyline ||
            "",
        );

        return [
          start,
          end,
          `${duration}s`,
          brand,
          completeText,
        ];
      });

      const csvRows = [headers, ...rows].map((row) =>
        row
          .map((value) => {
            const text = String(value ?? "");

            return `"${text.replace(/"/g, '""')}"`;
          })
          .join(","),
      );

      const csvContent = csvRows.join("\n");

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download =
        `${projectName
          .replace(/[^a-z0-9]+/gi, "_")
          .replace(/^_+|_+$/g, "")}_saved_ads.csv`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        "Failed to download saved advertisements:",
        error,
      );
    } finally {
      setDownloading(null);
    }
  }

  const selectedDateLabel = selectedDate
    ? parseDateKey(selectedDate).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">

        {/* ======================================================
            HEADER
            ====================================================== */}

        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Projects
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your uploaded audio projects and saved
              advertisements.
            </p>
          </div>

          <Link
            href="/projects/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            <Plus size={18} />
            New Project
          </Link>
        </div>

        {/* ======================================================
            CALENDAR
            ====================================================== */}

        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-2">
                <CalendarDays
                  size={20}
                  className="text-slate-700"
                />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Project Calendar
                </h2>

                <p className="text-xs text-slate-500">
                  Select a date to filter projects.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goToToday}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Today
              </button>

              {selectedDate && (
                <button
                  type="button"
                  onClick={clearDateFilter}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <X size={15} />
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="p-4">
            <div className="mb-5 flex items-center justify-between">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
                aria-label="Previous month"
              >
                <ChevronLeft size={20} />
              </button>

              <h3 className="text-lg font-semibold text-slate-900">
                {calendarDate.toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </h3>

              <button
                type="button"
                onClick={goToNextMonth}
                className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
                aria-label="Next month"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="grid grid-cols-7 border-b border-slate-200 pb-2">
              {[
                "Sun",
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
              ].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold uppercase text-slate-400"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const dayKey = dateKey(day);

                const isCurrentMonth =
                  day.getMonth() === calendarDate.getMonth();

                const isSelected =
                  selectedDate === dayKey;

                const isToday = isSameDate(
                  day,
                  new Date(),
                );

                const hasProjects =
                  projectDates.has(dayKey);

                return (
                  <button
                    type="button"
                    key={dayKey}
                    onClick={() =>
                      selectCalendarDate(day)
                    }
                    className={[
                      "relative flex min-h-16 flex-col items-center justify-start rounded-lg p-2 text-sm transition",
                      isCurrentMonth
                        ? "text-slate-700"
                        : "text-slate-300",
                      isSelected
                        ? "bg-slate-900 text-white"
                        : "hover:bg-slate-100",
                      isToday && !isSelected
                        ? "ring-2 ring-slate-400 ring-inset"
                        : "",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex h-7 w-7 items-center justify-center rounded-full font-medium",
                        isToday && !isSelected
                          ? "bg-slate-200"
                          : "",
                      ].join(" ")}
                    >
                      {day.getDate()}
                    </span>

                    {hasProjects && (
                      <span
                        className={[
                          "mt-1 h-1.5 w-1.5 rounded-full",
                          isSelected
                            ? "bg-white"
                            : "bg-slate-700",
                        ].join(" ")}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {selectedDate && (
              <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span className="text-slate-600">
                  Showing projects for{" "}
                  <strong className="text-slate-900">
                    {selectedDateLabel}
                  </strong>
                </span>

                <span className="font-semibold text-slate-900">
                  {filteredProjects.length}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================
            LOADING
            ====================================================== */}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

            <p className="text-sm text-slate-500">
              Loading projects...
            </p>
          </div>
        ) : filteredProjects.length === 0 ? (
          /* ====================================================
             EMPTY
             ==================================================== */

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Layers
              size={42}
              className="mx-auto mb-4 text-slate-300"
            />

            <h2 className="text-lg font-semibold text-slate-900">
              {selectedDate
                ? "No projects found for this date"
                : "No projects yet"}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {selectedDate
                ? "Try selecting another date or clear the date filter."
                : "Create your first project to get started."}
            </p>

            {selectedDate ? (
              <button
                type="button"
                onClick={clearDateFilter}
                className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <X size={16} />
                Clear Date Filter
              </button>
            ) : (
              <Link
                href="/projects/new"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                <Plus size={16} />
                Create Project
              </Link>
            )}
          </div>
        ) : (
          /* ====================================================
             PROJECT LIST
             ==================================================== */

          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-900">
                  {filteredProjects.length}
                </span>{" "}
                project
                {filteredProjects.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredProjects.map((project) => {
                const projectId = String(project.id);

                const projectName =
                  getProjectName(project);

                const savedAds =
                  savedAdsByProject[projectId] || [];

                const hourlyCounts =
                  getHourlyCounts(project.id);

                const projectDate =
                  getProjectDate(project);

                const uploadHistory =
                  uploadStatusesByProject[projectId] || [];

                const latestUpload =
                  getLatestUploadFromHistory(
                    uploadHistory,
                  );

                const processingUpload =
                  uploadHistory.find((upload) => {
                    const status = String(
                      upload.status || "",
                    ).toUpperCase();

                    return status === "PROCESSING";
                  });

                const latestStatus = String(
                  latestUpload?.status || "",
                ).toUpperCase();

                /*
                 * HIDDEN BY DEFAULT
                 *
                 * Only true means expanded.
                 */
                const isUploadHistoryExpanded =
                  expandedUploadHistory[projectId] === true;

                return (
                  <div
                    key={projectId}
                    className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {/* ==================================================
                        PROJECT HEADER
                        ================================================== */}

                    <div className="border-b border-slate-200 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-bold text-slate-900">
                            {projectName}
                          </h2>

                          <p className="mt-1 text-xs text-slate-500">
                            Project ID: {project.id}
                          </p>
                        </div>                        
                      </div>
                    </div>

                    {/* ==================================================
                        PROJECT COUNTS
                        ================================================== */}

                    <div className="grid grid-cols-2 gap-3 p-5">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="mb-1 flex items-center gap-2 text-slate-500">
                          <Layers size={15} />

                          <span className="text-xs">
                            Segments
                          </span>
                        </div>

                        <p className="text-xl font-bold text-slate-900">
                          {project.total_segments ??
                            project.segment_count ??
                            0}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="mb-1 flex items-center gap-2 text-slate-500">
                          <BookmarkCheck size={15} />

                          <span className="text-xs">
                            Saved Ads
                          </span>
                        </div>

                        <p className="text-xl font-bold text-slate-900">
                          {loadingAds[projectId]
                            ? "..."
                            : savedAds.length}
                        </p>
                      </div>
                    </div>

                    {/* ==================================================
                        UPLOAD HISTORY
                        HIDDEN BY DEFAULT
                        ================================================== */}

                    <div className="px-5 pb-5">
                      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        {/* HISTORY HEADER */}

                        <button
                          type="button"
                          onClick={() => {
                            setExpandedUploadHistory(
                              (previous) => ({
                                ...previous,
                                [projectId]:
                                  !isUploadHistoryExpanded,
                              }),
                            );
                          }}
                          className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50"
                          aria-expanded={
                            isUploadHistoryExpanded
                          }
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                              <Upload
                                size={14}
                                className="text-slate-600"
                              />
                            </div>

                            <div>
                              <p className="text-xs font-semibold text-slate-800">
                                Upload History
                              </p>

                              <p className="text-[10px] text-slate-400">
                                Completed and processing uploads
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {loadingUploadStatuses[projectId] && (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
                            )}

                            <ChevronRight
                              size={16}
                              className={[
                                "text-slate-400 transition-transform duration-200",
                                isUploadHistoryExpanded
                                  ? "rotate-90"
                                  : "",
                              ].join(" ")}
                            />
                          </div>
                        </button>

                        {/* ==================================================
                            HISTORY CONTENT
                            ONLY RENDER WHEN EXPANDED
                            ================================================== */}

                        {isUploadHistoryExpanded && (
                          <>
                            {(() => {
                              /*
                               * Only show COMPLETED and PROCESSING
                               */
                              const visibleUploads =
                                uploadHistory.filter(
                                  (upload) => {
                                    const status = String(
                                      upload.status || "",
                                    ).toUpperCase();

                                    return (
                                      status === "COMPLETED" ||
                                      status === "PROCESSING"
                                    );
                                  },
                                );

                              if (visibleUploads.length === 0) {
                                return (
                                  <div className="border-t border-slate-100 px-4 py-5 text-center">
                                    <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-50">
                                      <Upload
                                        size={14}
                                        className="text-slate-300"
                                      />
                                    </div>

                                    <p className="text-xs font-medium text-slate-500">
                                      No uploads
                                    </p>

                                    <p className="mt-0.5 text-[10px] text-slate-400">
                                      Completed or processing uploads
                                      will appear here.
                                    </p>
                                  </div>
                                );
                              }

                              return (
                                <div className="divide-y divide-slate-100 border-t border-slate-100">
                                  {visibleUploads.map(
                                    (upload, index) => {
                                      const status =
                                        String(
                                          upload.status || "",
                                        ).toUpperCase();

                                      const isProcessing =
                                        status === "PROCESSING";

                                      const uploadKey =
                                        upload.id ??
                                        upload.session_id ??
                                        `${projectId}-${index}`;

                                      return (
                                        <div
                                          key={uploadKey}
                                          className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
                                        >
                                          {/* HOUR */}

                                          <div className="w-[62px] shrink-0">
                                            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                              Hour
                                            </p>

                                            <p className="mt-0.5 text-xs font-bold tabular-nums text-slate-700">
                                              {formatBroadcastHour(
                                                upload.broadcast_hour,
                                              )}
                                            </p>
                                          </div>

                                          {/* DIVIDER */}

                                          <div className="h-8 w-px shrink-0 bg-slate-200" />

                                          {/* FILE NAME */}

                                          <div className="min-w-0 flex-1">
                                            <p
                                              className="truncate text-xs font-semibold text-slate-800"
                                              title={
                                                upload.filename
                                              }
                                            >
                                              {upload.filename}
                                            </p>

                                            <p className="mt-0.5 text-[10px] text-slate-400">
                                              Audio file
                                            </p>
                                          </div>

                                          {/* STATUS */}

                                          <div className="shrink-0">
                                            {isProcessing ? (
                                              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                                                <span className="relative flex h-1.5 w-1.5">
                                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />

                                                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                </span>

                                                Processing
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                                                Completed
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    },
                                  )}
                                </div>
                              );
                            })()}
                          </>
                        )}
                      </div>
                    </div>

                    {/* ==================================================
                        SAVED ADS BY HOUR
                        ================================================== */}

                    <div className="flex-1 px-5 pb-5">
                      {hourlyCounts.length > 0 && (
                        <div className="mb-4">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Saved Ads by Hour
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {hourlyCounts.map(
                              ([hour, count]) => (
                                <span
                                  key={hour}
                                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                                >
                                  {hour} · {count}
                                </span>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 text-xs text-slate-500">
                        {projectDate && (
                          <div className="flex items-center gap-2">
                            <CalendarDays size={14} />

                            <span>
                              Created{" "}
                              {projectDate.toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </span>
                          </div>
                        )}

                        {project.upload_time && (
                          <div className="flex items-center gap-2">
                            <Clock size={14} />

                            <span>
                              Uploaded{" "}
                              {project.upload_time}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ==================================================
                        ACTIONS
                        ================================================== */}

                    <div className="grid grid-cols-2 gap-2 border-t border-slate-200 p-4">
                      <Link
                        href={`/projects/${project.id}`}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Open Project
                      </Link>

                      <Link
                        href={`/projects/${project.id}/ads`}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Edit Ads
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          downloadSavedAds(project)
                        }
                        disabled={
                          downloading === project.id ||
                          savedAds.length === 0
                        }
                        className="col-span-2 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Download size={16} />

                        {downloading === project.id
                          ? "Downloading..."
                          : "Download Saved Ads"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}