"use client";

import { useEffect, useState } from "react";
import {
  getAdvertisements,
  getLogs,
  updateAdvertisement,
  deleteAdvertisement,
} from "@/services/api";

interface Segment {
  id: number;
  start?: string;
  end?: string;
  text: string;
  segment_type?: string;
  brand_name?: string;
}

interface TranscriptSegment {
  id?: number;
  start?: string;
  end?: string;
  text: string;
  segment_type?: string;
}

interface Props {
  projectId: number;
  refresh: number;
}

const DURATION_OPTIONS = [5, 10, 20, 30, 45];

export default function SegmentsList({
  projectId,
  refresh,
}: Props) {
  const [segments, setSegments] = useState<Segment[]>([]);

  // Full transcript from getLogs()
  const [transcriptSegments, setTranscriptSegments] =
    useState<TranscriptSegment[]>([]);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editText, setEditText] = useState("");

  const [editDuration, setEditDuration] =
    useState<number>(30);

  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] =
    useState<number | null>(null);

  /*
   * ==========================================
   * TIME HELPERS
   * ==========================================
   */

  function timeToSeconds(time?: string): number {
    if (!time) return 0;

    const value = String(time).trim();

    if (!value) return 0;

    const parts = value.split(":").map(Number);

    if (parts.some((part) => Number.isNaN(part))) {
      return 0;
    }

    if (parts.length === 3) {
      const [hours, minutes, seconds] = parts;

      return (
        hours * 3600 +
        minutes * 60 +
        seconds
      );
    }

    if (parts.length === 2) {
      const [minutes, seconds] = parts;

      return minutes * 60 + seconds;
    }

    if (parts.length === 1) {
      return parts[0];
    }

    return 0;
  }

  function secondsToTime(totalSeconds: number): string {
    const seconds = Math.max(
      0,
      Math.floor(totalSeconds)
    );

    const hours = Math.floor(seconds / 3600);

    const minutes = Math.floor(
      (seconds % 3600) / 60
    );

    const remainingSeconds = seconds % 60;

    return (
      String(hours).padStart(2, "0") +
      ":" +
      String(minutes).padStart(2, "0") +
      ":" +
      String(remainingSeconds).padStart(2, "0")
    );
  }

  function getDuration(
    start?: string,
    end?: string
  ): number {
    const startSeconds = timeToSeconds(start);
    const endSeconds = timeToSeconds(end);

    return Math.max(
      0,
      Math.round(endSeconds - startSeconds)
    );
  }

  /*
   * ==========================================
   * LOAD DATA
   * ==========================================
   */

  async function loadSegments() {
    try {
      setLoading(true);

      /*
       * Load advertisements.
       */
      const advertisements =
        await getAdvertisements(projectId);

      console.log(
        "ADVERTISEMENT DATA",
        advertisements
      );

      setSegments(advertisements || []);

      /*
       * Load complete transcript.
       *
       * This is what allows us to reconstruct
       * the text when Duration changes.
       */
      const logs = await getLogs(projectId);

      console.log(
        "TRANSCRIPT LOGS",
        logs
      );

      /*
       * getLogs() normally returns an array.
       *
       * Some APIs may return:
       *
       * { segments: [...] }
       *
       * so support both.
       */
      let transcript: any[] = [];

      if (Array.isArray(logs)) {
        transcript = logs;
      } else if (
        logs &&
        Array.isArray(logs.segments)
      ) {
        transcript = logs.segments;
      } else if (
        logs &&
        Array.isArray(logs.logs)
      ) {
        transcript = logs.logs;
      }

      setTranscriptSegments(
        transcript.map((item) => ({
          id: item.id,
          start:
            item.start ??
            item.start_time ??
            item.startTime,
          end:
            item.end ??
            item.end_time ??
            item.endTime,
          text: item.text ?? "",
          segment_type:
            item.segment_type,
        }))
      );

      console.log(
        "NORMALIZED TRANSCRIPT",
        transcript
      );
    } catch (error) {
      console.error(
        "Failed loading segments:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSegments();
  }, [projectId, refresh]);

  /*
   * ==========================================
   * FIND TRANSCRIPT FOR TIME RANGE
   * ==========================================
   */

  function getTranscriptForDuration(
    start: string,
    duration: number,
    fallbackText = ""
  ): string {
    const startSeconds =
      timeToSeconds(start);

    const endSeconds =
      startSeconds + duration;

    console.log(
      "COPY TRANSCRIPT RANGE:",
      {
        start,
        duration,
        startSeconds,
        endSeconds,
      }
    );

    /*
     * Find every transcript segment that
     * overlaps the requested time range.
     *
     * Example:
     *
     * Advertisement:
     * 00:01:20 -> 00:01:50
     *
     * We collect transcript segments that
     * overlap that range.
     */
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
            timeToSeconds(
              segment.start
            );

          const segmentEnd =
            timeToSeconds(
              segment.end
            );

          /*
           * Overlap condition:
           *
           * segment starts before requested end
           * AND
           * segment ends after requested start
           */
          return (
            segmentStart < endSeconds &&
            segmentEnd > startSeconds
          );
        })
        .sort(
          (a, b) =>
            timeToSeconds(a.start) -
            timeToSeconds(b.start)
        );

    console.log(
      "MATCHING TRANSCRIPT:",
      matchingSegments
    );

    /*
     * If we found transcript segments,
     * combine their text.
     */
    if (matchingSegments.length > 0) {
      return matchingSegments
        .map((segment) =>
          segment.text?.trim()
        )
        .filter(Boolean)
        .join(" ");
    }

    /*
     * If no transcript was found, keep
     * the existing text instead of making
     * the text blank.
     */
    return fallbackText;
  }

  /*
   * ==========================================
   * DURATION CHANGE - NORMAL ROW
   * ==========================================
   */

  function changeDuration(
    row: Segment,
    duration: number
  ) {
    if (!row.start) {
      console.warn(
        "Cannot change duration: missing start time"
      );

      return;
    }

    /*
     * Calculate new end.
     */
    const startSeconds =
      timeToSeconds(row.start);

    const endSeconds =
      startSeconds + duration;

    const newEnd =
      secondsToTime(endSeconds);

    /*
     * Get transcript for the new
     * duration.
     */
    const newText =
      getTranscriptForDuration(
        row.start,
        duration,
        row.text
      );

    console.log(
      "DURATION CHANGED:",
      {
        id: row.id,
        duration,
        start: row.start,
        end: newEnd,
        text: newText,
      }
    );

    /*
     * Update UI immediately.
     */
    setSegments((prev) =>
      prev.map((item) =>
        item.id === row.id
          ? {
              ...item,
              end: newEnd,
              text: newText,
            }
          : item
      )
    );
  }

  /*
   * ==========================================
   * EDIT
   * ==========================================
   */

  function editSegment(row: Segment) {
    console.log(
      "EDIT CLICK",
      row
    );

    const duration =
      getDuration(
        row.start,
        row.end
      );

    setEditingId(row.id);

    setEditStart(
      row.start ?? ""
    );

    setEditEnd(
      row.end ?? ""
    );

    setEditText(
      row.text ?? ""
    );

    /*
     * If the existing duration is one
     * of the dropdown options, select it.
     *
     * Otherwise use the closest option.
     */
    if (
      DURATION_OPTIONS.includes(
        duration
      )
    ) {
      setEditDuration(duration);
    } else if (duration > 0) {
      setEditDuration(duration);
    } else {
      setEditDuration(30);
    }
  }

  /*
   * ==========================================
   * EDIT DURATION
   * ==========================================
   */

  function changeEditDuration(
    duration: number
  ) {
    if (!editStart) {
      return;
    }

    /*
     * Calculate new end.
     */
    const startSeconds =
      timeToSeconds(editStart);

    const newEnd =
      secondsToTime(
        startSeconds + duration
      );

    /*
     * Get transcript based on
     * start + selected duration.
     */
    const newText =
      getTranscriptForDuration(
        editStart,
        duration,
        editText
      );

    setEditDuration(duration);
    setEditEnd(newEnd);
    setEditText(newText);
  }

  /*
   * ==========================================
   * EDIT START TIME
   * ==========================================
   */

  function changeEditStart(
    value: string
  ) {
    setEditStart(value);

    /*
     * If a duration is selected,
     * automatically recalculate the end
     * and transcript.
     */
    if (value) {
      const newEnd =
        secondsToTime(
          timeToSeconds(value) +
            editDuration
        );

      const newText =
        getTranscriptForDuration(
          value,
          editDuration,
          editText
        );

      setEditEnd(newEnd);
      setEditText(newText);
    }
  }

  /*
   * ==========================================
   * SAVE
   * ==========================================
   */

  async function saveSegment(
    id: number
  ) {
    try {
      setSavingId(id);

      /*
       * Update backend.
       */
      const updated =
        await updateAdvertisement(
          id,
          {
            text: editText,
            start: editStart,
            end: editEnd,
          }
        );

      console.log(
        "ADVERTISEMENT UPDATED:",
        updated
      );

      /*
       * Update local UI.
       */
      setSegments((prev) =>
        prev.map((row) =>
          row.id === id
            ? {
                ...row,
                start: editStart,
                end: editEnd,
                text: editText,
              }
            : row
        )
      );

      setEditingId(null);
    } catch (error) {
      console.error(
        "Failed to save advertisement:",
        error
      );

      alert(
        "Failed to save advertisement."
      );
    } finally {
      setSavingId(null);
    }
  }

  /*
   * ==========================================
   * CANCEL EDIT
   * ==========================================
   */

  function cancelEdit() {
    setEditingId(null);

    setEditStart("");
    setEditEnd("");
    setEditText("");
    setEditDuration(30);
  }

  /*
   * ==========================================
   * DELETE
   * ==========================================
   */

  async function deleteSegment(
    id: number
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this advertisement?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteAdvertisement(id);

      setSegments((prev) =>
        prev.filter(
          (row) => row.id !== id
        )
      );
    } catch (error) {
      console.error(
        "Failed to delete advertisement:",
        error
      );

      alert(
        "Failed to delete advertisement."
      );
    }
  }

  /*
   * ==========================================
   * RENDER
   * ==========================================
   */

  return (
    <div className="mt-5">
      <h2 className="font-bold text-xl mb-4">
        Segments
      </h2>

      {loading && (
        <p className="mb-4">
          Loading...
        </p>
      )}

      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left">
                #
              </th>

              <th className="p-3 text-left">
                Start
              </th>

              <th className="p-3 text-left">
                Duration
              </th>

              <th className="p-3 text-left">
                End
              </th>

              <th className="p-3 text-left">
                Text
              </th>

              <th className="p-3 text-left">
                Type
              </th>

              <th className="p-3 text-left">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {segments.map(
              (row, index) => {
                const rowDuration =
                  getDuration(
                    row.start,
                    row.end
                  );

                const isEditing =
                  editingId === row.id;

                return (
                  <tr
                    key={row.id}
                    className="border-b align-top"
                  >
                    {/* NUMBER */}
                    <td className="p-3">
                      {index + 1}
                    </td>

                    {/* START */}
                    <td className="p-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editStart}
                          onChange={(e) =>
                            changeEditStart(
                              e.target.value
                            )
                          }
                          className="border rounded p-2 w-32"
                          placeholder="00:00:00"
                        />
                      ) : (
                        row.start
                      )}
                    </td>

                    {/* DURATION */}
                    <td className="p-3">
                      {isEditing ? (
                        <select
                          value={editDuration}
                          onChange={(e) =>
                            changeEditDuration(
                              Number(
                                e.target.value
                              )
                            )
                          }
                          className="border rounded p-2 w-36 bg-white"
                        >
                          {DURATION_OPTIONS.map(
                            (duration) => (
                              <option
                                key={duration}
                                value={duration}
                              >
                                {duration} seconds
                              </option>
                            )
                          )}

                          {editDuration > 0 &&
                            !DURATION_OPTIONS.includes(
                              editDuration
                            ) && (
                              <option
                                value={
                                  editDuration
                                }
                              >
                                {editDuration}{" "}
                                seconds
                              </option>
                            )}
                        </select>
                      ) : (
                        <select
                          value={
                            DURATION_OPTIONS.includes(
                              rowDuration
                            )
                              ? rowDuration
                              : ""
                          }
                          onChange={(e) =>
                            changeDuration(
                              row,
                              Number(
                                e.target.value
                              )
                            )
                          }
                          className="border rounded p-2 w-36 bg-white"
                        >
                          {!DURATION_OPTIONS.includes(
                            rowDuration
                          ) && (
                            <option
                              value=""
                              disabled
                            >
                              {rowDuration > 0
                                ? `${rowDuration} seconds`
                                : "Select duration"}
                            </option>
                          )}

                          {DURATION_OPTIONS.map(
                            (duration) => (
                              <option
                                key={duration}
                                value={duration}
                              >
                                {duration} seconds
                              </option>
                            )
                          )}
                        </select>
                      )}
                    </td>

                    {/* END */}
                    <td className="p-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editEnd}
                          readOnly
                          className="border rounded p-2 w-32 bg-gray-100"
                        />
                      ) : (
                        row.end
                      )}
                    </td>

                    {/* TEXT */}
                    <td className="p-3 min-w-[350px]">
                      {isEditing ? (
                        <textarea
                          value={editText}
                          onChange={(e) =>
                            setEditText(
                              e.target.value
                            )
                          }
                          className="border rounded p-2 w-full min-h-[120px]"
                        />
                      ) : (
                        <div className="whitespace-pre-wrap">
                          {row.text}
                        </div>
                      )}
                    </td>

                    {/* TYPE */}
                    <td className="p-3">
                      <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs">
                        {row.segment_type ||
                          "AD"}
                      </span>
                    </td>

                    {/* ACTION */}
                    <td className="p-3 whitespace-nowrap">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            disabled={
                              savingId ===
                              row.id
                            }
                            onClick={() =>
                              saveSegment(
                                row.id
                              )
                            }
                            className="bg-blue-500 text-white px-3 py-1 rounded mr-2 disabled:opacity-50"
                          >
                            {savingId ===
                            row.id
                              ? "Saving..."
                              : "Save"}
                          </button>

                          <button
                            type="button"
                            onClick={
                              cancelEdit
                            }
                            className="bg-gray-300 px-3 py-1 rounded"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              editSegment(
                                row
                              )
                            }
                            className="text-blue-600 mr-3"
                          >
                            ✏️ Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteSegment(
                                row.id
                              )
                            }
                            className="text-red-600"
                          >
                            🗑 Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}