"use client";

import Link from "next/link";
import { useEffect, useState } from "react";


interface Project {
  id: number;
  name: string;
  status: string;
  date: string;
}


export default function AdEditorPage() {

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {

    loadProjects();

  }, []);



  async function loadProjects() {

    try {

      // change this to your API
      const res = await fetch(
        "http://localhost:8000/projects"
      );

      const data = await res.json();

      setProjects(data);

    } catch (error) {

      console.error(error);

      // temporary demo data
      setProjects([
        {
          id: 1,
          name: "Morning Radio Scan",
          status: "Completed",
          date: "2026-07-20",
        },
        {
          id: 2,
          name: "Radio Search Demo",
          status: "Completed",
          date: "2026-07-20",
        },
      ]);

    } finally {

      setLoading(false);

    }

  }



  return (

    <div className="min-h-screen bg-gray-100 p-8">


      {/* Header */}
      <div className="mb-8">

        <h1 className="text-3xl font-bold">
          🎧 Ad Editor
        </h1>

        <p className="text-gray-600 mt-2">
          Select a completed project to review and edit advertisement segments.
        </p>

      </div>



      {/* Loading */}
      {loading && (

        <div className="bg-white rounded-xl shadow p-6">

          Loading projects...

        </div>

      )}



      {/* Empty */}
      {!loading && projects.length === 0 && (

        <div className="bg-white rounded-xl shadow p-6">

          No completed projects available.

        </div>

      )}




      {/* Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">


        {projects.map((project) => (

          <div
            key={project.id}
            className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition"
          >


            <div className="flex justify-between items-start">


              <h2 className="text-xl font-semibold">

                {project.name}

              </h2>


              <span
                className="
                  bg-green-100
                  text-green-700
                  px-3
                  py-1
                  rounded-full
                  text-sm
                "
              >

                {project.status}

              </span>


            </div>



            <p className="text-gray-500 mt-3">

              Created: {project.date}

            </p>



            <Link
               href={`/ad-editor/${project.id}?name=${encodeURIComponent(project.name)}`}
              className="
                block
                mt-5
                text-center
                bg-blue-600
                text-white
                py-2
                rounded-lg
                hover:bg-blue-700
              "
            >

              Open Editor

            </Link>


          </div>

        ))}


      </div>


    </div>

  );

}