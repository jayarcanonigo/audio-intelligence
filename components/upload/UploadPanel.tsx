"use client";

import {
  useState,
  useEffect
} from "react";

import {
  uploadAudio,
  getUploadStatus
} from "@/services/api";


interface Props {

  projectId:number;

  onComplete?:()=>void;

}


export default function UploadPanel({

  projectId,

  onComplete

}:Props){


  const [file,setFile] =
    useState<File | null>(null);


  const [keywords,setKeywords] =
    useState("");


  const [uploadTime,setUploadTime] =
    useState("01");


  const [sessionId,setSessionId] =
    useState("");


  const [status,setStatus] =
    useState<any>(null);



  async function handleUpload(){


    if(!file){

      return;

    }


    const keywordList =
      keywords
      .split("\n")
      .map(x=>x.trim())
      .filter(Boolean);



    const result =
      await uploadAudio(

        projectId,

        file,

        keywordList,

        uploadTime   // <-- add time

      );


    setSessionId(
      result.session_id
    );

  }





  useEffect(()=>{


    if(!sessionId){

      return;

    }


    const timer = setInterval(async()=>{


      const data =
        await getUploadStatus(
          sessionId
        );


      setStatus(data);



      if(data.status === "completed"){

        onComplete?.();

        clearInterval(timer);

      }



      if(data.status === "error"){

        clearInterval(timer);

      }


    },2000);



    return()=>{

      clearInterval(timer);

    };


  },[sessionId]);






  return (

    <div className="space-y-4">


      <input

        type="file"

        accept="audio/*"

        onChange={e=>

          setFile(
            e.target.files?.[0] || null
          )

        }

      />



      {/* TIME DROPDOWN */}
      <div className="flex items-center gap-3">

        <label className="font-medium">
          Time:
        </label>


        <select

          value={uploadTime}

          onChange={e=>
            setUploadTime(
              e.target.value
            )
          }

          className="
            border
            rounded
            px-3
            py-2
          "

        >

          {
            Array.from(
              {length:24},
              (_,index)=>{

                const hour =
                  String(index + 1)
                  .padStart(2,"0");


                return (

                  <option
                    key={hour}
                    value={hour}
                  >

                    {hour}:00

                  </option>

                );

              }
            )
          }


        </select>


      </div>




      <textarea

        placeholder="Keywords per line"

        value={keywords}

        onChange={e=>

          setKeywords(
            e.target.value
          )

        }

        className="border p-2 w-full"

      />




      <button

        onClick={handleUpload}

        className="
          bg-blue-600
          text-white
          px-4
          py-2
          rounded
        "

      >

        Upload

      </button>





      {
        status &&

        <div className="border p-3">


          <p>
            Status: {status.status}
          </p>


          <p>
            Chunk:
            {" "}
            {status.current_chunk}
            /
            {status.total_chunks}
          </p>



          <div className="w-full bg-gray-200 h-3">


            <div

              className="bg-blue-500 h-3"

              style={{
                width:
                `${status.progress_percent || 0}%`
              }}

            />


          </div>



          <p>
            {status.progress_percent || 0}%
          </p>


        </div>

      }


    </div>

  );

}