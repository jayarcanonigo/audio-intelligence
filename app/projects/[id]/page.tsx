"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

import UploadPanel from "@/components/upload/UploadPanel";
import SegmentsList from "@/components/segments/SegmentsList";

export default function ProjectPage() {
  const params = useParams();

  const projectId = Number(params.id);

  const [refresh, setRefresh] = useState(0);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        Radio Project #{projectId}
      </h1>

      <div className="border rounded p-4">
        <h2 className="font-semibold mb-4">
          Upload Audio
        </h2>

        <UploadPanel
          projectId={projectId}
          onComplete={() => setRefresh((r) => r + 1)}
        />
      </div>

      <div className="border rounded p-4">
        <SegmentsList
          projectId={projectId}
          refresh={refresh}
        />
      </div>
    </div>
  );
}