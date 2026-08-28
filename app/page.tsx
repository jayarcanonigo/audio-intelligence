
"use client";

import Link from "next/link";

/* ============================================================
   LANDING PAGE
============================================================ */

export default function LandingPage() {
    return (
        <main className="min-h-screen bg-slate-100">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="border-b border-slate-200 bg-white">

                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

                    {/* Logo */}

                    <Logo />

                    {/* Sign In */}

                    <Link
                        href="/login"
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
                    >
                        Sign in
                    </Link>

                </div>

            </header>


            {/* =================================================
                HERO
            ================================================= */}

            <section className="relative overflow-hidden">

                {/* Background decoration */}

                <div className="pointer-events-none absolute inset-0">

                    <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl" />

                    <div className="absolute -right-32 top-20 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl" />

                </div>


                <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">

                    <div className="mx-auto max-w-4xl text-center">

                        {/* Badge */}

                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700">

                            <span className="h-2 w-2 rounded-full bg-indigo-600" />

                            Audio Intelligence Platform

                        </div>


                        {/* Title */}

                        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">

                            Turn radio broadcasts into

                            <span className="block text-indigo-600">
                                actionable intelligence
                            </span>

                        </h1>


                        {/* Description */}

                        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">

                            Monitor broadcasts, process audio,
                            generate transcripts, detect
                            advertisements, and organize your
                            radio intelligence data in one
                            centralized platform.

                        </p>


                        {/* Buttons */}

                        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">

                            <Link
                                href="/login"
                                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-7 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 sm:w-auto"
                            >
                                Sign in to Dashboard

                                <ArrowIcon />

                            </Link>

                        </div>

                    </div>


                    {/* =================================================
                        PLATFORM PREVIEW
                    ================================================= */}

                    <div className="mx-auto mt-16 max-w-5xl">

                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40">

                            {/* Browser Header */}

                            <div className="flex h-12 items-center gap-2 border-b border-slate-200 bg-slate-50 px-4">

                                <span className="h-3 w-3 rounded-full bg-slate-300" />
                                <span className="h-3 w-3 rounded-full bg-slate-300" />
                                <span className="h-3 w-3 rounded-full bg-slate-300" />

                                <div className="ml-4 h-7 flex-1 rounded-lg bg-white border border-slate-200" />

                            </div>


                            {/* Dashboard Preview */}

                            <div className="grid min-h-[320px] grid-cols-12">

                                {/* Sidebar */}

                                <div className="col-span-3 hidden bg-slate-950 p-4 sm:block">

                                    <div className="flex items-center gap-2">

                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                                            <WaveIcon />
                                        </div>

                                        <div className="h-3 w-20 rounded bg-white/20" />

                                    </div>


                                    <div className="mt-8 space-y-2">

                                        <div className="h-9 rounded-lg bg-indigo-600" />

                                        <div className="h-9 rounded-lg bg-white/5" />

                                        <div className="h-9 rounded-lg bg-white/5" />

                                    </div>

                                </div>


                                {/* Main Preview */}

                                <div className="col-span-12 bg-slate-50 p-5 sm:col-span-9">

                                    <div className="flex items-center justify-between">

                                        <div>

                                            <div className="h-4 w-28 rounded bg-slate-300" />

                                            <div className="mt-2 h-3 w-48 rounded bg-slate-200" />

                                        </div>

                                        <div className="h-9 w-9 rounded-lg bg-indigo-100" />

                                    </div>


                                    {/* Stats */}

                                    <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">

                                        <PreviewCard value="18" />
                                        <PreviewCard value="42" />
                                        <PreviewCard value="156" />
                                        <PreviewCard value="2,481" />

                                    </div>


                                    {/* Project */}

                                    <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">

                                        <div className="flex items-center justify-between">

                                            <div>

                                                <div className="h-3 w-32 rounded bg-slate-300" />

                                                <div className="mt-2 h-2.5 w-48 rounded bg-slate-200" />

                                            </div>

                                            <div className="h-8 w-16 rounded-lg bg-indigo-50" />

                                        </div>


                                        <div className="mt-5 grid grid-cols-3 gap-3">

                                            <div className="h-16 rounded-lg bg-slate-50" />
                                            <div className="h-16 rounded-lg bg-slate-50" />
                                            <div className="h-16 rounded-lg bg-slate-50" />

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </section>


            {/* =================================================
                FEATURES
            ================================================= */}

            <section className="border-t border-slate-200 bg-white">

                <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">

                    <div className="mx-auto max-w-2xl text-center">

                        <p className="text-sm font-semibold text-indigo-600">
                            PLATFORM
                        </p>

                        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                            Everything you need for radio intelligence
                        </h2>

                        <p className="mt-4 text-sm leading-6 text-slate-500 sm:text-base">
                            A centralized workspace for monitoring,
                            processing, analyzing, and reviewing
                            radio broadcast data.
                        </p>

                    </div>


                    <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

                        <Feature
                            icon={<RadioIcon />}
                            title="Broadcast Monitoring"
                            description="Organize and monitor radio broadcast recordings from your projects."
                        />

                        <Feature
                            icon={<AudioIcon />}
                            title="Audio Processing"
                            description="Process broadcast audio and prepare recordings for intelligent analysis."
                        />

                        <Feature
                            icon={<TranscriptIcon />}
                            title="AI Transcription"
                            description="Convert broadcast audio into searchable transcript segments."
                        />

                        <Feature
                            icon={<AdIcon />}
                            title="Advertisement Detection"
                            description="Identify and organize advertisements from processed broadcasts."
                        />

                    </div>

                </div>

            </section>


            {/* =================================================
                WORKFLOW
            ================================================= */}

            <section className="bg-slate-50">

                <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">

                    <div className="grid items-center gap-12 lg:grid-cols-2">

                        <div>

                            <p className="text-sm font-semibold text-indigo-600">
                                SIMPLE WORKFLOW
                            </p>

                            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                                From broadcast to intelligence
                            </h2>

                            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                                Radio Intelligence brings the complete
                                broadcast analysis workflow into one
                                centralized system.
                            </p>

                        </div>


                        <div className="space-y-4">

                            <WorkflowStep
                                number="01"
                                title="Upload"
                                description="Upload your broadcast recordings to a monitoring project."
                            />

                            <WorkflowStep
                                number="02"
                                title="Transcribe"
                                description="Process audio and generate timestamped transcript segments."
                            />

                            <WorkflowStep
                                number="03"
                                title="Detect"
                                description="Identify advertisements and relevant broadcast content."
                            />

                            <WorkflowStep
                                number="04"
                                title="Analyze"
                                description="Review segments, advertisements, projects, and reports."
                            />

                        </div>

                    </div>

                </div>

            </section>


            {/* =================================================
                CTA
            ================================================= */}

            <section className="bg-slate-950">

                <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
                        <WaveIcon />
                    </div>

                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">
                        Ready to monitor your broadcasts?
                    </h2>

                    <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
                        Sign in to access your radio intelligence
                        workspace and start analyzing your broadcast
                        data.
                    </p>

                    <Link
                        href="/login"
                        className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-7 text-sm font-semibold text-white transition hover:bg-indigo-500"
                    >
                        Sign in

                        <ArrowIcon />

                    </Link>

                </div>

            </section>


            {/* =================================================
                FOOTER
            ================================================= */}

            <footer className="bg-slate-950 border-t border-white/10">

                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">

                    <Logo dark />

                    <p className="text-xs text-slate-500">
                        Radio Intelligence — Audio Intelligence Platform
                    </p>

                </div>

            </footer>

        </main>
    );
}


/* ============================================================
   LOGO
============================================================ */

function Logo({
    dark = false,
}: {
    dark?: boolean;
}) {
    return (
        <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">

                <WaveIcon />

            </div>

            <div>

                <div
                    className={`text-sm font-bold tracking-wide ${
                        dark
                            ? "text-white"
                            : "text-slate-900"
                    }`}
                >
                    RADIO INTELLIGENCE
                </div>

                <div
                    className={`text-[10px] ${
                        dark
                            ? "text-slate-500"
                            : "text-slate-500"
                    }`}
                >
                    Audio Intelligence Platform
                </div>

            </div>

        </div>
    );
}


/* ============================================================
   FEATURE
============================================================ */

function Feature({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                {icon}
            </div>

            <h3 className="mt-5 font-bold text-slate-900">
                {title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
                {description}
            </p>

        </div>
    );
}


/* ============================================================
   WORKFLOW
============================================================ */

function WorkflowStep({
    number,
    title,
    description,
}: {
    number: string;
    title: string;
    description: string;
}) {
    return (
        <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-600">
                {number}
            </div>

            <div>

                <h3 className="font-bold text-slate-900">
                    {title}
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                    {description}
                </p>

            </div>

        </div>
    );
}


/* ============================================================
   PREVIEW CARD
============================================================ */

function PreviewCard({
    value,
}: {
    value: string;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3">

            <div className="h-2.5 w-16 rounded bg-slate-200" />

            <p className="mt-3 text-xl font-bold text-slate-800">
                {value}
            </p>

        </div>
    );
}


/* ============================================================
   ICONS
============================================================ */

function WaveIcon() {
    return (
        <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 12h2" />
            <path d="M7 8v8" />
            <path d="M11 4v16" />
            <path d="M15 8v8" />
            <path d="M19 6v12" />
            <path d="M21 10v4" />
        </svg>
    );
}

function RadioIcon() {
    return (
        <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
        >
            <circle cx="12" cy="12" r="2" />
            <path d="M7.8 7.8a6 6 0 0 0 0 8.4" />
            <path d="M16.2 7.8a6 6 0 0 1 0 8.4" />
            <path d="M4.9 4.9a10 10 0 0 0 0 14.2" />
            <path d="M19.1 4.9a10 10 0 0 1 0 14.2" />
        </svg>
    );
}

function AudioIcon() {
    return (
        <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
        >
            <path d="M4 12h2" />
            <path d="M8 8v8" />
            <path d="M12 4v16" />
            <path d="M16 8v8" />
            <path d="M20 10v4" />
        </svg>
    );
}

function TranscriptIcon() {
    return (
        <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M7 3h7l4 4v14H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
            <path d="M14 3v4h4" />
            <path d="M9 12h6" />
            <path d="M9 15.5h6" />
        </svg>
    );
}

function AdIcon() {
    return (
        <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4 5h16v14H4z" />
            <path d="M8 9h8" />
            <path d="M8 13h5" />
        </svg>
    );
}

function ArrowIcon() {
    return (
        <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
        </svg>
    );
}

