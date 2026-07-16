"use client";

import { createContext, useContext, useState, useEffect } from "react";

const WishlistContext = createContext(undefined);

const areProductsEqual = (item, product) => {
    if (!item || !product) return false;
    
    // 1. Direct ID comparison
    if (item.id && product.id && item.id === product.id) return true;
    if (item._id && product._id && item._id === product._id) return true;
    
    // 2. Cross ID comparison
    if (item.id && product._id && item.id === product._id) return true;
    if (item._id && product.id && item._id === product.id) return true;
    
    // 3. Slug comparison
    if (item.slug && product.slug && item.slug === product.slug) return true;
    
    // 4. Name comparison (case-insensitive, trimmed)
    const name1 = item.name || item.title || "";
    const name2 = product.name || product.title || "";
    if (name1 && name2 && name1.toLowerCase().trim() === name2.toLowerCase().trim()) return true;
    
    return false;
};

export function WishlistProvider({ children }) {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [isWishlistOpen, setIsWishlistOpen] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load wishlist from localStorage on mount
    useEffect(() => {
        try {
            const savedWishlist = localStorage.getItem("bacstory_wishlist");
            if (savedWishlist) {
                setWishlistItems(JSON.parse(savedWishlist));
            }
        } catch (error) {
            console.error("Failed to load wishlist from localStorage:", error);
        }
        setIsInitialized(true);
    }, []);

    // Save wishlist to localStorage whenever it changes
    useEffect(() => {
        if (!isInitialized) return;
        try {
            localStorage.setItem("bacstory_wishlist", JSON.stringify(wishlistItems));
        } catch (error) {
            console.error("Failed to save wishlist to localStorage:", error);
        }
    }, [wishlistItems, isInitialized]);

    const wishlistCount = wishlistItems.length;

    const addToWishlist = (product) => {
        setWishlistItems((prevItems) => {
            if (prevItems.some((item) => areProductsEqual(item, product))) {
                return prevItems; // already exists
            }
            return [...prevItems, product];
        });
    };

    const removeFromWishlist = (productOrId) => {
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
    };

    const toggleWishlist = (product) => {
        setWishlistItems((prevItems) => {
            const exists = prevItems.some((item) => areProductsEqual(item, product));
            if (exists) {
                return prevItems.filter((item) => !areProductsEqual(item, product));
            }
            return [...prevItems, product];
        });
    };

    const isInWishlist = (productOrId) => {
        if (!productOrId) return false;
        return wishlistItems.some((item) => {
            if (typeof productOrId === "object" && productOrId !== null) {
                return areProductsEqual(item, productOrId);
            } else {
                return item.id === productOrId || 
                       item._id === productOrId || 
                       item.slug === productOrId ||
                       (item.name && item.name.toLowerCase().trim() === productOrId.toLowerCase().trim()) ||
                       (item.title && item.title.toLowerCase().trim() === productOrId.toLowerCase().trim());
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
