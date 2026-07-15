"use client";

import React, { useState, useEffect } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Loader, 
  Upload, 
  X, 
  Check, 
  AlertTriangle 
} from "lucide-react";
import Image from "next/image";

export default function CollectionsAdminPage() {
  const { adminFetch } = useAdminAuth();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" or "edit"
  const [editingCollection, setEditingCollection] = useState(null);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await adminFetch("/collections");
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setCollections(data);
      } else if (data && Array.isArray(data.data)) {
        setCollections(data.data);
      } else {
        setCollections([]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch collections. Please verify backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return "/images/placeholder.png";
    if (path.startsWith("http")) return path;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    return `${apiBase}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const openCreateModal = () => {
    setModalMode("create");
    setName("");
    setSlug("");
    setStatus(true);
    setImageFile(null);
    setImagePreview("");
    setIsModalOpen(true);
  };

  const openEditModal = (collection) => {
    setModalMode("edit");
    setEditingCollection(collection);
    setName(collection.Name || ""); // Note capitalized 'Name' in Collection schema
    setSlug(collection.slug || "");
    setStatus(collection.status === undefined ? true : collection.status);
    setImageFile(null);
    setImagePreview(getImageUrl(collection.image));
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitLoading(true);

    if (!name.trim()) {
      setError("Collection name is required.");
      setSubmitLoading(false);
      return;
    }

    if (modalMode === "create" && !imageFile) {
      setError("Please upload an image file.");
      setSubmitLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("Name", name.trim()); // Capitalized 'Name' in Collection schema
      formData.append("slug", slug.trim());
      formData.append("status", status);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      let res;
      if (modalMode === "create") {
        res = await adminFetch("/collections", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await adminFetch(`/collections/${editingCollection._id}`, {
          method: "PUT",
          body: formData,
        });
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Failed to ${modalMode} collection.`);
      }

      setSuccess(`Collection successfully ${modalMode === "create" ? "created" : "updated"}!`);
      setIsModalOpen(false);
      fetchCollections();
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred during submission.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteCollection = async (id, collName) => {
    if (!window.confirm(`Are you sure you want to delete the collection "${collName}"?`)) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      const res = await adminFetch(`/collections/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete collection.");
      }

      setSuccess("Collection deleted successfully.");
      fetchCollections();
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not delete collection.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-clashDisplay text-2xl font-bold tracking-wide text-neutral-900">
            Manage Collections
          </h1>
          <p className="text-sm text-neutral-500 font-semibold">
            Define thematic lines or story drops (e.g. Biker Series, Retro Capsule).
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-neutral-900 text-white hover:bg-neutral-800 font-bold text-xs tracking-wider uppercase px-4 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add Collection
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2 font-medium">
          <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <p>{success}</p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600" />
          <p>{error}</p>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader className="w-8 h-8 animate-spin text-neutral-800" />
            <p className="text-neutral-500 text-xs uppercase tracking-widest font-semibold">Loading collections...</p>
          </div>
        ) : collections.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-neutral-500 text-sm font-semibold">No collections found. Click "Add Collection" to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 text-xs font-bold uppercase tracking-widest">
                  <th className="py-4 px-6">Image</th>
                  <th className="py-4 px-6">Collection Name</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {collections.map((collection) => (
                  <tr key={collection._id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50">
                        <Image
                          src={getImageUrl(collection.image)}
                          alt={collection.Name || "Collection"}
                          fill
                          sizes="56px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </td>
                    <td className="py-4 px-6 font-bold text-neutral-900 text-sm">
                      {collection.Name}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        collection.status !== false
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${collection.status !== false ? "bg-emerald-500" : "bg-neutral-400"}`}></span>
                        {collection.status !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => openEditModal(collection)}
                          className="p-2 text-neutral-600 hover:text-neutral-900 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg transition-all shadow-xs"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCollection(collection._id, collection.Name)}
                          className="p-2 text-red-600 hover:text-red-500 bg-white hover:bg-red-50 border border-neutral-200 rounded-lg transition-all shadow-xs"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal - Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-100">
              <h3 className="font-clashDisplay text-lg font-bold text-neutral-900">
                {modalMode === "create" ? "Add Collection" : "Edit Collection"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              
              {/* Collection Name */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-bold">
                  Collection Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Biker Series"
                  className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:border-[#a39889] focus:ring-1 focus:ring-[#dfd7cc]/50 rounded-xl py-3 px-4 outline-none text-sm transition-all duration-300 focus:bg-white"
                />
              </div>

              {/* Collection Slug */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-bold">
                  Slug (Optional)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. wanderlust-collection (auto-generated if left blank)"
                  className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:border-[#a39889] focus:ring-1 focus:ring-[#dfd7cc]/50 rounded-xl py-3 px-4 outline-none text-sm transition-all duration-300 focus:bg-white"
                />
              </div>

              {/* Status Toggle */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-bold">
                  Collection Status
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus(!status)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors outline-none ${
                      status ? "bg-[#dfd7cc]" : "bg-neutral-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        status ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="text-sm text-neutral-600 font-semibold">
                    {status ? "Active (visible on website)" : "Inactive (hidden)"}
                  </span>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-bold">
                  Collection Image
                </label>
                
                {imagePreview ? (
                  <div className="relative w-full h-40 bg-neutral-50 border border-neutral-200 rounded-xl overflow-hidden mb-3 group">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview("");
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-neutral-200 hover:border-[#a39889] rounded-xl cursor-pointer bg-neutral-50 hover:bg-neutral-100/40 transition-all duration-300">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-neutral-400 mb-2" />
                      <p className="text-xs text-neutral-500 font-bold tracking-wide">
                        Click to upload image file
                      </p>
                      <p className="text-[10px] text-neutral-400 uppercase mt-1 font-semibold">
                        PNG, JPG or WEBP (Max 5MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 border border-neutral-200 hover:bg-neutral-50 text-neutral-600 hover:text-neutral-800 rounded-xl text-xs uppercase tracking-widest font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="bg-neutral-900 text-white hover:bg-neutral-800 px-5 py-3 rounded-xl text-xs uppercase tracking-widest font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-xs"
                >
                  {submitLoading && <Loader className="w-3.5 h-3.5 animate-spin" />}
                  {modalMode === "create" ? "Save Collection" : "Update Collection"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
