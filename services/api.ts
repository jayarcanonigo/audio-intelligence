const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function uploadAudio(
  file: File,
  keywords: string[] = []
) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("keywords", JSON.stringify(keywords));

  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Upload failed");

  return res.json();
}

export async function getStatus(sessionId: string) {
  const res = await fetch(
    `${API_URL}/status/${sessionId}`
  );

  if (!res.ok) throw new Error("Status failed");

  return res.json();
}

export async function getLogs(sessionId: string) {
  const res = await fetch(
    `${API_URL}/logs/${sessionId}?t=${Date.now()}`,
    { cache: "no-store" }
  );

  if (!res.ok) throw new Error("Logs failed");

  return res.json();
}

export async function getTranscript(
  sessionId: string
) {
  const res = await fetch(
    `${API_URL}/transcript/${sessionId}`
  );

  if (!res.ok) throw new Error("Transcript failed");

  return res.json();
}

export async function stopProcess(
  sessionId: string
) {
  const res = await fetch(
    `${API_URL}/stop/${sessionId}`,
    { method: "POST" }
  );

  if (!res.ok) throw new Error("Stop failed");

  return res.json();
}

export async function resetSession(
  sessionId: string
) {
  const res = await fetch(
    `${API_URL}/reset/${sessionId}`,
    { method: "POST" }
  );

  if (!res.ok) throw new Error("Reset failed");

  return res.json();
}

// -------------------------
// RESTART SERVER
// -------------------------

export async function restartServer() {
  const res = await fetch(
    `${API_URL}/restart`,
    { method: "POST" }
  );

  if (!res.ok)
    throw new Error("Restart failed");

  return res.json();
}