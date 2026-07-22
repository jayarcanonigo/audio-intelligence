"use client";

import {
  useEffect,
  useState
} from "react";

import Link from "next/link";

import {
  getProjects,
  deleteProject
} from "@/services/api";


export default function ProjectsPage(){


  const [projects,setProjects] =
    useState<any[]>([]);


  const [loading,setLoading] =
    useState(true);



  async function handleDelete(id:number){


    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this project?\n\nSegments and advertisements will also be deleted."
      );


    if(!confirmDelete){

      return;

    }



    try{


      await deleteProject(id);



      setProjects(prev =>
        prev.filter(
          project => project.id !== id
        )
      );



    }
    catch(error){


      console.error(error);


      alert(
        "Failed to delete project"
      );


    }

  }





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
        projects.map(project=>(


          <div

            key={project.id}

            className="
              border
              rounded-xl
              p-4
              hover:shadow
              flex
              justify-between
              items-center
            "

          >



            <Link

              href={`/projects/${project.id}`}

              className="flex-1"

            >


              <h2 className="font-semibold text-lg">

                {project.name}

              </h2>



              <p>

                File: {project.filename || "No file"}

              </p>



              <p>

                Status: {project.status}

              </p>



              <p>

                Chunks: {project.total_chunks || 0}

              </p>


            </Link>





            <button

              onClick={()=>
                handleDelete(project.id)
              }

              className="
                ml-4
                bg-red-500
                hover:bg-red-600
                text-white
                px-4
                py-2
                rounded-lg
              "

            >

              🗑 Delete

            </button>



          </div>


        ))
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