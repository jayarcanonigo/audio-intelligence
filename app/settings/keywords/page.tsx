"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import { ArrowLeft, Trash2, Plus, Search, Tag } from "lucide-react";

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
  duration?: number | null;
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
  const [duration, setDuration] = useState<number | "">("");
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


  function handleBrandChange(name: string, id?: number) {
    setBrandName(name);
    setBrandId(id ?? "");
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

        duration:
          duration === ""
            ? null
            : Number(duration),

      });


      setKeyword("");

      setDuration("");

      await loadKeywords();

      toast.success("Keyword added");


    } catch {

      toast.error("Failed to add keyword");

    } finally {

      setLoading(false);

    }
  }


  async function removeKeyword(id: number) {

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
    <div className="min-h-screen bg-gray-100 p-6">

      <ToastContainer />


      <div className="max-w-5xl mx-auto">

        <button
          onClick={() => router.push("/settings")}
          className="flex items-center gap-2 mb-4 text-blue-600 hover:text-blue-800 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </button>


        <div className="flex items-center gap-3 mb-5">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <Search className="text-blue-600" />
          </div>

          <div>

            <h1 className="text-2xl font-bold">
              Advertisement Keywords
            </h1>

            <p className="text-gray-500 text-sm">
              Manage keywords used for advertisement detection.
            </p>

          </div>

        </div>



        <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">

          <div className="flex items-center gap-2 mb-3">

            <Plus className="text-green-600 w-5 h-5" />

            <h2 className="text-base font-bold">
              Add Advertisement Keyword
            </h2>

          </div>



          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">


            <div className="md:col-span-4">

              <label className="block text-sm font-medium text-gray-600 mb-1">
                Keyword
              </label>

              <input

                value={keyword}

                onChange={(e)=>setKeyword(e.target.value)}

                placeholder="Example: bet88"

                className="w-full rounded-lg border px-3 py-2"

              />

            </div>



            <div className="md:col-span-3">

              <label className="block text-sm font-medium text-gray-600 mb-1">
                Duration (seconds)
              </label>

              <input

                type="number"

                value={duration}

                onChange={(e)=>
                  setDuration(
                    e.target.value
                    ? Number(e.target.value)
                    : ""
                  )
                }

                placeholder="Example: 30"

                className="w-full rounded-lg border px-3 py-2"

              />

            </div>



            <div className="md:col-span-3">

              <label className="block text-sm font-medium text-gray-600 mb-1">
                Brand
              </label>

              <BrandCombobox
                value={brandName}
                onChange={handleBrandChange}
              />

            </div>



            <div className="md:col-span-2 flex items-end">

              <button

                onClick={addKeyword}

                disabled={loading}

                className="w-full h-10 rounded-lg bg-green-600 text-white font-semibold"

              >

                <Plus className="w-5 h-5 inline" />

                {loading ? "Saving..." : "Add"}

              </button>

            </div>


          </div>

        </div>



        <div className="bg-white rounded-xl shadow-sm border p-4">

          <div className="flex items-center gap-2 mb-3">

            <Tag className="text-purple-600 w-5 h-5" />

            <h2 className="text-base font-bold">
              Keyword List
            </h2>

          </div>



          <div className="grid gap-2">

            {keywords.map((item)=>(

              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border bg-gray-50 px-3 py-2"
              >

                <div className="flex items-center gap-3">

                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-semibold text-blue-700">
                    {item.keyword}
                  </span>


                  <span className="text-sm text-gray-500">
                    🏷 {item.brand_name}
                  </span>


                  <span className="text-sm text-gray-500">
                    ⏱ {item.duration ? `${item.duration}s` : "-"}
                  </span>

                </div>



                <button

                  onClick={()=>removeKeyword(item.id)}

                  className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"

                >

                  <Trash2 className="w-4 h-4"/>

                </button>


              </div>

            ))}

          </div>


        </div>


      </div>

    </div>
  );
}