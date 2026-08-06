"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import {
  ArrowLeft,
  Trash2,
  Plus,
  Search,
  Tag,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
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
  duration?: number | null;
  created_at: string;
}

interface Brand {
  id: number;
  name: string;
}

type SortDirection = "asc" | "desc";

export default function KeywordsPage() {
  const router = useRouter();

  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [keyword, setKeyword] = useState("");
  const [duration, setDuration] = useState<number | "">("");
  const [brandName, setBrandName] = useState("");
  const [brandId, setBrandId] = useState<number | "">("");

  const [loading, setLoading] = useState(false);

  // Sorting direction for brand groups (A-Z / Z-A)
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Track which brand groups are collapsed
  const [collapsedBrands, setCollapsedBrands] = useState<Set<string>>(
    new Set()
  );

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
        duration: duration === "" ? null : Number(duration),
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

  function toggleBrand(brand: string) {
    setCollapsedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brand)) {
        next.delete(brand);
      } else {
        next.add(brand);
      }
      return next;
    });
  }

  function toggleSortDirection() {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  }

  useEffect(() => {
    loadKeywords();
    loadBrands();
  }, []);

  // Group keywords by brand, then sort brand groups and keywords within
  // each group according to the current sort direction.
  const groupedKeywords = useMemo(() => {
    const groups = keywords.reduce((acc: Record<string, Keyword[]>, item) => {
      if (!acc[item.brand_name]) {
        acc[item.brand_name] = [];
      }
      acc[item.brand_name].push(item);
      return acc;
    }, {});

    const sortedEntries = Object.entries(groups).sort(([a], [b]) =>
      sortDirection === "asc" ? a.localeCompare(b) : b.localeCompare(a)
    );

    return sortedEntries.map(([brand, list]) => [
      brand,
      [...list].sort((a, b) =>
        sortDirection === "asc"
          ? a.keyword.localeCompare(b.keyword)
          : b.keyword.localeCompare(a.keyword)
      ),
    ]) as [string, Keyword[]][];
  }, [keywords, sortDirection]);

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
            <h1 className="text-2xl font-bold">Advertisement Keywords</h1>
            <p className="text-gray-500 text-sm">
              Manage keywords used for advertisement detection.
            </p>
          </div>
        </div>

        {/* ===================== ADD KEYWORD FORM ===================== */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Plus className="text-green-600 w-5 h-5" />
            <h2 className="text-base font-bold">Add Advertisement Keyword</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Keyword
              </label>

              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
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
                onChange={(e) =>
                  setDuration(e.target.value ? Number(e.target.value) : "")
                }
                placeholder="Example: 30"
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Brand
              </label>

              <BrandCombobox value={brandName} onChange={handleBrandChange} />
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

        {/* ===================== KEYWORD LIST ===================== */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-2 mb-5">
            <Tag className="text-purple-600 w-5 h-5" />

            <h2 className="text-base font-bold">Keywords by Brand</h2>

            <span className="ml-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              {keywords.length} Keywords
            </span>

            <button
              onClick={toggleSortDirection}
              className="ml-auto flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sortDirection === "asc" ? "A–Z" : "Z–A"}
            </button>
          </div>

          {groupedKeywords.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">
              No keywords yet.
            </p>
          )}

          {groupedKeywords.map(([brand, list]) => {
            const isCollapsed = collapsedBrands.has(brand);

            return (
              <div
                key={brand}
                className="mb-4 rounded-xl border overflow-hidden last:mb-0"
              >
                {/* Brand Header */}
                <button
                  onClick={() => toggleBrand(brand)}
                  className="flex w-full items-center justify-between bg-blue-50 px-4 py-3 border-b hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-blue-700" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-blue-700" />
                    )}

                    <span className="text-lg">🏷</span>

                    <h3 className="font-bold text-blue-700">{brand}</h3>
                  </div>

                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700 border">
                    {list.length} keyword{list.length > 1 ? "s" : ""}
                  </span>
                </button>

                {/* Keywords Table */}
                {!isCollapsed && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                        <th className="px-4 py-2 font-semibold">Keyword</th>
                        <th className="px-4 py-2 font-semibold">Duration</th>
                        <th className="px-4 py-2 font-semibold text-right">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {list.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                              {item.keyword}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-gray-600">
                            {item.duration ? `${item.duration}s` : "—"}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => removeKeyword(item.id)}
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
