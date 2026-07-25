"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import LiveLogs from "@/components/logs/LiveLogs";
import { fetchFile } from "@ffmpeg/util";
import SelectedSegments from "@/components/segments/SelectedSegments";
import AudioPlayer from "@/components/audio/AudioPlayer";
import { useParams, useSearchParams } from "next/navigation";
import {
  getLogs,
  deleteAdvertisementsByProject,
  saveProject,
  createAdvertisement,
  getAdvertisements,
} from "@/services/api";
import { Download, Save, Trash2, Plus, Search, X } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";

export default function AdEditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const projectId = Number(params.id);
  const ffmpegRef = useRef<any>(null);

  const projectName = searchParams.get("name") || `Project #${projectId}`;

  const [logs, setLogs] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [disabledLogs, setDisabledLogs] = useState<number[]>([]);
  const [selectedP1Id, setSelectedP1Id] = useState<number | null>(null);
  const [selectedP2Id, setSelectedP2Id] = useState<number | null>(null);
  const [phrase1, setPhrase1] = useState("");
  const [phrase2, setPhrase2] = useState("");
  const [search, setSearch] = useState("");
  const stopListenerRef = useRef<(() => void) | null>(null);
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [selectedResultId, setSelectedResultId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [currentAudioTime, setCurrentAudioTime] = useState(0);
  const [selectedSegments, setSelectedSegments] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const logRefs = useRef<Record<number, HTMLDivElement | null>>({});
   
  useEffect(() => {
    async function loadLogs() {
      try {
        const data = await getLogs(projectId);
        const list = Array.isArray(data) ? data : data.logs || [];
        setLogs(list);

        const ads = await getAdvertisements(projectId);

        // IF SAVED ADVERTISEMENTS EXIST, LOAD FROM DATABASE
        if (ads && ads.length > 0) {
          const loaded = ads.map((ad: any) => ({
            id: ad.id,
            project_id: ad.project_id,
            text: ad.text,
            start: ad.start_time,
            end: ad.end_time,
            brand_name: ad.brand_name,
            status: "pending",
            advertisement: true,
            segment_type: "advertisement",
            segmentIds: [],
          }));

          setResults(loaded);
          setDisabledLogs(loaded.flatMap((item: any) => item.segmentIds ?? [item.id]));
        } else {
          // NO SAVED ADS, LOAD DETECTED ADVERTISEMENT SEGMENTS FROM LOGS
          const detectedAds = list
            .filter((log: any) => log.segment_type === "advertisement")
            .map((log: any) => ({
              id: log.id,
              text: log.text || log.message || "",
              start: log.start_time,
              end: log.end_time,
              advertisement: true,
              segment_type: "advertisement",
              segmentIds: [log.id],
            }));

          setResults(detectedAds);
          setDisabledLogs(detectedAds.flatMap((item: any) => item.segmentIds ?? [item.id]));
        }
      } catch (err) {
        console.error("Load logs failed", err);
      }
    }

    if (projectId) loadLogs();
  }, [projectId]);

  /* ---------------- DOWNLOAD ---------------- */
const handleDownloadExcel = async () => {

  const getSeconds = (time?: string) => {
    if (!time) return 0;

    const parts = time.split(":").map(Number);

    // HH:MM:SS
    if (parts.length === 3) {
      const [hour, minute, second] = parts;

      return (
        hour * 3600 +
        minute * 60 +
        second
      );
    }

    // MM:SS
    if (parts.length === 2) {
      const [minute, second] = parts;

      return (
        minute * 60 +
        second
      );
    }

    return 0;
  };


  const formatLength = (
    start?: string,
    end?: string
  ) => {

    const totalSeconds =
      getSeconds(end) -
      getSeconds(start);


    const hour =
      Math.floor(totalSeconds / 3600);


    const minute =
      Math.floor(
        (totalSeconds % 3600) / 60
      );


    const second =
      totalSeconds % 60;


    return [
      hour,
      minute,
      second
    ]
      .map((v) =>
        String(v).padStart(2, "0")
      )
      .join(":");
  };


  const exportData = [...results]
    .sort((a, b) => {
      return (
        getSeconds(a.start) -
        getSeconds(b.start)
      );
    })
    .map((r) => ({
      
      "Start HH:MM:SS":
        r.start || "00:00:00",

      "End time HH:MM:SS":
        r.end || "00:00:00",

      "ACTUAL LENGTH":
        formatLength(
          r.start,
          r.end
        ),

      "BRAND":
        r.brand_name || "",

      "COPYLINE":
        r.text || "",

    }));


  console.log(
    "Excel Export:",
    exportData
  );


  if (exportData.length === 0) {
    toast.warning(
      "No advertisements to export"
    );
    return;
  }


  try {

    const res = await fetch(
      "/api/download-excel",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          results: exportData,
        }),
      }
    );


    if (!res.ok) {
      throw new Error(
        "Excel export failed"
      );
    }


    const blob =
      await res.blob();


    const url =
      URL.createObjectURL(blob);


    const a =
      document.createElement("a");


    a.href = url;

    a.download =
      "advertisement_report.xlsx";


    document.body.appendChild(a);

    a.click();


    document.body.removeChild(a);


    URL.revokeObjectURL(url);


    toast.success(
      "Excel downloaded successfully"
    );


  } catch (error) {

    console.error(
      "Excel download error:",
      error
    );

    toast.error(
      "Failed to download Excel"
    );

  }
};
  const handleDownloadAudio = async (segment: any) => {
    if (!file) {
      toast.warning("Please load an audio file first.");
      return;
    }

    setDownloading(true);

    try {
      if (!ffmpegRef.current) {
        const { FFmpeg } = await import("@ffmpeg/ffmpeg");
        ffmpegRef.current = new FFmpeg();
        await ffmpegRef.current.load();
      }

      const ffmpeg = ffmpegRef.current;

      await ffmpeg.writeFile("input.mp3", await fetchFile(file));

      await ffmpeg.exec(["-i", "input.mp3", "-ss", segment.start, "-to", segment.end, "-c", "copy", "output.mp3"]);

      const data = await ffmpeg.readFile("output.mp3");
      const blob = new Blob([data], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `Advertisement_${segment.start.replaceAll(":", "-")}_${segment.end.replaceAll(":", "-")}.mp3`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      toast.success("Audio downloaded successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to download audio.");
    } finally {
      setDownloading(false);
    }
  };

  const [lastSavedId, setLastSavedId] = useState<number | null>(null);

function handleUpdateSegment(
  id: number,
  data: {
    text: string;
    start: string;
    end: string;
    brand_name: string;
    status: "pending" | "completed";
  }
) {
  console.log("UPDATE SEGMENT ID:", id);
  console.log("UPDATE DATA:", data);

  // save the last edited segment id
  setLastSavedId(id);

  setResults((prev) =>
    prev.map((item) =>
      item.id === id
        ? {
            ...item,
            text: data.text,
            start: data.start,
            end: data.end,
            brand_name: data.brand_name,
            status: data.status,
          }
        : item
    )
  );
}


  /* TIME HELPERS */
  const toSeconds = (time?: string) => {
    if (!time) return null;
    const parts = time.split(":").map(Number);
    if (parts.length === 3) {
      const [, minute, second] = parts;
      return minute * 60 + second;
    }
    if (parts.length === 2) {
      const [minute, second] = parts;
      return minute * 60 + second;
    }
    return null;
  };

  const parseTime = (time: string) => {
    const parts = time.split(":").map(Number);
    if (parts.length === 3) {
      const [, minute, second] = parts;
      return minute * 60 + second;
    }
    if (parts.length === 2) {
      const [minute, second] = parts;
      return minute * 60 + second;
    }
    return 0;
  };

  /* FILTER */
  const filteredLogs = useMemo(() => {
    const q = search.toLowerCase();
    return logs.filter((log) => (log.text || log.message || "").toLowerCase().includes(q));
  }, [logs, search]);

  /* PLAY SEGMENT */
  const handlePlaySegment = async (row: any) => {
    const audio = audioRef.current;
    if (!audio) return;

    const start = row.start ?? row.start_time;
    const end = row.end ?? row.end_time;
    if (!start || !end) return;

    try {
      if (stopListenerRef.current) {
        audio.removeEventListener("timeupdate", stopListenerRef.current);
        stopListenerRef.current = null;
      }

      audio.pause();
      await new Promise((resolve) => setTimeout(resolve, 50));
      audio.currentTime = parseTime(start);

      const stop = () => {
        if (audio.currentTime >= parseTime(end)) {
          audio.pause();
          audio.removeEventListener("timeupdate", stop);
          stopListenerRef.current = null;
        }
      };

      stopListenerRef.current = stop;
      audio.addEventListener("timeupdate", stop);
      await audio.play();
    } catch (err: any) {
      if (err.name !== "AbortError") console.error("Audio error", err);
    }
  };

  const handleDeleteAllAdvertisements = async () => {
    try {
      await deleteAdvertisementsByProject(projectId);
      setResults([]);
      setDisabledLogs([]);
      toast.success("🗑 All advertisements deleted");
    } catch (error: any) {
      console.error("DELETE ERROR", error);
      toast.error(error.message || "Delete failed");
    }
  };

  /* ADD P1 - P2 RANGE */
  const handleAddRange = async () => {
    if (selectedP1Id === null || selectedP2Id === null) {
      toast.warning("Select P1 and P2 first");
      return;
    }

    const startIndex = logs.findIndex((l) => l.id === selectedP1Id);
    const endIndex = logs.findIndex((l) => l.id === selectedP2Id);

    if (startIndex === -1 || endIndex === -1) {
      toast.error("Invalid selection");
      return;
    }

    if (startIndex >= endIndex) {
      toast.error("P2 must be after P1");
      return;
    }

    const range = logs.slice(startIndex, endIndex + 1);
    const ids = range.map((x) => x.id);

    const newSegment = {
      id: Date.now(),
      text: range.map((x) => x.text || x.message || "").join(" "),
      start: range[0].start_time,
      end: range[range.length - 1].end_time,
      segmentIds: ids,
      advertisement: true,
      status: "pending",
      segment_type: "new",
    };

    // REMOVE DUPLICATED SELECTED LOGS
    const clean = results.filter((row) => {
      const rowIds = row.segmentIds ?? [row.id];
      return !rowIds.some((id: string) => ids.includes(id));
    });

    const updated = [...clean, newSegment];

    setResults(updated);

    // DISABLE USED LOG ROWS
    setDisabledLogs([...new Set(updated.flatMap((x) => x.segmentIds ?? [x.id]))]);

    // RESET P1 / P2
    setSelectedP1Id(null);
    setSelectedP2Id(null);
    setLastSavedId(newSegment.id);

    toast.success("✅ Advertisement segment added");
  };

  /* SAVE SEGMENT */
  async function handleSaveAllSegments() {
    try {
      if (results.length === 0) {
        toast.warning("No advertisements to save");
        return;
      }

      // DELETE OLD ADS
      await deleteAdvertisementsByProject(projectId);

      // CREATE NEW ADS
      for (const segment of results) {
        await createAdvertisement({
          project_id: projectId,
          text: segment.text,
          start: segment.start,
          end: segment.end,
          brand_name: segment.brand_name || "",
        });
      }

      toast.success("✅ Advertisements saved successfully");
    } catch (error: any) {
      console.error("SAVE ERROR", error);
      toast.error(error.message || "Save failed");
    }
  }

  /* REMOVE UI ONLY */
  const handleRemove = (id: number) => {
    setResults((prev) => prev.filter((r) => r.id !== id));

    // update disabled logs
    const updated = results.filter((r) => r.id !== id);
    setDisabledLogs(updated.flatMap((item: any) => item.segmentIds ?? [item.id]));

    toast.success("Removed from selection");
  };

  /* EDIT TIME */
  const updateTimePart = (id: number, field: "start" | "end", part: "minute" | "second", value: string) => {
    const num = Math.max(0, Math.min(59, Number(value) || 0));

    setResults((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;

        const [, mm = "00", ss = "00"] = (r[field] || "00:00:00").split(":");
        const minute = part === "minute" ? String(num).padStart(2, "0") : mm;
        const second = part === "second" ? String(num).padStart(2, "0") : ss;

        return { ...r, [field]: `00:${minute}:${second}` };
      })
    );
  };

  const displayTime = (time: string = "") => {
    const parts = time.split(":");
    return parts.length === 3 ? `${parts[1]}:${parts[2]}` : time;
  };

const handleCenterLastCompleted = () => {
  if (!lastSavedId) {
    toast.info("No recently saved segment");
    return;
  }

  console.log("CENTER LAST SAVED:", lastSavedId);

  setSelectedResultId(lastSavedId);

  setTimeout(() => {
    const element = document.getElementById(
      `segment-${lastSavedId}`
    );

    element?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, 200);
};
  /* AUDIO */
  const audioUrl = useMemo(() => {
    if (!file) return "";
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    async function loadAdvertisements() {
      try {
        const response = await getAdvertisements(projectId);
        // put ads into SelectedSegments table
        setResults(response);
      } catch (error) {
        console.error("Failed loading advertisements", error);
      }
    }

    if (projectId) loadAdvertisements();
  }, [projectId]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handleAddSingle = (row: any) => {
    const newSegment = {
      id: row.id,
      text: row.text || row.message || "",
      start: row.start_time,
      end: row.end_time,
      segmentIds: [row.id],
      advertisement: true,
       status: "completed",
      segment_type: "advertisement",
    };

    // prevent duplicate
    const exists = results.some((item) => item.segmentIds?.includes(row.id) || item.id === row.id);

    if (exists) {
      toast.info("Already added");
      return;
    }

    const updatedResults = [...results, newSegment];

    setResults(updatedResults);

    setDisabledLogs([...new Set(updatedResults.flatMap((item: any) => item.segmentIds ?? [item.id]))]);

    toast.success("✅ Segment added");
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentAudioTime(audioRef.current.currentTime);
    }
  };

  /* AUTO SCROLL CURRENT LOG */
  useEffect(() => {
    const current = filteredLogs.find((log) => {
      const start = toSeconds(log.start_time);
      const end = toSeconds(log.end_time);
      return start !== null && end !== null && currentAudioTime >= start && currentAudioTime <= end;
    });

    if (current) {
      logRefs.current[current.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentAudioTime, filteredLogs]);

  return (
    <div className="p-6 space-y-6">
      <ToastContainer position="top-right" autoClose={2000} />

      {/* HEADER */}
      <div className="bg-white rounded-xl shadow p-5">
        <h1 className="text-2xl font-bold">🎧 Ad Editor</h1>
        <p className="text-gray-500">{projectName || `Project #${projectId}`}</p>
      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-12 gap-6 pb-40">
        {/* LOGS */}
        <div className="col-span-5">
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="font-semibold mb-4">Live Logs</h2>
            <LiveLogs
              logs={filteredLogs}
              disabledLogs={disabledLogs}
              selectedP1Id={selectedP1Id}
              selectedP2Id={selectedP2Id}
              currentAudioTime={currentAudioTime}
              logRefs={logRefs}
              selectedLogId={selectedLogId}
              setSelectedLogId={setSelectedLogId}
              setPhrase1={setPhrase1}
              setPhrase2={setPhrase2}
              setSelectedP1Id={setSelectedP1Id}
              setSelectedP2Id={setSelectedP2Id}
              onPlay={handlePlaySegment}
              onAddSingle={handleAddSingle}
            />
          </div>
        </div>

        {/* SEGMENTS */}
        <div className="col-span-7">
          <div className="bg-white rounded-xl shadow p-5">
            <div className="flex justify-between mb-4">
              <h2 className="font-semibold">Selected Segments</h2>
              <span className="text-sm text-gray-500">{results.length} Selected</span>
            </div>

          <SelectedSegments
            segments={results}
            selectedResultId={selectedResultId}
            setSelectedResultId={setSelectedResultId}
            onRemove={handleRemove} 
            onPlay={handlePlaySegment}
            onUpdate={handleUpdateSegment}
            onDownload={handleDownloadAudio}
            onSave={handleSaveAllSegments}
          />
          </div>
        </div>
      </div>

{/* ===================== FOOTER TOOLBAR ===================== */}
<div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-lg">
  <div className="px-3 py-1.5">

    {/* ================= TOP TOOLBAR ================= */}
    <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">

      {/* Left */}
      <div className="flex items-center gap-1.5 flex-wrap">

        <button
          onClick={handleCenterLastCompleted}
          className="flex h-8 items-center gap-1 rounded-md bg-purple-600 px-3 text-[11px] font-semibold text-white hover:bg-purple-700"
        >
          🎯 Last
        </button>

        <button
          onClick={() => {
            setSearch("");
            setPhrase1("");
            setPhrase2("");
            setSelectedP1Id(null);
            setSelectedP2Id(null);
          }}
          className="flex h-8 items-center gap-1 rounded-md bg-gray-100 px-3 text-[11px] font-medium hover:bg-gray-200"
        >
          <X size={13} />
          Clear
        </button>

        <button
          onClick={handleAddRange}
          disabled={selectedP1Id === null || selectedP2Id === null}
          className={`flex h-8 items-center gap-1 rounded-md px-3 text-[11px] font-semibold transition ${
            selectedP1Id !== null && selectedP2Id !== null
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "cursor-not-allowed bg-gray-300 text-gray-500"
          }`}
        >
          <Plus size={13} />
          Add
        </button>

      </div>

      {/* Divider */}
      <div className="hidden h-6 w-px bg-gray-300 lg:block" />

      {/* Search */}
      <div className="relative flex-1 min-w-[220px]">

        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type="text"
          placeholder="Search transcript..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border py-1.5 pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-blue-500"
        />

      </div>

      {/* Divider */}
      <div className="hidden h-6 w-px bg-gray-300 lg:block" />

      {/* Right */}
      <div className="flex items-center gap-2 flex-wrap">

        {/* Selected */}
        <div className="flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1">
          <span className="text-sm">🏷</span>

          <div className="leading-none">
            <div className="text-[9px] uppercase text-gray-500">
              Selected
            </div>
            <div className="text-[11px] font-bold text-blue-700">
              {results.length}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-300" />

        {/* Apply Label */}
        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">
          Apply to All
        </span>

        {/* Save */}
        <button
          onClick={handleSaveAllSegments}
          disabled={results.length === 0}
          className={`flex h-8 items-center gap-1 rounded-md px-3 text-[11px] font-semibold transition ${
            results.length > 0
              ? "bg-green-600 text-white hover:bg-green-700"
              : "cursor-not-allowed bg-gray-300 text-gray-500"
          }`}
        >
          <Save size={13} />
          Save
        </button>

        {/* Download */}
        <button
          onClick={handleDownloadExcel}
          disabled={results.length === 0}
          className={`flex h-8 items-center gap-1 rounded-md px-3 text-[11px] font-semibold transition ${
            results.length > 0
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "cursor-not-allowed bg-gray-300 text-gray-500"
          }`}
        >
          <Download size={13} />
          Download
        </button>

        {/* Delete */}
        <button
          onClick={handleDeleteAllAdvertisements}
          disabled={results.length === 0}
          className={`flex h-8 items-center gap-1 rounded-md px-3 text-[11px] font-semibold transition ${
            results.length > 0
              ? "bg-red-600 text-white hover:bg-red-700"
              : "cursor-not-allowed bg-gray-300 text-gray-500"
          }`}
        >
          <Trash2 size={13} />
          Delete
        </button>

      </div>

    </div>

    {/* ================= AUDIO PLAYER ================= */}
    <div className="mt-1 border-t pt-1.5">

      <AudioPlayer
        file={file}
        setFile={setFile}
        audioRef={audioRef}
        audioUrl={audioUrl}
        onChange={handleAudioChange}
        onTimeUpdate={handleTimeUpdate}
      />

    </div>

  </div>
</div>
    </div>
  );
}