"use client";

import { useState, useEffect, useRef } from "react";
import {
  uploadAudio,
  getStatus,
  getLogs,
  resetSession,
} from "@/services/api";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);

  const [search, setSearch] = useState(""); // ✅ RESTORED SEARCH

  const [status, setStatus] = useState("idle");
  const [processedTime, setProcessedTime] = useState("00:00:00");
  const [currentSegment, setCurrentSegment] = useState(0);

  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [checked, setChecked] = useState<number[]>([]);

  const [downloading, setDownloading] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ---------------- LOG STREAM ----------------
  useEffect(() => {
    const fetchLogs = async () => {
      const res = await fetch(`${API_URL}/logs?t=${Date.now()}`, {
        cache: "no-store",
      });

      const data = await res.json();
      setLogs(data.logs || []);
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 1000);

    return () => clearInterval(interval);
  }, []);

  // ---------------- STATUS ----------------
  const startPolling = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      const data = await getStatus();

      setStatus(data.status);
      setProcessedTime(data.processed_time);
      setCurrentSegment(data.current_segment);

      if (data.status === "completed" || data.status === "error") {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
      }
    }, 1000);
  };

  // ---------------- UPLOAD ----------------
  const handleUpload = async () => {
    if (!file) return alert("Select a file");

    setStatus("uploading");
    setLogs([]);
    setResults([]);
    setChecked([]);

    await resetSession();
    await uploadAudio(file);

    const fresh = await getLogs();
    setLogs(fresh.logs || []);

    startPolling();
  };

  // ---------------- CHECK ----------------
  const handleCheck = (index: number) => {
    setResults((prev) => [
      ...prev,
      {
        id: index,
        text: logs[index],
        time: new Date().toLocaleTimeString(),
      },
    ]);

    setChecked((prev) => [...prev, index]);
  };

  // ---------------- REMOVE ----------------
  const handleRemove = (id: number) => {
    setResults((prev) => prev.filter((r) => r.id !== id));
    setChecked((prev) => prev.filter((x) => x !== id));
  };

  // ---------------- DOWNLOAD ----------------
  const handleDownload = async () => {
    try {
      setDownloading(true);

      const res = await fetch("/api/download-excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ results }),
      });

      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "radio_segments.xlsx";

      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  // FILTERED LOGS (search)
  const filteredLogs = logs.filter((l) =>
    l.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>📻 Radio Search Dashboard</h1>
        <p style={styles.subtitle}>
          Real-time transcription & segment tracking system
        </p>
      </div>

      <div style={styles.grid}>
        {/* LEFT */}
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Upload Audio</h3>

          {/* FILE + BUTTON ROW */}
          <div style={styles.uploadRow}>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={styles.fileInput}
            />

            <button style={styles.primaryBtn} onClick={handleUpload}>
              Start Processing
            </button>
          </div>

          {/* ✅ SEARCH RESTORED UNDER FILE */}
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />

          <div style={styles.statusRow}>
            <span><b>Status:</b> {status}</span>
            <span><b>Segment:</b> {currentSegment}</span>
            <span><b>Time:</b> {processedTime}</span>
          </div>

          <div style={styles.logBox}>
            <h4 style={styles.boxTitle}>Live Logs</h4>

            {filteredLogs.length === 0 ? (
              <p style={{ opacity: 0.5 }}>Waiting for logs...</p>
            ) : (
              filteredLogs.map((log, i) => (
                <div key={i} style={styles.logItem}>
                  <span style={styles.logText}>{log}</span>

                  {!checked.includes(i) && (
                    <button
                      style={styles.smallBtn}
                      onClick={() => handleCheck(i)}
                    >
                      +
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.sectionTitle}>Selected Segments</h3>

            <button style={styles.downloadBtn} onClick={handleDownload}>
              {downloading ? "Exporting..." : "⬇ Export Excel"}
            </button>
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Text</th>
                <th>Time</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {results.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td style={styles.cell}>{r.text}</td>
                  <td>{r.time}</td>
                  <td>
                    <button
                      style={styles.deleteBtn}
                      onClick={() => handleRemove(r.id)}
                    >
                      remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {results.length === 0 && (
            <p style={{ opacity: 0.5, marginTop: 10 }}>
              No segments selected yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const styles: any = {
  page: {
    padding: 24,
    background: "#0b1220",
    color: "#e5e7eb",
    minHeight: "100vh",
    fontFamily: "Inter, sans-serif",
  },

  header: {
    textAlign: "center",
    marginBottom: 18,
  },

  title: {
    fontSize: 28,
    fontWeight: 700,
  },

  subtitle: {
    opacity: 0.6,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
  },

  card: {
    background: "#111827",
    border: "1px solid #1f2937",
    borderRadius: 12,
    padding: 16,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
  },

  uploadRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },

  fileInput: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    background: "#0b1220",
    border: "1px solid #374151",
    color: "#fff",
  },

  searchInput: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    background: "#0b1220",
    border: "1px solid #374151",
    color: "#fff",
  },

  primaryBtn: {
    padding: "10px 14px",
    borderRadius: 8,
    background: "#3b82f6",
    border: "none",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },

  statusRow: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    background: "#0b1220",
    border: "1px solid #1f2937",
    fontSize: 13,
  },

  logBox: {
    marginTop: 12,
    maxHeight: 320,
    overflowY: "auto",
  },

  boxTitle: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 8,
  },

  logItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 0",
    borderBottom: "1px solid #1f2937",
  },

  logText: {
    fontSize: 12,
    opacity: 0.9,
  },

  smallBtn: {
    background: "#22c55e",
    border: "none",
    borderRadius: 6,
    padding: "2px 8px",
    cursor: "pointer",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  downloadBtn: {
    background: "#10b981",
    border: "none",
    padding: "8px 12px",
    borderRadius: 8,
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },

  cell: {
    maxWidth: 260,
    wordBreak: "break-word",
  },

  deleteBtn: {
    background: "#ef4444",
    border: "none",
    padding: "4px 8px",
    borderRadius: 6,
    color: "#fff",
    cursor: "pointer",
  },
};