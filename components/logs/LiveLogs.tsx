"use client";

import React from "react";

interface Props {
  logs: any[];
  disabledLogs: number[];
  selectedP1Id: number | null;
  selectedP2Id: number | null;
  currentAudioTime: number;
  selectedLogId: number | null;

  logRefs: React.MutableRefObject<
    Record<number, HTMLDivElement | null>
  >;

  setSelectedLogId: (
    id: number | null
  ) => void;

  setPhrase1: (
    value: string
  ) => void;

  setPhrase2: (
    value: string
  ) => void;

  setSelectedP1Id: (
    id: number | null
  ) => void;

  setSelectedP2Id: (
    id: number | null
  ) => void;

  onPlay: (
    row: any
  ) => void;

  onAddSingle: (
    row: any
  ) => void;
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

  const toSeconds = (
    time?: string
  ) => {

    if (!time) return null;

    const parts = time.split(":");

    if (parts.length !== 3) return null;

    const [h, m, s] = parts;

    return (
      Number(h) * 3600 +
      Number(m) * 60 +
      Number(s)
    );
  };

  return (
    <div
      className="
        space-y-3
        max-h-[650px]
        overflow-y-auto
        pr-1
      "
    >

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

        let rowClass =
          "bg-white border-gray-200 hover:border-blue-300";

        if (isAdvertisement) {
          rowClass =
            "bg-yellow-50 border-yellow-400";
        }

        if (selectedLogId === log.id) {
          rowClass =
            "bg-blue-50 border-blue-400 ring-2 ring-blue-100";
        }

        if (isPlaying) {
          rowClass =
            "bg-cyan-50 border-cyan-500 ring-2 ring-cyan-200";
        }

        if (isP1) {
          rowClass =
            "bg-green-50 border-green-500 ring-2 ring-green-200";
        }

        if (isP2) {
          rowClass =
            "bg-orange-50 border-orange-500 ring-2 ring-orange-200";
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
              p-4
              shadow-sm
              transition-all
              cursor-pointer
              ${rowClass}
              ${
                disabled
                  ? "opacity-70"
                  : ""
              }
            `}
          >

            <div className="flex items-start gap-3">

              {/* LEFT */}
              <div className="flex flex-col gap-2">

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhrase1(text);
                    setSelectedP1Id(log.id);
                  }}
                  className={`
                    px-3
                    py-1
                    rounded-lg
                    text-xs
                    font-bold
                    text-white
                    transition
                    ${
                      isP1
                        ? "bg-green-700 ring-4 ring-green-200"
                        : "bg-green-500 hover:bg-green-600"
                    }
                  `}
                >
                  {isP1 ? "✓ START" : "P1"}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhrase2(text);
                    setSelectedP2Id(log.id);
                  }}
                  className={`
                    px-3
                    py-1
                    rounded-lg
                    text-xs
                    font-bold
                    text-white
                    transition
                    ${
                      isP2
                        ? "bg-orange-700 ring-4 ring-orange-200"
                        : "bg-orange-500 hover:bg-orange-600"
                    }
                  `}
                >
                  {isP2 ? "✓ END" : "P2"}
                </button>

              </div>

              {/* CENTER */}
              <div className="flex-1">

                <div className="flex flex-wrap items-center gap-2">

                  <span className="text-sm text-gray-800 leading-6">
                    {text}
                  </span>

                  {isAdvertisement && (
                    <span className="px-2 py-0.5 rounded-full bg-yellow-500 text-white text-[10px] font-bold">
                      AD
                    </span>
                  )}

                  {isPlaying && (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-white text-[10px] font-bold animate-pulse">
                      PLAYING
                    </span>
                  )}

                  {disabled && (
                    <span className="px-2 py-0.5 rounded-full bg-gray-500 text-white text-[10px] font-bold">
                      ADDED
                    </span>
                  )}

                                  </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <span>⏱</span>

                  <span className="font-medium">
                    {log.start_time || "--:--:--"}
                  </span>

                  <span>→</span>

                  <span className="font-medium">
                    {log.end_time || "--:--:--"}
                  </span>
                </div>

              </div>

              {/* RIGHT ACTIONS */}
              <div className="flex flex-col gap-2">

                {/* PLAY */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlay(log);
                  }}
                  className="
                    w-10
                    h-10
                    rounded-lg
                    bg-green-600
                    hover:bg-green-700
                    text-white
                    shadow
                    transition
                  "
                  title="Play"
                >
                  ▶
                </button>

                {/* ADD SINGLE */}
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
                    h-10
                    rounded-lg
                    shadow
                    transition
                    ${
                      disabled
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
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