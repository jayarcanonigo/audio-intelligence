"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);

  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");

  const [phrase, setPhrase] = useState("");

  const [timeline, setTimeline] = useState<any>(null);
  const [singleResults, setSingleResults] = useState<any[]>([]);

  const [mode, setMode] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------------- UPLOAD ----------------
  const uploadAudio = async () => {
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    await fetch("http://localhost:8000/upload", {
      method: "POST",
      body: formData,
    });

    setLoading(false);
    alert("Upload done!");
  };

  // ---------------- TWO-PHRASE SEARCH ----------------
  const searchTimeline = async () => {
    setLoading(true);

    const url = `http://localhost:8000/search?first=${encodeURIComponent(
      first
    )}&last=${encodeURIComponent(last)}`;

    const res = await fetch(url);
    const data = await res.json();

    console.log("TIMELINE RESULT:", data);

    setMode(data.mode);
    setTimeline(data);
    setSingleResults([]);

    setLoading(false);
  };

  // ---------------- SINGLE PHRASE SEARCH ----------------
  const searchPhrase = async () => {
    setLoading(true);

    const url = `http://localhost:8000/search-phrase?q=${encodeURIComponent(
      phrase
    )}`;

    const res = await fetch(url);
    const data = await res.json();

    console.log("SINGLE RESULT:", data);

    setMode(data.mode);
    setSingleResults(data.results || []);
    setTimeline(null);

    setLoading(false);
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>📻 Radio Search System</h2>

      {/* ---------------- UPLOAD ---------------- */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button onClick={uploadAudio} disabled={loading}>
          Upload Audio
        </button>
      </div>

      <hr />

      {/* ---------------- TWO PHRASE SEARCH ---------------- */}
      <h3>🔎 Timeline Search (First + Last Phrase)</h3>

      <input
        placeholder="First phrase"
        value={first}
        onChange={(e) => setFirst(e.target.value)}
        style={{ width: 220, marginRight: 10 }}
      />

      <input
        placeholder="Last phrase"
        value={last}
        onChange={(e) => setLast(e.target.value)}
        style={{ width: 220, marginRight: 10 }}
      />

      <button onClick={searchTimeline} disabled={loading}>
        Search Timeline
      </button>

      <hr />

      {/* ---------------- SINGLE SEARCH ---------------- */}
      <h3>🔍 Single Phrase Search</h3>

      <input
        placeholder="Enter phrase"
        value={phrase}
        onChange={(e) => setPhrase(e.target.value)}
        style={{ width: 300, marginRight: 10 }}
      />

      <button onClick={searchPhrase} disabled={loading}>
        Search Phrase
      </button>

      {/* ---------------- RESULTS ---------------- */}
      <div style={{ marginTop: 30 }}>
        <h3>Results</h3>

        {/* ---------------- TIMELINE RESULT ---------------- */}
        {timeline && timeline.found && (
          <div
            style={{
              background: "#e8f4ff",
              padding: 15,
              borderRadius: 8,
              marginBottom: 20,
            }}
          >
            <h4>📍 Timeline Result</h4>

            <p>
              <b>Start Segment:</b> {timeline.first_segment.index}
            </p>
            <p>{timeline.first_segment.text}</p>
            <small>⏱ {timeline.first_segment.time}</small>

            <hr />

            <p>
              <b>End Segment:</b> {timeline.last_segment.index}
            </p>
            <p>{timeline.last_segment.text}</p>
            <small>⏱ {timeline.last_segment.time}</small>

            <hr />

            <p>
              <b>Range:</b> {timeline.range.start_segment} →{" "}
              {timeline.range.end_segment}
            </p>
          </div>
        )}

        {/* ---------------- SINGLE RESULTS ---------------- */}
        {singleResults.length > 0 &&
          singleResults.map((r, i) => (
            <div
              key={i}
              style={{
                background: "#eee",
                padding: 10,
                marginBottom: 10,
                borderRadius: 5,
              }}
            >
              <p>{r.text}</p>
              <small>
                ⏱ {r.start_time} → {r.end_time}
              </small>
            </div>
          ))}

        {/* ---------------- NO RESULT ---------------- */}
        {mode && !timeline?.found && singleResults.length === 0 && (
          <p style={{ color: "red" }}>No results found</p>
        )}
      </div>
    </div>
  );
}