"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import Navbar from "@/components/layout/Navbar";
import {
    isAuthenticated,
    getUsername,
} from "@/services/auth";

import styles from "./page.module.css";

export default function DashboardPage() {
    const router = useRouter();

    const [checkingAuth, setCheckingAuth] = useState(true);
    const [username, setUsername] = useState("Admin");

    useEffect(() => {
        const authenticated = isAuthenticated();

        if (!authenticated) {
            router.replace("/login");
            return;
        }

        const storedUsername = getUsername();

        if (storedUsername) {
            setUsername(storedUsername);
        }

        setCheckingAuth(false);
    }, [router]);

    if (checkingAuth) {
        return (
            <main className={styles.page}>
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <IconRadio />
                    </div>

                    <div className={styles.emptyTitle}>
                        Checking authentication...
                    </div>
                </div>
            </main>
        );
    }

    return (
        <div>
            <Navbar />

            <main className={styles.page}>

                {/* ==================================================
                    HEADER
                ================================================== */}

                <header className={styles.header}>

                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>
                            Radio Intelligence
                        </h1>

                        <p className={styles.subtitle}>
                            Broadcast monitoring and audio intelligence
                        </p>
                    </div>

                    <div className={styles.status}>
                        <span className={styles.signalMeter} aria-hidden="true">
                            <span />
                            <span />
                            <span />
                            <span />
                            <span />
                        </span>
                        <span className={styles.statusDot} />
                        System Online
                    </div>

                </header>


                {/* ==================================================
                    WELCOME
                ================================================== */}

                <section className={styles.welcomeCard}>

                    <div className={styles.welcomeContent}>

                        <div className={styles.welcomeLabel}>
                            Dashboard
                        </div>

                        <h2 className={styles.welcomeTitle}>
                            Welcome back, {username}
                        </h2>

                        <p className={styles.welcomeText}>
                            Monitor radio broadcasts, process audio,
                            detect advertisements, and review transcript
                            segments from your centralized workspace.
                        </p>

                    </div>

                </section>


                {/* ==================================================
                    STATISTICS
                ================================================== */}

                <section className={styles.statsGrid}>

                    <StatCard
                        icon={<IconFolder />}
                        title="Projects"
                        value="0"
                        description="Total monitoring projects"
                        tone="signal"
                    />

                    <StatCard
                        icon={<IconMegaphone />}
                        title="Advertisements"
                        value="0"
                        description="Detected advertisements"
                        tone="alert"
                    />

                    <StatCard
                        icon={<IconHeadphones />}
                        title="Audio Processed"
                        value="0"
                        description="Processed recordings"
                        tone="signal"
                    />

                    <StatCard
                        icon={<IconFileText />}
                        title="Segments"
                        value="0"
                        description="Transcript segments"
                        tone="success"
                    />

                </section>


                {/* ==================================================
                    CONTENT
                ================================================== */}

                <section className={styles.grid}>

                    {/* LEFT */}

                    <div className={styles.card}>

                        <div className={styles.cardHeader}>

                            <div>
                                <h2 className={styles.sectionTitle}>
                                    Quick Actions
                                </h2>

                                <p className={styles.sectionSubtitle}>
                                    Access frequently used tools
                                </p>
                            </div>

                        </div>


                        <div className={styles.actions}>

                            <Action
                                href="/projects"
                                icon={<IconFolder />}
                                title="Projects"
                                description="Manage monitoring projects"
                            />

                            <Action
                                href="/ad-editor"
                                icon={<IconHeadphones />}
                                title="Ad Editor"
                                description="Review detected advertisements"
                            />

                            <Action
                                href="/reports"
                                icon={<IconClipboard />}
                                title="Reports"
                                description="View broadcast reports"
                            />

                        </div>


                        {/* Recent Activity */}

                        <div
                            style={{
                                marginTop: "24px",
                            }}
                        >

                            <div className={styles.cardHeader}>

                                <div>
                                    <h2 className={styles.sectionTitle}>
                                        Recent Activity
                                    </h2>

                                    <p className={styles.sectionSubtitle}>
                                        Latest system activity
                                    </p>
                                </div>

                            </div>

                            <div className={styles.emptyState}>

                                <div className={styles.emptyIcon}>
                                    <IconActivity />
                                </div>

                                <div className={styles.emptyTitle}>
                                    No recent activity
                                </div>

                                <p className={styles.emptyText}>
                                    Activity from projects, audio
                                    processing, and advertisement
                                    detection will appear here.
                                </p>

                            </div>

                        </div>

                    </div>


                    {/* RIGHT */}

                    <div className={styles.card}>

                        <div className={styles.cardHeader}>

                            <div>
                                <h2 className={styles.sectionTitle}>
                                    System Status
                                </h2>

                                <p className={styles.sectionSubtitle}>
                                    Current service status
                                </p>
                            </div>

                        </div>


                        <div className={styles.statusList}>

                            <StatusItem
                                name="Authentication"
                            />

                            <StatusItem
                                name="Audio Processing"
                            />

                            <StatusItem
                                name="Transcription"
                            />

                            <StatusItem
                                name="Advertisement Detection"
                            />

                            <StatusItem
                                name="Database"
                            />

                        </div>

                    </div>

                </section>

            </main>
        </div>
    );
}


/* ================================================================
   STAT CARD
================================================================ */

function StatCard({
    icon,
    title,
    value,
    description,
    tone = "signal",
}: {
    icon: React.ReactNode;
    title: string;
    value: string;
    description: string;
    tone?: "signal" | "alert" | "success";
}) {
    const toneVar =
        tone === "alert"
            ? "var(--alert)"
            : tone === "success"
            ? "var(--success)"
            : "var(--signal)";

    return (
        <div
            className={styles.statCard}
            style={{ ["--tone" as string]: toneVar }}
        >

            <div className={styles.statTop}>

                <div>
                    <div className={styles.statTitle}>
                        {title}
                    </div>
                </div>

                <div className={styles.statIcon}>
                    {icon}
                </div>

            </div>

            <div className={styles.statValue}>
                {value}
            </div>

            <div className={styles.statDescription}>
                {description}
            </div>

        </div>
    );
}


/* ================================================================
   ACTION
================================================================ */

function Action({
    href,
    icon,
    title,
    description,
}: {
    href: string;
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <Link
            href={href}
            className={styles.action}
        >

            <div className={styles.actionIcon}>
                {icon}
            </div>

            <div className={styles.actionContent}>

                <div className={styles.actionTitle}>
                    {title}
                </div>

                <div className={styles.actionDescription}>
                    {description}
                </div>

            </div>

        </Link>
    );
}


/* ================================================================
   STATUS ITEM
================================================================ */

function StatusItem({
    name,
}: {
    name: string;
}) {
    return (
        <div className={styles.statusItem}>

            <div className={styles.statusName}>

                <span className={styles.serviceDot} />

                {name}

            </div>

            <span className={styles.statusOperational}>
                Operational
            </span>

        </div>
    );
}


/* ================================================================
   ICONS
   Stroke-based, 1.6px weight, 24x24 viewbox — deliberately plain
   so the signal-meter in the header stays the one expressive mark.
================================================================ */

function IconFolder() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
        </svg>
    );
}

function IconMegaphone() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11v2a2 2 0 0 0 2 2h1l3.5 4.5V6.5L6 11H5a2 2 0 0 0-2 2Z" />
            <path d="M14 8.5c1.2 1 1.2 6 0 7" />
            <path d="M17.5 5.5c2.6 2.7 2.6 10.3 0 13" />
        </svg>
    );
}

function IconHeadphones() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
            <rect x="3" y="14" width="4" height="6" rx="1.5" />
            <rect x="17" y="14" width="4" height="6" rx="1.5" />
        </svg>
    );
}

function IconFileText() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
            <path d="M14 3v4h4" />
            <path d="M9 13h6M9 16.5h6M9 9.5h2" />
        </svg>
    );
}

function IconClipboard() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="6" y="4" width="12" height="17" rx="1.5" />
            <path d="M9 4V3.5A1.5 1.5 0 0 1 10.5 2h3A1.5 1.5 0 0 1 15 3.5V4" />
            <path d="M9 11h6M9 15h6" />
        </svg>
    );
}

function IconActivity() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h4l2 7 4-14 2 7h6" />
        </svg>
    );
}

function IconRadio() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="14.5" r="5.5" />
            <path d="M12 14.5v.01" />
            <path d="M7 3 3 6.5M17 3l4 3.5" />
            <path d="M12 3v3" />
        </svg>
    );
}
