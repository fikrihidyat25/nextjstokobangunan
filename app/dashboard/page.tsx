"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, Filter } from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";

type BranchStock = {
  ruko1: number;
  ruko2: number;
  ruko3: number;
  ruko4: number;
};

type Product = {
  id: string;
  category: string;
  brand: string;
  type: string;
  size: string;
  sku: string;
  price: number;
  stock: BranchStock;
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
      <span className="inline-flex items-center rounded-md bg-teal-500/10 px-2 py-0.5 text-xs font-mono font-medium text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
        {count}
      </span>
    );
  } else if (count > 0) {
    return (
      <span className="inline-flex items-center rounded-md bg-black/10 px-2 py-0.5 text-xs font-mono font-medium text-black dark:bg-white/20 dark:text-white border border-black/20 dark:border-white/20">
        {count}
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center rounded-md bg-black px-2 py-0.5 text-xs font-mono font-medium text-white dark:bg-white dark:text-black">
        0
      </span>
    );
  }
};

export default function DashboardInventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [inventory, setInventory] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  const fetchInventory = async () => {
    setIsLoading(true);
    // Fetch products and join with kategori table to get category name
    const { data, error } = await supabase
      .from("produk")
      .select(`
        *,
        kategori (
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
        brand: item.merek,
        type: item.tipe,
        size: item.ukuran || "-",
        sku: item.sku,
        price: item.harga,
        // Since we don't have a stock table yet, we default to 0
        stock: { ruko1: 0, ruko2: 0, ruko3: 0, ruko4: 0 }, 
      }));
      setInventory(formattedData);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const q = searchQuery.toLowerCase();
      return (
        item.category.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, inventory]);

  return (
    <div className="flex flex-col h-full">
      {/* Page Header (Actions) */}
      <div className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Cari SKU, Nama Barang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-black hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
            <Filter size={16} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-semibold tracking-tight">Data Stok Ruko (Semua Produk)</h1>
            <span className="text-sm text-zinc-500 font-mono">
              Total: {filteredInventory.length} item
            </span>
          </div>

          <div className="hidden md:block rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium">
                  <tr>
                    <th className="px-4 py-3">Nama & Kategori</th>
                    <th className="px-4 py-3">Spesifikasi</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3 text-right">Harga (Rp)</th>
                    <th className="px-4 py-3 text-center">Ruko 1</th>
                    <th className="px-4 py-3 text-center">Ruko 2</th>
                    <th className="px-4 py-3 text-center">Ruko 3</th>
                    <th className="px-4 py-3 text-center">Ruko 4</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="font-medium">{item.brand} {item.type}</div>
                        <div className="text-xs text-zinc-500">{item.category}</div>
                      </td>
                      <td className="px-4 py-2.5 font-mono">{item.size}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{item.sku}</td>
                      <td className="px-4 py-2.5 font-mono text-right">{formatRupiah(item.price)}</td>
                      <td className="px-4 py-2.5 text-center"><StockBadge count={item.stock.ruko1} /></td>
                      <td className="px-4 py-2.5 text-center"><StockBadge count={item.stock.ruko2} /></td>
                      <td className="px-4 py-2.5 text-center"><StockBadge count={item.stock.ruko3} /></td>
                      <td className="px-4 py-2.5 text-center"><StockBadge count={item.stock.ruko4} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!isLoading && filteredInventory.length === 0 && (
                <div className="p-8 text-center text-zinc-500 text-sm">Tidak ada barang yang ditemukan.</div>
              )}
              {isLoading && (
                <div className="p-8 text-center text-zinc-500 text-sm animate-pulse">Memuat data dari Supabase...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
