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
import CustomSelect from "@/components/ui/CustomSelect";
import CustomConfirmModal from "@/components/ui/CustomConfirmModal";
import AdminPagination from "@/components/ui/AdminPagination";

export default function SubCategoriesAdminPage() {
  const { adminFetch } = useAdminAuth();
  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(subCategories.length / ITEMS_PER_PAGE);
  const activePage = currentPage > totalPages && totalPages > 0 ? totalPages : currentPage;
  const paginatedSubCategories = subCategories.slice((activePage - 1) * ITEMS_PER_PAGE, activePage * ITEMS_PER_PAGE);

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
  const [editingSubCategory, setEditingSubCategory] = useState(null);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      setLoading(true);
      setError("");

      // Fetch Categories first (needed for the dropdown)
      const catRes = await adminFetch("/categories");
      const catData = await catRes.json();
      const loadedCats = Array.isArray(catData) ? catData : (catData && Array.isArray(catData.data) ? catData.data : []);
      setCategories(loadedCats);

      // Fetch Sub-Categories
      const subRes = await adminFetch("/sub-categories");
      const subData = await subRes.json();
      const loadedSubs = Array.isArray(subData) ? subData : (subData && Array.isArray(subData.data) ? subData.data : []);
      setSubCategories(loadedSubs);

    } catch (err) {
      console.error(err);
      setError("Failed to fetch data. Please check if the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  const getCategoryName = (catRef) => {
    if (!catRef) return "Unassigned";
    const catId = typeof catRef === "object" ? catRef._id : catRef;
    const match = categories.find((c) => c._id === catId);
    return match ? match.Name : "Unassigned";
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
    setCategoryId(categories.length > 0 ? categories[0]._id : "");
    setStatus(true);
    setImageFile(null);
    setImagePreview("");
    setIsModalOpen(true);
  };

  const openEditModal = (subCat) => {
    setModalMode("edit");
    setEditingSubCategory(subCat);
    setName(subCat.name || ""); // Note lowercase 'name' in SubCategory schema
    setSlug(subCat.slug || "");
    const catId = typeof subCat.category === "object" ? subCat.category?._id : subCat.category;
    setCategoryId(catId || "");
    setStatus(subCat.status === undefined ? true : subCat.status);
    setImageFile(null);
    setImagePreview(getImageUrl(subCat.image));
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitLoading(true);

    if (!name.trim()) {
      setError("Sub-Category name is required.");
      setSubmitLoading(false);
      return;
    }

    if (!categoryId) {
      setError("Please select a parent Category.");
      setSubmitLoading(false);
      return;
    }

    if (modalMode === "create" && !imageFile) {
      setError("Please upload an image.");
      setSubmitLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name.trim()); // Lowercase 'name' in subcategory schema
      formData.append("slug", slug.trim());
      formData.append("category", categoryId);
      formData.append("status", status);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      let res;
      if (modalMode === "create") {
        res = await adminFetch("/sub-categories", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await adminFetch(`/sub-categories/${editingSubCategory._id}`, {
          method: "PUT",
          body: formData,
        });
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Failed to ${modalMode} sub-category.`);
      }

      setSuccess(`Sub-Category successfully ${modalMode === "create" ? "created" : "updated"}!`);
      setIsModalOpen(false);
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred during submission.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteSubCategory = async (id, subName) => {
    const confirmed = await customConfirm(
      `Are you sure you want to delete the sub-category "${subName}"? This action cannot be undone.`,
      "Delete Sub-Category",
      "Delete",
      true
    );
    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      const res = await adminFetch(`/sub-categories/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete sub-category.");
      }

      setSuccess("Sub-Category deleted successfully.");
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not delete sub-category.");
    }
  };

  return (
    <div className="space-y-6">

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-clashDisplay text-[5vw] md:text-[3vw] lg:text-[1.8vw] font-semibold tracking-wide text-neutral-900">
            Manage Sub-Categories
          </h1>
          <p className="text-sm md:text-lg lg:text-sm text-neutral-500 font-semibold">            Create refined collections nested under parent categories.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          disabled={categories.length === 0}
          className="bg-neutral-900 text-white hover:bg-neutral-800 font-semibold text-xs tracking-wider uppercase px-4 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Sub-Category
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

      {/* Categories Check Warning */}
      {!loading && categories.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm font-semibold">
          <p>⚠️ You must create at least one <strong>Category</strong> before you can add Sub-Categories.</p>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader className="w-8 h-8 animate-spin text-neutral-800" />
            <p className="text-neutral-500 text-xs uppercase tracking-widest font-semibold">Loading sub-categories...</p>
          </div>
        ) : subCategories.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-neutral-500 text-sm font-semibold">No sub-categories found. Click &quot;Add Sub-Category&quot; to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-center border-collapse whitespace-nowrap min-w-max">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 text-xs font-semibold uppercase tracking-widest whitespace-nowrap">
                  <th className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/5">Image</th>
                  <th className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/5">Sub-Category Name</th>
                  <th className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/5">Parent Category</th>
                  <th className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/5">Status</th>
                  <th className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {paginatedSubCategories.map((subCategory) => (
                  <tr key={subCategory._id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/5">
                      <div className="relative w-11 h-11 md:w-14 md:h-14 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 mx-auto">
                        <Image
                          src={getImageUrl(subCategory.image)}
                          alt={subCategory.name || "SubCategory"}
                          fill
                          sizes="56px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/5 font-semibold text-neutral-900 text-sm">
                      {subCategory.name}
                    </td>
                    <td className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/5 text-neutral-700 text-sm">
                      <span className="bg-neutral-50 px-2.5 py-1 rounded-lg border border-neutral-200 text-xs uppercase tracking-wider font-semibold text-neutral-500">
                        {getCategoryName(subCategory.category)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${subCategory.status !== false
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${subCategory.status !== false ? "bg-emerald-500" : "bg-neutral-400"}`}></span>
                        {subCategory.status !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/5">
                      <div className="flex items-center justify-center gap-2 sm:gap-3">
                        <button
                          onClick={() => openEditModal(subCategory)}
                          className="p-1.5 sm:p-2 text-neutral-600 hover:text-neutral-900 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg transition-all shadow-xs cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSubCategory(subCategory._id, subCategory.name)}
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
        <div className="px-6 pb-6">
          <AdminPagination
            currentPage={activePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={subCategories.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>
      </div>

      {/* Modal - Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-100">
              <h3 className="font-clashDisplay text-lg font-semibold text-neutral-900">
                {modalMode === "create" ? "Add Sub-Category" : "Edit Sub-Category"}
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

              {/* Sub-Category Name */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-semibold">
                  Sub-Category Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Graphic Tees"
                  className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:border-[#a39889] focus:ring-1 focus:ring-[#dfd7cc]/50 rounded-xl py-3 px-4 outline-none text-sm transition-all duration-300 focus:bg-white"
                />
              </div>

              {/* Sub-Category Slug */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-semibold">
                  Slug (Optional)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. graphic-tees (auto-generated if left blank)"
                  className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:border-[#a39889] focus:ring-1 focus:ring-[#dfd7cc]/50 rounded-xl py-3 px-4 outline-none text-sm transition-all duration-300 focus:bg-white"
                />
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-semibold">
                  Parent Category
                </label>
                <CustomSelect
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  placeholder="Select Category"
                  options={categories
                    .filter((cat) => cat.status !== false)
                    .map((cat) => ({ value: cat._id, label: cat.Name }))}
                />
              </div>

              {/* Status Toggle */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-semibold">
                  Sub-Category Status
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
                  Sub-Category Image
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
                  {modalMode === "create" ? "Save Sub-Category" : "Update Sub-Category"}
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
