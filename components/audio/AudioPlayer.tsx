"use client";

import React from "react";


interface Props {

  file: File | null;

  setFile: (
    file: File | null
  ) => void;


  audioRef:
    React.RefObject<HTMLAudioElement | null>;


  audioUrl:string;


  onChange:(
    e:React.ChangeEvent<HTMLInputElement>
  )=>void;


  onTimeUpdate:()=>void;

}



export default function AudioPlayer({

  file,

  audioRef,

  audioUrl,

  onChange,

  onTimeUpdate


}:Props){


  return (

    <div>


      <div
        className="
          flex
          items-center
          gap-4
          mb-4
        "
      >


        <label

          className="
            bg-blue-600
            text-white
            px-4
            py-2
            rounded
            cursor-pointer
          "

        >

          Choose Audio


          <input

            type="file"

            accept="
              audio/*
            "

            className="
              hidden
            "

            onChange={
              onChange
            }

          />


        </label>




        <span
          className="
            text-gray-500
            text-sm
          "
        >

          {
            file
            ?
            file.name
            :
            "No file selected"
          }

        </span>


      </div>





      {
        audioUrl

        ?

        <audio

          ref={audioRef}

          src={audioUrl}

          controls

          className="
            w-full
          "

          onTimeUpdate={
            onTimeUpdate
          }

        />


        :

        <div

          className="
            text-gray-400
            text-sm
          "

        >

          No audio selected


        </div>


      }


    </div>

  );

}