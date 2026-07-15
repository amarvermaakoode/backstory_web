"use client";

import React, { useState, useEffect } from "react";
import { AdminAuthProvider, useAdminAuth } from "@/context/AdminAuthContext";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Tag, 
  Layers, 
  FolderTree, 
  LogOut, 
  Menu, 
  X, 
  User,
  ShieldCheck
} from "lucide-react";

function AdminLayoutShell({ children }) {
  const { admin, loading, logout } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!loading && !admin && !isLoginPage) {
      router.replace("/admin/login");
    }
  }, [admin, loading, isLoginPage, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center text-neutral-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-neutral-800"></div>
      </div>
    );
  }

  // If on login page, just render the children without sidebar/header
  if (isLoginPage) {
    return <>{children}</>;
  }

  // If not logged in and not on login page, show loading while redirecting
  if (!admin) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center text-neutral-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-neutral-800"></div>
      </div>
    );
  }

  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      name: "Categories",
      path: "/admin/categories",
      icon: <Tag className="w-5 h-5" />,
    },
    {
      name: "Sub-Categories",
      path: "/admin/sub-categories",
      icon: <FolderTree className="w-5 h-5" />,
    },
    {
      name: "Collections",
      path: "/admin/collections",
      icon: <Layers className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 flex select-none">
      
      {/* Sidebar for Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex md:flex-col ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-neutral-100">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-neutral-800" />
            <span className="font-clashDisplay tracking-widest text-neutral-900 font-semibold">
              BACSTORY
            </span>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="text-neutral-500 hover:text-neutral-900 md:hidden"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.name}
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${
                  isActive
                    ? "bg-[#dfd7cc] text-black shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-3 px-2 py-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-neutral-200 border border-neutral-300 flex items-center justify-center text-xs font-semibold text-neutral-700">
              {admin.name ? admin.name.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-neutral-800 truncate">{admin.name}</p>
              <p className="text-xs text-neutral-500 truncate">{admin.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-neutral-200/80 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-neutral-600 hover:text-neutral-900 md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="font-clashDisplay text-lg font-semibold tracking-wide text-neutral-800">
              {menuItems.find((item) => pathname === item.path)?.name || "Admin Panel"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-neutral-500 border border-neutral-200 rounded-full px-4 py-1.5 bg-neutral-50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs uppercase tracking-wider font-semibold text-neutral-500">Admin Session</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}
    </div>
  );
}

export default function AdminLayout({ children }) {
  return (
    <AdminAuthProvider>
      <AdminLayoutShell>{children}</AdminLayoutShell>
    </AdminAuthProvider>
  );
}
