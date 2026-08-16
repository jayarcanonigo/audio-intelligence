"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, Save, X } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getBrands, createBrand, updateBrand, deleteBrand } from "@/services/api";

interface Brand {
  id: number;
  name: string;
}

export default function BrandPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBrand, setNewBrand] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadBrands();
  }, []);

  async function loadBrands() {
    try {
      setLoading(true);
      const data = await getBrands();
      setBrands(Array.isArray(data) ? data : []);
    } catch (error) {        

    

      if (error instanceof Error) {

        toast.error(error.message);

      } else {

        toast.error("Unable to create brand");

      }

    

      }finally {
            setLoading(false);
          }
        }

  async function handleCreateBrand() {
    if (!newBrand.trim()) {
      toast.warning("Enter a brand name");
      return;
    }
    try {
      await createBrand(newBrand);
      toast.success("Brand created");
      setNewBrand("");
      loadBrands();
    } catch (error) {
      console.error(error);
      toast.error("Unable to create brand");
    }
  }

  async function handleUpdateBrand(id: number) {
    if (!editingName.trim()) {
      toast.warning("Brand name is required");
      return;
    }
    try {
      await updateBrand(id, editingName);
      toast.success("Brand updated");
      setEditingId(null);
      setEditingName("");
      loadBrands();
    } catch (error) {

        if (error instanceof Error) {

          toast.error(error.message);

        } else {

          toast.error("Unable to create brand");

        }

}
  }

  async function handleDeleteBrand(id: number) {
    if (!confirm("Delete this brand?")) return;
    try {
      await deleteBrand(id);
      toast.success("Brand deleted");
      loadBrands();
    } catch (error) {
      console.error(error);
      toast.error("Delete failed");
    }
  }

  const filtered = brands.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ToastContainer />
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🏷 Brand Management</h1>

        <div className="bg-white rounded-xl shadow p-5 mb-6">
          <h2 className="font-semibold mb-4">Add New Brand</h2>
          <div className="flex gap-3">
            <input
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value)}
              placeholder="Enter brand name..."
              className="flex-1 border rounded-lg px-4 py-2"
            />
            <button
              onClick={handleCreateBrand}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-lg flex items-center gap-2"
            >
              <Plus size={18} />
              Add
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Brand List</h2>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="border rounded-lg px-3 py-2 w-64"
            />
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 w-20">ID</th>
                <th className="text-left">Brand Name</th>
                <th className="text-center w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="text-center py-10">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-10 text-gray-500">
                    No brands found
                  </td>
                </tr>
              ) : (
                filtered.map((brand) => (
                  <tr key={brand.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">{brand.id}</td>
                    <td>
                      {editingId === brand.id ? (
                        <input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="border rounded px-3 py-2 w-full"
                        />
                      ) : (
                        brand.name
                      )}
                    </td>
                    <td>
                      <div className="flex justify-center gap-2">
                        {editingId === brand.id ? (
                          <>
                            <button
                              onClick={() => handleUpdateBrand(brand.id)}
                              className="bg-green-600 hover:bg-green-700 text-white p-2 rounded"
                            >
                              <Save size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditingName("");
                              }}
                              className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded"
                            >
                              <X size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingId(brand.id);
                                setEditingName(brand.name);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteBrand(brand.id)}
                              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}