"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { Lock, Mail, Loader, ShieldAlert } from "lucide-react";

export default function AdminLoginPage() {
  const { admin, login, loading } = useAdminAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (!loading && admin) {
      router.replace("/admin/dashboard");
    }
  }, [admin, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!email || !password) {
      setError("Please fill in all fields.");
      setIsSubmitting(false);
      return;
    }

    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      router.replace("/admin/dashboard");
    } else {
      setError(result.error || "Invalid credentials or unauthorized.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 relative overflow-hidden select-none">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#dfd7cc]/30 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-neutral-200/80 p-8 rounded-2xl shadow-xl relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 mb-3">
            <Lock className="w-6 h-6 text-neutral-800" />
          </div>
          <h1 className="font-clashDisplay text-2xl font-bold tracking-widest text-neutral-900 uppercase">
            BACSTORY
          </h1>
          <p className="text-xs text-neutral-500 tracking-wider uppercase mt-1 font-semibold">
            Admin Management Portal
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-600" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-bold">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="w-4 h-4 text-neutral-400" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:border-[#a39889] focus:ring-1 focus:ring-[#dfd7cc]/50 rounded-xl py-3 pl-10 pr-4 outline-none text-sm transition-all duration-300 placeholder:text-neutral-400 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-bold">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-neutral-400" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:border-[#a39889] focus:ring-1 focus:ring-[#dfd7cc]/50 rounded-xl py-3 pl-10 pr-4 outline-none text-sm transition-all duration-300 placeholder:text-neutral-400 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-neutral-900 text-white hover:bg-neutral-800 font-bold text-sm tracking-wider uppercase py-3.5 rounded-xl transition-all duration-300 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
