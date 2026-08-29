"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, X } from "lucide-react";

import { createClient } from "@/src/lib/supabase/client";

type Kategori = {
  id: string;
  nama: string;
  deskripsi: string;
};

export default function KategoriPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [nama, setNama] = useState("");
  const [deskripsi, setDeskripsi] = useState("");

  const supabase = createClient();

  const fetchKategori = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("kategori")
      .select("*")
      .order("nama", { ascending: true });
      
    if (error) {
      console.error("Error fetching kategori:", error);
    } else {
      setKategoriList(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchKategori();
  }, []);

  const handleAddClick = () => {
    setModalMode("add");
    setEditingId(null);
    setNama("");
    setDeskripsi("");
    setIsModalOpen(true);
  };

  const handleEditClick = (kat: Kategori) => {
    setModalMode("edit");
    setEditingId(kat.id);
    setNama(kat.nama);
    setDeskripsi(kat.deskripsi || "");
    setIsModalOpen(true);
  };

  const handleSimpan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    if (modalMode === "add") {
      const { data, error } = await supabase
        .from("kategori")
        .insert([{ nama, deskripsi }])
        .select();

      if (error) {
        alert("Gagal menyimpan kategori: " + error.message);
        return;
      }

      if (data) {
        setKategoriList([...kategoriList, data[0]]);
      }
      alert("Kategori berhasil ditambahkan!");
    } else {
      const { data, error } = await supabase
        .from("kategori")
        .update({ nama, deskripsi })
        .eq("id", editingId)
        .select();

      if (error) {
        alert("Gagal mengupdate kategori: " + error.message);
        return;
      }

      if (data) {
        setKategoriList(kategoriList.map(k => k.id === editingId ? data[0] : k));
      }
      alert("Kategori berhasil diupdate!");
    }
    
    // Close Modal
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus kategori ini? Data produk terkait mungkin ikut terpengaruh.")) {
      const { error } = await supabase
        .from("kategori")
        .delete()
        .eq("id", id);
        
      if (error) {
        alert("Gagal menghapus kategori: " + error.message);
      } else {
        setKategoriList(kategoriList.filter(k => k.id !== id));
      }
    }
  };

  const filteredList = kategoriList.filter(k => 
    k.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full relative">
      {/* Page Header */}
      <div className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Cari Kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleAddClick}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>Tambah Kategori</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-semibold tracking-tight">Manajemen Kategori</h1>
            <span className="text-sm text-zinc-500 font-mono">
              Total: {filteredList.length} kategori
            </span>
          </div>

          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black shadow-sm overflow-hidden">
            {filteredList.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">
                Data kategori kosong.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium">
                    <tr>
                      <th className="px-4 py-3">Nama Kategori</th>
                      <th className="px-4 py-3">Deskripsi</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {filteredList.map((kat) => (
                      <tr key={kat.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{kat.nama}</td>
                        <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{kat.deskripsi || "-"}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleEditClick(kat)} className="p-1.5 text-zinc-400 hover:text-teal-600 rounded-md transition-colors">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(kat.id)} className="p-1.5 text-zinc-400 hover:text-red-500 rounded-md transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Kategori Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-0">
          <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <h2 className="text-lg font-semibold tracking-tight">
                {modalMode === "add" ? "Tambah Kategori Baru" : "Edit Kategori"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSimpan} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nama Kategori</label>
                  <input 
                    type="text" 
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Misal: Pipa PVC" 
                    className="w-full h-10 px-3 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder:text-zinc-400" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Deskripsi <span className="font-mono text-xs text-zinc-400">(Opsional)</span></label>
                  <textarea 
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    placeholder="Keterangan kategori..." 
                    className="w-full min-h-[100px] p-3 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder:text-zinc-400 resize-y" 
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-black text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium rounded-md bg-teal-600 text-white hover:bg-teal-700 transition-colors">
                  {modalMode === "add" ? "Simpan Kategori" : "Update Kategori"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
