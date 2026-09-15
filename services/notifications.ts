import {
  API_URL,
  getAuthHeaders,
} from "./api";

// ============================================================
// TYPES
// ============================================================

export interface Notification {
  id: number;

  user_id: number;

  type: string;

  title: string;

  message: string;

  project_id: number | null;

  upload_status_id: number | null;

  is_read: boolean;

  created_at: string;

  read_at: string | null;
}

export interface NotificationsResponse {
  success: boolean;

  notifications: Notification[];
}

export interface UnreadNotificationCountResponse {
  success: boolean;

  unread_count: number;
}

export interface MarkNotificationReadResponse {
  success: boolean;

  notification: Notification;
}

export interface MarkAllNotificationsReadResponse {
  success: boolean;

  updated: number;
}

export interface DeleteNotificationResponse {
  success: boolean;

  message: string;
}

// ============================================================
// GET NOTIFICATIONS
// ============================================================

export async function getNotifications(
  unreadOnly: boolean = false,
  limit: number = 50
): Promise<NotificationsResponse> {
  const response = await fetch(
    `${API_URL}/notifications?unread_only=${unreadOnly}&limit=${limit}`,
    {
      method: "GET",

      headers: getAuthHeaders(),

      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch notifications: ${response.status}`
    );
  }

  return response.json();
}

// ============================================================
// GET UNREAD COUNT
// ============================================================

export async function getUnreadNotificationCount(): Promise<UnreadNotificationCountResponse> {
  const response = await fetch(
    `${API_URL}/notifications/unread-count`,
    {
      method: "GET",

      headers: getAuthHeaders(),

      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch unread notification count: ${response.status}`
    );
  }

  return response.json();
}

// ============================================================
// MARK ONE AS READ
// ============================================================

export async function markNotificationRead(
  notificationId: number
): Promise<MarkNotificationReadResponse> {
  const response = await fetch(
    `${API_URL}/notifications/${notificationId}/read`,
    {
      method: "PUT",

      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to mark notification as read: ${response.status}`
    );
  }

  return response.json();
}

// ============================================================
// MARK ALL AS READ
// ============================================================

export async function markAllNotificationsRead(): Promise<MarkAllNotificationsReadResponse> {
  const response = await fetch(
    `${API_URL}/notifications/read-all`,
    {
      method: "PUT",

      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to mark all notifications as read: ${response.status}`
    );
  }

  return response.json();
}

// ============================================================
// DELETE NOTIFICATION
// ============================================================

export async function deleteNotification(
  notificationId: number
): Promise<DeleteNotificationResponse> {
  const response = await fetch(
    `${API_URL}/notifications/${notificationId}`,
    {
      method: "DELETE",

      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to delete notification: ${response.status}`
    );
  }

  return response.json();
}