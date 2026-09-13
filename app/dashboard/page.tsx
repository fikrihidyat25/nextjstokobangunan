"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  Package, 
  ZoomIn, 
  X, 
  RotateCcw,
  Boxes
} from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";

type Product = {
  id: string;
  category: string;
  categoryId?: string;
  brand: string;
  type: string;
  size: string;
  sku: string;
  price: number;
  stock: number;
  image: string | null;
};

type Category = {
  id: string;
  nama: string;
};

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const StockBadge = ({ count }: { count: number }) => {
  if (count > 10) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 dark:bg-teal-500/10 px-2.5 py-1 text-xs font-mono font-medium text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
        {count} unit
      </span>
    );
  } else if (count > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 text-xs font-mono font-medium text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        {count} unit
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-mono font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
        0 unit
      </span>
    );
  }
};

export default function DashboardInventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [inventory, setInventory] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [stockStatus, setStockStatus] = useState<"all" | "available" | "empty">("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // View Mode: 'auto' (cards on mobile, table on desktop), 'cards', or 'table'
  const [viewMode, setViewMode] = useState<"auto" | "cards" | "table">("auto");

  // Lightbox Zoom Image Modal
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title: string;
    category?: string;
  } | null>(null);

  const supabase = createClient();

  const fetchInventory = async () => {
    setIsLoading(true);

    // Fetch categories for filter dropdown
    const { data: katData } = await supabase
      .from("kategori")
      .select("id, nama")
      .order("nama", { ascending: true });
    if (katData) {
      setCategories(katData);
    }

    // Fetch products
    const { data, error } = await supabase
      .from("produk")
      .select(`
        *,
        kategori (
          id,
          nama
        )
      `)
      .order("merek", { ascending: true });

    if (error) {
      console.error("Error fetching inventory:", error);
    } else if (data) {
      const formattedData: Product[] = data.map((item: any) => ({
        id: item.id,
        category: item.kategori?.nama || "-",
        categoryId: item.kategori_id || item.kategori?.id,
        brand: item.merek,
        type: item.tipe,
        size: item.ukuran || "-",
        sku: item.sku,
        price: item.harga,
        // Single unified stock for the whole store (no more separate ruko columns)
        stock: item.stok ?? 0,
        image: item.gambar || null,
      }));
      setInventory(formattedData);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPreviewImage(null);
        setIsFilterOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const hasActiveFilters = selectedCategory !== "all" || stockStatus !== "all";

  const resetFilters = () => {
    setSelectedCategory("all");
    setStockStatus("all");
    setIsFilterOpen(false);
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.category.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === "all" ||
        item.categoryId === selectedCategory ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesStock =
        stockStatus === "all"
          ? true
          : stockStatus === "available"
          ? item.stock > 0
          : item.stock === 0;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [searchQuery, inventory, selectedCategory, stockStatus]);

  return (
    <div className="flex flex-col h-full relative">
      {/* Page Header (Actions & Filters) */}
      <div className="p-4 sm:p-6 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Cari SKU, Merek, Tipe, Kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Controls: Filter & View Mode */}
          <div className="flex items-center gap-2">
            {/* Filter Toggle Button */}
            <div className="relative flex-1 sm:flex-none">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-3.5 py-2 text-sm font-medium border rounded-lg transition-colors ${
                  hasActiveFilters || isFilterOpen
                    ? "border-teal-500 bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <Filter size={16} />
                <span>Filter</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                )}
              </button>

              {/* Filter Popover Dropdown */}
              {isFilterOpen && (
                <div className="absolute right-0 top-12 z-30 w-72 sm:w-80 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="font-semibold text-sm">Filter Inventori</span>
                    {hasActiveFilters && (
                      <button
                        onClick={resetFilters}
                        className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                      >
                        <RotateCcw size={12} /> Reset
                      </button>
                    )}
                  </div>

                  {/* Kategori Filter */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Kategori Produk
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full h-9 px-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:border-teal-500"
                    >
                      <option value="all">Semua Kategori</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nama}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Stok Filter */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Status Stok
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "all", label: "Semua" },
                        { id: "available", label: "Tersedia" },
                        { id: "empty", label: "Habis" },
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setStockStatus(s.id as any)}
                          className={`px-2 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                            stockStatus === s.id
                              ? "border-teal-500 bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 font-semibold"
                              : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      Terapkan Filter
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* View Mode Toggle (Cards vs Table) */}
            <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                title="Tampilan Kartu (Nyaman di HP)"
                className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === "cards" || (viewMode === "auto")
                    ? "bg-white dark:bg-zinc-800 text-teal-600 dark:text-teal-400 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                title="Tampilan Tabel (Desktop)"
                className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === "table"
                    ? "bg-white dark:bg-zinc-800 text-teal-600 dark:text-teal-400 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-xs text-zinc-400">Filter Aktif:</span>
            {selectedCategory !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 text-xs font-medium">
                Kategori: {categories.find((c) => c.id === selectedCategory)?.nama || selectedCategory}
                <button onClick={() => setSelectedCategory("all")} className="hover:text-teal-900">
                  <X size={12} />
                </button>
              </span>
            )}
            {stockStatus !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 text-xs font-medium">
                Stok: {stockStatus === "available" ? "Tersedia (>0)" : "Habis (0)"}
                <button onClick={() => setStockStatus("all")} className="hover:text-teal-900">
                  <X size={12} />
                </button>
              </span>
            )}
            <button
              onClick={resetFilters}
              className="text-xs text-zinc-500 hover:text-red-500 underline ml-1"
            >
              Hapus Semua
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Data Stok Barang
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Stok inventori gabungan seluruh ruko TB. Sumber Jaya
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-800">
                Total: <strong className="text-zinc-800 dark:text-zinc-200">{filteredInventory.length}</strong> item
              </span>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="p-12 text-center text-zinc-500 text-sm flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Memuat data inventori...</span>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredInventory.length === 0 && (
            <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
                <Boxes size={24} />
              </div>
              <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">
                Tidak ada barang ditemukan
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                Coba sesuaikan kata kunci pencarian atau ubah pengaturan filter Anda.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="mt-4 px-3 py-1.5 text-xs font-medium bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-lg hover:bg-teal-100 transition-colors"
                >
                  Reset Filter
                </button>
              )}
            </div>
          )}

          {/* 1. MOBILE CARD VIEW (No horizontal scrolling, fits 100% of mobile screen) */}
          {!isLoading && filteredInventory.length > 0 && (
            <div
              className={`space-y-3 ${
                viewMode === "table"
                  ? "hidden"
                  : viewMode === "cards"
                  ? "block"
                  : "block md:hidden"
              }`}
            >
              {filteredInventory.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail / Image */}
                    <div className="shrink-0">
                      {item.image ? (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewImage({
                              url: item.image!,
                              title: `${item.brand} ${item.type}`,
                              category: item.category,
                            })
                          }
                          className="group relative block w-14 h-14 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 hover:border-teal-500 transition-all"
                          title="Klik untuk memperbesar gambar"
                        >
                          <img
                            src={item.image}
                            alt={item.brand}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ZoomIn size={14} className="text-white drop-shadow" />
                          </div>
                        </button>
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-400 border border-zinc-200/60 dark:border-zinc-800">
                          <Package size={22} />
                        </div>
                      )}
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="inline-block text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 mb-1">
                            {item.category}
                          </span>
                          <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                            {item.brand} {item.type}
                          </h3>
                        </div>
                        {/* Stock Badge on Mobile */}
                        <div className="shrink-0">
                          <StockBadge count={item.stock} />
                        </div>
                      </div>

                      {/* Specs & SKU Row */}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                        {item.size && item.size !== "-" && (
                          <span className="bg-zinc-50 dark:bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                            Ukuran: {item.size}
                          </span>
                        )}
                        <span className="bg-zinc-50 dark:bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                          SKU: {item.sku}
                        </span>
                      </div>

                      {/* Price Row */}
                      <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                        <span className="text-xs text-zinc-400 font-medium">Harga Satuan:</span>
                        <span className="text-sm font-bold text-teal-600 dark:text-teal-400 font-mono">
                          {formatRupiah(item.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. TABLE VIEW (Spacious & Clean 5-Column Table for Desktop) */}
          {!isLoading && filteredInventory.length > 0 && (
            <div
              className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs overflow-hidden ${
                viewMode === "cards"
                  ? "hidden"
                  : viewMode === "table"
                  ? "block"
                  : "hidden md:block"
              }`}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-50/70 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Nama & Kategori</th>
                      <th className="px-4 py-3.5">Spesifikasi</th>
                      <th className="px-4 py-3.5">SKU</th>
                      <th className="px-4 py-3.5 text-right">Harga (Rp)</th>
                      <th className="px-5 py-3.5 text-center">Stok Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {filteredInventory.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50 transition-colors"
                      >
                        {/* Name & Category with optional Thumbnail */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            {item.image ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewImage({
                                    url: item.image!,
                                    title: `${item.brand} ${item.type}`,
                                    category: item.category,
                                  })
                                }
                                className="group relative w-10 h-10 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0 hover:border-teal-500 cursor-zoom-in"
                                title="Perbesar gambar"
                              >
                                <img
                                  src={item.image}
                                  alt={item.brand}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <ZoomIn size={12} className="text-white" />
                                </div>
                              </button>
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                                <Package size={18} />
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {item.brand} {item.type}
                              </div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                {item.category}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Specs */}
                        <td className="px-4 py-3 font-mono text-zinc-700 dark:text-zinc-300">
                          {item.size || "-"}
                        </td>

                        {/* SKU */}
                        <td className="px-4 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                          {item.sku}
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3 font-mono font-medium text-right text-zinc-900 dark:text-zinc-100">
                          {formatRupiah(item.price)}
                        </td>

                        {/* Unified Stock */}
                        <td className="px-5 py-3 text-center">
                          <StockBadge count={item.stock} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox / Zoom Image Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-lg w-full bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  {previewImage.title}
                </h4>
                {previewImage.category && (
                  <p className="text-xs text-zinc-500">{previewImage.category}</p>
                )}
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Image */}
            <div className="p-4 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950/50">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
