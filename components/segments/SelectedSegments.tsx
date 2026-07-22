"use client";

import { useEffect, useState } from "react";
import { getBrands } from "@/services/api";

interface Segment {
  id: number;
  start?: string;
  end?: string;
  text: string;
  segment_type?: string;
  brand_name?: string;
}

interface Brand {
  id: number;
  name: string;
}

interface Props {
  segments: Segment[];
  selectedResultId: number | null;
  setSelectedResultId: (id: number | null) => void;
  onPlay: (row: Segment) => void;
  onUpdate?: (
    id: number,
    data: {
      text: string;
      start: string;
      end: string;
      brand_name: string;
    }
  ) => void;
  onRemove?: (id: number) => void;
  onSave?: (segments: Segment[]) => void;
}

export default function SelectedSegments({
  segments,
  selectedResultId,
  setSelectedResultId,
  onPlay,
  onUpdate,
  onRemove,
  onSave,
}: Props) {

  const [segmentList, setSegmentList] = useState<Segment[]>(segments);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [editText, setEditText] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editBrand, setEditBrand] = useState("");


  // LOAD BRANDS
  useEffect(() => {

    async function loadBrands() {

      try {

        const data = await getBrands();

        setBrands(data);

      } catch(error){

        console.error(error);

      }

    }


    loadBrands();

  }, []);



  // AUTO MATCH BRAND
  function detectBrand(
    text:string,
    currentBrand?:string
  ){

    if(currentBrand){
      return currentBrand;
    }


    const cleanText =
      text.toLowerCase();



    const matched =
      brands.find((brand)=>{


        const words =
          brand.name
          .toLowerCase()
          .split(" ")
          .filter(
            word=>word.length >= 4
          );


        return words.some(word =>
          cleanText.includes(word)
        );


      });



    return matched
      ? matched.name
      : "";

  }



  // UPDATE SEGMENTS + AUTO BRAND
  useEffect(()=>{


    const updated =
      segments.map((segment)=>{


        const brand =
          detectBrand(
            segment.text,
            segment.brand_name
          );


        return {
          ...segment,
          brand_name: brand
        };


      });



    setSegmentList(updated);



  },[segments,brands]);





  function edit(row:Segment){

    setEditingId(row.id);

    setEditText(row.text);

    setEditStart(
      row.start || "00:00:00"
    );

    setEditEnd(
      row.end || "00:00:00"
    );


    setEditBrand(
      row.brand_name || ""
    );

  }





  function saveEdit(row:Segment){


    const updated = {

      text:editText,

      start:editStart,

      end:editEnd,

      brand_name:editBrand

    };


    onUpdate?.(
      row.id,
      updated
    );


    setSegmentList(prev=>

      prev.map(item=>

        item.id===row.id

        ? {
            ...item,
            ...updated
          }

        : item

      )

    );


    setEditingId(null);

  }





  function updateBrand(
    value:string
  ){

    setEditBrand(value);

  }





  function TimeInput({
    value,
    onChange
  }:{
    value:string;
    onChange:(v:string)=>void;
  }){


    return (

      <input

        value={value}

        maxLength={8}

        onChange={
          e=>onChange(e.target.value)
        }

        className="
        w-24
        border
        rounded-lg
        px-2
        py-1
        text-center
        "

      />

    );

  }




return (

<div className="space-y-4">


<div className="
flex justify-between 
items-center 
bg-white 
border 
rounded-xl 
p-4
">


<h2 className="text-lg font-bold">
📢 Selected Advertisements
</h2>


<button

onClick={()=>
 onSave?.(segmentList)
}

className="
bg-blue-600 
text-white 
px-5 
py-2 
rounded-lg
font-semibold
"

>
Save All
</button>


</div>





{
segmentList.map((row,index)=>(


<div

key={row.id}

className={`
border
rounded-2xl
p-5
bg-white
shadow-sm

${
selectedResultId===row.id
?
"ring-2 ring-blue-300 bg-blue-50"
:""
}

`}


onClick={(e)=>{


const target =
e.target as HTMLElement;


if(
target.closest("button") ||
target.closest("select") ||
target.closest("input")
)
return;


setSelectedResultId(row.id);


}}

>


<div className="flex justify-between">


<div className="flex gap-3">


<div className="
w-10
h-10
rounded-full
bg-gray-100
flex
items-center
justify-center
font-bold
">

{index+1}

</div>



<div>

<h3 className="font-bold">
Advertisement
</h3>


<p className="text-xs text-gray-500">
Detected Segment
</p>



{
editingId===row.id

?

<select

value={editBrand}

onChange={
e=>updateBrand(e.target.value)
}

className="
mt-2
w-80
rounded-full
px-4
py-2
bg-yellow-50
border
border-yellow-300
font-semibold
"

>


<option value="">
🏷 Select Brand
</option>


{
brands.map(brand=>(

<option
key={brand.id}
value={brand.name}
>

{brand.name}

</option>

))

}


</select>


:


<div className="
mt-2
w-80
truncate
rounded-full
px-4
py-2
bg-yellow-50
border
border-yellow-300
font-semibold
">

🏷 {row.brand_name || "No brand"}

</div>


}



</div>


</div>





<div className="flex gap-2">


<button

onClick={()=>
onPlay(row)
}

className="
bg-green-500
text-white
w-10
h-10
rounded-lg
"

>

▶

</button>



{

editingId===row.id

?

<button

onClick={()=>
saveEdit(row)
}

className="
bg-blue-600
text-white
px-4
rounded-lg
"

>

Save

</button>


:


<button

onClick={()=>
edit(row)
}

className="
bg-gray-100
w-10
h-10
rounded-lg
"

>

✏️

</button>

}




<button

onClick={()=>
onRemove?.(row.id)
}

className="
bg-red-50
w-10
h-10
rounded-lg
"

>

🗑

</button>


</div>


</div>





<div className="
mt-4
bg-gray-50
rounded-xl
p-4
">


{
editingId===row.id

?

<textarea

value={editText}

onChange={
e=>setEditText(e.target.value)
}

rows={4}

className="
w-full
border
rounded-lg
p-3
"

/>

:

row.text


}


</div>





<div className="
mt-4
flex
gap-2
items-center
">

⏱


{
editingId===row.id

?

<>

<TimeInput
value={editStart}
onChange={setEditStart}
/>

→

<TimeInput
value={editEnd}
onChange={setEditEnd}
/>

</>


:

<>

<b>{row.start}</b>

→

<b>{row.end}</b>

</>


}


</div>


</div>


))

}



</div>

);


}