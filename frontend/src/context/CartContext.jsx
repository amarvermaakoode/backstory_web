"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useUserAuth } from "@/context/UserAuthContext";
import { API_BASE_URL } from "@/lib/api";

const CartContext = createContext(undefined);

const sanitizeCartItem = (item) => {
    if (!item) return null;
    const pId = item.productId || item.id || item._id;
    const name = item.name || item.title || item.productName || "Product";
    
    let priceNum = 0;
    if (typeof item.priceNum === "number" && !isNaN(item.priceNum)) {
        priceNum = item.priceNum;
    } else if (typeof item.price === "number" && !isNaN(item.price)) {
        priceNum = item.price;
    } else if (item.price) {
        const parsed = Number(String(item.price).replace(/[^0-9.]/g, ""));
        if (!isNaN(parsed)) priceNum = parsed;
    }

    const price = item.price && String(item.price).startsWith("Rs") ? item.price : `Rs ${priceNum}`;

    let image = item.image;
    if (!image || typeof image !== "string") {
        if (Array.isArray(item.images) && item.images[0]) {
            image = item.images[0];
        } else if (Array.isArray(item.colors) && item.colors[0]) {
            const matchedColor = item.colors.find(c => (c.name || c.color?.name) === item.color?.name);
            image = matchedColor?.images?.[0] || item.colors[0]?.images?.[0] || "";
        } else {
            image = "";
        }
    }

    const colorName = item.color?.name || item.colorName || "Default";
    const colorHex = item.color?.hex || item.colorHex || "#000000";
    const size = item.size || "M";
    const uniqueId = (item.id && !item.id.includes("undefined")) 
        ? item.id 
        : `${pId}-${size}-${colorName}`;

    return {
        ...item,
        id: uniqueId,
        productId: pId,
        name,
        price,
        priceNum,
        image,
        size,
        color: { name: colorName, hex: colorHex },
        quantity: Number(item.quantity) || 1
    };
};

const mapCartItem = (dbItem) => {
    if (!dbItem) return null;
    const product = dbItem.product;
    if (!product) return null;

    const colorsList = (product.colors || []).map(c => ({
        name: c.color?.name || c.name || "Default",
        hex: c.color?.hexCode || c.hex || "#CCCCCC"
    }));
    const sizesList = product.sizeGuide?.chart?.map(sz => sz.size) || product.sizes || ["S", "M", "L"];

    const targetColorName = (dbItem.color?.name || "").toLowerCase().trim();
    const matchingColorObj = (product.colors || []).find(c => {
        const cName = (c.color?.name || c.name || "").toLowerCase().trim();
        return cName === targetColorName;
    });
    const firstColorWithImg = (product.colors || []).find(c => Array.isArray(c.images) && c.images.length > 0 && c.images[0]);
    const mainImg = matchingColorObj?.images?.[0] || firstColorWithImg?.images?.[0] || product.colors?.[0]?.images?.[0] || product.image || (Array.isArray(product.images) ? product.images[0] : "") || "";

    const pId = product._id || product.id;
    const name = product.title || product.name || "Product";
    const rawPrice = product.price ?? product.priceNum;
    const priceNum = typeof rawPrice === "number" && !isNaN(rawPrice)
        ? rawPrice 
        : Number(String(rawPrice || "").replace(/[^0-9.]/g, "")) || 0;
    const priceStr = `Rs ${priceNum}`;

    const colorName = dbItem.color?.name || "Default";
    const colorHex = dbItem.color?.hex || "#000000";
    const size = dbItem.size || "M";
    const uniqueId = `${pId}-${size}-${colorName}`;

    return sanitizeCartItem({
        id: uniqueId,
        productId: pId,
        name: name,
        price: priceStr,
        priceNum: priceNum,
        image: mainImg,
        tag: product.subCategory?.name || product.category?.Name || product.tag || "Product",
        size: size,
        color: {
            name: colorName,
            hex: colorHex
        },
        quantity: dbItem.quantity,
        sizes: sizesList,
        colors: colorsList
    });
};

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState(null);
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
                        const parsed = JSON.parse(savedCart);
                        if (Array.isArray(parsed)) {
                            setCartItems(parsed.map(sanitizeCartItem).filter(Boolean));
                        }
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

    // Sync selectedItemIds whenever cartItems change
    useEffect(() => {
        if (!isInitialized) return;
        try {
            const savedSel = localStorage.getItem("bacstory_selected_cart_items");
            let savedArray = null;
            if (savedSel) {
                try {
                    savedArray = JSON.parse(savedSel);
                } catch (e) {
                    console.error(e);
                }
            }

            const allCartIds = cartItems.map(item => item.id);
            if (selectedItemIds === null) {
                if (Array.isArray(savedArray) && savedArray.length > 0) {
                    const validSaved = savedArray.filter(id => allCartIds.includes(id));
                    setSelectedItemIds(validSaved.length > 0 ? validSaved : allCartIds);
                } else {
                    setSelectedItemIds(allCartIds);
                }
            } else {
                const existingInCart = selectedItemIds.filter(id => allCartIds.includes(id));
                const newlyAddedIds = allCartIds.filter(id => !selectedItemIds.includes(id));
                setSelectedItemIds([...existingInCart, ...newlyAddedIds]);
            }
        } catch (error) {
            console.error("Error setting selected cart item IDs:", error);
        }
    }, [cartItems, isInitialized]);

    // Save selectedItemIds to localStorage
    useEffect(() => {
        if (selectedItemIds !== null) {
            try {
                localStorage.setItem("bacstory_selected_cart_items", JSON.stringify(selectedItemIds));
            } catch (e) {
                console.error("Failed to save selected cart items to localStorage:", error);
            }
        }
    }, [selectedItemIds]);

    const activeSelectedIds = selectedItemIds !== null ? selectedItemIds : cartItems.map(i => i.id);

    // Calculate selected items & totals
    const selectedCartItems = cartItems.filter(item => activeSelectedIds.includes(item.id));
    const selectedCount = selectedCartItems.reduce((total, item) => total + (item.quantity || 1), 0);
    const selectedSubtotal = selectedCartItems.reduce((total, item) => {
        const priceNum = typeof item.priceNum === "number" && !isNaN(item.priceNum)
            ? item.priceNum
            : Number(String(item.price || "").replace(/[^0-9.]/g, "")) || 0;
        return total + (priceNum * (item.quantity || 1));
    }, 0);

    const toggleSelectItem = (id) => {
        setSelectedItemIds(prev => {
            const current = prev !== null ? prev : cartItems.map(i => i.id);
            if (current.includes(id)) {
                return current.filter(itemId => itemId !== id);
            } else {
                return [...current, id];
            }
        });
    };

    const toggleSelectAll = () => {
        const allItemIds = cartItems.map(item => item.id);
        const current = selectedItemIds !== null ? selectedItemIds : allItemIds;
        const allSelected = allItemIds.length > 0 && allItemIds.every(id => current.includes(id));

        if (allSelected) {
            setSelectedItemIds([]);
        } else {
            setSelectedItemIds(allItemIds);
        }
    };

    // Calculate totals
    const cartCount = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
    const cartSubtotal = cartItems.reduce((total, item) => {
        const priceNum = typeof item.priceNum === "number" && !isNaN(item.priceNum)
            ? item.priceNum
            : Number(String(item.price || "").replace(/[^0-9.]/g, "")) || 0;
        return total + (priceNum * (item.quantity || 1));
    }, 0);

    const addToCart = async (product, quantity = 1, size = null, color = null) => {
        const pId = product.id || product._id;
        const selectedSize = size || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : "M");
        const selectedColor = color || (product.colors && product.colors.length > 0
            ? { 
                name: product.colors[0].name || product.colors[0].color?.name || "Default", 
                hex: product.colors[0].hex || product.colors[0].color?.hexCode || "#000000" 
              }
            : { name: "Default", hex: "#000000" });

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
                        productId: pId,
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
                const name = product.name || product.title || "Product";
                let priceNum = 0;
                if (typeof product.priceNum === "number" && !isNaN(product.priceNum)) {
                    priceNum = product.priceNum;
                } else if (typeof product.price === "number" && !isNaN(product.price)) {
                    priceNum = product.price;
                } else if (product.price) {
                    const parsed = Number(String(product.price).replace(/[^0-9.]/g, ""));
                    if (!isNaN(parsed)) priceNum = parsed;
                }

                let image = product.image;
                if (!image || typeof image !== "string") {
                    if (Array.isArray(product.images) && product.images[0]) {
                        image = product.images[0];
                    } else if (Array.isArray(product.colors) && product.colors[0]) {
                        const matchedColor = product.colors.find(c => (c.name || c.color?.name) === selectedColor.name);
                        image = matchedColor?.images?.[0] || product.colors[0]?.images?.[0] || "";
                    } else {
                        image = "";
                    }
                }

                const uniqueId = `${pId}-${selectedSize}-${selectedColor.name}`;
                const existingIndex = prevItems.findIndex(
                    (item) => item.id === uniqueId || (item.productId === pId && item.size === selectedSize && item.color?.name === selectedColor.name)
                );

                if (existingIndex > -1) {
                    return prevItems.map((item, idx) =>
                        idx === existingIndex
                            ? sanitizeCartItem({ ...item, quantity: (item.quantity || 1) + quantity })
                            : sanitizeCartItem(item)
                    );
                }

                const newItem = sanitizeCartItem({
                    id: uniqueId,
                    productId: pId,
                    name: name,
                    price: `Rs ${priceNum}`,
                    priceNum: priceNum,
                    image: image,
                    tag: product.tag || product.categoryName || product.subCategoryName || "Product",
                    size: selectedSize,
                    color: selectedColor,
                    quantity: quantity,
                    sizes: product.sizes || [selectedSize],
                    colors: product.colors || [selectedColor]
                });

                return [...prevItems.map(sanitizeCartItem).filter(Boolean), newItem];
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
                    item.id === cartItemId ? sanitizeCartItem({ ...item, quantity: newQuantity }) : sanitizeCartItem(item)
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
                selectedItemIds,
                setSelectedItemIds,
                selectedCartItems,
                selectedCount,
                selectedSubtotal,
                toggleSelectItem,
                toggleSelectAll,
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

