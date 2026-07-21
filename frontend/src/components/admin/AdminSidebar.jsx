"use client";

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
  ShoppingBag,
  Palette,
  Ruler,
  Percent,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";

export default function AdminSidebar({ sidebarOpen, setSidebarOpen }) {
  const { admin, logout } = useAdminAuth();
  const pathname = usePathname();

  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
    },
    {
      name: "Products",
      path: "/admin/products",
      icon: <ShoppingBag className="w-5 h-5 shrink-0" />,
    },
    {
      name: "Categories",
      path: "/admin/categories",
      icon: <Tag className="w-5 h-5 shrink-0" />,
    },
    {
      name: "Sub-Categories",
      path: "/admin/sub-categories",
      icon: <FolderTree className="w-5 h-5 shrink-0" />,
    },
    {
      name: "Collections",
      path: "/admin/collections",
      icon: <Layers className="w-5 h-5 shrink-0" />,
    },
    {
      name: "Colors",
      path: "/admin/colors",
      icon: <Palette className="w-5 h-5 shrink-0" />,
    },
    {
      name: "Size Guides",
      path: "/admin/size-guides",
      icon: <Ruler className="w-5 h-5 shrink-0" />,
    },
    {
      name: "Promo Codes",
      path: "/admin/promo-codes",
      icon: <Percent className="w-5 h-5 shrink-0" />,
    },
  ];

  if (!admin) return null;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-neutral-200 transition-all duration-300 ease-in-out md:static md:flex md:flex-col ${sidebarOpen
          ? "lg:w-[18%] md:w-[22%] w-[70%] translate-x-0"
          : "md:w-20 -translate-x-full md:translate-x-0"
        }`}
    >
      {/* Sidebar Header */}
      <div className={`h-16 flex items-center border-b border-neutral-100 px-4 ${sidebarOpen ? "justify-between" : "justify-center"}`}>
        {sidebarOpen && (
          <Link href="/admin/dashboard" className="flex items-center gap-2 overflow-hidden">
            <img src="/images/logo-dark.svg" alt="Bacstory Logo" className="h-[4vh] max-h-9 w-auto object-contain" />
          </Link>
        )}

        {/* Sidebar Toggle Button (Inside Sidebar Header) */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-all cursor-pointer flex items-center justify-center"
          title={sidebarOpen ? "Collapse Sidebar" : "Open Sidebar"}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="w-5 h-5" />
          ) : (
            <PanelLeftOpen className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.name}
              href={item.path}
              title={!sidebarOpen ? item.name : undefined}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${sidebarOpen ? "justify-start" : "justify-center"
                } ${isActive
                  ? "bg-[#dfd7cc] text-black shadow-sm"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                }`}
            >
              {item.icon}
              {sidebarOpen && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-neutral-100 bg-neutral-50/50">
        <div className={`flex items-center gap-3 py-2 mb-1 ${sidebarOpen ? "px-2" : "justify-center"}`}>
          <div className="w-9 h-9 rounded-full bg-neutral-200 border border-neutral-300 flex items-center justify-center text-xs font-semibold text-neutral-700 shrink-0" title={admin.name}>
            {admin.name ? admin.name.charAt(0).toUpperCase() : "A"}
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-neutral-800 truncate">{admin.name}</p>
              <p className="text-xs text-neutral-500 truncate">{admin.email}</p>
            </div>
          )}
        </div>

        <button
          onClick={logout}
          title={!sidebarOpen ? "Sign Out" : undefined}
          className={`w-full flex items-center gap-3 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all duration-200 cursor-pointer ${sidebarOpen ? "px-4 justify-start" : "px-0 justify-center"
            }`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {sidebarOpen && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
