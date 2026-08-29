"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, X, Image as ImageIcon } from "lucide-react";

import { createClient } from "@/src/lib/supabase/client";

type Kategori = {
  id: string;
  nama: string;
};

type Produk = {
  id: string;
  kategori_id: string;
  merek: string;
  tipe: string;
  ukuran: string;
  sku: string;
  harga: number;
  gambar: string | null;
};

export default function ProdukPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [produkList, setProdukList] = useState<Produk[]>([]);

  // Form State
  const [kategoriId, setKategoriId] = useState("");
  const [merek, setMerek] = useState("");
  const [tipe, setTipe] = useState("");
  const [ukuran, setUkuran] = useState("");
  const [sku, setSku] = useState("");
  const [harga, setHarga] = useState("");
  const [gambarUrl, setGambarUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClient();

  const fetchData = async () => {
    setIsLoading(true);
    // Load categories
    const { data: katData } = await supabase.from("kategori").select("id, nama").order("nama");
    if (katData) setKategoriList(katData);

    // Load products
    const { data: prodData } = await supabase.from("produk").select("*").order("merek", { ascending: true });
    if (prodData) setProdukList(prodData);
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setGambarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSimpan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kategoriId || !merek || !tipe || !sku || !harga) {
      alert("Mohon lengkapi semua field yang wajib!");
      return;
    }

    setIsSaving(true);
    let uploadedImageUrl = gambarUrl; // If it's null or already a URL

    // Upload image to Supabase Storage if there's a new file
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `produk/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('produk-gambar')
        .upload(filePath, imageFile);

      if (uploadError) {
        alert("Gagal mengupload gambar: " + uploadError.message);
        setIsSaving(false);
        return;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('produk-gambar')
        .getPublicUrl(filePath);
        
      uploadedImageUrl = publicUrlData.publicUrl;
    }

    const newProduk = {
      kategori_id: kategoriId,
      merek,
      tipe,
      ukuran,
      sku,
      harga: parseInt(harga),
      gambar: uploadedImageUrl,
    };

    const { data, error } = await supabase
      .from("produk")
      .insert([newProduk])
      .select();

    setIsSaving(false);

    if (error) {
      alert("Gagal menyimpan produk: " + error.message);
      return;
    }

    if (data) {
      setProdukList([data[0], ...produkList]);
    }

    // Reset Form
    setKategoriId("");
    setMerek("");
    setTipe("");
    setUkuran("");
    setSku("");
    setHarga("");
    setGambarUrl(null);
    setImageFile(null);
    setIsAddModalOpen(false);
    alert("Produk berhasil disimpan di Supabase!");
  };

  const handleDelete = async (id: string, imagePath: string | null) => {
    if (confirm("Hapus produk ini?")) {
      const { error } = await supabase.from("produk").delete().eq("id", id);
      
      if (error) {
        alert("Gagal menghapus produk: " + error.message);
      } else {
        setProdukList(produkList.filter((p) => p.id !== id));
        // Optional: you can also delete the image from storage here
      }
    }
  };

  const filteredList = produkList.filter(
    (p) =>
      p.merek.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full relative">
      {/* Page Header (Actions) */}
      <div className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Cari Produk (Merek / SKU)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-semibold tracking-tight">Manajemen Produk</h1>
            <span className="text-sm text-zinc-500 font-mono">
              Total: {filteredList.length} produk
            </span>
          </div>

          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black shadow-sm overflow-hidden">
            {filteredList.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">
                Data produk kosong.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium">
                    <tr>
                      <th className="px-4 py-3 w-16">Gambar</th>
                      <th className="px-4 py-3">Merek & Tipe</th>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3">Kategori</th>
                      <th className="px-4 py-3">Harga Jual</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {filteredList.map((p) => {
                      const kat = kategoriList.find((k) => k.id === p.kategori_id);
                      return (
                        <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                          <td className="px-4 py-3">
                            {p.gambar ? (
                              <img src={p.gambar} alt={p.merek} className="w-10 h-10 rounded object-cover border border-zinc-200 dark:border-zinc-700" />
                            ) : (
                              <div className="w-10 h-10 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                                <ImageIcon size={18} />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                            {p.merek} {p.tipe} <span className="text-zinc-500 text-xs font-mono block">{p.ukuran}</span>
                          </td>
                          <td className="px-4 py-3 font-mono text-zinc-500 dark:text-zinc-400">{p.sku}</td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{kat?.nama || "-"}</td>
                          <td className="px-4 py-3 font-mono font-medium text-zinc-900 dark:text-zinc-100">
                            Rp {p.harga.toLocaleString("id-ID")}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button className="p-1.5 text-zinc-400 hover:text-teal-600 rounded-md transition-colors">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => handleDelete(p.id, p.gambar)} className="p-1.5 text-zinc-400 hover:text-red-500 rounded-md transition-colors">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-0">
          <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <h2 className="text-lg font-semibold tracking-tight">Tambah Produk Baru</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSimpan} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Kategori</label>
                    <select 
                      required
                      value={kategoriId}
                      onChange={(e) => setKategoriId(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="">Pilih Kategori</option>
                      {kategoriList.map((kat) => (
                        <option key={kat.id} value={kat.id}>{kat.nama}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Merek</label>
                    <input 
                      type="text" 
                      required
                      value={merek}
                      onChange={(e) => setMerek(e.target.value)}
                      placeholder="Misal: Rucika" 
                      className="w-full h-10 px-3 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder:text-zinc-400" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipe / Varian</label>
                    <input 
                      type="text" 
                      required
                      value={tipe}
                      onChange={(e) => setTipe(e.target.value)}
                      placeholder="Misal: AW" 
                      className="w-full h-10 px-3 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder:text-zinc-400" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Ukuran <span className="font-mono text-xs text-zinc-400">(Opsional)</span></label>
                    <input 
                      type="text" 
                      value={ukuran}
                      onChange={(e) => setUkuran(e.target.value)}
                      placeholder="Misal: 1/2&quot;" 
                      className="w-full h-10 px-3 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-mono text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder:font-sans placeholder:text-zinc-400" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Gambar Produk</label>
                  <div className="mt-1 flex justify-center rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 px-6 py-8 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <div className="text-center">
                      {gambarUrl ? (
                        <div className="flex flex-col items-center gap-3">
                          <img src={gambarUrl} alt="Preview" className="max-h-32 rounded-md object-contain" />
                          <button 
                            type="button" 
                            onClick={() => setGambarUrl(null)} 
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Hapus Gambar
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="mt-4 flex justify-center text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                            <label
                              htmlFor="file-upload"
                              className="relative cursor-pointer rounded-md bg-transparent font-semibold text-teal-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-teal-600 focus-within:ring-offset-2 hover:text-teal-500"
                            >
                              <span>Pilih file gambar</span>
                              <input 
                                id="file-upload" 
                                name="file-upload" 
                                type="file" 
                                className="sr-only" 
                                accept="image/*" 
                                onChange={handleImageChange}
                              />
                            </label>
                            <p className="pl-1">atau drag & drop</p>
                          </div>
                          <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-500">PNG, JPG, GIF hingga 5MB</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">SKU / Kode Barang</label>
                    <input 
                      type="text" 
                      required
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="RCK-AW-050" 
                      className="w-full h-10 px-3 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-mono text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder:font-sans placeholder:text-zinc-400" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Harga Jual (Rp)</label>
                    <input 
                      type="number" 
                      required
                      value={harga}
                      onChange={(e) => setHarga(e.target.value)}
                      placeholder="25000" 
                      className="w-full h-10 px-3 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-mono text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder:font-sans placeholder:text-zinc-400" 
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-black text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium rounded-md bg-teal-600 text-white hover:bg-teal-700 transition-colors">
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
