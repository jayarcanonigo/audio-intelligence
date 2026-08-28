
"use client";

import React from "react";

interface Props {
  logs: any[];
  disabledLogs: number[];
  selectedP1Id: number | null;
  selectedP2Id: number | null;
  currentAudioTime: number;
  selectedLogId: number | null;
  logRefs: React.MutableRefObject<Record<number, HTMLDivElement | null>>;
  setSelectedLogId: (id: number | null) => void;
  setPhrase1: (value: string) => void;
  setPhrase2: (value: string) => void;
  setSelectedP1Id: (id: number | null) => void;
  setSelectedP2Id: (id: number | null) => void;
  onPlay: (row: any) => void;
  onAddSingle: (row: any) => void;
}

export default function LiveLogs({
  logs,
  disabledLogs,
  selectedP1Id,
  selectedP2Id,
  currentAudioTime,
  selectedLogId,
  logRefs,
  setSelectedLogId,
  setPhrase1,
  setPhrase2,
  setSelectedP1Id,
  setSelectedP2Id,
  onPlay,
  onAddSingle,
}: Props) {
  const toSeconds = (time?: string) => {
    if (!time) return null;

    const parts = time.split(":");

    if (parts.length !== 3) return null;

    const [h, m, s] = parts;

    return Number(h) * 3600 + Number(m) * 60 + Number(s);
  };

  const formatDuration = (
    start: number | null,
    end: number | null
  ) => {
    if (start === null || end === null) {
      return "--:--";
    }

    const diff = Math.max(0, end - start);

    const m = Math.floor(diff / 60);
    const s = Math.floor(diff % 60);

    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        const text =
          log.text ||
          log.message ||
          "";

        const disabled =
          disabledLogs.includes(log.id);

        const isAdvertisement =
          log.segment_type ===
          "advertisement";

        const isP1 =
          selectedP1Id === log.id;

        const isP2 =
          selectedP2Id === log.id;

        const start =
          toSeconds(log.start_time);

        const end =
          toSeconds(log.end_time);

        const isPlaying =
          start !== null &&
          end !== null &&
          currentAudioTime >= start &&
          currentAudioTime <= end;

        const duration =
          formatDuration(start, end);

        let rowClass =
          "bg-white border-gray-200";

        if (isAdvertisement) {
          rowClass =
            "bg-yellow-50 border-yellow-300";
        }

        if (selectedLogId === log.id) {
          rowClass =
            "bg-blue-50 border-blue-400 ring-1 ring-blue-200";
        }

        if (isPlaying) {
          rowClass =
            "bg-cyan-50 border-cyan-400 ring-1 ring-cyan-200";
        }

        if (isP1) {
          rowClass =
            "bg-green-50 border-green-400 ring-1 ring-green-200";
        }

        if (isP2) {
          rowClass =
            "bg-orange-50 border-orange-400 ring-1 ring-orange-200";
        }

        return (
          <div
            key={log.id}
            ref={(el) => {
              logRefs.current[log.id] = el;
            }}
            onClick={() => {
              setSelectedLogId(log.id);
              onPlay(log);
            }}
            className={`
              border
              rounded-xl
              shadow-sm
              transition-all
              cursor-pointer
              overflow-hidden
              ${rowClass}
              ${disabled ? "opacity-70" : ""}
            `}
          >
            {/* TOP INFO */}
            <div className="px-3 sm:px-4 pt-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] sm:text-xs font-semibold text-gray-500 whitespace-nowrap">
                    ⏱ {log.start_time || "--:--:--"}
                  </span>

                  <span className="text-gray-400 text-xs">
                    →
                  </span>

                  <span className="text-[11px] sm:text-xs font-semibold text-gray-500 whitespace-nowrap">
                    {log.end_time || "--:--:--"}
                  </span>
                </div>

                <span className="shrink-0 px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-[10px] sm:text-xs font-semibold">
                  {duration}
                </span>
              </div>
            </div>

            {/* TRANSCRIPT */}
            <div className="px-3 sm:px-4 py-3">
              <div className="flex flex-wrap items-start gap-2">
                <p className="flex-1 min-w-0 text-sm sm:text-[15px] text-gray-800 leading-6 break-words">
                  {text}
                </p>

                <div className="flex gap-1 shrink-0">
                  {isAdvertisement && (
                    <span className="px-2 py-0.5 rounded-full bg-yellow-500 text-white text-[9px] font-bold">
                      AD
                    </span>
                  )}

                  {isPlaying && (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-white text-[9px] font-bold animate-pulse">
                      PLAYING
                    </span>
                  )}

                  {disabled && (
                    <span className="px-2 py-0.5 rounded-full bg-gray-500 text-white text-[9px] font-bold">
                      ADDED
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* MOBILE / DESKTOP ACTION BAR */}
            <div className="border-t border-gray-200/70 bg-white/60 px-3 sm:px-4 py-2.5">
              <div className="flex items-center gap-2">

                {/* P1 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();

                    setPhrase1(text);
                    setSelectedP1Id(log.id);
                  }}
                  className={`
                    flex-1
                    h-9
                    sm:h-10
                    rounded-lg
                    text-xs
                    font-bold
                    transition
                    ${
                      isP1
                        ? "bg-green-700 text-white ring-2 ring-green-200"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }
                  `}
                >
                  {isP1 ? "✓ START" : "P1"}
                </button>

                {/* P2 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();

                    setPhrase2(text);
                    setSelectedP2Id(log.id);
                  }}
                  className={`
                    flex-1
                    h-9
                    sm:h-10
                    rounded-lg
                    text-xs
                    font-bold
                    transition
                    ${
                      isP2
                        ? "bg-orange-700 text-white ring-2 ring-orange-200"
                        : "bg-orange-500 hover:bg-orange-600 text-white"
                    }
                  `}
                >
                  {isP2 ? "✓ END" : "P2"}
                </button>

                {/* PLAY */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlay(log);
                  }}
                  className="
                    w-10
                    h-9
                    sm:h-10
                    shrink-0
                    rounded-lg
                    bg-green-600
                    hover:bg-green-700
                    text-white
                    shadow-sm
                    transition
                    flex
                    items-center
                    justify-center
                  "
                  title="Play"
                >
                  ▶
                </button>

                {/* ADD */}
                <button
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation();

                    if (!disabled) {
                      onAddSingle(log);
                    }
                  }}
                  className={`
                    w-10
                    h-9
                    sm:h-10
                    shrink-0
                    rounded-lg
                    shadow-sm
                    transition
                    flex
                    items-center
                    justify-center
                    ${
                      disabled
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }
                  `}
                  title="Add Advertisement"
                >
                  ➕
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
