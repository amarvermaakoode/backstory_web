"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { Lock, Check, ShoppingBag, User, CheckCircle2, Loader2, AlertCircle, ArrowLeft, X, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useUserAuth } from "@/context/UserAuthContext";
import Button from "@/components/ui/Button";
import { getImageUrl, API_BASE_URL } from "@/lib/api";
import CountrySelect from "@/components/ui/CountrySelect";
import { COUNTRIES, getCountryByNameOrCode, getCountryCode, getCountryName, validatePhoneNumber, getPostalRule, validatePostalCode, validatePostalCodeFormat, verifyPostalCode, fetchPostalCodeDetails, fetchIndiaPincodeDetails } from "@/lib/countryPhoneValidation";

export default function CheckoutPage() {
    const { cartItems, cartSubtotal, cartCount, selectedCartItems, selectedSubtotal, selectedCount, removeFromCart, openCart, clearCart } = useCart();
    const { user, userFetch, refreshUser } = useUserAuth();

    const [useWallet, setUseWallet] = useState(false);
    const [selectedPaymentChoice, setSelectedPaymentChoice] = useState("online"); // "online" | "wallet"

    const [phoneError, setPhoneError] = useState("");
    const [contactEmailError, setContactEmailError] = useState("");

    // Delivery address selection & modal state
    const [isWritingAddress, setIsWritingAddress] = useState(false);
    const [isSelectAddressOpen, setIsSelectAddressOpen] = useState(false);
    const [selectedAddressId, setSelectedAddressId] = useState(null);

    // Modal for Add / Edit Address inside checkout
    const modalFormRef = useRef(null);
    const [isModalAddEditOpen, setIsModalAddEditOpen] = useState(false);
    const [modalEditAddressId, setModalEditAddressId] = useState(null);
    const [modalPhoneError, setModalPhoneError] = useState("");
    const [isFetchingModalPincode, setIsFetchingModalPincode] = useState(false);
    const [modalAddressForm, setModalAddressForm] = useState({
        name: "",
        phone: "",
        pinCode: "",
        streetAddress: "",
        streetAddress2: "",
        cityState: "",
        country: "IN",
        addressType: "HOME",
        isDefault: true
    });

    // Real cart items from CartContext (selected items, falling back to all cart items if selection is empty)
    const isCartEmpty = cartItems.length === 0;
    const hasSelectedItems = Array.isArray(selectedCartItems) && selectedCartItems.length > 0;
    const activeItems = hasSelectedItems ? selectedCartItems : cartItems;
    const activeCount = hasSelectedItems ? selectedCount : cartCount;
    const activeSubtotal = hasSelectedItems ? selectedSubtotal : cartSubtotal;

    // Contact and Delivery Forms State
    const [formData, setFormData] = useState({
        contactEmail: "",
        newsletter: true,
        firstName: "",
        lastName: "",
        deliveryEmail: "",
        phoneNumber: "",
        streetAddress: "",
        city: "",
        state: "",
        pinCode: "",
        country: "IN"
    });

    // Prefill form from localStorage saved address and/or logged-in user details
    useEffect(() => {
        let localData = {};
        try {
            const stored = localStorage.getItem("savedShippingAddress");
            if (stored) {
                localData = JSON.parse(stored);
            }
        } catch (e) {
            console.error("Error reading saved address from localStorage:", e);
        }

        if (user) {
            const nameParts = user.name ? user.name.split(" ") : ["", ""];
            const fName = nameParts[0] || "";
            const lName = nameParts.slice(1).join(" ") || "";

            let savedUserAddress = {};
            if (user.addresses && user.addresses.length > 0) {
                const defaultAddr = user.addresses.find(a => a.isDefault) || user.addresses[0];
                if (defaultAddr) {
                    setSelectedAddressId(defaultAddr._id || defaultAddr.id);
                    setIsWritingAddress(false);

                    const rawCityStatePin = defaultAddr.cityStatePin || "";
                    const matchPin = rawCityStatePin.match(/\b\d{6}\b/);
                    const pin = matchPin ? matchPin[0] : (defaultAddr.pincode || "");
                    const cleanCityState = rawCityStatePin.replace(/\s*-\s*\d{6}\b/, "").replace(/\s*-\s*$/, "").trim();
                    const cityStateParts = cleanCityState.split(",");
                    const city = cityStateParts[0] ? cityStateParts[0].trim() : "";
                    const state = cityStateParts[1] ? cityStateParts[1].trim() : "";

                    const recNameParts = (defaultAddr.recipientName || user.name || "").split(" ");

                    savedUserAddress = {
                        firstName: recNameParts[0] || fName,
                        lastName: recNameParts.slice(1).join(" ") || lName,
                        streetAddress: defaultAddr.addressLine1 || "",
                        city: city,
                        state: state,
                        pinCode: pin,
                        phoneNumber: defaultAddr.phone || "",
                        country: defaultAddr.country || "India"
                    };
                }
            } else {
                setIsWritingAddress(true);
            }

            setFormData(prev => ({
                ...prev,
                ...localData,
                contactEmail: localData.contactEmail || user.email || prev.contactEmail || "",
                deliveryEmail: localData.deliveryEmail || user.email || prev.deliveryEmail || "",
                phoneNumber: savedUserAddress.phoneNumber || user.phoneNumber || localData.phoneNumber || prev.phoneNumber || "",
                firstName: savedUserAddress.firstName || localData.firstName || fName || prev.firstName,
                lastName: savedUserAddress.lastName || localData.lastName || lName || prev.lastName,
                streetAddress: savedUserAddress.streetAddress || localData.streetAddress || prev.streetAddress,
                city: savedUserAddress.city || localData.city || prev.city,
                state: savedUserAddress.state || localData.state || prev.state,
                pinCode: savedUserAddress.pinCode || localData.pinCode || prev.pinCode,
                country: savedUserAddress.country || localData.country || prev.country || "India",
            }));
        } else if (Object.keys(localData).length > 0) {
            setFormData(prev => ({ ...prev, ...localData }));
            setIsWritingAddress(true);
        } else {
            setIsWritingAddress(true);
        }
    }, [user]);

    const handleSelectAddress = (addr) => {
        setSelectedAddressId(addr._id || addr.id);
        const rawCityStatePin = addr.cityStatePin || "";
        const matchPin = rawCityStatePin.match(/\b\d{6}\b/);
        const pin = matchPin ? matchPin[0] : (addr.pincode || "");
        const cleanCityState = rawCityStatePin.replace(/\s*-\s*\d{6}\b/, "").replace(/\s*-\s*$/, "").trim();
        const cityStateParts = cleanCityState.split(",");
        const city = cityStateParts[0] ? cityStateParts[0].trim() : "";
        const state = cityStateParts[1] ? cityStateParts[1].trim() : "";

        const recipientName = addr.recipientName || addr.name || user?.name || "";
        const nameParts = recipientName.split(" ");
        const fName = nameParts[0] || "";
        const lName = nameParts.slice(1).join(" ") || "";

        setFormData(prev => ({
            ...prev,
            firstName: fName,
            lastName: lName,
            phoneNumber: addr.phone || "",
            streetAddress: addr.addressLine1 || "",
            city: city,
            state: state,
            pinCode: pin,
            country: addr.country || "India"
        }));
        setIsWritingAddress(false);
    };

    const handleOpenEditAddressInModal = (addr) => {
        setModalEditAddressId(addr._id || addr.id);
        setModalPhoneError("");
        const rawCityStatePin = addr.cityStatePin || "";
        const matchPin = rawCityStatePin.match(/\b\d{6}\b/);
        const pin = matchPin ? matchPin[0] : (addr.pincode || "");
        const cleanCityState = rawCityStatePin.replace(/\s*-\s*\d{6}\b/, "").replace(/\s*-\s*$/, "").trim();

        const recName = addr.recipientName || (addr.name && !["HOME", "WORK", "OTHER"].includes(addr.name.toUpperCase()) ? addr.name : (user?.name || ""));
        const rawPhone = addr.phone || user?.phoneNumber || "";
        const cleanPhone = rawPhone.replace(/\D/g, "");

        setModalAddressForm({
            name: recName,
            phone: cleanPhone,
            pinCode: pin,
            streetAddress: addr.addressLine1 || "",
            streetAddress2: addr.addressLine2 || "",
            cityState: cleanCityState,
            country: addr.country || "India",
            addressType: (addr.name || "HOME").toUpperCase(),
            isDefault: Boolean(addr.isDefault)
        });
        setIsModalAddEditOpen(true);
    };

    const [modalNameError, setModalNameError] = useState("");
    const [modalPincodeError, setModalPincodeError] = useState("");
    const [modalStreetError, setModalStreetError] = useState("");

    const handleModalPincodeChange = async (pinVal) => {
        const postalRule = getPostalRule(modalAddressForm.country);
        const pin = pinVal.slice(0, postalRule.maxLength);

        setModalAddressForm(prev => ({ ...prev, pinCode: pin }));

        if (!pin) {
            setModalPincodeError(postalRule.isRequired ? "Postal code is required." : "");
            return;
        }

        const formatCheck = validatePostalCodeFormat(pin, modalAddressForm.country);
        if (!formatCheck.isValid) {
            setModalPincodeError(formatCheck.error);
            return;
        }
        setModalPincodeError("");

        if (pin && validatePostalCode(pin, modalAddressForm.country).isValid) {
            setIsFetchingModalPincode(true);
            try {
                const details = await fetchPostalCodeDetails(modalAddressForm.country, pin);
                if (details && (details.city || details.state)) {
                    setModalAddressForm(prev => ({
                        ...prev,
                        pinCode: pin,
                        cityState: [details.city, details.state].filter(Boolean).join(", ")
                    }));
                }
            } catch (err) {
                console.error("Error fetching pincode in modal:", err);
            } finally {
                setIsFetchingModalPincode(false);
            }
        }
    };

    const handleSaveModalAddress = async (e) => {
        e.preventDefault();
        const targetName = modalAddressForm.name.trim() || user?.name || "";
        const targetPhone = modalAddressForm.phone.replace(/\D/g, "") || (user?.phoneNumber ? user.phoneNumber.replace(/\D/g, "") : "");

        let hasErrors = false;

        if (!targetName) {
            setModalNameError("Name is required.");
            hasErrors = true;
        } else {
            setModalNameError("");
        }

        const phoneCheck = validatePhoneNumber(targetPhone, modalAddressForm.country);
        if (!phoneCheck.isValid) {
            setModalPhoneError(phoneCheck.error);
            hasErrors = true;
        } else {
            setModalPhoneError("");
        }

        const pinCheck = await verifyPostalCode({
            countryCode: modalAddressForm.country,
            postalCode: modalAddressForm.pinCode,
        });
        if (!pinCheck.isValid) {
            setModalPincodeError(pinCheck.error);
            hasErrors = true;
        } else {
            setModalPincodeError("");
        }

        if (!modalAddressForm.streetAddress.trim()) {
            setModalStreetError("House Number/Tower/Block is required.");
            hasErrors = true;
        } else {
            setModalStreetError("");
        }

        if (hasErrors) {
            if (modalFormRef.current) modalFormRef.current.scrollTop = 0;
            return;
        }

        const token = localStorage.getItem("userToken");
        const cityStatePinStr = modalAddressForm.pinCode
            ? `${modalAddressForm.cityState} - ${modalAddressForm.pinCode}`
            : modalAddressForm.cityState;

        const payload = {
            name: modalAddressForm.addressType || "HOME",
            recipientName: targetName,
            addressLine1: modalAddressForm.streetAddress,
            addressLine2: modalAddressForm.streetAddress2 || "",
            cityStatePin: cityStatePinStr,
            phone: phoneCheck.cleanPhone || targetPhone,
            country: modalAddressForm.country || "India",
            isDefault: modalAddressForm.isDefault
        };

        try {
            if (token) {
                const isMongoId = modalEditAddressId && /^[0-9a-fA-F]{24}$/.test(String(modalEditAddressId));
                const url = isMongoId
                    ? `${API_BASE_URL}/frontend/auth/addresses/${modalEditAddressId}`
                    : `${API_BASE_URL}/frontend/auth/addresses`;
                const method = isMongoId ? "PUT" : "POST";

                const res = await fetch(url, {
                    method,
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.success && refreshUser) {
                    await refreshUser(token);
                }
            }
        } catch (err) {
            console.error("Error saving address modal:", err);
        }

        // Apply to current checkout form
        const nameParts = targetName.split(" ");
        const fName = nameParts[0] || "";
        const lName = nameParts.slice(1).join(" ") || "";
        const cityStateParts = (modalAddressForm.cityState || "").split(",");
        const city = cityStateParts[0] ? cityStateParts[0].trim() : "";
        const state = cityStateParts[1] ? cityStateParts[1].trim() : "";

        setFormData(prev => ({
            ...prev,
            firstName: fName,
            lastName: lName,
            phoneNumber: phoneCheck.cleanPhone || targetPhone,
            streetAddress: modalAddressForm.streetAddress,
            city: city,
            state: state,
            pinCode: modalAddressForm.pinCode,
            country: modalAddressForm.country || "India"
        }));

        setIsWritingAddress(false);
        setIsModalAddEditOpen(false);
        setIsSelectAddressOpen(false);
    };

    const handleDeleteAddressFromModal = async (addrId) => {
        const token = localStorage.getItem("userToken");
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/frontend/auth/addresses/${addrId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success && refreshUser) {
                refreshUser(token);
            }
        } catch (err) {
            console.error("Error deleting address:", err);
        }
    };

    const [shippingMethod, setShippingMethod] = useState("standard"); // standard, express, international
    const [shippingRatesConfig, setShippingRatesConfig] = useState({
        standard: { rate: 0, deliveryDays: "3–5 business days", freeThreshold: 999 },
        express: { rate: 150, deliveryDays: "1–2 business days" },
        international: { rate: 638, deliveryDays: "7–14 business days" }
    });
    const [promoInput, setPromoInput] = useState("");
    const [activePromo, setActivePromo] = useState(null);
    const [promoError, setPromoError] = useState("");
    const [promoSuccess, setPromoSuccess] = useState("");

    // Load persisted promo code from localStorage (e.g. if applied in Cart)
    useEffect(() => {
        try {
            const saved = localStorage.getItem("activePromoCode");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.code) {
                    setActivePromo(parsed);
                    setPromoInput(parsed.code);
                    const isFull = parsed.discountValue >= 100 || parsed.isMarketingCode || parsed.code === "MARKETING";
                    setPromoSuccess(isFull ? `100% OFF applied! Total bill is Rs 0` : `Promo code "${parsed.code}" applied!`);
                }
            }
        } catch (e) {}
    }, []);

    // Fetch active shipping rates from backend API
    useEffect(() => {
        const fetchShippingRates = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/frontend/shipping-rates`);
                const data = await res.json();
                if (data.success && data.shippingSetting) {
                    setShippingRatesConfig(data.shippingSetting);
                }
            } catch (err) {
                console.error("Error fetching shipping rates on checkout:", err);
            }
        };
        fetchShippingRates();
    }, []);

    // Clear coupon if cart subtotal drops below minimum spend requirement
    useEffect(() => {
        if (activePromo && activeSubtotal < activePromo.minOrderAmount) {
            setActivePromo(null);
            try {
                localStorage.removeItem("activePromoCode");
            } catch (e) {}
            setPromoError(`Promo code cleared: requires minimum spend of Rs ${activePromo.minOrderAmount}`);
            setPromoSuccess("");
        }
    }, [activeSubtotal, activePromo]);

    // Order & Payment state
    const [isOrderComplete, setIsOrderComplete] = useState(false);
    const [completedOrderSummary, setCompletedOrderSummary] = useState(null);
    const [generatedOrderNum, setGeneratedOrderNum] = useState("");
    const [pinCodeError, setPinCodeError] = useState("");
    const [isFetchingPincode, setIsFetchingPincode] = useState(false);

    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [paymentError, setPaymentError] = useState("");

    // Auto-fetch city & state via India Post API only when country is India and valid 6-digit PIN code is typed
    useEffect(() => {
        const pin = formData.pinCode.trim();
        const postalRule = getPostalRule(formData.country);

        if (!pin) {
            setPinCodeError("");
            return;
        }

        const pinCheck = validatePostalCode(pin, formData.country);
        if (!pinCheck.isValid) {
            setPinCodeError(pinCheck.error);
        } else {
            setPinCodeError("");
        }

        if (pin && validatePostalCode(pin, formData.country).isValid) {
            const fetchPincodeDetails = async () => {
                setIsFetchingPincode(true);
                try {
                    const details = await fetchPostalCodeDetails(formData.country, pin);
                    if (details && (details.city || details.state)) {
                        setFormData(prev => {
                            const updated = {
                                ...prev,
                                city: details.city || prev.city,
                                state: details.state || prev.state
                            };
                            try {
                                localStorage.setItem("savedShippingAddress", JSON.stringify(updated));
                            } catch (e) { }
                            return updated;
                        });
                        setPinCodeError("");
                        setTimeout(() => {
                            saveShippingAddress();
                        }, 200);
                    }
                } catch (err) {
                    console.error("Error fetching PIN code details:", err);
                } finally {
                    setIsFetchingPincode(false);
                }
            };
            fetchPincodeDetails();
        }
    }, [formData.pinCode, formData.country]);

    const handleInputChange = (field, value) => {
        let valToSet = value;
        if (field === "pinCode") {
            const postalRule = getPostalRule(formData.country);
            valToSet = value.slice(0, postalRule.maxLength);
            if (valToSet) {
                const check = validatePostalCode(valToSet, formData.country);
                setPinCodeError(check.isValid ? "" : check.error);
            } else {
                setPinCodeError("");
            }
        } else if (field === "phoneNumber") {
            const countryObj = getCountryByNameOrCode(formData.country);
            valToSet = value.replace(/\D/g, "").slice(0, countryObj.phoneMaxLength || 15);
            if (valToSet) {
                const check = validatePhoneNumber(valToSet, formData.country);
                setPhoneError(check.error);
            } else {
                setPhoneError("");
            }
        } else if (field === "country") {
            const postalRule = getPostalRule(value);
            const countryObj = getCountryByNameOrCode(value);
            let updatedPin = formData.pinCode ? formData.pinCode.slice(0, postalRule.maxLength) : "";
            let updatedPhone = formData.phoneNumber ? formData.phoneNumber.replace(/\D/g, "").slice(0, countryObj.phoneMaxLength || 15) : "";
            if (updatedPin) {
                const check = validatePostalCode(updatedPin, value);
                setPinCodeError(check.isValid ? "" : check.error);
            }
            if (updatedPhone) {
                const check = validatePhoneNumber(updatedPhone, value);
                setPhoneError(check.error);
            }
            setFormData(prev => ({
                ...prev,
                country: value,
                pinCode: updatedPin,
                phoneNumber: updatedPhone
            }));
            return;
        }

        setFormData(prev => {
            const updated = {
                ...prev,
                [field]: valToSet
            };
            try {
                localStorage.setItem("savedShippingAddress", JSON.stringify(updated));
            } catch (e) {
                console.error("Error persisting checkout form to localStorage:", e);
            }
            return updated;
        });
    };

    // Save shipping address function (persists locally for checkout session & syncs to backend user profile)
    async function saveShippingAddress() {
        try {
            const addrObj = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                contactEmail: formData.contactEmail,
                deliveryEmail: formData.deliveryEmail,
                phoneNumber: formData.phoneNumber,
                streetAddress: formData.streetAddress,
                city: formData.city,
                state: formData.state,
                pinCode: formData.pinCode,
                country: formData.country
            };

            // 1. Save to localStorage for session persistence
            localStorage.setItem("savedShippingAddress", JSON.stringify(addrObj));

            // 2. Sync to backend user profile if logged in & required fields exist
            const token = localStorage.getItem("userToken");
            if (token && formData.streetAddress && formData.city && formData.state && formData.pinCode) {
                const recipient = `${formData.firstName || ""} ${formData.lastName || ""}`.trim() || (user?.name || "Customer");
                const cityStatePinStr = formData.pinCode
                    ? `${formData.city}, ${formData.state} - ${formData.pinCode}`
                    : `${formData.city}, ${formData.state}`;

                const res = await fetch(`${API_BASE_URL}/frontend/auth/addresses`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: "Home",
                        recipientName: recipient,
                        addressLine1: formData.streetAddress,
                        addressLine2: "",
                        cityStatePin: cityStatePinStr,
                        phone: formData.phoneNumber || user?.phoneNumber || "",
                        country: formData.country || "India",
                        isDefault: true
                    })
                });

                const data = await res.json();
                if (data.success && refreshUser) {
                    refreshUser(token);
                }
            }
        } catch (e) {
            console.error("Error saving address:", e);
        }
    };

    // Calculate shipping cost based on selected method and admin configured rates
    const getShippingCost = () => {
        if (shippingMethod === "express") {
            return Number(shippingRatesConfig.express?.rate ?? 150);
        }
        if (shippingMethod === "international") {
            return Number(shippingRatesConfig.international?.rate ?? 638);
        }
        // Standard Delivery
        const freeThresh = Number(shippingRatesConfig.standard?.freeThreshold ?? 999);
        const stdRate = Number(shippingRatesConfig.standard?.rate ?? 0);
        if (activeSubtotal >= freeThresh) return 0;
        return stdRate;
    };

    // Handle Promo Code application
    const handleApplyPromo = async (e) => {
        if (e) e.preventDefault();
        setPromoError("");
        setPromoSuccess("");

        const code = promoInput.trim().toUpperCase();
        if (!code) {
            setPromoError("Please enter a promo code.");
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/frontend/promo-codes/validate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, orderAmount: activeSubtotal })
            });

            const contentType = res.headers.get("content-type") || "";
            let data = null;
            if (contentType.includes("application/json")) {
                data = await res.json();
            }

            if (res.ok && data?.success && data?.data) {
                setActivePromo(data.data);
                try {
                    localStorage.setItem("activePromoCode", JSON.stringify(data.data));
                } catch (e) {}
                const isFull = data.data.discountValue >= 100 || data.data.isMarketingCode || data.data.code === "MARKETING";
                setPromoSuccess(data.message || (isFull ? `100% OFF applied! Total bill is Rs 0` : `Promo code "${data.data.code}" applied!`));
            } else {
                setActivePromo(null);
                try {
                    localStorage.removeItem("activePromoCode");
                } catch (e) {}
                setPromoError(data?.message || "Invalid promo code. Try 'MARKETING'");
            }
        } catch (error) {
            console.error("Error applying promo code:", error);
            setPromoError("Failed to apply promo code. Please try again.");
            setActivePromo(null);
        }
    };

    // Calculation values - Full discount turns the entire bill to Rs 0
    const isFullDiscount = Boolean(
        activePromo && (
            activePromo.discountValue >= 100 ||
            activePromo.isMarketingCode ||
            activePromo.code === "MARKETING"
        )
    );

    const discountAmount = isFullDiscount
        ? activeSubtotal
        : activePromo
            ? (activePromo.discountType === "percentage"
                ? Math.round(activeSubtotal * (activePromo.discountValue / 100))
                : Math.min(activeSubtotal, activePromo.discountValue))
            : 0;

    const shippingCost = isFullDiscount ? 0 : getShippingCost();
    const taxableAmount = Math.max(0, activeSubtotal - discountAmount);
    const taxAmount = 0; // Tax (GST) removed
    const totalAmount = isFullDiscount ? 0 : taxableAmount + shippingCost;

    // BacStory Wallet calculations (No deduction if free order!)
    const userWalletBalance = user?.walletBalance || 0;
    const isWalletActive = !isFullDiscount && (useWallet || selectedPaymentChoice === "wallet") && userWalletBalance > 0;
    const walletDeduction = isWalletActive ? Math.min(userWalletBalance, totalAmount) : 0;
    const payableTotal = isFullDiscount ? 0 : Math.max(0, totalAmount - walletDeduction);

    // Helper to dynamically load Razorpay SDK if needed
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (typeof window === "undefined") return resolve(false);
            if (window.Razorpay) return resolve(true);
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    // Smooth scroll and focus helper for form validation
    const scrollToField = (id) => {
        if (typeof window === "undefined" || typeof document === "undefined") return;
        setTimeout(() => {
            const el = document.getElementById(id);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                try { el.focus(); } catch (e) {}
            }
        }, 50);
    };

    // Checkout submission with Razorpay Standard Web Checkout
    const handleCheckoutSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setPaymentError("");

        // 1. Validate active items in cart
        if (!activeItems || activeItems.length === 0) {
            setPaymentError("No items are selected for checkout. Please select items from your cart.");
            return;
        }

        // 2. Validate Contact Email if news & offers checkbox is selected
        if (formData.newsletter && !formData.contactEmail?.trim()) {
            setContactEmailError("Please enter your email to receive news and offers.");
            setPaymentError("Please provide your email address under Contact Details.");
            scrollToField("contactEmailInput");
            return;
        }
        setContactEmailError("");

        // 3. Validate Delivery Address details
        const isUsingSavedAddress = user && user.addresses && user.addresses.length > 0 && !isWritingAddress;
        if (!isUsingSavedAddress) {
            if (!formData.firstName?.trim()) {
                setPaymentError("Please enter your First Name.");
                scrollToField("firstNameInput");
                return;
            }
            if (!formData.lastName?.trim()) {
                setPaymentError("Please enter your Last Name.");
                scrollToField("lastNameInput");
                return;
            }
            if (!formData.deliveryEmail?.trim() && !formData.contactEmail?.trim()) {
                setPaymentError("Please enter your Delivery Email address.");
                scrollToField("deliveryEmailInput");
                return;
            }
            if (!formData.phoneNumber?.trim()) {
                setPhoneError("Phone number is required.");
                setPaymentError("Please enter your Phone Number.");
                scrollToField("phoneInput");
                return;
            }
            const phoneCheck = validatePhoneNumber(formData.phoneNumber, formData.country);
            if (!phoneCheck.isValid) {
                setPhoneError(phoneCheck.error);
                setPaymentError(phoneCheck.error || "Please enter a valid phone number.");
                scrollToField("phoneInput");
                return;
            }
            setPhoneError("");

            if (!formData.pinCode?.trim()) {
                setPinCodeError("PIN code is required.");
                setPaymentError("Please enter your PIN / Postal code.");
                scrollToField("pinCodeInput");
                return;
            }
            const pinCheck = validatePostalCode(formData.pinCode, formData.country);
            if (!pinCheck.isValid) {
                setPinCodeError(pinCheck.error);
                setPaymentError(pinCheck.error || "Please enter a valid PIN code.");
                scrollToField("pinCodeInput");
                return;
            }
            setPinCodeError("");

            if (!formData.streetAddress?.trim()) {
                setPaymentError("Please enter your Street Address.");
                scrollToField("streetAddressInput");
                return;
            }
            if (!formData.city?.trim()) {
                setPaymentError("Please enter your City.");
                scrollToField("cityInput");
                return;
            }
            if (!formData.state?.trim()) {
                setPaymentError("Please enter your State.");
                scrollToField("stateInput");
                return;
            }
        }

        setIsProcessingPayment(true);

        try {
            // STEP 0: Save the user's shipping address
            await saveShippingAddress();

            const localOrderId = "BAC-" + Math.floor(100000 + Math.random() * 900000);
            const token = typeof window !== "undefined" ? localStorage.getItem("userToken") : null;

            // CASE 0: 100% Free Order via Marketing / Promo Code (Total is Rs 0, NO payment deduction)
            if (isFullDiscount || (totalAmount === 0 && payableTotal === 0 && !isWalletActive)) {
                const promoOrderId = "order_FREE_" + Date.now();
                const promoPaymentId = "pay_PROMO_" + Date.now();

                // 1. Reduce stock
                try {
                    const checkoutItems = activeItems.map(item => ({
                        productId: item.productId || item.id,
                        size: item.size,
                        color: item.color,
                        quantity: item.quantity
                    }));
                    await fetch(`${API_BASE_URL}/frontend/products/reduce-stock`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ items: checkoutItems })
                    });
                } catch (stockErr) {
                    console.error("Error reducing stock:", stockErr);
                }

                // 2. Create Order in DB (Rs 0 Total, No wallet deduction, No Razorpay)
                try {
                    await fetch(`${API_BASE_URL}/frontend/orders`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            ...(token && { Authorization: `Bearer ${token}` })
                        },
                        body: JSON.stringify({
                            orderId: localOrderId,
                            razorpayOrderId: promoOrderId,
                            razorpayPaymentId: promoPaymentId,
                            razorpaySignature: "promo_signature",
                            shippingAddress: {
                                firstName: formData.firstName,
                                lastName: formData.lastName,
                                email: formData.deliveryEmail || formData.contactEmail,
                                phoneNumber: formData.phoneNumber,
                                streetAddress: formData.streetAddress,
                                city: formData.city,
                                state: formData.state,
                                pinCode: formData.pinCode,
                                country: formData.country
                            },
                            items: activeItems.map(item => ({
                                productId: item.productId || item.id,
                                name: item.name || item.title || "Product",
                                category: item.tag || "COLLECTION",
                                size: item.size || "M",
                                color: typeof item.color === "object" ? item.color?.name || "Standard" : (item.color || "Standard"),
                                colorHex: typeof item.color === "object" ? item.color?.hex : "#000",
                                price: item.price || `Rs ${item.priceNum || 0}`,
                                priceNum: typeof item.priceNum === "number" && !isNaN(item.priceNum) ? item.priceNum : Number(String(item.price || "").replace(/[^0-9.]/g, "")) || 0,
                                quantity: item.quantity || 1,
                                image: item.image || (Array.isArray(item.images) ? item.images[0] : "") || "/images/landing-page/coding-tshirt.png"
                            })),
                            subtotal: activeSubtotal,
                            discountAmount: activeSubtotal,
                            shippingCost: 0,
                            taxAmount: 0,
                            totalAmount: 0,
                            walletDeduction: 0,
                            paymentMethod: `Marketing / Promo Code (${activePromo?.code || "100% OFF"})`,
                            shippingMethod: shippingMethod === "express" ? "Express Delivery" : shippingMethod === "international" ? "International Shipping" : "Standard Delivery"
                        })
                    });
                } catch (dbErr) {
                    console.error("Error saving free order to MongoDB:", dbErr);
                }

                // 3. Mark ClaimCode as used if it was a claim code
                if (activePromo?.claimCodeId || activePromo?.isMarketingCode) {
                    try {
                        await fetch(`${API_BASE_URL}/frontend/promo-codes/consume-claim`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                ...(token && { Authorization: `Bearer ${token}` })
                            },
                            body: JSON.stringify({
                                claimCodeId: activePromo?.claimCodeId,
                                code: activePromo?.code,
                                orderId: localOrderId
                            })
                        });
                    } catch (claimErr) {
                        console.error("Error consuming claim code:", claimErr);
                    }
                }

                if (refreshUser && token) {
                    refreshUser(token);
                }

                setGeneratedOrderNum(localOrderId);
                setCompletedOrderSummary({
                    orderNum: localOrderId,
                    totalAmount: 0,
                    walletDeduction: 0,
                    payableTotal: 0,
                    paymentMethod: `Marketing / Promo Code (${activePromo?.code || "100% OFF"})`,
                    recipientName: formData.firstName,
                    email: formData.deliveryEmail || formData.contactEmail
                });
                setIsOrderComplete(true);
                if (!isCartEmpty) {
                    clearCart();
                }
                try {
                    localStorage.removeItem("activePromoCode");
                } catch (e) {}
                setIsProcessingPayment(false);
                return;
            }

            // CASE 1: Full Payment via BacStory Wallet (payableTotal === 0)
            if (isWalletActive && payableTotal === 0) {
                const wltPaymentId = "pay_WLT_" + Date.now();
                const wltOrderId = "order_WLT_" + Date.now();

                // Reduce stock
                try {
                    const checkoutItems = activeItems.map(item => ({
                        productId: item.productId || item.id,
                        size: item.size,
                        color: item.color,
                        quantity: item.quantity
                    }));
                    await fetch(`${API_BASE_URL}/frontend/products/reduce-stock`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ items: checkoutItems })
                    });
                } catch (stockErr) {
                    console.error("Error reducing stock:", stockErr);
                }

                // Create Order in DB & Debit Wallet
                try {
                    await fetch(`${API_BASE_URL}/frontend/orders`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            ...(token && { Authorization: `Bearer ${token}` })
                        },
                        body: JSON.stringify({
                            orderId: localOrderId,
                            razorpayOrderId: wltOrderId,
                            razorpayPaymentId: wltPaymentId,
                            razorpaySignature: "wallet_signature",
                            shippingAddress: {
                                firstName: formData.firstName,
                                lastName: formData.lastName,
                                email: formData.deliveryEmail || formData.contactEmail,
                                phoneNumber: formData.phoneNumber,
                                streetAddress: formData.streetAddress,
                                city: formData.city,
                                state: formData.state,
                                pinCode: formData.pinCode,
                                country: formData.country
                            },
                            items: activeItems.map(item => ({
                                productId: item.productId || item.id,
                                name: item.name || item.title || "Product",
                                category: item.tag || "COLLECTION",
                                size: item.size || "M",
                                color: typeof item.color === "object" ? item.color?.name || "Standard" : (item.color || "Standard"),
                                colorHex: typeof item.color === "object" ? item.color?.hex : "#000",
                                price: item.price || `Rs ${item.priceNum || 0}`,
                                priceNum: typeof item.priceNum === "number" && !isNaN(item.priceNum) ? item.priceNum : Number(String(item.price || "").replace(/[^0-9.]/g, "")) || 0,
                                quantity: item.quantity || 1,
                                image: item.image || (Array.isArray(item.images) ? item.images[0] : "") || "/images/landing-page/coding-tshirt.png"
                            })),
                            subtotal: activeSubtotal,
                            discountAmount,
                            shippingCost,
                            taxAmount,
                            totalAmount,
                            walletDeduction: totalAmount,
                            paymentMethod: "BacStory Wallet",
                            shippingMethod: shippingMethod === "express" ? "Express Delivery" : shippingMethod === "international" ? "International Shipping" : "Standard Delivery"
                        })
                    });
                } catch (dbErr) {
                    console.error("Error saving order to MongoDB:", dbErr);
                }

                if (refreshUser && token) {
                    refreshUser(token);
                }

                setGeneratedOrderNum(localOrderId);
                setCompletedOrderSummary({
                    orderNum: localOrderId,
                    totalAmount: totalAmount,
                    walletDeduction: walletDeduction,
                    payableTotal: payableTotal,
                    paymentMethod: "BacStory Wallet",
                    recipientName: formData.firstName,
                    email: formData.deliveryEmail || formData.contactEmail
                });
                setIsOrderComplete(true);
                if (!isCartEmpty) {
                    clearCart();
                }
                setIsProcessingPayment(false);
                return;
            }

            // CASE 2: Razorpay Payment (Full or Partial after Wallet Deduction)
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded || typeof window.Razorpay === "undefined") {
                setPaymentError("Razorpay Checkout SDK failed to load. Please check your internet connection.");
                setIsProcessingPayment(false);
                return;
            }

            // Amount in paise (1 INR = 100 paise). Minimum 100 paise required by Razorpay API
            const amountInPaise = Math.max(100, Math.round(payableTotal * 100));

            // STEP 1: BACKEND - Create Razorpay Order
            let orderRes = await fetch(`${API_BASE_URL}/create-order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: amountInPaise,
                    currency: "INR",
                    receipt: `bac_receipt_${Date.now()}`
                })
            });

            if (!orderRes.ok) {
                orderRes = await fetch(`${API_BASE_URL}/payment/create-order`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        amount: amountInPaise,
                        currency: "INR",
                        receipt: `bac_receipt_${Date.now()}`
                    })
                });
            }

            const orderData = await orderRes.json();

            if (!orderRes.ok || !orderData.success || !orderData.order_id) {
                throw new Error(orderData.message || "Failed to create Razorpay order on backend.");
            }

            const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TMPgBtafMzjbIX";

            // STEP 2: FRONTEND - Open Razorpay Modal
            const options = {
                key: razorpayKey,
                amount: orderData.amount,
                currency: orderData.currency || "INR",
                name: "BACSTORY",
                description: `Checkout Order ${localOrderId}`,
                order_id: orderData.order_id,
                prefill: {
                    name: `${formData.firstName} ${formData.lastName}`.trim(),
                    email: formData.deliveryEmail || formData.contactEmail,
                    contact: formData.phoneNumber
                },
                notes: {
                    address: `${formData.streetAddress}, ${formData.city}, ${formData.state} - ${formData.pinCode}, ${getCountryName(formData.country)}`
                },
                theme: {
                    color: "#000000"
                },
                handler: async function (response) {
                    try {
                        // STEP 3: BACKEND - Verify Signature
                        let verifyRes = await fetch(`${API_BASE_URL}/verify-payment`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        if (!verifyRes.ok) {
                            verifyRes = await fetch(`${API_BASE_URL}/payment/verify-payment`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature
                                })
                            });
                        }

                        const verifyData = await verifyRes.json();

                        if (verifyRes.ok && verifyData.success) {
                            // Payment verified successfully! Finalize order & stock reduction
                            try {
                                const checkoutItems = activeItems.map(item => ({
                                    productId: item.productId || item.id,
                                    size: item.size,
                                    color: item.color,
                                    quantity: item.quantity
                                }));

                                await fetch(`${API_BASE_URL}/frontend/products/reduce-stock`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ items: checkoutItems })
                                });
                            } catch (stockErr) {
                                console.error("Error reducing stock during checkout:", stockErr);
                            }

                            // Save order details to MongoDB database
                            try {
                                await fetch(`${API_BASE_URL}/frontend/orders`, {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        ...(token && { Authorization: `Bearer ${token}` })
                                    },
                                    body: JSON.stringify({
                                        orderId: localOrderId,
                                        razorpayOrderId: response.razorpay_order_id,
                                        razorpayPaymentId: response.razorpay_payment_id,
                                        razorpaySignature: response.razorpay_signature,
                                        shippingAddress: {
                                            firstName: formData.firstName,
                                            lastName: formData.lastName,
                                            email: formData.deliveryEmail || formData.contactEmail,
                                            phoneNumber: formData.phoneNumber,
                                            streetAddress: formData.streetAddress,
                                            city: formData.city,
                                            state: formData.state,
                                            pinCode: formData.pinCode,
                                            country: formData.country
                                        },
                                        items: activeItems.map(item => ({
                                            productId: item.productId || item.id,
                                            name: item.name || item.title || "Product",
                                            category: item.tag || "COLLECTION",
                                            size: item.size || "M",
                                            color: typeof item.color === "object" ? item.color?.name || "Standard" : (item.color || "Standard"),
                                            colorHex: typeof item.color === "object" ? item.color?.hex : "#000",
                                            price: item.price || `Rs ${item.priceNum || 0}`,
                                            priceNum: typeof item.priceNum === "number" && !isNaN(item.priceNum) ? item.priceNum : Number(String(item.price || "").replace(/[^0-9.]/g, "")) || 0,
                                            quantity: item.quantity || 1,
                                            image: item.image || (Array.isArray(item.images) ? item.images[0] : "") || "/images/landing-page/coding-tshirt.png"
                                        })),
                                        subtotal: activeSubtotal,
                                        discountAmount,
                                        shippingCost,
                                        taxAmount,
                                        totalAmount,
                                        walletDeduction: walletDeduction,
                                        paymentMethod: walletDeduction > 0 ? "BacStory Wallet + Razorpay" : "Razorpay / Prepaid",
                                        shippingMethod: shippingMethod === "express" ? "Express Delivery" : shippingMethod === "international" ? "International Shipping" : "Standard Delivery"
                                    })
                                });
                            } catch (dbErr) {
                                console.error("Error saving order to MongoDB:", dbErr);
                            }

                            if (refreshUser && token) {
                                refreshUser(token);
                            }

                            setGeneratedOrderNum(localOrderId);
                            setCompletedOrderSummary({
                                orderNum: localOrderId,
                                totalAmount: totalAmount,
                                walletDeduction: walletDeduction,
                                payableTotal: payableTotal,
                                paymentMethod: isWalletActive ? "BacStory Wallet + Razorpay" : "Razorpay Online",
                                recipientName: formData.firstName,
                                email: formData.deliveryEmail || formData.contactEmail
                            });
                            setIsOrderComplete(true);
                            if (!isCartEmpty) {
                                if (activeItems.length < cartItems.length) {
                                    activeItems.forEach(item => removeFromCart(item.id));
                                } else {
                                    clearCart();
                                }
                            }
                        } else {
                            setPaymentError(verifyData.message || "Payment signature verification failed.");
                        }
                    } catch (verifyErr) {
                        console.error("Error verifying payment:", verifyErr);
                        setPaymentError("Payment verification error. Please contact support.");
                    } finally {
                        setIsProcessingPayment(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessingPayment(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", function (response) {
                setIsProcessingPayment(false);
                setPaymentError(response.error?.description || response.error?.reason || "Payment failed. Please try again.");
            });
            rzp.open();

        } catch (error) {
            console.error("Checkout error:", error);
            setPaymentError(error.message || "An error occurred while initializing payment.");
            setIsProcessingPayment(false);
        }
    };

    return (
        <div className="bg-[#FAF9F6] min-h-screen text-black selection:bg-neutral-200">
            {/* Razorpay Standard Web Checkout Script */}
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

            {/* Header */}
            <header className="bg-white border-b border-neutral-200/80 sticky top-0 z-40">
                <div className="max-w-[1600px] mx-auto px-12 h-17 flex items-center justify-between">
                    <Link href="/" className="font-clashDisplay text-2xl font-semibold tracking-tight text-black select-none">
                        <Image
                            src="/images/logo-dark.svg"
                            alt="bacstory logo"
                            width={120}
                            height={26}
                            className="h-6 sm:h-7 w-auto object-contain cursor-pointer"
                            priority
                        />
                    </Link>
                    <div className="flex items-center gap-5 text-neutral-600">
                        <button
                            onClick={openCart}
                            className="relative hover:text-black transition-colors cursor-pointer"
                            aria-label="Open Cart"
                        >
                            <ShoppingBag className="h-5.5 w-5.5 stroke-[1.25]" />
                            {activeCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 text-[9px] font-bold rounded-full bg-black text-white flex items-center justify-center">
                                    {activeCount}
                                </span>
                            )}
                        </button>
                        <Link
                            href={user ? "/account" : "/login"}
                            className="hover:text-black transition-colors cursor-pointer flex items-center justify-center"
                            aria-label="Account Profile"
                        >
                            <User className="h-5.5 w-5.5 stroke-[1.25]" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-10">
                {isCartEmpty && (
                    <div className="mb-6 bg-[#DFD7CC]/30 border border-[#DFD7CC]/60 text-xs sm:text-sm text-neutral-800 px-4 py-3 rounded-xl flex items-center gap-2 select-none">
                        <span className="font-semibold">Demo Mode:</span> Your cart is currently empty. Showing demo items matching design spec.
                    </div>
                )}

                <form onSubmit={handleCheckoutSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                    {/* Left Column: Form Cards */}
                    <div className="lg:col-span-7 space-y-8">

                        {/* Contact & Delivery Details Block */}
                        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-neutral-200/50 shadow-xs">
                            {/* Contact Details Section */}
                            <div className="border-b border-neutral-100 pb-8">
                                <h2 className="heading-sub text-black mb-6">
                                    Contact Details
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <input
                                            id="contactEmailInput"
                                            type="email"
                                            required={formData.newsletter}
                                            value={formData.contactEmail}
                                            onChange={(e) => {
                                                handleInputChange("contactEmail", e.target.value);
                                                if (contactEmailError && e.target.value.trim()) {
                                                    setContactEmailError("");
                                                }
                                            }}
                                            placeholder="Email Address"
                                            className={`w-full h-12 border rounded-lg px-4 focus:outline-none text-sm font-medium transition-colors ${contactEmailError
                                                ? "border-red-500 focus:border-red-500 bg-red-50/20"
                                                : "border-neutral-200 focus:border-black"
                                                }`}
                                        />
                                        {contactEmailError && (
                                            <p className="text-xs text-red-500 font-semibold mt-1.5">{contactEmailError}</p>
                                        )}
                                    </div>
                                    <label className="flex items-center gap-2.5 text-xs text-neutral-500 font-semibold cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={formData.newsletter}
                                            onChange={(e) => {
                                                handleInputChange("newsletter", e.target.checked);
                                                if (!e.target.checked) {
                                                    setContactEmailError("");
                                                }
                                            }}
                                            className="w-4.5 h-4.5 border-neutral-300 rounded-sm text-black focus:ring-black cursor-pointer accent-black"
                                        />
                                        <span>Email me with news and offers</span>
                                    </label>
                                </div>
                            </div>

                            {/* Delivery Details Section */}
                            <div className="pt-8">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="heading-sub text-black mb-1">
                                            Delivery Details
                                        </h2>
                                        <p className="text-xs sm:text-sm text-neutral-400 font-normal">
                                            Where should we send your order?
                                        </p>
                                    </div>
                                    {user && user.addresses && user.addresses.length > 0 && isWritingAddress && (
                                        <button
                                            type="button"
                                            onClick={() => setIsWritingAddress(false)}
                                            className="text-xs font-bold text-neutral-900 hover:underline cursor-pointer"
                                        >
                                            Use Saved Address
                                        </button>
                                    )}
                                </div>

                                {user && user.addresses && user.addresses.length > 0 && !isWritingAddress ? (
                                    /* Deliver to Card (Matching Screenshot 1) */
                                    <div className="bg-neutral-50/80 border border-neutral-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold text-neutral-800">
                                                Deliver to: <span className="font-bold text-neutral-900">{formData.firstName} {formData.lastName}</span>, <span className="font-bold font-mono text-neutral-900">{formData.pinCode}</span>
                                            </p>
                                            <p className="text-xs sm:text-sm text-neutral-600 font-normal leading-relaxed">
                                                {formData.streetAddress}, {formData.city}, {formData.state} - {formData.pinCode}
                                            </p>
                                            {formData.phoneNumber && (
                                                <p className="text-xs text-neutral-500 font-medium pt-0.5">
                                                    Mobile: <span className="font-semibold text-neutral-800">{formData.phoneNumber}</span>
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsSelectAddressOpen(true)}
                                            className="self-start sm:self-center px-4 py-2 text-xs font-bold tracking-wider text-neutral-900 border border-neutral-300 rounded-lg hover:bg-black hover:text-white transition-colors uppercase cursor-pointer whitespace-nowrap"
                                        >
                                            CHANGE ADDRESS
                                        </button>
                                    </div>
                                ) : (
                                    /* Form Inputs (Full address write form) */
                                    <div className="space-y-6 pt-2">
                                        {/* Name Row */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-neutral-400 tracking-wider mb-2 block">
                                                    FIRST NAME
                                                </label>
                                                <input
                                                    id="firstNameInput"
                                                    type="text"
                                                    required
                                                    value={formData.firstName}
                                                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                                                    onBlur={saveShippingAddress}
                                                    placeholder="Enter first name"
                                                    className="w-full h-12 border border-neutral-200 rounded-lg px-4 focus:outline-none focus:border-black text-sm font-semibold transition-colors placeholder:text-neutral-300 font-normal"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-neutral-400 tracking-wider mb-2 block">
                                                    LAST NAME
                                                </label>
                                                <input
                                                    id="lastNameInput"
                                                    type="text"
                                                    required
                                                    value={formData.lastName}
                                                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                                                    onBlur={saveShippingAddress}
                                                    placeholder="Enter last name"
                                                    className="w-full h-12 border border-neutral-200 rounded-lg px-4 focus:outline-none focus:border-black text-sm font-semibold transition-colors placeholder:text-neutral-300 font-normal"
                                                />
                                            </div>
                                        </div>

                                        {/* Email Address */}
                                        <div>
                                            <label className="text-[10px] font-bold text-neutral-400 tracking-wider mb-2 block">
                                                EMAIL ADDRESS
                                            </label>
                                            <input
                                                id="deliveryEmailInput"
                                                type="email"
                                                required
                                                value={formData.deliveryEmail}
                                                onChange={(e) => handleInputChange("deliveryEmail", e.target.value)}
                                                onBlur={saveShippingAddress}
                                                placeholder="Enter email address"
                                                className="w-full h-12 border border-neutral-200 rounded-lg px-4 focus:outline-none focus:border-black text-sm font-semibold transition-colors placeholder:text-neutral-300 font-normal"
                                            />
                                        </div>

                                        {/* Phone Number */}
                                        <div>
                                            <label className="text-[10px] font-bold text-neutral-400 tracking-wider mb-2 block">
                                                PHONE NUMBER
                                            </label>
                                            {(() => {
                                                const countryObj = getCountryByNameOrCode(formData.country);
                                                return (
                                                    <div>
                                                        <div className="relative flex items-center">
                                                            {countryObj.dialCode && (
                                                                <span className="absolute left-4 text-sm font-bold text-neutral-500 select-none pointer-events-none">
                                                                    {countryObj.dialCode}
                                                                </span>
                                                            )}
                                                            <input
                                                                id="phoneInput"
                                                                type="tel"
                                                                required
                                                                maxLength={countryObj.phoneMaxLength || 15}
                                                                value={formData.phoneNumber}
                                                                onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                                                                onBlur={saveShippingAddress}
                                                                placeholder={countryObj.placeholder}
                                                                className={`w-full h-12 border rounded-lg ${countryObj.dialCode ? "pl-14" : "px-4"} pr-4 focus:outline-none text-sm font-semibold transition-colors placeholder:text-neutral-300 font-normal ${phoneError
                                                                    ? "border-red-500 focus:border-red-500 bg-red-50/20"
                                                                    : "border-neutral-200 focus:border-black"
                                                                    }`}
                                                            />
                                                        </div>
                                                        {phoneError && (
                                                            <p className="text-xs text-red-500 font-semibold mt-1.5">{phoneError}</p>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Country & Pin Code Row */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <CountrySelect
                                                    label="COUNTRY"
                                                    value={formData.country || "IN"}
                                                    onChange={(e) => handleInputChange("country", e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-neutral-400 tracking-wider mb-2 block">
                                                    PIN CODE
                                                </label>
                                                <input
                                                    id="pinCodeInput"
                                                    type="text"
                                                    required
                                                    value={formData.pinCode}
                                                    onChange={(e) => handleInputChange("pinCode", e.target.value)}
                                                    onBlur={saveShippingAddress}
                                                    placeholder={getPostalRule(formData.country).placeholder}
                                                    maxLength={getPostalRule(formData.country).maxLength}
                                                    className={`w-full h-12 border rounded-lg px-4 focus:outline-none text-sm font-semibold transition-colors placeholder:text-neutral-300 font-normal ${pinCodeError
                                                        ? "border-red-500 focus:border-red-500 bg-red-50/20"
                                                        : "border-neutral-200 focus:border-black"
                                                        }`}
                                                />
                                                {isFetchingPincode && (
                                                    <p className="text-xs text-neutral-500 font-medium flex items-center gap-1.5 mt-1.5 select-none">
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                                                        Fetching city & state...
                                                    </p>
                                                )}
                                                {pinCodeError && !isFetchingPincode && (
                                                    <p className="text-xs text-red-500 font-semibold mt-1.5">{pinCodeError}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Street Address */}
                                        <div>
                                            <label className="text-[10px] font-bold text-neutral-400 tracking-wider mb-2 block">
                                                STREET ADDRESS
                                            </label>
                                            <input
                                                id="streetAddressInput"
                                                type="text"
                                                required
                                                value={formData.streetAddress}
                                                onChange={(e) => handleInputChange("streetAddress", e.target.value)}
                                                onBlur={saveShippingAddress}
                                                placeholder="House No, Building, Street, Area"
                                                className="w-full h-12 border border-neutral-200 rounded-lg px-4 focus:outline-none focus:border-black text-sm font-semibold transition-colors placeholder:text-neutral-300 font-normal"
                                            />
                                        </div>

                                        {/* City & State Row */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-neutral-400 tracking-wider mb-2 block">
                                                    CITY
                                                </label>
                                                <input
                                                    id="cityInput"
                                                    type="text"
                                                    required
                                                    value={formData.city}
                                                    onChange={(e) => handleInputChange("city", e.target.value)}
                                                    onBlur={saveShippingAddress}
                                                    placeholder="Enter city"
                                                    className="w-full h-12 border border-neutral-200 rounded-lg px-4 focus:outline-none focus:border-black text-sm font-semibold transition-colors placeholder:text-neutral-300 font-normal"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-neutral-400 tracking-wider mb-2 block">
                                                    STATE
                                                </label>
                                                <input
                                                    id="stateInput"
                                                    type="text"
                                                    required
                                                    value={formData.state}
                                                    onChange={(e) => handleInputChange("state", e.target.value)}
                                                    onBlur={saveShippingAddress}
                                                    placeholder="Enter state"
                                                    className="w-full h-12 border border-neutral-200 rounded-lg px-4 focus:outline-none focus:border-black text-sm font-semibold transition-colors placeholder:text-neutral-300 font-normal"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Shipping Method Selection */}
                            <div className="mt-10">
                                <label className="text-[11px] font-bold text-neutral-400 tracking-wider mb-4 block">
                                    SHIPPING METHOD
                                </label>

                                <div className="space-y-3">
                                    {/* Standard Delivery Option */}
                                    <label
                                        className={`flex items-center justify-between border rounded-xl p-4 cursor-pointer select-none transition-all ${shippingMethod === "standard"
                                            ? "border-black bg-neutral-50/50 shadow-xs"
                                            : "border-neutral-200 hover:border-neutral-300"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                name="shipping"
                                                value="standard"
                                                checked={shippingMethod === "standard"}
                                                onChange={() => setShippingMethod("standard")}
                                                className="w-4 h-4 border-neutral-300 focus:ring-black accent-black cursor-pointer"
                                            />
                                            <div>
                                                <p className="text-sm font-bold text-black">Standard Delivery</p>
                                                <p className="text-xs text-neutral-400 mt-0.5">
                                                    {shippingRatesConfig.standard?.deliveryDays || "3–5 business days"}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-black">
                                            {activeSubtotal >= Number(shippingRatesConfig.standard?.freeThreshold ?? 999) || Number(shippingRatesConfig.standard?.rate ?? 0) === 0
                                                ? "Free"
                                                : `Rs ${Number(shippingRatesConfig.standard?.rate).toLocaleString()}`}
                                        </span>
                                    </label>

                                    {/* Express Delivery Option */}
                                    <label
                                        className={`flex items-center justify-between border rounded-xl p-4 cursor-pointer select-none transition-all ${shippingMethod === "express"
                                            ? "border-black bg-neutral-50/50 shadow-xs"
                                            : "border-neutral-200 hover:border-neutral-300"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                name="shipping"
                                                value="express"
                                                checked={shippingMethod === "express"}
                                                onChange={() => setShippingMethod("express")}
                                                className="w-4 h-4 border-neutral-300 focus:ring-black accent-black cursor-pointer"
                                            />
                                            <div>
                                                <p className="text-sm font-bold text-black">Express Delivery</p>
                                                <p className="text-xs text-neutral-400 mt-0.5">
                                                    {shippingRatesConfig.express?.deliveryDays || "1–2 business days"}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-black">
                                            Rs {Number(shippingRatesConfig.express?.rate ?? 150).toLocaleString()}
                                        </span>
                                    </label>

                                    {/* International Shipping Option */}
                                    <label
                                        className={`flex items-center justify-between border rounded-xl p-4 cursor-pointer select-none transition-all ${shippingMethod === "international"
                                            ? "border-black bg-neutral-50/50 shadow-xs"
                                            : "border-neutral-200 hover:border-neutral-300"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                name="shipping"
                                                value="international"
                                                checked={shippingMethod === "international"}
                                                onChange={() => setShippingMethod("international")}
                                                className="w-4 h-4 border-neutral-300 focus:ring-black accent-black cursor-pointer"
                                            />
                                            <div>
                                                <p className="text-sm font-bold text-black">International Shipping</p>
                                                <p className="text-xs text-neutral-400 mt-0.5">
                                                    {shippingRatesConfig.international?.deliveryDays || "7–14 business days"}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-black">
                                            Rs {Number(shippingRatesConfig.international?.rate ?? 638).toLocaleString()}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Payment Section Block */}
                            <div className="pt-8 border-t border-neutral-100">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="heading-sub text-black mb-1">
                                            Payment Method
                                        </h2>
                                        <p className="text-xs sm:text-sm text-neutral-400 font-normal">
                                            Choose how you would like to complete your payment
                                        </p>
                                    </div>
                                </div>

                                {/* Payment Section Options */}
                                <div className="space-y-3 pt-1">
                                    {isFullDiscount || totalAmount === 0 ? (
                                        /* 100% Free Order via Marketing / Promo Code */
                                        <div className="border-2 border-emerald-500 bg-emerald-50/70 rounded-2xl p-5 flex items-center justify-between shadow-xs">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                                                    <Check className="w-5 h-5 stroke-[2.5]" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-emerald-950">
                                                        100% Free Order ({activePromo?.code || "Marketing Code"} Applied)
                                                    </p>
                                                    <p className="text-xs text-emerald-700 mt-0.5">
                                                        No payment required. Total bill is Rs 0. No amount will be deducted.
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
                                                Rs 0
                                            </span>
                                        </div>
                                    ) : (
                                        <>
                                            {/* BacStory Wallet Option (if user has wallet balance) */}
                                            {user && userWalletBalance > 0 && (
                                                <label
                                                    className={`flex items-center justify-between border rounded-2xl p-4 sm:p-5 cursor-pointer transition-all ${selectedPaymentChoice === "wallet" || useWallet
                                                        ? "border-black bg-neutral-900 text-white shadow-md"
                                                        : "border-neutral-200 hover:border-neutral-300 bg-white text-black"
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <input
                                                            type="radio"
                                                            name="paymentChoice"
                                                            value="wallet"
                                                            checked={selectedPaymentChoice === "wallet" || useWallet}
                                                            onChange={() => {
                                                                setSelectedPaymentChoice("wallet");
                                                                setUseWallet(true);
                                                            }}
                                                            className="w-4.5 h-4.5 text-black accent-black cursor-pointer mt-0.5"
                                                        />
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-bold">BacStory Wallet / Store Credit</p>
                                                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest">
                                                                    Balance: Rs {userWalletBalance.toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <p className={`text-xs mt-1 ${selectedPaymentChoice === "wallet" || useWallet ? "text-neutral-300" : "text-neutral-500"}`}>
                                                                {userWalletBalance >= totalAmount
                                                                    ? "Pay 100% of this order using your store credit balance."
                                                                    : `Apply Rs ${Math.min(userWalletBalance, totalAmount).toLocaleString()} from your wallet, pay remaining Rs ${(totalAmount - Math.min(userWalletBalance, totalAmount)).toLocaleString()} via Razorpay.`
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${selectedPaymentChoice === "wallet" || useWallet ? "bg-neutral-800 text-white" : "bg-neutral-100 text-neutral-800"
                                                        }`}>
                                                        - Rs {Math.min(userWalletBalance, totalAmount).toLocaleString()}
                                                    </span>
                                                </label>
                                            )}

                                            {/* Razorpay Online Payment Option */}
                                            <label
                                                className={`flex items-center justify-between border rounded-2xl p-4 sm:p-5 cursor-pointer transition-all ${selectedPaymentChoice === "online" && !useWallet
                                                    ? "border-black bg-neutral-50/80 shadow-xs text-black"
                                                    : "border-neutral-200 hover:border-neutral-300 bg-white text-black"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="radio"
                                                        name="paymentChoice"
                                                        value="online"
                                                        checked={selectedPaymentChoice === "online" && !useWallet}
                                                        onChange={() => {
                                                            setSelectedPaymentChoice("online");
                                                            setUseWallet(false);
                                                        }}
                                                        className="w-4.5 h-4.5 text-black accent-black cursor-pointer"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-bold text-black">Pay Online (UPI, Cards, NetBanking)</p>
                                                        <p className="text-xs text-neutral-400">Fast & 100% Secure Payment via Razorpay</p>
                                                    </div>
                                                </div>
                                            </label>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Payment Error Banner */}
                            {paymentError && (
                                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs sm:text-sm font-semibold flex items-center gap-2.5">
                                    <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                                    <span>{paymentError}</span>
                                </div>
                            )}

                            {/* Continue / Place Order Button */}
                            <Button
                                type="submit"
                                onClick={handleCheckoutSubmit}
                                variant="dark"
                                hasArrow={!isProcessingPayment}
                                disabled={isProcessingPayment}
                                className="w-full mt-10 !py-4 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                            >
                                {isProcessingPayment ? (
                                    <span className="flex items-center justify-center gap-2.5">
                                        <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                                        <span>Placing Order...</span>
                                    </span>
                                ) : isFullDiscount || payableTotal === 0 ? (
                                    `Place Order (Rs 0 - Free Order)`
                                ) : isWalletActive && payableTotal === 0 ? (
                                    `Pay Rs ${totalAmount.toLocaleString()} via BacStory Wallet`
                                ) : isWalletActive ? (
                                    `Pay Rs ${payableTotal.toLocaleString()} via Razorpay (Wallet Credit: -Rs ${walletDeduction.toLocaleString()})`
                                ) : (
                                    "Continue to Payment"
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Right Column: Order Summary Card */}
                    <div className="lg:col-span-5">
                        <div className="bg-white rounded-3xl p-6 border border-neutral-200/50 shadow-xs h-fit sticky top-24">
                            <span className="text-xs font-bold text-neutral-400 tracking-wider mb-6 block uppercase">
                                Order Summary
                            </span>

                            {/* Cart Items List */}
                            <div className="divide-y divide-neutral-100 max-h-[400px] overflow-y-auto pr-1">
                                {activeItems.map((item) => (
                                    <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0 items-start">
                                        {/* Thumbnail Image Container */}
                                        <div className="relative w-18 h-20 bg-[#F4F0EA] rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                                            <img
                                                src={getImageUrl(item.image)}
                                                alt={item.name || item.title || "Product image"}
                                                className="w-full h-full object-contain p-1.5 select-none"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "/images/landing-page/coding-tshirt.png";
                                                }}
                                            />
                                        </div>
                                        {/* Product specifications */}
                                        <div className="flex-1 flex flex-col min-w-0">
                                            <div className="flex justify-between items-start gap-1">
                                                <div>
                                                    <h3 className="font-sans text-sm font-semibold text-black truncate pr-1">
                                                        {item.name || item.title || "Product"}
                                                    </h3>
                                                    <p className="text-[10px] font-semibold text-neutral-400 uppercase mt-0.5">
                                                        {item.tag}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-clashDisplay text-sm font-semibold text-black whitespace-nowrap">
                                                        Rs {((typeof item.priceNum === "number" && !isNaN(item.priceNum) ? item.priceNum : Number(String(item.price || "").replace(/[^0-9.]/g, "")) || 0) * (item.quantity || 1)).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Attributes & Quantity */}
                                            <div className="flex items-center justify-between mt-2.5">
                                                <div className="flex flex-wrap gap-1.5">
                                                    <span className="text-[9px] font-medium px-2 py-0.5 rounded-full border border-neutral-150 text-neutral-500 select-none">
                                                        {item.size}
                                                    </span>
                                                    <span className="text-[9px] font-medium px-2 py-0.5 rounded-full border border-neutral-150 text-neutral-500 flex items-center gap-1 select-none">
                                                        <span
                                                            className="w-1.5 h-1.5 rounded-full border border-black/10 shadow-xs"
                                                            style={{ backgroundColor: typeof item.color === "object" ? item.color?.hex : "#000" }}
                                                        />
                                                        {typeof item.color === "object" ? item.color?.name : item.color}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider select-none">
                                                    Qty: {item.quantity}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Promo Code Apply Box */}
                            <div className="mt-6 pt-6 border-t border-neutral-100">
                                {activePromo ? (
                                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3.5 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-xs text-green-900 bg-green-200/70 px-2 py-0.5 rounded tracking-wider uppercase">{activePromo.code}</span>
                                            <span className="text-xs text-green-800 font-medium">
                                                Applied ({activePromo.discountType === "percentage" ? `${activePromo.discountValue}% OFF` : `Rs ${activePromo.discountValue} OFF`})
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setActivePromo(null);
                                                setPromoInput("");
                                                setPromoSuccess("");
                                                setPromoError("");
                                                try {
                                                    localStorage.removeItem("activePromoCode");
                                                } catch (e) {}
                                            }}
                                            className="text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer underline transition-colors"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Promo code"
                                            value={promoInput}
                                            onChange={(e) => setPromoInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    handleApplyPromo(e);
                                                }
                                            }}
                                            className="flex-1 h-11 border border-neutral-200 rounded-lg px-3 focus:outline-none focus:border-black text-sm font-medium transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleApplyPromo}
                                            className="h-11 px-5 bg-black text-white hover:bg-neutral-800 rounded-full font-bold text-xs tracking-wider transition-colors cursor-pointer flex items-center justify-center select-none"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                )}
                                {promoError && <p className="text-xs text-red-500 font-semibold mt-2 ml-1">{promoError}</p>}
                                {promoSuccess && !activePromo && <p className="text-xs text-green-600 font-semibold mt-2 ml-1">{promoSuccess}</p>}
                            </div>

                            {/* Pricing summary totals */}
                            <div className="mt-6 pt-6 border-t border-neutral-100 space-y-3.5 text-xs sm:text-sm">
                                <div className="flex justify-between text-neutral-500 font-medium">
                                    <span>Subtotal ({activeCount} item{activeCount === 1 ? "" : "s"})</span>
                                    <span className="font-semibold text-black">Rs {activeSubtotal.toLocaleString()}</span>
                                </div>

                                {activePromo && (
                                    <div className="flex justify-between text-green-600 font-medium">
                                        <span>Discount ({activePromo.code} - {isFullDiscount ? "100% OFF (Bill is Rs 0)" : activePromo.discountType === "percentage" ? `${activePromo.discountValue}% off` : `Rs ${activePromo.discountValue} off`})</span>
                                        <span className="font-semibold">-Rs {discountAmount.toLocaleString()}</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-neutral-500 font-medium">
                                    <span>Shipping</span>
                                    <span className="font-semibold text-black">
                                        {shippingCost === 0 ? "Free" : `Rs ${shippingCost.toLocaleString()}`}
                                    </span>
                                </div>

                                {walletDeduction > 0 && (
                                    <div className="flex justify-between text-emerald-700 font-medium bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 text-xs">
                                        <span>BacStory Wallet Credit</span>
                                        <span className="font-semibold">- Rs {walletDeduction.toLocaleString()}</span>
                                    </div>
                                )}

                                <div className="border-t border-neutral-100 pt-4 flex justify-between items-baseline mt-4">
                                    <span className="text-sm font-bold text-black">Total Payable</span>
                                    <span className="font-clashDisplay text-xl sm:text-2xl font-bold text-black">
                                        Rs {payableTotal.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Trust Badge Footer */}
                            <div className="mt-6 pt-6 border-t border-neutral-100 flex items-center justify-center gap-6 text-[10px] sm:text-xs text-neutral-400 font-semibold select-none">
                                <div className="flex items-center gap-1.5">
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>Secure Checkout</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>14-day returns</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </main>

            {/* Success Confirmation Modal Overlay */}
            {isOrderComplete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl animate-fade-in flex flex-col items-center">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-6 border border-green-100">
                            <CheckCircle2 className="w-9 h-9 stroke-[1.5]" />
                        </div>

                        <h2 className="heading-sub text-black">
                            Order Placed Successfully!
                        </h2>

                        <p className="text-sm text-neutral-400 mt-2 font-medium">
                            Thank you for shopping with us, {completedOrderSummary?.recipientName || formData.firstName}.
                        </p>

                        <div className="my-6 py-4 px-6 bg-neutral-50 rounded-2xl w-full border border-neutral-100 text-left space-y-2.5">
                            <div className="flex justify-between text-xs sm:text-sm font-medium">
                                <span className="text-neutral-400">Order Number:</span>
                                <span className="font-bold text-black">{completedOrderSummary?.orderNum || generatedOrderNum}</span>
                            </div>
                            <div className="flex justify-between text-xs sm:text-sm font-medium">
                                <span className="text-neutral-400">Payment Status:</span>
                                <span className="font-bold text-green-600">Paid</span>
                            </div>
                            <div className="flex justify-between text-xs sm:text-sm font-medium">
                                <span className="text-neutral-400">Payment Method:</span>
                                <span className="font-semibold text-black">
                                    {completedOrderSummary?.paymentMethod || (isWalletActive && payableTotal === 0
                                        ? "BacStory Wallet"
                                        : isWalletActive
                                            ? "BacStory Wallet + Razorpay"
                                            : "Razorpay Online")}
                                </span>
                            </div>

                            <div className="flex justify-between text-xs sm:text-sm font-medium pt-1 border-t border-neutral-200/60">
                                <span className="text-neutral-400">Order Total:</span>
                                <span className="font-semibold text-black">Rs {(completedOrderSummary ? completedOrderSummary.totalAmount : totalAmount).toLocaleString()}</span>
                            </div>

                            {(completedOrderSummary ? completedOrderSummary.walletDeduction : walletDeduction) > 0 && (
                                <div className="flex justify-between text-xs sm:text-sm font-medium text-emerald-700">
                                    <span>BacStory Wallet Credit:</span>
                                    <span className="font-semibold">- Rs {(completedOrderSummary ? completedOrderSummary.walletDeduction : walletDeduction).toLocaleString()}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-xs sm:text-sm font-medium border-t border-neutral-200/60 pt-2 mt-1">
                                <span className="text-neutral-800 font-bold">
                                    {(completedOrderSummary ? completedOrderSummary.payableTotal : payableTotal) === 0 ? (
                                        (completedOrderSummary?.walletDeduction > 0 || isWalletActive) ? "Amount Paid via Wallet:" : "Amount Paid:"
                                    ) : "Amount Paid via Razorpay:"}
                                </span>
                                <span className="font-bold text-black font-clashDisplay">
                                    Rs {(completedOrderSummary
                                        ? completedOrderSummary.payableTotal
                                        : payableTotal).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <p className="text-xs text-neutral-400 leading-relaxed px-4">
                            A confirmation email and order receipt have been sent to <span className="font-semibold text-neutral-600">{completedOrderSummary?.email || formData.deliveryEmail || formData.contactEmail}</span>.
                        </p>


                        <Link
                            href="/"
                            onClick={() => {
                                setIsOrderComplete(false);
                                setCompletedOrderSummary(null);
                            }}
                            className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white rounded-full font-bold text-sm tracking-wide transition-colors mt-8 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                        >
                            <span>Back to Homepage</span>
                        </Link>
                    </div>
                </div>
            )}

            {/* Modal 1: Select Delivery Address Modal (Screenshots 2 & 3) */}
            {isSelectAddressOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                            <h3 className="text-base font-bold text-neutral-900 font-clashDisplay">Select Delivery Address</h3>
                            <button
                                type="button"
                                onClick={() => setIsSelectAddressOpen(false)}
                                className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content Body */}
                        <div className="p-6 overflow-y-auto space-y-4 flex-1">
                            {/* Saved Address Sub-Header */}
                            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                                <span className="text-xs font-bold tracking-wider text-neutral-500 uppercase">SAVED ADDRESS</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setModalEditAddressId(null);
                                        setModalPhoneError("");
                                        setModalAddressForm({
                                            name: "",
                                            phone: "",
                                            pinCode: "",
                                            streetAddress: "",
                                            streetAddress2: "",
                                            cityState: "",
                                            country: "India",
                                            addressType: "HOME",
                                            isDefault: true
                                        });
                                        setIsModalAddEditOpen(true);
                                    }}
                                    className="text-xs font-bold text-neutral-900 hover:underline transition-colors cursor-pointer"
                                >
                                    + Add New Address
                                </button>
                            </div>

                            {/* Saved Addresses List */}
                            <div className="space-y-4">
                                {user?.addresses && user.addresses.length > 0 ? (
                                    user.addresses.map((addr) => {
                                        const rawCityStatePin = addr.cityStatePin || "";
                                        const matchPin = rawCityStatePin.match(/\b\d{6}\b/);
                                        const pin = matchPin ? matchPin[0] : (addr.pincode || "");
                                        const cleanCityState = rawCityStatePin.replace(/\s*-\s*\d{6}\b/, "").replace(/\s*-\s*$/, "").trim();

                                        const isSelected = selectedAddressId === (addr._id || addr.id);

                                        return (
                                            <div
                                                key={addr._id || addr.id}
                                                onClick={() => handleSelectAddress(addr)}
                                                className={`border rounded-xl p-4 transition-all cursor-pointer ${isSelected
                                                    ? "border-black bg-neutral-50/80 shadow-xs"
                                                    : "border-neutral-200 hover:border-neutral-300 bg-white"
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="pt-0.5">
                                                        <input
                                                            type="radio"
                                                            name="selectedAddress"
                                                            checked={isSelected}
                                                            onChange={() => handleSelectAddress(addr)}
                                                            className="w-4 h-4 text-black focus:ring-black accent-black cursor-pointer"
                                                        />
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-bold text-sm text-neutral-900">
                                                                {addr.recipientName || addr.name || "Customer"}
                                                            </span>
                                                            {addr.isDefault && (
                                                                <span className="text-xs text-neutral-400 font-medium">(Default)</span>
                                                            )}
                                                            <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-600 border border-emerald-300 rounded-md uppercase">
                                                                {addr.name || "HOME"}
                                                            </span>
                                                        </div>

                                                        <p className="text-xs text-neutral-600 leading-relaxed">
                                                            {addr.addressLine1}
                                                            {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                                                            {cleanCityState ? `, ${cleanCityState}` : ""}
                                                            {pin ? ` - ${pin}` : ""}
                                                        </p>

                                                        {addr.phone && (
                                                            <p className="text-xs text-neutral-700 font-medium pt-0.5">
                                                                Mobile: <span className="font-bold text-neutral-900">{addr.phone}</span>
                                                            </p>
                                                        )}

                                                        {/* Action buttons */}
                                                        <div className="flex items-center gap-2 pt-2.5">
                                                            {isSelected ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleSelectAddress(addr);
                                                                        setIsSelectAddressOpen(false);
                                                                    }}
                                                                    className="px-4 py-2 text-xs font-bold tracking-wider bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors uppercase cursor-pointer whitespace-nowrap"
                                                                >
                                                                    DELIVERING HERE
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleSelectAddress(addr);
                                                                    }}
                                                                    className="px-4 py-2 text-xs font-bold tracking-wider border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors uppercase cursor-pointer"
                                                                >
                                                                    DELIVER HERE
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleOpenEditAddressInModal(addr);
                                                                }}
                                                                className="px-4 py-2 text-xs font-bold tracking-wider border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors uppercase cursor-pointer"
                                                            >
                                                                EDIT
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteAddressFromModal(addr._id || addr.id);
                                                                }}
                                                                className="p-2 border border-neutral-200 text-neutral-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                                                                title="Delete Address"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-xs text-neutral-400 italic">No saved addresses found.</p>
                                )}
                            </div>

                            {/* Big ADD NEW ADDRESS button at bottom */}
                            <div className="pt-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setModalEditAddressId(null);
                                        setModalPhoneError("");
                                        setModalAddressForm({
                                            name: "",
                                            phone: "",
                                            pinCode: "",
                                            streetAddress: "",
                                            streetAddress2: "",
                                            cityState: "",
                                            country: "India",
                                            addressType: "HOME",
                                            isDefault: true
                                        });
                                        setIsModalAddEditOpen(true);
                                    }}
                                    className="w-full py-3 border-2 border-neutral-800 rounded-xl text-xs font-bold tracking-wider text-neutral-900 hover:bg-neutral-900 hover:text-white transition-colors uppercase cursor-pointer"
                                >
                                    ADD NEW ADDRESS
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal 2: Add / Edit Address Modal (Screenshot 4) */}
            {isModalAddEditOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalAddEditOpen(false)}
                                    className="text-neutral-500 hover:text-neutral-900 cursor-pointer"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <h3 className="text-base font-bold text-neutral-900 uppercase tracking-wider font-clashDisplay">
                                    {modalEditAddressId ? "EDIT ADDRESS" : "ADD NEW ADDRESS"}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalAddEditOpen(false)}
                                className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content Form Body */}
                        <form ref={modalFormRef} onSubmit={handleSaveModalAddress} noValidate className="p-6 overflow-y-auto space-y-4 flex-1">
                            {/* Contact Details Section */}
                            <div className="space-y-3">
                                <p className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">CONTACT DETAILS</p>
                                <div>
                                    <input
                                        type="text"
                                        value={modalAddressForm.name}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setModalAddressForm({ ...modalAddressForm, name: val });
                                            if (val.trim()) setModalNameError("");
                                        }}
                                        onBlur={() => {
                                            if (!modalAddressForm.name.trim() && !user?.name) {
                                                setModalNameError("Name is required.");
                                            } else {
                                                setModalNameError("");
                                            }
                                        }}
                                        placeholder="Name*"
                                        className={`w-full h-11 border rounded-xl px-4 text-sm font-normal focus:outline-none ${modalNameError ? "border-red-500 bg-red-50/20" : "border-neutral-200 focus:border-black"}`}
                                    />
                                    {modalNameError && <p className="text-xs text-red-500 font-semibold mt-1">{modalNameError}</p>}
                                </div>
                                <div>
                                    {(() => {
                                        const countryObj = getCountryByNameOrCode(modalAddressForm.country);
                                        return (
                                            <div className="relative flex items-center">
                                                {countryObj.dialCode && (
                                                    <span className="absolute left-4 text-sm font-bold text-neutral-500 select-none pointer-events-none">
                                                        {countryObj.dialCode}
                                                    </span>
                                                )}
                                                <input
                                                    type="tel"
                                                    maxLength={countryObj.phoneMaxLength || 15}
                                                    value={modalAddressForm.phone}
                                                    onChange={(e) => {
                                                        const rawDigits = e.target.value.replace(/\D/g, "").slice(0, countryObj.phoneMaxLength || 15);
                                                        setModalAddressForm({ ...modalAddressForm, phone: rawDigits });
                                                        if (rawDigits) {
                                                            const check = validatePhoneNumber(rawDigits, modalAddressForm.country);
                                                            setModalPhoneError(check.isValid ? "" : check.error);
                                                        } else {
                                                            setModalPhoneError("Mobile number is required.");
                                                        }
                                                    }}
                                                    onBlur={() => {
                                                        if (!modalAddressForm.phone) {
                                                            setModalPhoneError("Mobile number is required.");
                                                        } else {
                                                            const check = validatePhoneNumber(modalAddressForm.phone, modalAddressForm.country);
                                                            setModalPhoneError(check.isValid ? "" : check.error);
                                                        }
                                                    }}
                                                    placeholder="Mobile No*"
                                                    className={`w-full h-11 border rounded-xl ${countryObj.dialCode ? "pl-14" : "px-4"} pr-4 text-sm font-normal focus:outline-none ${modalPhoneError ? "border-red-500 focus:border-red-500 bg-red-50/20" : "border-neutral-200 focus:border-black"
                                                        }`}
                                                />
                                            </div>
                                        );
                                    })()}
                                    {modalPhoneError && (
                                        <p className="text-xs text-red-500 font-semibold mt-1">{modalPhoneError}</p>
                                    )}
                                </div>
                            </div>

                            {/* Address Section */}
                            <div className="space-y-3 pt-2">
                                <p className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">ADDRESS</p>

                                {/* Country Selector */}
                                <CountrySelect
                                    label=""
                                    value={modalAddressForm.country || "IN"}
                                    onChange={(e) => {
                                        const newCountry = e.target.value;
                                        setModalAddressForm((prev) => {
                                            const updated = { ...prev, country: newCountry };
                                            if (prev.pinCode) {
                                                verifyPostalCode({ countryCode: newCountry, postalCode: prev.pinCode }).then((check) => {
                                                    setModalPincodeError(check.isValid ? "" : check.error);
                                                });
                                            } else {
                                                const rule = getPostalRule(newCountry);
                                                if (rule.isRequired && modalPincodeError) {
                                                    setModalPincodeError("Postal code is required.");
                                                } else if (!rule.isRequired) {
                                                    setModalPincodeError("");
                                                }
                                            }
                                            if (prev.phone) {
                                                const check = validatePhoneNumber(prev.phone, newCountry);
                                                setModalPhoneError(check.isValid ? "" : check.error);
                                            }
                                            return updated;
                                        });
                                    }}
                                />

                                {/* Pin Code */}
                                <div>
                                    <input
                                        type="text"
                                        maxLength={getPostalRule(modalAddressForm.country).maxLength}
                                        value={modalAddressForm.pinCode}
                                        onChange={(e) => handleModalPincodeChange(e.target.value)}
                                        onBlur={async () => {
                                            if (modalAddressForm.pinCode) {
                                                const check = await verifyPostalCode({
                                                    countryCode: modalAddressForm.country,
                                                    postalCode: modalAddressForm.pinCode,
                                                });
                                                setModalPincodeError(check.isValid ? "" : check.error);
                                            } else {
                                                const rule = getPostalRule(modalAddressForm.country);
                                                setModalPincodeError(rule.isRequired ? "Postal code is required." : "");
                                            }
                                        }}
                                        placeholder={getPostalRule(modalAddressForm.country).placeholder}
                                        className={`w-full h-11 border rounded-xl px-4 text-sm font-normal focus:outline-none ${modalPincodeError ? "border-red-500 focus:border-red-500 bg-red-50/20" : "border-neutral-200 focus:border-black"}`}
                                    />
                                    {isFetchingModalPincode && (
                                        <p className="text-xs text-neutral-500 font-medium flex items-center gap-1.5 mt-1 select-none">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                                            Fetching city & state...
                                        </p>
                                    )}
                                    {modalPincodeError && !isFetchingModalPincode && (
                                        <p className="text-xs text-red-500 font-semibold mt-1">{modalPincodeError}</p>
                                    )}
                                </div>

                                {/* House Number / Tower / Block */}
                                <div>
                                    <input
                                        type="text"
                                        value={modalAddressForm.streetAddress}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setModalAddressForm({ ...modalAddressForm, streetAddress: val });
                                            if (val.trim()) setModalStreetError("");
                                        }}
                                        onBlur={() => {
                                            if (!modalAddressForm.streetAddress.trim()) {
                                                setModalStreetError("House Number/Tower/Block is required.");
                                            } else {
                                                setModalStreetError("");
                                            }
                                        }}
                                        placeholder="House Number/Tower/Block*"
                                        className={`w-full h-11 border rounded-xl px-4 text-sm font-normal focus:outline-none ${modalStreetError ? "border-red-500 bg-red-50/20" : "border-neutral-200 focus:border-black"}`}
                                    />
                                    {modalStreetError && <p className="text-xs text-red-500 font-semibold mt-1">{modalStreetError}</p>}
                                </div>

                                {/* Street / Area / Landmark */}
                                <input
                                    type="text"
                                    value={modalAddressForm.streetAddress2}
                                    onChange={(e) => setModalAddressForm({ ...modalAddressForm, streetAddress2: e.target.value })}
                                    placeholder="Street/Area/Landmark"
                                    className="w-full h-11 border border-neutral-200 rounded-xl px-4 text-sm font-normal focus:outline-none focus:border-black"
                                />

                                {/* City & State (Auto-filled) */}
                                <input
                                    type="text"
                                    value={modalAddressForm.cityState}
                                    onChange={(e) => setModalAddressForm({ ...modalAddressForm, cityState: e.target.value })}
                                    placeholder="City & State (Auto-filled)"
                                    className="w-full h-11 border border-neutral-200 rounded-xl px-4 text-sm font-normal focus:outline-none focus:border-black bg-neutral-50/50"
                                />
                            </div>

                            {/* Save Address As Selection */}
                            <div className="space-y-2 pt-1">
                                <p className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">SAVE ADDRESS AS</p>
                                <div className="flex items-center gap-3">
                                    {["HOME", "WORK", "OTHER"].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setModalAddressForm({ ...modalAddressForm, addressType: type })}
                                            className={`px-4 py-2 text-xs font-bold rounded-full border transition-all cursor-pointer ${modalAddressForm.addressType === type
                                                ? "border-black bg-black text-white shadow-xs"
                                                : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Make Default Checkbox */}
                            <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={modalAddressForm.isDefault}
                                    onChange={(e) => setModalAddressForm({ ...modalAddressForm, isDefault: e.target.checked })}
                                    className="w-4 h-4 text-black focus:ring-black accent-black rounded cursor-pointer"
                                />
                                <span className="text-xs text-neutral-600 font-medium">Make this my default address</span>
                            </label>

                            {/* Bottom Action Buttons (Screenshot 4) */}
                            <div className="pt-3 flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalAddEditOpen(false)}
                                    className="flex-1 py-3 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer uppercase tracking-wider"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md uppercase tracking-wider"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
