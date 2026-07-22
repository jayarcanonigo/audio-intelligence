"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

    <div className="p-6">


      {/* HEADER */}
      <div
        className="
          flex
          justify-between
          items-center
          mb-6
        "
      >

        <div>

          <h1
            className="
              text-3xl
              font-bold
              text-gray-800
            "
          >
            Projects
          </h1>


          <p className="text-gray-500 mt-1">
            Create projects, upload audio and manage processing.
          </p>

        </div>


        <Link
          href="/projects/new"
          className="
            bg-blue-600
            hover:bg-blue-700
            text-white
            px-5
            py-2.5
            rounded-lg
            font-semibold
            shadow
          "
        >
          + New Project
        </Link>


      </div>



      {/* LOADING */}
      {loading && (

        <div className="
          bg-white
          rounded-xl
          shadow
          p-6
        ">
          Loading projects...
        </div>

      )}




      {/* EMPTY */}
      {!loading && projects.length === 0 && (

        <div
          className="
            bg-white
            rounded-xl
            shadow
            p-6
          "
        >
          No projects found.
        </div>

      )}






      {/* PROJECT CARDS */}
      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-2
          xl:grid-cols-3
          gap-5
        "
      >


        {projects.map((project) => (


          <div
            key={project.id}
            className="
              bg-white
              border
              rounded-xl
              shadow-sm
              hover:shadow-md
              transition
              p-5
              flex
              flex-col
            "
          >


            <h3
              className="
                text-xl
                font-bold
                text-gray-800
              "
            >
              {project.name}
            </h3>




            <div
              className="
                mt-4
                space-y-2
                text-sm
              "
            >


              {/* STATUS */}
              <p>
                <strong>Status:</strong>{" "}

                <span
                  className="
                    font-semibold
                    text-green-600
                  "
                >
                  {project.status}
                </span>

              </p>




              {/* SEGMENTS */}
              <p>

                <strong>
                  Segments:
                </strong>{" "}

                {project.total_segments ?? 0}

              </p>





              {/* ADS FOUND */}
              <p>

                <strong>
                  Ads Found:
                </strong>{" "}


                <span
                  className="
                    font-semibold
                    text-blue-600
                  "
                >
                  {project.ads_found ?? 0}
                </span>


              </p>





              {/* SAVED ADS */}
              <p>

                <strong>
                  Saved Ads:
                </strong>{" "}


                <span
                  className="
                    font-semibold
                    text-green-600
                  "
                >
                  {project.saved_ads ?? 0}
                </span>


              </p>






              {/* CREATED DATE */}
              <p
                className="
                  text-gray-500
                  text-xs
                  mt-3
                "
              >

                Created:

                <br />

                {
                  project.created_at
                    ? new Date(
                        project.created_at
                      ).toLocaleString()
                    : "No date"
                }


              </p>



            </div>






            {/* ACTION BUTTONS */}
            <div
              className="
                flex
                gap-3
                mt-auto
                pt-5
              "
            >


              <Link
                href={`/projects/${project.id}`}
                className="
                  flex-1
                  text-center
                  bg-blue-600
                  hover:bg-blue-700
                  text-white
                  py-2.5
                  rounded-lg
                  font-semibold
                "
              >
                Open
              </Link>





              <Link
                href={`/ad-editor/${project.id}?name=${encodeURIComponent(project.name)}`}
                className="
                  flex-1
                  text-center
                  bg-green-600
                  hover:bg-green-700
                  text-white
                  py-2.5
                  rounded-lg
                  font-semibold
                "
              >
                Edit Ads
              </Link>


            </div>



          </div>


        ))}


      </div>


    </div>

  );

}