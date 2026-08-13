"use client";

import { useState, useEffect } from "react";
import { useUserAuth } from "@/context/UserAuthContext";
import { useToast } from "@/context/ToastContext";
import CustomSelect from "@/components/ui/CustomSelect";
import ConfirmModal from "@/components/ui/ConfirmModal";
import CountrySelect from "@/components/ui/CountrySelect";
import { COUNTRIES, getCountryByNameOrCode, getCountryCode, getCountryName, validatePhoneNumber, getPostalRule, validatePostalCode, fetchPostalCodeDetails, fetchIndiaPincodeDetails } from "@/lib/countryPhoneValidation";
import {
    Pencil,
    Trash2,
    Plus,
    Home,
    MapPin,
    LogOut,
    Check,
    X,
} from "lucide-react";

export default function AccountProfilePage() {
    const { user, logout, userFetch } = useUserAuth();
    const { showToast } = useToast();

    // Determine initial user status: existing user with completed profile vs first-time user
    const hasExistingData = Boolean(user && user.name && (user.email || user.phoneNumber));

    const [isFirstTimeUser, setIsFirstTimeUser] = useState(!hasExistingData);
    const [isEditing, setIsEditing] = useState(!hasExistingData);
    const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
    const [actionMsg, setActionMsg] = useState("");

    // Custom confirm modal state
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        confirmText: "Confirm",
        type: "danger",
        onConfirm: null,
    });

    const [profile, setProfile] = useState({
        name: user?.name || "",
        gender: user?.gender || "",
        phone: user?.phone || user?.phoneNumber || "",
        email: user?.email || "",
        dob: user?.dateOfBirth || user?.dob || "",
    });

    const [savedProfile, setSavedProfile] = useState({ ...profile });

    const [addresses, setAddresses] = useState([]);

    // Fetch user profile & addresses from backend /auth/me
    useEffect(() => {
        let isMounted = true;
        const fetchUserData = async () => {
            try {
                if (userFetch) {
                    const res = await userFetch("/auth/me");
                    if (res.ok) {
                        const data = await res.json();
                        if (data.success && data.user && isMounted) {
                            const u = data.user;
                            const hasData = Boolean(u.name && (u.email || u.phoneNumber));
                            setIsFirstTimeUser(!hasData);
                            if (!hasData) {
                                setIsEditing(true);
                            }
                            const updated = {
                                name: u.name || "",
                                gender: u.gender || "",
                                phone: u.phoneNumber || u.phone || "",
                                email: u.email || "",
                                dob: u.dateOfBirth || u.dob || "",
                            };
                            setProfile(updated);
                            setSavedProfile(updated);

                            if (Array.isArray(u.addresses) && u.addresses.length > 0) {
                                setAddresses(u.addresses.map((a, idx) => {
                                    const rawCityStatePin = a.cityStatePin || "";
                                    const matchPin = rawCityStatePin.match(/\b\d{6}\b/);
                                    const extractedPin = matchPin ? matchPin[0] : (a.pincode || "");
                                    const cleanCityState = rawCityStatePin.replace(/\s*-\s*\d{6}\b/, "").replace(/\s*-\s*$/, "").trim();

                                    return {
                                        _id: a._id || String(idx + 1),
                                        id: a._id || idx + 1,
                                        name: a.name || "Home",
                                        label: a.name || "Home",
                                        recipientName: a.recipientName || "",
                                        addressLine1: a.addressLine1 || "",
                                        addressLine2: a.addressLine2 || "",
                                        cityStatePin: cleanCityState ? (extractedPin ? `${cleanCityState} - ${extractedPin}` : cleanCityState) : "",
                                        pincode: extractedPin,
                                        phone: a.phone || "",
                                        country: a.country || "India",
                                        isDefault: Boolean(a.isDefault),
                                    };
                                }));
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Fetch user profile error:", err);
            }
        };

        fetchUserData();

        return () => {
            isMounted = false;
        };
    }, [userFetch]);

    // Add / Edit address modal state
    const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState(null);
    const [pincodeLoading, setPincodeLoading] = useState(false);
    const [pincodeError, setPincodeError] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [newAddress, setNewAddress] = useState({
        name: "",
        label: "Home",
        addressLine1: "",
        addressLine2: "",
        pincode: "",
        cityStatePin: "",
        phone: "",
        country: "India",
    });

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async () => {
        setSavedProfile({ ...profile });
        setIsFirstTimeUser(false);
        setIsEditing(false);

        showToast("Profile details updated successfully!", "success");
        setSaveSuccessMsg("Profile details saved successfully!");
        setTimeout(() => {
            setSaveSuccessMsg("");
        }, 3500);

        try {
            if (userFetch) {
                await userFetch("/auth/profile", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: profile.name,
                        gender: profile.gender,
                        phone: profile.phone,
                        email: profile.email,
                        dob: profile.dob,
                    }),
                });
            }
        } catch (err) {
            console.log("Save profile API error:", err);
        }
    };

    const handleCancelEdit = () => {
        setProfile({ ...savedProfile });
        setIsEditing(false);
    };

    const handlePincodeChange = async (e) => {
        const raw = e.target.value;
        const postalRule = getPostalRule(newAddress.country);
        const pin = raw.slice(0, postalRule.maxLength);

        setNewAddress((prev) => ({
            ...prev,
            pincode: pin,
        }));

        if (pin) {
            const check = validatePostalCode(pin, newAddress.country);
            setPincodeError(check.isValid ? "" : check.error);
        } else {
            setPincodeError("");
        }

        if (pin && validatePostalCode(pin, newAddress.country).isValid) {
            setPincodeLoading(true);
            try {
                const details = await fetchPostalCodeDetails(newAddress.country, pin);
                if (details && (details.city || details.state)) {
                    const locationStr = [details.city, details.state].filter(Boolean).join(", ");
                    setNewAddress((prev) => ({
                        ...prev,
                        pincode: pin,
                        cityStatePin: locationStr,
                    }));
                    setPincodeError("");
                    showToast(`Location fetched: ${locationStr}`, "success");
                }
            } catch (err) {
                console.log("Pincode lookup error:", err);
            } finally {
                setPincodeLoading(false);
            }
        }
    };

    const handleOpenAddAddress = () => {
        setEditingAddressId(null);
        setPincodeError("");
        setPhoneError("");
        setNewAddress({
            name: "",
            label: "Home",
            addressLine1: "",
            addressLine2: "",
            pincode: "",
            cityStatePin: "",
            phone: profile.phone ? profile.phone.replace(/\D/g, "") : "",
            country: "India",
        });
        setIsAddAddressOpen(true);
    };

    const handleOpenEditAddress = (addr) => {
        setEditingAddressId(addr._id || addr.id);
        setPincodeError("");
        setPhoneError("");
        const rawCityStatePin = addr.cityStatePin || "";
        const matchPin = rawCityStatePin.match(/\b\d{6}\b/);
        const extractedPin = matchPin ? matchPin[0] : (addr.pincode || "");
        const cleanCityState = rawCityStatePin.replace(/\s*-\s*\d{6}\b/, "").replace(/\s*-\s*$/, "").trim();

        setNewAddress({
            name: addr.name || addr.label || "",
            label: addr.label || addr.name || "Home",
            addressLine1: addr.addressLine1 || "",
            addressLine2: addr.addressLine2 || "",
            pincode: extractedPin,
            cityStatePin: cleanCityState,
            phone: addr.phone || "",
            country: addr.country || "India",
        });
        setIsAddAddressOpen(true);
    };

    const handleSaveAddress = async (e) => {
        e.preventDefault();
        if (!newAddress.name || !newAddress.addressLine1) return;

        // Validate phone number according to country
        const phoneCheck = validatePhoneNumber(newAddress.phone, newAddress.country);
        if (!phoneCheck.isValid) {
            setPhoneError(phoneCheck.error);
            showToast(phoneCheck.error, "error");
            return;
        }
        setPhoneError("");

        const cleanCityState = (newAddress.cityStatePin || "").replace(/\s*-\s*\d{6}\b/, "").replace(/\s*-\s*$/, "").trim();
        const formattedCityStatePin = newAddress.pincode 
            ? `${cleanCityState} - ${newAddress.pincode}` 
            : cleanCityState;

        const payload = {
            name: newAddress.name,
            label: newAddress.name,
            addressLine1: newAddress.addressLine1,
            addressLine2: newAddress.addressLine2,
            cityStatePin: formattedCityStatePin,
            phone: phoneCheck.cleanPhone || newAddress.phone,
            country: newAddress.country || "India",
            isDefault: addresses.length === 0,
        };

        if (editingAddressId) {
            // Edit existing address
            try {
                if (userFetch) {
                    const res = await userFetch(`/auth/addresses/${editingAddressId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.success && Array.isArray(data.addresses)) {
                            setAddresses(data.addresses.map((a, idx) => ({
                                _id: a._id || String(idx + 1),
                                id: a._id || idx + 1,
                                name: a.name || "Home",
                                label: a.name || "Home",
                                addressLine1: a.addressLine1 || "",
                                addressLine2: a.addressLine2 || "",
                                cityStatePin: a.cityStatePin || "",
                                phone: a.phone || "",
                                isDefault: Boolean(a.isDefault),
                            })));
                        }
                    } else {
                        setAddresses((prev) =>
                            prev.map((a) => ((a._id || a.id) === editingAddressId ? { ...a, ...payload } : a))
                        );
                    }
                } else {
                    setAddresses((prev) =>
                        prev.map((a) => ((a._id || a.id) === editingAddressId ? { ...a, ...payload } : a))
                    );
                }
            } catch (err) {
                setAddresses((prev) =>
                    prev.map((a) => ((a._id || a.id) === editingAddressId ? { ...a, ...payload } : a))
                );
            }
            showToast("Address updated successfully!", "success");
        } else {
            // Add new address
            try {
                if (userFetch) {
                    const res = await userFetch("/auth/addresses", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.success && Array.isArray(data.addresses)) {
                            setAddresses(data.addresses.map((a, idx) => ({
                                _id: a._id || String(idx + 1),
                                id: a._id || idx + 1,
                                name: a.name || "Home",
                                label: a.name || "Home",
                                addressLine1: a.addressLine1 || "",
                                addressLine2: a.addressLine2 || "",
                                cityStatePin: a.cityStatePin || "",
                                phone: a.phone || "",
                                isDefault: Boolean(a.isDefault),
                            })));
                        }
                    } else {
                        setAddresses((prev) => [...prev, { id: Date.now(), _id: String(Date.now()), ...payload }]);
                    }
                } else {
                    setAddresses((prev) => [...prev, { id: Date.now(), _id: String(Date.now()), ...payload }]);
                }
            } catch (err) {
                setAddresses((prev) => [...prev, { id: Date.now(), _id: String(Date.now()), ...payload }]);
            }
            showToast("New address added successfully!", "success");
        }

        setEditingAddressId(null);
        setNewAddress({
            name: "",
            label: "Home",
            addressLine1: "",
            addressLine2: "",
            cityStatePin: "",
            phone: "",
        });
        setIsAddAddressOpen(false);
    };

    const triggerRemoveAddressModal = (addrId) => {
        setConfirmModal({
            isOpen: true,
            title: "Remove Address",
            message: "Are you sure you want to remove this address from your account?",
            confirmText: "Remove",
            type: "danger",
            onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                setAddresses((prev) => prev.filter((a) => (a._id || a.id) !== addrId));
                showToast("Address removed successfully.", "info");
                try {
                    if (userFetch) {
                        await userFetch(`/auth/addresses/${addrId}`, { method: "DELETE" });
                    }
                } catch (err) {
                    console.log("Delete address error:", err);
                }
            },
        });
    };

    const triggerDeactivateModal = () => {
        setConfirmModal({
            isOpen: true,
            title: "Deactivate Account",
            message: "Are you sure you want to deactivate your account? You can reactivate it anytime by logging back in.",
            confirmText: "Deactivate",
            type: "warning",
            onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                showToast("Account deactivated successfully.", "info");
                try {
                    if (userFetch) {
                        await userFetch("/auth/deactivate", { method: "POST" });
                    }
                } catch (err) {
                    console.log("Deactivate error:", err);
                }
                logout();
            },
        });
    };

    const triggerDeleteModal = () => {
        setConfirmModal({
            isOpen: true,
            title: "Delete Account Permanently",
            message: "Are you sure you want to permanently delete your account? All your order history and saved data will be lost. This action cannot be undone.",
            confirmText: "Delete Account",
            type: "danger",
            onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                showToast("Your account has been deleted.", "error");
                try {
                    if (userFetch) {
                        await userFetch("/auth/account", { method: "DELETE" });
                    }
                } catch (err) {
                    console.log("Delete account error:", err);
                }
                logout();
            },
        });
    };

    return (
        <div className="space-y-10 sm:space-y-12">
            <ConfirmModal
                {...confirmModal}
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
            />

            {/* Section 1: Profile Details */}
            <section id="profile-details">
                {/* BacStory Wallet Summary Card */}
                <div className="bg-neutral-900 text-white p-5 sm:p-6 rounded-2xl flex items-center justify-between shadow-md mb-8 border border-neutral-800">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-300 bg-neutral-800 px-2.5 py-0.5 rounded-full border border-neutral-700">
                                BacStory Store Credit
                            </span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold font-clashDisplay tracking-tight text-white pt-1">
                            Rs {(user?.walletBalance || 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="text-right text-xs">
                        <p className="font-semibold text-neutral-200">BacStory Wallet</p>
                        <p className="text-[11px] text-neutral-400">Available for refunds & checkout</p>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold font-clashDisplay text-neutral-900 tracking-tight">
                            Profile Details
                        </h2>
                        {saveSuccessMsg && (
                            <p className="text-xs font-semibold text-emerald-600 mt-1 animate-fade-in">
                                ✓ {saveSuccessMsg}
                            </p>
                        )}
                    </div>

                    {isFirstTimeUser ? (
                        <button
                            onClick={handleSaveProfile}
                            className="border border-neutral-900 bg-neutral-900 text-white rounded-full px-5 py-2 text-xs font-semibold hover:bg-neutral-800 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                            <Check className="w-3.5 h-3.5" />
                            Save Profile
                        </button>
                    ) : isEditing ? (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCancelEdit}
                                className="border border-neutral-300 rounded-full px-4 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5 text-neutral-500" />
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveProfile}
                                className="border border-neutral-900 bg-neutral-900 text-white rounded-full px-4 py-1.5 text-xs font-semibold hover:bg-neutral-800 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                            >
                                <Check className="w-3.5 h-3.5" />
                                Save
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="border border-neutral-300 rounded-full px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                            <Pencil className="w-3.5 h-3.5 text-neutral-500" />
                            Edit
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* Full Name */}
                    <div>
                        <label className="text-xs font-semibold text-neutral-500 mb-1.5 block">
                            Full Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            disabled={!isEditing}
                            value={profile.name}
                            onChange={handleProfileChange}
                            className="w-full border border-neutral-200 rounded-2xl px-4 py-3 text-sm font-medium text-neutral-900 focus:outline-none focus:border-neutral-400 disabled:bg-neutral-50 disabled:text-neutral-700 transition-colors"
                            placeholder="Enter your full name"
                        />
                    </div>

                    {/* Gender */}
                    <div>
                        <label className="text-xs font-semibold text-neutral-500 mb-1.5 block">
                            Gender
                        </label>
                        <CustomSelect
                            name="gender"
                            disabled={!isEditing}
                            value={profile.gender}
                            onChange={handleProfileChange}
                            options={["Female", "Male", "Other"]}
                            placeholder="Select your gender"
                            showPlaceholderInMenu={false}
                            className="rounded-2xl py-3 px-4 bg-white"
                        />
                    </div>

                    {/* Phone Number */}
                    <div>
                        <label className="text-xs font-semibold text-neutral-500 mb-1.5 block">
                            Phone Number
                        </label>
                        <input
                            type="text"
                            name="phone"
                            disabled={!isEditing}
                            value={profile.phone}
                            onChange={handleProfileChange}
                            className="w-full border border-neutral-200 rounded-2xl px-4 py-3 text-sm font-medium text-neutral-900 focus:outline-none focus:border-neutral-400 disabled:bg-neutral-50 disabled:text-neutral-700 transition-colors"
                            placeholder="+91 98765 43210"
                        />
                    </div>

                    {/* Email ID */}
                    <div>
                        <label className="text-xs font-semibold text-neutral-500 mb-1.5 block">
                            Email ID
                        </label>
                        <input
                            type="email"
                            name="email"
                            disabled={!isEditing}
                            value={profile.email}
                            onChange={handleProfileChange}
                            className="w-full border border-neutral-200 rounded-2xl px-4 py-3 text-sm font-medium text-neutral-900 focus:outline-none focus:border-neutral-400 disabled:bg-neutral-50 disabled:text-neutral-700 transition-colors"
                            placeholder="your.email@example.com"
                        />
                    </div>

                    {/* Date of Birth */}
                    <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-neutral-500 mb-1.5 block">
                            Date of Birth
                        </label>
                        <input
                            type="date"
                            name="dob"
                            disabled={!isEditing}
                            value={profile.dob}
                            onChange={handleProfileChange}
                            className="w-full sm:w-1/2 border border-neutral-200 rounded-2xl px-4 py-3 text-sm font-medium text-neutral-900 focus:outline-none focus:border-neutral-400 disabled:bg-neutral-50 disabled:text-neutral-700 transition-colors"
                        />
                    </div>
                </div>
            </section>

            {/* Section 2: Addresses */}
            <section id="addresses-section" className="pt-6 border-t border-neutral-100">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold font-clashDisplay text-neutral-900 tracking-tight">
                        Addresses
                    </h2>
                    <button
                        onClick={handleOpenAddAddress}
                        className="border border-neutral-900 bg-neutral-900 text-white rounded-full px-4 py-1.5 text-xs font-semibold hover:bg-neutral-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add New Address
                    </button>
                </div>

                {addresses.length === 0 ? (
                    <div className="border border-dashed border-neutral-200 rounded-3xl p-8 text-center space-y-3 bg-neutral-50/50">
                        <MapPin className="w-8 h-8 text-neutral-400 mx-auto stroke-[1.2]" />
                        <h4 className="text-sm font-bold text-neutral-900">No Saved Addresses</h4>
                        <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                            You haven&apos;t saved any delivery addresses yet. Click &quot;Add New Address&quot; above to save an address for faster checkout.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {addresses.map((addr) => (
                            <div
                                key={addr._id || addr.id}
                                className="border border-neutral-200/90 rounded-3xl p-5 sm:p-6 bg-white flex flex-col justify-between space-y-4 hover:border-neutral-300 transition-colors"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {addr.label === "Home" ? (
                                                <Home className="w-4 h-4 text-neutral-700 stroke-[1.6]" />
                                            ) : (
                                                <MapPin className="w-4 h-4 text-neutral-700 stroke-[1.6]" />
                                            )}
                                            <span className="font-bold text-sm text-neutral-900">
                                                {addr.name}
                                            </span>
                                        </div>
                                        {addr.isDefault && (
                                            <span className="bg-[#EBE7E1] text-neutral-700 text-[10px] font-semibold px-2.5 py-0.5 rounded-md">
                                                Default
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal space-y-0.5">
                                        <p>{addr.addressLine1}</p>
                                        <p>{addr.addressLine2}</p>
                                        {addr.cityStatePin && <p>{addr.cityStatePin}</p>}
                                        <p className="pt-1 text-neutral-800">{addr.phone}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                                    <button
                                        onClick={() => handleOpenEditAddress(addr)}
                                        className="border border-neutral-300 rounded-full px-3.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                        <Pencil className="w-3 h-3 text-neutral-500" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => triggerRemoveAddressModal(addr._id || addr.id)}
                                        className="border border-neutral-300 rounded-full px-3.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                        <Trash2 className="w-3 h-3 text-neutral-500" />
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Section 3: Account Actions */}
            <section className="pt-6 border-t border-neutral-100">
                <div className="flex flex-wrap items-center gap-4">
                    <button
                        onClick={triggerDeactivateModal}
                        className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 cursor-pointer"
                    >
                        Deactivate Account
                    </button>
                    <span className="text-neutral-300">•</span>
                    <button
                        onClick={triggerDeleteModal}
                        className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                    >
                        Delete Account
                    </button>
                </div>
            </section>

            {/* Add / Edit Address Modal */}
            {isAddAddressOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                            <h3 className="text-lg font-bold font-clashDisplay text-neutral-900">
                                {editingAddressId ? "Edit Address" : "Add New Address"}
                            </h3>
                            <button
                                onClick={() => setIsAddAddressOpen(false)}
                                className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveAddress} className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-neutral-500 mb-1 block">Address Label (Home / Work)</label>
                                <input
                                    type="text"
                                    required
                                    value={newAddress.name}
                                    onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                                    className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-400"
                                    placeholder="e.g. Home, Office"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-neutral-500 mb-1 block">Flat, House No., Building</label>
                                <input
                                    type="text"
                                    required
                                    value={newAddress.addressLine1}
                                    onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                                    className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-400"
                                    placeholder="House / Flat No., Building Name"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-neutral-500 mb-1 block">Street, Area, Landmark</label>
                                <input
                                    type="text"
                                    value={newAddress.addressLine2}
                                    onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                                    className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-400"
                                    placeholder="Street, Area, Landmark"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-neutral-500 mb-1 flex items-center justify-between">
                                    <span>{getPostalRule(newAddress.country).label.replace("*", "")}</span>
                                    {pincodeLoading && <span className="text-[10px] text-amber-600 font-bold animate-pulse">Fetching Location...</span>}
                                </label>
                                <input
                                    type="text"
                                    value={newAddress.pincode}
                                    onChange={handlePincodeChange}
                                    maxLength={getPostalRule(newAddress.country).maxLength}
                                    className={`w-full border rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none transition-colors ${
                                        pincodeError
                                            ? "border-red-400 focus:border-red-500 bg-red-50/20"
                                            : "border-neutral-200 focus:border-neutral-400"
                                    }`}
                                    placeholder={getPostalRule(newAddress.country).placeholder}
                                />
                                {pincodeError && (
                                    <p className="text-[11px] font-semibold text-red-500 mt-1 flex items-center gap-1">
                                        ⚠ {pincodeError}
                                    </p>
                                )}
                            </div>

                            {/* Country Selector */}
                            <CountrySelect
                                label="Country"
                                value={newAddress.country || "IN"}
                                onChange={(e) => {
                                    const selectedCode = e.target.value;
                                    setNewAddress((prev) => {
                                        const updated = { ...prev, country: selectedCode };
                                        if (prev.pincode) {
                                            const check = validatePostalCode(prev.pincode, selectedCode);
                                            setPincodeError(check.isValid ? "" : check.error);
                                        }
                                        if (prev.phone) {
                                            const check = validatePhoneNumber(prev.phone, selectedCode);
                                            setPhoneError(check.error);
                                        }
                                        return updated;
                                    });
                                }}
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-neutral-500 mb-1 block">City & State (Auto-filled)</label>
                                    <input
                                        type="text"
                                        value={newAddress.cityStatePin}
                                        onChange={(e) => setNewAddress({ ...newAddress, cityStatePin: e.target.value })}
                                        className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-400 bg-neutral-50/50"
                                        placeholder="City, State"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-neutral-500 mb-1 block">Phone Number</label>
                                    {(() => {
                                        const countryObj = getCountryByNameOrCode(newAddress.country);
                                        return (
                                            <div className="relative flex items-center">
                                                {countryObj.dialCode && (
                                                    <span className="absolute left-3 text-xs font-bold text-neutral-500 select-none pointer-events-none">
                                                        {countryObj.dialCode}
                                                    </span>
                                                )}
                                                <input
                                                    type="tel"
                                                    maxLength={countryObj.phoneMaxLength || 15}
                                                    value={newAddress.phone}
                                                    onChange={(e) => {
                                                        const rawDigits = e.target.value.replace(/\D/g, "").slice(0, countryObj.phoneMaxLength || 15);
                                                        setNewAddress((prev) => ({ ...prev, phone: rawDigits }));
                                                        if (rawDigits) {
                                                            const check = validatePhoneNumber(rawDigits, newAddress.country);
                                                            setPhoneError(check.error);
                                                        } else {
                                                            setPhoneError("");
                                                        }
                                                    }}
                                                    onBlur={() => {
                                                        if (newAddress.phone) {
                                                            const check = validatePhoneNumber(newAddress.phone, newAddress.country);
                                                            setPhoneError(check.error);
                                                        }
                                                    }}
                                                    className={`w-full border rounded-xl ${countryObj.dialCode ? "pl-12" : "px-3.5"} pr-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none transition-colors ${
                                                        phoneError
                                                            ? "border-red-400 focus:border-red-500 bg-red-50/20"
                                                            : "border-neutral-200 focus:border-neutral-400"
                                                    }`}
                                                    placeholder={countryObj.placeholder}
                                                />
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                            {phoneError && (
                                <p className="text-[11px] font-semibold text-red-500 mt-0.5 flex items-center gap-1">
                                    ⚠ {phoneError}
                                </p>
                            )}

                            <div className="pt-3 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddAddressOpen(false)}
                                    className="flex-1 border border-neutral-200 rounded-xl py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-neutral-900 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                                >
                                    {editingAddressId ? "Save Address" : "Add Address"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
