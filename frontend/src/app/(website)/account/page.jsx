"use client";

import { useState } from "react";
import { useUserAuth } from "@/context/UserAuthContext";
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
    const { user, logout } = useUserAuth();

    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState({
        name: user?.name || "Kritika Sharma",
        gender: "Female",
        phone: user?.phone || "+91 98765 43210",
        email: user?.email || "kritika@example.com",
        dob: "1998-05-14",
    });

    const [addresses, setAddresses] = useState([
        {
            id: 1,
            name: "Home",
            label: "Home",
            recipientName: "Kritika Sharma",
            isDefault: true,
            addressLine1: "B-84, Rajouri Garden, West Delhi,",
            addressLine2: "New Delhi – 110027",
            cityStatePin: "",
            phone: "+91 98765 43210",
        },
        {
            id: 2,
            name: "John Doe",
            label: "Work",
            isDefault: false,
            addressLine1: "4th Floor, WeWork Blue One Square,",
            addressLine2: "Udyog Vihar Phase IV,",
            cityStatePin: "Gurugram, Haryana – 122016",
            phone: "+91 98765 43210",
        },
    ]);

    // Add address modal state
    const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
    const [newAddress, setNewAddress] = useState({
        name: "",
        label: "Home",
        addressLine1: "",
        addressLine2: "",
        cityStatePin: "",
        phone: "",
    });

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = () => {
        setIsEditing(false);
    };

    const handleAddAddress = (e) => {
        e.preventDefault();
        if (!newAddress.name || !newAddress.addressLine1) return;

        const created = {
            id: Date.now(),
            ...newAddress,
            isDefault: addresses.length === 0,
        };
        setAddresses([...addresses, created]);
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

    const handleRemoveAddress = (id) => {
        setAddresses(addresses.filter((addr) => addr.id !== id));
    };

    return (
        <div className="space-y-10 sm:space-y-12">
            {/* Section 1: Profile Details */}
            <section id="profile-details">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold font-clashDisplay text-neutral-900 tracking-tight">
                        Profile Details
                    </h2>
                    {isEditing ? (
                        <button
                            onClick={handleSaveProfile}
                            className="border border-neutral-900 bg-neutral-900 text-white rounded-full px-4 py-1.5 text-xs font-semibold hover:bg-neutral-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                            <Check className="w-3.5 h-3.5" />
                            Save
                        </button>
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
                        />
                    </div>

                    {/* Gender */}
                    <div>
                        <label className="text-xs font-semibold text-neutral-500 mb-1.5 block">
                            Gender
                        </label>
                        <select
                            name="gender"
                            disabled={!isEditing}
                            value={profile.gender}
                            onChange={handleProfileChange}
                            className="w-full border border-neutral-200 rounded-2xl px-4 py-3 text-sm font-medium text-neutral-900 focus:outline-none focus:border-neutral-400 disabled:bg-neutral-50 disabled:text-neutral-700 transition-colors bg-white"
                        >
                            <option value="Female">Female</option>
                            <option value="Male">Male</option>
                            <option value="Other">Other</option>
                        </select>
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
                        onClick={() => setIsAddAddressOpen(true)}
                        className="border border-neutral-900 bg-neutral-900 text-white rounded-full px-4 py-1.5 text-xs font-semibold hover:bg-neutral-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add New Address
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                        <div
                            key={addr.id}
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
                                <button className="border border-neutral-300 rounded-full px-3.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-1.5 transition-colors cursor-pointer">
                                    <Pencil className="w-3 h-3 text-neutral-500" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleRemoveAddress(addr.id)}
                                    className="border border-neutral-300 rounded-full px-3.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                    <Trash2 className="w-3 h-3 text-neutral-500" />
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Section 3: Account Actions & Logout */}
            <section className="pt-6 border-t border-neutral-100 space-y-4">
                <div>
                    <p className="text-xs font-semibold text-neutral-400 mb-1">
                        Deactivate Account
                    </p>
                    <button className="text-xs font-bold text-red-600 hover:underline cursor-pointer">
                        Delete Account
                    </button>
                </div>

                <div className="pt-2">
                    <button
                        onClick={logout}
                        className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
                    >
                        <LogOut className="w-4 h-4 stroke-[1.6]" />
                        <span>Logout</span>
                    </button>
                </div>
            </section>

            {/* Add Address Modal */}
            {isAddAddressOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                            <h3 className="text-lg font-bold font-clashDisplay text-neutral-900">Add New Address</h3>
                            <button
                                onClick={() => setIsAddAddressOpen(false)}
                                className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddAddress} className="space-y-3">
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

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-neutral-500 mb-1 block">City & Pincode</label>
                                    <input
                                        type="text"
                                        value={newAddress.cityStatePin}
                                        onChange={(e) => setNewAddress({ ...newAddress, cityStatePin: e.target.value })}
                                        className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-400"
                                        placeholder="Gurugram, 122011"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-neutral-500 mb-1 block">Phone Number</label>
                                    <input
                                        type="text"
                                        value={newAddress.phone}
                                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                                        className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-400"
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                            </div>

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
                                    Add Address
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
