const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// -------------------------
export async function uploadAudio(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

// -------------------------
export async function getStatus() {
  const res = await fetch(`${API_URL}/status`);
  if (!res.ok) throw new Error("Status failed");
  return res.json();
}

// -------------------------
export async function getLogs() {
  const res = await fetch(`${API_URL}/logs`);
  if (!res.ok) throw new Error("Logs failed");
  return res.json();
}

// -------------------------
export async function resetSession() {
  const res = await fetch(`${API_URL}/reset`, {
    method: "POST",
  });

  if (!res.ok) throw new Error("Reset failed");
  return res.json();
}