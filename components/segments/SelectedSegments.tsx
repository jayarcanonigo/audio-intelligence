"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import BrandCombobox from "@/components/BrandCombobox";

interface Segment {
  id: number;
  start?: string;
  end?: string;
  text: string;
  segment_type?: string;
  brand_name?: string;
  status?: "pending" | "completed";
}

interface Props {
  segments: Segment[];

  // Original/full transcript segments
  transcriptSegments?: Segment[];

  selectedResultId: number | null;
  setSelectedResultId: (id: number | null) => void;

  onPlay: (row: Segment) => void;

  onUpdate?: (
    id: number,
    data: {
      text: string;
      start: string;
      end: string;
      brand_name: string;
      status: "pending" | "completed";
    }
  ) => void;

  onRemove?: (id: number) => void;

  onSave?: (segments: Segment[]) => void;

  onDownload?: (segment: Segment) => void;
}

/*
 * ============================================================
 * DURATION OPTIONS
 * ============================================================
 */

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
  onSave,
}: Props) {
  /*
   * ============================================================
   * STATE
   * ============================================================
   */

  const [segmentList, setSegmentList] =
    useState<Segment[]>(segments);

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

  /*
   * Custom duration is stored for durations
   * that are not part of the preset list.
   */
  const [customDurations, setCustomDurations] =
    useState<Record<number, number>>({});

  /*
   * Duration dropdown
   */
  const [durationOpenId, setDurationOpenId] =
    useState<number | null>(null);

  const [durationSearch, setDurationSearch] =
    useState("");

  const durationDropdownRef =
    useRef<HTMLDivElement | null>(null);

  /*
   * ============================================================
   * TIME HELPERS
   * ============================================================
   */

  function toSeconds(
    time?: string
  ): number {
    if (!time) return 0;

    const value =
      String(time).trim();

    if (!value) return 0;

    const parts =
      value.split(":").map(Number);

    if (
      parts.length === 3 &&
      parts.every(
        (value) =>
          !Number.isNaN(value)
      )
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
      parts.length === 2 &&
      parts.every(
        (value) =>
          !Number.isNaN(value)
      )
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
    totalSeconds = Math.max(
      0,
      Math.floor(totalSeconds)
    );

    const hours =
      Math.floor(
        totalSeconds / 3600
      );

    const minutes =
      Math.floor(
        (totalSeconds % 3600) /
          60
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
   * OVERLAP DETECTION
   * ============================================================
   *
   * A overlaps B when:
   *
   * A.start < B.end
   * AND
   * A.end > B.start
   *
   * Example:
   *
   * Ad 1: 10:00 -> 10:30
   * Ad 2: 10:20 -> 10:50
   *
   * Both are highlighted.
   */

  function isRangeOverlapping(
    startA?: string,
    endA?: string,
    startB?: string,
    endB?: string
  ): boolean {
    if (
      !startA ||
      !endA ||
      !startB ||
      !endB
    ) {
      return false;
    }

    const aStart =
      toSeconds(startA);

    const aEnd =
      toSeconds(endA);

    const bStart =
      toSeconds(startB);

    const bEnd =
      toSeconds(endB);

    if (aEnd <= aStart) {
      return false;
    }

    if (bEnd <= bStart) {
      return false;
    }

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
        const first =
          list[i];

        const second =
          list[j];

        if (
          isRangeOverlapping(
            first.start,
            first.end,
            second.start,
            second.end
          )
        ) {
          ids.add(first.id);
          ids.add(second.id);
        }
      }
    }

    return ids;
  }

  /*
   * ============================================================
   * CLOSE DURATION DROPDOWN
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
        setDurationOpenId(null);
        setDurationSearch("");
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
   * SYNC PARENT SEGMENTS
   * ============================================================
   */

  useEffect(() => {
    setSegmentList((prev) =>
      segments.map(
        (incoming) => {
          const local =
            prev.find(
              (item) =>
                item.id ===
                incoming.id
            );

          return {
            ...incoming,

            status:
              incoming.status ??
              local?.status ??
              "completed",
          };
        }
      )
    );

    /*
     * Remember custom durations
     * such as 37 seconds.
     */
    setCustomDurations(
      (prev) => {
        const next = {
          ...prev,
        };

        let changed = false;

        segments.forEach(
          (seg) => {
            if (
              next[seg.id] ===
              undefined
            ) {
              const duration =
                getDuration(
                  seg.start,
                  seg.end
                );

              if (
                duration > 0 &&
                !DURATION_OPTIONS.includes(
                  duration
                )
              ) {
                next[seg.id] =
                  duration;

                changed = true;
              }
            }
          }
        );

        return changed
          ? next
          : prev;
      }
    );
  }, [segments]);

  /*
   * ============================================================
   * DURATION OPTIONS
   * ============================================================
   */

  function getDurationOptions(
    rowId: number
  ): number[] {
    const custom =
      customDurations[rowId];

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
   * TRANSCRIPT RANGE
   * ============================================================
   */

  function getTranscriptForRange(
    start: string,
    duration: number,
    fallbackText: string
  ): string {
    if (
      !transcriptSegments ||
      transcriptSegments.length === 0
    ) {
      return fallbackText;
    }

    const startSeconds =
      toSeconds(start);

    const endSeconds =
      startSeconds +
      duration;

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

            /*
             * Segment overlaps
             * selected duration.
             */
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
            toSeconds(
              a.start
            ) -
            toSeconds(
              b.start
            )
        );

    const text =
      matchingSegments
        .map(
          (segment) =>
            segment.text?.trim()
        )
        .filter(Boolean)
        .join(" ");

    return (
      text ||
      fallbackText
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

    const start =
      row.start ||
      "00:00:00";

    const newEnd =
      secondsToTime(
        toSeconds(start) +
          duration
      );

    /*
     * Rebuild transcript
     * according to new duration.
     */
    const newText =
      getTranscriptForRange(
        start,
        duration,
        row.text
      );

    /*
     * Remember custom duration.
     */
    setCustomDurations(
      (prev) => ({
        ...prev,
        [row.id]:
          duration,
      })
    );

    /*
     * Update local UI immediately.
     *
     * This also causes overlap
     * detection to run again.
     */
    setSegmentList(
      (prev) =>
        prev.map(
          (item) =>
            item.id === row.id
              ? {
                  ...item,
                  start,
                  end: newEnd,
                  text: newText,
                  status:
                    "completed",
                }
              : item
        )
    );

    /*
     * Update parent/database.
     */
    onUpdate?.(
      row.id,
      {
        text: newText,
        start,
        end: newEnd,
        brand_name:
          row.brand_name ||
          "",
        status:
          "completed",
      }
    );

    /*
     * Close dropdown.
     */
    setDurationOpenId(null);
    setDurationSearch("");
  }

  /*
   * ============================================================
   * FILTER DURATION OPTIONS
   * ============================================================
   */

  function getFilteredDurations(
    rowId: number
  ): number[] {
    const options =
      getDurationOptions(
        rowId
      );

    const search =
      durationSearch
        .trim()
        .toLowerCase();

    if (!search) {
      return options;
    }

    return options.filter(
      (value) =>
        String(value).includes(
          search
        )
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
      Number(
        durationSearch
      );

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
   * EDITABLE DURATION DROPDOWN
   * ============================================================
   */

  function DurationDropdown({
    row,
    duration,
    overlapping,
  }: {
    row: Segment;
    duration: number;
    overlapping: boolean;
  }) {
    const isOpen =
      durationOpenId ===
      row.id;

    const filtered =
      getFilteredDurations(
        row.id
      );

    return (
      <div
        ref={
          isOpen
            ? durationDropdownRef
            : undefined
        }
        className="relative"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        {/* CURRENT DURATION */}

        <button
          type="button"
          onClick={() => {
            setDurationOpenId(
              isOpen
                ? null
                : row.id
            );

            setDurationSearch("");
          }}
          className={`
            flex
            h-10
            min-w-36
            items-center
            justify-between
            gap-3
            rounded-lg
            border
            bg-white
            px-3
            text-sm
            font-semibold
            shadow-sm
            transition

            ${
              overlapping
                ? "border-red-500 bg-red-50 text-red-700 ring-2 ring-red-100"
                : "border-gray-300 hover:border-blue-400"
            }
          `}
        >

          <span className="flex items-center gap-2">

            {overlapping && (
              <span>
                ⚠
              </span>
            )}

            <span>
              {duration} seconds
            </span>

          </span>

          <span
            className={`
              text-xs
              transition-transform

              ${
                isOpen
                  ? "rotate-180"
                  : ""
              }
            `}
          >
            ▼
          </span>

        </button>

        {/* DROPDOWN */}

        {isOpen && (
          <div className="absolute left-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">

            {/* SEARCH */}

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
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />

              </div>

            </div>

            {/* PRESET DURATIONS */}

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
                      transition

                      ${
                        value ===
                        duration
                          ? "bg-blue-50 font-semibold text-blue-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }
                    `}
                  >

                    <span>
                      {value} seconds
                    </span>

                    {value ===
                      duration && (
                      <span className="font-bold text-blue-600">
                        ✓
                      </span>
                    )}

                  </button>
                )
              )}

              {filtered.length ===
                0 &&
                durationSearch && (
                  <div className="px-3 py-3 text-sm text-gray-500">
                    No preset duration
                    found.
                  </div>
                )}

            </div>

            {/* CUSTOM */}

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
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >

                <span>
                  ✏
                </span>

                <span>
                  Custom duration
                </span>

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
    setEditingId(
      row.id
    );

    setBrandOpenId(null);

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
    const oldDuration =
      getDuration(
        editStart,
        editEnd
      );

    const duration =
      oldDuration > 0
        ? oldDuration
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
    const data = {
      text: editText,
      start: editStart,
      end: editEnd,
      brand_name:
        editBrand,
      status:
        "completed" as const,
    };

    setSegmentList(
      (prev) =>
        prev
          .map(
            (item) =>
              item.id === row.id
                ? {
                    ...item,
                    ...data,
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

    setEditingId(null);

    setBrandOpenId(null);

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
      (prev) =>
        prev.map(
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
   * CANCEL EDIT
   * ============================================================
   */

  function cancelEdit() {
    setEditingId(null);

    setBrandOpenId(null);

    setEditText("");

    setEditStart("");

    setEditEnd("");

    setEditBrand("");
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
        className="w-24 rounded-lg border px-2 py-1 text-center"
      />
    );
  }

  /*
   * ============================================================
   * SAVE ALL
   * ============================================================
   */

  function saveAll() {
    const completed =
      segmentList.map(
        (item) => ({
          ...item,
          status:
            "completed" as const,
        })
      );

    setSegmentList(
      completed
    );

    onSave?.(
      completed
    );
  }

  /*
   * ============================================================
   * SORT
   * ============================================================
   */

  const sortedSegments =
    [...segmentList]
      .map((item) => ({
        ...item,
        status:
          item.status ??
          "pending",
      }))
      .sort(
        (a, b) =>
          toSeconds(a.start) -
          toSeconds(b.start)
      );

  /*
   * ============================================================
   * OVERLAPPING IDS
   * ============================================================
   */

  const overlappingIds =
    getOverlappingIds(
      sortedSegments
    );

  const hasOverlaps =
    overlappingIds.size > 0;

  /*
   * ============================================================
   * UI
   * ============================================================
   */

  return (
    <div className="space-y-4">

      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4 shadow-sm">

        <div>
          <h2 className="text-lg font-bold">
            📢 Selected Advertisements
          </h2>

          <p className="text-sm text-gray-500">
            Review detected advertisements before saving.
          </p>
        </div>

        <div className="flex items-center gap-3">

          {hasOverlaps && (
            <div className="rounded-lg border border-red-300 bg-red-100 px-4 py-2 text-sm font-bold text-red-700">
              ⚠{" "}
              {overlappingIds.size}{" "}
              overlapping
              advertisements
            </div>
          )}

          <button
            type="button"
            onClick={saveAll}
            className="h-10 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Save All
          </button>

        </div>

      </div>

      {/* SEGMENTS */}

      {sortedSegments.map(
        (row, index) => {

          const selected =
            selectedResultId ===
            row.id;

          const overlapping =
            overlappingIds.has(
              row.id
            );

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

          return (
            <div
              key={row.id}
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
                p-5
                shadow-sm
                transition-all

                ${
                  overlapping
                    ? "border-red-500 bg-red-50 ring-2 ring-red-300"
                    : selected
                      ? "border-blue-200 bg-blue-50 ring-2 ring-blue-300"
                      : "border-gray-200 bg-white"
                }
              `}
            >

              {/* OVERLAP WARNING */}

              {overlapping && (
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-300 bg-red-100 px-4 py-3 text-red-700">

                  <span className="text-xl">
                    ⚠
                  </span>

                  <div>
                    <div className="font-bold">
                      OVERLAPPING ADVERTISEMENT
                    </div>

                    <div className="text-xs">
                      This advertisement overlaps with another selected advertisement.
                    </div>
                  </div>

                </div>
              )}

              {/* TOP */}

              <div className="flex items-start justify-between gap-4">

                <div className="flex flex-1 gap-4">

                  {/* NUMBER */}

                  <div
                    className={`
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      font-bold

                      ${
                        overlapping
                          ? "bg-red-600 text-white"
                          : "bg-gray-100"
                      }
                    `}
                  >
                    {index + 1}
                  </div>

                  {/* MAIN */}

                  <div className="min-w-0 flex-1">

                    <div className="flex items-center justify-between gap-2">

                      <div>

                        <h3 className="font-bold">
                          Advertisement
                        </h3>

                        <p className="text-xs text-gray-500">
                          Detected Segment
                        </p>

                      </div>

                      <div className="flex items-center gap-2">

                        {overlapping && (
                          <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                            ⚠ OVERLAPPING
                          </span>
                        )}

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            row.status ===
                            "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {row.status ===
                          "completed"
                            ? "🟢 Completed"
                            : "● Pending"}
                        </span>

                      </div>

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
                          px-4
                          py-2

                          ${
                            overlapping
                              ? "border-red-300 bg-red-100"
                              : "border-yellow-300 bg-yellow-50"
                          }
                        `}
                      >

                        <div className="flex items-start gap-2">

                          <span className="text-lg">
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

                {/* ACTIONS */}

                <div className="flex shrink-0 items-center gap-2">

                  {/* PLAY */}

                  <button
                    type="button"
                    onClick={() =>
                      onPlay(row)
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500 text-white hover:bg-green-600"
                  >
                    ▶
                  </button>

                  {/* EDIT / SAVE */}

                  {editingId ===
                  row.id ? (

                    <button
                      type="button"
                      onClick={() =>
                        saveEdit(row)
                      }
                      className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      💾 Save
                    </button>

                  ) : (

                    <button
                      type="button"
                      onClick={() =>
                        edit(row)
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200"
                    >
                      ✏️
                    </button>

                  )}

                  {/* DELETE */}

                  <button
                    type="button"
                    onClick={() =>
                      onRemove?.(
                        row.id
                      )
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 hover:bg-red-100"
                  >
                    🗑
                  </button>

                </div>

              </div>

              {/* TRANSCRIPT */}

              <div className="mt-5">

                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Transcript
                </label>

                <div
                  className={`
                    rounded-xl
                    p-4

                    ${
                      overlapping
                        ? "border border-red-200 bg-white"
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
                      className="w-full rounded-lg border p-3 outline-none focus:border-blue-400"
                    />

                  ) : (

                    <p className="whitespace-pre-wrap leading-7">
                      {row.text}
                    </p>

                  )}

                </div>

              </div>

              {/* TIME */}

              <div
                className={`
                  mt-5
                  rounded-xl
                  border
                  p-4

                  ${
                    overlapping
                      ? "border-red-300 bg-red-100"
                      : "border-gray-200 bg-gray-50"
                  }
                `}
              >

                <div className="mb-3 flex items-center justify-between">

                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    ⏱ Time
                  </div>

                  {overlapping && (
                    <div className="text-xs font-bold text-red-600">
                      ⚠ TIME RANGE CONFLICT
                    </div>
                  )}

                </div>

                {editingId ===
                row.id ? (

                  <div className="flex flex-wrap items-center gap-3">

                    {/* START */}

                    <div className="flex flex-col gap-1">

                      <span className="text-xs text-gray-500">
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

                    <span className="mt-5 text-gray-400">
                      →
                    </span>

                    {/* DURATION */}

                    <div className="flex flex-col gap-1">

                      <span className="text-xs text-gray-500">
                        Duration
                      </span>

                      <select
                        value={
                          editDuration
                        }
                        onChange={(e) =>
                          changeEditDuration(
                            Number(
                              e.target.value
                            )
                          )
                        }
                        onClick={(e) =>
                          e.stopPropagation()
                        }
                        className="h-9 min-w-32 rounded-lg border bg-white px-3 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      >

                        {getDurationOptions(
                          row.id
                        ).map(
                          (value) => (
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

                    <span className="mt-5 text-gray-400">
                      →
                    </span>

                    {/* END */}

                    <div className="flex flex-col gap-1">

                      <span className="text-xs text-gray-500">
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

                  <div className="flex flex-wrap items-center gap-3">

                    {/* START */}

                    <div className="flex flex-col gap-1">

                      <span className="text-xs text-gray-500">
                        Start
                      </span>

                      <span
                        className={`
                          rounded-lg
                          border
                          px-3
                          py-2
                          font-semibold

                          ${
                            overlapping
                              ? "border-red-300 bg-white text-red-700"
                              : "bg-white"
                          }
                        `}
                      >
                        {row.start ||
                          "00:00:00"}
                      </span>

                    </div>

                    <span className="mt-5 text-gray-400">
                      →
                    </span>

                    {/* DURATION */}

                    <div className="flex flex-col gap-1">

                      <span className="text-xs text-gray-500">
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
                      />

                    </div>

                    <span className="mt-5 text-gray-400">
                      →
                    </span>

                    {/* END */}

                    <div className="flex flex-col gap-1">

                      <span className="text-xs text-gray-500">
                        End
                      </span>

                      <span
                        className={`
                          rounded-lg
                          border
                          px-3
                          py-2
                          font-semibold

                          ${
                            overlapping
                              ? "border-red-300 bg-white text-red-700"
                              : "bg-white"
                          }
                        `}
                      >
                        {row.end ||
                          "00:00:00"}
                      </span>

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