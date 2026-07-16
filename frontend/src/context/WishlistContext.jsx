"use client";

import { createContext, useContext, useState, useEffect } from "react";

const WishlistContext = createContext(undefined);

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
            if (prevItems.some((item) => item.id === product.id)) {
                return prevItems; // already exists
            }
            return [...prevItems, product];
        });
    };

    const removeFromWishlist = (productId) => {
        setWishlistItems((prevItems) => prevItems.filter((item) => item.id !== productId));
    };

    const toggleWishlist = (product) => {
        setWishlistItems((prevItems) => {
            const exists = prevItems.some((item) => item.id === product.id);
            if (exists) {
                return prevItems.filter((item) => item.id !== product.id);
            }
            return [...prevItems, product];
        });
    };

    const isInWishlist = (productId) => {
        return wishlistItems.some((item) => item.id === productId);
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
