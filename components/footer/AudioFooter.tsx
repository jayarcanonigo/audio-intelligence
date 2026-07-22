"use client";


interface Props{


searchText:string;


setSearchText:(v:string)=>void;


audioRef:any;


currentTime:number;


duration:number;


}



export default function AudioFooter({

searchText,

setSearchText,

audioRef,

currentTime,

duration

}:Props){






function formatTime(value:number){


if(!value || isNaN(value))

return "00:00";



const minutes =
Math.floor(value / 60);



const seconds =
Math.floor(value % 60);



return (

minutes
.toString()
.padStart(2,"0")

+

":"

+

seconds
.toString()
.padStart(2,"0")

);


}








return (

<footer


className="

fixed

bottom-0

left-0

right-0

h-24

bg-white

border-t

shadow-xl

z-[999]

"


>


<div

className="

h-full

px-6

flex

items-center

gap-5

"

>




{/* SEARCH */}

<div className="flex-1">


<input


value={searchText}


onChange={(e)=>

setSearchText(
e.target.value
)

}


placeholder="Search logs..."


className="

w-full

border

rounded-lg

px-4

py-2

focus:outline-none

focus:ring-2

focus:ring-blue-300

"


/>


</div>









{/* AUDIO CONTROL */}


<button


onClick={()=>{


audioRef.current?.play();


}}


className="

bg-green-500

hover:bg-green-600

text-white

px-5

py-2

rounded-lg

"

>

▶ Play

</button>






<button


onClick={()=>{


audioRef.current?.pause();


}}


className="

bg-gray-200

hover:bg-gray-300

px-5

py-2

rounded-lg

"

>

⏸ Pause

</button>









{/* TIME */}

<div

className="

font-semibold

text-gray-700

"

>


{formatTime(currentTime)}

 /

 {formatTime(duration)}


</div>





</div>


</footer>


);


}