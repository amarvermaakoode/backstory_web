"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useUserAuth } from "@/context/UserAuthContext";
import { mapProductItem } from "@/services/productService";
import { API_BASE_URL } from "@/lib/api";

const WishlistContext = createContext(undefined);

const areProductsEqual = (item, product) => {
    if (!item || !product) return false;
    
    // 1. Direct ID comparison
    if (item.id && product.id) return item.id === product.id;
    if (item._id && product._id) return item._id === product._id;
    
    // 2. Cross ID comparison
    if (item.id && product._id) return item.id === product._id;
    if (item._id && product.id) return item._id === product.id;
    
    // 3. Slug comparison
    if (item.slug && product.slug) return item.slug === product.slug;
    
    // 4. Name comparison (case-insensitive, trimmed) - only as a last resort if neither has any ID/slug
    if (!item.id && !item._id && !item.slug && !product.id && !product._id && !product.slug) {
        const name1 = item.name || item.title || "";
        const name2 = product.name || product.title || "";
        if (name1 && name2 && name1.toLowerCase().trim() === name2.toLowerCase().trim()) return true;
    }
    
    return false;
};

export function WishlistProvider({ children }) {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [isWishlistOpen, setIsWishlistOpen] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const { user, token } = useUserAuth();

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
                            setWishlistItems(data.wishlist.map(mapProductItem));
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
                            setWishlistItems(data.wishlist.map(mapProductItem));
                        }
                    }
                } catch (error) {
                    console.error("Failed to sync/load wishlist with backend:", error);
                }
            } else {
                // Logged out: restore from localStorage
                try {
                    const savedWishlist = localStorage.getItem("bacstory_wishlist");
                    if (savedWishlist) {
                        setWishlistItems(JSON.parse(savedWishlist));
                    } else {
                        setWishlistItems([]);
                    }
                } catch (error) {
                    console.error("Failed to load wishlist from localStorage:", error);
                }
            }
            setIsInitialized(true);
        };

        syncAndLoadWishlist();
    }, [user, token]);

    // Save wishlist to localStorage whenever it changes (only for guest)
    useEffect(() => {
        if (!isInitialized || user) return;
        try {
            localStorage.setItem("bacstory_wishlist", JSON.stringify(wishlistItems));
        } catch (error) {
            console.error("Failed to save wishlist to localStorage:", error);
        }
    }, [wishlistItems, isInitialized, user]);

    const wishlistCount = wishlistItems.length;

    const addToWishlist = async (product) => {
        if (user) {
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
        } else {
            setWishlistItems((prevItems) => {
                if (prevItems.some((item) => areProductsEqual(item, product))) {
                    return prevItems; // already exists
                }
                return [...prevItems, product];
            });
        }
    };

    const removeFromWishlist = async (productOrId) => {
        if (user) {
            try {
                const productId = typeof productOrId === "object" && productOrId !== null
                    ? (productOrId.id || productOrId._id)
                    : productOrId;

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
                console.error("Failed to remove from database wishlist:", error);
            }
        } else {
            setWishlistItems((prevItems) => {
                return prevItems.filter((item) => {
                    if (typeof productOrId === "object" && productOrId !== null) {
                        return !areProductsEqual(item, productOrId);
                    } else {
                        const isMatch = item.id === productOrId || 
                                        item._id === productOrId || 
                                        item.slug === productOrId ||
                                        (item.name && item.name.toLowerCase().trim() === productOrId.toLowerCase().trim()) ||
                                        (item.title && item.title.toLowerCase().trim() === productOrId.toLowerCase().trim());
                        return !isMatch;
                    }
                });
            });
        }
    };

    const toggleWishlist = async (product) => {
        if (user) {
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
        } else {
            setWishlistItems((prevItems) => {
                const exists = prevItems.some((item) => areProductsEqual(item, product));
                if (exists) {
                    return prevItems.filter((item) => !areProductsEqual(item, product));
                }
                return [...prevItems, product];
            });
        }
    };

    const isInWishlist = (productOrId) => {
        if (!productOrId) return false;
        return wishlistItems.some((item) => {
            if (typeof productOrId === "object" && productOrId !== null) {
                return areProductsEqual(item, productOrId);
            } else {
                if (item.id === productOrId || item._id === productOrId || item.slug === productOrId) {
                    return true;
                }
                // Only compare by name if the item in wishlist has no ID/slug
                if (!item.id && !item._id && !item.slug) {
                    return (item.name && item.name.toLowerCase().trim() === productOrId.toLowerCase().trim()) ||
                           (item.title && item.title.toLowerCase().trim() === productOrId.toLowerCase().trim());
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
