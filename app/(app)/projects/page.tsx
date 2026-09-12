
"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  BookmarkCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  Layers,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  deleteProjectHour,
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

function timeToSeconds(
  value?: string | null,
): number {
  if (!value) return 0;

  const parts = value
    .split(":")
    .map(Number);

  if (parts.length === 3) {
    return (
      parts[0] * 3600 +
      parts[1] * 60 +
      parts[2]
    );
  }

  if (parts.length === 2) {
    return (
      parts[0] * 60 +
      parts[1]
    );
  }

  return Number(value) || 0;
}

function secondsToTime(
  totalSeconds: number,
): string {
  const seconds = Math.max(
    0,
    Math.round(totalSeconds),
  );

  const hours = Math.floor(
    seconds / 3600,
  );

  const minutes = Math.floor(
    (seconds % 3600) / 60,
  );

  const remainingSeconds =
    seconds % 60;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(
      remainingSeconds,
    ).padStart(2, "0"),
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
    const parsedDuration =
      Number(duration);

    if (
      !Number.isNaN(
        parsedDuration,
      ) &&
      parsedDuration > 0
    ) {
      return Math.round(
        parsedDuration,
      );
    }
  }

  if (!start || !end) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(
      timeToSeconds(end) -
        timeToSeconds(start),
    ),
  );
}

function calculateEndTime(
  start?: string | null,
  duration?: number | string | null,
): string {
  if (!start) return "";

  return secondsToTime(
    timeToSeconds(start) +
      (Number(duration) || 0),
  );
}

function cleanText(
  value?: string | null,
): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

/* ============================================================
   DATE HELPERS
============================================================ */

function dateKey(date: Date): string {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateKey(
  value: string,
): Date {
  const [
    year,
    month,
    day,
  ] = value
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day,
  );
}

function isSameDate(
  first: Date,
  second: Date,
): boolean {
  return (
    dateKey(first) ===
    dateKey(second)
  );
}

function getCalendarDays(
  monthDate: Date,
): Date[] {
  const firstDayOfMonth =
    new Date(
      monthDate.getFullYear(),
      monthDate.getMonth(),
      1,
    );

  const firstDayIndex =
    firstDayOfMonth.getDay();

  const calendarStart =
    new Date(
      monthDate.getFullYear(),
      monthDate.getMonth(),
      1 - firstDayIndex,
    );

  return Array.from(
    { length: 42 },
    (_, index) => {
      const day =
        new Date(
          calendarStart,
        );

      day.setDate(
        calendarStart.getDate() +
          index,
      );

      return day;
    },
  );
}

/* ============================================================
   PROJECT HELPERS
============================================================ */

function getProjectName(
  project: Project,
): string {
  return (
    project.name ||
    project.project_name ||
    "Untitled Project"
  );
}

function getProjectDate(
  project: Project,
): Date | null {
  const value =
    project.created_at ||
    project.upload_time;

  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return date;
}

/* ============================================================
   AD HELPERS
============================================================ */

function isSavedAdvertisement(
  ad: SavedAdView,
): boolean {
  return (
    ad.status === "SAVED" ||
    ad.is_saved === true ||
    ad.saved === true
  );
}

function getSavedAdsForHour(
  advertisements: SavedAdView[],
  broadcastHour?:
    | number
    | null,
): SavedAdView[] {
  if (
    broadcastHour ===
      undefined ||
    broadcastHour === null
  ) {
    return [];
  }

  const expectedHour =
    String(
      Number(
        broadcastHour,
      ),
    ).padStart(2, "0");

  return advertisements.filter(
    (ad) => {
      const start =
        ad.start_time ||
        ad.start;

      if (!start) {
        return false;
      }

      const hour =
        start.split(":")[0];

      return (
        String(
          Number(hour),
        ).padStart(2, "0") ===
        expectedHour
      );
    },
  );
}

/* ============================================================
   UPLOAD HELPERS
============================================================ */

function formatBroadcastHour(
  hour?: number | null,
): string {
  if (
    hour === null ||
    hour === undefined
  ) {
    return "--:--";
  }

  return `${String(hour).padStart(
    2,
    "0",
  )}:00`;
}

/* ============================================================
   CSV DOWNLOAD
============================================================ */

async function createCsvDownload(
  projectName: string,
  advertisements: SavedAdView[],
  projectId: number,
  setDownloading: React.Dispatch<
    React.SetStateAction<
      string | number | null
    >
  >,
) {
  try {
    setDownloading(
      projectId,
    );

    const headers = [
      "START",
      "END",
      "Duration",
      "AD NAME",
      "COMPLETE TEXT",
    ];

    const rows =
      advertisements.map(
        (ad) => {
          const start =
            ad.start_time ||
            ad.start ||
            "";

          const duration =
            calculateDuration(
              start,
              ad.end_time ||
                ad.end,
              ad.duration ||
                ad.actual_length,
            );

          const end =
            ad.end_time ||
            ad.end ||
            calculateEndTime(
              start,
              duration,
            );

          const brand =
            ad.brand ||
            ad.brand_name ||
            "Unknown Advertisement";

          const completeText =
            cleanText(
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
        },
      );

    const csvRows = [
      headers,
      ...rows,
    ].map((row) =>
      row
        .map((value) => {
          const text =
            String(
              value ?? "",
            );

          return `"${text.replace(
            /"/g,
            '""',
          )}"`;
        })
        .join(","),
    );

    const blob =
      new Blob(
        [csvRows.join("\n")],
        {
          type: "text/csv;charset=utf-8;",
        },
      );

    const url =
      URL.createObjectURL(
        blob,
      );

    const link =
      document.createElement(
        "a",
      );

    link.href = url;

    link.download =
      `${projectName
        .replace(
          /[^a-z0-9]+/gi,
          "_",
        )
        .replace(
          /^_+|_+$/g,
          "",
        )}_saved_ads.csv`;

    document.body.appendChild(
      link,
    );

    link.click();

    document.body.removeChild(
      link,
    );

    URL.revokeObjectURL(
      url,
    );
  } finally {
    setDownloading(null);
  }
}

/* ============================================================
   PAGE
============================================================ */

export default function ProjectsPage() {
  const [
    projects,
    setProjects,
  ] = useState<Project[]>([]);

  const [
    savedAdsByProject,
    setSavedAdsByProject,
  ] = useState<
    Record<
      string,
      SavedAdView[]
    >
  >({});

  const [
    uploadStatusesByProject,
    setUploadStatusesByProject,
  ] = useState<
    Record<
      string,
      UploadStatus[]
    >
  >({});

  const [
    expandedUploadHistory,
    setExpandedUploadHistory,
  ] = useState<
    Record<string, boolean>
  >({});

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadingAds,
    setLoadingAds,
  ] = useState<
    Record<
      string,
      boolean
    >
  >({});

  const [
    loadingUploadStatuses,
    setLoadingUploadStatuses,
  ] = useState<
    Record<
      string,
      boolean
    >
  >({});

  const [
    downloading,
    setDownloading,
  ] = useState<
    string | number | null
  >(null);

  const [
    deletingHour,
    setDeletingHour,
  ] = useState<
    string | null
  >(null);

  const [
    calendarDate,
    setCalendarDate,
  ] = useState(
    new Date(),
  );

  const [
    selectedDate,
    setSelectedDate,
  ] = useState<
    string | null
  >(null);

  /* ============================================================
     LOAD PROJECTS
  ============================================================ */

  async function loadProjects() {
    try {
      setLoading(true);

      const response =
        await getProjects();

      const projectList =
        Array.isArray(response)
          ? response
          : response?.projects ||
            [];

      setProjects(
        projectList,
      );

      if (projectList.length > 0) {
        const sortedProjects = [
          ...projectList,
        ].sort(
          (first, second) => {
            const firstDate =
              getProjectDate(
                first,
              )?.getTime() || 0;

            const secondDate =
              getProjectDate(
                second,
              )?.getTime() || 0;

            return (
              secondDate -
              firstDate
            );
          },
        );

        const latestProject =
          sortedProjects[0];

        const latestDate =
          getProjectDate(
            latestProject,
          );

        if (latestDate) {
          setCalendarDate(
            latestDate,
          );

          setSelectedDate(
            dateKey(
              latestDate,
            ),
          );
        }
      }
    } catch (error) {
      console.error(
        "Failed to load projects:",
        error,
      );

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
     LOAD SAVED ADS ON DEMAND
  ============================================================ */

  async function loadSavedAds(
    projectId: number,
  ) {
    const projectKey =
      String(projectId);

    if (
      savedAdsByProject[
        projectKey
      ] !== undefined
    ) {
      return savedAdsByProject[
        projectKey
      ];
    }

    try {
      setLoadingAds(
        (previous) => ({
          ...previous,
          [projectKey]:
            true,
        }),
      );

      const advertisements =
        await getAdvertisements(
          projectId,
        );

      const savedAdvertisements =
        Array.isArray(
          advertisements,
        )
          ? advertisements.filter(
              isSavedAdvertisement,
            )
          : [];

      setSavedAdsByProject(
        (previous) => ({
          ...previous,
          [projectKey]:
            savedAdvertisements,
        }),
      );

      return savedAdvertisements;
    } catch (error) {
      console.error(
        `Failed to load advertisements for project ${projectId}:`,
        error,
      );

      setSavedAdsByProject(
        (previous) => ({
          ...previous,
          [projectKey]: [],
        }),
      );

      return [];
    } finally {
      setLoadingAds(
        (previous) => ({
          ...previous,
          [projectKey]:
            false,
        }),
      );
    }
  }

  /* ============================================================
     LOAD UPLOAD HISTORY ON DEMAND
  ============================================================ */

  async function loadUploadStatuses(
    projectId: number,
  ) {
    const projectKey =
      String(projectId);

    if (
      uploadStatusesByProject[
        projectKey
      ] !== undefined
    ) {
      return;
    }

    try {
      setLoadingUploadStatuses(
        (previous) => ({
          ...previous,
          [projectKey]:
            true,
        }),
      );

      const statuses =
        await getUploadStatuses(
          projectId,
        );

      const sortedStatuses =
        [
          ...(Array.isArray(
            statuses,
          )
            ? statuses
            : []),
        ].sort(
          (
            first,
            second,
          ) => {
            const firstHour =
              Number(
                first.broadcast_hour ??
                  999,
              );

            const secondHour =
              Number(
                second.broadcast_hour ??
                  999,
              );

            if (
              firstHour !==
              secondHour
            ) {
              return (
                firstHour -
                secondHour
              );
            }

            const firstTime =
              new Date(
                first.created_at ||
                  first.updated_at ||
                  0,
              ).getTime();

            const secondTime =
              new Date(
                second.created_at ||
                  second.updated_at ||
                  0,
              ).getTime();

            return (
              secondTime -
              firstTime
            );
          },
        );

      setUploadStatusesByProject(
        (previous) => ({
          ...previous,
          [projectKey]:
            sortedStatuses,
        }),
      );
    } catch (error) {
      console.error(
        `Failed to load upload history for project ${projectId}:`,
        error,
      );

      setUploadStatusesByProject(
        (previous) => ({
          ...previous,
          [projectKey]: [],
        }),
      );
    } finally {
      setLoadingUploadStatuses(
        (previous) => ({
          ...previous,
          [projectKey]:
            false,
        }),
      );
    }
  }

  /* ============================================================
     TOGGLE UPLOAD HISTORY
  ============================================================ */

  async function toggleUploadHistory(
    project: Project,
  ) {
    const projectKey =
      String(project.id);

    const currentlyExpanded =
      expandedUploadHistory[
        projectKey
      ] === true;

    const shouldOpen =
      !currentlyExpanded;

    setExpandedUploadHistory(
      (previous) => ({
        ...previous,
        [projectKey]:
          shouldOpen,
      }),
    );

    if (
      shouldOpen &&
      uploadStatusesByProject[
        projectKey
      ] === undefined
    ) {
      await loadUploadStatuses(
        project.id,
      );
    }
  }

  /* ============================================================
     FILTERED PROJECTS
  ============================================================ */

  const filteredProjects =
    useMemo(() => {
      if (!selectedDate) {
        return projects;
      }

      return projects.filter(
        (project) => {
          const projectDate =
            getProjectDate(
              project,
            );

          return (
            projectDate !==
              null &&
            dateKey(
              projectDate,
            ) ===
              selectedDate
          );
        },
      );
    }, [
      projects,
      selectedDate,
    ]);

  /* ============================================================
     CALENDAR
  ============================================================ */

  const calendarDays =
    useMemo(
      () =>
        getCalendarDays(
          calendarDate,
        ),
      [calendarDate],
    );

  function goToPreviousMonth() {
    setCalendarDate(
      (previous) =>
        new Date(
          previous.getFullYear(),
          previous.getMonth() -
            1,
          1,
        ),
    );
  }

  function goToNextMonth() {
    setCalendarDate(
      (previous) =>
        new Date(
          previous.getFullYear(),
          previous.getMonth() +
            1,
          1,
        ),
    );
  }

  function goToToday() {
    const today =
      new Date();

    setCalendarDate(
      today,
    );

    setSelectedDate(
      dateKey(today),
    );
  }

  function clearDateFilter() {
    setSelectedDate(
      null,
    );
  }

  function selectCalendarDate(
    date: Date,
  ) {
    setSelectedDate(
      dateKey(date),
    );
  }

  /* ============================================================
     DELETE HOUR
  ============================================================ */

  async function handleDeleteHour(
    project: Project,
    upload: UploadStatus,
  ) {
    const projectId =
      project.id;

    const projectName =
      getProjectName(
        project,
      );

    const hour = Number(
      upload.broadcast_hour,
    );

    if (
      !Number.isFinite(hour) ||
      hour < 0 ||
      hour > 23
    ) {
      window.alert(
        "Invalid broadcast hour.",
      );

      return;
    }

    const status =
      String(
        upload.status || "",
      ).toUpperCase();

    /*
     * PROCESSING and STARTING
     * cannot be deleted.
     *
     * CANCELLING CAN be deleted.
     */
    if (
      status ===
        "PROCESSING" ||
      status === "STARTING"
    ) {
      window.alert(
        "This hour cannot be deleted while the upload is still processing.",
      );

      return;
    }

    const projectKey =
      String(projectId);

    const savedAds =
      savedAdsByProject[
        projectKey
      ] || [];

    const savedAdsForHour =
      getSavedAdsForHour(
        savedAds,
        hour,
      );

    const confirmed =
      window.confirm(
        `Delete Hour ${formatBroadcastHour(
          hour,
        )}?\n\n` +
          `Project: ${projectName}\n` +
          `File: ${
            upload.filename ||
            "Unknown"
          }\n` +
          `Status: ${status}\n\n` +
          `Saved Ads: ${savedAdsForHour.length}\n\n` +
          `This will permanently delete the transcript segments, saved advertisements, and upload history for this broadcast hour.\n\n` +
          `This action cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    const deleteKey =
      `${projectId}-${hour}`;

    try {
      setDeletingHour(
        deleteKey,
      );

      /*
       * deleteProjectHour accepts:
       *   projectId
       *   hour
       *
       * Do not pass upload.id.
       */
      await deleteProjectHour(
        projectId,
        hour,
      );

      /*
       * Clear cached data for this
       * project so it will reload
       * when needed.
       */
      setSavedAdsByProject(
        (previous) => {
          const next = {
            ...previous,
          };

          delete next[
            projectKey
          ];

          return next;
        },
      );

      setUploadStatusesByProject(
        (previous) => {
          const next = {
            ...previous,
          };

          delete next[
            projectKey
          ];

          return next;
        },
      );

      /*
       * Reload lightweight project list.
       */
      await loadProjects();

      /*
       * If history is still open,
       * load it again.
       */
      if (
        expandedUploadHistory[
          projectKey
        ]
      ) {
        await loadUploadStatuses(
          projectId,
        );
      }

      window.alert(
        `Hour ${formatBroadcastHour(
          hour,
        )} was deleted successfully.`,
      );
    } catch (error) {
      console.error(
        "Failed to delete hour:",
        error,
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "Failed to delete this hour.",
      );
    } finally {
      setDeletingHour(
        null,
      );
    }
  }

  /* ============================================================
     DOWNLOAD SAVED ADS
  ============================================================ */

  async function downloadSavedAds(
    project: Project,
  ) {
    const projectId =
      project.id;

    const projectName =
      getProjectName(
        project,
      );

    try {
      const advertisements =
        await loadSavedAds(
          projectId,
        );

      if (
        !advertisements.length
      ) {
        window.alert(
          "There are no saved advertisements for this project.",
        );

        return;
      }

      await createCsvDownload(
        projectName,
        advertisements,
        projectId,
        setDownloading,
      );
    } catch (error) {
      console.error(
        "Failed to download saved advertisements:",
        error,
      );

      window.alert(
        "Failed to download saved advertisements.",
      );
    }
  }

  /* ============================================================
     DATE LABEL
  ============================================================ */

  const selectedDateLabel =
    selectedDate
      ? parseDateKey(
          selectedDate,
        ).toLocaleDateString(
          undefined,
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          },
        )
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
              Manage your uploaded audio
              projects and saved
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
                  Showing the most recently created project date.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={
                  goToToday
                }
                className={[
                  "rounded-lg border px-3 py-2 text-sm font-medium transition",
                  selectedDate ===
                    dateKey(
                      new Date(),
                    )
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                Today
              </button>

              {selectedDate && (
                <button
                  type="button"
                  onClick={
                    clearDateFilter
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <X size={15} />
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="p-4">

            {/* MONTH NAVIGATION */}

            <div className="mb-5 flex items-center justify-between">

              <button
                type="button"
                onClick={
                  goToPreviousMonth
                }
                className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
                aria-label="Previous month"
              >
                <ChevronLeft
                  size={20}
                />
              </button>

              <h3 className="text-lg font-semibold text-slate-900">
                {calendarDate.toLocaleDateString(
                  undefined,
                  {
                    month:
                      "long",
                    year:
                      "numeric",
                  },
                )}
              </h3>

              <button
                type="button"
                onClick={
                  goToNextMonth
                }
                className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
                aria-label="Next month"
              >
                <ChevronRight
                  size={20}
                />
              </button>
            </div>

            {/* WEEK DAYS */}

            <div className="grid grid-cols-7 border-b border-slate-200 pb-2">
              {[
                "Sun",
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
              ].map(
                (day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-semibold uppercase text-slate-400"
                  >
                    {day}
                  </div>
                ),
              )}
            </div>

            {/* CALENDAR */}

            <div className="mt-2 grid grid-cols-7 gap-1">
              {calendarDays.map(
                (day) => {
                  const dayKeyValue =
                    dateKey(day);

                  const isCurrentMonth =
                    day.getMonth() ===
                    calendarDate.getMonth();

                  const isSelected =
                    selectedDate ===
                    dayKeyValue;

                  const isToday =
                    isSameDate(
                      day,
                      new Date(),
                    );

                  const projectsForDay =
                    projects.filter(
                      (project) => {
                        const projectDate =
                          getProjectDate(
                            project,
                          );

                        return (
                          projectDate &&
                          dateKey(
                            projectDate,
                          ) ===
                            dayKeyValue
                        );
                      },
                    );

                  const hasProjects =
                    projectsForDay.length >
                    0;

                  return (
                    <button
                      type="button"
                      key={
                        dayKeyValue
                      }
                      onClick={() =>
                        selectCalendarDate(
                          day,
                        )
                      }
                      className={[
                        "relative min-h-[105px] overflow-hidden rounded-lg p-1.5 text-left transition sm:min-h-[120px]",
                        isCurrentMonth
                          ? "text-slate-700"
                          : "text-slate-300",
                        isSelected
                          ? "bg-slate-900 text-white"
                          : "hover:bg-slate-100",
                        isToday &&
                        !isSelected
                          ? "ring-2 ring-inset ring-slate-400"
                          : "",
                      ].join(
                        " ",
                      )}
                    >

                      {/* DATE */}

                      <div className="flex items-center justify-between">
                        <span
                          className={[
                            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                            isToday &&
                            !isSelected
                              ? "bg-slate-200 text-slate-900"
                              : "",
                            isSelected
                              ? "text-white"
                              : "",
                          ].join(
                            " ",
                          )}
                        >
                          {
                            day.getDate()
                          }
                        </span>

                        {hasProjects && (
                          <span
                            className={[
                              "mr-1 h-1.5 w-1.5 rounded-full",
                              isSelected
                                ? "bg-white"
                                : "bg-slate-700",
                            ].join(
                              " ",
                            )}
                          />
                        )}
                      </div>

                      {/* PROJECT NAMES */}

                      <div className="mt-1 space-y-1">
                        {projectsForDay
                          .slice(
                            0,
                            3,
                          )
                          .map(
                            (
                              project,
                            ) => {
                              const projectName =
                                getProjectName(
                                  project,
                                );

                              return (
                                <div
                                  key={
                                    project.id
                                  }
                                  title={
                                    projectName
                                  }
                                  className={[
                                    "flex min-w-0 items-center gap-1 rounded px-1.5 py-1 text-[9px] font-medium leading-tight",
                                    isSelected
                                      ? "bg-white/15 text-white"
                                      : "bg-slate-100 text-slate-700",
                                  ].join(
                                    " ",
                                  )}
                                >
                                  <span
                                    className={[
                                      "h-1.5 w-1.5 shrink-0 rounded-full",
                                      isSelected
                                        ? "bg-white"
                                        : "bg-slate-700",
                                    ].join(
                                      " ",
                                    )}
                                  />

                                  <span className="min-w-0 truncate">
                                    {
                                      projectName
                                    }
                                  </span>
                                </div>
                              );
                            },
                          )}

                        {projectsForDay.length >
                          3 && (
                          <div
                            className={[
                              "px-1.5 text-[9px] font-semibold",
                              isSelected
                                ? "text-white/70"
                                : "text-slate-400",
                            ].join(
                              " ",
                            )}
                          >
                            +
                            {projectsForDay.length -
                              3}{" "}
                            more
                          </div>
                        )}
                      </div>
                    </button>
                  );
                },
              )}
            </div>

            {/* FILTER SUMMARY */}

            <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span className="text-slate-600">
                {selectedDate ? (
                  <>
                    Showing{" "}
                    <strong className="text-slate-900">
                      {
                        selectedDateLabel
                      }
                    </strong>
                  </>
                ) : (
                  <>
                    Showing{" "}
                    <strong className="text-slate-900">
                      all projects
                    </strong>
                  </>
                )}
              </span>

              <span className="font-semibold text-slate-900">
                {
                  filteredProjects.length
                }
              </span>
            </div>
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
        ) : filteredProjects.length ===
          0 ? (

          /* EMPTY */

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
                onClick={
                  clearDateFilter
                }
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
             PROJECT GRID
          ==================================================== */

          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-900">
                  {
                    filteredProjects.length
                  }
                </span>{" "}
                project
                {filteredProjects.length !==
                1
                  ? "s"
                  : ""}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {filteredProjects.map(
                (project) => {
                  const projectId =
                    String(
                      project.id,
                    );

                  const projectName =
                    getProjectName(
                      project,
                    );

                  const savedAds =
                    savedAdsByProject[
                      projectId
                    ] || [];

                  const projectDate =
                    getProjectDate(
                      project,
                    );

                  const uploadHistory =
                    uploadStatusesByProject[
                      projectId
                    ] || [];

                  const isUploadHistoryExpanded =
                    expandedUploadHistory[
                      projectId
                    ] === true;

                  /*
                   * Show COMPLETED,
                   * PROCESSING and
                   * CANCELLING.
                   */
                  const visibleUploadHistory =
                    uploadHistory.filter(
                      (
                        upload,
                      ) => {
                        const status =
                          String(
                            upload.status ||
                              "",
                          ).toUpperCase();

                        return (
                          status ===
                            "COMPLETED" ||
                          status ===
                            "PROCESSING" ||
                          status ===
                            "CANCELLING"
                        );
                      },
                    );

                  return (
                    <div
                      key={
                        projectId
                      }
                      className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >

                      {/* PROJECT HEADER */}

                      <div className="border-b border-slate-200 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h2 className="break-words text-lg font-bold text-slate-900">
                              {
                                projectName
                              }
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                              Project ID:{" "}
                              {
                                project.id
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* COUNTS */}

                      <div className="grid grid-cols-2 gap-3 p-5">

                        <div className="rounded-xl bg-slate-50 p-3">
                          <div className="mb-1 flex items-center gap-2 text-slate-500">
                            <Layers
                              size={15}
                            />

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
                            <BookmarkCheck
                              size={15}
                            />

                            <span className="text-xs">
                              Saved Ads
                            </span>
                          </div>

                          <p className="text-xl font-bold text-slate-900">
                            {loadingAds[
                              projectId
                            ]
                              ? "..."
                              : savedAds.length}
                          </p>
                        </div>
                      </div>

                      {/* ==================================================
                          UPLOAD HISTORY
                      ================================================== */}

                      <div className="px-5 pb-5">
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">

                          <button
                            type="button"
                            onClick={() =>
                              toggleUploadHistory(
                                project,
                              )
                            }
                            className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50"
                            aria-expanded={
                              isUploadHistoryExpanded
                            }
                          >
                            <div className="flex items-center gap-2.5">

                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                                <Upload
                                  size={
                                    14
                                  }
                                  className="text-slate-600"
                                />
                              </div>

                              <div>
                                <p className="text-xs font-semibold text-slate-800">
                                  Upload History
                                </p>

                                <p className="text-[10px] text-slate-400">
                                  Uploads, segments and saved ads by hour
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">

                              {loadingUploadStatuses[
                                projectId
                              ] && (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
                              )}

                              <ChevronRight
                                size={
                                  16
                                }
                                className={[
                                  "text-slate-400 transition-transform duration-200",
                                  isUploadHistoryExpanded
                                    ? "rotate-90"
                                    : "",
                                ].join(
                                  " ",
                                )}
                              />
                            </div>
                          </button>

                          {isUploadHistoryExpanded && (
                            <div className="border-t border-slate-100">

                              {visibleUploadHistory.length ===
                              0 ? (

                                <div className="px-4 py-5 text-center">
                                  <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-50">
                                    <Upload
                                      size={
                                        14
                                      }
                                      className="text-slate-300"
                                    />
                                  </div>

                                  <p className="text-xs font-medium text-slate-500">
                                    No history
                                  </p>

                                  <p className="mt-0.5 text-[10px] text-slate-400">
                                    Completed, processing, or cancelling uploads will appear here.
                                  </p>
                                </div>

                              ) : (

                                <div className="divide-y divide-slate-100">

                                  {visibleUploadHistory.map(
                                    (
                                      upload,
                                      index,
                                    ) => {

                                      const status =
                                        String(
                                          upload.status ||
                                            "",
                                        ).toUpperCase();

                                      const isProcessing =
                                        status ===
                                        "PROCESSING";

                                      const isStarting =
                                        status ===
                                        "STARTING";

                                      const isCancelling =
                                        status ===
                                        "CANCELLING";

                                      const uploadKey =
                                        upload.id ??
                                        upload.session_id ??
                                        `${projectId}-${index}`;

                                      const hour =
                                        Number(
                                          upload.broadcast_hour,
                                        );

                                      const savedAdsForHour =
                                        getSavedAdsForHour(
                                          savedAds,
                                          hour,
                                        );

                                      const savedAdCount =
                                        savedAdsForHour.length;

                                      const viewUrl =
                                        `/ad-editor/${project.id}?name=${encodeURIComponent(
                                          projectName,
                                        )}&hour=${hour}`;

                                      const deleteKey =
                                        `${projectId}-${hour}`;

                                      const isDeleting =
                                        deletingHour ===
                                        deleteKey;

                                      /*
                                       * Only PROCESSING
                                       * and STARTING are
                                       * protected.
                                       *
                                       * CANCELLING can
                                       * be deleted.
                                       */
                                      const cannotDelete =
                                        isDeleting ||
                                        isProcessing ||
                                        isStarting;

                                      return (
                                        <div
                                          key={
                                            uploadKey
                                          }
                                          className="px-4 py-4"
                                        >

                                          <div className="flex flex-col gap-3">

                                            {/* TOP */}

                                            <div className="flex items-start gap-3">

                                              <div className="w-[68px] shrink-0">
                                                <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                  Hour
                                                </p>

                                                <p className="mt-1 text-sm font-bold tabular-nums text-slate-700">
                                                  {formatBroadcastHour(
                                                    upload.broadcast_hour,
                                                  )}
                                                </p>
                                              </div>

                                              <div className="mt-1 h-10 w-px shrink-0 bg-slate-200" />

                                              <div className="min-w-0 flex-1">
                                                <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                  Audio File
                                                </p>

                                                <p
                                                  className="mt-1 break-words text-sm font-semibold leading-5 text-slate-800"
                                                  title={
                                                    upload.filename ||
                                                    "Unknown file"
                                                  }
                                                >
                                                  {upload.filename ||
                                                    "Unknown file"}
                                                </p>

                                                <p className="mt-1 text-[10px] text-slate-400">
                                                  Broadcast Hour{" "}
                                                  {formatBroadcastHour(
                                                    upload.broadcast_hour,
                                                  )}
                                                </p>
                                              </div>

                                              <div className="shrink-0 pt-4">

                                                {isProcessing ? (
                                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10px] font-semibold text-amber-700">
                                                    <span className="relative flex h-1.5 w-1.5">
                                                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />

                                                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                    </span>

                                                    Processing
                                                  </span>
                                                ) : isCancelling ? (
                                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-[10px] font-semibold text-orange-700">
                                                    <span className="relative flex h-1.5 w-1.5">
                                                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />

                                                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-500" />
                                                    </span>

                                                    Cancelling
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-700">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                                                    Completed
                                                  </span>
                                                )}

                                              </div>
                                            </div>

                                            {/* CANCELLING MESSAGE */}

                                            {isCancelling &&
                                              upload.message && (
                                                <div className="rounded-lg border border-orange-100 bg-orange-50 px-3 py-2">
                                                  <p className="text-[10px] leading-4 text-orange-700">
                                                    {
                                                      upload.message
                                                    }
                                                  </p>
                                                </div>
                                              )}

                                            {/* ACTIONS */}

                                            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">

                                              <div
                                                className={[
                                                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-semibold",
                                                  savedAdCount >
                                                  0
                                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                    : "border-slate-200 bg-slate-100 text-slate-500",
                                                ].join(
                                                  " ",
                                                )}
                                              >
                                                <BookmarkCheck
                                                  size={
                                                    12
                                                  }
                                                />

                                                {savedAdCount >
                                                0
                                                  ? `${savedAdCount} Saved Ad${
                                                      savedAdCount ===
                                                      1
                                                        ? ""
                                                        : "s"
                                                    }`
                                                  : "No Saved Ads"}
                                              </div>

                                              <Link
                                                href={
                                                  viewUrl
                                                }
                                                className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-100"
                                              >
                                                <Eye
                                                  size={
                                                    13
                                                  }
                                                />

                                                View
                                              </Link>

                                              <button
                                                type="button"
                                                disabled={
                                                  cannotDelete
                                                }
                                                onClick={() =>
                                                  handleDeleteHour(
                                                    project,
                                                    upload,
                                                  )
                                                }
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                              >
                                                <Trash2
                                                  size={
                                                    13
                                                  }
                                                />

                                                {isDeleting
                                                  ? "Deleting..."
                                                  : "Delete Hour"}
                                              </button>

                                            </div>
                                          </div>
                                        </div>
                                      );
                                    },
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* PROJECT DETAILS */}

                      <div className="flex-1 px-5 pb-5">
                        <div className="space-y-2 text-xs text-slate-500">

                          {projectDate && (
                            <div className="flex items-center gap-2">
                              <CalendarDays
                                size={
                                  14
                                }
                              />

                              <span>
                                Created{" "}
                                {projectDate.toLocaleDateString(
                                  undefined,
                                  {
                                    year:
                                      "numeric",
                                    month:
                                      "short",
                                    day:
                                      "numeric",
                                  },
                                )}
                              </span>
                            </div>
                          )}

                          {project.upload_time && (
                            <div className="flex items-center gap-2">
                              <Clock
                                size={
                                  14
                                }
                              />

                              <span>
                                Uploaded{" "}
                                {
                                  project.upload_time
                                }
                              </span>
                            </div>
                          )}

                        </div>
                      </div>

                      {/* ACTIONS */}

                      <div className="grid grid-cols-2 gap-2 border-t border-slate-200 p-4">

                        <Link
                          href={`/projects/${project.id}`}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Open Project
                        </Link>

                        <Link
                          href={`/ad-editor/${project.id}?name=${encodeURIComponent(
                            projectName,
                          )}`}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Edit Ads
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            downloadSavedAds(
                              project,
                            )
                          }
                          disabled={
                            downloading ===
                            project.id
                          }
                          className="col-span-2 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Download
                            size={16}
                          />

                          {downloading ===
                          project.id
                            ? "Downloading..."
                            : "Download Saved Ads"}
                        </button>

                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
