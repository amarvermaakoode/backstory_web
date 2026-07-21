"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useUserAuth } from "@/context/UserAuthContext";
import { API_BASE_URL } from "@/lib/api";

const CartContext = createContext(undefined);

const mapCartItem = (dbItem) => {
    const product = dbItem.product;
    if (!product) return null;

    const colorsList = (product.colors || []).map(c => ({
        name: c.color?.name || "Default",
        hex: c.color?.hexCode || "#CCCCCC"
    }));
    const sizesList = product.sizeGuide?.chart?.map(sz => sz.size) || ["S", "M", "L"];
    const mainImg = product.colors?.[0]?.images?.[0] || "";

    const uniqueId = `${product._id}-${dbItem.size}-${dbItem.color.name}`;

    return {
        id: uniqueId,
        productId: product._id,
        name: product.title,
        price: `Rs ${product.price}`,
        priceNum: Number(product.price),
        image: mainImg,
        tag: product.subCategory?.name || product.category?.Name || "Product",
        size: dbItem.size,
        color: {
            name: dbItem.color.name,
            hex: dbItem.color.hex
        },
        quantity: dbItem.quantity,
        sizes: sizesList,
        colors: colorsList
    };
};

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const { user, token } = useUserAuth();

    // Load and sync cart when user logs in/changes
    useEffect(() => {
        const syncAndLoadCart = async () => {
            if (user) {
                try {
                    const localSaved = localStorage.getItem("bacstory_cart");
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

                    if (localItems.length > 0) {
                        // Merge local cart to database
                        const res = await fetch(`${API_BASE_URL}/frontend/cart/sync`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${activeToken}`
                            },
                            body: JSON.stringify({ cartItems: localItems })
                        });
                        const data = await res.json();
                        if (data.success && Array.isArray(data.cart)) {
                            setCartItems(data.cart.map(mapCartItem).filter(Boolean));
                            // Clear local storage cart once synchronized
                            localStorage.removeItem("bacstory_cart");
                        }
                    } else {
                        // Fetch cart from database
                        const res = await fetch(`${API_BASE_URL}/frontend/cart`, {
                            headers: {
                                "Authorization": `Bearer ${activeToken}`
                            }
                        });
                        const data = await res.json();
                        if (data.success && Array.isArray(data.cart)) {
                            setCartItems(data.cart.map(mapCartItem).filter(Boolean));
                        }
                    }
                } catch (error) {
                    console.error("Failed to sync/load cart with backend:", error);
                }
            } else {
                // Restore guest cart from local storage
                try {
                    const savedCart = localStorage.getItem("bacstory_cart");
                    if (savedCart) {
                        setCartItems(JSON.parse(savedCart));
                    } else {
                        setCartItems([]);
                    }
                } catch (error) {
                    console.error("Failed to load cart from localStorage:", error);
                }
            }
            setIsInitialized(true);
        };

        syncAndLoadCart();
    }, [user, token]);

    // Save cart to localStorage whenever it changes (only for guest)
    useEffect(() => {
        if (!isInitialized || user) return;
        try {
            localStorage.setItem("bacstory_cart", JSON.stringify(cartItems));
        } catch (error) {
            console.error("Failed to save cart to localStorage:", error);
        }
    }, [cartItems, isInitialized, user]);

    // Calculate totals
    const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
    const cartSubtotal = cartItems.reduce((total, item) => total + (item.priceNum * item.quantity), 0);

    const addToCart = async (product, quantity = 1, size = null, color = null) => {
        const selectedSize = size || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : "M");
        const selectedColor = color || (product.colors && product.colors.length > 0 ? product.colors[0] : { name: "Default", hex: "#000000" });

        if (user) {
            try {
                const activeToken = token || localStorage.getItem("userToken");
                const res = await fetch(`${API_BASE_URL}/frontend/cart/add`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${activeToken}`
                    },
                    body: JSON.stringify({
                        productId: product.id || product._id,
                        quantity,
                        size: selectedSize,
                        color: {
                            name: selectedColor.name,
                            hex: selectedColor.hex
                        }
                    })
                });
                const data = await res.json();
                if (data.success && Array.isArray(data.cart)) {
                    setCartItems(data.cart.map(mapCartItem).filter(Boolean));
                }
            } catch (error) {
                console.error("Failed to add item to database cart:", error);
            }
        } else {
            setCartItems((prevItems) => {
                const uniqueId = `${product.id}-${selectedSize}-${selectedColor.name}`;
                const existingItem = prevItems.find((item) => item.id === uniqueId);

                if (existingItem) {
                    return prevItems.map((item) =>
                        item.id === uniqueId
                            ? { ...item, quantity: item.quantity + quantity }
                            : item
                    );
                }

                return [
                    ...prevItems,
                    {
                        id: uniqueId,
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        priceNum: product.priceNum,
                        image: product.image,
                        tag: product.tag,
                        size: selectedSize,
                        color: selectedColor,
                        quantity: quantity,
                        sizes: product.sizes || [selectedSize],
                        colors: product.colors || [selectedColor]
                    }
                ];
            });
        }

        // Open cart drawer immediately to give feedback
        setIsCartOpen(true);
    };

    const removeFromCart = async (cartItemId) => {
        if (user) {
            try {
                const item = cartItems.find((i) => i.id === cartItemId);
                if (!item) return;

                const activeToken = token || localStorage.getItem("userToken");
                const res = await fetch(`${API_BASE_URL}/frontend/cart/remove`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${activeToken}`
                    },
                    body: JSON.stringify({
                        productId: item.productId,
                        size: item.size,
                        colorName: item.color.name
                    })
                });
                const data = await res.json();
                if (data.success && Array.isArray(data.cart)) {
                    setCartItems(data.cart.map(mapCartItem).filter(Boolean));
                }
            } catch (error) {
                console.error("Failed to remove item from database cart:", error);
            }
        } else {
            setCartItems((prevItems) => prevItems.filter((item) => item.id !== cartItemId));
        }
    };

    const updateQuantity = async (cartItemId, newQuantity) => {
        if (newQuantity < 1) return;

        if (user) {
            try {
                const item = cartItems.find((i) => i.id === cartItemId);
                if (!item) return;

                const activeToken = token || localStorage.getItem("userToken");
                const res = await fetch(`${API_BASE_URL}/frontend/cart/update-quantity`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${activeToken}`
                    },
                    body: JSON.stringify({
                        productId: item.productId,
                        size: item.size,
                        colorName: item.color.name,
                        quantity: newQuantity
                    })
                });
                const data = await res.json();
                if (data.success && Array.isArray(data.cart)) {
                    setCartItems(data.cart.map(mapCartItem).filter(Boolean));
                }
            } catch (error) {
                console.error("Failed to update database cart quantity:", error);
            }
        } else {
            setCartItems((prevItems) =>
                prevItems.map((item) =>
                    item.id === cartItemId ? { ...item, quantity: newQuantity } : item
                )
            );
        }
    };

    const clearCart = async () => {
        if (user) {
            try {
                const activeToken = token || localStorage.getItem("userToken");
                const res = await fetch(`${API_BASE_URL}/frontend/cart/clear`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${activeToken}`
                    }
                });
                const data = await res.json();
                if (data.success) {
                    setCartItems([]);
                }
            } catch (error) {
                console.error("Failed to clear database cart:", error);
            }
        } else {
            setCartItems([]);
        }
    };

    const openCart = () => setIsCartOpen(true);
    const closeCart = () => setIsCartOpen(false);

    return (
        <CartContext.Provider
            value={{
                cartItems,
                setCartItems,
                isCartOpen,
                cartCount,
                cartSubtotal,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                openCart,
                closeCart,
                setIsCartOpen
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
