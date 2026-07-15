"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  LayoutDashboard,
  Tag,
  Layers,
  FolderTree,
  LogOut,
  X,
  Menu
} from "lucide-react";

export default function AdminSidebar({ sidebarOpen, setSidebarOpen }) {
  const { admin, logout } = useAdminAuth();
  const pathname = usePathname();

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

  if (!admin) return null;

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-[18%] bg-white border-r border-neutral-200 transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex md:flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-neutral-100">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <img src="/images/logo-dark.svg" alt="Bacstory Logo" className="h-[5vh] w-auto" />
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${isActive
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
  );
}
