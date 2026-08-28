
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
  deleteAdvertisementsByProjectHour,
  getAdvertisementsByProjectHour,
  createAdvertisement,
  reprocessAdvertisements,
  getSegmentHours,
  updateAdvertisement,
} from "@/services/api";

import {
  Download,
  Save,
  Trash2,
  Plus,
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

  /*
   * MOBILE ONLY TAB
   *
   * This is now controlled by the
   * Logs / Segments button in the
   * mobile footer.
   */
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
  // DETECTION KEY
  // ============================================================

  const makeDetectionKey = useCallback(
    (
      segmentIds: number[]
    ): string | null => {
      if (
        !Array.isArray(segmentIds) ||
        segmentIds.length === 0
      ) {
        return null;
      }

      const ids = segmentIds
        .map(Number)
        .filter(
          (id) =>
            Number.isFinite(id)
        );

      if (ids.length === 0) {
        return null;
      }

      const sortedIds =
        [...ids].sort(
          (a, b) => a - b
        );

      const startSegmentId =
        sortedIds[0];

      const endSegmentId =
        sortedIds[
          sortedIds.length - 1
        ];

      return `project-${projectId}-segments-${startSegmentId}-${endSegmentId}`;
    },
    [projectId]
  );

  // ============================================================
  // PARSE DETECTION KEY
  // ============================================================

  const parseDetectionKey = useCallback(
    (
      detectionKey?: string | null
    ): {
      startId: number;
      endId: number;
    } | null => {
      if (!detectionKey) {
        return null;
      }

      const match =
        String(
          detectionKey
        ).match(
          /^project-\d+-segments-(\d+)-(\d+)$/
        );

      if (!match) {
        return null;
      }

      const startId =
        Number(match[1]);

      const endId =
        Number(match[2]);

      if (
        !Number.isFinite(
          startId
        ) ||
        !Number.isFinite(
          endId
        ) ||
        startId > endId
      ) {
        return null;
      }

      return {
        startId,
        endId,
      };
    },
    []
  );

  // ============================================================
  // RECOVER SEGMENT IDS FROM DETECTION KEY
  // ============================================================

  const getSegmentIdsFromDetectionKey =
    useCallback(
      (
        detectionKey:
          | string
          | null
          | undefined,
        sourceLogs: any[]
      ): number[] => {
        const parsed =
          parseDetectionKey(
            detectionKey
          );

        if (!parsed) {
          return [];
        }

        const {
          startId,
          endId,
        } = parsed;

        const logIds =
          sourceLogs
            .map(
              (log: any) =>
                Number(log.id)
            )
            .filter(
              (id: number) =>
                Number.isFinite(id) &&
                id >= startId &&
                id <= endId
            )
            .sort(
              (a, b) => a - b
            );

        if (
          logIds.length > 0
        ) {
          return logIds;
        }

        const ids: number[] =
          [];

        for (
          let id = startId;
          id <= endId;
          id++
        ) {
          ids.push(id);
        }

        return ids;
      },
      [parseDetectionKey]
    );

  // ============================================================
  // LOAD LOGS
  // ============================================================

  const loadLogs = useCallback(
    async (
      opts: {
        silent?: boolean;
      } = {}
    ) => {
      if (!projectId) {
        return;
      }

      try {
        if (!opts.silent) {
          setRefreshing(true);
        }

        const hour =
          broadcastHour === "all"
            ? undefined
            : Number(
                broadcastHour
              );

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

        if (
          broadcastHour !==
          "all"
        ) {
          const ads =
            await getAdvertisementsByProjectHour(
              projectId,
              Number(
                broadcastHour
              )
            );

          if (
            ads &&
            ads.length > 0
          ) {
            const loaded =
              ads.map(
                (ad: any) => {
                  let segmentIds =
                    getSegmentIdsFromDetectionKey(
                      ad.detection_key,
                      list
                    );

                  if (
                    segmentIds.length ===
                    0
                  ) {
                    const matchedLogs =
                      list.filter(
                        (log: any) =>
                          log.start_time ===
                            ad.start_time &&
                          log.end_time ===
                            ad.end_time
                      );

                    segmentIds =
                      matchedLogs.map(
                        (log: any) =>
                          Number(
                            log.id
                          )
                      );
                  }

                  const generatedDetectionKey =
                    makeDetectionKey(
                      segmentIds
                    );

                  const finalDetectionKey =
                    generatedDetectionKey ??
                    ad.detection_key ??
                    null;

                  console.log(
                    "========================================"
                  );

                  console.log(
                    "LOAD DATABASE ADVERTISEMENT"
                  );

                  console.log(
                    "Advertisement ID:",
                    ad.id
                  );

                  console.log(
                    "Database detection_key:",
                    ad.detection_key
                  );

                  console.log(
                    "Advertisement start:",
                    ad.start_time
                  );

                  console.log(
                    "Advertisement end:",
                    ad.end_time
                  );

                  console.log(
                    "Recovered segmentIds:",
                    segmentIds
                  );

                  console.log(
                    "Final detection_key:",
                    finalDetectionKey
                  );

                  console.log(
                    "========================================"
                  );

                  return {
                    id:
                      ad.id,

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
                      finalDetectionKey,

                    segmentIds:
                      segmentIds,

                    status:
                      normalizeStatus(
                        ad.status
                      ),

                    persisted:
                      true,

                    advertisement:
                      true,

                    segment_type:
                      "advertisement",
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
                    : []
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
      getSegmentIdsFromDetectionKey,
      makeDetectionKey,
    ]
  );

  // ============================================================
  // SCREEN
  // ============================================================

  useEffect(() => {
    const checkScreen =
      () =>
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
            String(
              data[0]
            )
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
          broadcastHour ===
          "all"
            ? undefined
            : Number(
                broadcastHour
              );

        console.log(
          "================================"
        );

        console.log(
          "REPROCESS START"
        );

        console.log(
          "Project ID:",
          projectId
        );

        console.log(
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
            data?.created ??
              0
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

    if (!time) {
      return null;
    }

    const [hh] =
      String(time).split(":");

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

          if (!hour) {
            return;
          }

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
          if (!time) {
            return 0;
          }

          const parts =
            time
              .split(":")
              .map(Number);

          if (
            parts.length ===
            3
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
            parts.length ===
            2
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
                String(
                  v
                ).padStart(
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
          .map(
            (r) => ({
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
                r.text ||
                "",
            })
          );

      if (
        exportData.length ===
        0
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
      "========================================"
    );

    console.log(
      "UPDATE SEGMENT"
    );

    console.log(
      "Advertisement ID:",
      id
    );

    console.log(
      "New Start:",
      data.start
    );

    console.log(
      "New End:",
      data.end
    );

    const newStartSeconds =
      parseTime(data.start);

    const newEndSeconds =
      parseTime(data.end);

    const newSegmentIds =
      logs
        .filter((log: any) => {
          const segmentStart =
            parseTime(
              log.start_time ||
                log.start ||
                "00:00:00"
            );

          const segmentEnd =
            parseTime(
              log.end_time ||
                log.end ||
                "00:00:00"
            );

          if (
            segmentEnd <=
            newStartSeconds
          ) {
            return false;
          }

          if (
            segmentStart >=
            newEndSeconds
          ) {
            return false;
          }

          return true;
        })
        .map(
          (log: any) =>
            Number(log.id)
        );

    console.log(
      "========================================"
    );

    console.log(
      "CALCULATED SEGMENT IDS:",
      newSegmentIds
    );

    let detectionKey: string | null =
      null;

    if (
      newSegmentIds.length > 0
    ) {
      const startSegmentId =
        newSegmentIds[0];

      const endSegmentId =
        newSegmentIds[
          newSegmentIds.length - 1
        ];

      detectionKey =
        `project-${projectId}-segments-${startSegmentId}-${endSegmentId}`;
    }

    console.log(
      "NEW DETECTION KEY:",
      detectionKey
    );

    console.log(
      "========================================"
    );

    setResults((prev) =>
      prev.map((item) =>
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

              segmentIds:
                newSegmentIds,

              detection_key:
                detectionKey,
            }
          : item
      )
    );

    setLastSavedId(id);

    console.log(
      "RESULT UPDATED:",
      {
        id,
        start: data.start,
        end: data.end,
        segmentIds:
          newSegmentIds,
        detection_key:
          detectionKey,
      }
    );

    console.log(
      "========================================"
    );
  }

  // ============================================================
  // TIME HELPERS
  // ============================================================

  const toSeconds =
    (time?: string) => {
      if (!time) {
        return null;
      }

      const parts =
        time
          .split(":")
          .map(Number);

      if (
        parts.length ===
        3
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
        parts.length ===
        2
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
        parts.length ===
        3
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
        parts.length ===
        2
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

      if (!audio) {
        return;
      }

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
        range
          .map(
            (x) => Number(x.id)
          )
          .filter(
            (id) =>
              Number.isFinite(id)
          );

      if (
        ids.length === 0
      ) {
        toast.error(
          "No source segments found"
        );

        return;
      }

      const newId =
        Date.now();

      const detectionKey =
        makeDetectionKey(
          ids
        );

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

          segmentIds:
            ids,

          advertisement:
            true,

          brand_name: "",

          status:
            "NEW",

          persisted:
            false,

          segment_type:
            "new",

          detection_key:
            detectionKey,
        };

      const clean =
        results.filter(
          (row) => {
            const rowIds =
              Array.isArray(
                row.segmentIds
              )
                ? row.segmentIds
                : [];

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
                x.segmentIds ?? []
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

      console.log(
        "ADD RANGE:",
        {
          ids,
          detectionKey,
        }
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
      if (results.length === 0) {
        toast.warning(
          "No advertisements to save"
        );

        return;
      }

      console.log(
        "========================================"
      );

      console.log(
        "SAVE ALL ADVERTISEMENTS"
      );

      console.log(
        "Project ID:",
        projectId
      );

      console.log(
        "Results before save:",
        results
      );

      console.log(
        "========================================"
      );

      for (
        const segment of results
      ) {
        const segmentIds =
          Array.isArray(
            segment.segmentIds
          )
            ? segment.segmentIds
                .map(Number)
                .filter(
                  (id: number) =>
                    Number.isFinite(id)
                )
            : [];

        if (
          segmentIds.length === 0
        ) {
          console.error(
            "SAVE ERROR: segmentIds is empty",
            {
              advertisementId:
                segment.id,

              oldDetectionKey:
                segment.detection_key,

              segment,
            }
          );

          throw new Error(
            `Cannot save advertisement ${segment.id}: segmentIds is empty`
          );
        }

        const startSegmentId =
          segmentIds[0];

        const endSegmentId =
          segmentIds[
            segmentIds.length - 1
          ];

        const detectionKey =
          `project-${projectId}-segments-${startSegmentId}-${endSegmentId}`;

        console.log(
          "========================================"
        );

        console.log(
          "SAVING ADVERTISEMENT"
        );

        console.log(
          "Advertisement ID:",
          segment.id
        );

        console.log(
          "Persisted:",
          segment.persisted
        );

        console.log(
          "Segment IDs:",
          segmentIds
        );

        console.log(
          "Old detection_key:",
          segment.detection_key
        );

        console.log(
          "NEW detection_key:",
          detectionKey
        );

        console.log(
          "Start:",
          segment.start
        );

        console.log(
          "End:",
          segment.end
        );

        console.log(
          "Status:",
          "SAVED"
        );

        console.log(
          "========================================"
        );

        if (
          segment.persisted === true
        ) {
          console.log(
            "UPDATING EXISTING ADVERTISEMENT:",
            segment.id
          );

          const updated =
            await updateAdvertisement(
              segment.id,
              {
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
              }
            );

          console.log(
            "UPDATE SUCCESS:",
            updated
          );

          setResults((prev) =>
            prev.map((item) =>
              item.id ===
              segment.id
                ? {
                    ...item,

                    text:
                      segment.text,

                    start:
                      segment.start,

                    end:
                      segment.end,

                    brand_name:
                      segment.brand_name ||
                      "",

                    segmentIds:
                      segmentIds,

                    detection_key:
                      detectionKey,

                    status:
                      "SAVED",

                    persisted:
                      true,
                  }
                : item
            )
          );

          setLastSavedId(
            segment.id
          );

          continue;
        }

        console.log(
          "CREATING NEW ADVERTISEMENT"
        );

        const created =
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

        console.log(
          "CREATE SUCCESS:",
          created
        );

        const createdAd =
          created?.data ??
          created?.advertisement ??
          created;

        const realAdvertisementId =
          createdAd?.id ??
          createdAd?.advertisement_id ??
          null;

        setResults((prev) =>
          prev.map((item) =>
            item.id ===
            segment.id
              ? {
                  ...item,

                  id:
                    realAdvertisementId ??
                    item.id,

                  text:
                    segment.text,

                  start:
                    segment.start,

                  end:
                    segment.end,

                  brand_name:
                    segment.brand_name ||
                    "",

                  segmentIds:
                    segmentIds,

                  detection_key:
                    detectionKey,

                  status:
                    "SAVED",

                  persisted:
                    true,
              }
              : item
          )
        );

        setLastSavedId(
          realAdvertisementId ??
          segment.id
        );
      }

      console.log(
        "========================================"
      );

      console.log(
        "ALL ADVERTISEMENTS SAVED"
      );

      console.log(
        "========================================"
      );

      toast.success(
        "✅ Advertisements saved successfully"
      );

      await loadLogs({
        silent: true,
      });
    } catch (error: any) {
      console.error(
        "========================================"
      );

      console.error(
        "SAVE ERROR:",
        error
      );

      console.error(
        "========================================"
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

  const handleRemove =
    async (
      id: number
    ) => {
      const item =
        results.find(
          (r) =>
            r.id === id
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
        "Segment IDs:",
        item.segmentIds
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

      try {
        console.log(
          "CALLING DELETE API:",
          id
        );

        await deleteAdvertisement(
          id
        );

        console.log(
          "DELETE API SUCCESS:",
          id
        );

        setResults(
          (prev) =>
            prev.filter(
              (r) =>
                r.id !== id
            )
        );

        const itemSegmentIds =
          item.segmentIds ??
          [];

        setDisabledLogs(
          (prev) =>
            prev.filter(
              (logId) =>
                !itemSegmentIds.includes(
                  logId
                )
            )
        );

        if (
          selectedResultId ===
          id
        ) {
          setSelectedResultId(
            null
          );
        }

        if (
          lastSavedId === id
        ) {
          setLastSavedId(
            null
          );
        }

        toast.success(
          `🗑 Advertisement ${id} deleted`
        );

        console.log(
          "ADVERTISEMENT DELETED COMPLETELY:",
          id
        );
      } catch (
        error: any
      ) {
        console.error(
          "DELETE ADVERTISEMENT ERROR:",
          error
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

                segmentIds:
                  r.segmentIds,

                detection_key:
                  makeDetectionKey(
                    r.segmentIds ||
                      []
                  ) ??
                  r.detection_key ??
                  null,
              };
            }
          )
      );
    };

  // ============================================================
  // DISPLAY TIME
  // ============================================================

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

      /*
       * When pressing Last on mobile,
       * automatically switch to Segments
       * so the recently saved item is visible.
       */
      if (isMobile) {
        setMobileTab(
          "segments"
        );
      }

      setTimeout(() => {
        const element =
          document.getElementById(
            `segment-${lastSavedId}`
          );

        element?.scrollIntoView(
          {
            behavior:
              "smooth",
            block:
              "center",
          }
        );
      }, 200);
    };

  // ============================================================
  // AUDIO URL
  // ============================================================

  const audioUrl =
    useMemo(() => {
      if (!file) {
        return "";
      }

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
    (
      row: any
    ) => {
      const temporaryId =
        Date.now();

      const sourceSegmentId =
        Number(row.id);

      if (
        !Number.isFinite(
          sourceSegmentId
        )
      ) {
        toast.error(
          "Invalid source segment"
        );

        return;
      }

      const segmentIds = [
        sourceSegmentId,
      ];

      const detectionKey =
        makeDetectionKey(
          segmentIds
        );

      const newSegment =
        {
          id: temporaryId,

          sourceSegmentId:
            sourceSegmentId,

          text:
            row.text ||
            row.message ||
            "",

          start:
            row.start_time,

          end:
            row.end_time,

          segmentIds:
            segmentIds,

          advertisement:
            true,

          brand_name:
            row.brand_name ||
            "",

          status:
            "NEW",

          persisted:
            false,

          segment_type:
            "advertisement",

          detection_key:
            detectionKey,
        };

      const exists =
        results.some(
          (item) => {
            const itemIds =
              Array.isArray(
                item.segmentIds
              )
                ? item.segmentIds
                : [];

            return (
              itemIds.includes(
                sourceSegmentId
              ) ||
              item.sourceSegmentId ===
                sourceSegmentId
            );
          }
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
              (
                item: any
              ) =>
                item.segmentIds ?? []
            )
          ),
        ]
      );

      setLastSavedId(
        temporaryId
      );

      console.log(
        "ADD SINGLE:",
        {
          sourceSegmentId,
          segmentIds,
          detectionKey,
        }
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
        behavior:
          "smooth",
        block:
          "center",
      });
    }
  }, [
    currentAudioTime,
    logs,
  ]);

  // ============================================================
  // MOBILE TAB TOGGLE
  // ============================================================

  const toggleMobileTab =
    () => {
      setMobileTab(
        (prev) =>
          prev === "logs"
            ? "segments"
            : "logs"
      );

      /*
       * Close the More menu if it is open.
       */
      setShowMenu(false);
    };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-6">

      <ToastContainer
        position="top-right"
        autoClose={2000}
      />

      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="rounded-xl bg-white p-4 shadow-sm md:p-5">

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>

            <h1 className="text-xl font-bold text-gray-800 md:text-2xl">
              🎧 Ad Editor
            </h1>

            <p className="mt-1 break-words text-sm text-gray-500">

              Project:{" "}

              <span className="font-medium text-gray-700">
                {projectName ||
                  `Project #${projectId}`}
              </span>

            </p>

          </div>

          {/* ====================================================
              BROADCAST HOUR
          ==================================================== */}

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
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >

                {hours.map(
                  (
                    hour
                  ) => (
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

              <div className="flex max-w-[700px] gap-2 overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-2">

                {hours.map(
                  (
                    hour
                  ) => (
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

      {/* ========================================================
          CONTENT
      ======================================================== */}

      {isMobile ? (

        /*
         * ======================================================
         * MOBILE CONTENT
         *
         * IMPORTANT:
         * No top Logs / Segments tabs anymore.
         *
         * The footer button controls this view.
         * ======================================================
         */

        <div className="pb-48">

          {mobileTab ===
          "logs" ? (

            <div className="rounded-xl bg-white p-4 shadow-sm">

              <h2 className="mb-4 font-semibold text-gray-800">
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

            <div className="rounded-xl bg-white p-4 shadow-sm">

              <div className="mb-4 flex items-center justify-between">

                <h2 className="font-semibold text-gray-800">
                  Selected Segments
                </h2>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">

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

        /* ======================================================
           DESKTOP CONTENT
           
           DESKTOP REMAINS UNCHANGED.
           Both panels are visible.
        ====================================================== */

        <div className="grid grid-cols-12 gap-6 pb-48 pt-6">

          {/* LOGS */}

          <div className="col-span-5">

            <div className="rounded-xl bg-white p-5 shadow-sm">

              <h2 className="mb-4 font-semibold text-gray-800">
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

            <div className="rounded-xl bg-white p-5 shadow-sm">

              <div className="mb-4 flex items-center justify-between">

                <h2 className="font-semibold text-gray-800">
                  Selected Segments
                </h2>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">

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

      {/* ========================================================
          PROFESSIONAL FOOTER
      ======================================================== */}

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur">

        <div className="mx-auto w-full max-w-[1800px] px-3 py-2 md:px-5 md:py-3">

          {/* ====================================================
              MOBILE FOOTER
          ==================================================== */}

          {isMobile ? (

            <div className="space-y-2">

              {/* MOBILE ACTIONS */}

              <div className="flex items-center gap-2">

                {/* =================================================
                    LOGS / SEGMENTS TOGGLE
                    MOBILE ONLY
                ================================================= */}

                <button
                  onClick={
                    toggleMobileTab
                  }
                  className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-gray-700 px-2 text-xs font-semibold text-white shadow-sm transition hover:bg-gray-800 active:scale-[0.98]"
                  aria-label={
                    mobileTab ===
                    "logs"
                      ? "Switch to Segments"
                      : "Switch to Logs"
                  }
                >

                  <span>
                    {mobileTab ===
                    "logs"
                      ? "📝"
                      : "🎧"}
                  </span>

                  <span>
                    {mobileTab ===
                    "logs"
                      ? "Logs"
                      : "Segments"}
                  </span>

                  <span className="text-[10px] opacity-70">
                    ⇄
                  </span>

                </button>

                {/* =================================================
                    LAST
                ================================================= */}

                <button
                  onClick={
                    handleCenterLastCompleted
                  }
                  className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-purple-600 px-2 text-xs font-semibold text-white shadow-sm transition hover:bg-purple-700 active:scale-[0.98]"
                >

                  <span>
                    🎯
                  </span>

                  <span>
                    Last
                  </span>

                </button>

                {/* =================================================
                    REPROCESS
                ================================================= */}

                <button
                  onClick={
                    handleReprocessAds
                  }
                  className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
                >

                  <RefreshCw
                    size={15}
                  />

                  <span>
                    Reprocess
                  </span>

                </button>

                {/* =================================================
                    MORE
                ================================================= */}

                <div className="relative">

                  <button
                    onClick={() =>
                      setShowMenu(
                        (
                          prev
                        ) =>
                          !prev
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 transition hover:bg-gray-100"
                    aria-label="More actions"
                  >

                    <MoreVertical
                      size={18}
                    />

                  </button>

                  {showMenu && (

                    <div className="absolute bottom-11 right-0 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">

                      {/* ADD */}

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
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >

                        <Plus
                          size={16}
                        />

                        Add Segment

                      </button>

                      {/* SAVE */}

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
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >

                        <Save
                          size={16}
                        />

                        Save

                      </button>

                      {/* DOWNLOAD */}

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
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >

                        <Download
                          size={16}
                        />

                        Download Excel

                      </button>

                      {/* DELETE */}

                      <div className="border-t border-gray-100" />

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
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >

                        <Trash2
                          size={16}
                        />

                        Delete All

                      </button>

                    </div>

                  )}

                </div>

              </div>

            </div>

          ) : (

            /* ==================================================
               DESKTOP FOOTER
            ================================================== */

            <div className="space-y-2">

              <div className="flex items-center justify-between gap-4">

                {/* LEFT ACTION GROUP */}

                <div className="flex items-center gap-2">

                  {/* LAST */}

                  <button
                    onClick={
                      handleCenterLastCompleted
                    }
                    className="flex h-9 items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-purple-700 active:scale-[0.98]"
                  >

                    <span>
                      🎯
                    </span>

                    <span>
                      Last
                    </span>

                  </button>

                  {/* ADD */}

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
                    className={`flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-xs font-semibold shadow-sm transition active:scale-[0.98] ${
                      selectedP1Id !==
                        null &&
                      selectedP2Id !==
                        null
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "cursor-not-allowed bg-gray-200 text-gray-400"
                    }`}
                  >

                    <Plus
                      size={14}
                    />

                    Add

                  </button>

                </div>

                {/* RIGHT ACTION GROUP */}

                <div className="flex items-center gap-2">

                  {/* REPROCESS */}

                  <button
                    onClick={
                      handleReprocessAds
                    }
                    className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
                  >

                    <RefreshCw
                      size={14}
                    />

                    Reprocess

                  </button>

                  {/* SAVE */}

                  <button
                    onClick={
                      handleSaveAllSegments
                    }
                    disabled={
                      results.length ===
                      0
                    }
                    className="flex h-9 items-center gap-1.5 rounded-lg bg-green-600 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-green-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                  >

                    <Save
                      size={14}
                    />

                    Save

                  </button>

                  {/* DOWNLOAD */}

                  <button
                    onClick={
                      handleDownloadExcel
                    }
                    disabled={
                      results.length ===
                      0
                    }
                    className="flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                  >

                    <Download
                      size={14}
                    />

                    Download

                  </button>

                  {/* DELETE */}

                  <button
                    onClick={
                      handleDeleteAllAdvertisements
                    }
                    disabled={
                      results.length ===
                      0
                    }
                    className="flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                  >

                    <Trash2
                      size={14}
                    />

                    Delete

                  </button>

                </div>

              </div>

            </div>

          )}

          {/* ====================================================
              AUDIO PLAYER
          ==================================================== */}

          <div className="mt-2 border-t border-gray-100 pt-2">

            <AudioPlayer
              file={file}
              setFile={setFile}
              audioRef={
                audioRef
              }
              audioUrl={
                audioUrl
              }
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
