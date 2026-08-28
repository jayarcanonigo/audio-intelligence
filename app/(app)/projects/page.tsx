"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Layers, Megaphone, BookmarkCheck, Clock } from "lucide-react";
import { getProjects } from "@/services/api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadProjects() {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">

        {/* ================= HEADER ================= */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Projects
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Create projects, upload audio and manage processing.
            </p>
          </div>

          <Link
            href="/projects/new"
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus size={16} />
            New Project
          </Link>

        </div>

        {/* ================= LOADING ================= */}
        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            Loading projects...
          </div>
        )}

        {/* ================= EMPTY ================= */}
        {!loading && projects.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            No projects found.
          </div>
        )}

        {/* ================= PROJECT CARDS ================= */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

          {projects.map((project) => (
            <div
              key={project.id}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >

              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-slate-900">
                  {project.name}
                </h3>

                <span className="shrink-0 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  {project.status}
                </span>
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-3 gap-3 border-y border-slate-100 py-4">

                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Layers size={13} />
                    Segments
                  </div>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {project.total_segments ?? 0}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Megaphone size={13} />
                    Ads Found
                  </div>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {project.ads_found ?? 0}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <BookmarkCheck size={13} />
                    Saved Ads
                  </div>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {project.saved_ads ?? 0}
                  </p>
                </div>

              </div>

              {/* Upload Times */}
              <div className="mt-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5 font-medium text-slate-600">
                  <Clock size={13} />
                  Upload Time
                </div>
                <p className="mt-1 text-slate-600">
                  {project.upload_times?.length
                    ? project.upload_times.join(", ")
                    : "None"}
                </p>
              </div>

              {/* Created Date */}
              <p className="mt-3 text-xs text-slate-400">
                Created{" "}
                {project.created_at
                  ? new Date(project.created_at).toLocaleString()
                  : "—"}
              </p>

              {/* Action Buttons */}
              <div className="mt-5 flex gap-2 pt-1">

                <Link
                  href={`/projects/${project.id}?name=${encodeURIComponent(project.name)}`}
                  className="flex-1 rounded-lg bg-slate-900 py-2.5 text-center text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Open
                </Link>

                <Link
                  href={`/ad-editor/${project.id}?name=${encodeURIComponent(project.name)}`}
                  className="flex-1 rounded-lg border border-slate-300 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Edit Ads
                </Link>

              </div>

            </div>
          ))}

        </div>

      </div>
    </div>
  );
}
