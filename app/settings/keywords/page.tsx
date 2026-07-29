"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import {
  ArrowLeft,
  Trash2,
  Plus,
  Search,
  Tag,
} from "lucide-react";

import {
  getKeywords,
  createKeyword,
  deleteKeyword,
  getBrands,
} from "@/services/api";

import BrandCombobox from "@/components/BrandCombobox";
import "react-toastify/dist/ReactToastify.css";


interface Keyword {
  id: number;
  brand_id: number;
  brand_name: string;
  keyword: string;
  created_at: string;
}


interface Brand {
  id: number;
  name: string;
}


export default function KeywordsPage() {

  const router = useRouter();


  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [keyword, setKeyword] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandId, setBrandId] = useState<number | "">("");

  const [loading, setLoading] = useState(false);



  async function loadKeywords() {
    try {
      const data = await getKeywords();
      setKeywords(data);
    } catch {
      toast.error("Failed to load keywords");
    }
  }



  async function loadBrands() {
    try {
      const data = await getBrands();
      setBrands(data);
    } catch {
      toast.error("Failed to load brands");
    }
  }



  function handleBrandChange(name: string) {

    setBrandName(name);


    const brand = brands.find(
      (item) =>
        item.name.toLowerCase() === name.toLowerCase()
    );


    if (brand) {
      setBrandId(brand.id);
    } else {
      setBrandId("");
    }

  }



  async function addKeyword() {

    if (!keyword.trim()) {
      toast.warning("Enter keyword");
      return;
    }


    if (!brandId) {
      toast.warning("Select brand");
      return;
    }



    try {

      setLoading(true);


      await createKeyword({
        brand_id: Number(brandId),
        keyword: keyword.trim(),
      });



      setKeyword("");
      setBrandName("");
      setBrandId("");

      await loadKeywords();

      toast.success("Keyword added");


    } catch {

      toast.error("Failed to add keyword");


    } finally {

      setLoading(false);

    }

  }




  async function removeKeyword(id:number) {

    try {

      await deleteKeyword(id);

      await loadKeywords();

      toast.success("Keyword deleted");


    } catch {

      toast.error("Failed to delete keyword");

    }

  }




  useEffect(() => {

    loadKeywords();
    loadBrands();

  }, []);





  return (

    <div className="min-h-screen bg-gray-100 p-8">

      <ToastContainer />


      <div className="max-w-5xl mx-auto">



        {/* Back */}

        <button
          onClick={() => router.push("/settings")}
          className="
            flex
            items-center
            gap-2
            mb-6
            text-blue-600
            hover:text-blue-800
            font-medium
          "
        >

          <ArrowLeft className="w-4 h-4"/>

          Back to Settings

        </button>





        <div className="flex items-center gap-3 mb-8">

          <div className="
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-xl
            bg-blue-100
          ">
            <Search className="text-blue-600"/>
          </div>


          <div>

            <h1 className="text-3xl font-bold">
              Advertisement Keywords
            </h1>

            <p className="text-gray-500">
              Manage keywords used for advertisement detection.
            </p>

          </div>

        </div>






        {/* Add Keyword */}

        <div className="
          bg-white
          rounded-2xl
          shadow-sm
          border
          p-6
          mb-6
        ">


          <div className="flex items-center gap-2 mb-5">

            <Plus className="text-green-600"/>

            <h2 className="text-lg font-bold">
              Add Advertisement Keyword
            </h2>

          </div>





          <div className="
            grid
            grid-cols-1
            md:grid-cols-12
            gap-4
          ">



            {/* Keyword */}

            <div className="md:col-span-5">


              <label className="
                block
                text-sm
                font-medium
                text-gray-600
                mb-2
              ">
                Keyword
              </label>


              <input

                value={keyword}

                onChange={(e)=>setKeyword(e.target.value)}

                placeholder="Example: promo, sale, discount"

                className="
                  w-full
                  rounded-xl
                  border
                  px-4
                  py-3
                  outline-none
                  focus:ring-2
                  focus:ring-blue-300
                "

              />


            </div>





            {/* Brand */}

            <div className="md:col-span-5">


              <label className="
                block
                text-sm
                font-medium
                text-gray-600
                mb-2
              ">
                Brand
              </label>


              <BrandCombobox

                value={brandName}

                onChange={handleBrandChange}

              />


            </div>






            {/* Add Button */}

            <div className="
              md:col-span-2
              flex
              items-end
            ">


              <button

                onClick={addKeyword}

                disabled={loading}

                className="
                  w-full
                  h-12
                  rounded-xl
                  bg-green-600
                  hover:bg-green-700
                  disabled:opacity-50
                  text-white
                  font-semibold
                  flex
                  items-center
                  justify-center
                  gap-2
                "

              >

                <Plus className="w-5 h-5"/>

                {loading ? "Saving..." : "Add"}

              </button>


            </div>


          </div>


        </div>







        {/* Keyword List */}


        <div className="
          bg-white
          rounded-2xl
          shadow-sm
          border
          p-6
        ">



          <div className="flex items-center gap-2 mb-5">

            <Tag className="text-purple-600"/>

            <h2 className="text-lg font-bold">
              Keyword List
            </h2>

          </div>





          {keywords.length === 0 ? (


            <div className="
              rounded-xl
              bg-gray-50
              p-8
              text-center
            ">

              <p className="text-gray-500">
                No keywords found.
              </p>

            </div>



          ) : (


            <div className="grid gap-3">



              {keywords.map((item)=>(



                <div

                  key={item.id}

                  className="
                    flex
                    items-center
                    justify-between
                    rounded-xl
                    border
                    bg-gray-50
                    p-4
                    hover:bg-white
                    hover:shadow-sm
                    transition
                  "

                >



                  <div className="flex items-center gap-3">


                    <span className="
                      inline-flex
                      rounded-full
                      bg-blue-100
                      px-3
                      py-1
                      text-sm
                      font-semibold
                      text-blue-700
                    ">

                      {item.keyword}

                    </span>



                    <span className="
                      flex
                      items-center
                      gap-1
                      text-sm
                      text-gray-500
                    ">

                      🏷 {item.brand_name}

                    </span>


                  </div>





                  <button

                    onClick={()=>removeKeyword(item.id)}

                    className="
                      rounded-lg
                      p-2
                      text-red-600
                      hover:bg-red-50
                    "

                  >

                    <Trash2 className="w-5 h-5"/>


                  </button>



                </div>


              ))}


            </div>


          )}



        </div>




      </div>


    </div>

  );

}
