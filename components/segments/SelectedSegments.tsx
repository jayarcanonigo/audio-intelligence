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

export default function SelectedSegments({
  segments,
  selectedResultId,
  setSelectedResultId,
  onPlay,
  onUpdate,
  onRemove,
  onSave,
}: Props) {
  const [segmentList, setSegmentList] = useState<Segment[]>(segments);
  const [editingId, setEditingId] = useState<number | null>(null);
  // controls dropdown visibility
  const [brandOpenId, setBrandOpenId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editBrand, setEditBrand] = useState("");
  

  useEffect(() => {
    setSegmentList((prev) =>
      segments.map((incoming) => {
        const local = prev.find((p) => p.id === incoming.id);
        return {
          ...incoming,
          status: incoming.status ?? local?.status ?? "completed",
        };
      })
    );
  }, [segments]);

  function edit(row: Segment) {
    setEditingId(row.id);
    // important: edit mode does NOT open dropdown
    setBrandOpenId(null);
    setEditText(row.text);
    setEditStart(row.start || "00:00:00");
    setEditEnd(row.end || "00:00:00");
    setEditBrand(row.brand_name || "");
  }

 function saveEdit(row: Segment) {
  const data = {
    text: editText,
    start: editStart,
    end: editEnd,
    brand_name: editBrand,
    status: "completed" as const,
  };

  setSegmentList((prev) =>
    prev
      .map((item) =>
        item.id === row.id
          ? { ...item, ...data }
          : item
      )
      .sort((a, b) =>
        toSeconds(a.start) - toSeconds(b.start)
      )
  );

  setEditingId(null);
  setBrandOpenId(null);
  console.log("Saving edit for row:", row.id, "with data:", data);
  onUpdate?.(row.id, data);
}

  function updateBrand(row: Segment, value: string) {
    setEditBrand(value);
    setSegmentList((prev) =>
      prev.map((item) => (item.id === row.id ? { ...item, brand_name: value } : item))
    );
  }

  function cancelEdit() {
    setEditingId(null);
    setBrandOpenId(null);
    setEditText("");
    setEditStart("");
    setEditEnd("");
    setEditBrand("");
  }

    const toSeconds = (time?: string) => {
    if (!time) return 0;

    const parts = time.split(":").map(Number);

    if (parts.length === 3) {
      const [hour, minute, second] = parts;
      return hour * 3600 + minute * 60 + second;
    }

    if (parts.length === 2) {
      const [minute, second] = parts;
      return minute * 60 + second;
    }

    return 0;
  };


 const sortedSegments = [...segmentList]
  .map((item) => ({
    ...item,
    status: item.status ?? "pending",
  }))
  .sort((a, b) => {
    return toSeconds(a.start) - toSeconds(b.start);
  });

  function TimeInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    return (
      <input
        type="text"
        value={value}
        maxLength={8}
        placeholder="00:00:00"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 rounded-lg border px-2 py-1 text-center"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-bold">📢 Selected Advertisements</h2>
          <p className="text-sm text-gray-500">Review detected advertisements before saving.</p>
        </div>
        <button
          onClick={() => {
            const completed: Segment[] = segmentList.map((item) => ({
              ...item,
              status: "completed",
            }));

            setSegmentList(completed);
            onSave?.(completed);
          }}
          className="h-10 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Save All
        </button>
      </div>

      {sortedSegments.map((row, index) => (
        <div
          key={row.id}
          id={`segment-${row.id}`}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (
              target.closest("button") ||
              target.closest("input") ||
              target.closest("textarea") ||
              target.closest(".brand-combobox")||
              target.closest("[data-radix-popper-content-wrapper]")
            ) {
              return;
            }
            setSelectedResultId(row.id);
          }}
          className={`relative
    rounded-2xl
    border
    bg-white
    p-5
    shadow-sm
    overflow-visible ${
            selectedResultId === row.id ? "ring-2 ring-blue-300 bg-blue-50" : ""
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-1 gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 font-bold">
                {index + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold">Advertisement</h3>
                    <p className="text-xs text-gray-500">Detected Segment</p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      row.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {row.status === "completed" ? "🟢 Completed" : "● Pending"}
                  </span>
                </div>

                <label className="mb-2 mt-4 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Brand
                </label>

                {editingId === row.id ? (
                  <div className="brand-combobox w-full"
                   onClick={(e)=>e.stopPropagation()} >
                    <BrandCombobox
                      value={editBrand}
                      open={brandOpenId === row.id}
                      onOpenChange={(open) => setBrandOpenId(open ? row.id : null)}
                      onChange={(value) => {
                        updateBrand(row, value);
                        // close after select
                        setBrandOpenId(null);
                      }}
                    />
                  </div>
                ) : (
                  <div className="min-h-11 w-full rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-2">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">🏷</span>
                      <span className="break-words text-sm font-semibold leading-6 text-gray-800">
                        {row.brand_name || "No brand selected"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => onPlay(row)}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500 text-white hover:bg-green-600"
              >
                ▶
              </button>
              {editingId === row.id ? (
                <button
                  onClick={() => saveEdit(row)}
                  className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  💾 Save
                </button>
              ) : (
                <button
                  onClick={() => edit(row)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200"
                >
                  ✏️
                </button>
              )}
              <button
                onClick={() => onRemove?.(row.id)}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 hover:bg-red-100"
              >
                🗑
              </button>
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Transcript
            </label>
            <div className="rounded-xl bg-gray-50 p-4">
              {editingId === row.id ? (
                <textarea
                  value={editText}
                  rows={5}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full rounded-lg border p-3 outline-none focus:border-blue-400"
                />
              ) : (
                <p className="whitespace-pre-wrap leading-7">{row.text}</p>
              )}
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3 text-sm">
            <span className="font-medium">⏱ Time</span>
            {editingId === row.id ? (
              <>
                <TimeInput value={editStart} onChange={setEditStart} />
                <span>→</span>
                <TimeInput value={editEnd} onChange={setEditEnd} />
              </>
            ) : (
              <>
                <span className="font-semibold">{row.start || "00:00:00"}</span>
                <span>→</span>
                <span className="font-semibold">{row.end || "00:00:00"}</span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
