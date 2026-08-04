"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUserAuth } from "@/context/UserAuthContext";
import { useToast } from "@/context/ToastContext";
import { getMyQRCodes, updateQRProfile } from "@/services/qrService";
import { Scan, QrCode, ExternalLink, Pencil, Loader2, X, Sparkles, ShieldCheck } from "lucide-react";

export default function AccountQrIdentityPage() {
  const { user, userFetch } = useUserAuth();
  const { showToast } = useToast();

  const [myQRs, setMyQRs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Story Modal State
  const [editingQR, setEditingQR] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    customText: "",
    bio: "",
    avatarUrl: "",
    coverUrl: "",
    socialLinks: {
      instagram: "",
      twitter: "",
      spotify: "",
      customUrl: "",
    },
  });

  const fetchUserQRs = async () => {
    setLoading(true);
    const res = await getMyQRCodes(userFetch);
    if (res.success && Array.isArray(res.qrCodes)) {
      setMyQRs(res.qrCodes);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchUserQRs();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleOpenEditModal = (qr) => {
    setEditingQR(qr);
    setEditForm({
      title: qr.profileData?.title || "",
      customText: qr.profileData?.customText || "",
      bio: qr.profileData?.bio || "",
      avatarUrl: qr.profileData?.avatarUrl || "",
      coverUrl: qr.profileData?.coverUrl || "",
      socialLinks: {
        instagram: qr.profileData?.socialLinks?.instagram || "",
        twitter: qr.profileData?.socialLinks?.twitter || "",
        spotify: qr.profileData?.socialLinks?.spotify || "",
        customUrl: qr.profileData?.socialLinks?.customUrl || "",
      },
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editingQR) return;

    setUpdating(true);
    const payload = {
      code: editingQR.code,
      ...editForm,
    };

    const res = await updateQRProfile(userFetch, payload);
    setUpdating(false);

    if (res.success) {
      showToast("Digital Identity story updated & activated successfully!", "success");
      setEditingQR(null);
      fetchUserQRs();
    } else {
      showToast(res.message || "Failed to update story details", "error");
    }
  };

  return (
    <div className="py-6 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <Scan className="w-10 h-10 stroke-[1.5] text-neutral-800 mx-auto" />
        <h3 className="text-2xl font-semibold font-clashDisplay text-neutral-900">QR Identity</h3>
        <p className="text-sm text-neutral-500 max-w-md mx-auto">
          Manage your digital garment identities. Add your custom stories, bios, and social links to your claimed BACSTORY apparel QR codes.
        </p>
      </div>

      {/* Claimed QR Codes List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold font-clashDisplay text-neutral-900">
            Your Claimed Digital Identities ({myQRs.length})
          </h4>
        </div>

        {loading && (
          <div className="py-12 text-center text-neutral-400 text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading your QR codes...
          </div>
        )}

        {!loading && myQRs.length === 0 && (
          <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center space-y-3">
            <QrCode className="w-10 h-10 text-neutral-300 mx-auto" />
            <p className="text-sm text-neutral-600 font-medium">
              You haven't claimed any QR codes yet.
            </p>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Scan the QR tag on your BACSTORY garment to verify your order and claim your digital identity!
            </p>
          </div>
        )}

        {!loading && myQRs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myQRs.map((qr) => (
              <div
                key={qr._id}
                className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4 hover:shadow-md transition-shadow relative flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-mono font-semibold text-neutral-900 block">
                          {qr.code}
                        </span>
                        <span className="text-[11px] text-neutral-400 block font-mono">
                          Order: {qr.orderId || "N/A"}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${qr.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                    >
                      {qr.status === "active" ? "Active Story" : "Claimed (Unactivated)"}
                    </span>
                  </div>

                  {qr.profileData?.title ? (
                    <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-3 space-y-1">
                      <p className="text-xs font-bold text-neutral-900 line-clamp-1">
                        {qr.profileData.title}
                      </p>
                      {qr.profileData.customText && (
                        <p className="text-[11px] text-neutral-500 line-clamp-2 italic">
                          "{qr.profileData.customText}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400 italic">
                      No story added yet. Click "Add Story & Details" to activate.
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-neutral-100 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(qr)}
                    className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    {qr.profileData?.title ? "Edit Story" : "Add Story & Details"}
                  </button>

                  <Link
                    href={`/qr/${qr.code}`}
                    target="_blank"
                    className="p-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900 rounded-xl text-xs transition-colors"
                    title="View Public QR Scan Page"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Story Details Modal */}
      {editingQR && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-neutral-900" />
                <div>
                  <h3 className="text-lg font-bold font-clashDisplay text-neutral-900">
                    Add / Edit Story Details
                  </h3>
                  <p className="text-xs font-mono text-neutral-400">
                    Code: {editingQR.code}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingQR(null)}
                className="text-neutral-400 hover:text-neutral-900 p-1 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Identity Title */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-700 uppercase">
                  Identity Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex's Streetwear Story"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-neutral-900 placeholder-neutral-400 text-sm focus:outline-none focus:border-neutral-900 focus:bg-white"
                />
              </div>

              {/* Custom Story / Message */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-700 uppercase">
                  Custom Story / Message
                </label>
                <textarea
                  rows={3}
                  placeholder="Share your bacstory, favorite quote, or custom message displayed when people scan your QR code..."
                  value={editForm.customText}
                  onChange={(e) => setEditForm({ ...editForm, customText: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-neutral-900 placeholder-neutral-400 text-sm focus:outline-none focus:border-neutral-900 focus:bg-white"
                />
              </div>

              {/* Avatar URL */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-700 uppercase">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={editForm.avatarUrl}
                  onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-neutral-900 placeholder-neutral-400 text-sm focus:outline-none focus:border-neutral-900 focus:bg-white"
                />
              </div>

              {/* Social Links */}
              <div className="space-y-2.5 pt-2 border-t border-neutral-100">
                <label className="block text-xs font-semibold text-neutral-700 uppercase">
                  Social Links (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Instagram Handle or Link"
                  value={editForm.socialLinks.instagram}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      socialLinks: { ...editForm.socialLinks, instagram: e.target.value },
                    })
                  }
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2 text-neutral-900 placeholder-neutral-400 text-xs focus:outline-none focus:border-neutral-900 focus:bg-white"
                />
                <input
                  type="text"
                  placeholder="Twitter / X Handle or Link"
                  value={editForm.socialLinks.twitter}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      socialLinks: { ...editForm.socialLinks, twitter: e.target.value },
                    })
                  }
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2 text-neutral-900 placeholder-neutral-400 text-xs focus:outline-none focus:border-neutral-900 focus:bg-white"
                />
                <input
                  type="text"
                  placeholder="Spotify Track or Artist Link"
                  value={editForm.socialLinks.spotify}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      socialLinks: { ...editForm.socialLinks, spotify: e.target.value },
                    })
                  }
                  className="w-full bg-neutral-900/5 border border-neutral-300 rounded-xl px-4 py-2 text-neutral-900 placeholder-neutral-400 text-xs focus:outline-none focus:border-neutral-900 focus:bg-white"
                />
                <input
                  type="url"
                  placeholder="Custom Website Link"
                  value={editForm.socialLinks.customUrl}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      socialLinks: { ...editForm.socialLinks, customUrl: e.target.value },
                    })
                  }
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2 text-neutral-900 placeholder-neutral-400 text-xs focus:outline-none focus:border-neutral-900 focus:bg-white"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingQR(null)}
                  className="flex-1 border border-neutral-300 hover:bg-neutral-50 py-2.5 rounded-xl text-xs font-semibold text-neutral-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save & Activate Story"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
