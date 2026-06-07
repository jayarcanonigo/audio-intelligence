"use client";

import { useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);

  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");

  const [phrase, setPhrase] = useState("");

  const [timelineResults, setTimelineResults] = useState<any[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);

  const [singleResults, setSingleResults] = useState<any[]>([]);

  const [mode, setMode] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------------- UPLOAD ----------------
  const uploadAudio = async () => {
    if (!file) {
      alert("Please select a file.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      alert("Upload completed!");
    } catch (error) {
      console.error(error);
      alert("Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- TIMELINE SEARCH ----------------
  const searchTimeline = async () => {
    if (!first || !last) {
      alert("Please enter both phrases.");
      return;
    }

    try {
      setLoading(true);

      const params = new URLSearchParams({
        first,
        last,
      });

      const res = await fetch(`${API_URL}/search?${params}`);

      if (!res.ok) {
        throw new Error("Search failed");
      }

      const data = await res.json();

      console.log("TIMELINE RESULT:", data);

      setMode("timeline");

      setTimelineResults(data.results || []);
      setTotalMatches(data.total || 0);

      setSingleResults([]);
    } catch (error) {
      console.error(error);
      alert("Timeline search failed.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- SINGLE PHRASE SEARCH ----------------
  const searchPhrase = async () => {
    if (!phrase) {
      alert("Please enter a phrase.");
      return;
    }

    try {
      setLoading(true);

      const params = new URLSearchParams({
        q: phrase,
      });

      const res = await fetch(`${API_URL}/search-phrase?${params}`);

      if (!res.ok) {
        throw new Error("Search failed");
      }

      const data = await res.json();

      console.log("SINGLE RESULT:", data);

      setMode("single");

      setSingleResults(data.results || []);

      setTimelineResults([]);
      setTotalMatches(0);
    } catch (error) {
      console.error(error);
      alert("Phrase search failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "Arial",
        maxWidth: 1000,
        margin: "0 auto",
      }}
    >
      <h2>📻 Radio Search System</h2>

      <p>
        API: <b>{API_URL}</b>
      </p>

      {/* Upload */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button
          onClick={uploadAudio}
          disabled={loading}
          style={{
            marginLeft: 10,
            padding: "8px 16px",
          }}
        >
          Upload Audio
        </button>
      </div>

      <hr />

      {/* Timeline Search */}
      <h3>🔎 Timeline Search</h3>

      <input
        placeholder="First phrase"
        value={first}
        onChange={(e) => setFirst(e.target.value)}
        style={{
          width: 300,
          marginRight: 10,
          padding: 8,
        }}
      />

      <input
        placeholder="Last phrase"
        value={last}
        onChange={(e) => setLast(e.target.value)}
        style={{
          width: 300,
          marginRight: 10,
          padding: 8,
        }}
      />

      <button
        onClick={searchTimeline}
        disabled={loading}
        style={{
          padding: "8px 16px",
        }}
      >
        Search Timeline
      </button>

      <hr />

      {/* Single Search */}
      <h3>🔍 Single Phrase Search</h3>

      <input
        placeholder="Enter phrase"
        value={phrase}
        onChange={(e) => setPhrase(e.target.value)}
        style={{
          width: 400,
          marginRight: 10,
          padding: 8,
        }}
      />

      <button
        onClick={searchPhrase}
        disabled={loading}
        style={{
          padding: "8px 16px",
        }}
      >
        Search Phrase
      </button>

      {loading && (
        <div style={{ marginTop: 20 }}>
          <p>Loading...</p>
        </div>
      )}

      {/* Results */}
      <div style={{ marginTop: 30 }}>
        <h3>Results</h3>

        {/* TIMELINE RESULTS */}
        {timelineResults.length > 0 && (
          <>
            <h4>📍 Timeline Matches ({totalMatches})</h4>

            {timelineResults.map((item, index) => (
              <div
                key={index}
                style={{
                  background: "#e8f4ff",
                  padding: 15,
                  borderRadius: 8,
                  marginBottom: 15,
                  border: "1px solid #cce5ff",
                }}
              >
                <h4>Match #{index + 1}</h4>

                <p>
                  <b>Segment Range:</b>{" "}
                  {item.start_segment} → {item.end_segment}
                </p>

                <p>
                  <b>Start Time:</b> {item.start_time}
                </p>

                <p>
                  <b>End Time:</b> {item.end_time}
                </p>
              </div>
            ))}
          </>
        )}

        {/* SINGLE PHRASE RESULTS */}
        {singleResults.length > 0 && (
          <>
            <h4>🔍 Phrase Matches ({singleResults.length})</h4>

            {singleResults.map((r, i) => (
              <div
                key={i}
                style={{
                  background: "#f3f3f3",
                  padding: 12,
                  marginBottom: 10,
                  borderRadius: 8,
                }}
              >
                <p>{r.text}</p>

                <small>
                  ⏱ {r.start_time} → {r.end_time}
                </small>
              </div>
            ))}
          </>
        )}

        {/* NO RESULTS */}
        {mode &&
          timelineResults.length === 0 &&
          singleResults.length === 0 && (
            <p style={{ color: "red" }}>No results found.</p>
          )}
      </div>
    </div>
  );
}