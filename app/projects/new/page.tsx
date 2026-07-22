"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/services/api";

export default function NewProjectPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!name.trim()) {
      alert("Please enter a project name.");
      return;
    }

    try {
      setLoading(true);

      const project = await createProject(name);

      router.push(`/projects/${project.id}`);
    } catch (error) {
      console.error(error);
      alert("Failed to create project.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <h1>New Project</h1>
      <p>Create a new project to begin audio transcription.</p>

      <div
        style={{
          marginTop: 20,
          background: "#fff",
          padding: 24,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
        }}
      >
        <div>
          <label
            htmlFor="projectName"
            style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 600,
            }}
          >
            Project Name
          </label>

          <input
            id="projectName"
            type="text"
            placeholder="Enter project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              fontSize: 16,
            }}
          />
        </div>

        <button
          onClick={handleCreate}
          disabled={loading}
          style={{
            marginTop: 20,
            padding: "10px 20px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Creating..." : "Create Project"}
        </button>
      </div>
    </div>
  );
}