"use client";

import React, { useState, useEffect } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Loader, 
  X, 
  Check, 
  AlertTriangle,
  Upload,
  Image as ImageIcon
} from "lucide-react";
import Image from "next/image";

export default function ProductsAdminPage() {
  const { adminFetch } = useAdminAuth();
  
  // Catalogs
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]); // Filtered list based on category selection
  const [sizeGuides, setSizeGuides] = useState([]);
  const [allColors, setAllColors] = useState([]);

  // States
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" or "edit"
  const [editingProduct, setEditingProduct] = useState(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedSizeGuide, setSelectedSizeGuide] = useState("");
  const [description, setDescription] = useState("");
  const [material, setMaterial] = useState("");
  const [fit, setFit] = useState("");
  const [weight, setWeight] = useState("");
  const [care, setCare] = useState("");
  const [status, setStatus] = useState(true);
  const [featured, setFeatured] = useState(false);

  // Selected colors with local image previews and files
  // Structure: { colorId: string, name: string, hexCode: string, existingImages: [string], newFiles: [File], newPreviews: [string] }
  const [productColors, setProductColors] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchSubCategories(selectedCategory);
    } else {
      setSubCategories([]);
    }
  }, [selectedCategory]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Fetch Products, Categories, Size Guides, Colors in parallel
      const [prodRes, catRes, sizeRes, colorRes] = await Promise.all([
        adminFetch("/products"),
        adminFetch("/categories"),
        adminFetch("/size-guides"),
        adminFetch("/colors")
      ]);

      const [prodData, catData, sizeData, colorData] = await Promise.all([
        prodRes.json(),
        catRes.json(),
        sizeRes.json(),
        colorRes.json()
      ]);

      setProducts(prodData.data || prodData || []);
      setCategories(catData.data || catData || []);
      setSizeGuides(sizeData.data || sizeData || []);
      setAllColors((colorData.data || colorData || []).filter(c => c.status !== false));
    } catch (err) {
      console.error(err);
      setError("Failed to load backend catalogs. Please check server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubCategories = async (categoryId) => {
    try {
      const res = await adminFetch(`/sub-categories/category/${categoryId}`);
      const data = await res.json();
      setSubCategories(data.data || data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return "/images/placeholder.png";
    if (path.startsWith("http")) return path;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    return `${apiBase}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  const openCreateModal = () => {
    setModalMode("create");
    setTitle("");
    setPrice("");
    setSelectedCategory("");
    setSelectedSubCategory("");
    setSelectedSizeGuide("");
    setDescription("");
    setMaterial("");
    setFit("");
    setWeight("");
    setCare("");
    setStatus(true);
    setFeatured(false);
    setProductColors([]);
    setIsModalOpen(true);
  };

  const openEditModal = async (product) => {
    setModalMode("edit");
    setEditingProduct(product);
    setTitle(product.title || "");
    setPrice(product.price || "");
    
    // Set category & subcategory IDs (handling populate objects or IDs)
    const catId = product.category?._id || product.category || "";
    const subCatId = product.subCategory?._id || product.subCategory || "";
    const sizeGuideId = product.sizeGuide?._id || product.sizeGuide || "";
    
    // Explicitly load subcategories for category first
    if (catId) {
      await fetchSubCategories(catId);
    }

    setSelectedCategory(catId);
    setSelectedSubCategory(subCatId);
    setSelectedSizeGuide(sizeGuideId);
    
    setDescription(product.description || "");
    setMaterial(product.material || "");
    setFit(product.fit || "");
    setWeight(product.weight || "");
    setCare(product.care || "");
    setStatus(product.status === undefined ? true : product.status);
    setFeatured(product.featured === undefined ? false : product.featured);

    // Map existing colors
    const mappedColors = (product.colors || []).map(item => {
      const colorObj = item.color;
      return {
        colorId: colorObj?._id || colorObj || "",
        name: colorObj?.name || "Unknown Color",
        hexCode: colorObj?.hexCode || "#CCCCCC",
        existingImages: item.images || [],
        newFiles: [],
        newPreviews: []
      };
    });
    setProductColors(mappedColors);
    
    setIsModalOpen(true);
  };

  const handleAddColor = (colorId) => {
    if (!colorId) return;
    if (productColors.some(c => c.colorId === colorId)) return;

    const color = allColors.find(c => c._id === colorId);
    if (!color) return;

    setProductColors([...productColors, {
      colorId: color._id,
      name: color.name,
      hexCode: color.hexCode,
      existingImages: [],
      newFiles: [],
      newPreviews: []
    }]);
  };

  const handleRemoveColor = (colorId) => {
    setProductColors(productColors.filter(c => c.colorId !== colorId));
  };

  const handleColorImageUpload = (colorId, e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const matchedIndex = productColors.findIndex(c => c.colorId === colorId);
    if (matchedIndex === -1) return;

    const targetColor = productColors[matchedIndex];
    const newFiles = [...targetColor.newFiles, ...files];
    const newPreviews = [...targetColor.newPreviews];

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        const updatedColors = [...productColors];
        updatedColors[matchedIndex] = {
          ...targetColor,
          newFiles,
          newPreviews: [...newPreviews]
        };
        setProductColors(updatedColors);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveExistingImage = (colorId, imgPath) => {
    const matchedIndex = productColors.findIndex(c => c.colorId === colorId);
    if (matchedIndex === -1) return;

    const targetColor = productColors[matchedIndex];
    const updatedColors = [...productColors];
    updatedColors[matchedIndex] = {
      ...targetColor,
      existingImages: targetColor.existingImages.filter(img => img !== imgPath)
    };
    setProductColors(updatedColors);
  };

  const handleRemoveNewImage = (colorId, imgIndex) => {
    const matchedIndex = productColors.findIndex(c => c.colorId === colorId);
    if (matchedIndex === -1) return;

    const targetColor = productColors[matchedIndex];
    const updatedColors = [...productColors];
    updatedColors[matchedIndex] = {
      ...targetColor,
      newFiles: targetColor.newFiles.filter((_, idx) => idx !== imgIndex),
      newPreviews: targetColor.newPreviews.filter((_, idx) => idx !== imgIndex)
    };
    setProductColors(updatedColors);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitLoading(true);

    if (!selectedCategory || !selectedSubCategory || !selectedSizeGuide) {
      setError("Category, Sub-Category, and Size Guide selections are required.");
      setSubmitLoading(false);
      return;
    }

    if (productColors.length === 0) {
      setError("At least one color variant is required.");
      setSubmitLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("price", Number(price));
      formData.append("category", selectedCategory);
      formData.append("subCategory", selectedSubCategory);
      formData.append("sizeGuide", selectedSizeGuide);
      formData.append("description", description.trim());
      formData.append("material", material.trim());
      formData.append("fit", fit.trim());
      formData.append("weight", weight.trim());
      formData.append("care", care.trim());
      formData.append("status", status);
      formData.append("featured", featured);

      // Serialize colors array mapping color references & existing images
      const colorsPayload = productColors.map(c => ({
        color: c.colorId,
        images: c.existingImages // keeps current files intact
      }));
      formData.append("colors", JSON.stringify(colorsPayload));

      // Append files with fieldname matching color_images_<colorId>
      productColors.forEach(c => {
        c.newFiles.forEach(file => {
          formData.append(`color_images_${c.colorId}`, file);
        });
      });

      let res;
      if (modalMode === "create") {
        res = await adminFetch("/products", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await adminFetch(`/products/${editingProduct._id}`, {
          method: "PUT",
          body: formData,
        });
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Failed to ${modalMode} product.`);
      }

      setSuccess(`Product successfully ${modalMode === "create" ? "created" : "updated"}!`);
      setIsModalOpen(false);
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred during submission.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteProduct = async (id, prodTitle) => {
    if (!window.confirm(`Are you sure you want to delete the product "${prodTitle}"?`)) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      const res = await adminFetch(`/products/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete product.");
      }

      setSuccess("Product deleted successfully.");
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not delete product.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-clashDisplay text-2xl font-bold tracking-wide text-neutral-900">
            Manage Products
          </h1>
          <p className="text-sm text-neutral-500 font-semibold">
            Create and edit product details, colors, sizing guides, and care instructions.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-neutral-900 text-white hover:bg-neutral-800 font-bold text-xs tracking-wider uppercase px-4 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add Product
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
            <p className="text-neutral-500 text-xs uppercase tracking-widest font-semibold">Loading catalog...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-neutral-500 text-sm font-semibold">No products found. Click "Add Product" to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 text-xs font-bold uppercase tracking-widest">
                  <th className="py-4 px-6">Image</th>
                  <th className="py-4 px-6">Product Title</th>
                  <th className="py-4 px-6">Category/Sub</th>
                  <th className="py-4 px-6">Price</th>
                  <th className="py-4 px-6">Colors</th>
                  <th className="py-4 px-6">Featured</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products.map((product) => {
                  // Grab first image of first color to render as main thumbnail
                  const defaultImg = product.colors?.[0]?.images?.[0] || "";
                  
                  return (
                    <tr key={product._id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50 flex items-center justify-center">
                          {defaultImg ? (
                            <Image
                              src={getImageUrl(defaultImg)}
                              alt={product.title}
                              fill
                              sizes="48px"
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-neutral-400" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-neutral-900 text-sm truncate max-w-xs">
                          {product.title}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-neutral-900 text-xs font-bold">{product.category?.Name || "-"}</div>
                        <div className="text-neutral-500 text-[10px] font-semibold tracking-wide uppercase">{product.subCategory?.name || "-"}</div>
                      </td>
                      <td className="py-4 px-6 font-semibold text-neutral-900 text-sm">
                        Rs {Number(product.price)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1">
                          {(product.colors || []).map((c, i) => (
                            <div 
                              key={i}
                              className="w-4 h-4 rounded-full border border-neutral-300 shadow-xs"
                              style={{ backgroundColor: c.color?.hexCode || "#CCCCCC" }}
                              title={c.color?.name || "Color"}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          product.featured
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-neutral-50 text-neutral-400 border border-neutral-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${product.featured ? "bg-amber-500" : "bg-neutral-300"}`}></span>
                          {product.featured ? "Featured" : "No"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          product.status !== false
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${product.status !== false ? "bg-emerald-500" : "bg-neutral-400"}`}></span>
                          {product.status !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-2 text-neutral-600 hover:text-neutral-900 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg transition-all shadow-xs"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id, product.title)}
                            className="p-2 text-red-600 hover:text-red-500 bg-white hover:bg-red-50 border border-neutral-200 rounded-lg transition-all shadow-xs"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal - Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-neutral-200 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden relative my-8 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 bg-neutral-50/50 flex-shrink-0">
              <h3 className="font-clashDisplay text-lg font-bold text-neutral-900">
                {modalMode === "create" ? "Add Product" : "Edit Product"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Form */}
            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Basic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Title */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-bold">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Vintage Oversized Tee"
                    className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:border-[#a39889] focus:ring-1 focus:ring-[#dfd7cc]/50 rounded-xl py-3 px-4 outline-none text-sm transition-all duration-300 focus:bg-white"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-bold">
                    Price (Rs) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 29.99"
                    className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:border-[#a39889] focus:ring-1 focus:ring-[#dfd7cc]/50 rounded-xl py-3 px-4 outline-none text-sm transition-all duration-300 focus:bg-white"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-bold">
                    Category *
                  </label>
                  <select
                    required
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedSubCategory(""); // reset subcategory
                    }}
                    className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:border-[#a39889] focus:ring-1 focus:ring-[#dfd7cc]/50 rounded-xl py-3 px-4 outline-none text-sm transition-all duration-300 focus:bg-white cursor-pointer font-semibold"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.Name}</option>
                    ))}
                  </select>
                </div>

                {/* Subcategory */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-bold">
                    Sub-Category *
                  </label>
                  <select
                    required
                    disabled={!selectedCategory}
                    value={selectedSubCategory}
                    onChange={(e) => setSelectedSubCategory(e.target.value)}
                    className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:border-[#a39889] focus:ring-1 focus:ring-[#dfd7cc]/50 rounded-xl py-3 px-4 outline-none text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:bg-white cursor-pointer font-semibold"
                  >
                    <option value="">Select Sub-Category</option>
                    {subCategories.map((sc) => (
                      <option key={sc._id} value={sc._id}>{sc.name}</option>
                    ))}
                  </select>
                </div>

                {/* Size Guide */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-bold">
                    Size Guide *
                  </label>
                  <select
                    required
                    value={selectedSizeGuide}
                    onChange={(e) => setSelectedSizeGuide(e.target.value)}
                    className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:border-[#a39889] focus:ring-1 focus:ring-[#dfd7cc]/50 rounded-xl py-3 px-4 outline-none text-sm transition-all duration-300 focus:bg-white cursor-pointer font-semibold"
                  >
                    <option value="">Select Size Guide</option>
                    {sizeGuides.map((sg) => (
                      <option key={sg._id} value={sg._id}>{sg.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status & Featured */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-bold">
                    Status
                  </label>
                  <div className="flex items-center gap-3 py-1.5">
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

                {/* Featured */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-bold">
                    Featured
                  </label>
                  <div className="flex items-center gap-3 py-1.5">
                    <button
                      type="button"
                      onClick={() => setFeatured(!featured)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors outline-none ${
                        featured ? "bg-[#dfd7cc]" : "bg-neutral-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          featured ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span className="text-sm text-neutral-600 font-semibold">
                      {featured ? "Featured Product" : "Regular Product"}
                    </span>
                  </div>
                </div>

              </div>

              <hr className="border-neutral-200" />

              {/* Color Specific Image Upload Block */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-clashDisplay font-bold text-neutral-900 text-sm uppercase tracking-wider">
                      Color Variants & Images *
                    </h4>
                    <p className="text-xs text-neutral-500 font-semibold">Select colors and upload their respective images.</p>
                  </div>
                  <select
                    value=""
                    onChange={(e) => {
                      handleAddColor(e.target.value);
                      e.target.value = ""; // reset dropdown selection
                    }}
                    className="bg-neutral-50 border border-neutral-200 rounded-xl py-2 px-3 text-xs outline-none cursor-pointer font-bold focus:bg-white max-w-xs"
                  >
                    <option value="">+ Add Color Variant</option>
                    {allColors.map((color) => (
                      <option key={color._id} value={color._id}>{color.name}</option>
                    ))}
                  </select>
                </div>

                {productColors.length === 0 ? (
                  <div className="py-6 border-2 border-dashed border-neutral-200 rounded-xl text-center bg-neutral-50/50">
                    <p className="text-neutral-500 text-xs font-semibold uppercase tracking-wider">
                      No colors added yet. Select a color above to upload images.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {productColors.map((pc, cIdx) => (
                      <div key={pc.colorId} className="border border-neutral-200 rounded-xl p-4 bg-neutral-50/50 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-6 h-6 rounded-full border border-neutral-300 shadow-xs" 
                            style={{ backgroundColor: pc.hexCode }}
                          />
                          <div>
                            <div className="font-bold text-neutral-800 text-sm">{pc.name}</div>
                            <div className="text-neutral-500 font-mono text-[10px] uppercase">{pc.hexCode}</div>
                          </div>
                        </div>

                        {/* Image Previews / Upload Area */}
                        <div className="flex-1 flex flex-wrap gap-2.5 items-center justify-start md:justify-end">
                          
                          {/* Render Existing Images (for edit mode) */}
                          {pc.existingImages.map((img, iIdx) => (
                            <div key={`exist-${iIdx}`} className="relative w-16 h-16 border border-neutral-200 rounded-lg overflow-hidden bg-white group">
                              <Image 
                                src={getImageUrl(img)} 
                                alt="Existing" 
                                fill 
                                className="object-cover" 
                                unoptimized
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveExistingImage(pc.colorId, img)}
                                className="absolute top-1 right-1 p-0.5 bg-black/70 hover:bg-black text-white rounded-full transition-all"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}

                          {/* Render Newly Selected Previews */}
                          {pc.newPreviews.map((preview, nIdx) => (
                            <div key={`new-${nIdx}`} className="relative w-16 h-16 border border-emerald-300 rounded-lg overflow-hidden bg-white group">
                              <Image 
                                src={preview} 
                                alt="New" 
                                fill 
                                className="object-cover"
                                unoptimized
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveNewImage(pc.colorId, nIdx)}
                                className="absolute top-1 right-1 p-0.5 bg-black/70 hover:bg-black text-white rounded-full transition-all"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}

                          {/* Add Images Input Button */}
                          <label className="flex flex-col items-center justify-center w-16 h-16 border border-dashed border-neutral-300 hover:border-[#a39889] rounded-lg cursor-pointer bg-white hover:bg-neutral-50 transition-colors">
                            <Upload className="w-5 h-5 text-neutral-400" />
                            <span className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider mt-1">Upload</span>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleColorImageUpload(pc.colorId, e)}
                            />
                          </label>

                          {/* Unselect Color Option */}
                          <button
                            type="button"
                            onClick={() => handleRemoveColor(pc.colorId)}
                            className="p-2 border border-red-200 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all text-xs font-bold tracking-wider uppercase ml-2 flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove Variant
                          </button>

                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <hr className="border-neutral-200" />

              {/* Text Fields Details */}
              <div className="space-y-4">
                <h4 className="font-clashDisplay font-bold text-neutral-900 text-sm uppercase tracking-wider">
                  Detailed Specifications
                </h4>
                
                <div className="space-y-4">
                  {/* Description */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-bold">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter detailed description..."
                      className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:border-[#a39889] focus:ring-1 focus:ring-[#dfd7cc]/50 rounded-xl py-3 px-4 outline-none text-sm transition-all duration-300 focus:bg-white resize-none"
                    />
                  </div>

                  {/* Spec Row 1: Material and Fit */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-bold">
                        Material
                      </label>
                      <input
                        type="text"
                        value={material}
                        onChange={(e) => setMaterial(e.target.value)}
                        placeholder="e.g. 100% Organic Heavyweight Cotton"
                        className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:border-[#a39889] focus:ring-1 focus:ring-[#dfd7cc]/50 rounded-xl py-3 px-4 outline-none text-sm transition-all duration-300 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-bold">
                        Fit
                      </label>
                      <input
                        type="text"
                        value={fit}
                        onChange={(e) => setFit(e.target.value)}
                        placeholder="e.g. Oversized Drop Shoulder"
                        className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:border-[#a39889] focus:ring-1 focus:ring-[#dfd7cc]/50 rounded-xl py-3 px-4 outline-none text-sm transition-all duration-300 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Spec Row 2: Weight and Care */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-bold">
                        Weight
                      </label>
                      <input
                        type="text"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="e.g. 240 gsm"
                        className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:border-[#a39889] focus:ring-1 focus:ring-[#dfd7cc]/50 rounded-xl py-3 px-4 outline-none text-sm transition-all duration-300 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-bold">
                        Care Instructions
                      </label>
                      <input
                        type="text"
                        value={care}
                        onChange={(e) => setCare(e.target.value)}
                        placeholder="e.g. Machine wash cold, tumble dry low"
                        className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:border-[#a39889] focus:ring-1 focus:ring-[#dfd7cc]/50 rounded-xl py-3 px-4 outline-none text-sm transition-all duration-300 focus:bg-white"
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-neutral-100 flex-shrink-0">
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
                  {modalMode === "create" ? "Save Product" : "Update Product"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
