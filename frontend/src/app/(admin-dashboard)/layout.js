"use client";

import { useState, useEffect } from "react";
import { AdminAuthProvider, useAdminAuth } from "@/context/AdminAuthContext";
import { usePathname, useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { 
  Menu, 
  Palette, 
  Ruler, 
  ShoppingBag
} from "lucide-react";

function AdminLayoutShell({ children }) {
  const { admin, loading } = useAdminAuth();
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
    { name: "Dashboard", path: "/admin/dashboard" },
    {
      name: "Products",
      path: "/admin/products",
      icon: <ShoppingBag className="w-5 h-5" />,
    },
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
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 flex select-none">

      {/* Sidebar Component */}
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

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
