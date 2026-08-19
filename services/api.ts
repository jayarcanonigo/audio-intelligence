import {
  getAccessToken,
  getTokenType,
} from "./auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";


// ============================================================
// AUTH HEADERS
// ============================================================

function getAuthHeaders(): HeadersInit {
  const token = getAccessToken();
  const tokenType = getTokenType();

  if (!token) {
    return {};
  }

  return {
    Authorization: `${tokenType} ${token}`,
  };
}


// ============================================================
// AUTH FETCH
// ============================================================

async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {

  const headers = new Headers(options.headers);

  const authHeaders = getAuthHeaders();

  Object.entries(authHeaders).forEach(
    ([key, value]) => {
      if (value) {
        headers.set(key, value);
      }
    }
  );

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // ==========================================================
  // UNAUTHORIZED
  // ==========================================================

  if (response.status === 401) {

    if (typeof window !== "undefined") {

      localStorage.removeItem("access_token");
      localStorage.removeItem("token_type");
      localStorage.removeItem("user_id");
      localStorage.removeItem("username");
      localStorage.removeItem("role");

      localStorage.removeItem("user");
      localStorage.removeItem("auth");

      window.location.href = "/login";
    }

    throw new Error(
      "Authentication required"
    );
  }

  return response;
}


// ============================================================
// PROJECTS
// ============================================================

export async function getProjects() {

  const res = await authFetch(
    `${API_URL}/projects`
  );

  if (!res.ok) {

    const error = await res.text();

    throw new Error(
      error || "Failed to load projects"
    );
  }

  return res.json();
}


// ============================================================
// GET PROJECT
// ============================================================

export async function getProject(
  projectId: number
) {

  const res = await authFetch(
    `${API_URL}/projects/${projectId}`
  );

  if (!res.ok) {

    const error = await res.text();

    throw new Error(
      error || "Failed to load project"
    );
  }

  return res.json();
}


// ============================================================
// CREATE PROJECT
// ============================================================

export async function createProject(data: {
  name: string;
  broadcast_date: string;
}) {

  console.log(
    "Creating project with data:",
    data
  );

  const res = await authFetch(
    `${API_URL}/projects`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(data),
    }
  );

  if (!res.ok) {

    const error = await res.text();

    throw new Error(
      error || "Failed to create project"
    );
  }

  return res.json();
}


// ============================================================
// DELETE PROJECT
// ============================================================

export async function deleteProject(
  projectId: number
) {

  const res = await authFetch(
    `${API_URL}/projects/${projectId}`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {

    const error = await res.text();

    throw new Error(
      error || "Delete project failed"
    );
  }

  return res.json();
}


// ============================================================
// SAVE PROJECT / ADS
// ============================================================

export async function saveProject(
  projectId: number,
  payload: any
) {

  const res = await authFetch(
    `${API_URL}/projects/${projectId}/save`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {

    const error = await res.text();

    throw new Error(
      error || "Failed to save project"
    );
  }

  return res.json();
}


// ============================================================
// ADVERTISEMENTS
// ============================================================

export async function getAdvertisements(
  projectId: number
) {

  const res = await authFetch(
    `${API_URL}/advertisements/${projectId}`
  );

  if (!res.ok) {

    const error = await res.text();

    throw new Error(
      error || "Failed to load advertisements"
    );
  }

  return res.json();
}


// ============================================================
// GET ADVERTISEMENTS BY PROJECT + HOUR
// ============================================================

export async function getAdvertisementsByProjectHour(
  projectId: number,
  hour: number
) {

  const res = await authFetch(
    `${API_URL}/advertisements/project/${projectId}/hour/${hour}`
  );

  if (!res.ok) {

    const error = await res.text();

    throw new Error(
      error || "Failed loading advertisements"
    );
  }

  return res.json();
}


// ============================================================
// CREATE ADVERTISEMENT
// ============================================================

export async function createAdvertisement(
  advertisement: any
) {

  const res = await authFetch(
    `${API_URL}/advertisements`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        project_id:
          advertisement.project_id,

        text:
          advertisement.text,

        brand_name:
          advertisement.brand_name,

        start_time:
          advertisement.start,

        end_time:
          advertisement.end,
      }),
    }
  );

  if (!res.ok) {

    const error = await res.text();

    throw new Error(
      error || "Failed to create advertisement"
    );
  }

  return res.json();
}


// ============================================================
// UPDATE ADVERTISEMENT
// ============================================================

export async function updateAdvertisement(
  id: number,
  data: any
) {

  const res = await authFetch(
    `${API_URL}/advertisements/${id}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        text:
          data.text,

        brand_name:
          data.brand_name,

        start_time:
          data.start,

        end_time:
          data.end,
      }),
    }
  );

  if (!res.ok) {

    const error = await res.text();

    throw new Error(
      error || "Failed to update advertisement"
    );
  }

  return res.json();
}


// ============================================================
// DELETE ADVERTISEMENT
// ============================================================

export async function deleteAdvertisement(
  id: number
) {

  const res = await authFetch(
    `${API_URL}/advertisements/${id}`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {

    const error = await res.text();

    throw new Error(
      error || "Failed to delete advertisement"
    );
  }

  return res.json();
}


// ============================================================
// DELETE ALL ADS BY PROJECT
// ============================================================

export async function deleteAdvertisementsByProject(
  projectId: number
) {

  const res = await authFetch(
    `${API_URL}/advertisements/project/${projectId}`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {

    const error = await res.text();

    throw new Error(
      error || "Failed to delete advertisements"
    );
  }

  return res.json();
}


// ============================================================
// DELETE ADS BY PROJECT + HOUR
// ============================================================

export async function deleteAdvertisementsByProjectHour(
  projectId: number,
  hour: number
) {

  const res = await authFetch(
    `${API_URL}/advertisements/project/${projectId}/hour/${hour}`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {

    const error = await res.text();

    throw new Error(
      error ||
      "Failed to delete advertisements"
    );
  }

  return res.json();
}


// ============================================================
// REPROCESS ADVERTISEMENTS
// ============================================================

export async function reprocessAdvertisements(
  projectId: number,
  hour?: number
) {

  const url =
    `${API_URL}/advertisements/project/${projectId}/reprocess` +
    (
      hour !== undefined
        ? `?hour=${hour}`
        : ""
    );

  const res = await authFetch(
    url,
    {
      method: "POST",
    }
  );

  if (!res.ok) {

    const error = await res.text();

    throw new Error(
      error ||
      "Failed to reprocess advertisements"
    );
  }

  return res.json();
}


// ============================================================
// TRANSCRIPT LOGS
// ============================================================

export async function getLogs(
  projectId: number,
  hour?: number
) {

  let url =
    `${API_URL}/upload/logs/${projectId}`;

  if (hour !== undefined) {
    url += `?hour=${hour}`;
  }

  const res = await authFetch(url);

  if (!res.ok) {

    const error = await res.text();

    throw new Error(
      error || "Failed to load logs"
    );
  }

  return res.json();
}


// ============================================================
// AUDIO UPLOAD
// ============================================================

export async function uploadAudio(
  projectId: number,
  file: File,
  startHour: string
) {

  const formData = new FormData();

  formData.append(
    "project_id",
    projectId.toString()
  );

  formData.append(
    "file",
    file
  );

  formData.append(
    "start_hour",
    startHour
  );

  const res = await authFetch(
    `${API_URL}/upload/`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {

    let message =
      "Upload failed";

    try {

      const data =
        await res.json();

      if (
        typeof data?.detail ===
        "string"
      ) {

        message =
          data.detail;
      }

    } catch {

      const text =
        await res.text();

      if (text) {
        message = text;
      }
    }

    throw new Error(message);
  }

  return res.json();
}


// ============================================================
// UPLOAD STATUS
// ============================================================

export async function getUploadStatus(
  sessionId: string
) {

  const res = await authFetch(
    `${API_URL}/upload/status/${sessionId}`
  );

  if (!res.ok) {

    const error = await res.text();

    throw new Error(
      error ||
      "Failed to load upload status"
    );
  }

  return res.json();
}


// ============================================================
// BRANDS
// ============================================================

export async function getBrands() {

  const res = await authFetch(
    `${API_URL}/brands/`
  );

  if (!res.ok) {

    const error = await res.text();

    throw new Error(
      error ||
      "Failed to load brands"
    );
  }

  return res.json();
}


// ============================================================
// GET BRAND
// ============================================================

export async function getBrand(
  id: number
) {

  const res = await authFetch(
    `${API_URL}/brands/${id}`
  );

  if (!res.ok) {

    const error = await res.text();

    throw new Error(
      error ||
      "Failed to load brand"
    );
  }

  return res.json();
}


// ============================================================
// CREATE BRAND
// ============================================================

export async function createBrand(
  name: string
) {

  const res = await authFetch(
    `${API_URL}/brands/`,
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

    let message =
      "Unable to create brand";

    try {

      const error =
        await res.json();

      message =
        error?.detail ||
        message;

    } catch {
      // Ignore JSON parsing error
    }

    throw new Error(message);
  }

  return res.json();
}


// ============================================================
// UPDATE BRAND
// ============================================================

export async function updateBrand(
  id: number,
  name: string
) {

  const res = await authFetch(
    `${API_URL}/brands/${id}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        name,
      }),
    }
  );

  if (!res.ok) {

    const error = await res.text();

    throw new Error(
      error ||
      "Failed to update brand"
    );
  }

  return res.json();
}


// ============================================================
// DELETE BRAND
// ============================================================

export async function deleteBrand(
  id: number
) {

  const res = await authFetch(
    `${API_URL}/brands/${id}`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {

    const error = await res.text();

    throw new Error(
      error ||
      "Failed to delete brand"
    );
  }

  return res.json();
}


// ============================================================
// KEYWORDS
// ============================================================

export async function getKeywords() {

  const res = await authFetch(
    `${API_URL}/keywords/`
  );

  if (!res.ok) {

    const error = await res.text();

    throw new Error(
      error ||
      "Failed to load keywords"
    );
  }

  return res.json();
}


// ============================================================
// GET KEYWORDS BY BRAND
// ============================================================

export async function getKeywordsByBrand(
  brandId: number
) {

  const res = await authFetch(
    `${API_URL}/keywords/brand/${brandId}`
  );

  if (!res.ok) {

    const error = await res.text();

    throw new Error(
      error ||
      "Failed to load brand keywords"
    );
  }

  return res.json();
}


// ============================================================
// CREATE KEYWORD
// ============================================================

export async function createKeyword(data: {
  brand_id: number;
  keyword: string;
  duration?: number | null;
}) {

  const res = await authFetch(
    `${API_URL}/keywords/`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(data),
    }
  );

  if (!res.ok) {

    const error = await res.text();

    throw new Error(
      error ||
      "Failed to create keyword"
    );
  }

  return res.json();
}


// ============================================================
// UPDATE KEYWORD
// ============================================================

export async function updateKeyword(
  id: number,
  data: {
    brand_id?: number;
    keyword?: string;
    duration?: number | null;
  }
) {

  const res = await authFetch(
    `${API_URL}/keywords/${id}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(data),
    }
  );

  if (!res.ok) {

    const error = await res.text();

    throw new Error(
      error ||
      "Failed to update keyword"
    );
  }

  return res.json();
}


// ============================================================
// DELETE KEYWORD
// ============================================================

export async function deleteKeyword(
  id: number
) {

  const res = await authFetch(
    `${API_URL}/keywords/${id}`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {

    const error = await res.text();

    throw new Error(
      error ||
      "Failed to delete keyword"
    );
  }

  return res.json();
}


// ============================================================
// SEGMENTS
// ============================================================

export async function getSegments() {

  const res = await authFetch(
    `${API_URL}/segments/`
  );

  if (!res.ok) {

    const error = await res.text();

    throw new Error(
      error ||
      "Failed to load segments"
    );
  }

  return res.json();
}


// ============================================================
// SEGMENTS BY PROJECT
// ============================================================

export async function getSegmentsByProject(
  projectId: number
) {

  const res = await authFetch(
    `${API_URL}/segments/project/${projectId}`
  );

  if (!res.ok) {

    const error = await res.text();

    throw new Error(
      error ||
      "Failed to load project segments"
    );
  }

  return res.json();
}


// ============================================================
// SEGMENT HOURS
// ============================================================

export async function getSegmentHours(
  projectId: number
) {

  const res = await authFetch(
    `${API_URL}/segments/hours/${projectId}`
  );

  if (!res.ok) {

    const error = await res.text();

    throw new Error(
      error ||
      "Failed to load segment hours"
    );
  }

  return res.json();
}