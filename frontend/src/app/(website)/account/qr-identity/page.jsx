"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUserAuth } from "@/context/UserAuthContext";
import { useToast } from "@/context/ToastContext";
import { getMyQRCodes, updateQRProfile } from "@/services/qrService";
import CustomSelect from "@/components/ui/CustomSelect";
import { Scan, QrCode, ExternalLink, Pencil, Loader2, X, Sparkles, ShieldCheck, Upload, User, Trash2, Plus } from "lucide-react";

const ALL_PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: "/images/landing-page/instagram.svg", placeholder: "Instagram Handle or Link" },
  { id: "facebook", name: "Facebook", icon: "/images/icons/facebook.svg", placeholder: "Facebook Profile or Page Link" },
  { id: "snapchat", name: "Snapchat", icon: "/images/icons/snapchat.svg", placeholder: "Snapchat Username or Link" },
  { id: "youtube", name: "YouTube", icon: "/images/icons/youtube.svg", placeholder: "YouTube Channel or Video Link" },
  { id: "twitter", name: "Twitter / X", icon: "/images/landing-page/twitter.svg", placeholder: "Twitter / X Handle or Link" },
  { id: "linkedin", name: "LinkedIn", icon: "/images/landing-page/linkedin.svg", placeholder: "LinkedIn Profile Link" },
  { id: "spotify", name: "Spotify", icon: "/images/icons/spotify.svg", placeholder: "Spotify Artist or Track Link" },
  { id: "tiktok", name: "TikTok", icon: "/images/icons/tiktok.svg", placeholder: "TikTok Profile Link" },
  { id: "whatsapp", name: "WhatsApp", icon: "/images/icons/whatsapp.svg", placeholder: "WhatsApp Number or Chat Link" },
  { id: "telegram", name: "Telegram", icon: "/images/icons/telegram.svg", placeholder: "Telegram Username or Channel" },
  { id: "github", name: "GitHub", icon: "/images/icons/github.svg", placeholder: "GitHub Profile Link" },
  { id: "discord", name: "Discord", icon: "/images/icons/discord.svg", placeholder: "Discord Invite Link" },
  { id: "threds", name: "Threads", icon: "/images/icons/threds.svg", placeholder: "Threads Profile Link" },
  { id: "pintrest", name: "Pinterest", icon: "/images/icons/pintrest.svg", placeholder: "Pinterest Profile Link" },
  { id: "dribble", name: "Dribbble", icon: "/images/icons/dribble.svg", placeholder: "Dribbble Profile Link" },
  { id: "customUrl", name: "Custom Website", icon: "/images/landing-page/linkedin.svg", placeholder: "Custom Website Link (https://...)" },
];

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
      facebook: "",
      snapchat: "",
      youtube: "",
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
      socialLinks: qr.profileData?.socialLinks && Object.keys(qr.profileData.socialLinks).length > 0
        ? { ...qr.profileData.socialLinks }
        : { instagram: "", facebook: "", twitter: "" },
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
                  <h3 className="text-lg font-semibold font-clashDisplay text-neutral-900">
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

              {/* Avatar Image File Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-neutral-700 uppercase">
                  Upload Avatar Photo
                </label>
                <div className="flex items-center gap-4 bg-neutral-50 border border-neutral-200 rounded-2xl p-3.5">
                  <div className="w-16 h-16 rounded-full bg-neutral-200 border-2 border-white shadow-xs overflow-hidden shrink-0 flex items-center justify-center relative">
                    {editForm.avatarUrl ? (
                      <img
                        src={editForm.avatarUrl}
                        alt="Avatar Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-neutral-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold cursor-pointer transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{editForm.avatarUrl ? "Change Photo" : "Upload Photo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              showToast("Image size should be less than 10MB", "error");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const img = new Image();
                              img.src = event.target.result;
                              img.onload = () => {
                                const canvas = document.createElement("canvas");
                                const maxDim = 400;
                                let width = img.width;
                                let height = img.height;
                                if (width > height) {
                                  if (width > maxDim) {
                                    height = Math.round((height * maxDim) / width);
                                    width = maxDim;
                                  }
                                } else {
                                  if (height > maxDim) {
                                    width = Math.round((width * maxDim) / height);
                                    height = maxDim;
                                  }
                                }
                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext("2d");
                                ctx.drawImage(img, 0, 0, width, height);
                                const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
                                setEditForm((prev) => ({ ...prev, avatarUrl: compressedDataUrl }));
                              };
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {editForm.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, avatarUrl: "" })}
                        className="block text-[11px] font-semibold text-red-600 hover:underline cursor-pointer"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Social Links */}
              <div className="space-y-3 pt-3 border-t border-neutral-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-neutral-700 uppercase">
                    Social Links (Optional)
                  </label>
                  <span className="text-[10px] text-neutral-400">
                    Add social accounts to your QR page
                  </span>
                </div>

                {/* Active Platform Inputs */}
                <div className="space-y-2">
                  {Object.keys(editForm.socialLinks || {}).map((platformId) => {
                    const platform = ALL_PLATFORMS.find((p) => p.id === platformId) || {
                      id: platformId,
                      name: platformId,
                      icon: "/images/landing-page/linkedin.svg",
                      placeholder: `${platformId} link or handle`,
                    };

                    return (
                      <div key={platformId} className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0">
                          <img src={platform.icon} alt={platform.name} className="w-4 h-4 object-contain invert" />
                        </div>
                        <input
                          type="text"
                          placeholder={platform.placeholder}
                          value={editForm.socialLinks[platformId] || ""}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              socialLinks: {
                                ...prev.socialLinks,
                                [platformId]: e.target.value,
                              },
                            }))
                          }
                          className="flex-1 bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2 text-neutral-900 placeholder-neutral-400 text-xs focus:outline-none focus:border-neutral-900 focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setEditForm((prev) => {
                              const updated = { ...prev.socialLinks };
                              delete updated[platformId];
                              return { ...prev, socialLinks: updated };
                            });
                          }}
                          className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                          title="Remove link"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Custom Dropdown to Add Platform */}
                {ALL_PLATFORMS.filter((p) => !Object.keys(editForm.socialLinks || {}).includes(p.id)).length > 0 && (
                  <div className="pt-1">
                    <CustomSelect
                      placeholder="+ Add Social Platform (Snapchat, YouTube, Discord, TikTok, WhatsApp...)"
                      showPlaceholderInMenu={false}
                      dropUp={true}
                      options={ALL_PLATFORMS.filter((p) => !Object.keys(editForm.socialLinks || {}).includes(p.id)).map((p) => ({
                        value: p.id,
                        label: p.name,
                      }))}
                      value=""
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        if (selectedId) {
                          setEditForm((prev) => ({
                            ...prev,
                            socialLinks: {
                              ...prev.socialLinks,
                              [selectedId]: "",
                            },
                          }));
                        }
                      }}
                      className="w-full bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-300 rounded-xl px-4 py-2.5 text-neutral-800 text-xs font-semibold"
                    />
                  </div>
                )}
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
