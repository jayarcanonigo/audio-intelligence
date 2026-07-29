const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ======================================
// PROJECTS
// ======================================

export async function getProjects() {
  const res = await fetch(`${API_URL}/projects`);
  if (!res.ok) throw new Error("Failed to load projects");
  return res.json();
}

export async function getProject(projectId: number) {
  const res = await fetch(`${API_URL}/projects/${projectId}`);
  if (!res.ok) throw new Error("Failed to load project");
  return res.json();
}

export async function createProject(data: {
  name: string;
  broadcast_date: string;
}) {
  console.log("Creating project with data:", data);
  const res = await fetch(`${API_URL}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to create project");
  }

  return res.json();
}

// ======================================
// ADVERTISEMENTS
// ======================================

export async function getAdvertisements(projectId: number) {
  const res = await fetch(`${API_URL}/advertisements/${projectId}`);
  if (!res.ok) throw new Error("Failed to load advertisements");
  return res.json();
}

export async function createAdvertisement(advertisement: any) {
  const res = await fetch(`${API_URL}/advertisements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project_id: advertisement.project_id,
      text: advertisement.text,
      brand_name: advertisement.brand_name,
      start_time: advertisement.start,
      end_time: advertisement.end,
    }),
  });
  if (!res.ok) throw new Error("Failed to create advertisement");
  return res.json();
}

export async function updateAdvertisement(id: number, data: any) {
  const res = await fetch(`${API_URL}/advertisements/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: data.text,
      brand_name: data.brand_name,
      start_time: data.start,
      end_time: data.end,
    }),
  });
  if (!res.ok) throw new Error("Failed to update advertisement");
  return res.json();
}

export async function deleteAdvertisement(id: number) {
  const res = await fetch(`${API_URL}/advertisements/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete advertisement");
  return res.json();
}

export async function deleteAdvertisementsByProject(projectId: number) {
  const res = await fetch(`${API_URL}/advertisements/project/${projectId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete advertisements");
  return res.json();
}

// ======================================
// SAVE PROJECT
// ======================================

export async function saveProject(projectId: number, payload: any) {
  const res = await fetch(`${API_URL}/projects/${projectId}/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }
  return res.json();
}

// ======================================
// TRANSCRIPT LOGS
// ======================================

// ======================================
// TRANSCRIPT LOGS
// ======================================

export async function getLogs(
  projectId: number,
  hour?: number
) {
  let url = `${API_URL}/upload/logs/${projectId}`;

  if (hour !== undefined) {
    url += `?hour=${hour}`;
  }

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Failed to load logs");
  }

  return res.json();
}

// ======================================
// DELETE PROJECT
// ======================================

export async function deleteProject(id: number) {
  const res = await fetch(`${API_URL}/projects/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Delete project failed");
  return res.json();
}

// ======================================
// AUDIO UPLOAD
// ======================================

export async function uploadAudio(
  projectId: number,
  file: File,
  startHour: string
) {
  const formData = new FormData();

  formData.append("project_id", projectId.toString());
  formData.append("file", file);
  formData.append("start_hour", startHour);

  const res = await fetch(`${API_URL}/upload/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Upload failed");

  return res.json();
}

// ======================================
// UPLOAD STATUS
// ======================================

export async function getUploadStatus(sessionId: string) {
  const res = await fetch(`${API_URL}/upload/status/${sessionId}`);
  if (!res.ok) throw new Error("Failed to load upload status");
  return res.json();
}

// ======================================
// BRANDS
// ======================================

export async function getBrands() {
  const res = await fetch(`${API_URL}/brands`);
  if (!res.ok) throw new Error("Failed to load brands");
  return res.json();
}

export async function getBrand(id: number) {
  const res = await fetch(`${API_URL}/brands/${id}`);
  if (!res.ok) throw new Error("Failed to load brand");
  return res.json();
}

export async function createBrand(
  name: string
) {

  const res = await fetch(
    `${API_URL}/brands`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        name,
      }),

    }
  );

  if (!res.ok) {

    const error = await res.json();

    throw new Error(
      error.detail || "Unable to create brand"
    );

  }

  return res.json();

}
export async function updateBrand(id: number, name: string) {
  const res = await fetch(`${API_URL}/brands/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Failed to update brand");
  return res.json();
}

export async function deleteBrand(id: number) {
  const res = await fetch(`${API_URL}/brands/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete brand");
  return res.json();
}

export async function deleteAdvertisementsByProjectHour(
  projectId: number,
  hour: number
) {
  const response = await fetch(
    `${API_URL}/advertisements/project/${projectId}/hour/${hour}`,
    {
      method: "DELETE",
    }
  );

  return response.json();
}

export async function getAdvertisementsByProjectHour(
  projectId: number,
  hour: number
) {
  const res = await fetch(
    `${API_URL}/advertisements/project/${projectId}/hour/${hour}`
  );

  if (!res.ok) {
    throw new Error("Failed loading advertisements");
  }

  return res.json();
}

// ======================================
// KEYWORDS
// ======================================

export async function getKeywords() {
  const res = await fetch(`${API_URL}/keywords/`);
  if (!res.ok) throw new Error("Failed to load keywords");
  return res.json();
}

export async function getKeywordsByBrand(brandId: number) {
  const res = await fetch(`${API_URL}/keywords/brand/${brandId}`);
  if (!res.ok) throw new Error("Failed to load brand keywords");
  return res.json();
}

export async function createKeyword(data: {
  brand_id: number;
  keyword: string;
}) {
  const res = await fetch(`${API_URL}/keywords/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to create keyword");
  return res.json();
}

export async function updateKeyword(
  id: number,
  data: {
    brand_id?: number;
    keyword?: string;
  }
) {
  const res = await fetch(`${API_URL}/keywords/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to update keyword");
  return res.json();
}

export async function deleteKeyword(id: number) {
  const res = await fetch(`${API_URL}/keywords/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error("Failed to delete keyword");
  return res.json();
}

export async function getSegmentHours(projectId: number) {
  const res = await fetch(
    `${API_URL}/segments/hours/${projectId}`
  );

  if (!res.ok) {
    throw new Error("Failed to load segment hours");
  }

  return res.json();
}