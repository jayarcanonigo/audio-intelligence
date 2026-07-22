"use client";

import styles from "./StatusBar.module.css";

type StatusBarProps = {
  status: string;
  segment: number;
  processedTime: string;
};

export default function StatusBar({
  status,
  segment,
  processedTime,
}: StatusBarProps) {
  return (
    <div className={styles.statusRow}>
      <span>
        <b>Status:</b> {status}
      </span>

      <span>
        <b>Segment:</b> {segment}
      </span>

      <span>
        <b>Time:</b> {processedTime}
      </span>
    </div>
  );
}