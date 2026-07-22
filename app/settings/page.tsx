"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import {
  Cpu,
  Headphones,
  Filter,
  Tags,
  Server,
  ArrowRight,
} from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

export default function SettingsPage() {
  const router = useRouter();

  const [model, setModel] = useState("medium");
  const [chunkSize, setChunkSize] = useState("300");
  const [restarting, setRestarting] = useState(false);

  async function restartAPI() {
    try {
      setRestarting(true);

      const res = await fetch(
        "http://localhost:8000/system/restart",
        {
          method: "POST",
        }
      );

      if (!res.ok) {
        throw new Error();
      }

      toast.success("API restarted successfully");
    } catch {
      toast.error("Restart failed");
    } finally {
      setRestarting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      <ToastContainer />

      <div className="max-w-6xl mx-auto">

        <h1 className="text-3xl font-bold mb-8">
          ⚙️ Settings
        </h1>

        <div className="grid gap-6">

          {/* Whisper */}

          <div className="bg-white rounded-xl shadow p-6">

            <div className="flex items-center gap-2 mb-5">
              <Cpu className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-lg">
                Whisper Model
              </h2>
            </div>

            <label className="block mb-2">
              Model Size
            </label>

            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full"
            >
              <option value="base">
                Base (Fast)
              </option>

              <option value="small">
                Small (Balanced)
              </option>

              <option value="medium">
                Medium (Accurate)
              </option>
            </select>

          </div>

          {/* Audio */}

          <div className="bg-white rounded-xl shadow p-6">

            <div className="flex items-center gap-2 mb-5">
              <Headphones className="w-5 h-5 text-green-600" />
              <h2 className="font-semibold text-lg">
                Audio Processing
              </h2>
            </div>

            <label className="block mb-2">
              Chunk Duration (seconds)
            </label>

            <input
              type="number"
              value={chunkSize}
              onChange={(e) => setChunkSize(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full"
            />

          </div>

          {/* Advertisement Filter */}

          <div className="bg-white rounded-xl shadow p-6">

            <div className="flex items-center gap-2 mb-5">
              <Filter className="w-5 h-5 text-purple-600" />
              <h2 className="font-semibold text-lg">
                Advertisement Filter
              </h2>
            </div>

            <textarea
              placeholder="One keyword per line..."
              className="border rounded-lg p-3 w-full h-32"
            />

          </div>

          {/* Brand Management */}

          <div className="bg-white rounded-xl shadow p-6">

            <div className="flex items-center justify-between">

              <div>

                <div className="flex items-center gap-2 mb-2">
                  <Tags className="w-5 h-5 text-orange-600" />
                  <h2 className="font-semibold text-lg">
                    Brand Management
                  </h2>
                </div>

                <p className="text-sm text-gray-500">
                  Create, edit and delete advertisement brands.
                </p>

              </div>

              <button
                onClick={() => router.push("/settings/brands")}
                className="
                  bg-blue-600
                  hover:bg-blue-700
                  text-white
                  px-5
                  py-2
                  rounded-lg
                  flex
                  items-center
                  gap-2
                "
              >
                Manage
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>

          </div>

          {/* System */}

          <div className="bg-white rounded-xl shadow p-6">

            <div className="flex items-center gap-2 mb-5">
              <Server className="w-5 h-5 text-red-600" />
              <h2 className="font-semibold text-lg">
                System
              </h2>
            </div>

            <div className="flex justify-between items-center">

              <div>

                <p className="font-medium">
                  Backend
                </p>

                <p className="text-green-600 text-sm">
                  ● Online
                </p>

              </div>

              <button
                onClick={restartAPI}
                disabled={restarting}
                className="
                  bg-red-600
                  hover:bg-red-700
                  disabled:opacity-50
                  text-white
                  px-5
                  py-2
                  rounded-lg
                "
              >
                {restarting ? "Restarting..." : "Restart API"}
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}