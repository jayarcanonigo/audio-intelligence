"use client";

import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";


export default function SettingsPage(){

  const [model,setModel] = useState("medium");
  const [chunkSize,setChunkSize] = useState("300");
  const [restarting,setRestarting] = useState(false);


  async function restartAPI(){

    try{

      setRestarting(true);

      const res = await fetch(
        "http://localhost:8000/system/restart",
        {
          method:"POST"
        }
      );


      if(!res.ok){

        throw new Error();

      }


      toast.success(
        "API restarted successfully"
      );


    }catch(error){

      toast.error(
        "Restart failed"
      );

    }
    finally{

      setRestarting(false);

    }

  }



  return (

    <div className="
      p-6
      space-y-6
      bg-gray-50
      min-h-screen
    ">


      <ToastContainer />


      <h1 className="
        text-2xl
        font-bold
      ">
        ⚙️ Settings
      </h1>



      {/* MODEL */}

      <div className="
        bg-white
        rounded-xl
        shadow
        p-5
      ">

        <h2 className="
          font-semibold
          mb-4
        ">
          🤖 Whisper Model
        </h2>


        <label className="block mb-2">
          Model Size
        </label>


        <select

          value={model}

          onChange={
            e=>setModel(e.target.value)
          }

          className="
            border
            rounded
            px-3
            py-2
            w-full
          "

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





      {/* AUDIO */}

      <div className="
        bg-white
        rounded-xl
        shadow
        p-5
      ">


        <h2 className="
          font-semibold
          mb-4
        ">
          🎧 Audio Processing
        </h2>



        <label>
          Chunk Duration (seconds)
        </label>


        <input

          type="number"

          value={chunkSize}

          onChange={
            e=>setChunkSize(
              e.target.value
            )
          }

          className="
            border
            rounded
            px-3
            py-2
            w-full
          "

        />


      </div>






      {/* FILTER */}

      <div className="
        bg-white
        rounded-xl
        shadow
        p-5
      ">


        <h2 className="
          font-semibold
          mb-4
        ">
          🔍 Advertisement Filter
        </h2>



        <textarea

          placeholder="
          keyword per line
          "

          className="
            border
            rounded
            p-3
            w-full
            h-32
          "

        />


      </div>







      {/* SYSTEM */}

      <div className="
        bg-white
        rounded-xl
        shadow
        p-5
      ">


        <h2 className="
          font-semibold
          mb-4
        ">
          🖥 System
        </h2>



        <div className="
          flex
          justify-between
          items-center
        ">


          <div>

            <p>
              Backend
            </p>

            <p className="
              text-green-600
              text-sm
            ">
              ● Online
            </p>

          </div>



          <button

            onClick={restartAPI}

            disabled={restarting}

            className="
              bg-red-600
              hover:bg-red-700
              text-white
              px-4
              py-2
              rounded-lg
            "

          >

            {
              restarting
              ?
              "Restarting..."
              :
              "Restart API"
            }


          </button>


        </div>


      </div>



    </div>

  );

}