"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
  useSearchParams,
} from "next/navigation";

import {
  Plus,
  Trash2,
  Radio,
  FileAudio,
  Layers,
  Copy,
  Check,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  XCircle,
} from "lucide-react";

import UploadPanel from "@/components/upload/UploadPanel";

import {
  getUploadStatuses,
  cancelUpload,
  deleteUploadHistory,
  type UploadStatus,
} from "@/services/api";

const MAX_UPLOAD_PANELS = 3;

/*
 * These statuses count toward the maximum
 * of 3 active uploads.
 */
const ACTIVE_UPLOAD_STATUSES = [
  "STARTING",
  "PROCESSING",
  "CANCELLING",
];

/*
 * These statuses make the broadcast hour unavailable.
 *
 * COMPLETED = hour remains used
 * CANCELLED = hour becomes available
 * FAILED    = hour becomes available
 */
const BLOCKED_HOUR_STATUSES = [
  "STARTING",
  "PROCESSING",
  "CANCELLING",
  "COMPLETED",
];

export default function ProjectPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const projectId = Number(params.id);

  const projectName =
    searchParams.get("name") ||
    `Project #${projectId}`;

  // ============================================================
  // UPLOAD PANELS
  // ============================================================

  const [uploadPanels, setUploadPanels] =
    useState<number[]>([
      Date.now(),
    ]);

  // ============================================================
  // COPY STATE
  // ============================================================

  const [copied, setCopied] =
    useState(false);

  // ============================================================
  // UPLOAD HISTORY
  // ============================================================

  const [uploadStatuses, setUploadStatuses] =
    useState<UploadStatus[]>([]);

  const [loadingUploadStatuses, setLoadingUploadStatuses] =
    useState(true);

  // ============================================================
  // CANCEL / DELETE STATES
  // ============================================================

  const [cancellingUploadId, setCancellingUploadId] =
    useState<number | null>(null);

  const [deletingUploadId, setDeletingUploadId] =
    useState<number | null>(null);

  // ============================================================
  // LOAD UPLOAD HISTORY
  //
  // SORT:
  //
  // 01:00
  // 02:00
  // 03:00
  // ...
  // 24:00
  //
  // IMPORTANT:
  // We sort by broadcast_hour, NOT created_at.
  // ============================================================

  const loadUploadStatuses =
    useCallback(
      async (
        showLoading = false,
      ) => {
        if (
          !projectId ||
          Number.isNaN(projectId)
        ) {
          return;
        }

        try {
          if (showLoading) {
            setLoadingUploadStatuses(
              true,
            );
          }

          const statuses =
            await getUploadStatuses(
              projectId,
            );

          const sortedStatuses =
            [...statuses].sort(
              (first, second) => {
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

                /*
                 * PRIMARY SORT:
                 * Broadcast hour ascending.
                 *
                 * 1 -> 2 -> 3 -> ... -> 24
                 */
                if (
                  firstHour !==
                  secondHour
                ) {
                  return (
                    firstHour -
                    secondHour
                  );
                }

                /*
                 * If two uploads have the
                 * same broadcast hour,
                 * newest upload is shown first.
                 */
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

          setUploadStatuses(
            sortedStatuses,
          );
        } catch (error) {
          console.error(
            "Failed to load upload statuses:",
            error,
          );
        } finally {
          if (showLoading) {
            setLoadingUploadStatuses(
              false,
            );
          }
        }
      },
      [projectId],
    );

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadUploadStatuses(true);
  }, [
    loadUploadStatuses,
  ]);

  // ============================================================
  // ACTIVE UPLOAD COUNT
  //
  // ONLY THESE COUNT:
  //
  // STARTING
  // PROCESSING
  // CANCELLING
  //
  // COMPLETED/CANCELLED/FAILED DO NOT COUNT.
  // ============================================================

  const activeUploadCount =
    useMemo(() => {
      return uploadStatuses.filter(
        (upload) => {
          const status =
            String(
              upload.status || "",
            ).toUpperCase();

          return ACTIVE_UPLOAD_STATUSES.includes(
            status,
          );
        },
      ).length;
    }, [
      uploadStatuses,
    ]);

  // ============================================================
  // AVAILABLE / BLOCKED HOURS
  //
  // BLOCKED:
  // STARTING
  // PROCESSING
  // CANCELLING
  // COMPLETED
  //
  // AVAILABLE AGAIN:
  // CANCELLED
  // FAILED
  // ============================================================

  const unavailableHours =
    useMemo(() => {
      const hours =
        new Set<string>();

      uploadStatuses.forEach(
        (upload) => {
          const status =
            String(
              upload.status || "",
            ).toUpperCase();

          if (
            !BLOCKED_HOUR_STATUSES.includes(
              status,
            )
          ) {
            return;
          }

          if (
            upload.broadcast_hour ===
              null ||
            upload.broadcast_hour ===
              undefined
          ) {
            return;
          }

          const hour =
            String(
              Number(
                upload.broadcast_hour,
              ),
            ).padStart(
              2,
              "0",
            );

          hours.add(hour);
        },
      );

      return Array.from(hours);
    }, [
      uploadStatuses,
    ]);

  // ============================================================
  // CAN ADD UPLOAD
  // ============================================================

  const canAddUpload =
    activeUploadCount <
    MAX_UPLOAD_PANELS;

  // ============================================================
  // AUTO REFRESH ACTIVE UPLOADS
  // ============================================================

  useEffect(() => {
    if (
      activeUploadCount <= 0
    ) {
      return;
    }

    const interval =
      window.setInterval(
        () => {
          loadUploadStatuses(
            false,
          );
        },
        3000,
      );

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [
    activeUploadCount,
    loadUploadStatuses,
  ]);

  // ============================================================
  // ADD UPLOAD PANEL
  // ============================================================

  const addUploadPanel = () => {
    if (
      activeUploadCount >=
      MAX_UPLOAD_PANELS
    ) {
      return;
    }

    setUploadPanels(
      (prev) => {
        if (
          prev.length >=
          MAX_UPLOAD_PANELS
        ) {
          return prev;
        }

        return [
          ...prev,
          Date.now() +
            Math.random(),
        ];
      },
    );
  };

  // ============================================================
  // REMOVE UPLOAD PANEL
  // ============================================================

  const removeUploadPanel =
    (id: number) => {
      setUploadPanels(
        (prev) =>
          prev.filter(
            (panelId) =>
              panelId !== id,
          ),
      );
    };

  // ============================================================
  // COPY PROJECT TITLE
  // ============================================================

  const copyProjectTitle =
    async () => {
      try {
        if (
          navigator.clipboard
        ) {
          await navigator.clipboard.writeText(
            projectName,
          );
        } else {
          const textarea =
            document.createElement(
              "textarea",
            );

          textarea.value =
            projectName;

          textarea.style.position =
            "fixed";

          textarea.style.left =
            "-9999px";

          textarea.style.top =
            "0";

          document.body.appendChild(
            textarea,
          );

          textarea.focus();
          textarea.select();

          document.execCommand(
            "copy",
          );

          document.body.removeChild(
            textarea,
          );
        }

        setCopied(true);

        window.setTimeout(
          () => {
            setCopied(false);
          },
          1500,
        );
      } catch (error) {
        console.error(
          "Failed to copy project title:",
          error,
        );

        alert(
          "Failed to copy project title.",
        );
      }
    };

  // ============================================================
  // UPLOAD START
  // ============================================================

  const handleUploadStart =
    () => {
      loadUploadStatuses(
        false,
      );
    };

  // ============================================================
  // UPLOAD COMPLETE
  //
  // COMPLETED:
  //   hour remains unavailable
  //
  // CANCELLED:
  //   hour becomes available
  //
  // FAILED:
  //   hour becomes available
  // ============================================================

  const handleUploadComplete =
    () => {
      loadUploadStatuses(
        false,
      );
    };

  // ============================================================
  // CANCEL UPLOAD
  // ============================================================

  const handleCancelUpload =
    async (
      upload: UploadStatus,
    ) => {
      const status =
        String(
          upload.status || "",
        ).toUpperCase();

      if (
        status !==
          "PROCESSING" &&
        status !==
          "STARTING"
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `Cancel upload for "${upload.filename}"?\n\n` +
            `Broadcast Hour: ${formatBroadcastHour(
              upload.broadcast_hour,
            )}\n\n` +
            `The transcription process will be stopped.`,
        );

      if (!confirmed) {
        return;
      }

      try {
        setCancellingUploadId(
          upload.id,
        );

        await cancelUpload(
          upload.id,
        );

        /*
         * Keep it CANCELLING until
         * backend confirms CANCELLED.
         */
        setUploadStatuses(
          (prev) =>
            prev.map(
              (item) =>
                item.id ===
                upload.id
                  ? {
                      ...item,
                      status:
                        "CANCELLING",
                      message:
                        "Cancellation requested. Stopping upload processing...",
                    }
                  : item,
            ),
        );

        await loadUploadStatuses(
          false,
        );
      } catch (error) {
        console.error(
          "Failed to cancel upload:",
          error,
        );

        alert(
          error instanceof Error
            ? error.message
            : "Failed to cancel upload.",
        );

        await loadUploadStatuses(
          false,
        );
      } finally {
        setCancellingUploadId(
          null,
        );
      }
    };

  // ============================================================
  // DELETE HISTORY
  // ============================================================

  const handleDeleteUploadHistory =
    async (
      upload: UploadStatus,
    ) => {
      const status =
        String(
          upload.status || "",
        ).toUpperCase();

      if (
        status ===
          "PROCESSING" ||
        status ===
          "STARTING" ||
        status ===
          "CANCELLING"
      ) {
        alert(
          "This upload is still processing. Cancel it first.",
        );

        return;
      }

      const confirmed =
        window.confirm(
          `Delete upload history for "${upload.filename}"?\n\n` +
            `This removes the upload status record from history.`,
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingUploadId(
          upload.id,
        );

        await deleteUploadHistory(
          upload.id,
        );

        setUploadStatuses(
          (prev) =>
            prev.filter(
              (item) =>
                item.id !==
                upload.id,
            ),
        );
      } catch (error) {
        console.error(
          "Failed to delete upload history:",
          error,
        );

        alert(
          error instanceof Error
            ? error.message
            : "Failed to delete upload history.",
        );

        await loadUploadStatuses(
          false,
        );
      } finally {
        setDeletingUploadId(
          null,
        );
      }
    };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (
    value?: string,
  ) => {
    if (!value) {
      return "";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return value;
    }

    return date.toLocaleString(
      undefined,
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  };

  // ============================================================
  // FORMAT BROADCAST HOUR
  // ============================================================

  const formatBroadcastHour =
    (
      hour?: number | null,
    ) => {
      if (
        hour === null ||
        hour === undefined
      ) {
        return "Unknown";
      }

      return `${String(
        hour,
      ).padStart(
        2,
        "0",
      )}:00`;
    };

  // ============================================================
  // STATUS LABEL
  // ============================================================

  const getStatusLabel = (
    status?: string,
  ) => {
    switch (
      String(
        status || "",
      ).toUpperCase()
    ) {
      case "PROCESSING":
        return "PROCESSING";

      case "STARTING":
        return "STARTING";

      case "CANCELLING":
        return "CANCELLING";

      case "COMPLETED":
        return "COMPLETED";

      case "FAILED":
        return "FAILED";

      case "CANCELLED":
        return "CANCELLED";

      default:
        return (
          status ||
          "UNKNOWN"
        );
    }
  };

  // ============================================================
  // STATUS CLASS
  // ============================================================

  const getStatusClass = (
    status?: string,
  ) => {
    switch (
      String(
        status || "",
      ).toUpperCase()
    ) {
      case "PROCESSING":
      case "STARTING":
        return (
          "bg-amber-50 text-amber-700 " +
          "border-amber-200"
        );

      case "CANCELLING":
        return (
          "bg-orange-50 text-orange-700 " +
          "border-orange-200"
        );

      case "COMPLETED":
        return (
          "bg-emerald-50 text-emerald-700 " +
          "border-emerald-200"
        );

      case "FAILED":
        return (
          "bg-red-50 text-red-700 " +
          "border-red-200"
        );

      case "CANCELLED":
        return (
          "bg-slate-100 text-slate-600 " +
          "border-slate-200"
        );

      default:
        return (
          "bg-slate-50 text-slate-600 " +
          "border-slate-200"
        );
    }
  };

  // ============================================================
  // STATUS ICON
  // ============================================================

  const getStatusIcon = (
    status?: string,
  ) => {
    switch (
      String(
        status || "",
      ).toUpperCase()
    ) {
      case "PROCESSING":
      case "STARTING":
        return (
          <Loader2
            size={17}
            className="shrink-0 animate-spin text-amber-600"
          />
        );

      case "CANCELLING":
        return (
          <Loader2
            size={17}
            className="shrink-0 animate-spin text-orange-600"
          />
        );

      case "COMPLETED":
        return (
          <CheckCircle2
            size={17}
            className="shrink-0 text-emerald-600"
          />
        );

      case "FAILED":
        return (
          <AlertCircle
            size={17}
            className="shrink-0 text-red-600"
          />
        );

      case "CANCELLED":
        return (
          <XCircle
            size={17}
            className="shrink-0 text-slate-500"
          />
        );

      default:
        return (
          <Upload
            size={17}
            className="shrink-0 text-slate-500"
          />
        );
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-5xl p-6">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Audio Intelligence
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">

            <h1 className="min-w-0 flex-1 break-words text-3xl font-semibold tracking-tight text-slate-900">
              {projectName}
            </h1>

            <button
              type="button"
              onClick={
                copyProjectTitle
              }
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                copied
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white hover:text-slate-900"
              }`}
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

          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-slate-600">
            Upload one or more audio
            files to begin
            transcription,
            advertisement detection,
            and brand identification.
            Each upload is processed
            independently and can be
            monitored separately.
          </p>

        </div>

        {/* ======================================================
            ACTIVE UPLOAD COUNT
        ====================================================== */}

        <div className="mb-5 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-5 py-3 shadow-sm">

          <div className="flex items-center gap-2">

            <Upload
              size={17}
              className="text-slate-500"
            />

            <span className="text-sm font-medium text-slate-700">
              Active Uploads
            </span>

          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              activeUploadCount >=
              MAX_UPLOAD_PANELS
                ? "bg-red-50 text-red-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {activeUploadCount} /{" "}
            {MAX_UPLOAD_PANELS}
          </span>

        </div>

        {/* ======================================================
            UPLOAD PANELS
        ====================================================== */}

        <div className="space-y-5">

          {uploadPanels.map(
            (
              panelId,
              index,
            ) => (
              <div
                key={panelId}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >

                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/60 px-6 py-4">

                  <div>

                    <h2 className="text-sm font-semibold text-slate-800">
                      Upload{" "}
                      {index + 1}
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Select an audio
                      file to start
                      processing.
                    </p>

                  </div>

                  {uploadPanels.length >
                    1 && (
                    <button
                      type="button"
                      onClick={() =>
                        removeUploadPanel(
                          panelId,
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2
                        size={14}
                      />
                      Remove
                    </button>
                  )}

                </div>

                <div className="p-6">

                  <UploadPanel
                    projectId={
                      projectId
                    }
                    onComplete={
                      handleUploadComplete
                    }
                    onUploadStart={
                      handleUploadStart
                    }
                    unavailableHours={
                      unavailableHours
                    }
                  />

                </div>

              </div>
            ),
          )}

          {/* ====================================================
              ADD ANOTHER UPLOAD
          ==================================================== */}

          {uploadPanels.length <
            MAX_UPLOAD_PANELS && (
            <div className="flex flex-col items-center justify-center pb-8 pt-1">

              <button
                type="button"
                onClick={
                  addUploadPanel
                }
                disabled={
                  !canAddUpload
                }
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
              >

                <Plus
                  size={16}
                />

                Add Another Upload

              </button>

              <p className="mt-2 text-xs text-slate-400">

                Active uploads:{" "}

                <span className="font-semibold text-slate-600">
                  {
                    activeUploadCount
                  }
                </span>

                {" / "}

                {
                  MAX_UPLOAD_PANELS
                }

              </p>

              {!canAddUpload && (
                <p className="mt-1 text-xs text-red-500">
                  Maximum of{" "}
                  {
                    MAX_UPLOAD_PANELS
                  }{" "}
                  uploads are currently
                  processing.
                </p>
              )}

            </div>
          )}

        </div>

        {/* ======================================================
            UPLOAD HISTORY
            SORTED BY BROADCAST HOUR ASCENDING
        ====================================================== */}

        <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/60 px-6 py-4">

            <div className="flex items-center gap-3">

              <div className="rounded-lg bg-slate-100 p-2">

                <Upload
                  size={18}
                  className="text-slate-700"
                />

              </div>

              <div>

                <h2 className="text-sm font-semibold text-slate-800">
                  Upload History
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Sorted by Broadcast
                  Hour: 01:00 → 24:00
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                loadUploadStatuses(
                  true,
                )
              }
              disabled={
                loadingUploadStatuses
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingUploadStatuses
                ? "Refreshing..."
                : "Refresh"}
            </button>

          </div>

          <div className="p-6">

            {loadingUploadStatuses ? (
              <div className="py-10 text-center">

                <Loader2
                  size={28}
                  className="mx-auto mb-3 animate-spin text-slate-400"
                />

                <p className="text-sm text-slate-500">
                  Loading upload
                  history...
                </p>

              </div>
            ) : uploadStatuses.length ===
              0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">

                <Upload
                  size={32}
                  className="mx-auto mb-3 text-slate-300"
                />

                <p className="text-sm font-medium text-slate-600">
                  No upload history
                  yet.
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Upload an audio file
                  above to see its
                  processing status
                  here.
                </p>

              </div>
            ) : (
              <div className="space-y-4">

                {uploadStatuses.map(
                  (
                    upload,
                  ) => {
                    const status =
                      String(
                        upload.status ||
                          "",
                      ).toUpperCase();

                    const progress =
                      Math.max(
                        0,
                        Math.min(
                          100,
                          Number(
                            upload.progress ||
                              0,
                          ),
                        ),
                      );

                    const isProcessing =
                      status ===
                        "PROCESSING" ||
                      status ===
                        "STARTING";

                    const isCancelling =
                      status ===
                      "CANCELLING";

                    const isActive =
                      isProcessing ||
                      isCancelling;

                    const isCancellingThis =
                      cancellingUploadId ===
                      upload.id;

                    const isDeletingThis =
                      deletingUploadId ===
                      upload.id;

                    return (
                      <div
                        key={
                          upload.id
                        }
                        className="rounded-xl border border-slate-200 bg-white p-4"
                      >

                        {/* ======================================
                            TOP ROW
                        ====================================== */}

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                          <div className="min-w-0 flex-1">

                            <div className="flex items-center gap-2">

                              {getStatusIcon(
                                upload.status,
                              )}

                              <h3
                                className="truncate text-sm font-semibold text-slate-800"
                                title={
                                  upload.filename
                                }
                              >
                                {
                                  upload.filename
                                }
                              </h3>

                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">

                              <span>
                                Broadcast
                                Hour:{" "}
                                <strong className="font-bold text-slate-800">
                                  {formatBroadcastHour(
                                    upload.broadcast_hour,
                                  )}
                                </strong>
                              </span>

                              <span>
                                Uploaded:{" "}
                                {formatDate(
                                  upload.created_at,
                                )}
                              </span>

                            </div>

                          </div>

                          <span
                            className={[
                              "inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-bold",
                              getStatusClass(
                                upload.status,
                              ),
                            ].join(
                              " ",
                            )}
                          >
                            {getStatusLabel(
                              upload.status,
                            )}
                          </span>

                        </div>

                        {/* ======================================
                            PROGRESS
                        ====================================== */}

                        {isProcessing && (
                          <div className="mt-4">

                            <div className="mb-2 flex items-center justify-between">

                              <span className="text-xs font-medium text-slate-500">
                                Processing
                                Progress
                              </span>

                              <span className="text-xs font-bold text-slate-800">
                                {
                                  progress
                                }
                                %
                              </span>

                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-slate-200">

                              <div
                                className="h-full rounded-full bg-slate-800 transition-all duration-500"
                                style={{
                                  width: `${progress}%`,
                                }}
                              />

                            </div>

                          </div>
                        )}

                        {/* ======================================
                            CANCELLING
                        ====================================== */}

                        {isCancelling && (
                          <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 px-3 py-3">

                            <div className="flex items-center gap-2">

                              <Loader2
                                size={15}
                                className="animate-spin text-orange-600"
                              />

                              <p className="text-xs font-medium text-orange-700">
                                Stopping
                                upload
                                processing...
                              </p>

                            </div>

                            <p className="mt-1 text-[11px] text-orange-600">
                              The background
                              process is
                              stopping.
                            </p>

                          </div>
                        )}

                        {/* ======================================
                            DETAILS
                        ====================================== */}

                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">

                          <div className="rounded-lg bg-slate-50 p-3">

                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Progress
                            </p>

                            <p className="mt-1 text-sm font-bold text-slate-800">
                              {
                                progress
                              }
                              %
                            </p>

                          </div>

                          <div className="rounded-lg bg-slate-50 p-3">

                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Chunks
                            </p>

                            <p className="mt-1 text-sm font-bold text-slate-800">
                              {
                                upload.current_chunk ??
                                0
                              }{" "}
                              /{" "}
                              {
                                upload.total_chunks ??
                                0
                              }
                            </p>

                          </div>

                          <div className="rounded-lg bg-slate-50 p-3">

                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Segments
                            </p>

                            <p className="mt-1 text-sm font-bold text-slate-800">
                              {
                                upload.segments_saved ??
                                0
                              }
                            </p>

                          </div>

                          <div className="rounded-lg bg-slate-50 p-3">

                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Updated
                            </p>

                            <div className="mt-1 flex items-center gap-1">

                              <Clock
                                size={12}
                                className="text-slate-400"
                              />

                              <p className="truncate text-xs font-medium text-slate-700">
                                {formatDate(
                                  upload.updated_at,
                                )}
                              </p>

                            </div>

                          </div>

                        </div>

                        {/* ======================================
                            MESSAGE
                        ====================================== */}

                        {upload.message && (
                          <div
                            className={[
                              "mt-3 rounded-lg px-3 py-2 text-xs",
                              status ===
                              "FAILED"
                                ? "border border-red-200 bg-red-50 text-red-700"
                                : status ===
                                  "COMPLETED"
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                : status ===
                                  "CANCELLING"
                                ? "border border-orange-200 bg-orange-50 text-orange-700"
                                : status ===
                                  "CANCELLED"
                                ? "border border-slate-200 bg-slate-100 text-slate-600"
                                : "border border-slate-200 bg-slate-50 text-slate-600",
                            ].join(
                              " ",
                            )}
                          >
                            {
                              upload.message
                            }
                          </div>
                        )}

                        {/* ======================================
                            ACTIONS
                        ====================================== */}

                        <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">

                          {/* CANCEL */}

                          {isProcessing && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCancelUpload(
                                  upload,
                                )
                              }
                              disabled={
                                isCancellingThis
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isCancellingThis ? (
                                <>
                                  <Loader2
                                    size={
                                      14
                                    }
                                    className="animate-spin"
                                  />
                                  Cancelling...
                                </>
                              ) : (
                                <>
                                  <XCircle
                                    size={
                                      14
                                    }
                                  />
                                  Cancel
                                  Upload
                                </>
                              )}
                            </button>
                          )}

                          {/* CANCELLING */}

                          {isCancelling && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700">

                              <Loader2
                                size={
                                  14
                                }
                                className="animate-spin"
                              />

                              Stopping...

                            </span>
                          )}

                          {/* DELETE */}

                          {!isActive && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteUploadHistory(
                                  upload,
                                )
                              }
                              disabled={
                                isDeletingThis
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isDeletingThis ? (
                                <>
                                  <Loader2
                                    size={
                                      14
                                    }
                                    className="animate-spin"
                                  />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2
                                    size={
                                      14
                                    }
                                  />
                                  Delete
                                  History
                                </>
                              )}
                            </button>
                          )}

                        </div>

                      </div>
                    );
                  },
                )}

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}