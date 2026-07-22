"use client";

import { useState } from "react";


interface Segment {

  id:number;

  start?:string;

  end?:string;

  text:string;

  segment_type?:string;

}



interface Props {

  segments: Segment[];

  selectedResultId: number | null;

  setSelectedResultId: (
    id:number | null
  ) => void;


  updateTimePart?: (
    id:number,
    field:"start" | "end",
    part:"minute" | "second",
    value:string
  ) => void;


  displayTime?: (
    time?:string
  ) => string;


  onPlay:(row:Segment)=>void;


  onUpdate?:(
    id:number,
    data:{
      text:string;
      start:string;
      end:string;
    }
  )=>void;


  onRemove?:(
    id:number
  )=>void;


  onSave?:()=>Promise<void> | void;


  onDownload?:(
    row:Segment
  )=>void;

}


export default function SelectedSegments({

  segments,

  selectedResultId,

  setSelectedResultId,

  onPlay,

  onDownload,

  onUpdate,

  onRemove,

}:Props){



const [editingId,setEditingId]
=
useState<number|null>(null);



const [editText,setEditText]
=
useState("");



const [editStart,setEditStart]
=
useState("");



const [editEnd,setEditEnd]
=
useState("");





function displayTime(time?:string){

  return time || "00:00";

}





function handleEdit(row:Segment){

  setEditingId(row.id);

  setEditText(row.text);

  setEditStart(
    row.start || "00:00:00"
  );

  setEditEnd(
    row.end || "00:00:00"
  );

}





function handleSave(row:Segment){


  onUpdate?.(
    row.id,
    {
      text:editText,
      start:editStart,
      end:editEnd
    }
  );


  setEditingId(null);

}





function handleCancel(){

  setEditingId(null);

  setEditText("");

  setEditStart("");

  setEditEnd("");

}





function handleRemove(id:number){


  onRemove?.(id);


  if(selectedResultId === id){

    setSelectedResultId(null);

  }

}





function TimeInput({

  value,

  onChange,

}:{

  value:string;

  onChange:(value:string)=>void;

}){


return (

<input

type="text"

value={value}

placeholder="00:00:00"

maxLength={8}

onChange={(e)=>
onChange(e.target.value)
}

className="
w-24
border
rounded-lg
px-2
py-1
text-center
bg-white
focus:outline-none
focus:ring-2
focus:ring-blue-300
"

/>

);

}





return (

<div className="space-y-4">


{

[...segments]

.sort((a,b)=>

(a.start || "")
.localeCompare(
(a.start || "")
)

)

.map((row,index)=>(


<div

key={row.id}


onClick={(e)=>{


const target =
e.target as HTMLElement;


if(target.closest("button")){

return;

}


setSelectedResultId(row.id);


}}



className={`

border

rounded-xl

p-5

cursor-pointer

transition-all


${
selectedResultId === row.id

?

"bg-blue-50 border-blue-500 ring-2 ring-blue-200 shadow-md"

:

"bg-white border-gray-200 hover:border-blue-300 hover:shadow"

}

`}

>



<div className="flex justify-between items-start">



<div className="flex items-center gap-3">



<div

className="
w-8
h-8
rounded-full
bg-gray-100
flex
items-center
justify-center
font-bold
"

>

{index+1}

</div>




<button

type="button"


onClick={(e)=>{


e.stopPropagation();


setSelectedResultId(row.id);


onPlay(row);


}}


className="
bg-green-500
hover:bg-green-600
text-white
rounded-full
w-10
h-10
shadow
"

>

▶

</button>




<div>

<div className="font-semibold text-gray-800">

Advertisement

</div>


<div className="text-xs text-gray-500">

Detected Segment

</div>


</div>


</div>






<div className="flex gap-2">



<button

type="button"


onClick={(e)=>{


e.stopPropagation();


onDownload?.(row);


}}


className="
px-3
py-2
rounded-lg
bg-purple-600
hover:bg-purple-700
text-white
text-sm
"

>

⬇️

</button>





<button

type="button"


onClick={(e)=>{


e.stopPropagation();


handleEdit(row);


}}


className="
px-3
py-2
rounded-lg
hover:bg-gray-100
"

>

✏️

</button>





<button

type="button"


onClick={(e)=>{


e.stopPropagation();


handleRemove(row.id);


}}


className="
px-3
py-2
rounded-lg
hover:bg-red-50
"

>

🗑️

</button>



</div>



</div>







<div

className="
mt-4
bg-gray-50
rounded-lg
p-3
text-gray-700
"

>


{

editingId === row.id

?


<>


<textarea

value={editText}

onChange={(e)=>
setEditText(e.target.value)
}

rows={4}

className="
w-full
border
rounded-lg
p-3
bg-white
"

/>



<div className="flex gap-2 mt-3">


<button

onClick={()=>
handleSave(row)
}

className="
bg-blue-500
text-white
px-4
py-2
rounded-lg
"

>

Save

</button>



<button

onClick={handleCancel}

className="
bg-gray-200
px-4
py-2
rounded-lg
"

>

Cancel

</button>


</div>


</>


:


row.text


}



</div>







<div className="mt-4 flex items-center">


<div className="flex items-center gap-2 text-sm text-gray-500">


⏱


{

editingId === row.id


?


<>


<TimeInput

value={editStart}

onChange={setEditStart}

/>


<span>
→
</span>


<TimeInput

value={editEnd}

onChange={setEditEnd}

/>


</>


:


<>


<span className="font-semibold text-gray-700">

{displayTime(row.start)}

</span>


<span>
→
</span>


<span className="font-semibold text-gray-700">

{displayTime(row.end)}

</span>


</>


}



</div>


</div>



</div>



))


}



</div>


);


}