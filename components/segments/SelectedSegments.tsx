"use client";

import { useEffect, useState } from "react";
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

  // IMPORTANT:
  // This must contain the ORIGINAL/full transcript segments.
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

const DURATION_OPTIONS = [5, 10, 20, 30, 45];

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

  const [customDurations, setCustomDurations] =
    useState<Record<number, number>>({});

  /*
   * =====================================================
   * TIME HELPERS
   * =====================================================
   */

  function toSeconds(time?: string): number {
    if (!time) return 0;

    const value = String(time).trim();

    if (!value) return 0;

    const parts = value.split(":").map(Number);

    if (
      parts.length === 3 &&
      parts.every((value) => !Number.isNaN(value))
    ) {
      const [hour, minute, second] = parts;

      return (
        hour * 3600 +
        minute * 60 +
        second
      );
    }

    if (
      parts.length === 2 &&
      parts.every((value) => !Number.isNaN(value))
    ) {
      const [minute, second] = parts;

      return minute * 60 + second;
    }

    if (
      parts.length === 1 &&
      !Number.isNaN(parts[0])
    ) {
      return parts[0];
    }

    return 0;
  }

  function secondsToTime(totalSeconds: number): string {
    totalSeconds = Math.max(
      0,
      Math.floor(totalSeconds)
    );

    const hours = Math.floor(
      totalSeconds / 3600
    );

    const minutes = Math.floor(
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
   * =====================================================
   * SYNC PARENT SEGMENTS
   * =====================================================
   */

  useEffect(() => {
    setSegmentList((prev) =>
      segments.map((incoming) => {
        const local = prev.find(
          (item) =>
            item.id === incoming.id
        );

        return {
          ...incoming,
          status:
            incoming.status ??
            local?.status ??
            "completed",
        };
      })
    );

    setCustomDurations((prev) => {
      const next = { ...prev };

      let changed = false;

      segments.forEach((seg) => {
        if (
          next[seg.id] === undefined
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
      });

      return changed
        ? next
        : prev;
    });
  }, [segments]);

  /*
   * =====================================================
   * DURATION OPTIONS
   * =====================================================
   */

  function getDurationOptions(
    rowId: number
  ): number[] {
    const custom =
      customDurations[rowId];

    if (
      custom === undefined ||
      DURATION_OPTIONS.includes(custom)
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
   * =====================================================
   * GET TRANSCRIPT FOR TIME RANGE
   *
   * Example:
   *
   * Start = 00:10:00
   * Duration = 30
   *
   * End = 00:10:30
   *
   * Get all transcript segments that overlap
   * 00:10:00 -> 00:10:30
   * and combine their text.
   * =====================================================
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
      console.warn(
        "No transcriptSegments supplied. Keeping existing text."
      );

      return fallbackText;
    }

    const startSeconds =
      toSeconds(start);

    const endSeconds =
      startSeconds + duration;

    console.log(
      "SEARCH TRANSCRIPT RANGE",
      {
        start,
        startSeconds,
        duration,
        endSeconds,
        transcriptCount:
          transcriptSegments.length,
      }
    );

    const matchingSegments =
      transcriptSegments
        .filter((segment) => {
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
           * Segment overlaps selected range.
           */
          return (
            segmentStart <
              endSeconds &&
            segmentEnd >
              startSeconds
          );
        })
        .sort(
          (a, b) =>
            toSeconds(a.start) -
            toSeconds(b.start)
        );

    console.log(
      "MATCHING TRANSCRIPT SEGMENTS",
      matchingSegments
    );

    const text =
      matchingSegments
        .map(
          (segment) =>
            segment.text?.trim()
        )
        .filter(
          Boolean
        )
        .join(" ");

    return (
      text ||
      fallbackText
    );
  }

  /*
   * =====================================================
   * CHANGE NORMAL DURATION
   * =====================================================
   */

  function changeDuration(
    row: Segment,
    duration: number
  ) {
    const start =
      row.start ||
      "00:00:00";

    const startSeconds =
      toSeconds(start);

    const newEnd =
      secondsToTime(
        startSeconds +
        duration
      );

    /*
     * THIS IS THE IMPORTANT PART:
     *
     * Rebuild transcript using
     * Start + selected Duration.
     */
    const newText =
      getTranscriptForRange(
        start,
        duration,
        row.text
      );

    console.log(
      "DURATION CHANGED",
      {
        id: row.id,
        start,
        duration,
        newEnd,
        newText,
      }
    );

    /*
     * Update UI immediately.
     */
    setSegmentList((prev) =>
      prev.map((item) =>
        item.id === row.id
          ? {
              ...item,
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
          row.brand_name || "",
        status:
          "completed",
      }
    );
  }

  /*
   * =====================================================
   * EDIT
   * =====================================================
   */

  function edit(row: Segment) {
    setEditingId(row.id);

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
      row.brand_name || ""
    );
  }

  /*
   * =====================================================
   * CHANGE EDIT DURATION
   * =====================================================
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
   * =====================================================
   * CHANGE EDIT START
   * =====================================================
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
   * =====================================================
   * SAVE EDIT
   * =====================================================
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

    setSegmentList((prev) =>
      prev
        .map((item) =>
          item.id === row.id
            ? {
                ...item,
                ...data,
              }
            : item
        )
        .sort(
          (a, b) =>
            toSeconds(a.start) -
            toSeconds(b.start)
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
   * =====================================================
   * BRAND
   * =====================================================
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
   * =====================================================
   * CANCEL
   * =====================================================
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
   * =====================================================
   * TIME INPUT
   * =====================================================
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
   * =====================================================
   * SAVE ALL
   * =====================================================
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
   * =====================================================
   * SORT
   * =====================================================
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
   * =====================================================
   * UI
   * =====================================================
   */

  return (
    <div className="space-y-4">

      {/* HEADER */}

      <div className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm">

        <div>
          <h2 className="text-lg font-bold">
            📢 Selected Advertisements
          </h2>

          <p className="text-sm text-gray-500">
            Review detected advertisements before saving.
          </p>
        </div>

        <button
          type="button"
          onClick={saveAll}
          className="h-10 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Save All
        </button>

      </div>

      {/* SEGMENTS */}

      {sortedSegments.map(
        (row, index) => {

          const selected =
            selectedResultId ===
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
                  ) ||
                  target.closest(
                    "[data-radix-popper-content-wrapper]"
                  )
                ) {
                  return;
                }

                setSelectedResultId(
                  row.id
                );
              }}
              className={`relative overflow-visible rounded-2xl border bg-white p-5 shadow-sm ${
                selected
                  ? "ring-2 ring-blue-300 bg-blue-50"
                  : ""
              }`}
            >

              {/* TOP */}

              <div className="flex items-start justify-between gap-4">

                <div className="flex flex-1 gap-4">

                  {/* NUMBER */}

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 font-bold">
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

                      {/* STATUS */}

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
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

                      <div className="min-h-11 w-full rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-2">

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

                <div className="rounded-xl bg-gray-50 p-4">

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

              <div className="mt-5 rounded-xl border bg-gray-50 p-4">

                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  ⏱ Time
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

                      <span className="rounded-lg border bg-white px-3 py-2 font-semibold">
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

                      <select
                        value={
                          duration
                        }
                        onChange={(e) =>
                          changeDuration(
                            row,
                            Number(
                              e.target.value
                            )
                          )
                        }
                        onClick={(e) =>
                          e.stopPropagation()
                        }
                        className="h-10 min-w-32 rounded-lg border bg-white px-3 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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

                      <span className="rounded-lg border bg-white px-3 py-2 font-semibold">
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