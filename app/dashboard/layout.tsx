"use client";

import React, { useState, useEffect } from "react";
import { Package, LayoutGrid, Settings, LogOut, X, Moon, Sun, Tags, Box, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => setMounted(true), []);

  const toggleDarkMode = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = () => {
    // Dummy logout for now
    router.push("/");
  };

  const navItems = [
    { name: "Inventory", path: "/dashboard", icon: LayoutGrid },
    { name: "Produk", path: "/dashboard/produk", icon: Box },
    { name: "Kategori", path: "/dashboard/kategori", icon: Tags },
  ];

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden transition-colors duration-200">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Global Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex md:flex-col flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-zinc-200 dark:border-zinc-800 justify-between">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="bg-teal-500 text-white p-1.5 rounded-md">
              <Package size={20} />
            </div>
            <span>TB. Sumber Jaya</span>
          </div>
          <button
            className="md:hidden p-1 rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${
                  isActive
                    ? "bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={toggleDarkMode}
            className="flex w-full items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-zinc-200 dark:border-zinc-800 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            {mounted && theme === "dark" ? (
              <>
                <Sun size={16} />
                Mode Terang
              </>
            ) : (
              <>
                <Moon size={16} />
                Mode Gelap
              </>
            )}
          </button>
          <button 
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 px-4 py-2 mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white rounded-md transition-colors"
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Action Bar (Global for Dashboard) */}
        <header className="h-16 flex shrink-0 items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm">
          <div className="flex items-center gap-4 flex-1">
            <button
              className="md:hidden p-2 -ml-2 rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="font-medium text-lg hidden sm:block text-zinc-800 dark:text-zinc-200">
              Admin Panel
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-zinc-50 dark:bg-zinc-950">
          {children}
        </div>
      </main>
    </div>
  );
}
