"use client";

import { useEffect } from "react";

const TIMEOUT = 30 * 60 * 1000; // 30 minutes

export default function SessionTimeout() {
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timeout);

      timeout = setTimeout(() => {
        window.location.href = "/login";
      }, TIMEOUT);
    };

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((event) => {
      window.addEventListener(
        event,
        resetTimer
      );
    });

    resetTimer();

    return () => {
      clearTimeout(timeout);

      events.forEach((event) => {
        window.removeEventListener(
          event,
          resetTimer
        );
      });
    };
  }, []);

  return null;
}