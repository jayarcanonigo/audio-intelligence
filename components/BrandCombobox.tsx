"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { getBrands, createBrand } from "@/services/api";


interface Brand {
  id:number;
  name:string;
}


interface Props {
  value:string;
  onChange:(value:string)=>void;

  // added control
  open?:boolean;
  onOpenChange?:(open:boolean)=>void;
}


export default function BrandCombobox({
  value,
  onChange,
  open,
  onOpenChange,
}:Props){

  const [internalOpen,setInternalOpen] = React.useState(false);

  const [brands,setBrands] = React.useState<Brand[]>([]);
  const [loading,setLoading] = React.useState(true);
  const [creating,setCreating] = React.useState(false);
  const [search,setSearch] = React.useState("");


  const isControlled = open !== undefined;

  const popoverOpen = isControlled
    ? open
    : internalOpen;


  function setPopoverOpen(state:boolean){

    if(!isControlled){
      setInternalOpen(state);
    }

    onOpenChange?.(state);
  }



  async function loadBrands(){

    try{

      setLoading(true);

      const data = await getBrands();

      setBrands(data || []);

    }catch(err){

      console.error(err);

    }finally{

      setLoading(false);

    }
  }



  React.useEffect(()=>{

    loadBrands();

  },[]);



  const filteredBrands =
    brands.filter((brand)=>
      brand.name
      .toLowerCase()
      .includes(search.toLowerCase())
    );



  const exactMatch =
    brands.find(
      b =>
      b.name.toLowerCase()
      === search.trim().toLowerCase()
    );



  async function handleAddBrand(){

    const name = search.trim();

    if(!name) return;


    try{

      setCreating(true);


      const brand =
        await createBrand(name);


      await loadBrands();


      onChange(brand.name);


      setSearch("");

      setPopoverOpen(false);


    }catch(err:any){

      alert(err.message);

    }
    finally{

      setCreating(false);

    }

  }



  return (

    <Popover
      open={popoverOpen}
      onOpenChange={setPopoverOpen}
    >


      <PopoverTrigger
        className="
          flex
          h-10
          w-full
          items-center
          justify-between
          rounded-xl
          border
          border-yellow-300
          bg-yellow-50
          px-3
        "
      >

        <span>
          {value || "Select Brand"}
        </span>


        <ChevronsUpDown
          className="h-4 w-4"
        />

      </PopoverTrigger>



      <PopoverContent
            side="bottom"
            align="start"
            sideOffset={5}
            className="
                w-[420px]
                p-0
                z-[9999]
            "
            >


        <Command
          shouldFilter={false}
        >


          <CommandInput
            placeholder="Search brand..."
            value={search}
            onValueChange={setSearch}
          />



          <CommandList>


            {
            loading ? (

              <div
                className="
                flex
                items-center
                justify-center
                py-8
                "
              >

                <Loader2
                  className="
                  h-5
                  w-5
                  animate-spin
                  "
                />

              </div>


            ):(


              <>


              <CommandEmpty>
                No brands found.
              </CommandEmpty>



              <CommandGroup heading="Brands">


              {
              filteredBrands.map((brand)=>(


                <CommandItem

                  key={brand.id}

                  value={brand.name}


                  onSelect={()=>{


                    onChange(
                      brand.name
                    );


                    setSearch("");

                    setPopoverOpen(false);


                  }}


                  className="
                  cursor-pointer
                  "
                >


                  <Check

                    className={cn(
                      "mr-2 h-4 w-4",

                      value === brand.name
                      ? "opacity-100"
                      : "opacity-0"
                    )}

                  />


                  <span
                    className="
                    flex-1
                    truncate
                    "
                  >
                    🏷 {brand.name}
                  </span>


                </CommandItem>


              ))
              }


              </CommandGroup>





              {
              !exactMatch &&
              search.trim() !== "" &&

              (

              <>


              <div
                className="border-t"
              />


              <CommandGroup>


                <CommandItem

                  disabled={creating}

                  onSelect={handleAddBrand}

                  className="
                  cursor-pointer
                  "
                >


                {
                creating ? (

                  <Loader2
                    className="
                    mr-2
                    h-4
                    w-4
                    animate-spin
                    "
                  />


                ):(

                  <Plus
                    className="
                    mr-2
                    h-4
                    w-4
                    "
                  />

                )
                }


                Add "{search}"


                </CommandItem>


              </CommandGroup>


              </>

              )
              }



              </>

            )
            }


          </CommandList>


        </Command>


      </PopoverContent>


    </Popover>

  );

}