"use client";

import { useState, useEffect } from "react";
import { AdminAuthProvider, useAdminAuth } from "@/context/AdminAuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { usePathname, useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  Menu,
  Palette,
  Ruler,
  ShoppingBag,
  Percent,
  Truck,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";

function AdminLayoutShell({ children }) {
  const { admin, loading } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    { name: "Dashboard", path: "/admin/dashboard" },
    {
      name: "Products",
      path: "/admin/products",
      icon: <ShoppingBag className="w-5 h-5" />,
    },
    { name: "QR Codes", path: "/admin/qr-codes" },
    { name: "Categories", path: "/admin/categories" },
    { name: "Sub-Categories", path: "/admin/sub-categories" },
    { name: "Collections", path: "/admin/collections" },
    {
      name: "Colors",
      path: "/admin/colors",
      icon: <Palette className="w-5 h-5" />,
    },
    {
      name: "Size Guides",
      path: "/admin/size-guides",
      icon: <Ruler className="w-5 h-5" />,
    },
    {
      name: "Promo Codes",
      path: "/admin/promo-codes",
      icon: <Percent className="w-5 h-5" />,
    },
    {
      name: "Shipping Rates",
      path: "/admin/shipping-rates",
      icon: <Truck className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 flex">

      {/* Sidebar Component */}
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">

        {/* Top Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-neutral-200/80 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-neutral-600 hover:text-neutral-900 md:hidden p-1 rounded-lg cursor-pointer"
              title="Open Sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="font-clashDisplay text-[4.4vw] md:text-[2.5vw] lg:text-[1.4vw] font-medium  text-neutral-800">
              {menuItems.find((item) => pathname === item.path)?.name || "Admin Panel"}
            </h2>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-[100%] w-full mx-auto">
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
      <ToastProvider>
        <AdminLayoutShell>{children}</AdminLayoutShell>
      </ToastProvider>
    </AdminAuthProvider>
  );
}
