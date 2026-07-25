"use client";

import React, { useEffect, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Upload,
} from "lucide-react";

interface Props {
  file: File | null;
  setFile: (file: File |null) => void;
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
    <div className="flex items-center gap-3 rounded-lg border bg-white px-3 py-2 shadow-sm">

      {/* Upload Button */}
      <label className="flex cursor-pointer items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 whitespace-nowrap">
        <Upload size={16} />
        <span className="hidden md:inline">Choose Audio</span>

        <input
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={onChange}
        />
      </label>

      {/* File Name */}
      <div className="min-w-[120px] max-w-[180px] truncate text-xs text-gray-600">
        {file ? file.name : "No audio selected"}
      </div>

      {audioUrl ? (
        <>
          <audio
            ref={audioRef}
            src={audioUrl}
            preload="metadata"
          />

          <div className="h-6 border-l" />

          {/* Play */}
          <button
            onClick={() => audioRef.current?.play()}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-green-600 text-white hover:bg-green-700"
            title="Play"
          >
            <Play size={15} />
          </button>

          {/* Pause */}
          <button
            onClick={() => audioRef.current?.pause()}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200"
            title="Pause"
          >
            <Pause size={15} />
          </button>

          {/* Back 5 sec */}
          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = Math.max(
                  0,
                  audioRef.current.currentTime - 5
                );
              }
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200"
            title="Back 5 seconds"
          >
            <SkipBack size={15} />
          </button>

          {/* Forward 5 sec */}
          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = Math.min(
                  duration,
                  audioRef.current.currentTime + 5
                );
              }
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200"
            title="Forward 5 seconds"
          >
            <SkipForward size={15} />
          </button>

          {/* Current Time */}
          <span className="w-12 text-center text-xs font-semibold">
            {formatTime(currentTime)}
          </span>

          {/* Progress Slider */}
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={(e) => {
              const value = Number(e.target.value);

              if (audioRef.current) {
                audioRef.current.currentTime = value;
              }

              setCurrentTime(value);
            }}
            className="h-1 flex-1 cursor-pointer accent-blue-600"
          />

          {/* Duration */}
          <span className="w-12 text-center text-xs font-semibold">
            {formatTime(duration)}
          </span>
        </>
      ) : (
        <div className="text-xs text-gray-400">
          Select an audio file to start playback
        </div>
      )}
    </div>
  );
}