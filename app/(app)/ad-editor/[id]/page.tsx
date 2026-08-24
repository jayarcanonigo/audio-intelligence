"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";

import LiveLogs from "@/components/logs/LiveLogs";
import { fetchFile } from "@ffmpeg/util";
import SelectedSegments from "@/components/segments/SelectedSegments";
import AudioPlayer from "@/components/audio/AudioPlayer";

import {
  useParams,
  useSearchParams,
} from "next/navigation";

import {
  getLogs,

  deleteAdvertisement,

  deleteAdvertisementsByProject,

  saveProject,

  deleteAdvertisementsByProjectHour,

  getAdvertisementsByProjectHour,

  createAdvertisement,

  getAdvertisements,

  reprocessAdvertisements,

  getSegmentHours,
  updateAdvertisement
} from "@/services/api";

import {
  Download,
  Save,
  Trash2,
  Plus,
  Search,
  X,
  RefreshCw,
  MoreVertical,
} from "lucide-react";

import {
  ToastContainer,
  toast,
} from "react-toastify";

export default function AdEditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const projectId = Number(params.id);

  const ffmpegRef = useRef<any>(null);

  const projectName =
    searchParams.get("name") ||
    `Project #${projectId}`;

  const [logs, setLogs] =
    useState<any[]>([]);

  const [results, setResults] =
    useState<any[]>([]);

  const [showMenu, setShowMenu] =
    useState(false);

  const [downloading, setDownloading] =
    useState(false);

  const [disabledLogs, setDisabledLogs] =
    useState<number[]>([]);

  const [selectedP1Id, setSelectedP1Id] =
    useState<number | null>(null);

  const [selectedP2Id, setSelectedP2Id] =
    useState<number | null>(null);

  const [phrase1, setPhrase1] =
    useState("");

  const [phrase2, setPhrase2] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [mobileTab, setMobileTab] =
    useState<"logs" | "segments">(
      "logs"
    );

  const stopListenerRef =
    useRef<(() => void) | null>(null);

  const [selectedLogId, setSelectedLogId] =
    useState<number | null>(null);

  const [selectedResultId, setSelectedResultId] =
    useState<number | null>(null);

  const [file, setFile] =
    useState<File | null>(null);

  const [currentAudioTime, setCurrentAudioTime] =
    useState(0);

  const audioRef =
    useRef<HTMLAudioElement>(null);

  const logRefs =
    useRef<Record<number, HTMLDivElement | null>>(
      {}
    );

  const [broadcastHour, setBroadcastHour] =
    useState<string>("1");

  const [hours, setHours] =
    useState<number[]>([]);

  const [refreshing, setRefreshing] =
    useState(false);

  const [isMobile, setIsMobile] =
    useState(false);

  const [lastSavedId, setLastSavedId] =
    useState<number | null>(null);

  // ============================================================
  // NORMALIZE STATUS
  // ============================================================

  const normalizeStatus = (
    status: any
  ): "NEW" | "SAVED" => {
    const value = String(
      status || ""
    )
      .trim()
      .toUpperCase();

    if (
      value === "SAVED" ||
      value === "COMPLETED"
    ) {
      return "SAVED";
    }

    return "NEW";
  };

  // ============================================================
  // LOAD LOGS
  // ============================================================

  const loadLogs = useCallback(
    async (
      opts: { silent?: boolean } = {}
    ) => {
      if (!projectId) return;

      try {
        if (!opts.silent) {
          setRefreshing(true);
        }

        const hour =
          broadcastHour === "all"
            ? undefined
            : Number(broadcastHour);

        const data =
          await getLogs(
            projectId,
            hour
          );

        const list =
          Array.isArray(data)
            ? data
            : data.logs || [];

        setLogs(list);

        // ======================================================
        // LOAD DATABASE ADS
        // ======================================================

        if (
          broadcastHour !== "all"
        ) {
          const ads =
            await getAdvertisementsByProjectHour(
              projectId,
              Number(broadcastHour)
            );

          if (
            ads &&
            ads.length > 0
          ) {
            const loaded =
              ads.map(
                (ad: any) => {
                  const matchedLogs =
                    list.filter(
                      (log: any) =>
                        log.start_time ===
                          ad.start_time &&
                        log.end_time ===
                          ad.end_time
                    );

                  return {
                    // =================================================
                    // IMPORTANT
                    // This is the Advertisement DATABASE ID.
                    // =================================================
                    id: ad.id,

                    project_id:
                      ad.project_id,

                    text:
                      ad.text,

                    start:
                      ad.start_time,

                    end:
                      ad.end_time,

                    brand_name:
                      ad.brand_name ||
                      "",

                    detection_key:
                      ad.detection_key ||
                      null,

                    status:
                      normalizeStatus(
                        ad.status
                      ),

                    // =================================================
                    // IMPORTANT
                    //
                    // This advertisement definitely exists
                    // in the database, regardless of whether
                    // its status is NEW or SAVED.
                    // =================================================
                    persisted:
                      true,

                    advertisement:
                      true,

                    segment_type:
                      "advertisement",

                    segmentIds:
                      matchedLogs.map(
                        (log: any) =>
                          log.id
                      ),
                  };
                }
              );

            setResults(
              loaded
            );

            setDisabledLogs(
              loaded.flatMap(
                (item: any) =>
                  item.segmentIds
                    ?.length
                    ? item.segmentIds
                    : [item.id]
              )
            );
          } else {
            setResults([]);
            setDisabledLogs([]);
          }
        }

        if (!opts.silent) {
          toast.success(
            "🔄 Logs refreshed"
          );
        }
      } catch (err) {
        console.error(
          "Load logs failed",
          err
        );

        if (!opts.silent) {
          toast.error(
            "Failed to refresh logs"
          );
        }
      } finally {
        if (!opts.silent) {
          setRefreshing(false);
        }
      }
    },
    [
      projectId,
      broadcastHour,
    ]
  );

  // ============================================================
  // SCREEN
  // ============================================================

  useEffect(() => {
    const checkScreen = () =>
      setIsMobile(
        window.innerWidth < 768
      );

    checkScreen();

    window.addEventListener(
      "resize",
      checkScreen
    );

    return () =>
      window.removeEventListener(
        "resize",
        checkScreen
      );
  }, []);

  // ============================================================
  // LOAD
  // ============================================================

  useEffect(() => {
    loadLogs({
      silent: true,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    projectId,
    broadcastHour,
  ]);

  // ============================================================
  // LOAD HOURS
  // ============================================================

  useEffect(() => {
    async function loadHours() {
      try {
        const data =
          await getSegmentHours(
            projectId
          );

        setHours(data);

        if (
          data.length > 0
        ) {
          setBroadcastHour(
            String(data[0])
          );
        }
      } catch (error) {
        console.error(
          "Failed loading segment hours",
          error
        );
      }
    }

    if (projectId) {
      loadHours();
    }
  }, [projectId]);

  // ============================================================
  // TRANSCRIPT SEGMENTS
  // ============================================================

  const transcriptSegments =
    useMemo(() => {
      return logs.map(
        (log: any) => ({
          id: log.id,

          start:
            log.start_time ||
            log.start ||
            "00:00:00",

          end:
            log.end_time ||
            log.end ||
            "00:00:00",

          text:
            log.text ||
            log.message ||
            "",

          segment_type:
            log.segment_type,

          brand_name:
            log.brand_name ||
            "",
        })
      );
    }, [logs]);

  // ============================================================
  // REPROCESS
  // ============================================================

  const handleReprocessAds =
    async () => {
      try {
        const hour =
          broadcastHour === "all"
            ? undefined
            : Number(
                broadcastHour
              );

        console.log(
          "================================"
        );

        console.log(
          "REPROCESS START",
          "Project ID:",
          projectId,
          "Hour:",
          hour
        );

        console.log(
          "================================"
        );

        const result =
          await reprocessAdvertisements(
            projectId,
            hour
          );

        console.log(
          "REPROCESS RAW RESULT:",
          result
        );

        const data =
          result?.data ??
          result?.result ??
          result;

        const detected =
          Number(
            data?.advertisements ??
              0
          );

        const created =
          Number(
            data?.created ?? 0
          );

        const skipped =
          Number(
            data?.skipped ?? 0
          );

        if (
          created > 0
        ) {
          toast.success(
            `🔄 ${created} new advertisement${
              created === 1
                ? ""
                : "s"
            } reprocessed`
          );
        } else if (
          detected > 0
        ) {
          toast.info(
            `Found ${detected} advertisement${
              detected === 1
                ? ""
                : "s"
            }, but none were newly created.`
          );
        } else {
          toast.warning(
            "No advertisements detected."
          );
        }

        await loadLogs({
          silent: true,
        });
      } catch (
        error: any
      ) {
        console.error(
          "REPROCESS ERROR",
          error
        );

        toast.error(
          error?.message ||
            "Failed to reprocess advertisements"
        );
      }
    };

  // ============================================================
  // REFRESH
  // ============================================================

  const handleRefresh =
    () => loadLogs();

  // ============================================================
  // FILE NAME
  // ============================================================

  const getFileName =
    (log: any) =>
      log.file_name ||
      log.audio_file ||
      log.filename ||
      log.source_file ||
      "Unknown file";

  // ============================================================
  // GET HOUR
  // ============================================================

  const getHour = (
    log: any
  ) => {
    const time =
      log.start_time ||
      log.start;

    if (!time) return null;

    const [hh] =
      String(time).split(
        ":"
      );

    return hh
      ? `${hh.padStart(
          2,
          "0"
        )}:00`
      : null;
  };

  // ============================================================
  // BROADCAST OPTIONS
  // ============================================================

  const broadcastOptions =
    useMemo(() => {
      const seen =
        new Map<
          string,
          {
            key: string;
            hour: string;
            fileName: string;
          }
        >();

      logs.forEach(
        (log) => {
          const hour =
            getHour(log);

          if (!hour) return;

          const fileName =
            getFileName(log);

          const key =
            `${hour}|${fileName}`;

          if (
            !seen.has(key)
          ) {
            seen.set(
              key,
              {
                key,
                hour,
                fileName,
              }
            );
          }
        }
      );

      return Array.from(
        seen.values()
      ).sort(
        (a, b) =>
          a.hour === b.hour
            ? a.fileName.localeCompare(
                b.fileName
              )
            : a.hour.localeCompare(
                b.hour
              )
      );
    }, [logs]);

  // ============================================================
  // DOWNLOAD EXCEL
  // ============================================================

  const handleDownloadExcel =
    async () => {
      const getSeconds =
        (time?: string) => {
          if (!time) return 0;

          const parts =
            time
              .split(":")
              .map(Number);

          if (
            parts.length === 3
          ) {
            const [
              hour,
              minute,
              second,
            ] = parts;

            return (
              hour * 3600 +
              minute * 60 +
              second
            );
          }

          if (
            parts.length === 2
          ) {
            const [
              minute,
              second,
            ] = parts;

            return (
              minute * 60 +
              second
            );
          }

          return 0;
        };

      const formatLength =
        (
          start?: string,
          end?: string
        ) => {
          const totalSeconds =
            getSeconds(end) -
            getSeconds(start);

          const hour =
            Math.floor(
              totalSeconds /
                3600
            );

          const minute =
            Math.floor(
              (totalSeconds %
                3600) /
                60
            );

          const second =
            totalSeconds % 60;

          return [
            hour,
            minute,
            second,
          ]
            .map(
              (v) =>
                String(v).padStart(
                  2,
                  "0"
                )
            )
            .join(":");
        };

      const exportData =
        [...results]
          .sort(
            (a, b) =>
              getSeconds(
                a.start
              ) -
              getSeconds(
                b.start
              )
          )
          .map((r) => ({
            "Start HH:MM:SS":
              r.start ||
              "00:00:00",

            "End time HH:MM:SS":
              r.end ||
              "00:00:00",

            "ACTUAL LENGTH":
              formatLength(
                r.start,
                r.end
              ),

            BRAND:
              r.brand_name ||
              "",

            COPYLINE:
              r.text || "",
          }));

      if (
        exportData.length === 0
      ) {
        toast.warning(
          "No advertisements to export"
        );

        return;
      }

      try {
        const res =
          await fetch(
            "/api/download-excel",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                results:
                  exportData,
              }),
            }
          );

        if (!res.ok) {
          throw new Error(
            "Excel export failed"
          );
        }

        const blob =
          await res.blob();

        const url =
          URL.createObjectURL(
            blob
          );

        const a =
          document.createElement(
            "a"
          );

        a.href = url;

        a.download =
          "advertisement_report.xlsx";

        document.body.appendChild(
          a
        );

        a.click();

        document.body.removeChild(
          a
        );

        URL.revokeObjectURL(
          url
        );

        toast.success(
          "Excel downloaded successfully"
        );
      } catch (
        error
      ) {
        console.error(
          "Excel download error:",
          error
        );

        toast.error(
          "Failed to download Excel"
        );
      }
    };

  // ============================================================
  // DOWNLOAD AUDIO
  // ============================================================

  const handleDownloadAudio =
    async (
      segment: any
    ) => {
      if (!file) {
        toast.warning(
          "Please load an audio file first."
        );

        return;
      }

      setDownloading(true);

      try {
        if (
          !ffmpegRef.current
        ) {
          const {
            FFmpeg,
          } =
            await import(
              "@ffmpeg/ffmpeg"
            );

          ffmpegRef.current =
            new FFmpeg();

          await ffmpegRef.current.load();
        }

        const ffmpeg =
          ffmpegRef.current;

        await ffmpeg.writeFile(
          "input.mp3",
          await fetchFile(file)
        );

        await ffmpeg.exec([
          "-i",
          "input.mp3",
          "-ss",
          segment.start,
          "-to",
          segment.end,
          "-c",
          "copy",
          "output.mp3",
        ]);

        const data =
          await ffmpeg.readFile(
            "output.mp3"
          );

        const blob =
          new Blob(
            [data],
            {
              type: "audio/mpeg",
            }
          );

        const url =
          URL.createObjectURL(
            blob
          );

        const a =
          document.createElement(
            "a"
          );

        a.href = url;

        a.download =
          `Advertisement_${segment.start.replaceAll(
            ":",
            "-"
          )}_${segment.end.replaceAll(
            ":",
            "-"
          )}.mp3`;

        document.body.appendChild(
          a
        );

        a.click();

        document.body.removeChild(
          a
        );

        URL.revokeObjectURL(
          url
        );

        toast.success(
          "Audio downloaded successfully."
        );
      } catch (
        error
      ) {
        console.error(
          error
        );

        toast.error(
          "Failed to download audio."
        );
      } finally {
        setDownloading(false);
      }
    };

  // ============================================================
  // UPDATE SEGMENT
  // ============================================================

  function handleUpdateSegment(
    id: number,
    data: {
      text: string;
      start: string;
      end: string;
      brand_name: string;
      status: "NEW" | "SAVED";
    }
  ) {
    console.log(
      "UPDATE SEGMENT ID:",
      id,
      "UPDATE DATA:",
      data
    );

    setLastSavedId(id);

    setResults(
      (prev) =>
        prev.map(
          (item) =>
            item.id === id
              ? {
                  ...item,

                  text:
                    data.text,

                  start:
                    data.start,

                  end:
                    data.end,

                  brand_name:
                    data.brand_name,

                  status:
                    data.status,
                }
              : item
        )
    );
  }

  // ============================================================
  // TIME HELPERS
  // ============================================================

  const toSeconds =
    (time?: string) => {
      if (!time) return null;

      const parts =
        time
          .split(":")
          .map(Number);

      if (
        parts.length === 3
      ) {
        const [
          ,
          minute,
          second,
        ] = parts;

        return (
          minute * 60 +
          second
        );
      }

      if (
        parts.length === 2
      ) {
        const [
          minute,
          second,
        ] = parts;

        return (
          minute * 60 +
          second
        );
      }

      return null;
    };

  const parseTime =
    (time: string) => {
      const parts =
        time
          .split(":")
          .map(Number);

      if (
        parts.length === 3
      ) {
        const [
          ,
          minute,
          second,
        ] = parts;

        return (
          minute * 60 +
          second
        );
      }

      if (
        parts.length === 2
      ) {
        const [
          minute,
          second,
        ] = parts;

        return (
          minute * 60 +
          second
        );
      }

      return 0;
    };

  // ============================================================
  // FILTER LOGS
  // ============================================================

  const filteredLogs =
    useMemo(() => {
      const q =
        search.toLowerCase();

      return logs.filter(
        (log) => {
          const matchesSearch =
            (
              log.text ||
              log.message ||
              ""
            )
              .toLowerCase()
              .includes(q);

          if (
            !matchesSearch
          ) {
            return false;
          }

          if (
            broadcastHour ===
            "all"
          ) {
            return true;
          }

          const hour =
            getHour(log);

          if (!hour) {
            return false;
          }

          const key =
            `${hour}|${getFileName(
              log
            )}`;

          return (
            key ===
            broadcastHour
          );
        }
      );
    }, [
      logs,
      search,
      broadcastHour,
    ]);

  // ============================================================
  // PLAY SEGMENT
  // ============================================================

  const handlePlaySegment =
    async (
      row: any
    ) => {
      setLastSavedId(
        row.id
      );

      setSelectedResultId(
        row.id
      );

      const audio =
        audioRef.current;

      if (!audio) return;

      const start =
        row.start ??
        row.start_time;

      const end =
        row.end ??
        row.end_time;

      if (!start || !end) {
        return;
      }

      try {
        if (
          stopListenerRef.current
        ) {
          audio.removeEventListener(
            "timeupdate",
            stopListenerRef.current
          );

          stopListenerRef.current =
            null;
        }

        audio.pause();

        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              50
            )
        );

        audio.currentTime =
          parseTime(start);

        const stop =
          () => {
            if (
              audio.currentTime >=
              parseTime(end)
            ) {
              audio.pause();

              audio.removeEventListener(
                "timeupdate",
                stop
              );

              stopListenerRef.current =
                null;
            }
          };

        stopListenerRef.current =
          stop;

        audio.addEventListener(
          "timeupdate",
          stop
        );

        await audio.play();
      } catch (
        err: any
      ) {
        if (
          err.name !==
          "AbortError"
        ) {
          console.error(
            "Audio error",
            err
          );
        }
      }
    };

  // ============================================================
  // DELETE ALL
  // ============================================================

  const handleDeleteAllAdvertisements =
    async () => {
      if (
        broadcastHour ===
        "all"
      ) {
        toast.warning(
          "Please select a broadcast hour first."
        );

        return;
      }

      try {
        console.log(
          "DELETE ALL ADS:",
          {
            projectId,
            hour:
              Number(
                broadcastHour
              ),
          }
        );

        await deleteAdvertisementsByProjectHour(
          projectId,
          Number(
            broadcastHour
          )
        );

        setResults([]);

        setDisabledLogs([]);

        toast.success(
          "🗑 All advertisements deleted"
        );

        await loadLogs({
          silent: true,
        });
      } catch (
        error: any
      ) {
        console.error(
          "DELETE ERROR",
          error
        );

        toast.error(
          error?.message ||
            "Delete failed"
        );
      }
    };

  // ============================================================
  // ADD RANGE
  // ============================================================

  const handleAddRange =
    async () => {
      if (
        selectedP1Id === null ||
        selectedP2Id === null
      ) {
        toast.warning(
          "Select P1 and P2 first"
        );

        return;
      }

      const startIndex =
        logs.findIndex(
          (l) =>
            l.id ===
            selectedP1Id
        );

      const endIndex =
        logs.findIndex(
          (l) =>
            l.id ===
            selectedP2Id
        );

      if (
        startIndex === -1 ||
        endIndex === -1
      ) {
        toast.error(
          "Invalid selection"
        );

        return;
      }

      if (
        startIndex >=
        endIndex
      ) {
        toast.error(
          "P2 must be after P1"
        );

        return;
      }

      const range =
        logs.slice(
          startIndex,
          endIndex + 1
        );

      const ids =
        range.map(
          (x) => x.id
        );

      // ========================================================
      // IMPORTANT
      //
      // Temporary frontend ID.
      // This is NOT an Advertisement database ID.
      // ========================================================

      const newId =
        Date.now();

      const newSegment =
        {
          id: newId,

          text: range
            .map(
              (x) =>
                x.text ||
                x.message ||
                ""
            )
            .join(" "),

          start:
            range[0]
              .start_time,

          end:
            range[
              range.length - 1
            ].end_time,

          segmentIds: ids,

          advertisement:
            true,

          brand_name: "",

          status: "NEW",

          // IMPORTANT
          persisted: false,

          segment_type:
            "new",

          detection_key:
            `manual-${projectId}-${range[0].start_time}-${range[range.length - 1].end_time}`,
        };

      const clean =
        results.filter(
          (row) => {
            const rowIds =
              row.segmentIds ??
              [row.id];

            return !rowIds.some(
              (id: number) =>
                ids.includes(id)
            );
          }
        );

      const updated = [
        ...clean,
        newSegment,
      ];

      setResults(
        updated
      );

      setDisabledLogs(
        [
          ...new Set(
            updated.flatMap(
              (x) =>
                x.segmentIds ??
                [x.id]
            )
          ),
        ]
      );

      setLastSavedId(
        newId
      );

      setSelectedP1Id(
        null
      );

      setSelectedP2Id(
        null
      );

      toast.success(
        "✅ Advertisement segment added"
      );
    };

  // ============================================================
  // SAVE ALL
  // ============================================================

  async function handleSaveAllSegments() {
    try {
      if (
        results.length === 0
      ) {
        toast.warning(
          "No advertisements to save"
        );

        return;
      }

      for (
        const segment of results
      ) {
        let detectionKey =
          segment.detection_key ||
          null;

        if (
          !detectionKey &&
          segment.segmentIds &&
          segment.segmentIds.length >
            0
        ) {
          const ids =
            segment.segmentIds;

          const startSegmentId =
            ids[0];

          const endSegmentId =
            ids[ids.length - 1];

          detectionKey =
            `project-${projectId}-segments-${startSegmentId}-${endSegmentId}`;
        }

        if (
          !detectionKey &&
          segment.id
        ) {
          detectionKey =
            `project-${projectId}-segments-${segment.id}-${segment.id}`;
        }

        console.log(
          "SAVING ADVERTISEMENT:",
          {
            project_id:
              projectId,

            text:
              segment.text,

            start:
              segment.start,

            end:
              segment.end,

            brand_name:
              segment.brand_name,

            detection_key:
              detectionKey,

            status:
              "SAVED",

            persisted:
              segment.persisted,
          }
        );

        // ======================================================
        // IMPORTANT:
        //
        // If this item already exists in DB, do not create
        // another Advertisement record.
        // ======================================================

       if (
          segment.persisted === true
        ) {
          await updateAdvertisement(
            segment.id,
            {              
              text: segment.text,
              start: segment.start,
              end: segment.end,
              brand_name:
                segment.brand_name || "",
              detection_key:
                detectionKey,
              status: "SAVED",
            }
          );

          continue;
        }

        await createAdvertisement({
          project_id:
            projectId,

          text:
            segment.text,

          start:
            segment.start,

          end:
            segment.end,

          brand_name:
            segment.brand_name ||
            "",

          detection_key:
            detectionKey,

          status:
            "SAVED",
        });
      }

      toast.success(
        "✅ Advertisements saved successfully"
      );

      // ========================================================
      // Reload from database.
      //
      // This converts newly created items from:
      //
      // persisted: false
      //
      // to:
      //
      // persisted: true
      //
      // and gives them the real Advertisement DB ID.
      // ========================================================

      await loadLogs({
        silent: true,
      });
    } catch (
      error: any
    ) {
      console.error(
        "SAVE ERROR",
        error
      );

      toast.error(
        error?.message ||
          "Save failed"
      );
    }
  }

  // ============================================================
  // REMOVE / DELETE SINGLE
  // ============================================================


const handleRemove = async (id: number) => {
  const item = results.find(
    (r) => r.id === id
  );

  if (!item) {
    console.warn(
      "DELETE: item not found:",
      id
    );

    return;
  }

  console.log(
    "========================================"
  );

  console.log(
    "DELETE ADVERTISEMENT"
  );

  console.log(
    "Advertisement ID:",
    id
  );

  console.log(
    "Status:",
    item.status
  );

  console.log(
    "Detection Key:",
    item.detection_key
  );

  console.log(
    "Project ID:",
    item.project_id
  );

  console.log(
    "Item:",
    item
  );

  console.log(
    "========================================"
  );

  /*
   * IMPORTANT
   *
   * DO NOT use status to determine whether the
   * advertisement exists in the database.
   *
   * A database advertisement can have status = NEW.
   *
   * If the item has a real database ID, delete it
   * through the backend.
   */

  try {
    console.log(
      "CALLING DELETE API:",
      id
    );

    await deleteAdvertisement(id);

    console.log(
      "DELETE API SUCCESS:",
      id
    );

    // ----------------------------------------------------------
    // Remove from UI
    // ----------------------------------------------------------

    setResults((prev) =>
      prev.filter(
        (r) => r.id !== id
      )
    );

    // ----------------------------------------------------------
    // Re-enable transcript segments
    // ----------------------------------------------------------

    const itemSegmentIds =
      item.segmentIds ?? [item.id];

    setDisabledLogs((prev) =>
      prev.filter(
        (logId) =>
          !itemSegmentIds.includes(
            logId
          )
      )
    );

    // ----------------------------------------------------------
    // Clear selected result
    // ----------------------------------------------------------

    if (
      selectedResultId === id
    ) {
      setSelectedResultId(null);
    }

    if (
      lastSavedId === id
    ) {
      setLastSavedId(null);
    }

    toast.success(
      `🗑 Advertisement ${id} deleted`
    );

    console.log(
      "========================================"
    );
    console.log(
      "ADVERTISEMENT DELETED COMPLETELY:",
      id
    );
    console.log(
      "========================================"
    );

  } catch (error: any) {
    console.error(
      "========================================"
    );

    console.error(
      "DELETE ADVERTISEMENT ERROR:",
      error
    );

    console.error(
      "Advertisement ID:",
      id
    );

    console.error(
      "========================================"
    );

    toast.error(
      error?.message ||
        "Failed to delete advertisement"
    );
  }
};
  // ============================================================
  // EDIT TIME
  // ============================================================

  const updateTimePart =
    (
      id: number,
      field:
        | "start"
        | "end",
      part:
        | "minute"
        | "second",
      value: string
    ) => {
      const num =
        Math.max(
          0,
          Math.min(
            59,
            Number(value) ||
              0
          )
        );

      setResults(
        (prev) =>
          prev.map(
            (r) => {
              if (
                r.id !== id
              ) {
                return r;
              }

              const [
                ,
                mm = "00",
                ss = "00",
              ] = (
                r[field] ||
                "00:00:00"
              ).split(":");

              const minute =
                part ===
                "minute"
                  ? String(
                      num
                    ).padStart(
                      2,
                      "0"
                    )
                  : mm;

              const second =
                part ===
                "second"
                  ? String(
                      num
                    ).padStart(
                      2,
                      "0"
                    )
                  : ss;

              return {
                ...r,

                [field]:
                  `00:${minute}:${second}`,
              };
            }
          )
      );
    };

  const displayTime =
    (
      time: string = ""
    ) => {
      const parts =
        time.split(":");

      return parts.length ===
        3
        ? `${parts[1]}:${parts[2]}`
        : time;
    };

  // ============================================================
  // CENTER LAST
  // ============================================================

  const handleCenterLastCompleted =
    () => {
      if (!lastSavedId) {
        toast.info(
          "No recently saved segment"
        );

        return;
      }

      setSelectedResultId(
        lastSavedId
      );

      setTimeout(() => {
        const element =
          document.getElementById(
            `segment-${lastSavedId}`
          );

        element?.scrollIntoView(
          {
            behavior: "smooth",
            block: "center",
          }
        );
      }, 200);
    };

  // ============================================================
  // AUDIO URL
  // ============================================================

  const audioUrl =
    useMemo(() => {
      if (!file) return "";

      return URL.createObjectURL(
        file
      );
    }, [file]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(
          audioUrl
        );
      }
    };
  }, [audioUrl]);

  // ============================================================
  // ADD SINGLE
  // ============================================================

  const handleAddSingle =
    (row: any) => {
      // ========================================================
      // IMPORTANT:
      //
      // Do NOT use row.id as the advertisement ID.
      //
      // row.id is the Segment database ID.
      //
      // This item is not yet an Advertisement DB record.
      // ========================================================

      const temporaryId =
        Date.now();

      const newSegment =
        {
          // Temporary frontend ID
          id: temporaryId,

          // Original transcript Segment ID
          sourceSegmentId:
            row.id,

          text:
            row.text ||
            row.message ||
            "",

          start:
            row.start_time,

          end:
            row.end_time,

          segmentIds: [
            row.id,
          ],

          advertisement:
            true,

          brand_name:
            row.brand_name ||
            "",

          status:
            "NEW",

          // ====================================================
          // IMPORTANT
          //
          // This is NOT in Advertisement table yet.
          // ====================================================

          persisted:
            false,

          segment_type:
            "advertisement",

          detection_key:
            row.detection_key ||
            `manual-${projectId}-${row.start_time}-${row.end_time}`,
        };

      const exists =
        results.some(
          (item) =>
            item.segmentIds?.includes(
              row.id
            ) ||
            item.sourceSegmentId ===
              row.id
        );

      if (exists) {
        toast.info(
          "Already added"
        );

        return;
      }

      const updatedResults = [
        ...results,
        newSegment,
      ];

      setResults(
        updatedResults
      );

      setDisabledLogs(
        [
          ...new Set(
            updatedResults.flatMap(
              (item: any) =>
                item.segmentIds ??
                [item.id]
            )
          ),
        ]
      );

      setLastSavedId(
        temporaryId
      );

      toast.success(
        "✅ Segment added"
      );
    };

  // ============================================================
  // AUDIO FILE
  // ============================================================

  const handleAudioChange =
    (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const selected =
        e.target.files?.[0];

      if (selected) {
        setFile(selected);
      }
    };

  const handleTimeUpdate =
    () => {
      if (audioRef.current) {
        setCurrentAudioTime(
          audioRef.current
            .currentTime
        );
      }
    };

  // ============================================================
  // AUTO SCROLL
  // ============================================================

  useEffect(() => {
    const current =
      logs.find(
        (log) => {
          const start =
            toSeconds(
              log.start_time
            );

          const end =
            toSeconds(
              log.end_time
            );

          return (
            start !== null &&
            end !== null &&
            currentAudioTime >=
              start &&
            currentAudioTime <=
              end
          );
        }
      );

    if (current) {
      logRefs.current[
        current.id
      ]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [
    currentAudioTime,
    logs,
  ]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="p-3 md:p-6 space-y-6">
      <ToastContainer
        position="top-right"
        autoClose={2000}
      />

      {/* HEADER */}
      <div className="bg-white rounded-xl shadow p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              🎧 Ad Editor
            </h1>

            <p className="mt-1 text-sm text-gray-500 break-words">
              Project:{" "}
              <span className="font-medium text-gray-700">
                {projectName ||
                  `Project #${projectId}`}
              </span>
            </p>
          </div>

          {/* BROADCAST HOUR */}
          <div className="w-full md:w-auto">
            <div className="block md:hidden">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Broadcast Hour
              </label>

              <select
                value={
                  broadcastHour
                }
                onChange={(e) =>
                  setBroadcastHour(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                {hours.map(
                  (hour) => (
                    <option
                      key={hour}
                      value={String(
                        hour
                      )}
                    >
                      {String(
                        hour
                      ).padStart(
                        2,
                        "0"
                      )}
                      :00
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="hidden md:block">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Broadcast Hour
              </div>

              <div className="flex max-w-[700px] gap-2 overflow-x-auto rounded-xl border bg-gray-50 p-2">
                {hours.map(
                  (hour) => (
                    <button
                      key={hour}
                      onClick={() =>
                        setBroadcastHour(
                          String(
                            hour
                          )
                        )
                      }
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                        broadcastHour ===
                        String(
                          hour
                        )
                          ? "bg-blue-600 text-white shadow"
                          : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {String(
                        hour
                      ).padStart(
                        2,
                        "0"
                      )}
                      :00
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {isMobile ? (
        <div className="pb-40">
          <div className="sticky top-0 z-30 bg-gray-100 pb-3">
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setMobileTab(
                    "logs"
                  )
                }
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                  mobileTab ===
                  "logs"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 border"
                }`}
              >
                Live Logs
              </button>

              <button
                onClick={() =>
                  setMobileTab(
                    "segments"
                  )
                }
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                  mobileTab ===
                  "segments"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 border"
                }`}
              >
                Segments (
                {
                  results.length
                }
                )
              </button>
            </div>
          </div>

          {mobileTab ===
          "logs" ? (
            <div className="bg-white rounded-xl shadow p-4">
              <h2 className="mb-4 font-semibold">
                Live Logs
              </h2>

              <LiveLogs
                logs={logs}
                disabledLogs={
                  disabledLogs
                }
                selectedP1Id={
                  selectedP1Id
                }
                selectedP2Id={
                  selectedP2Id
                }
                currentAudioTime={
                  currentAudioTime
                }
                logRefs={
                  logRefs
                }
                selectedLogId={
                  selectedLogId
                }
                setSelectedLogId={
                  setSelectedLogId
                }
                setPhrase1={
                  setPhrase1
                }
                setPhrase2={
                  setPhrase2
                }
                setSelectedP1Id={
                  setSelectedP1Id
                }
                setSelectedP2Id={
                  setSelectedP2Id
                }
                onPlay={
                  handlePlaySegment
                }
                onAddSingle={
                  handleAddSingle
                }
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">
                  Selected Segments
                </h2>

                <span className="text-sm text-gray-500">
                  {
                    results.length
                  }{" "}
                  Selected
                </span>
              </div>

              <SelectedSegments
                segments={
                  results
                }
                transcriptSegments={
                  transcriptSegments
                }
                selectedResultId={
                  selectedResultId
                }
                setSelectedResultId={
                  setSelectedResultId
                }
                onRemove={
                  handleRemove
                }
                onPlay={
                  handlePlaySegment
                }
                onUpdate={
                  handleUpdateSegment
                }
                onDownload={
                  handleDownloadAudio
                }
                onSave={
                  handleSaveAllSegments
                }
              />
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6 pb-40">
          {/* LOGS */}
          <div className="col-span-5">
            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="font-semibold mb-4">
                Live Logs
              </h2>

              <LiveLogs
                logs={logs}
                disabledLogs={
                  disabledLogs
                }
                selectedP1Id={
                  selectedP1Id
                }
                selectedP2Id={
                  selectedP2Id
                }
                currentAudioTime={
                  currentAudioTime
                }
                logRefs={
                  logRefs
                }
                selectedLogId={
                  selectedLogId
                }
                setSelectedLogId={
                  setSelectedLogId
                }
                setPhrase1={
                  setPhrase1
                }
                setPhrase2={
                  setPhrase2
                }
                setSelectedP1Id={
                  setSelectedP1Id
                }
                setSelectedP2Id={
                  setSelectedP2Id
                }
                onPlay={
                  handlePlaySegment
                }
                onAddSingle={
                  handleAddSingle
                }
              />
            </div>
          </div>

          {/* SEGMENTS */}
          <div className="col-span-7">
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex justify-between mb-4">
                <h2 className="font-semibold">
                  Selected Segments
                </h2>

                <span className="text-sm text-gray-500">
                  {
                    results.length
                  }{" "}
                  Selected
                </span>
              </div>

              <SelectedSegments
                segments={
                  results
                }
                transcriptSegments={
                  transcriptSegments
                }
                selectedResultId={
                  selectedResultId
                }
                setSelectedResultId={
                  setSelectedResultId
                }
                onRemove={
                  handleRemove
                }
                onPlay={
                  handlePlaySegment
                }
                onUpdate={
                  handleUpdateSegment
                }
                onDownload={
                  handleDownloadAudio
                }
                onSave={
                  handleSaveAllSegments
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-lg">
        <div className="px-3 py-2">
          {isMobile ? (
            <>
              <div className="mb-3 flex rounded-xl bg-gray-100 p-1">
                <button
                  onClick={() =>
                    setMobileTab(
                      "logs"
                    )
                  }
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                    mobileTab ===
                    "logs"
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-600"
                  }`}
                >
                  📝 Logs
                </button>

                <button
                  onClick={() =>
                    setMobileTab(
                      "segments"
                    )
                  }
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                    mobileTab ===
                    "segments"
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-600"
                  }`}
                >
                  🎧 Segments (
                  {
                    results.length
                  }
                  )
                </button>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={
                    handleReprocessAds
                  }
                  className="flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white"
                >
                  <RefreshCw
                    size={15}
                  />
                  Reprocess
                </button>

                <button
                  onClick={
                    handleCenterLastCompleted
                  }
                  className="flex h-9 items-center gap-2 rounded-lg bg-purple-600 px-4 text-xs font-semibold text-white"
                >
                  🎯 Last
                </button>

                <div className="relative">
                  <button
                    onClick={() =>
                      setShowMenu(
                        (prev) =>
                          !prev
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200"
                  >
                    <MoreVertical
                      size={18}
                    />
                  </button>

                  {showMenu && (
                    <div className="absolute bottom-11 right-0 w-56 overflow-hidden rounded-xl border bg-white shadow-xl">
                      <button
                        onClick={() => {
                          handleAddRange();
                          setShowMenu(
                            false
                          );
                        }}
                        disabled={
                          selectedP1Id ===
                            null ||
                          selectedP2Id ===
                            null
                        }
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus
                          size={16}
                        />
                        Add Segment
                      </button>

                      <button
                        onClick={() => {
                          handleSaveAllSegments();
                          setShowMenu(
                            false
                          );
                        }}
                        disabled={
                          results.length ===
                          0
                        }
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Save
                          size={16}
                        />
                        Save
                      </button>

                      <button
                        onClick={() => {
                          handleDownloadExcel();
                          setShowMenu(
                            false
                          );
                        }}
                        disabled={
                          results.length ===
                          0
                        }
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Download
                          size={16}
                        />
                        Download Excel
                      </button>

                      <button
                        onClick={() => {
                          handleDeleteAllAdvertisements();
                          setShowMenu(
                            false
                          );
                        }}
                        disabled={
                          results.length ===
                          0
                        }
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2
                          size={16}
                        />
                        Delete All
                      </button>

                      <div className="border-t" />

                      <button
                        onClick={() => {
                          setSearch("");
                          setPhrase1("");
                          setPhrase2("");
                          setSelectedP1Id(null);
                          setSelectedP2Id(null);
                          setShowMenu(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50"
                      >
                        <X
                          size={16}
                        />
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={
                      handleCenterLastCompleted
                    }
                    className="flex h-8 items-center gap-1 rounded-md bg-purple-600 px-3 text-[11px] font-semibold text-white hover:bg-purple-700"
                  >
                    🎯 Last
                  </button>

                  <button
                    onClick={() => {
                      setSearch("");
                      setPhrase1("");
                      setPhrase2("");
                      setSelectedP1Id(null);
                      setSelectedP2Id(null);
                    }}
                    className="flex h-8 items-center gap-1 rounded-md bg-gray-100 px-3 text-[11px] font-medium hover:bg-gray-200"
                  >
                    <X size={13} />
                    Clear
                  </button>

                  <button
                    onClick={
                      handleAddRange
                    }
                    disabled={
                      selectedP1Id ===
                        null ||
                      selectedP2Id ===
                        null
                    }
                    className={`flex h-8 items-center gap-1 rounded-md px-3 text-[11px] font-semibold transition ${
                      selectedP1Id !==
                        null &&
                      selectedP2Id !==
                        null
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "cursor-not-allowed bg-gray-300 text-gray-500"
                    }`}
                  >
                    <Plus
                      size={13}
                    />
                    Add
                  </button>
                </div>

                <div className="hidden h-6 w-px bg-gray-300 lg:block" />

                <div className="relative flex-1 min-w-[220px]">
                  <Search
                    size={14}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    placeholder="Search transcript..."
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                    className="w-full rounded-md border py-1.5 pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="hidden h-6 w-px bg-gray-300 lg:block" />

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={
                      handleReprocessAds
                    }
                    className="flex h-8 items-center gap-1 rounded-md bg-blue-600 px-3 text-[11px] font-semibold text-white"
                  >
                    <RefreshCw
                      size={13}
                    />
                    Reprocess
                  </button>

                  <button
                    onClick={
                      handleSaveAllSegments
                    }
                    disabled={
                      results.length ===
                      0
                    }
                    className="flex h-8 items-center gap-1 rounded-md bg-green-600 px-3 text-[11px] font-semibold text-white disabled:bg-gray-300"
                  >
                    <Save
                      size={13}
                    />
                    Save
                  </button>

                  <button
                    onClick={
                      handleDownloadExcel
                    }
                    disabled={
                      results.length ===
                      0
                    }
                    className="flex h-8 items-center gap-1 rounded-md bg-emerald-600 px-3 text-[11px] font-semibold text-white disabled:bg-gray-300"
                  >
                    <Download
                      size={13}
                    />
                    Download
                  </button>

                  <button
                    onClick={
                      handleDeleteAllAdvertisements
                    }
                    disabled={
                      results.length ===
                      0
                    }
                    className="flex h-8 items-center gap-1 rounded-md bg-red-600 px-3 text-[11px] font-semibold text-white disabled:bg-gray-300"
                  >
                    <Trash2
                      size={13}
                    />
                    Delete
                  </button>
                </div>
              </div>
            </>
          )}

          {/* AUDIO PLAYER */}
          <div className="mt-2 border-t pt-2">
            <AudioPlayer
              file={file}
              setFile={setFile}
              audioRef={audioRef}
              audioUrl={audioUrl}
              onChange={
                handleAudioChange
              }
              onTimeUpdate={
                handleTimeUpdate
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}