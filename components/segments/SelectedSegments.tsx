"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import BrandCombobox from "@/components/BrandCombobox";

export type AdvertisementStatus =
  | "NEW"
  | "SAVED";

interface Segment {
  id: number;

  start?: string;
  end?: string;

  text: string;

  segment_type?: string;

  brand_name?: string | null;

  status?: AdvertisementStatus;

  detection_key?: string | null;

  project_id?: number;

  segment_ids?: number[];
}

interface Props {
  segments: Segment[];

  transcriptSegments?: Segment[];

  selectedResultId: number | null;

  setSelectedResultId: (
    id: number | null
  ) => void;

  onPlay: (
    row: Segment
  ) => void;

  onUpdate?: (
    id: number,
    data: {
      text: string;
      start: string;
      end: string;
      brand_name: string;
      status: AdvertisementStatus;
      detection_key?: string | null;
      segment_ids?: number[];
    }
  ) => void;

  onRemove: (
    id: number
  ) => void | Promise<void>;

  onDownload: (
    segment: any
  ) => void;

  onSave?: (
    segments: Segment[]
  ) => void | Promise<void>;
}

const DURATION_OPTIONS = [
  5,
  10,
  15,
  20,
  25,
  30,
  35,
  40,
  45,
];

export default function SelectedSegments({
  segments,
  transcriptSegments = [],
  selectedResultId,
  setSelectedResultId,
  onPlay,
  onUpdate,
  onRemove,
  onDownload,
  onSave,
}: Props) {
  const [segmentList, setSegmentList] =
    useState<Segment[]>([]);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [brandOpenId, setBrandOpenId] =
    useState<number | null>(null);

  const [editText, setEditText] =
    useState("");

  const [editStart, setEditStart] =
    useState("");

  const [editEnd, setEditEnd] =
    useState("");

  const [editBrand, setEditBrand] =
    useState("");

  const [customDurations, setCustomDurations] =
    useState<Record<number, number>>({});

  const [durationOpenId, setDurationOpenId] =
    useState<number | null>(null);

  const [durationSearch, setDurationSearch] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const durationDropdownRef =
    useRef<HTMLDivElement | null>(null);

  /*
   * ============================================================
   * TIME
   * ============================================================
   */

  function toSeconds(
    time?: string
  ): number {
    if (!time) {
      return 0;
    }

    const value =
      String(time).trim();

    if (!value) {
      return 0;
    }

    const parts =
      value
        .split(":")
        .map(Number);

    if (
      parts.length === 3 &&
      parts.every(
        (value) =>
          !Number.isNaN(value)
      )
    ) {
      const [
        hours,
        minutes,
        seconds,
      ] = parts;

      return (
        hours * 3600 +
        minutes * 60 +
        seconds
      );
    }

    if (
      parts.length === 2 &&
      parts.every(
        (value) =>
          !Number.isNaN(value)
      )
    ) {
      const [
        minutes,
        seconds,
      ] = parts;

      return (
        minutes * 60 +
        seconds
      );
    }

    if (
      parts.length === 1 &&
      !Number.isNaN(parts[0])
    ) {
      return parts[0];
    }

    return 0;
  }

  function secondsToTime(
    totalSeconds: number
  ): string {
    totalSeconds =
      Math.max(
        0,
        Math.floor(totalSeconds)
      );

    const hours =
      Math.floor(
        totalSeconds / 3600
      );

    const minutes =
      Math.floor(
        (totalSeconds % 3600) / 60
      );

    const seconds =
      totalSeconds % 60;

    return (
      `${hours
        .toString()
        .padStart(2, "0")}:` +
      `${minutes
        .toString()
        .padStart(2, "0")}:` +
      `${seconds
        .toString()
        .padStart(2, "0")}`
    );
  }

  function getDuration(
    start?: string,
    end?: string
  ): number {
    return Math.max(
      0,
      Math.round(
        toSeconds(end) -
          toSeconds(start)
      )
    );
  }

  /*
   * ============================================================
   * DETECTION KEY
   * ============================================================
   */

  function parseDetectionKey(
    detectionKey?: string | null
  ): {
    projectId: number;
    startSegmentId: number;
    endSegmentId: number;
  } | null {
    if (!detectionKey) {
      return null;
    }

    const match =
      detectionKey.match(
        /^project-(\d+)-segments-(\d+)-(\d+)$/
      );

    if (!match) {
      return null;
    }

    return {
      projectId: Number(match[1]),
      startSegmentId: Number(match[2]),
      endSegmentId: Number(match[3]),
    };
  }

  function makeDetectionKey(
    projectId: number,
    startSegmentId: number,
    endSegmentId: number
  ): string {
    return (
      `project-${projectId}-` +
      `segments-${startSegmentId}-` +
      `${endSegmentId}`
    );
  }

  function getProjectIdFromRow(
    row: Segment
  ): number | null {
    if (
      typeof row.project_id ===
      "number"
    ) {
      return row.project_id;
    }

    const parsed =
      parseDetectionKey(
        row.detection_key
      );

    if (parsed) {
      return parsed.projectId;
    }

    return null;
  }

  /*
   * ============================================================
   * TRANSCRIPT RANGE
   * ============================================================
   */

  function getTranscriptForRange(
    start: string,
    duration: number,
    fallbackText: string
  ): string {
    if (
      transcriptSegments.length ===
      0
    ) {
      return fallbackText;
    }

    const startSeconds =
      toSeconds(start);

    const endSeconds =
      startSeconds + duration;

    const matching =
      transcriptSegments
        .filter(
          (segment) => {
            if (
              !segment.start ||
              !segment.end
            ) {
              return false;
            }

            const segmentStart =
              toSeconds(
                segment.start
              );

            const segmentEnd =
              toSeconds(
                segment.end
              );

            return (
              segmentStart <
                endSeconds &&
              segmentEnd >
                startSeconds
            );
          }
        )
        .sort(
          (a, b) =>
            toSeconds(a.start) -
            toSeconds(b.start)
        );

    const text =
      matching
        .map(
          (segment) =>
            segment.text?.trim()
        )
        .filter(Boolean)
        .join(" ");

    return (
      text || fallbackText
    );
  }

  /*
   * ============================================================
   * BACKEND STYLE MERGE
   * ============================================================
   */

  function mergeTranscriptLikeBackend(
    row: Segment,
    start: string,
    duration: number
  ): {
    text: string;
    startTime: string;
    endTime: string;
    startSegmentId: number | null;
    endSegmentId: number | null;
    segmentIds: number[];
  } {
    if (
      transcriptSegments.length ===
      0
    ) {
      return {
        text: row.text,

        startTime: start,

        endTime:
          secondsToTime(
            toSeconds(start) +
              duration
          ),

        startSegmentId: null,

        endSegmentId: null,

        segmentIds:
          row.segment_ids ?? [],
      };
    }

    const startSeconds =
      toSeconds(start);

    const targetEndSeconds =
      startSeconds + duration;

    /*
     * FIND START SEGMENT
     */

    const startSegment =
      transcriptSegments.find(
        (segment) => {
          if (
            !segment.start ||
            !segment.end
          ) {
            return false;
          }

          const segmentStart =
            toSeconds(
              segment.start
            );

          const segmentEnd =
            toSeconds(
              segment.end
            );

          return (
            segmentStart <=
              startSeconds &&
            segmentEnd >
              startSeconds
          );
        }
      );

    const exactStart =
      transcriptSegments.find(
        (segment) =>
          segment.start &&
          toSeconds(
            segment.start
          ) === startSeconds
      );

    const actualStart =
      startSegment ||
      exactStart ||
      null;

    /*
     * FIND END SEGMENT
     */

    const endSegment =
      transcriptSegments.find(
        (segment) => {
          if (
            !segment.start ||
            !segment.end
          ) {
            return false;
          }

          const segmentStart =
            toSeconds(
              segment.start
            );

          const segmentEnd =
            toSeconds(
              segment.end
            );

          return (
            segmentStart <
              targetEndSeconds &&
            segmentEnd >=
              targetEndSeconds
          );
        }
      );

    const exactEnd =
      transcriptSegments.find(
        (segment) =>
          segment.start &&
          toSeconds(
            segment.start
          ) === targetEndSeconds
      );

    const fallbackEnd =
      [...transcriptSegments]
        .filter(
          (segment) =>
            segment.start &&
            toSeconds(
              segment.start
            ) < targetEndSeconds
        )
        .sort(
          (a, b) =>
            toSeconds(a.start) -
            toSeconds(b.start)
        )
        .pop() || null;

    const actualEnd =
      endSegment ||
      exactEnd ||
      fallbackEnd ||
      actualStart ||
      null;

    /*
     * MERGE TEXT
     */

    const matchingSegments =
      transcriptSegments
        .filter(
          (segment) => {
            if (
              !segment.start ||
              !segment.end
            ) {
              return false;
            }

            const segmentStart =
              toSeconds(
                segment.start
              );

            const segmentEnd =
              toSeconds(
                segment.end
              );

            return (
              segmentStart <
                targetEndSeconds &&
              segmentEnd >
                startSeconds
            );
          }
        )
        .sort(
          (a, b) =>
            toSeconds(a.start) -
            toSeconds(b.start)
        );

    const mergedText =
      matchingSegments
        .map(
          (segment) =>
            segment.text?.trim()
        )
        .filter(Boolean)
        .join(" ");

    const startSegmentId =
      actualStart?.id ??
      null;

    const endSegmentId =
      actualEnd?.id ??
      startSegmentId;

    const segmentIds =
      matchingSegments.map(
        (segment) =>
          segment.id
      );

    if (
      startSegmentId !== null &&
      !segmentIds.includes(
        startSegmentId
      )
    ) {
      segmentIds.unshift(
        startSegmentId
      );
    }

    if (
      endSegmentId !== null &&
      !segmentIds.includes(
        endSegmentId
      )
    ) {
      segmentIds.push(
        endSegmentId
      );
    }

    const uniqueSegmentIds =
      [...new Set(segmentIds)]
        .sort(
          (a, b) => a - b
        );

    return {
      text:
        mergedText ||
        row.text,

      startTime:
        start,

      endTime:
        secondsToTime(
          targetEndSeconds
        ),

      startSegmentId,

      endSegmentId,

      segmentIds:
        uniqueSegmentIds,
    };
  }

  /*
   * ============================================================
   * SYNC FROM PARENT
   * ============================================================
   */

  useEffect(() => {
    setSegmentList(
      (previous) => {
        return segments.map(
          (incoming) => {
            const local =
              previous.find(
                (item) =>
                  item.id ===
                  incoming.id
              );

            let status:
              AdvertisementStatus;

            if (
              incoming.status ===
              "SAVED"
            ) {
              status = "SAVED";
            } else if (
              local?.status ===
              "SAVED"
            ) {
              status = "SAVED";
            } else {
              status =
                incoming.status ??
                local?.status ??
                "NEW";
            }

            if (local) {
              return {
                ...incoming,

                text:
                  local.text ??
                  incoming.text,

                start:
                  local.start ??
                  incoming.start,

                end:
                  local.end ??
                  incoming.end,

                brand_name:
                  local.brand_name ??
                  incoming.brand_name,

                detection_key:
                  local.detection_key ??
                  incoming.detection_key,

                segment_ids:
                  local.segment_ids ??
                  incoming.segment_ids,

                project_id:
                  local.project_id ??
                  incoming.project_id,

                status,
              };
            }

            return {
              ...incoming,
              status,
            };
          }
        );
      }
    );

    setCustomDurations(
      (previous) => {
        const next = {
          ...previous,
        };

        let changed = false;

        segments.forEach(
          (segment) => {
            if (
              next[segment.id] ===
              undefined
            ) {
              const duration =
                getDuration(
                  segment.start,
                  segment.end
                );

              if (
                duration > 0 &&
                !DURATION_OPTIONS.includes(
                  duration
                )
              ) {
                next[segment.id] =
                  duration;

                changed = true;
              }
            }
          }
        );

        return changed
          ? next
          : previous;
      }
    );
  }, [segments]);

  /*
   * ============================================================
   * CLOSE DROPDOWN
   * ============================================================
   */

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent
    ) {
      if (
        durationDropdownRef.current &&
        !durationDropdownRef.current.contains(
          event.target as Node
        )
      ) {
        setDurationOpenId(
          null
        );

        setDurationSearch(
          ""
        );
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  /*
   * ============================================================
   * DURATION OPTIONS
   * ============================================================
   */

  function getDurationOptions(
    id: number
  ): number[] {
    const custom =
      customDurations[id];

    if (
      custom === undefined ||
      DURATION_OPTIONS.includes(
        custom
      )
    ) {
      return DURATION_OPTIONS;
    }

    return [
      ...DURATION_OPTIONS,
      custom,
    ].sort(
      (a, b) => a - b
    );
  }

  /*
   * ============================================================
   * CHANGE DURATION
   * ============================================================
   */

  function changeDuration(
    row: Segment,
    duration: number
  ) {
    if (
      !Number.isFinite(duration) ||
      duration <= 0
    ) {
      return;
    }

    const originalStart =
      row.start ||
      "00:00:00";

    const merged =
      mergeTranscriptLikeBackend(
        row,
        originalStart,
        duration
      );

    let detectionKey =
      row.detection_key ||
      null;

    const projectId =
      getProjectIdFromRow(row);

    if (
      projectId !== null &&
      merged.startSegmentId !==
        null &&
      merged.endSegmentId !==
        null
    ) {
      detectionKey =
        makeDetectionKey(
          projectId,
          merged.startSegmentId,
          merged.endSegmentId
        );
    }

    const segmentIds =
      merged.segmentIds;

    setCustomDurations(
      (previous) => ({
        ...previous,
        [row.id]: duration,
      })
    );

    setSegmentList(
      (previous) =>
        previous.map(
          (item) =>
            item.id === row.id
              ? {
                  ...item,

                  start:
                    merged.startTime,

                  end:
                    merged.endTime,

                  text:
                    merged.text,

                  detection_key:
                    detectionKey,

                  segment_ids:
                    segmentIds,

                  status:
                    item.status ??
                    row.status ??
                    "NEW",
                }
              : item
        )
    );

    onUpdate?.(
      row.id,
      {
        text:
          merged.text,

        start:
          merged.startTime,

        end:
          merged.endTime,

        brand_name:
          row.brand_name ||
          "",

        status:
          row.status ??
          "NEW",

        detection_key:
          detectionKey,

        segment_ids:
          segmentIds,
      }
    );

    setDurationOpenId(
      null
    );

    setDurationSearch(
      ""
    );
  }

  /*
   * ============================================================
   * CUSTOM DURATION
   * ============================================================
   */

  function applyCustomDuration(
    row: Segment
  ) {
    const value =
      Number(durationSearch);

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return;
    }

    changeDuration(
      row,
      Math.floor(value)
    );
  }

  /*
   * ============================================================
   * DURATION DROPDOWN
   * ============================================================
   */

  function DurationDropdown({
    row,
    duration,
    overlapping,
    isNew,
  }: {
    row: Segment;
    duration: number;
    overlapping: boolean;
    isNew: boolean;
  }) {
    const open =
      durationOpenId === row.id;

    const search =
      durationSearch
        .trim()
        .toLowerCase();

    const options =
      getDurationOptions(
        row.id
      );

    const filtered =
      search
        ? options.filter(
            (value) =>
              String(value).includes(
                search
              )
          )
        : options;

    return (
      <div
        className="relative w-full sm:w-auto"
        ref={
          open
            ? durationDropdownRef
            : undefined
        }
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <button
          type="button"
          onClick={() => {
            setDurationOpenId(
              open
                ? null
                : row.id
            );

            setDurationSearch(
              ""
            );
          }}
          className={`
            flex
            h-10
            w-full
            min-w-0
            sm:min-w-36
            items-center
            justify-between
            rounded-lg
            border
            px-3
            text-sm
            font-semibold
            shadow-sm
            ${
              overlapping
                ? "border-red-500 bg-red-50 text-red-700"
                : isNew
                  ? "border-orange-400 bg-orange-50 text-orange-700"
                  : "border-gray-300 bg-white hover:border-blue-400"
            }
          `}
        >
          <span className="flex min-w-0 items-center gap-2">
            {overlapping && (
              <span>⚠</span>
            )}

            {!overlapping &&
              isNew && (
                <span>✨</span>
              )}

            <span className="truncate">
              {duration} seconds
            </span>
          </span>

          <span
            className={
              open
                ? "rotate-180"
                : ""
            }
          >
            ▼
          </span>
        </button>

        {open && (
          <div className="absolute left-0 right-0 z-50 mt-2 w-full min-w-56 overflow-hidden rounded-xl border bg-white shadow-xl sm:right-auto sm:w-64">
            <div className="border-b p-2">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </span>

                <input
                  autoFocus
                  type="number"
                  min={1}
                  value={
                    durationSearch
                  }
                  onChange={(e) =>
                    setDurationSearch(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key ===
                      "Enter"
                    ) {
                      applyCustomDuration(
                        row
                      );
                    }

                    if (
                      e.key ===
                      "Escape"
                    ) {
                      setDurationOpenId(
                        null
                      );

                      setDurationSearch(
                        ""
                      );
                    }
                  }}
                  placeholder="Type duration..."
                  className="h-10 w-full rounded-lg border bg-gray-50 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                />
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto p-1">
              {filtered.map(
                (value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      changeDuration(
                        row,
                        value
                      )
                    }
                    className={`
                      flex
                      w-full
                      items-center
                      justify-between
                      rounded-lg
                      px-3
                      py-2.5
                      text-left
                      text-sm
                      ${
                        value ===
                        duration
                          ? "bg-blue-50 font-semibold text-blue-700"
                          : "hover:bg-gray-50"
                      }
                    `}
                  >
                    <span>
                      {value} seconds
                    </span>

                    {value ===
                      duration && (
                      <span>
                        ✓
                      </span>
                    )}
                  </button>
                )
              )}

              {filtered.length ===
                0 && (
                <div className="px-3 py-3 text-sm text-gray-500">
                  No preset duration found.
                </div>
              )}
            </div>

            <div className="border-t p-2">
              <button
                type="button"
                disabled={
                  !durationSearch ||
                  Number(
                    durationSearch
                  ) <= 0
                }
                onClick={() =>
                  applyCustomDuration(
                    row
                  )
                }
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold hover:bg-gray-50 disabled:opacity-40"
              >
                ✏ Custom duration
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /*
   * ============================================================
   * EDIT
   * ============================================================
   */

  function edit(
    row: Segment
  ) {
    setEditingId(row.id);

    setBrandOpenId(
      null
    );

    setEditText(
      row.text || ""
    );

    setEditStart(
      row.start ||
        "00:00:00"
    );

    setEditEnd(
      row.end ||
        "00:00:00"
    );

    setEditBrand(
      row.brand_name ||
        ""
    );
  }

  /*
   * ============================================================
   * EDIT DURATION
   * ============================================================
   */

  function changeEditDuration(
    duration: number
  ) {
    const start =
      editStart ||
      "00:00:00";

    const newEnd =
      secondsToTime(
        toSeconds(start) +
          duration
      );

    const newText =
      getTranscriptForRange(
        start,
        duration,
        editText
      );

    setEditEnd(
      newEnd
    );

    setEditText(
      newText
    );
  }

  /*
   * ============================================================
   * EDIT START
   * ============================================================
   */

  function changeEditStart(
    value: string
  ) {
    const currentDuration =
      getDuration(
        editStart,
        editEnd
      );

    const duration =
      currentDuration > 0
        ? currentDuration
        : 30;

    const newEnd =
      secondsToTime(
        toSeconds(value) +
          duration
      );

    const newText =
      getTranscriptForRange(
        value,
        duration,
        editText
      );

    setEditStart(
      value
    );

    setEditEnd(
      newEnd
    );

    setEditText(
      newText
    );
  }

  /*
   * ============================================================
   * SAVE EDIT
   * ============================================================
   */

  function saveEdit(
    row: Segment
  ) {
    const duration =
      getDuration(
        editStart,
        editEnd
      );

    const merged =
      mergeTranscriptLikeBackend(
        row,
        editStart,
        duration
      );

    let detectionKey =
      row.detection_key ||
      null;

    const projectId =
      getProjectIdFromRow(row);

    if (
      projectId !== null &&
      merged.startSegmentId !==
        null &&
      merged.endSegmentId !==
        null
    ) {
      detectionKey =
        makeDetectionKey(
          projectId,
          merged.startSegmentId,
          merged.endSegmentId
        );
    }

    const segmentIds =
      merged.segmentIds;

    const data = {
      text:
        merged.text ||
        editText,

      start:
        merged.startTime,

      end:
        merged.endTime,

      brand_name:
        editBrand,

      status:
        row.status ??
        "NEW",

      detection_key:
        detectionKey,

      segment_ids:
        segmentIds,
    };

    setSegmentList(
      (previous) =>
        previous
          .map(
            (item) =>
              item.id === row.id
                ? {
                    ...item,

                    ...data,

                    segment_ids:
                      segmentIds,

                    detection_key:
                      detectionKey,
                  }
                : item
          )
          .sort(
            (a, b) =>
              toSeconds(
                a.start
              ) -
              toSeconds(
                b.start
              )
          )
    );

    setEditingId(
      null
    );

    setBrandOpenId(
      null
    );

    onUpdate?.(
      row.id,
      data
    );
  }

  /*
   * ============================================================
   * BRAND
   * ============================================================
   */

  function updateBrand(
    row: Segment,
    value: string
  ) {
    setEditBrand(
      value
    );

    setSegmentList(
      (previous) =>
        previous.map(
          (item) =>
            item.id === row.id
              ? {
                  ...item,

                  brand_name:
                    value,
                }
              : item
        )
    );
  }

  /*
   * ============================================================
   * DELETE
   * ============================================================
   */

  async function deleteSegment(
    id: number
  ) {
    if (
      deletingId !== null
    ) {
      return;
    }

    const row =
      segmentList.find(
        (item) =>
          item.id === id
      );

    if (!row) {
      return;
    }

    const status =
      row.status ?? "NEW";

    const confirmed =
      window.confirm(
        `Delete this advertisement?\n\n` +
        `Advertisement ID: ${id}\n` +
        `Status: ${status}\n\n` +
        `This will permanently delete the advertisement from the database.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);

      await onRemove(id);

      setSegmentList(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !== id
          )
      );

      if (
        selectedResultId === id
      ) {
        setSelectedResultId(
          null
        );
      }

      if (
        editingId === id
      ) {
        setEditingId(
          null
        );
      }

      if (
        brandOpenId === id
      ) {
        setBrandOpenId(
          null
        );
      }

      if (
        durationOpenId === id
      ) {
        setDurationOpenId(
          null
        );
      }

      setDurationSearch(
        ""
      );

      setCustomDurations(
        (previous) => {
          const next = {
            ...previous,
          };

          delete next[id];

          return next;
        }
      );
    } catch (error) {
      console.error(
        "DATABASE DELETE FAILED:",
        error
      );

      alert(
        "Failed to delete advertisement from the database. The advertisement was NOT removed."
      );
    } finally {
      setDeletingId(
        null
      );
    }
  }

  /*
   * ============================================================
   * CANCEL EDIT
   * ============================================================
   */

  function cancelEdit() {
    setEditingId(
      null
    );

    setBrandOpenId(
      null
    );

    setEditText(
      ""
    );

    setEditStart(
      ""
    );

    setEditEnd(
      ""
    );

    setEditBrand(
      ""
    );
  }

  /*
   * ============================================================
   * TIME INPUT
   * ============================================================
   */

  function TimeInput({
    value,
    onChange,
  }: {
    value: string;

    onChange: (
      value: string
    ) => void;
  }) {
    return (
      <input
        type="text"
        value={value}
        maxLength={8}
        placeholder="00:00:00"
        onClick={(e) =>
          e.stopPropagation()
        }
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        className="
          h-10
          w-full
          rounded-lg
          border
          px-2
          text-center
          text-sm
          font-semibold
          sm:w-24
        "
      />
    );
  }

  /*
   * ============================================================
   * SAVE ALL
   * ============================================================
   */

  async function saveAll() {
    if (saving) {
      return;
    }

    const newAdvertisements =
      segmentList.filter(
        (item) =>
          item.status ===
          "NEW"
      );

    if (
      newAdvertisements.length ===
      0
    ) {
      return;
    }

    if (!onSave) {
      return;
    }

    try {
      setSaving(true);

      await onSave(
        newAdvertisements
      );

      const savedIds =
        new Set(
          newAdvertisements.map(
            (item) =>
              item.id
          )
        );

      setSegmentList(
        (previous) =>
          previous.map(
            (item) =>
              savedIds.has(
                item.id
              )
                ? {
                    ...item,

                    status:
                      "SAVED",
                  }
                : item
          )
      );
    } catch (error) {
      console.error(
        "SAVE ALL FAILED:",
        error
      );

      alert(
        "Failed to save advertisements. They will remain NEW."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ============================================================
   * OVERLAP
   * ============================================================
   */

  function segmentsOverlap(
    a: Segment,
    b: Segment
  ): boolean {
    if (
      !a.start ||
      !a.end ||
      !b.start ||
      !b.end
    ) {
      return false;
    }

    const aStart =
      toSeconds(a.start);

    const aEnd =
      toSeconds(a.end);

    const bStart =
      toSeconds(b.start);

    const bEnd =
      toSeconds(b.end);

    return (
      aStart < bEnd &&
      aEnd > bStart
    );
  }

  function getOverlappingIds(
    list: Segment[]
  ): Set<number> {
    const ids =
      new Set<number>();

    for (
      let i = 0;
      i < list.length;
      i++
    ) {
      for (
        let j = i + 1;
        j < list.length;
        j++
      ) {
        if (
          segmentsOverlap(
            list[i],
            list[j]
          )
        ) {
          ids.add(
            list[i].id
          );

          ids.add(
            list[j].id
          );
        }
      }
    }

    return ids;
  }

  /*
   * ============================================================
   * SORT / COUNTS
   * ============================================================
   */

  const sortedSegments =
    [...segmentList]
      .map((item) => ({
        ...item,

        status:
          item.status ??
          "NEW",
      }))
      .sort(
        (a, b) =>
          toSeconds(a.start) -
          toSeconds(b.start)
      );

  const overlappingIds =
    getOverlappingIds(
      sortedSegments
    );

  const newDetectedCount =
    sortedSegments.filter(
      (item) =>
        item.status ===
        "NEW"
    ).length;

  const savedCount =
    sortedSegments.filter(
      (item) =>
        item.status ===
        "SAVED"
    ).length;

  /*
   * ============================================================
   * UI
   * ============================================================
   */

  return (
    <div className="space-y-4">

      {/* ========================================================
          HEADER
          ======================================================== */}

      <div
        className="
          rounded-xl
          border
          bg-white
          p-3
          shadow-sm
          sm:p-4
        "
      >
        <div
          className="
            flex
            flex-col
            gap-4
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >
          <div className="min-w-0">
            <h2 className="text-base font-bold sm:text-lg">
              📢 Selected Advertisements
            </h2>

            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
              Review detected advertisements before saving.
            </p>
          </div>

          <div
            className="
              grid
              grid-cols-2
              gap-2
              sm:flex
              sm:flex-wrap
              sm:items-center
            "
          >
            {newDetectedCount >
              0 && (
              <div className="rounded-lg border border-orange-300 bg-orange-100 px-3 py-2 text-center text-xs font-bold text-orange-700">
                ✨ {newDetectedCount} new
              </div>
            )}

            {savedCount >
              0 && (
              <div className="rounded-lg border border-green-300 bg-green-100 px-3 py-2 text-center text-xs font-bold text-green-700">
                ✓ {savedCount} saved
              </div>
            )}

            {overlappingIds.size >
              0 && (
              <div className="rounded-lg border border-red-300 bg-red-100 px-3 py-2 text-center text-xs font-bold text-red-700">
                ⚠ {overlappingIds.size} overlapping
              </div>
            )}

            <button
              type="button"
              onClick={saveAll}
              disabled={
                newDetectedCount ===
                  0 ||
                saving
              }
              className="
                col-span-2
                h-10
                rounded-lg
                bg-blue-600
                px-5
                text-sm
                font-semibold
                text-white
                hover:bg-blue-700
                disabled:cursor-not-allowed
                disabled:opacity-50
                sm:col-span-1
              "
            >
              {saving
                ? "💾 Saving..."
                : `💾 Save ${
                    newDetectedCount >
                    0
                      ? `(${newDetectedCount})`
                      : "All"
                  }`}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          EMPTY
          ======================================================== */}

      {sortedSegments.length ===
        0 && (
        <div className="rounded-2xl border border-dashed bg-white p-8 text-center sm:p-10">
          <div className="text-4xl">
            📭
          </div>

          <h3 className="mt-3 font-semibold text-gray-700">
            No selected advertisements
          </h3>
        </div>
      )}

      {/* ========================================================
          ADVERTISEMENT LIST
          ======================================================== */}

      {sortedSegments.map(
        (row, index) => {
          const selected =
            selectedResultId ===
            row.id;

          const overlapping =
            overlappingIds.has(
              row.id
            );

          const isNew =
            row.status ===
            "NEW";

          const isSaved =
            row.status ===
            "SAVED";

          const isDeleting =
            deletingId ===
            row.id;

          const duration =
            getDuration(
              row.start,
              row.end
            );

          const editDuration =
            getDuration(
              editStart,
              editEnd
            );

          const cardClass =
            overlapping
              ? "border-red-500 bg-red-50 ring-2 ring-red-300"
              : isNew
                ? "border-orange-400 bg-orange-50 ring-2 ring-orange-300"
                : isSaved
                  ? "border-green-400 bg-green-50"
                  : selected
                    ? "border-blue-300 bg-blue-50 ring-2 ring-blue-300"
                    : "border-gray-200 bg-white";

          const numberClass =
            overlapping
              ? "bg-red-600 text-white"
              : isNew
                ? "bg-orange-500 text-white"
                : isSaved
                  ? "bg-green-600 text-white"
                  : "bg-gray-100";

          return (
            <div
              key={
                row.detection_key ||
                row.id
              }
              id={`segment-${row.id}`}
              onClick={(e) => {
                const target =
                  e.target as HTMLElement;

                if (
                  target.closest(
                    "button"
                  ) ||
                  target.closest(
                    "input"
                  ) ||
                  target.closest(
                    "textarea"
                  ) ||
                  target.closest(
                    "select"
                  ) ||
                  target.closest(
                    ".brand-combobox"
                  )
                ) {
                  return;
                }

                setSelectedResultId(
                  row.id
                );
              }}
              className={`
                relative
                overflow-visible
                rounded-2xl
                border
                p-3
                shadow-sm
                transition-all
                sm:p-5
                ${cardClass}
                ${
                  isDeleting
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              `}
            >

              {/* ==================================================
                  STATUS MESSAGE
                  ================================================== */}

              {overlapping && (
                <div className="mb-3 flex items-start gap-3 rounded-xl border border-red-300 bg-red-100 px-3 py-3 text-red-700 sm:mb-4 sm:px-4">
                  <span className="text-lg sm:text-xl">
                    ⚠
                  </span>

                  <div className="min-w-0">
                    <div className="text-sm font-bold sm:text-base">
                      OVERLAPPING ADVERTISEMENT
                    </div>

                    <div className="mt-1 text-xs">
                      This advertisement overlaps another selected advertisement.
                    </div>
                  </div>
                </div>
              )}

              {isNew && (
                <div className="mb-3 flex items-start gap-3 rounded-xl border border-orange-300 bg-orange-100 px-3 py-3 text-orange-700 sm:mb-4 sm:px-4">
                  <span className="text-lg sm:text-xl">
                    ✨
                  </span>

                  <div className="min-w-0">
                    <div className="text-sm font-bold sm:text-base">
                      NEW DETECTED ADVERTISEMENT
                    </div>

                    <div className="mt-1 text-xs">
                      This advertisement was detected during the latest processing and has not been saved yet.
                    </div>
                  </div>
                </div>
              )}

              {isSaved &&
                !overlapping && (
                  <div className="mb-3 flex items-start gap-3 rounded-xl border border-green-300 bg-green-100 px-3 py-3 text-green-700 sm:mb-4 sm:px-4">
                    <span className="text-lg sm:text-xl">
                      💾
                    </span>

                    <div className="min-w-0">
                      <div className="text-sm font-bold sm:text-base">
                        SAVED ADVERTISEMENT
                      </div>

                      <div className="mt-1 text-xs">
                        This advertisement has already been saved.
                      </div>
                    </div>
                  </div>
                )}

              {/* ==================================================
                  TOP SECTION
                  ================================================== */}

              <div
                className="
                  flex
                  flex-col
                  gap-4
                  lg:flex-row
                  lg:items-start
                  lg:justify-between
                "
              >

                {/* ------------------------------------------------
                    LEFT / INFORMATION
                    ------------------------------------------------ */}

                <div
                  className="
                    flex
                    min-w-0
                    flex-1
                    gap-3
                    sm:gap-4
                  "
                >

                  {/* NUMBER */}

                  <div
                    className={`
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      text-sm
                      font-bold
                      sm:h-10
                      sm:w-10
                      sm:text-base
                      ${numberClass}
                    `}
                  >
                    {index + 1}
                  </div>

                  {/* INFORMATION */}

                  <div className="min-w-0 flex-1">

                    <div>
                      <h3 className="font-bold">
                        Advertisement
                      </h3>

                      <p className="text-xs text-gray-500">
                        ID: {row.id}
                      </p>

                      {row.segment_ids &&
                        row.segment_ids.length > 0 && (
                          <p className="mt-1 break-all font-mono text-[11px] text-gray-400">
                            segment_ids: [{row.segment_ids.join(", ")}]
                          </p>
                        )}
                    </div>

                    {/* MOBILE STATUS BADGES */}

                    <div
                      className="
                        mt-3
                        flex
                        flex-wrap
                        gap-2
                        lg:hidden
                      "
                    >
                      {overlapping && (
                        <span className="rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold text-white">
                          ⚠ OVERLAPPING
                        </span>
                      )}

                      {isNew && (
                        <span className="rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-bold text-white">
                          ✨ NEW DETECTED
                        </span>
                      )}

                      {isSaved && (
                        <span className="rounded-full bg-green-600 px-2.5 py-1 text-[10px] font-bold text-white">
                          ✓ SAVED
                        </span>
                      )}
                    </div>

                    {/* BRAND */}

                    <label className="mb-2 mt-4 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Brand
                    </label>

                    {editingId ===
                    row.id ? (
                      <div
                        className="brand-combobox w-full"
                        onClick={(e) =>
                          e.stopPropagation()
                        }
                      >
                        <BrandCombobox
                          value={
                            editBrand
                          }
                          open={
                            brandOpenId ===
                            row.id
                          }
                          onOpenChange={(
                            open
                          ) =>
                            setBrandOpenId(
                              open
                                ? row.id
                                : null
                            )
                          }
                          onChange={(
                            value
                          ) => {
                            updateBrand(
                              row,
                              value
                            );

                            setBrandOpenId(
                              null
                            );
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        className={`
                          min-h-11
                          w-full
                          rounded-xl
                          border
                          px-3
                          py-2
                          sm:px-4
                          ${
                            overlapping
                              ? "border-red-300 bg-red-100"
                              : isNew
                                ? "border-orange-300 bg-orange-100"
                                : isSaved
                                  ? "border-green-300 bg-green-100"
                                  : "border-gray-300 bg-gray-50"
                          }
                        `}
                      >
                        <div className="flex min-w-0 items-start gap-2">
                          <span className="shrink-0 text-lg">
                            🏷
                          </span>

                          <span className="break-words text-sm font-semibold leading-6 text-gray-800">
                            {row.brand_name ||
                              "No brand selected"}
                          </span>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* ==================================================
                    ACTION BUTTONS
                    ================================================== */}

                <div
                  className="
                    flex
                    w-full
                    shrink-0
                    items-center
                    gap-2
                    border-t
                    pt-3
                    lg:w-auto
                    lg:border-0
                    lg:pt-0
                  "
                >

                  {/* PLAY */}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlay(row);
                    }}
                    className="
                      flex
                      h-10
                      flex-1
                      items-center
                      justify-center
                      rounded-lg
                      bg-green-500
                      text-white
                      hover:bg-green-600
                      lg:w-10
                      lg:flex-none
                    "
                    title="Play advertisement"
                  >
                    ▶
                    <span className="ml-2 text-xs font-semibold lg:hidden">
                      Play
                    </span>
                  </button>

                  {/* EDIT */}

                  {editingId ===
                  row.id ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();

                        saveEdit(
                          row
                        );
                      }}
                      className="
                        flex
                        h-10
                        flex-1
                        items-center
                        justify-center
                        gap-1
                        rounded-lg
                        bg-blue-600
                        px-3
                        text-sm
                        font-semibold
                        text-white
                        hover:bg-blue-700
                        lg:flex-none
                      "
                    >
                      💾
                      <span className="lg:hidden">
                        Save
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();

                        edit(row);
                      }}
                      className="
                        flex
                        h-10
                        flex-1
                        items-center
                        justify-center
                        gap-1
                        rounded-lg
                        bg-gray-100
                        hover:bg-gray-200
                        lg:w-10
                        lg:flex-none
                      "
                      title="Edit advertisement"
                    >
                      ✏️
                      <span className="text-xs font-semibold lg:hidden">
                        Edit
                      </span>
                    </button>
                  )}

                  {/* DELETE */}

                  <button
                    type="button"
                    disabled={
                      isDeleting
                    }
                    onClick={(e) => {
                      e.stopPropagation();

                      void deleteSegment(
                        row.id
                      );
                    }}
                    className="
                      flex
                      h-10
                      flex-1
                      items-center
                      justify-center
                      gap-1
                      rounded-lg
                      bg-red-50
                      hover:bg-red-100
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                      lg:w-10
                      lg:flex-none
                    "
                    title={`Delete advertisement ${row.id}`}
                  >
                    {isDeleting
                      ? "..."
                      : "🗑"}

                    <span className="text-xs font-semibold text-red-700 lg:hidden">
                      Delete
                    </span>
                  </button>

                </div>

                {/* DESKTOP STATUS BADGES */}

                <div
                  className="
                    hidden
                    shrink-0
                    flex-wrap
                    items-center
                    justify-end
                    gap-2
                    lg:flex
                  "
                >
                  {overlapping && (
                    <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                      ⚠ OVERLAPPING
                    </span>
                  )}

                  {isNew && (
                    <span className="animate-pulse rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">
                      ✨ NEW DETECTED
                    </span>
                  )}

                  {isSaved && (
                    <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white">
                      ✓ SAVED
                    </span>
                  )}
                </div>

              </div>

              {/* ==================================================
                  TRANSCRIPT
                  ================================================== */}

              <div className="mt-4 sm:mt-5">

                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Transcript
                </label>

                <div
                  className={`
                    rounded-xl
                    p-3
                    sm:p-4
                    ${
                      overlapping
                        ? "bg-red-100"
                        : isNew
                          ? "bg-orange-100"
                          : isSaved
                            ? "bg-green-100"
                            : "bg-gray-50"
                    }
                  `}
                >
                  {editingId ===
                  row.id ? (
                    <textarea
                      value={
                        editText
                      }
                      rows={5}
                      onClick={(e) =>
                        e.stopPropagation()
                      }
                      onChange={(e) =>
                        setEditText(
                          e.target.value
                        )
                      }
                      className="
                        w-full
                        rounded-lg
                        border
                        p-3
                        text-sm
                        outline-none
                        focus:border-blue-400
                      "
                    />
                  ) : (
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 sm:text-base sm:leading-7">
                      {row.text}
                    </p>
                  )}
                </div>

              </div>

              {/* ==================================================
                  TIME SECTION
                  ================================================== */}

              <div
                className={`
                  mt-4
                  rounded-xl
                  border
                  p-3
                  sm:mt-5
                  sm:p-4
                  ${
                    overlapping
                      ? "border-red-300 bg-red-100"
                      : isNew
                        ? "border-orange-300 bg-orange-100"
                        : isSaved
                          ? "border-green-300 bg-green-100"
                          : "border-gray-200 bg-gray-50"
                  }
                `}
              >

                {/* TIME HEADER */}

                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    ⏱ Time
                  </div>

                  {overlapping && (
                    <div className="text-[10px] font-bold text-red-600 sm:text-xs">
                      ⚠ TIME RANGE CONFLICT
                    </div>
                  )}

                  {isNew &&
                    !overlapping && (
                      <div className="text-[10px] font-bold text-orange-600 sm:text-xs">
                        ✨ NEW TIME RANGE
                      </div>
                    )}

                  {isSaved &&
                    !overlapping && (
                      <div className="text-[10px] font-bold text-green-600 sm:text-xs">
                        ✓ SAVED TIME RANGE
                      </div>
                    )}

                </div>

                {/* ==================================================
                    EDITING TIME
                    ================================================== */}

                {editingId ===
                row.id ? (
                  <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-end">

                    {/* START */}

                    <div className="min-w-0 flex-1 sm:flex-none">
                      <span className="mb-1 block text-xs text-gray-500">
                        Start
                      </span>

                      <TimeInput
                        value={
                          editStart
                        }
                        onChange={
                          changeEditStart
                        }
                      />
                    </div>

                    <div className="hidden pb-2 text-gray-400 sm:block">
                      →
                    </div>

                    {/* DURATION */}

                    <div className="min-w-0 flex-1 sm:flex-none">
                      <span className="mb-1 block text-xs text-gray-500">
                        Duration
                      </span>

                      <select
                        value={
                          editDuration
                        }
                        onChange={(e) =>
                          changeEditDuration(
                            Number(
                              e.target
                                .value
                            )
                          )
                        }
                        onClick={(e) =>
                          e.stopPropagation()
                        }
                        className="
                          h-10
                          w-full
                          rounded-lg
                          border
                          bg-white
                          px-3
                          text-sm
                          font-semibold
                          sm:min-w-32
                        "
                      >
                        {getDurationOptions(
                          row.id
                        ).map(
                          (
                            value
                          ) => (
                            <option
                              key={
                                value
                              }
                              value={
                                value
                              }
                            >
                              {
                                value
                              }{" "}
                              seconds
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className="hidden pb-2 text-gray-400 sm:block">
                      →
                    </div>

                    {/* END */}

                    <div className="min-w-0 flex-1 sm:flex-none">
                      <span className="mb-1 block text-xs text-gray-500">
                        End
                      </span>

                      <TimeInput
                        value={
                          editEnd
                        }
                        onChange={
                          setEditEnd
                        }
                      />
                    </div>

                  </div>
                ) : (

                  /* ==================================================
                     DISPLAY TIME
                     ================================================== */

                  <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-end sm:gap-3">

                    {/* START */}

                    <div className="min-w-0">
                      <span className="mb-1 block text-[10px] text-gray-500 sm:text-xs">
                        Start
                      </span>

                      <span
                        className={`
                          flex
                          h-10
                          w-full
                          items-center
                          justify-center
                          overflow-hidden
                          rounded-lg
                          border
                          bg-white
                          px-1
                          text-[11px]
                          font-semibold
                          sm:w-auto
                          sm:px-3
                          sm:text-sm
                          ${
                            overlapping
                              ? "border-red-300 text-red-700"
                              : isNew
                                ? "border-orange-300 text-orange-700"
                                : isSaved
                                  ? "border-green-300 text-green-700"
                                  : "border-gray-300"
                          }
                        `}
                      >
                        {row.start ||
                          "00:00:00"}
                      </span>
                    </div>

                    {/* DURATION */}

                    <div className="min-w-0">
                      <span className="mb-1 block text-[10px] text-gray-500 sm:text-xs">
                        Duration
                      </span>

                      <DurationDropdown
                        row={row}
                        duration={
                          duration
                        }
                        overlapping={
                          overlapping
                        }
                        isNew={
                          isNew
                        }
                      />
                    </div>

                    {/* END */}

                    <div className="min-w-0">
                      <span className="mb-1 block text-[10px] text-gray-500 sm:text-xs">
                        End
                      </span>

                      <span
                        className={`
                          flex
                          h-10
                          w-full
                          items-center
                          justify-center
                          overflow-hidden
                          rounded-lg
                          border
                          bg-white
                          px-1
                          text-[11px]
                          font-semibold
                          sm:w-auto
                          sm:px-3
                          sm:text-sm
                          ${
                            overlapping
                              ? "border-red-300 text-red-700"
                              : isNew
                                ? "border-orange-300 text-orange-700"
                                : isSaved
                                  ? "border-green-300 text-green-700"
                                  : "border-gray-300"
                          }
                        `}
                      >
                        {row.end ||
                          "00:00:00"}
                      </span>
                    </div>

                  </div>
                )}

                {/* ==================================================
                    SOURCE SEGMENTS
                    ================================================== */}

                {row.segment_ids &&
                  row.segment_ids.length >
                    0 && (
                  <div className="mt-3 rounded-lg border bg-white px-3 py-2">

                    <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 sm:text-xs">
                      Source Transcript Segments
                    </div>

                    <div className="mt-1 break-all font-mono text-[10px] leading-4 text-gray-700 sm:text-xs">
                      [
                      {
                        row.segment_ids.join(
                          ", "
                        )
                      }
                      ]
                    </div>

                  </div>
                )}

              </div>

            </div>
          );
        }
      )}
    </div>
  );
}