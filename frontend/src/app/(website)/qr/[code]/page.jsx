"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useUserAuth } from "@/context/UserAuthContext";
import { useToast } from "@/context/ToastContext";
import { getQRCodeByCode, sendClaimOTP, verifyClaimOTP } from "@/services/qrService";
import {
  Scan,
  Sparkles,
  ShoppingBag,
  Mail,
  KeyRound,
  ExternalLink,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  User,
  Copy,
  Check,
  Music,
  Globe,
} from "lucide-react";

const InstagramIcon = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const TwitterIcon = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
  </svg>
);

export default function PublicQRCodePage() {
  const params = useParams();
  const codeParam = params?.code || "";
  const router = useRouter();
  const { user, userFetch } = useUserAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Claim & OTP Flow States
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [mockOtpHint, setMockOtpHint] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const [copied, setCopied] = useState(false);

  // Fetch QR Code details on mount
  const fetchQRDetails = async () => {
    if (!codeParam) return;
    setLoading(true);
    setErrorMsg("");

    const data = await getQRCodeByCode(codeParam);
    if (!data.success && data.message === "QR code not found") {
      setErrorMsg("QR code not found");
      setQrData(null);
    } else if (!data.success) {
      setErrorMsg(data.message || "Failed to load QR code");
      setQrData(null);
    } else {
      setQrData(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQRDetails();
  }, [codeParam]);

  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user]);

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!orderId.trim()) {
      showToast("Please enter your Order ID.", "error");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      showToast("Please enter a valid email address.", "error");
      return;
    }

    setSendingOtp(true);
    const res = await sendClaimOTP(codeParam, orderId.trim(), email.trim());
    setSendingOtp(false);

    if (res.success) {
      setOtpSent(true);
      if (res.mockOtp) {
        setMockOtpHint(res.mockOtp);
      }
      showToast(res.message || "Verification code sent to your email!", "success");
    } else {
      showToast(res.message || "Failed to send OTP code. Please try again.", "error");
    }
  };

  // Step 2: Verify OTP and Claim QR Code
  const handleVerifyAndClaim = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      showToast("Please enter the verification OTP code.", "error");
      return;
    }

    setVerifying(true);

    const res = await verifyClaimOTP(codeParam, orderId.trim(), email.trim(), otp.trim());
    setVerifying(false);

    if (res.success) {
      if (res.token && res.user) {
        localStorage.setItem("userToken", res.token);
        localStorage.setItem("userData", JSON.stringify(res.user));
      }
      setClaimSuccess(true);
      showToast(res.message || "QR Code verified and linked to your account!", "success");
      fetchQRDetails();
    } else {
      showToast(res.message || "Failed to link QR code.", "error");
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      showToast("QR Link copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-neutral-900 selection:bg-neutral-200 selection:text-black flex flex-col font-sans">

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full flex flex-col justify-center">
        {/* Loading State */}
        {loading && (
          <div className="bg-white border border-neutral-200 rounded-3xl p-12 text-center max-w-md mx-auto w-full space-y-4 shadow-sm">
            <Loader2 className="w-10 h-10 text-neutral-800 animate-spin mx-auto" />
            <p className="text-sm font-medium text-neutral-600">Loading BACSTORY QR Identity...</p>
          </div>
        )}

        {/* Error / Not Found State */}
        {!loading && errorMsg && (
          <div className="bg-white border border-neutral-200 rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto w-full space-y-6 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold font-clashDisplay text-neutral-900">QR Code Not Found</h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                The QR code <span className="font-mono text-neutral-900 font-semibold">{codeParam}</span> does not exist or may have been removed.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/products"
                className="px-6 py-3 bg-neutral-900 text-white font-semibold rounded-xl text-sm hover:bg-neutral-800 transition-colors"
              >
                Browse Shop
              </Link>
              <Link
                href="/"
                className="px-6 py-3 border border-neutral-300 text-neutral-700 font-semibold rounded-xl text-sm hover:bg-neutral-50 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}

        {/* UNLINKED STATE: Display HELLO Greeting Banner & Verification Form */}
        {!loading && !errorMsg && qrData?.status === "unlinked" && !claimSuccess && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Unlinked "Hello" Greeting Card */}
            <div className="relative overflow-hidden bg-white border border-neutral-200/90 rounded-3xl p-8 sm:p-12 text-center shadow-sm space-y-5">
              <div className="space-y-3">
                <h1 className="text-5xl sm:text-7xl font-semibold font-clashDisplay tracking-tight text-neutral-900">
                  HELLO
                </h1>
                <p className="text-lg sm:text-xl text-neutral-700 font-medium max-w-xl mx-auto">
                  Welcome! This BACSTORY apparel QR code has not been claimed yet.
                </p>
                <p className="text-sm text-neutral-500 max-w-lg mx-auto leading-relaxed">
                  Every BACSTORY garment comes with a unique digital identity. By default, unlinked QR codes display this friendly hello greeting.
                </p>
              </div>
            </div>

            {/* Verification & Claim Section */}
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-start gap-4 border-b border-neutral-100 pb-5">
                <div className="w-11 h-11 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold font-clashDisplay text-neutral-900">
                    Verify & Claim Your QR Garment
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-500">
                    Enter your Order ID and Email below to receive a verification OTP and link this QR code to your profile.
                  </p>
                </div>
              </div>

              {!otpSent ? (
                /* Step 1: Order ID & Email Form */
                <form onSubmit={handleSendOtp} className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
                  <div className="md:col-span-4 space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Order ID
                    </label>
                    <div className="relative">
                      <ShoppingBag className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        placeholder="e.g. ORD-109283"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-300 rounded-xl pl-10 pr-4 py-3 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:bg-white text-sm font-mono transition-all"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-5 space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        placeholder="yourname@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-300 rounded-xl pl-10 pr-4 py-3 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:bg-white text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <button
                      type="submit"
                      disabled={sendingOtp}
                      className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-semibold h-[46px] px-4 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm shrink-0 whitespace-nowrap"
                    >
                      {sendingOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Verify Code</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: OTP Verification Form */
                <form onSubmit={handleVerifyAndClaim} className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-800 space-y-0.5">
                      <p className="font-semibold">OTP Code Sent!</p>
                      <p>
                        We sent a verification code to <strong>{email}</strong>. Please enter the OTP code below.
                      </p>
                      {mockOtpHint && (
                        <p className="text-[11px] font-mono text-emerald-700 pt-1">
                          (Dev Mode Code: <strong>{mockOtpHint}</strong>)
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Enter 6-Digit Verification OTP
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-300 rounded-xl pl-10 pr-4 py-3 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:bg-white text-base font-mono tracking-widest text-center transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="px-5 py-3 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 font-semibold rounded-xl text-sm transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={verifying}
                      className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold py-3 px-6 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      {verifying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Verifying & Activating...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          Verify & Link QR Code
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* CLAIM SUCCESS STATE: Prompt user to add story from profile section */}
        {claimSuccess && (
          <div className="bg-white border border-neutral-200 rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto w-full space-y-6 shadow-sm animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold uppercase tracking-wider">
                QR Claimed • Story Not Activated
              </span>
              <h2 className="text-2xl font-semibold font-clashDisplay text-neutral-900">
                Your QR Code is Linked!
              </h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Your QR code <span className="font-mono text-neutral-900 font-semibold">{codeParam}</span> has been successfully linked to your account. Your digital story is currently unactivated.
              </p>
              <p className="text-xs text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-left leading-relaxed">
                ✨ Now you can add your custom story message, bio, avatar, and social links from your <strong>QR Identity</strong> section in your profile!
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/account/qr-identity"
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-semibold py-3.5 px-6 rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                Go to Profile Section to Add Story
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* LINKED / ACTIVATED STATE: Display Public Story Profile */}
        {!loading && !errorMsg && qrData?.status !== "unlinked" && !claimSuccess && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="relative overflow-hidden bg-white border border-neutral-200 rounded-3xl shadow-sm">
              {/* Cover Banner */}
              <div
                className="h-44 sm:h-56 w-full relative bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-300 overflow-hidden"
                style={{
                  backgroundColor: qrData?.profileData?.themeColor || "#f5f5f5",
                }}
              >
                {qrData?.profileData?.coverUrl ? (
                  <img
                    src={qrData.profileData.coverUrl}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-200 via-neutral-100 to-white" />
                )}

              </div>

              {/* Profile Info */}
              <div className="px-6 sm:px-10 pb-10 relative -mt-16 sm:-mt-20 space-y-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 text-center sm:text-left">
                  {/* Avatar */}
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl border-4 border-white bg-neutral-100 shadow-md overflow-hidden shrink-0 flex items-center justify-center text-neutral-800 relative">
                    {qrData?.profileData?.avatarUrl ? (
                      <img
                        src={qrData.profileData.avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                        <User className="w-12 h-12 text-neutral-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Title & User Name */}
                <div className="space-y-1 text-center sm:text-left">
                  <h2 className="text-2xl sm:text-3xl font-semibold font-clashDisplay text-neutral-900">
                    {qrData?.profileData?.title || qrData?.linkedUser?.name || "BACSTORY Garment Owner"}
                  </h2>
                  <p className="text-xs font-mono text-neutral-500">
                    Linked by {qrData?.linkedUser?.name || "BACSTORY Member"}
                  </p>
                </div>

                {/* Custom Story / Bio */}
                {(qrData?.profileData?.customText || qrData?.profileData?.bio) && (
                  <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 space-y-2">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider font-mono">
                      Digital Story & Bio
                    </p>
                    <p className="text-sm sm:text-base text-neutral-800 leading-relaxed font-normal italic">
                      "{qrData?.profileData?.customText || qrData?.profileData?.bio}"
                    </p>
                  </div>
                )}

                {/* Social Links Grid */}
                {qrData?.profileData?.socialLinks &&
                  Object.values(qrData.profileData.socialLinks).some((val) => val) && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider font-mono">
                        Connect & Socials
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {qrData.profileData.socialLinks.instagram && (
                          <a
                            href={
                              qrData.profileData.socialLinks.instagram.startsWith("http")
                                ? qrData.profileData.socialLinks.instagram
                                : `https://instagram.com/${qrData.profileData.socialLinks.instagram.replace("@", "")}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3.5 bg-neutral-50 border border-neutral-200 hover:border-pink-500 rounded-xl transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center">
                                <InstagramIcon className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-semibold text-neutral-900 group-hover:text-pink-600 transition-colors">
                                Instagram
                              </span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-pink-600 transition-colors" />
                          </a>
                        )}

                        {qrData.profileData.socialLinks.twitter && (
                          <a
                            href={
                              qrData.profileData.socialLinks.twitter.startsWith("http")
                                ? qrData.profileData.socialLinks.twitter
                                : `https://twitter.com/${qrData.profileData.socialLinks.twitter.replace("@", "")}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3.5 bg-neutral-50 border border-neutral-200 hover:border-sky-500 rounded-xl transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                                <TwitterIcon className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-semibold text-neutral-900 group-hover:text-sky-600 transition-colors">
                                Twitter / X
                              </span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-sky-600 transition-colors" />
                          </a>
                        )}

                        {qrData.profileData.socialLinks.spotify && (
                          <a
                            href={
                              qrData.profileData.socialLinks.spotify.startsWith("http")
                                ? qrData.profileData.socialLinks.spotify
                                : `https://open.spotify.com/${qrData.profileData.socialLinks.spotify}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3.5 bg-neutral-50 border border-neutral-200 hover:border-emerald-500 rounded-xl transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                <Music className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-semibold text-neutral-900 group-hover:text-emerald-600 transition-colors">
                                Spotify Track
                              </span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-emerald-600 transition-colors" />
                          </a>
                        )}

                        {qrData.profileData.socialLinks.customUrl && (
                          <a
                            href={
                              qrData.profileData.socialLinks.customUrl.startsWith("http")
                                ? qrData.profileData.socialLinks.customUrl
                                : `https://${qrData.profileData.socialLinks.customUrl}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3.5 bg-neutral-50 border border-neutral-200 hover:border-purple-500 rounded-xl transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                                <Globe className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-semibold text-neutral-900 group-hover:text-purple-600 transition-colors">
                                Custom Link
                              </span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-purple-600 transition-colors" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                {/* Garment Identification Details Footer */}

              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
