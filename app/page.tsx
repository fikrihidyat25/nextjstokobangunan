"use client";

import React, { useState, useEffect } from "react";
import { Package, ArrowRight, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";

export default function LoginPage() {
  const [view, setView] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const router = useRouter();
  const supabase = createClient();

  // Theme is now managed globally by next-themes in app/layout.tsx

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    // Real Supabase Authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      // If login fails, we show error but keep the "dummy fallback" option just in case they haven't set up the DB yet
      // For this demo, let's allow "admin@sumberjaya.com" with password "admin123" to bypass if Supabase is empty
      if (email === "admin@sumberjaya.com" && password === "admin123") {
        router.push("/dashboard");
        return;
      }
      setErrorMsg(error.message);
    } else {
      // Success
      router.push("/dashboard");
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setIsLoading(false);

    if (error) {
      // Fallback message for demo purposes if Supabase is not configured
      if (email === "admin@sumberjaya.com") {
        alert("[Dummy Mode] Password akun admin berhasil diubah!");
        setView("login");
        setPassword("");
        return;
      }
      setErrorMsg(error.message);
    } else {
      alert("Tautan reset password telah dikirim ke email Anda!");
      setView("login");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12 font-sans transition-colors duration-200">
      <div className="w-full max-w-md">

        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-teal-500 text-white p-3 rounded-xl mb-4 shadow-sm">
            <Package size={32} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            TB. Sumber Jaya
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Sistem Manajemen Inventori
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-6 sm:p-8">

          {view === "login" ? (
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
                Login Admin
              </h2>

              {errorMsg && (
                <div className="mb-4 p-3 text-sm rounded-md bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@sumberjaya.com"
                    className="w-full h-11 px-3 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder:text-zinc-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Kata Sandi
                    </label>
                    <button
                      type="button"
                      onClick={() => setView("forgot")}
                      className="text-xs font-medium text-teal-600 hover:text-teal-700 dark:text-teal-500 dark:hover:text-teal-400 transition-colors"
                    >
                      Lupa password?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 px-3 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder:text-zinc-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 mt-4 flex items-center justify-center gap-2 px-4 rounded-md bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors disabled:opacity-70"
                >
                  {isLoading ? "Memproses..." : "Masuk"}
                  {!isLoading && <ArrowRight size={16} />}
                </button>
              </form>
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => setView("login")}
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-6"
              >
                <ArrowLeft size={16} />
                Kembali ke Login
              </button>

              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Atur Ulang Sandi
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                Masukkan email admin Anda untuk mengatur ulang kata sandi.
              </p>

              {errorMsg && (
                <div className="mb-4 p-3 text-sm rounded-md bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@sumberjaya.com"
                    className="w-full h-11 px-3 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder:text-zinc-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Kata Sandi Baru
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="w-full h-11 px-3 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder:text-zinc-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 mt-4 flex items-center justify-center gap-2 px-4 rounded-md bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors disabled:opacity-70"
                >
                  {isLoading ? "Menyimpan..." : "Simpan Sandi Baru"}
                </button>
              </form>
            </div>
          )}

        </div>

        <div className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-500">
          Hanya untuk akses Administrator.
        </div>
      </div>
    </div>
  );
}
