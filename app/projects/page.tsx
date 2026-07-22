"use client";


import {
  useEffect,
  useState
} from "react";


import Link from "next/link";


import {
  getProjects
} from "@/services/api";



export default function ProjectsPage(){


  const [projects,setProjects] =
    useState<any[]>([]);



  const [loading,setLoading] =
    useState(true);




  async function loadProjects(){


    try{


      const data =
        await getProjects();


      setProjects(data);


    }
    catch(error){

      console.error(error);

    }
    finally{

      setLoading(false);

    }

  }




  useEffect(()=>{


    loadProjects();


  },[]);






  if(loading){

    return (

      <div className="p-6">

        Loading projects...

      </div>

    );

  }





  return (

    <div className="p-6 space-y-4">


      <h1 className="text-2xl font-bold">

        Radio Projects

      </h1>




      {

        projects.map(

          project => (

            <Link

              key={project.id}

              href={`/projects/${project.id}`}

              className="block border rounded p-4 hover:bg-gray-100"

            >


              <h2 className="font-semibold">

                {project.name}

              </h2>



              <p>

                File:

                {" "}

                {project.filename || "No file"}

              </p>



              <p>

                Status:

                {" "}

                {project.status}

              </p>



              <p>

                Chunks:

                {" "}

                {project.total_chunks}

              </p>


            </Link>

          )

        )

      }




      {
        projects.length === 0 &&

        <p>

          No projects found

        </p>

      }



    </div>

  );

}