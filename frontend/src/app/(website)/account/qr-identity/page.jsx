"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUserAuth } from "@/context/UserAuthContext";
import { useToast } from "@/context/ToastContext";
import { getMyQRCodes, updateQRProfile } from "@/services/qrService";
import CustomSelect from "@/components/ui/CustomSelect";
import QRCodeCard from "@/components/qr/QRCodeCard";
import {
  Scan,
  QrCode,
  ExternalLink,
  Pencil,
  Loader2,
  X,
  Sparkles,
  Upload,
  User,
  Trash2,
  BookOpen,
  Clock,
  Globe,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react";

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

const STORY_ARCHETYPES = [
  "THE CREATOR",
  "THE BUILDER",
  "THE WANDERER",
  "THE DREAMER",
  "THE OBSERVER",
  "THE REBEL",
  "THE MAKER",
  "THE STORYTELLER",
];

const FORM_STEPS = [
  { id: 1, label: "01 Identity", icon: User },
  { id: 2, label: "02 My Story", icon: BookOpen },
  { id: 3, label: "03 Right Now", icon: Clock },
  { id: 4, label: "04 My World", icon: Globe },
  { id: 5, label: "05 Icebreaker", icon: MessageSquare },
];

export default function AccountQrIdentityPage() {
  const { user, userFetch } = useUserAuth();
  const { showToast } = useToast();

  const [myQRs, setMyQRs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Story Modal State
  const [editingQR, setEditingQR] = useState(null);
  const [activeStep, setActiveStep] = useState(1);
  const [previewPassQR, setPreviewPassQR] = useState(null);
  const [updating, setUpdating] = useState(false);

  const [editForm, setEditForm] = useState({
    title: "",
    storyType: "",
    signature: "",
    customText: "",
    bio: "",
    avatarUrl: "",
    coverUrl: "",
    askMeAbout: "",
    rightNow: {
      building: "",
      learning: "",
      obsessedWith: "",
      chasing: "",
      dreamingAbout: "",
    },
    storyPrompts: {
      whoAmI: "",
      unexpectedPart: "",
      nextChapter: "",
    },
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
    setActiveStep(1);
    const pd = qr.profileData || {};
    setEditForm({
      title: pd.title || "",
      storyType: pd.storyType || "",
      signature: pd.signature || pd.customText || "",
      customText: pd.signature || pd.customText || "",
      bio: pd.bio || "",
      avatarUrl: pd.avatarUrl || "",
      coverUrl: pd.coverUrl || "",
      askMeAbout: pd.askMeAbout || "",
      rightNow: {
        building: pd.rightNow?.building || "",
        learning: pd.rightNow?.learning || "",
        obsessedWith: pd.rightNow?.obsessedWith || "",
        chasing: pd.rightNow?.chasing || "",
        dreamingAbout: pd.rightNow?.dreamingAbout || "",
      },
      storyPrompts: {
        whoAmI: pd.storyPrompts?.whoAmI || "",
        unexpectedPart: pd.storyPrompts?.unexpectedPart || "",
        nextChapter: pd.storyPrompts?.nextChapter || "",
      },
      socialLinks: pd.socialLinks && Object.keys(pd.socialLinks).length > 0
        ? { ...pd.socialLinks }
        : { instagram: "", facebook: "", twitter: "" },
    });
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!editingQR) return;

    setUpdating(true);
    const payload = {
      code: editingQR.code,
      ...editForm,
      customText: editForm.signature,
    };

    const res = await updateQRProfile(userFetch, payload);
    setUpdating(false);

    if (res.success) {
      showToast("Bacstory digital identity updated successfully!", "success");
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
        <h3 className="text-2xl font-semibold font-clashDisplay text-neutral-900">
          Write Your Bacstory
        </h3>
        <p className="text-sm text-neutral-500 max-w-md mx-auto">
          The QR code on your Bacstory garment is a living window into your world. Share your identity, signature, current chapter, and links.
        </p>
      </div>

      {/* Claimed QR Codes List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold font-clashDisplay text-neutral-900">
            Your Digital Identities ({myQRs.length})
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
              You haven&apos;t claimed any QR codes yet.
            </p>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Scan the QR tag on your BACSTORY garment to verify your order and write your Bacstory!
            </p>
          </div>
        )}

        {!loading && myQRs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myQRs.map((qr) => {
              const archetype = qr.profileData?.storyType || "";
              const title = qr.profileData?.title || "";
              const signature = qr.profileData?.signature || qr.profileData?.customText || "";
              const askMe = qr.profileData?.askMeAbout || "";

              return (
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
                          <span className="text-xs font-mono font-bold text-neutral-900 block">
                            {qr.code}
                          </span>
                          <span className="text-[11px] font-medium text-neutral-500 block">
                            {qr.orderId ? `Order: ${qr.orderId}` : "🎁 Gift Claim"}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          qr.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {qr.status === "active" ? "Active Story" : "Claimed"}
                      </span>
                    </div>

                    {title || archetype || signature ? (
                      <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-3 space-y-1.5">
                        {archetype && (
                          <span className="inline-block px-2 py-0.5 bg-neutral-900 text-white text-[9px] font-bold tracking-widest rounded-md uppercase">
                            {archetype}
                          </span>
                        )}
                        {title && (
                          <p className="text-xs font-bold text-neutral-900 line-clamp-1">
                            {title}
                          </p>
                        )}
                        {signature && (
                          <p className="text-[11px] text-neutral-500 line-clamp-2 italic">
                            &quot;{signature}&quot;
                          </p>
                        )}
                        {askMe && (
                          <div className="pt-1 text-[10px] text-neutral-600 font-medium flex items-center gap-1 border-t border-neutral-200/60 mt-1">
                            <span className="font-bold text-neutral-900 uppercase">Ask me:</span>
                            <span className="truncate">&quot;{askMe}&quot;</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-400 italic">
                        No story added yet. Click &quot;Write Bacstory&quot; to begin.
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-neutral-100 flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(qr)}
                      className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      {title || signature ? "Edit Bacstory" : "Write Bacstory"}
                    </button>

                    <button
                      onClick={() => setPreviewPassQR(qr)}
                      className="p-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                      title="View QR Identity Pass"
                    >
                      <QrCode className="w-4 h-4 text-neutral-800" />
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
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Story Details Modal (5-Step Form Flow) */}
      {editingQR && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-5 shadow-2xl max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3.5 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-neutral-900" />
                <div>
                  <h3 className="text-lg font-semibold font-clashDisplay text-neutral-900">
                    Write Your Bacstory
                  </h3>
                  <p className="text-xs text-neutral-400 font-mono">
                    Garment Code: {editingQR.code}
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

            {/* 5-Step Navigation Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-neutral-100 shrink-0 scrollbar-none">
              {FORM_STEPS.map((step) => {
                const Icon = step.icon;
                const isActive = activeStep === step.id;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveStep(step.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? "bg-neutral-900 text-white shadow-xs"
                        : "bg-neutral-50 hover:bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{step.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Form Content Area */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-5">
              {/* STEP 1: IDENTITY */}
              {activeStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 space-y-1">
                    <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                      01 / IDENTITY
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      Choose your name, identity archetype, and profile photo.
                    </p>
                  </div>

                  {/* Name / Title */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
                      WHO ARE YOU? / Your Name or Display Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Akhil Verma"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-neutral-900 placeholder-neutral-400 text-sm focus:outline-none focus:border-neutral-900 focus:bg-white"
                    />
                  </div>

                  {/* Story Archetype Picker */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
                      STORY TYPE / Choose your identity archetype
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {STORY_ARCHETYPES.map((arch) => {
                        const isSelected = editForm.storyType === arch;
                        return (
                          <button
                            key={arch}
                            type="button"
                            onClick={() =>
                              setEditForm({
                                ...editForm,
                                storyType: isSelected ? "" : arch,
                              })
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer border ${
                              isSelected
                                ? "bg-neutral-900 text-white border-neutral-900 shadow-xs"
                                : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                            }`}
                          >
                            {arch}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Profile Photo */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
                      YOUR FACE / Visual Introduction
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
                </div>
              )}

              {/* STEP 2: MY STORY */}
              {activeStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 space-y-1">
                    <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                      02 / MY STORY
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      Craft your signature line and answer short story prompts to share your journey.
                    </p>
                  </div>

                  {/* MY SIGNATURE */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
                      MY SIGNATURE / One line that captures you
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Building stories that make people stop scrolling."
                      value={editForm.signature}
                      onChange={(e) =>
                        setEditForm({ ...editForm, signature: e.target.value, customText: e.target.value })
                      }
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-neutral-900 placeholder-neutral-400 text-sm focus:outline-none focus:border-neutral-900 focus:bg-white"
                    />
                  </div>

                  {/* Story Prompts */}
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
                      STORY PROMPTS
                    </label>

                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-neutral-600 uppercase">
                        WHO ARE YOU?
                      </span>
                      <input
                        type="text"
                        placeholder="I'm a designer who spends too much time tweaking pixels..."
                        value={editForm.storyPrompts.whoAmI}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            storyPrompts: { ...editForm.storyPrompts, whoAmI: e.target.value },
                          })
                        }
                        className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2 text-neutral-900 placeholder-neutral-400 text-xs focus:outline-none focus:border-neutral-900 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-neutral-600 uppercase">
                        THE UNEXPECTED PART
                      </span>
                      <input
                        type="text"
                        placeholder="Most people don't know that I produce analog music..."
                        value={editForm.storyPrompts.unexpectedPart}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            storyPrompts: { ...editForm.storyPrompts, unexpectedPart: e.target.value },
                          })
                        }
                        className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2 text-neutral-900 placeholder-neutral-400 text-xs focus:outline-none focus:border-neutral-900 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-neutral-600 uppercase">
                        THE NEXT CHAPTER
                      </span>
                      <input
                        type="text"
                        placeholder="In the next 12 months, I want to launch a documentary film..."
                        value={editForm.storyPrompts.nextChapter}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            storyPrompts: { ...editForm.storyPrompts, nextChapter: e.target.value },
                          })
                        }
                        className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2 text-neutral-900 placeholder-neutral-400 text-xs focus:outline-none focus:border-neutral-900 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: RIGHT NOW */}
              {activeStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 space-y-1">
                    <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                      03 / RIGHT NOW LAYER
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      Keep your profile alive by updating what you&apos;re currently building, learning, or obsessed with.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase">
                        BUILDING / What are you making?
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. A creative project, documentary, or startup"
                        value={editForm.rightNow.building}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            rightNow: { ...editForm.rightNow, building: e.target.value },
                          })
                        }
                        className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2 text-neutral-900 placeholder-neutral-400 text-xs focus:outline-none focus:border-neutral-900 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase">
                        LEARNING / What are you learning?
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 35mm film photography, 3D graphics, or Spanish"
                        value={editForm.rightNow.learning}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            rightNow: { ...editForm.rightNow, learning: e.target.value },
                          })
                        }
                        className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2 text-neutral-900 placeholder-neutral-400 text-xs focus:outline-none focus:border-neutral-900 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase">
                        OBSESSED WITH / What currently has your attention?
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 35mm film · road trips · old music"
                        value={editForm.rightNow.obsessedWith}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            rightNow: { ...editForm.rightNow, obsessedWith: e.target.value },
                          })
                        }
                        className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2 text-neutral-900 placeholder-neutral-400 text-xs focus:outline-none focus:border-neutral-900 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase">
                        CHASING / What are you trying to achieve?
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Running my first marathon, publishing a photo book"
                        value={editForm.rightNow.chasing}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            rightNow: { ...editForm.rightNow, chasing: e.target.value },
                          })
                        }
                        className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2 text-neutral-900 placeholder-neutral-400 text-xs focus:outline-none focus:border-neutral-900 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase">
                        DREAMING ABOUT / What is the next big possibility?
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Opening an independent design lab"
                        value={editForm.rightNow.dreamingAbout}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            rightNow: { ...editForm.rightNow, dreamingAbout: e.target.value },
                          })
                        }
                        className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2 text-neutral-900 placeholder-neutral-400 text-xs focus:outline-none focus:border-neutral-900 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: MY WORLD */}
              {activeStep === 4 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 space-y-1">
                    <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                      04 / MY WORLD
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      Where people can discover your work, portfolio, code, or social channels.
                    </p>
                  </div>

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

                  {ALL_PLATFORMS.filter((p) => !Object.keys(editForm.socialLinks || {}).includes(p.id)).length > 0 && (
                    <div className="pt-1">
                      <CustomSelect
                        placeholder="+ Add Platform (YouTube, Spotify, GitHub, Dribbble, LinkedIn...)"
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
              )}

              {/* STEP 5: ICEBREAKER (DISCOVER ME) */}
              {activeStep === 5 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 space-y-1">
                    <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                      05 / CONVERSATION STARTER
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      Give visitors one prompt called &quot;ASK ME ABOUT...&quot; to turn your QR profile into an icebreaker.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
                      ASK ME ABOUT...
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. The best decision I made at 23."
                      value={editForm.askMeAbout}
                      onChange={(e) => setEditForm({ ...editForm, askMeAbout: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-neutral-900 placeholder-neutral-400 text-sm focus:outline-none focus:border-neutral-900 focus:bg-white font-medium"
                    />
                  </div>

                  <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-2xl p-4 space-y-2">
                    <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider block">
                      Sample Ideas:
                    </span>
                    <ul className="text-xs text-neutral-600 space-y-1.5 list-disc list-inside font-medium">
                      <li>&quot;The best decision I made at 23.&quot;</li>
                      <li>&quot;Why I quit my corporate job.&quot;</li>
                      <li>&quot;The road trip that changed everything.&quot;</li>
                      <li>&quot;How I built my first mechanical keyboard.&quot;</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                {activeStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
                    className="px-3.5 py-2 border border-neutral-300 hover:bg-neutral-50 rounded-xl text-xs font-semibold text-neutral-700 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {activeStep < 5 ? (
                  <button
                    type="button"
                    onClick={() => setActiveStep((prev) => Math.min(5, prev + 1))}
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    Next Section
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={updating}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Save & Activate Bacstory
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Pass Card Preview Modal */}
      {previewPassQR && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in duration-200 relative flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-5 pb-3 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Scan className="w-4 h-4 text-neutral-800" />
                Garment QR Identity Card
              </h3>
              <button
                onClick={() => setPreviewPassQR(null)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer p-1 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <QRCodeCard code={previewPassQR.code} size="normal" className="w-full" />

            <div className="w-full mt-5 pt-3.5 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
              <span>Status: <strong className="text-neutral-800 capitalize">{previewPassQR.status || "active"}</strong></span>
              <Link
                href={`/qr/${previewPassQR.code}`}
                target="_blank"
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-medium cursor-pointer text-xs flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Public Page
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
