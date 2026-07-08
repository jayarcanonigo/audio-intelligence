"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  uploadAudio,
  getStatus,
  getLogs,
  resetSession,
  stopProcess,
  restartServer,
} from "@/services/api";

import styles from "./page.module.css";
import FilterModal from "@/components/FilterModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const FILTER_STORAGE_KEY = "radioFilterText";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [phrase1, setPhrase1] = useState("");
  const [phrase2, setPhrase2] = useState("");
  const [selectedP1Id, setSelectedP1Id] = useState<number | null>(null);
  const [selectedP2Id, setSelectedP2Id] = useState<number | null>(null);
  const selectedRowRefs = useRef<Record<number, HTMLTableRowElement | null>>({});
  const [disabledLogs, setDisabledLogs] = useState<number[]>([]);
  const [status, setStatus] = useState("idle");
  const [processedTime, setProcessedTime] = useState("00:00:00");
  const [currentSegment, setCurrentSegment] = useState(0);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [checked, setChecked] = useState<number[]>([]);
  const [downloading, setDownloading] = useState(false);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const logIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedResultId, setSelectedResultId] = useState<number | null>(null);
  const logRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const audioRef = useRef<HTMLAudioElement>(null);
  const stopListenerRef = useRef<(() => void) | null>(null);
  const [currentTime, setCurrentTime] = useState("00:00");
  const [duration, setDuration] = useState("00:00");

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }

    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(formatTime(audioRef.current.duration));
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(formatTime(audioRef.current.currentTime));
  };

  // 🔥 PERSISTED FILTER: load from localStorage on first render (SSR-safe)
  const [filterText, setFilterText] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem(FILTER_STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });

  const [isActive, setIsActive] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);

  const seenLogsRef = useRef<Set<number>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isProcessing =
    status === "uploading" ||
    status === "starting" ||
    status === "transcribing" ||
    status === "restarting" ||
    status === "stopping";

  // 🔥 PERSIST FILTER: save to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(FILTER_STORAGE_KEY, filterText);
    } catch (error) {
      console.error("Failed to save filter to localStorage:", error);
    }
  }, [filterText]);

  /* ---------------- LOG STREAM ---------------- */
  useEffect(() => {
    if (!isActive || !sessionId) return;
    let cancelled = false;

    const fetchLogs = async () => {
      try {
        const res = await fetch(`${API_URL}/logs/${sessionId}?t=${Date.now()}`, { cache: "no-store" });
        if (cancelled) return;
        const data = await res.json();
        if (cancelled) return;

        const list = Array.isArray(data) ? data : data.logs || [];
        const fresh = list.filter((log: any) => {
          if (!log?.id) return false;
          if (seenLogsRef.current.has(log.id)) return false;
          seenLogsRef.current.add(log.id);
          return true;
        });

        if (cancelled || !fresh.length) return;

        setLogs((prev) => [...prev, ...fresh]);

        const ads = fresh.filter((log: any) => log.advertisement === true);
        if (ads.length) {
          setResults((prev) => [
            ...prev,
            ...ads.map((log: any) => ({
              id: log.id,
              text: log.message || "",
              start: log.start_time || "",
              end: log.end_time || "",
              time: new Date().toLocaleTimeString(),
              advertisement: true,
            })),
          ]);
          setDisabledLogs((prev) => [...prev, ...ads.map((log: any) => log.id)]);
        }
      } catch (error) {
        if (!cancelled) console.error("Log fetch error:", error);
      }
    };

    fetchLogs();
    logIntervalRef.current = setInterval(fetchLogs, 1000);

    return () => {
      cancelled = true;
      if (logIntervalRef.current) {
        clearInterval(logIntervalRef.current);
        logIntervalRef.current = null;
      }
    };
  }, [isActive, sessionId]);

  /* ---------------- STATUS ---------------- */
  const startPolling = (id: string) => {
    if (!id) return;
    if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);

    statusIntervalRef.current = setInterval(async () => {
      try {
        const data = await getStatus(id);
        setStatus(data.status ?? "idle");
        setProcessedTime(data.processed_time ?? "00:00:00");
        setCurrentSegment(data.current_segment ?? 0);
        if (data.status === "completed") {
          setTimeout(() => {
            setIsActive(false);
            if (statusIntervalRef.current) {
              clearInterval(statusIntervalRef.current);
              statusIntervalRef.current = null;
            }
          }, 2000); // grace period for final logs
        }
      } catch (error) {
        console.error("Polling error:", error);
        if (statusIntervalRef.current) {
          clearInterval(statusIntervalRef.current);
          statusIntervalRef.current = null;
        }
      }
    }, 1000);
  };

  const handleEdit = (row: any) => {
    setEditingId(row.id);
    setEditText(row.text);
  };

  const audioUrl = useMemo(() => {
    if (!file) return "";
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleSaveEdit = (id: number) => {
    setResults((prev) => prev.map((r) => (r.id === id ? { ...r, text: editText } : r)));
    setEditingId(null);
    setEditText("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleClear = () => {
  setSearch("");
  setPhrase1("");
  setPhrase2("");
  setSelectedP1Id(null);
  setSelectedP2Id(null);

  searchInputRef.current?.focus();
};

  const clearAllIntervals = () => {
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }
    if (logIntervalRef.current) {
      clearInterval(logIntervalRef.current);
      logIntervalRef.current = null;
    }
  };

  /* ---------------- UPLOAD ---------------- */
  const handleUpload = async () => {
    if (!file) return alert("Select a file");

    setIsUploaded(true);
    setStatus("uploading");
    setIsActive(false); // 🔥 HARD STOP UI FIRST
    setLogs([]);
    setResults([]);
    setChecked([]);
    seenLogsRef.current.clear();

    // 🔥 IMPORTANT: stop intervals BEFORE reset
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }
    if (logIntervalRef.current) {
      clearInterval(logIntervalRef.current);
      logIntervalRef.current = null;
    }

    try {
      // 🔥 SAFE RESET WITH TRY/CATCH
      if (sessionId) {
        try {
          await resetSession(sessionId);
        } catch (e) {
          console.error("reset failed:", e);
        }
      }

      await new Promise((r) => setTimeout(r, 300)); // 🔥 small delay prevents race condition

      const keywords = filterText.split("\n").map((x) => x.trim()).filter(Boolean);
      const result = await uploadAudio(file, keywords);
      if (!result.session_id) throw new Error("No session id returned");

      const newSessionId = result.session_id;
      setSessionId(newSessionId);

      const fresh = await getLogs(newSessionId);
      const initial = Array.isArray(fresh) ? fresh : fresh.logs || [];
      setLogs(initial);
      seenLogsRef.current = new Set(initial.map((l: any) => l.id));

      setIsActive(true);
      startPolling(newSessionId);
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  /* ---------------- CHECK ---------------- */
  const handleCheck = (log: any) => {
    if (disabledLogs.includes(log.id)) return;

    setResults((prev) => [
      ...prev,
      {
        id: log.id,
        text: log?.message || "",
        start: log?.start_time || "",
        end: log?.end_time || "",
        time: new Date().toLocaleTimeString(),
      },
    ]);
    setChecked((prev) => [...prev, log.id]);
    setDisabledLogs((prev) => [...prev, log.id]);
    toast.success("✅ Segment successfully added!");
  };

  /* ---------------- REMOVE ---------------- */
  const handleRemove = (id: number) => {
    const row = results.find((r) => r.id === id);

    // remove range-based locks
    if (row?.segmentIds?.length) {
      setDisabledLogs((prev) => prev.filter((x) => !row.segmentIds.includes(x)));
    }
    // remove single lock (IMPORTANT FIX)
    setDisabledLogs((prev) => prev.filter((x) => x !== id));

    setResults((prev) => prev.filter((r) => r.id !== id));
    setChecked((prev) => prev.filter((x) => x !== id));
  };

  const parseTime = (time: string) => {
  if (!time) return 0;

  const [h, m, s] = time.split(":");

  return (
    Number(h) * 3600 +
    Number(m) * 60 +
    parseFloat(s)
  );
};

const handleStopSegment = () => {
  const audio = audioRef.current;
  if (!audio) return;

  audio.pause();

  if (stopListenerRef.current) {
    audio.removeEventListener("timeupdate", stopListenerRef.current);
    stopListenerRef.current = null;
  }

  audio.currentTime = 0;
};

const handlePlaySegment = async (row: any) => {
  const audio = audioRef.current;
  if (!audio) return;

  audio.pause();

  if (stopListenerRef.current) {
    audio.removeEventListener("timeupdate", stopListenerRef.current);
    stopListenerRef.current = null;
  }

  const start = parseTime(row.start);
  const end = parseTime(row.end);

  audio.currentTime = start;

  const stop = () => {
    if (audio.currentTime >= end) {
      audio.pause();
      audio.removeEventListener("timeupdate", stop);
      stopListenerRef.current = null;
    }
  };

  stopListenerRef.current = stop;
  audio.addEventListener("timeupdate", stop);

  try {
    await audio.play();
  } catch (err) {
    console.error(err);
  }
};
  /* ---------------- DOWNLOAD ---------------- */
  const handleDownload = async () => {
    const exportData = results.map((r) => ({ Text: r.text, Start: r.start || "-", End: r.end || "-" }));
    const res = await fetch("/api/download-excel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ results: exportData }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "radio_segments.xlsx";
    a.click();
  };

const handleAddRange = () => {
  if (selectedP1Id == null || selectedP2Id == null) {
    alert("Select P1 and P2");
    return;
  }

  const startIndex = logs.findIndex((l) => l.id === selectedP1Id);
  const endIndex = logs.findIndex((l) => l.id === selectedP2Id);

  if (startIndex === -1 || endIndex === -1) {
    toast.error("Invalid selection.");
    return;
  }

  if (startIndex >= endIndex) {
    toast.error("P2 must be after P1.");
    return;
  }

  const rangeLogs = logs.slice(startIndex, endIndex + 1);
  const ids = rangeLogs.map((x) => x.id);

  const newSegment = {
    id: Date.now(),
    text: rangeLogs.map((x) => x.message).join(" "),
    start: rangeLogs[0].start_time,
    end: rangeLogs[rangeLogs.length - 1].end_time,
    time: new Date().toLocaleTimeString(),
    segmentIds: ids,
  };

  // Remove any existing rows that overlap this range
  const updatedResults = results.filter((row) => {
    const rowIds = row.segmentIds ?? [row.id];
    return !rowIds.some((id: number) => ids.includes(id));
  });

  const finalResults = [...updatedResults, newSegment];

  setResults(finalResults);

  // Rebuild disabled logs
  const disabled = finalResults.flatMap((row) =>
    row.segmentIds ?? [row.id]
  );

  setDisabledLogs([...new Set(disabled)]);

  // Clear selections
  setPhrase1("");
  setPhrase2("");
  setSelectedP1Id(null);
  setSelectedP2Id(null);

  // Highlight new row
  setSelectedResultId(newSegment.id);

  // Scroll to the new row
  requestAnimationFrame(() => {
    selectedRowRefs.current[newSegment.id]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  });

  toast.success("✅ Segment successfully added!");
};
  /* ---------------- FILTER ---------------- */
  const filteredLogs = useMemo(() => {
    const q = search.toLowerCase();
    return logs.filter((l) => (l?.message || "").toLowerCase().includes(q));
  }, [logs, search]);

  /* ---------------- UI ---------------- */
  return (
    <div className={styles.page}>
      <FilterModal
        open={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={(value) => setFilterText(value)}
        defaultValue={filterText}
      />
      <div className={styles.header}>
        <h1 className={styles.title}>📻 Radio Search Dashboard</h1>
        <p className={styles.subtitle}>
          AI Transcription • Smart Segment Merging • Advertisement Detection • Highlighted Phrase Matching
        </p>
      </div>

      <div className={styles.grid}>
        {/* LEFT */}
        <div className={styles.card}>
          <h3 className={styles.sectionTitle}>Upload Audio</h3>

          <div className={styles.controlRow}>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) {
                  setFile(selectedFile);
                  setIsUploaded(false);
                  setStatus("idle");
                }
              }}
              className={styles.fileInput}
            />

            <button className={styles.primaryBtn} onClick={handleUpload} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "▶ Start"}
            </button>

            <button className={styles.smallBtn} onClick={() => setShowFilterModal(true)}>
              🔎 Filter
            </button>

            <button
              className={styles.smallBtn}
              onClick={async () => {
                if (!sessionId) return;
                try {
                  await stopProcess(sessionId);
                  setStatus("stopped");
                  setIsActive(false);
                  if (logIntervalRef.current) {
                    clearInterval(logIntervalRef.current);
                    logIntervalRef.current = null;
                  }
                  if (statusIntervalRef.current) {
                    clearInterval(statusIntervalRef.current);
                    statusIntervalRef.current = null;
                  }
                } catch (error) {
                  console.error("Stop failed", error);
                }
              }}
              disabled={!sessionId || !isProcessing}
            >
              ⛔ Stop
            </button>

            <button
              className={styles.smallBtn}
              onClick={async () => {
                try {
                  if (sessionId) {
                    await stopProcess(sessionId);
                    setIsActive(false);
                    if (logIntervalRef.current) {
                      clearInterval(logIntervalRef.current);
                      logIntervalRef.current = null;
                    }
                    if (statusIntervalRef.current) {
                      clearInterval(statusIntervalRef.current);
                      statusIntervalRef.current = null;
                    }
                  }
                  setStatus("restarting");
                  const data = await restartServer();
                  setStatus(data.success ? "restarted" : "restart_failed");
                } catch (error) {
                  console.error("Restart failed", error);
                  setStatus("restart_failed");
                }
              }}
            >
              🔄 Restart
            </button>
          </div>
          <div className={styles.statusRow}>
            <span><b>Status:</b> {status}</span>
            <span><b>Segment:</b> {currentSegment}</span>
            <span><b>Time:</b> {processedTime}</span>
          </div>

          <div className={styles.logBox}>
            <h4 className={styles.boxTitle}>Live Logs</h4>

            {filteredLogs.map((log) => {
              const text = log?.message || "";
              const disabled = disabledLogs.includes(log.id);
              const isP1 = selectedP1Id === log.id;
              const isP2 = selectedP2Id === log.id;

              return (
                <div
                  key={log.id}
                  ref={(el) => {
                    logRefs.current[log.id] = el;
                  }}
                  className={styles.logItem}
                  style={{
                    borderLeft: isP1 ? "4px solid #22c55e" : "4px solid transparent",
                    borderRight: isP2 ? "4px solid #f59e0b" : "4px solid transparent",
                    background:
                      selectedResultId === log.id
                        ? "rgba(59,130,246,.2)"
                        : disabled
                        ? "linear-gradient(135deg,#1e3a8a33,#3b82f633,#06b6d433)"
                        : "transparent",
                  }}
                >
                  {/* LEFT BUTTONS */}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      className={styles.smallBtn}
                      onClick={() => {
                        setPhrase1(text);
                        setSelectedP1Id(log.id);
                      }}
                                        style={{
                        background: isP1 ? "#22c55e" : undefined,
                      }} >
                      P1
                    </button>
                    <button
                      className={styles.smallBtn}
                      onClick={() => handleCheck(log)}
                      disabled={disabled}
                      style={{ opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? "none" : "auto" }}
                    >
                      +
                    </button>
                  </div>

                  {/* TEXT */}
                  <div
                    style={{ flex: 1, marginLeft: 10 }}
                    onDoubleClick={() => {
                        setSearch("");
                        setTimeout(() => {
                        searchInputRef.current?.focus();
                        searchInputRef.current?.select();
                      }, 0);
                    }}
                  >
                    <span
                      className={styles.logText}
                      style={{
                        backgroundColor: isP1 ? "rgba(34,197,94,0.15)" : isP2 ? "rgba(245,158,11,0.15)" : "transparent",
                        padding: "2px 4px",
                        borderRadius: 4,
                        cursor: "pointer",
                        textDecoration: "underline",
                        color: "#2563eb",
                      }}
                      onDoubleClick={() => {
                        setSearch(text);
                        setTimeout(() => {
                          searchInputRef.current?.focus();
                          searchInputRef.current?.select();
                        }, 0);
                      }}
                    >
                      {text}
                    </span>
                    <div style={{ fontSize: 11, opacity: 0.6, marginTop: 3 }}>
                      ⏱ {log?.start_time || "-"} → {log?.end_time || "-"}
                    </div>
                  </div>

                  {/* RIGHT BUTTON */}
               <button
                  className={styles.smallBtn}
                  onClick={() => {
                    setPhrase2(text);
                    setSelectedP2Id(log.id);
                  }}
                  style={{
                    background: isP2 ? "#f59e0b" : undefined,
                  }}
                >
                  P2
                </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.sectionTitle}>Selected Segments</h3>
            <button className={styles.downloadBtn} onClick={handleDownload} title="Export Excel">📥</button>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Text</th>
                <th>Start</th>
                <th>End</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[...results]
                .sort((a, b) => (a.start || "99:99:99").localeCompare(b.start || "99:99:99"))
                .map((r) => (
                  <tr key={r.id}
                      ref={(el) => {
                    selectedRowRefs.current[r.id] = el;
                  }}
                   onClick={() => {
                    setSelectedResultId(r.id);
                    handlePlaySegment(r);
                    logRefs.current[r.id]?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }}
                  style={{
                    cursor: "pointer",
                    background:
                      selectedResultId === r.id ? "rgba(59,130,246,.15)" : undefined,
                  }}
                  >
                    <td className={styles.cell}>
                      {editingId === r.id ? (
                        <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className={styles.editText} rows={3} />
                      ) : (
                        r.text
                      )}
                    </td>
                    <td>{r.start || "-"}</td>
                    <td>{r.end || "-"}</td>
                    <td>
                      {editingId === r.id ? (
                        <>
                          <button className={styles.saveBtn} onClick={() => handleSaveEdit(r.id)} title="Save">💾</button>
                          <button className={styles.deleteBtn} onClick={handleCancelEdit} title="Cancel">❌</button>
                        </>
                      ) : (
                        <>                        
                        <button
                          className={styles.iconBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(r);
                          }}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          className={styles.iconBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(r.id);
                          }}
                          title="Remove"
                        >
                          🗑️
                        </button>
                         
                            </>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {results.length === 0 && <p style={{ opacity: 0.5, marginTop: 10 }}>No segments selected yet</p>}
        </div>

        <div className={styles.footerBar}>
          <input
            ref={searchInputRef}
            className={styles.searchInput}
            placeholder="Search Logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            className={styles.smallBtn}
            onClick={handleClear}
          >
            Clear
          </button>

          <button
            className={styles.primaryBtn}
            onClick={handleAddRange}
            disabled={selectedP1Id == null || selectedP2Id == null}
          >
            Add Segment
          </button>

          {audioUrl ? (
              <audio
                ref={audioRef}
                src={audioUrl}
                controls
                className={styles.audio}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
              />
            ) : (
              <div className={styles.audioPlaceholder}>
                No audio selected
              </div>
            )}

          <span className={styles.audioTime}>
            {currentTime} / {duration}
          </span>
        </div>
      </div>     
    </div>
  );
}
