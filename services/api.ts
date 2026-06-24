const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";


// -------------------------
// UPLOAD
// -------------------------

export async function uploadAudio(
  file: File,
  keywords: string[] = []
) {

  const formData = new FormData();


  formData.append(
    "file",
    file
  );


  // Convert array to JSON string
  formData.append(
    "keywords",
    JSON.stringify(keywords)
  );


  const res = await fetch(
    `${API_URL}/upload`,
    {
      method: "POST",
      body: formData,
    }
  );


  if (!res.ok)
    throw new Error("Upload failed");


  return res.json();

}



// -------------------------
// STATUS
// -------------------------

export async function getStatus(
  sessionId: string
) {

  const res = await fetch(
    `${API_URL}/status/${sessionId}`
  );


  if (!res.ok)
    throw new Error("Status failed");


  return res.json();

}




// -------------------------
// LOGS
// -------------------------

export async function getLogs(
  sessionId: string
) {

  const res = await fetch(
    `${API_URL}/logs/${sessionId}?t=${Date.now()}`,
    {
      cache: "no-store",
    }
  );


  if (!res.ok)
    throw new Error("Logs failed");


  return res.json();

}




// -------------------------
// TRANSCRIPT
// -------------------------

export async function getTranscript(
  sessionId: string
) {

  const res = await fetch(
    `${API_URL}/transcript/${sessionId}`
  );


  if (!res.ok)
    throw new Error("Transcript failed");


  return res.json();

}




// -------------------------
// STOP PROCESS
// -------------------------

export async function stopProcess(
  sessionId: string
) {

  const res = await fetch(
    `${API_URL}/stop/${sessionId}`,
    {
      method: "POST",
    }
  );


  if (!res.ok)
    throw new Error("Stop failed");


  return res.json();

}




// -------------------------
// RESET SESSION
// -------------------------

export async function resetSession(
  sessionId: string
) {

  const res = await fetch(
    `${API_URL}/reset/${sessionId}`,
    {
      method: "POST",
    }
  );


  if (!res.ok)
    throw new Error("Reset failed");


  return res.json();

}