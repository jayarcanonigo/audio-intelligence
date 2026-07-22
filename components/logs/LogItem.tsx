"use client";

import { forwardRef } from "react";

type LogItemProps = {
  log: any;

  disabled: boolean;
  isP1: boolean;
  isP2: boolean;
  isPlaying: boolean;
  selected: boolean;

  onPlay: (log: any) => void;
  onSelectP1: (log: any) => void;
  onSelectP2: (log: any) => void;
  onCheck: (log: any) => void;
};

const LogItem = forwardRef<HTMLDivElement, LogItemProps>(
  (
    {
      log,
      disabled,
      isP1,
      isP2,
      isPlaying,
      selected,
      onPlay,
      onSelectP1,
      onSelectP2,
      onCheck,
    },
    ref
  ) => {
    const text = log?.message || "";

    return (
      <div
        ref={ref}
        onClick={() => onPlay(log)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,

          padding: 10,
          marginBottom: 6,

          cursor: "pointer",

          borderLeft:
            isPlaying
              ? "5px solid #22c55e"
              : selected
              ? "5px solid #2563eb"
              : "5px solid transparent",

          background:
            isPlaying
              ? "#ecfdf5"
              : selected
              ? "#f8fafc"
              : disabled
              ? "#eef2ff"
              : "transparent",

          borderRadius: 8,
        }}
      >

        {/* LEFT BUTTONS */}
        <div
          style={{
            display: "flex",
            gap: 5,
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectP1(log);
            }}
            style={{
              background: isP1
                ? "#22c55e"
                : undefined,
            }}
          >
            P1
          </button>


          <button
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              onCheck(log);
            }}
          >
            +
          </button>
        </div>


        {/* TEXT */}
        <div
          style={{
            flex: 1,
          }}
        >
          <span
            style={{
              color: "#2563eb",
              cursor: "pointer",
            }}
          >
            {text}
          </span>

          <div
            style={{
              fontSize: 11,
              marginTop: 3,
              color: "#9ca3af",
            }}
          >
            ⏱ {log.start_time || "-"}
            {" → "}
            {log.end_time || "-"}
          </div>
        </div>


        {/* P2 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectP2(log);
          }}
          style={{
            background: isP2
              ? "#f59e0b"
              : undefined,
          }}
        >
          P2
        </button>

      </div>
    );
  }
);


LogItem.displayName = "LogItem";

export default LogItem;