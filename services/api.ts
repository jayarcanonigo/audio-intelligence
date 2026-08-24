import {
  getAccessToken,
  getTokenType,
} from "./auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

// ============================================================
// TYPES
// ============================================================

export interface Advertisement {
  id: number;

  project_id: number;

  text: string;

  brand_name: string | null;

  start_time: string;

  end_time: string;

  start?: string;

  end?: string;

  detection_key: string | null;

  status: "NEW" | "SAVED";
}

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
    Authorization:
      `${tokenType} ${token}`,
  };
}

// ============================================================
// AUTH FETCH
// ============================================================

async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers =
    new Headers(options.headers);

  const authHeaders =
    getAuthHeaders();

  Object.entries(
    authHeaders
  ).forEach(
    ([key, value]) => {
      if (value) {
        headers.set(
          key,
          value
        );
      }
    }
  );

  console.log(
    "================================"
  );

  console.log(
    "API REQUEST:",
    options.method || "GET"
  );

  console.log(
    "API URL:",
    url
  );

  console.log(
    "================================"
  );

  const response =
    await fetch(
      url,
      {
        ...options,
        headers,
      }
    );

  console.log(
    "================================"
  );

  console.log(
    "API RESPONSE:",
    response.status
  );

  console.log(
    "API URL:",
    url
  );

  console.log(
    "================================"
  );

  // ==========================================================
  // UNAUTHORIZED
  // ==========================================================

  if (
    response.status === 401
  ) {
    if (
      typeof window !==
      "undefined"
    ) {
      localStorage.removeItem(
        "access_token"
      );

      localStorage.removeItem(
        "token_type"
      );

      localStorage.removeItem(
        "user_id"
      );

      localStorage.removeItem(
        "username"
      );

      localStorage.removeItem(
        "role"
      );

      localStorage.removeItem(
        "user"
      );

      localStorage.removeItem(
        "auth"
      );

      window.location.href =
        "/login";
    }

    throw new Error(
      "Authentication required"
    );
  }

  return response;
}

// ============================================================
// NORMALIZE ADVERTISEMENT
// ============================================================

function normalizeAdvertisement(
  item: any
): Advertisement {
  return {
    ...item,

    start:
      item.start ??
      item.start_time ??
      "",

    end:
      item.end ??
      item.end_time ??
      "",

    detection_key:
      item.detection_key ??
      null,

    status:
      item.status ===
      "SAVED"
        ? "SAVED"
        : "NEW",
  };
}

// ============================================================
// NORMALIZE ADVERTISEMENT LIST
// ============================================================

function normalizeAdvertisements(
  data: any
): Advertisement[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(
    normalizeAdvertisement
  );
}

// ============================================================
// PROJECTS
// ============================================================

export async function getProjects() {
  const res =
    await authFetch(
      `${API_URL}/projects`
    );

  if (!res.ok) {
    const error =
      await res.text();

    throw new Error(
      error ||
        "Failed to load projects"
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
  const res =
    await authFetch(
      `${API_URL}/projects/${projectId}`
    );

  if (!res.ok) {
    const error =
      await res.text();

    throw new Error(
      error ||
        "Failed to load project"
    );
  }

  return res.json();
}

// ============================================================
// CREATE PROJECT
// ============================================================

export async function createProject(
  data: {
    name: string;
    broadcast_date: string;
  }
) {
  const res =
    await authFetch(
      `${API_URL}/projects`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(data),
      }
    );

  if (!res.ok) {
    const error =
      await res.text();

    throw new Error(
      error ||
        "Failed to create project"
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
  const res =
    await authFetch(
      `${API_URL}/projects/${projectId}`,
      {
        method: "DELETE",
      }
    );

  if (!res.ok) {
    const error =
      await res.text();

    throw new Error(
      error ||
        "Delete project failed"
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
  console.log(
    "================================"
  );

  console.log(
    "SAVE PROJECT API"
  );

  console.log(
    "PROJECT ID:",
    projectId
  );

  console.log(
    "SAVE PAYLOAD:",
    payload
  );

  console.log(
    "================================"
  );

  const res =
    await authFetch(
      `${API_URL}/projects/${projectId}/save`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(payload),
      }
    );

  if (!res.ok) {
    const error =
      await res.text();

    console.error(
      "SAVE PROJECT FAILED:",
      error
    );

    throw new Error(
      error ||
        "Failed to save project"
    );
  }

  const data =
    await res.json();

  console.log(
    "SAVE PROJECT SUCCESS:",
    data
  );

  return data;
}

// ============================================================
// GET ALL ADVERTISEMENTS
// ============================================================

export async function getAdvertisements(
  projectId: number
): Promise<Advertisement[]> {
  const res =
    await authFetch(
      `${API_URL}/advertisements/${projectId}`
    );

  if (!res.ok) {
    const error =
      await res.text();

    throw new Error(
      error ||
        "Failed to load advertisements"
    );
  }

  const data =
    await res.json();

  return normalizeAdvertisements(
    data
  );
}

// ============================================================
// GET ADVERTISEMENTS BY PROJECT + HOUR
// ============================================================

export async function getAdvertisementsByProjectHour(
  projectId: number,
  hour: number
): Promise<Advertisement[]> {
  const res =
    await authFetch(
      `${API_URL}/advertisements/project/${projectId}/hour/${hour}`
    );

  if (!res.ok) {
    const error =
      await res.text();

    throw new Error(
      error ||
        "Failed loading advertisements"
    );
  }

  const data =
    await res.json();

  return normalizeAdvertisements(
    data
  );
}

// ============================================================
// CREATE ADVERTISEMENT
// ============================================================

export async function createAdvertisement(
  advertisement: {
    project_id: number;

    text: string;

    brand_name?:
      | string
      | null;

    start: string;

    end: string;

    detection_key: string;

    status: string;
  }
) {
  console.log(
    "================================"
  );

  console.log(
    "CREATE ADVERTISEMENT API"
  );

  console.log(
    "PAYLOAD:",
    advertisement
  );

  console.log(
    "================================"
  );

  const res =
    await authFetch(
      `${API_URL}/advertisements`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
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

            detection_key:
              advertisement.detection_key,

            status:
              advertisement.status,
          }),
      }
    );

  if (!res.ok) {
    const error =
      await res.text();

    console.error(
      "CREATE ADVERTISEMENT FAILED:",
      error
    );

    throw new Error(
      error ||
        "Failed to create advertisement"
    );
  }

  const data =
    await res.json();

  console.log(
    "CREATE ADVERTISEMENT SUCCESS:",
    data
  );

  return data;
}

// ============================================================
// UPDATE ADVERTISEMENT
// ============================================================

export async function updateAdvertisement(
  id: number,
  data: {
    text?: string;

    brand_name?:
      | string
      | null;

    start?: string;

    end?: string;

    detection_key?:
      | string
      | null;

    status?:
      | "NEW"
      | "SAVED";
  }
) {
  console.log(
    "================================"
  );

  console.log(
    "UPDATE ADVERTISEMENT API"
  );

  console.log(
    "ADVERTISEMENT ID:",
    id
  );

  console.log(
    "UPDATE DATA:",
    data
  );

  console.log(
    "================================"
  );

  const payload = {
    text:
      data.text,

    brand_name:
      data.brand_name,

    start_time:
      data.start,

    end_time:
      data.end,

    detection_key:
      data.detection_key,

    status:
      data.status,
  };

  console.log(
    "UPDATE PAYLOAD:",
    payload
  );

  const res =
    await authFetch(
      `${API_URL}/advertisements/${id}`,
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            payload
          ),
      }
    );

  console.log(
    "UPDATE RESPONSE STATUS:",
    res.status
  );

  if (!res.ok) {
    const error =
      await res.text();

    console.error(
      "UPDATE ADVERTISEMENT FAILED:",
      {
        id,
        status:
          res.status,
        error,
        payload,
      }
    );

    throw new Error(
      error ||
        "Failed to update advertisement"
    );
  }

  const result =
    await res.json();

  console.log(
    "UPDATE ADVERTISEMENT SUCCESS:",
    result
  );

  return result;
}

// ============================================================
// DELETE SINGLE ADVERTISEMENT
// ============================================================

export async function deleteAdvertisement(
  id: number
) {
  console.log(
    "================================"
  );

  console.log(
    "DELETE ADVERTISEMENT API"
  );

  console.log(
    "Advertisement ID:",
    id
  );

  console.log(
    "DELETE URL:",
    `${API_URL}/advertisements/${id}`
  );

  console.log(
    "================================"
  );

  const res =
    await authFetch(
      `${API_URL}/advertisements/${id}`,
      {
        method: "DELETE",
      }
    );

  console.log(
    "DELETE ADVERTISEMENT RESPONSE:",
    res.status
  );

  if (!res.ok) {
    const error =
      await res.text();

    console.error(
      "DELETE ADVERTISEMENT FAILED:",
      {
        id,
        status:
          res.status,
        error,
      }
    );

    throw new Error(
      error ||
        "Failed to delete advertisement"
    );
  }

  let data: any = null;

  try {
    data =
      await res.json();
  } catch {
    data = null;
  }

  console.log(
    "DELETE ADVERTISEMENT SUCCESS:",
    {
      id,
      data,
    }
  );

  return data;
}

// ============================================================
// DELETE ALL ADS BY PROJECT
// ============================================================

export async function deleteAdvertisementsByProject(
  projectId: number
) {
  const res =
    await authFetch(
      `${API_URL}/advertisements/project/${projectId}`,
      {
        method: "DELETE",
      }
    );

  if (!res.ok) {
    const error =
      await res.text();

    throw new Error(
      error ||
        "Failed to delete advertisements"
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
  console.log(
    "================================"
  );

  console.log(
    "DELETE ADVERTISEMENTS BY HOUR API"
  );

  console.log(
    "Project ID:",
    projectId
  );

  console.log(
    "Hour:",
    hour
  );

  console.log(
    "URL:",
    `${API_URL}/advertisements/project/${projectId}/hour/${hour}`
  );

  console.log(
    "================================"
  );

  const res =
    await authFetch(
      `${API_URL}/advertisements/project/${projectId}/hour/${hour}`,
      {
        method: "DELETE",
      }
    );

  if (!res.ok) {
    const error =
      await res.text();

    console.error(
      "DELETE BY HOUR FAILED:",
      error
    );

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

  console.log(
    "REPROCESS URL:",
    url
  );

  const res =
    await authFetch(
      url,
      {
        method: "POST",
      }
    );

  if (!res.ok) {
    const error =
      await res.text();

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

  if (
    hour !== undefined
  ) {
    url += `?hour=${hour}`;
  }

  const res =
    await authFetch(url);

  if (!res.ok) {
    const error =
      await res.text();

    throw new Error(
      error ||
        "Failed to load logs"
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
  const formData =
    new FormData();

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

  const res =
    await authFetch(
      `${API_URL}/upload/`,
      {
        method: "POST",
        body: formData,
      }
    );

  if (!res.ok) {
    let message =
      "Upload failed";

    const contentType =
      res.headers.get(
        "content-type"
      ) || "";

    try {
      if (
        contentType.includes(
          "application/json"
        )
      ) {
        const data =
          await res.json();

        if (
          typeof data?.detail ===
          "string"
        ) {
          message =
            data.detail;
        } else if (
          typeof data?.message ===
          "string"
        ) {
          message =
            data.message;
        }
      } else {
        const text =
          await res.text();

        if (text) {
          message =
            text;
        }
      }
    } catch {
      // Keep default.
    }

    throw new Error(
      message
    );
  }

  return res.json();
}

// ============================================================
// UPLOAD STATUS
// ============================================================

export async function getUploadStatus(
  sessionId: string
) {
  const res =
    await authFetch(
      `${API_URL}/upload/status/${sessionId}`
    );

  if (!res.ok) {
    const error =
      await res.text();

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
  const res =
    await authFetch(
      `${API_URL}/brands/`
    );

  if (!res.ok) {
    const error =
      await res.text();

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
  const res =
    await authFetch(
      `${API_URL}/brands/${id}`
    );

  if (!res.ok) {
    const error =
      await res.text();

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
  const res =
    await authFetch(
      `${API_URL}/brands/`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
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
      // Ignore.
    }

    throw new Error(
      message
    );
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
  const res =
    await authFetch(
      `${API_URL}/brands/${id}`,
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            name,
          }),
      }
    );

  if (!res.ok) {
    const error =
      await res.text();

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
  const res =
    await authFetch(
      `${API_URL}/brands/${id}`,
      {
        method: "DELETE",
      }
    );

  if (!res.ok) {
    const error =
      await res.text();

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
  const res =
    await authFetch(
      `${API_URL}/keywords/`
    );

  if (!res.ok) {
    const error =
      await res.text();

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
  const res =
    await authFetch(
      `${API_URL}/keywords/brand/${brandId}`
    );

  if (!res.ok) {
    const error =
      await res.text();

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

export async function createKeyword(
  data: {
    brand_id: number;
    keyword: string;
    duration?: number | null;
  }
) {
  const res =
    await authFetch(
      `${API_URL}/keywords/`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(data),
      }
    );

  if (!res.ok) {
    const error =
      await res.text();

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
  const res =
    await authFetch(
      `${API_URL}/keywords/${id}`,
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(data),
      }
    );

  if (!res.ok) {
    const error =
      await res.text();

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
  const res =
    await authFetch(
      `${API_URL}/keywords/${id}`,
      {
        method: "DELETE",
      }
    );

  if (!res.ok) {
    const error =
      await res.text();

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
  const res =
    await authFetch(
      `${API_URL}/segments/`
    );

  if (!res.ok) {
    const error =
      await res.text();

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
  const res =
    await authFetch(
      `${API_URL}/segments/project/${projectId}`
    );

  if (!res.ok) {
    const error =
      await res.text();

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
  const res =
    await authFetch(
      `${API_URL}/segments/hours/${projectId}`
    );

  if (!res.ok) {
    const error =
      await res.text();

    throw new Error(
      error ||
        "Failed to load segment hours"
    );
  }

  return res.json();
}