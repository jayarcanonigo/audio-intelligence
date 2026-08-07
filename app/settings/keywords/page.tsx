"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Trash2,
  Plus,
  Search,
  Tag,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  Pencil,
  X,
  Building2,
  Inbox,
  Loader2,
  Filter,
} from "lucide-react";

import {
  getKeywords,
  createKeyword,
  updateKeyword,
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


// Deterministic accent color for a brand's avatar, so the same
// brand always gets the same chip color across renders.
const AVATAR_PALETTE = [
  "bg-indigo-50 text-indigo-700 ring-indigo-100",
  "bg-teal-50 text-teal-700 ring-teal-100",
  "bg-amber-50 text-amber-700 ring-amber-100",
  "bg-rose-50 text-rose-700 ring-rose-100",
  "bg-violet-50 text-violet-700 ring-violet-100",
  "bg-sky-50 text-sky-700 ring-sky-100",
];

function avatarClasses(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
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
  const [initialLoading, setInitialLoading] = useState(true);

  const [editingId, setEditingId] = useState<number | null>(null);


  const [sortDirection, setSortDirection] =
    useState<"asc" | "desc">("asc");


  const [collapsedBrands, setCollapsedBrands] =
    useState<Set<string>>(new Set());



  async function loadKeywords() {

    try {

      const data = await getKeywords();

      setKeywords(data);

    } catch {

      toast.error(
        "Failed to load keywords"
      );

    }

  }



  async function loadBrands() {

    try {

      const data = await getBrands();

      setBrands(data);

    } catch {

      toast.error(
        "Failed to load brands"
      );

    }

  }



  useEffect(() => {

    (async () => {

      setInitialLoading(true);

      await Promise.all([loadKeywords(), loadBrands()]);

      setInitialLoading(false);

    })();

  }, []);




  function handleBrandChange(
    name: string,
    id?: number
  ) {

    setBrandName(name);
    setBrandId(id ?? "");

  }




  function resetForm() {

    setKeyword("");
    setDuration("");
    setBrandName("");
    setBrandId("");
    setEditingId(null);

  }




  async function saveKeyword() {


    if (!keyword.trim()) {

      toast.warning(
        "Enter keyword"
      );

      return;

    }



    if (!brandId) {

      toast.warning(
        "Select brand"
      );

      return;

    }



    try {


      setLoading(true);



      const payload = {

        brand_id: Number(brandId),

        keyword: keyword.trim(),

        duration:
          duration === ""
            ? null
            : Number(duration),

      };



      if (editingId) {


        await updateKeyword(
          editingId,
          payload
        );


        toast.success(
          "Keyword updated"
        );


      } else {


        await createKeyword(
          payload
        );


        toast.success(
          "Keyword added"
        );


      }



      const savedBrandName = brandName;
      const savedBrandId = brandId;

      setKeyword("");
      setDuration("");
      setEditingId(null);

      // Keep the brand selected after saving, so the table stays
      // filtered to it and the next keyword is quick to add.
      setBrandName(savedBrandName);
      setBrandId(savedBrandId);

      await loadKeywords();



    } catch {


      toast.error(
        "Failed to save keyword"
      );


    } finally {


      setLoading(false);


    }

  }





  function editKeyword(
    item: Keyword
  ) {


    setEditingId(
      item.id
    );


    setKeyword(
      item.keyword
    );


    setDuration(
      item.duration ?? ""
    );


    setBrandName(
      item.brand_name
    );



    const brand = brands.find(
      b =>
        b.name === item.brand_name
    );



    setBrandId(
      brand?.id ?? ""
    );

  }





  async function removeKeyword(
    id: number
  ) {

    try {

      await deleteKeyword(id);

      await loadKeywords();

      toast.success(
        "Keyword deleted"
      );

    } catch {

      toast.error(
        "Failed to delete keyword"
      );

    }

  }





  function toggleBrand(
    brand: string
  ) {

    setCollapsedBrands(prev => {

      const next = new Set(prev);


      if (next.has(brand)) {

        next.delete(brand);

      } else {

        next.add(brand);

      }


      return next;

    });

  }




  const groupedKeywords =
    useMemo(() => {


      const groups =
        keywords.reduce(
          (
            acc:
              Record<string, Keyword[]>,
            item
          ) => {


            if (!acc[item.brand_name]) {

              acc[item.brand_name] = [];

            }


            acc[item.brand_name].push(item);


            return acc;


          },
          {}
        );



      return Object.entries(groups)
        .sort(([a], [b]) =>
          sortDirection === "asc"
            ? a.localeCompare(b)
            : b.localeCompare(a)
        )
        .map(
          ([brand, list]) => [
            brand,
            [...list].sort(
              (a, b) =>
                sortDirection === "asc"
                  ? a.keyword.localeCompare(
                      b.keyword
                    )
                  : b.keyword.localeCompare(
                      a.keyword
                    )
            ),
          ]
        ) as [string, Keyword[]][];



    }, [
      keywords,
      sortDirection
    ]);


  // When a brand is selected in the combobox above, narrow the
  // table down to that brand so existing keywords are easy to
  // check against while adding or editing one.
  const visibleGroups = useMemo(() => {

    if (!brandName.trim()) {
      return groupedKeywords;
    }

    return groupedKeywords.filter(
      ([brand]) =>
        brand.toLowerCase() === brandName.trim().toLowerCase()
    );

  }, [groupedKeywords, brandName]);


  const totalKeywordCount = keywords.length;




  return (

    <div className="min-h-screen bg-slate-50">

    <div className="max-w-5xl mx-auto px-4 py-8">


      <button
        onClick={() =>
          router.push("/settings")
        }
        className="group flex items-center gap-1.5 mb-6 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
      >

        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />

        Back to Settings

      </button>



      <div className="flex items-center gap-4 mb-6">

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">

          <Search className="w-5 h-5" />

        </div>

        <div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Advertisement Keywords
          </h1>

          <p className="text-slate-500 text-sm mt-0.5">
            Manage the keywords used to detect advertisements in your transcripts.
          </p>

        </div>

      </div>




      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 mb-6">


        <div className="flex items-center justify-between mb-4">

          <h2 className="font-semibold text-slate-900">

            {editingId
              ? "Edit Keyword"
              : "Add Advertisement Keyword"}

          </h2>

          {editingId && (

            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full ring-1 ring-amber-100">
              Editing
            </span>

          )}

        </div>



        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">


          <div className="md:col-span-4">

            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Keyword
            </label>

            <input
              value={keyword}
              onChange={e =>
                setKeyword(e.target.value)
              }
              placeholder="e.g. Sooking Sari-Sari Store"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-shadow"
            />

          </div>



          <div className="md:col-span-3">

            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Duration (seconds)
            </label>

            <input
              type="number"
              value={duration}
              onChange={e =>
                setDuration(
                  e.target.value
                    ? Number(e.target.value)
                    : ""
                )
              }
              placeholder="Optional"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-shadow"
            />

          </div>



          <div className="md:col-span-3">

            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Brand
            </label>

            <BrandCombobox
              value={brandName}
              onChange={handleBrandChange}
            />

          </div>



          <div className="md:col-span-2 flex items-end gap-2">

            <button
              onClick={saveKeyword}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
            >

              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : editingId ? (
                <Pencil className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}

              {editingId ? "Update" : "Add"}

            </button>


            {editingId && (

              <button
                onClick={resetForm}
                title="Cancel edit"
                className="border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg px-3 py-2 transition-colors"
              >

                <X className="w-4 h-4" />

              </button>

            )}

          </div>


        </div>


      </div>





      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">


        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">


          <div className="flex items-center gap-2">

            <h2 className="font-semibold text-slate-900">
              Keywords by Brand
            </h2>

            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {totalKeywordCount}
            </span>

          </div>


          <div className="flex items-center gap-2">

            {brandName.trim() && (

              <button
                onClick={() => {
                  setBrandName("");
                  setBrandId("");
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full ring-1 ring-indigo-100 transition-colors"
              >

                <Filter className="w-3.5 h-3.5" />

                Filtering: {brandName}

                <X className="w-3.5 h-3.5" />

              </button>

            )}


            <button
              onClick={() =>
                setSortDirection(
                  p =>
                    p === "asc"
                      ? "desc"
                      : "asc"
                )
              }
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-full transition-colors"
            >

              <ArrowUpDown className="w-3.5 h-3.5" />

              {sortDirection === "asc" ? "A → Z" : "Z → A"}

            </button>

          </div>


        </div>



        {initialLoading ? (

          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm py-14">

            <Loader2 className="w-4 h-4 animate-spin" />

            Loading keywords…

          </div>

        ) : visibleGroups.length === 0 ? (

          <div className="flex flex-col items-center justify-center text-center py-14 px-4">

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">

              <Inbox className="w-5 h-5" />

            </div>

            <p className="text-sm font-medium text-slate-700">

              {brandName.trim()
                ? `No keywords yet for ${brandName}`
                : "No keywords yet"}

            </p>

            <p className="text-sm text-slate-400 mt-1">
              Add one using the form above to get started.
            </p>

          </div>

        ) : (

          <div className="space-y-3">

          {visibleGroups.map(
            ([brand, list]) => (

            <div
              key={brand}
              className="border border-slate-200 rounded-xl overflow-hidden"
            >


              <button
                onClick={() =>
                  toggleBrand(brand)
                }
                className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 px-4 py-3 transition-colors"
              >

                <span className="inline-flex items-center text-sm font-medium text-slate-800">

                  {collapsedBrands.has(brand)
                    ? <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
                    : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
                  }

                  <span
                    className={`inline-flex shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 mr-2.5 ${avatarClasses(brand)}`}
                    style={{ width: 28, height: 28, minWidth: 28 }}
                  >
                    {brand.charAt(0).toUpperCase()}
                  </span>

                  {brand}

                </span>


                <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                  {list.length}
                </span>

              </button>




              {!collapsedBrands.has(brand) && (

                <table className="w-full text-sm">

                  <thead>

                    <tr className="border-t border-slate-100 text-left text-xs font-medium text-slate-400">

                      <th className="px-4 py-2 font-medium">Keyword</th>
                      <th className="px-4 py-2 font-medium">Duration</th>
                      <th className="px-4 py-2 font-medium text-right">Actions</th>

                    </tr>

                  </thead>

                  <tbody>

                  {list.map(item => (

                    <tr
                      key={item.id}
                      className="border-t border-slate-100 hover:bg-slate-50/70 transition-colors"
                    >

                      <td className="px-4 py-3 text-slate-800">
                        <span className="inline-flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-slate-300" />
                          {item.keyword}
                        </span>
                      </td>


                      <td className="px-4 py-3">
                        {item.duration ? (
                          <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full ring-1 ring-teal-100">
                            {item.duration}s
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>


                      <td className="text-right px-4 py-3">


                        <button
                          onClick={() =>
                            editKeyword(item)
                          }
                          title="Edit keyword"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 mr-1 transition-colors"
                        >

                          <Pencil className="w-3.5 h-3.5" />

                        </button>



                        <button
                          onClick={() =>
                            removeKeyword(item.id)
                          }
                          title="Delete keyword"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >

                          <Trash2 className="w-3.5 h-3.5" />

                        </button>


                      </td>

                    </tr>

                  ))}

                  </tbody>

                </table>

              )}

            </div>

          ))}

          </div>

        )}


      </div>


    </div>

    </div>

  );

}
