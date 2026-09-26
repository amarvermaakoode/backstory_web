"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/context/UserAuthContext";
import { useToast } from "@/context/ToastContext";
import { mapProductItem } from "@/services/productService";
import { API_BASE_URL } from "@/lib/api";

const WishlistContext = createContext(undefined);

const areProductsEqual = (item, product) => {
    if (!item || !product) return false;

    // 1. ID comparison (direct, cross, or nested)
    const itemId = item.id || item._id || item.productId;
    const prodId = product.id || product._id || product.productId;

    if (itemId && prodId && String(itemId) === String(prodId)) {
        return true;
    }

    // 2. Slug comparison
    if (item.slug && product.slug && item.slug === product.slug) {
        return true;
    }

    // 3. Name comparison (case-insensitive, trimmed)
    const name1 = item.name || item.title || "";
    const name2 = product.name || product.title || "";
    if (name1 && name2 && name1.toLowerCase().trim() === name2.toLowerCase().trim()) {
        return true;
    }

    return false;
};

export function WishlistProvider({ children }) {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [isWishlistOpen, setIsWishlistOpen] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const { user, token } = useUserAuth();
    const { showToast } = useToast();
    const router = useRouter();

    // Load and sync wishlist when user logs in/changes
    useEffect(() => {
        const syncAndLoadWishlist = async () => {
            if (user) {
                try {
                    const localSaved = localStorage.getItem("bacstory_wishlist");
                    let localItems = [];
                    if (localSaved) {
                        try {
                            localItems = JSON.parse(localSaved);
                        } catch (e) {
                            console.error(e);
                        }
                    }

                    const activeToken = token || localStorage.getItem("userToken");
                    if (!activeToken) return;

                    let currentWishlist = [];

                    // If we have items in localStorage, sync them with backend
                    if (localItems.length > 0) {
                        const productIds = localItems.map(item => item.id || item._id).filter(Boolean);
                        const res = await fetch(`${API_BASE_URL}/frontend/wishlist/sync`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${activeToken}`
                            },
                            body: JSON.stringify({ productIds })
                        });
                        const data = await res.json();
                        if (data.success && Array.isArray(data.wishlist)) {
                            currentWishlist = data.wishlist.map(mapProductItem);
                            // Clear localStorage once merged
                            localStorage.removeItem("bacstory_wishlist");
                        }
                    } else {
                        // Just fetch the backend wishlist
                        const res = await fetch(`${API_BASE_URL}/frontend/wishlist`, {
                            headers: {
                                "Authorization": `Bearer ${activeToken}`
                            }
                        });
                        const data = await res.json();
                        if (data.success && Array.isArray(data.wishlist)) {
                            currentWishlist = data.wishlist.map(mapProductItem);
                        }
                    }

                    // Check for pending wishlist item queued before login
                    const pendingRaw = localStorage.getItem("bacstory_pending_wishlist");
                    if (pendingRaw) {
                        try {
                            const pendingProduct = JSON.parse(pendingRaw);
                            const productId = pendingProduct?.id || pendingProduct?._id;
                            if (productId) {
                                const exists = currentWishlist.some(item => areProductsEqual(item, pendingProduct));
                                if (!exists) {
                                    const toggleRes = await fetch(`${API_BASE_URL}/frontend/wishlist/toggle`, {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                            "Authorization": `Bearer ${activeToken}`
                                        },
                                        body: JSON.stringify({ productId })
                                    });
                                    const toggleData = await toggleRes.json();
                                    if (toggleData.success && Array.isArray(toggleData.wishlist)) {
                                        currentWishlist = toggleData.wishlist.map(mapProductItem);
                                    }
                                }
                                showToast("Item added to your wishlist!", "success");
                            }
                        } catch (e) {
                            console.error("Error processing pending wishlist item:", e);
                        } finally {
                            localStorage.removeItem("bacstory_pending_wishlist");
                        }
                    }

                    setWishlistItems(currentWishlist);
                } catch (error) {
                    console.error("Failed to sync/load wishlist with backend:", error);
                }
            } else {
                // Logged out: reset wishlist and remove any local saved items
                setWishlistItems([]);
                try {
                    localStorage.removeItem("bacstory_wishlist");
                } catch (error) {
                    console.error("Failed to clear guest wishlist from localStorage:", error);
                }
            }
            setIsInitialized(true);
        };

        syncAndLoadWishlist();
    }, [user, token]);

    const wishlistCount = wishlistItems.length;

    const addToWishlist = async (product) => {
        if (!user) {
            try {
                localStorage.setItem("bacstory_pending_wishlist", JSON.stringify(product));
            } catch (e) {
                console.error("Failed to store pending wishlist item:", e);
            }
            showToast("Please log in to add items to your wishlist.", "error");
            router.push("/login");
            return;
        }

        const exists = wishlistItems.some((item) => areProductsEqual(item, product));
        if (exists) return; // already exists
        try {
            const productId = product.id || product._id;
            const activeToken = token || localStorage.getItem("userToken");
            const res = await fetch(`${API_BASE_URL}/frontend/wishlist/toggle`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${activeToken}`
                },
                body: JSON.stringify({ productId })
            });
            const data = await res.json();
            if (data.success && Array.isArray(data.wishlist)) {
                setWishlistItems(data.wishlist.map(mapProductItem));
            }
        } catch (error) {
            console.error("Failed to add to database wishlist:", error);
        }
    };

    const removeFromWishlist = async (productOrId) => {
        if (!productOrId) return;

        const productId = typeof productOrId === "object" && productOrId !== null
            ? (productOrId.id || productOrId._id || productOrId.productId)
            : productOrId;

        // Optimistically remove from state so the UI reflects the change immediately
        setWishlistItems((prev) => prev.filter((item) => {
            if (typeof productOrId === "object" && productOrId !== null) {
                return !areProductsEqual(item, productOrId);
            }
            const targetId = String(productId);
            return (
                String(item.id || "") !== targetId &&
                String(item._id || "") !== targetId &&
                item.slug !== targetId
            );
        }));

        // Clean up guest local storage if present
        try {
            const localSaved = localStorage.getItem("bacstory_wishlist");
            if (localSaved) {
                const parsed = JSON.parse(localSaved);
                if (Array.isArray(parsed)) {
                    const filtered = parsed.filter((item) => {
                        if (typeof productOrId === "object" && productOrId !== null) {
                            return !areProductsEqual(item, productOrId);
                        }
                        const targetId = String(productId);
                        return (
                            String(item.id || "") !== targetId &&
                            String(item._id || "") !== targetId &&
                            item.slug !== targetId
                        );
                    });
                    localStorage.setItem("bacstory_wishlist", JSON.stringify(filtered));
                }
            }
        } catch (e) {
            console.error("Failed to update guest wishlist storage:", e);
        }

        if (!user || !productId) return;

        try {
            const activeToken = token || localStorage.getItem("userToken");
            const res = await fetch(`${API_BASE_URL}/frontend/wishlist/remove`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${activeToken}`
                },
                body: JSON.stringify({ productId })
            });
            const data = await res.json();
            if (data.success && Array.isArray(data.wishlist)) {
                setWishlistItems(data.wishlist.map(mapProductItem));
            }
        } catch (error) {
            console.error("Failed to remove from database wishlist:", error);
        }
    };

    const toggleWishlist = async (product) => {
        if (!user) {
            try {
                localStorage.setItem("bacstory_pending_wishlist", JSON.stringify(product));
            } catch (e) {
                console.error("Failed to store pending wishlist item:", e);
            }
            showToast("Please log in to add items to your wishlist.", "error");
            router.push("/login");
            return;
        }

        try {
            const productId = product.id || product._id;
            const activeToken = token || localStorage.getItem("userToken");
            const res = await fetch(`${API_BASE_URL}/frontend/wishlist/toggle`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${activeToken}`
                },
                body: JSON.stringify({ productId })
            });
            const data = await res.json();
            if (data.success && Array.isArray(data.wishlist)) {
                setWishlistItems(data.wishlist.map(mapProductItem));
            }
        } catch (error) {
            console.error("Failed to toggle wishlist in database:", error);
        }
    };

    const isInWishlist = (productOrId) => {
        if (!productOrId) return false;
        return wishlistItems.some((item) => {
            if (typeof productOrId === "object" && productOrId !== null) {
                return areProductsEqual(item, productOrId);
            } else {
                const targetId = String(productOrId);
                if (
                    (item.id && String(item.id) === targetId) ||
                    (item._id && String(item._id) === targetId) ||
                    (item.slug && item.slug === targetId)
                ) {
                    return true;
                }
                const name = item.name || item.title || "";
                if (name && name.toLowerCase().trim() === targetId.toLowerCase().trim()) {
                    return true;
                }
                return false;
            }
        });
    };

    const openWishlist = () => setIsWishlistOpen(true);
    const closeWishlist = () => setIsWishlistOpen(false);

    return (
        <WishlistContext.Provider
            value={{
                wishlistItems,
                isWishlistOpen,
                wishlistCount,
                addToWishlist,
                removeFromWishlist,
                toggleWishlist,
                isInWishlist,
                openWishlist,
                closeWishlist,
                setIsWishlistOpen
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error("useWishlist must be used within a WishlistProvider");
    }
    return context;
}
