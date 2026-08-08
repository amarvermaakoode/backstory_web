"use client";

import { useState, useEffect } from "react";
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
import { getImageUrl } from "@/lib/api";

import CustomConfirmModal from "@/components/ui/CustomConfirmModal";

export default function CategoriesAdminPage() {
  const { adminFetch } = useAdminAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Custom Popup Modal State
  const [popupModal, setPopupModal] = useState(null);

  const customConfirm = (message, title = "Confirm Action", confirmText = "Confirm", isDanger = false) => {
    return new Promise((resolve) => {
      setPopupModal({
        type: "confirm",
        title,
        message,
        confirmText,
        cancelText: "Cancel",
        isDanger,
        onConfirm: () => {
          setPopupModal(null);
          resolve(true);
        },
        onCancel: () => {
          setPopupModal(null);
          resolve(false);
        }
      });
    });
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" or "edit"
  const [editingCategory, setEditingCategory] = useState(null);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      setLoading(true);
      setError("");
      const res = await adminFetch("/categories");
      const data = await res.json();

      if (Array.isArray(data)) {
        setCategories(data);
      } else if (data && Array.isArray(data.categories)) {
        setCategories(data.categories);
      } else if (data && Array.isArray(data.data)) {
        setCategories(data.data);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }

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

  const openEditModal = (category) => {
    setModalMode("edit");
    setEditingCategory(category);
    setName(category.Name || ""); // Note capitalized 'Name'
    setSlug(category.slug || "");
    setStatus(category.status === undefined ? true : category.status);
    setImageFile(null);
    setImagePreview(getImageUrl(category.image));
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitLoading(true);

    if (!name.trim()) {
      setError("Category Name is required.");
      setSubmitLoading(false);
      return;
    }

    if (modalMode === "create" && !imageFile) {
      setError("Please upload a category image.");
      setSubmitLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("Name", name.trim());
      formData.append("slug", slug.trim());
      formData.append("status", status);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      let res;
      if (modalMode === "create") {
        res = await adminFetch("/categories", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await adminFetch(`/categories/${editingCategory._id}`, {
          method: "PUT",
          body: formData,
        });
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Failed to ${modalMode} category.`);
      }

      setSuccess(`Category successfully ${modalMode === "create" ? "created" : "updated"}!`);
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred during submission.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteCategory = async (id, catName) => {
    const confirmed = await customConfirm(
      `Are you sure you want to delete the category "${catName}"? This action cannot be undone.`,
      "Delete Category",
      "Delete",
      true
    );
    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      const res = await adminFetch(`/categories/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete category.");
      }

      setSuccess("Category deleted successfully.");
      fetchCategories();
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not delete category.");
    }
  };

  return (
    <div className="space-y-6">

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-clashDisplay text-[5vw] md:text-[3vw] lg:text-[1.8vw] font-semibold tracking-wide text-neutral-900">
            Manage Categories
          </h1>
          <p className="text-sm md:text-lg lg:text-sm text-neutral-500 font-semibold">
            Define high-level product sections (e.g. T-Shirts, Hoodies).
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-neutral-900 text-white hover:bg-neutral-800 font-semibold text-xs tracking-wider uppercase px-4 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add Category
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
            <p className="text-neutral-500 text-xs uppercase tracking-widest font-semibold">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-neutral-500 text-sm font-semibold">No categories found. Click &quot;Add Category&quot; to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-center border-collapse whitespace-nowrap min-w-max">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 text-xs font-semibold uppercase tracking-widest whitespace-nowrap">
                  <th className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/4">Image</th>
                  <th className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/4">Category Name</th>
                  <th className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/4">Status</th>
                  <th className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {categories.map((category) => (
                  <tr key={category._id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/4">
                      <div className="relative w-11 h-11 md:w-14 md:h-14 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 mx-auto">
                        <Image
                          src={getImageUrl(category.image)}
                          alt={category.Name || "Category"}
                          fill
                          sizes="56px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/4 font-semibold text-neutral-900 text-sm">
                      {category.Name}
                    </td>
                    <td className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${category.status !== false
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${category.status !== false ? "bg-emerald-500" : "bg-neutral-400"}`}></span>
                        {category.status !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/4">
                      <div className="flex items-center justify-center gap-2 sm:gap-3">
                        <button
                          onClick={() => openEditModal(category)}
                          className="p-1.5 sm:p-2 text-neutral-600 hover:text-neutral-900 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg transition-all shadow-xs cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category._id, category.Name)}
                          className="p-1.5 sm:p-2 text-red-600 hover:text-red-500 bg-white hover:bg-red-50 border border-neutral-200 rounded-lg transition-all shadow-xs cursor-pointer"
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
              <h3 className="font-clashDisplay text-lg font-semibold text-neutral-900">
                {modalMode === "create" ? "Add Category" : "Edit Category"}
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

              {/* Category Name */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-semibold">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. T-Shirts"
                  className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:border-[#a39889] focus:ring-1 focus:ring-[#dfd7cc]/50 rounded-xl py-3 px-4 outline-none text-sm transition-all duration-300 focus:bg-white"
                />
              </div>

              {/* Category Slug */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-semibold">
                  Slug (Optional)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. t-shirts (auto-generated if left blank)"
                  className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:border-[#a39889] focus:ring-1 focus:ring-[#dfd7cc]/50 rounded-xl py-3 px-4 outline-none text-sm transition-all duration-300 focus:bg-white"
                />
              </div>

              {/* Status Toggle */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-semibold">
                  Category Status
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus(!status)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors outline-none ${status ? "bg-[#dfd7cc]" : "bg-neutral-200"
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${status ? "translate-x-6" : "translate-x-1"
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
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-semibold">
                  Category Image
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
                      <p className="text-xs text-neutral-500 font-semibold tracking-wide">
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
                  className="px-5 py-3 border border-neutral-200 hover:bg-neutral-50 text-neutral-600 hover:text-neutral-800 rounded-xl text-xs uppercase tracking-widest font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="bg-neutral-900 text-white hover:bg-neutral-800 px-5 py-3 rounded-xl text-xs uppercase tracking-widest font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-xs"
                >
                  {submitLoading && <Loader className="w-3.5 h-3.5 animate-spin" />}
                  {modalMode === "create" ? "Save Category" : "Update Category"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Custom Popup Modal */}
      <CustomConfirmModal modalData={popupModal} />
    </div>
  );
}
