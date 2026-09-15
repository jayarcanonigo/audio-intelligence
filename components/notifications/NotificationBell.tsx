"use client";

import {
  Bell,
  Check,
  CheckCheck,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from "@/services/notifications";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] =
    useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  // ============================================================
  // BELL / SOUND
  // ============================================================

  const [bellRinging, setBellRinging] =
    useState(false);

  const previousUnreadCount =
    useRef(0);

  const hasLoadedUnreadCount =
    useRef(false);

  const notificationSound =
    useRef<HTMLAudioElement | null>(null);

  const audioUnlocked =
    useRef(false);

  const containerRef =
    useRef<HTMLDivElement>(null);

  // ============================================================
  // CREATE AUDIO
  // ============================================================

  useEffect(() => {
    const audio = new Audio(
      "/sounds/notification.mp3",
    );

    audio.preload = "auto";
    audio.volume = 1.0;

    notificationSound.current = audio;

    return () => {
      audio.pause();
      audio.src = "";

      notificationSound.current = null;
    };
  }, []);

  // ============================================================
  // UNLOCK AUDIO AFTER USER INTERACTION
  // ============================================================

  useEffect(() => {
    const unlockAudio = async () => {
      const audio =
        notificationSound.current;

      if (!audio || audioUnlocked.current) {
        return;
      }

      try {
        /*
         * Play the audio silently once after
         * the user interacts with the page.
         *
         * This tells the browser that audio
         * playback has been initiated by the user.
         */
        audio.muted = true;
        audio.currentTime = 0;

        await audio.play();

        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;

        audioUnlocked.current = true;

        console.log(
          "[NotificationBell] Audio unlocked",
        );
      } catch (error) {
        console.warn(
          "[NotificationBell] Audio unlock failed:",
          error,
        );
      }
    };

    /*
     * Listen for the first real user interaction.
     */
    window.addEventListener(
      "click",
      unlockAudio,
      { once: true },
    );

    window.addEventListener(
      "touchstart",
      unlockAudio,
      { once: true },
    );

    window.addEventListener(
      "keydown",
      unlockAudio,
      { once: true },
    );

    return () => {
      window.removeEventListener(
        "click",
        unlockAudio,
      );

      window.removeEventListener(
        "touchstart",
        unlockAudio,
      );

      window.removeEventListener(
        "keydown",
        unlockAudio,
      );
    };
  }, []);

  // ============================================================
  // PLAY NOTIFICATION SOUND
  // ============================================================

  const playNotificationSound =
    useCallback(() => {
      const audio =
        notificationSound.current;

      if (!audio) {
        console.warn(
          "[NotificationBell] Audio element not ready",
        );

        return;
      }

      if (!audioUnlocked.current) {
        console.warn(
          "[NotificationBell] Audio is not unlocked yet",
        );

        return;
      }

      /*
       * Restart sound from beginning.
       */
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1.0;
      audio.muted = false;

      audio
        .play()
        .then(() => {
          console.log(
            "[NotificationBell] Notification sound played",
          );
        })
        .catch((error) => {
          console.error(
            "[NotificationBell] Audio playback failed:",
            error,
          );
        });

      /*
       * Start bell animation.
       */
      setBellRinging(true);

      window.setTimeout(() => {
        setBellRinging(false);
      }, 1000);
    }, []);

  // ============================================================
  // LOAD UNREAD COUNT
  // ============================================================

  const loadUnreadCount =
    useCallback(async () => {
      try {
        const response =
          await getUnreadNotificationCount();

        if (!response.success) {
          return;
        }

        const newCount =
          response.unread_count;

        /*
         * First request establishes the baseline.
         *
         * Existing unread notifications do NOT
         * trigger the sound.
         */
        if (
          !hasLoadedUnreadCount.current
        ) {
          previousUnreadCount.current =
            newCount;

          setUnreadCount(newCount);

          hasLoadedUnreadCount.current =
            true;

          return;
        }

        /*
         * Only play when a NEW unread
         * notification appears.
         */
        if (
          newCount >
          previousUnreadCount.current
        ) {
          playNotificationSound();
        }

        previousUnreadCount.current =
          newCount;

        setUnreadCount(newCount);
      } catch {
        // Ignore polling errors.
      }
    }, [
      playNotificationSound,
    ]);

  // ============================================================
  // LOAD NOTIFICATIONS
  // ============================================================

  const loadNotifications =
    useCallback(async () => {
      try {
        setLoading(true);

        const response =
          await getNotifications(
            false,
            50,
          );

        if (response.success) {
          setNotifications(
            response.notifications,
          );
        }
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    }, []);

  // ============================================================
  // INITIAL LOAD + POLLING
  // ============================================================

  useEffect(() => {
    loadUnreadCount();

    const interval =
      window.setInterval(() => {
        loadUnreadCount();
      }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadUnreadCount]);

  // ============================================================
  // LOAD WHEN PANEL OPENS
  // ============================================================

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [
    isOpen,
    loadNotifications,
  ]);

  // ============================================================
  // CLOSE OUTSIDE
  // ============================================================

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent,
    ) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node,
        )
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener(
        "mousedown",
        handleClickOutside,
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, [isOpen]);

  // ============================================================
  // ESCAPE
  // ============================================================

  useEffect(() => {
    const handleEscape = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener(
        "keydown",
        handleEscape,
      );
    }

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [isOpen]);

  // ============================================================
  // MARK ONE AS READ
  // ============================================================

  const handleMarkRead = async (
    notification: Notification,
  ) => {
    if (notification.is_read) {
      return;
    }

    try {
      await markNotificationRead(
        notification.id,
      );

      setNotifications(
        (current) =>
          current.map((item) =>
            item.id ===
            notification.id
              ? {
                  ...item,
                  is_read: true,
                  read_at:
                    new Date().toISOString(),
                }
              : item,
          ),
      );

      previousUnreadCount.current =
        Math.max(
          0,
          previousUnreadCount.current - 1,
        );

      setUnreadCount(
        (current) =>
          Math.max(0, current - 1),
      );
    } catch {
      // Keep current state.
    }
  };

  // ============================================================
  // MARK ALL AS READ
  // ============================================================

  const handleMarkAllRead =
    async () => {
      if (
        unreadCount === 0 ||
        markingAll
      ) {
        return;
      }

      try {
        setMarkingAll(true);

        await markAllNotificationsRead();

        const now =
          new Date().toISOString();

        setNotifications(
          (current) =>
            current.map(
              (notification) => ({
                ...notification,
                is_read: true,
                read_at:
                  notification.read_at ??
                  now,
              }),
            ),
        );

        previousUnreadCount.current =
          0;

        setUnreadCount(0);
      } catch {
        // Keep current state.
      } finally {
        setMarkingAll(false);
      }
    };

  // ============================================================
  // DELETE NOTIFICATION
  // ============================================================

  const handleDelete = async (
    notificationId: number,
  ) => {
    if (deletingId !== null) {
      return;
    }

    try {
      setDeletingId(notificationId);

      const notification =
        notifications.find(
          (item) =>
            item.id ===
            notificationId,
        );

      await deleteNotification(
        notificationId,
      );

      setNotifications(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              notificationId,
          ),
      );

      if (
        notification &&
        !notification.is_read
      ) {
        previousUnreadCount.current =
          Math.max(
            0,
            previousUnreadCount.current - 1,
          );

        setUnreadCount(
          (current) =>
            Math.max(0, current - 1),
        );
      }
    } catch {
      // Keep notification if deletion fails.
    } finally {
      setDeletingId(null);
    }
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatRelativeDate = (
    dateString: string,
  ) => {
    const date =
      new Date(dateString);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return "";
    }

    const now = new Date();

    const diff =
      now.getTime() -
      date.getTime();

    const seconds =
      Math.floor(diff / 1000);

    const minutes =
      Math.floor(seconds / 60);

    const hours =
      Math.floor(minutes / 60);

    const days =
      Math.floor(hours / 24);

    if (seconds < 60) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    if (hours < 24) {
      return `${hours}h ago`;
    }

    if (days < 7) {
      return `${days}d ago`;
    }

    return date.toLocaleDateString();
  };

  // ============================================================
  // NOTIFICATION ICON
  // ============================================================

  const getNotificationIcon = (
    type: string,
  ) => {
    switch (type) {
      case "UPLOAD_COMPLETED":
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            <Upload className="h-4 w-4" />
          </div>
        );

      default:
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            <Bell className="h-4 w-4" />
          </div>
        );
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      {/* BELL */}

      <button
        type="button"
        onClick={() =>
          setIsOpen(
            (current) => !current,
          )
        }
        className="
          relative
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-lg
          text-gray-600
          transition
          hover:bg-gray-100
          hover:text-gray-900
          dark:text-gray-300
          dark:hover:bg-gray-800
          dark:hover:text-white
        "
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell
          className={`h-5 w-5 ${
            bellRinging
              ? "animate-bell-ring"
              : ""
          }`}
        />

        {unreadCount > 0 && (
          <span
            className="
              absolute
              right-1
              top-1
              flex
              min-h-[18px]
              min-w-[18px]
              items-center
              justify-center
              rounded-full
              bg-red-500
              px-1
              text-[10px]
              font-bold
              leading-none
              text-white
              ring-2
              ring-white
              dark:ring-gray-900
            "
          >
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {/* PANEL */}

      {isOpen && (
        <div
          className="
            fixed
            inset-x-3
            top-[68px]
            z-50
            overflow-hidden
            rounded-xl
            border
            border-gray-200
            bg-white
            shadow-xl
            dark:border-gray-700
            dark:bg-gray-900
            sm:absolute
            sm:left-auto
            sm:right-0
            sm:top-12
            sm:inset-x-auto
            sm:w-[420px]
          "
        >
          {/* HEADER */}

          <div
            className="
              flex
              items-center
              justify-between
              border-b
              border-gray-200
              px-4
              py-3
              dark:border-gray-700
            "
          >
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>

              {unreadCount > 0 && (
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {unreadCount} unread
                </p>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={
                    handleMarkAllRead
                  }
                  disabled={markingAll}
                  className="
                    flex
                    items-center
                    gap-1.5
                    rounded-md
                    px-2
                    py-1.5
                    text-xs
                    font-medium
                    text-gray-600
                    transition
                    hover:bg-gray-100
                    hover:text-gray-900
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                    dark:text-gray-300
                    dark:hover:bg-gray-800
                    dark:hover:text-white
                  "
                >
                  {markingAll ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCheck className="h-3.5 w-3.5" />
                  )}

                  Mark all read
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  setIsOpen(false)
                }
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-md
                  text-gray-500
                  hover:bg-gray-100
                  hover:text-gray-900
                  dark:hover:bg-gray-800
                  dark:hover:text-white
                "
                aria-label="Close notifications"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* BODY */}

          <div className="max-h-[min(70vh,520px)] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center px-4 py-12">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />

                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Loading notifications...
                  </span>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <div
                  className="
                    mb-3
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-full
                    bg-gray-100
                    dark:bg-gray-800
                  "
                >
                  <Bell className="h-5 w-5 text-gray-400" />
                </div>

                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  No notifications
                </p>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  You're all caught up.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {notifications.map(
                  (notification) => (
                    <div
                      key={notification.id}
                      className={`
                        group
                        relative
                        flex
                        gap-3
                        px-4
                        py-3
                        transition
                        ${
                          notification.is_read
                            ? "bg-white dark:bg-gray-900"
                            : "bg-blue-50/60 dark:bg-blue-950/20"
                        }
                      `}
                    >
                      {getNotificationIcon(
                        notification.type,
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          handleMarkRead(
                            notification,
                          )
                        }
                        className="
                          min-w-0
                          flex-1
                          text-left
                        "
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            className={`
                              text-sm
                              ${
                                notification.is_read
                                  ? "font-medium text-gray-700 dark:text-gray-300"
                                  : "font-semibold text-gray-900 dark:text-white"
                              }
                            `}
                          >
                            {notification.title}
                          </h4>

                          {!notification.is_read && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                          )}
                        </div>

                        <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-400">
                          {notification.message}
                        </p>

                        <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                          {formatRelativeDate(
                            notification.created_at,
                          )}
                        </p>
                      </button>

                      <div
                        className="
                          flex
                          shrink-0
                          items-start
                          gap-1
                          opacity-100
                          transition
                          sm:opacity-0
                          sm:group-hover:opacity-100
                        "
                      >
                        {!notification.is_read && (
                          <button
                            type="button"
                            onClick={() =>
                              handleMarkRead(
                                notification,
                              )
                            }
                            className="
                              flex
                              h-7
                              w-7
                              items-center
                              justify-center
                              rounded-md
                              text-gray-400
                              hover:bg-gray-100
                              hover:text-gray-700
                              dark:hover:bg-gray-800
                              dark:hover:text-gray-200
                            "
                            title="Mark as read"
                            aria-label="Mark as read"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              notification.id,
                            )
                          }
                          disabled={
                            deletingId ===
                            notification.id
                          }
                          className="
                            flex
                            h-7
                            w-7
                            items-center
                            justify-center
                            rounded-md
                            text-gray-400
                            hover:bg-red-50
                            hover:text-red-600
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                            dark:hover:bg-red-900/20
                            dark:hover:text-red-400
                          "
                          title="Delete notification"
                          aria-label="Delete notification"
                        >
                          {deletingId ===
                          notification.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          {/* FOOTER */}

          <div
            className="
              border-t
              border-gray-200
              bg-gray-50
              px-4
              py-2
              dark:border-gray-700
              dark:bg-gray-800/50
            "
          >
            <p className="text-center text-[11px] text-gray-500 dark:text-gray-400">
              Upload completion notifications
              will appear here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}