"use client";

import Sidebar from "./Sidebar";
import Header from "./Header";
import styles from "./AppLayout.module.css";

type AppLayoutProps = {
  children: React.ReactNode;
};

export default function AppLayout({
  children,
}: AppLayoutProps) {
  return (
    <div className={styles.layout}>
      <Sidebar />

      <div className={styles.content}>
        <Header />

        <main className={styles.main}>
          {children}
        </main>
      </div>
    </div>
  );
}