"use client";

import { useEffect, useState } from "react";
import {
  getAdvertisements,
  updateAdvertisement,
  deleteAdvertisement,
} from "@/services/api";


interface Segment {

  id:number;

  start?:string;

  end?:string;

  text:string;

  segment_type?:string;

}



interface Props {

  projectId:number;

  refresh:number;

}



export default function SegmentsList({

  projectId,

  refresh

}:Props){



const [segments,setSegments] =
useState<Segment[]>([]);



const [editingId,setEditingId] =
useState<number | null>(null);



const [editStart,setEditStart] =
useState("");



const [editEnd,setEditEnd] =
useState("");



const [editText,setEditText] =
useState("");



const [loading,setLoading] =
useState(false);







async function loadSegments(){


try{


setLoading(true);


const result =
await getAdvertisements(projectId);



console.log(
"SEGMENTS DATA",
result
);



setSegments(result);



}

catch(error){

console.error(error);

}

finally{

setLoading(false);

}


}






useEffect(()=>{

loadSegments();

},[refresh]);







function editSegment(row:Segment){


console.log(
"EDIT CLICK",
row
);



setEditingId(row.id);



setEditStart(
row.start ?? ""
);



setEditEnd(
row.end ?? ""
);



setEditText(
row.text ?? ""
);



}







function saveSegment(id:number){



setSegments(prev=>

prev.map(row=>


row.id===id

?

{

...row,

start:editStart,

end:editEnd,

text:editText

}


:

row


)

);



setEditingId(null);



}







function cancelEdit(){


setEditingId(null);


}







function deleteSegment(id:number){


setSegments(prev=>

prev.filter(
row=>row.id!==id
)

);


}







return (

<div className="mt-5">


<h2 className="
font-bold
text-xl
mb-4
">

Segments

</h2>



{

loading &&

<p>
Loading...
</p>

}





<div className="
overflow-x-auto
bg-white
rounded-xl
shadow
">


<table className="
w-full
">


<thead>


<tr className="
bg-gray-100
">


<th className="p-3 text-left">
#
</th>


<th className="p-3 text-left">
Start
</th>


<th className="p-3 text-left">
End
</th>


<th className="p-3 text-left">
Text
</th>


<th className="p-3 text-left">
Type
</th>


<th className="p-3 text-left">
Action
</th>


</tr>


</thead>





<tbody>


{

segments.map((row,index)=>(


<tr
key={row.id}
className="
border-b
"
>



<td className="p-3">

{index+1}

</td>





<td className="p-3">


{

editingId===row.id


?


<input

type="text"

value={editStart}

onChange={(e)=>

setEditStart(
e.target.value
)

}

className="
border
rounded
p-2
w-32
"

/>


:

row.start


}


</td>







<td className="p-3">


{

editingId===row.id


?


<input

type="text"

value={editEnd}

onChange={(e)=>

setEditEnd(
e.target.value
)

}

className="
border
rounded
p-2
w-32
"

/>


:

row.end


}


</td>







<td className="p-3">


{

editingId===row.id


?


<textarea

value={editText}

onChange={(e)=>

setEditText(
e.target.value
)

}

className="
border
rounded
p-2
w-full
"

/>


:


row.text


}


</td>







<td className="p-3">


<span className="
bg-orange-100
text-orange-700
px-2
py-1
rounded
text-xs
">

{

row.segment_type || "AD"

}

</span>


</td>








<td className="p-3">


{

editingId===row.id


?


<>

<button

type="button"

onClick={()=>saveSegment(row.id)}

className="
bg-blue-500
text-white
px-3
py-1
rounded
mr-2
"

>

Save

</button>




<button

type="button"

onClick={cancelEdit}

className="
bg-gray-300
px-3
py-1
rounded
"

>

Cancel

</button>


</>



:


<>

<button

type="button"

onClick={()=>editSegment(row)}

className="
text-blue-600
mr-3
"

>

✏️ Edit

</button>



<button

type="button"

onClick={()=>deleteSegment(row.id)}

className="
text-red-600
"

>

🗑 Delete

</button>

</>



}


</td>




</tr>


))


}



</tbody>


</table>


</div>


</div>


);


}