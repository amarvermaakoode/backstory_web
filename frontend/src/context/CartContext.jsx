"use client";

import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(undefined);

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load cart from localStorage on mount
    useEffect(() => {
        try {
            const savedCart = localStorage.getItem("bacstory_cart");
            if (savedCart) {
                setCartItems(JSON.parse(savedCart));
            }
        } catch (error) {
            console.error("Failed to load cart from localStorage:", error);
        }
        setIsInitialized(true);
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (!isInitialized) return;
        try {
            localStorage.setItem("bacstory_cart", JSON.stringify(cartItems));
        } catch (error) {
            console.error("Failed to save cart to localStorage:", error);
        }
    }, [cartItems, isInitialized]);

    // Calculate totals
    const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
    const cartSubtotal = cartItems.reduce((total, item) => total + (item.priceNum * item.quantity), 0);

    const addToCart = (product, quantity = 1, size = null, color = null) => {
        // Use default size/color if not provided
        const selectedSize = size || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : "M");
        const selectedColor = color || (product.colors && product.colors.length > 0 ? product.colors[0] : { name: "Default", hex: "#000000" });

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
                    quantity: quantity
                }
            ];
        });

        // Open cart drawer immediately to give feedback
        setIsCartOpen(true);
    };

    const removeFromCart = (cartItemId) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.id !== cartItemId));
    };

    const updateQuantity = (cartItemId, newQuantity) => {
        if (newQuantity < 1) return;
        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.id === cartItemId ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    const clearCart = () => {
        setCartItems([]);
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
