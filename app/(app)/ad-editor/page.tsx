"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getProjects,
  deleteProject,
} from "@/services/api";

interface Project {
  id: number;
  name: string;
  status: string;
  created_at?: string;
}

export default function AdEditorPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(projectId: number) {
    const ok = window.confirm(
      "Delete this project?\n\nThis will permanently delete:\n\n• Project\n• Segments\n• Advertisements"
    );

    if (!ok) return;

    try {
      await deleteProject(projectId);

      setProjects((prev) =>
        prev.filter((project) => project.id !== projectId)
      );

    } catch (error) {
      console.error(error);
      alert("Failed to delete project.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b px-8 py-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-800">
          🎧 Ad Editor
        </h1>

        <p className="text-slate-500 mt-1">
          Select a project to edit advertisement segments.
        </p>
      </div>

      <div className="p-8">

        {loading && (
          <div className="bg-white rounded-xl p-8 text-center shadow">
            Loading projects...
          </div>
        )}

        {!loading && projects.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center shadow">
            No projects found.
          </div>
        )}

        {!loading && projects.length > 0 && (
          <div className="space-y-4">

            {projects.map((project) => (

              <div
                key={project.id}
                className="
                  bg-white
                  rounded-xl
                  shadow
                  border
                  border-gray-200
                  p-5
                  flex
                  justify-between
                  items-center
                  hover:shadow-md
                  transition
                "
              >
                {/* Left */}
                <div>

                  <h2 className="text-xl font-semibold text-slate-800">
                    {project.name}
                  </h2>

                  <div className="flex items-center gap-3 mt-2">

                    <span
                      className={`
                        px-3
                        py-1
                        rounded-full
                        text-xs
                        font-medium
                        ${
                          project.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }
                      `}
                    >
                      {project.status}
                    </span>

                    <span className="text-sm text-gray-500">
                      {project.created_at
                        ? new Date(
                            project.created_at
                          ).toLocaleDateString()
                        : "No date"}
                    </span>

                  </div>

                </div>

                {/* Right */}
                <div className="flex gap-3">

                  <Link
                    href={`/ad-editor/${project.id}?name=${encodeURIComponent(
                      project.name
                    )}`}
                    className="
                      bg-blue-600
                      hover:bg-blue-700
                      text-white
                      px-5
                      py-2.5
                      rounded-lg
                      font-medium
                    "
                  >
                    Open Editor
                  </Link>

                  <button
                    onClick={() =>
                      handleDelete(project.id)
                    }
                    className="
                      bg-red-600
                      hover:bg-red-700
                      text-white
                      px-4
                      py-2.5
                      rounded-lg
                    "
                  >
                    🗑
                  </button>

                </div>

              </div>

            ))}

          </div>
        )}
      </div>
    </div>
  );
}