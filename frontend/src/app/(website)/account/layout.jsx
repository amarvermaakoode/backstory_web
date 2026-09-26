"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useUserAuth } from "@/context/UserAuthContext";
import { useToast } from "@/context/ToastContext";
import {
    User,
    Package,
    Heart,
    Tag,
    Scan,
    Headphones,
    ChevronLeft,
    LogOut,
} from "lucide-react";

export default function AccountLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const { logout, user, loading } = useUserAuth();
    const { showToast } = useToast();

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [loading, user, router]);

    const handleLogout = () => {
        showToast("Logged out successfully.", "info");
        logout();
    };

    // Determine subTab or section based on pathname
    const isRootAccount = pathname === "/account";
    const [mobileView, setMobileView] = useState(isRootAccount ? "menu" : "content");

    useEffect(() => {
        if (!isRootAccount) {
            setMobileView("content");
        }
    }, [pathname, isRootAccount]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
                <div className="w-7 h-7 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const getBreadcrumbTitle = () => {
        if (pathname.includes("/orders")) return "Orders";
        if (pathname.includes("/wishlist")) return "Wishlist";
        if (pathname.includes("/coupons")) return "Coupons";
        if (pathname.includes("/qr-identity")) return "QR Identity";
        if (pathname.includes("/support")) return "Support";
        return "Account";
    };

    const isActive = (path) => {
        if (path === "/account") return pathname === "/account";
        return pathname.startsWith(path);
    };

    const navItems = [
        { label: "Account", href: "/account", icon: User },
        { label: "Orders", href: "/account/orders", icon: Package },
        { label: "Wishlist", href: "/account/wishlist", icon: Heart },
        { label: "Coupons", href: "/account/coupons", icon: Tag },
        { label: "QR Identity", href: "/account/qr-identity", icon: Scan },
        { label: "Support", href: "/account/support", icon: Headphones },
    ];

    return (
        <div className="min-h-screen bg-[#F5F5F7] text-neutral-900 selection:bg-neutral-200 flex flex-col justify-between">
            <Navbar light={true} />

            <div className="pt-24 pb-16 flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Dynamic Breadcrumbs */}
                    <div className="text-xs sm:text-sm text-neutral-500 font-normal mb-6 sm:mb-8 flex items-center gap-1.5">
                        <Link href="/" className="hover:text-neutral-900 transition-colors">
                            Home
                        </Link>
                        <span>/</span>
                        <span className="font-semibold text-neutral-900">{getBreadcrumbTitle()}</span>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
                        {/* Left Sidebar Navigation Card */}
                        <aside
                            className={`${
                                mobileView === "content" ? "hidden lg:block" : "block"
                            } w-full lg:w-72 shrink-0 bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200/60 shadow-xs lg:sticky lg:top-24 self-start`}
                        >
                            <nav className="space-y-1.5">
                                {navItems.map((item) => {
                                    const IconComponent = item.icon;
                                    const active = isActive(item.href);

                                    return (
                                        <div key={item.href}>
                                            <Link
                                                href={item.href}
                                                onClick={() => setMobileView("content")}
                                                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
                                                    active
                                                        ? "bg-[#F4F4F5] text-neutral-900"
                                                        : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                                                }`}
                                            >
                                                <IconComponent className="w-4.5 h-4.5 stroke-[1.6]" />
                                                <span>{item.label}</span>
                                            </Link>
                                        </div>
                                    );
                                })}

                                <div className="pt-2 mt-2 border-t border-neutral-100">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold text-neutral-600 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer"
                                    >
                                        <LogOut className="w-4.5 h-4.5 stroke-[1.6]" />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </nav>
                        </aside>

                        {/* Right Main Content View */}
                        <main
                            className={`${
                                mobileView === "menu" ? "hidden lg:block" : "block"
                            } flex-1 w-full bg-white rounded-3xl p-6 sm:p-10 border border-neutral-200/60 shadow-xs space-y-10 sm:space-y-12`}
                        >
                            {/* Mobile Back Button */}
                            <div className="lg:hidden pb-4 border-b border-neutral-100">
                                <button
                                    onClick={() => {
                                        setMobileView("menu");
                                        router.push("/account");
                                    }}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
                                >
                                    <ChevronLeft className="w-4 h-4 stroke-[2]" />
                                    <span>Back to Account Menu</span>
                                </button>
                            </div>

                            {children}
                        </main>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
