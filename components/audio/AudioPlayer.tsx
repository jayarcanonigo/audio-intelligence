"use client";

import React, { useEffect, useState } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

interface Props {
  file: File | null;
  setFile: (file: File | null) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  audioUrl: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTimeUpdate: () => void;
}

export default function AudioPlayer({
  file,
  audioRef,
  audioUrl,
  onChange,
  onTimeUpdate,
}: Props) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "00:00";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const update = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
      onTimeUpdate();
    };

    audio.addEventListener("timeupdate", update);
    audio.addEventListener("loadedmetadata", update);

    return () => {
      audio.removeEventListener("timeupdate", update);
      audio.removeEventListener("loadedmetadata", update);
    };
  }, [audioRef, onTimeUpdate]);

  return (
    <div className="flex items-center gap-3 bg-white border rounded-xl shadow-sm px-4 py-3">

      {/* CHOOSE AUDIO */}
      <label className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer font-medium whitespace-nowrap flex-shrink-0">
        📁 Choose Audio
        <input
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={onChange}
        />
      </label>

      {/* FILENAME */}
      <span className="text-gray-600 truncate max-w-[160px] flex-shrink-0">
        {file ? file.name : "No file selected"}
      </span>

      {audioUrl ? (
        <>
          <audio
            ref={audioRef}
            src={audioUrl}
            preload="metadata"
          />

          <div className="w-px h-8 bg-gray-200 flex-shrink-0" />

          <button
            onClick={() => audioRef.current?.play()}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold flex-shrink-0"
          >
            <Play size={18} />
            Play
          </button>

          <button
            onClick={() => audioRef.current?.pause()}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg font-semibold flex-shrink-0"
          >
            <Pause size={18} />
            Pause
          </button>

          <button
            onClick={() => {
              if (audioRef.current)
                audioRef.current.currentTime = Math.max(
                  0,
                  audioRef.current.currentTime - 5
                );
            }}
            className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg flex-shrink-0"
          >
            <SkipBack size={18} />
          </button>

          <button
            onClick={() => {
              if (audioRef.current)
                audioRef.current.currentTime = Math.min(
                  duration,
                  audioRef.current.currentTime + 5
                );
            }}
            className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg flex-shrink-0"
          >
            <SkipForward size={18} />
          </button>

          <span className="w-14 text-center font-semibold flex-shrink-0">
            {formatTime(currentTime)}
          </span>

          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={(e) => {
              const value = Number(e.target.value);

              if (audioRef.current) {
                audioRef.current.currentTime = value;
              }

              setCurrentTime(value);
            }}
            className="flex-1 min-w-0 accent-blue-600"
          />

          <span className="w-14 text-center font-semibold flex-shrink-0">
            {formatTime(duration)}
          </span>
        </>
      ) : (
        <span className="text-gray-400 text-sm flex-shrink-0">
          No audio selected
        </span>
      )}
    </div>
  );
}