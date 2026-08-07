"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useUserAuth } from "@/context/UserAuthContext";
import { useToast } from "@/context/ToastContext";
import { getQRCodeByCode, sendClaimOTP, verifyClaimOTP } from "@/services/qrService";
import {
  QrCode,
  Tag,
  Award,
  ShieldCheck,
  Leaf,
  ShoppingBag,
  Mail,
  Sparkles,
  KeyRound,
  Loader2,
  Check,
  Link2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  User,
  Gift,
  Headphones,
  ExternalLink,
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

const LinkedinIcon = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const TwitterIcon = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
  </svg>
);

const FacebookIcon = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const SnapchatIcon = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 2a6 6 0 0 1 6 6c0 1.5-.5 2.5-1 3.5 1 .5 2 1.5 2 3 0 1.5-1.5 2-2.5 2-.5 1-1.5 2.5-4.5 2.5s-4-1.5-4.5-2.5c-1 0-2.5-.5-2.5-2 0-1.5 1-2.5 2-3-.5-1-1-2-1-3.5a6 6 0 0 1 6-6z" />
  </svg>
);

const YoutubeIcon = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);

export default function PublicQRCodePage() {
  const params = useParams();
  const codeParam = params?.code || "";
  const router = useRouter();
  const { user } = useUserAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Claim & OTP Flow States
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [garmentLabel, setGarmentLabel] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [mockOtpHint, setMockOtpHint] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

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

  // Step 1: Send OTP to Email or Phone Number
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const cleanOrderId = orderId.trim();
    if (!cleanOrderId) {
      showToast("Please enter your Order ID.", "error");
      return;
    }
    if (!cleanOrderId.startsWith("BAC-") || cleanOrderId.length !== 10) {
      showToast("Order ID must follow format BAC-180019 (BAC- followed by 6 digits)", "error");
      return;
    }
    const cleanContact = email.trim();
    if (!cleanContact) {
      showToast("Please enter your registered email or mobile number.", "error");
      return;
    }
    const isEmailInput = cleanContact.includes("@");
    if (!isEmailInput) {
      const phoneDigits = cleanContact.replace(/\D/g, "");
      if (phoneDigits.length < 10) {
        showToast("Please enter a valid 10-digit mobile number.", "error");
        return;
      }
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanContact)) {
        showToast("Please enter a valid email address.", "error");
        return;
      }
    }
    if (!garmentLabel.trim()) {
      showToast("Please enter a label for your garment.", "error");
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
      showToast(res.message || "Verification code sent successfully!", "success");
    } else {
      showToast(res.message || "Order ID and registered Email/Phone do not match. Please try again.", "error");
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
    const res = await verifyClaimOTP(codeParam, orderId.trim(), email.trim(), otp.trim(), garmentLabel.trim());
    setVerifying(false);

    if (res.success) {
      if (res.token && res.user) {
        localStorage.setItem("userToken", res.token);
        localStorage.setItem("userData", JSON.stringify(res.user));
      }
      setClaimSuccess(true);
      fetchQRDetails();
    } else {
      showToast(res.message || "Failed to link QR code.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-neutral-900 selection:bg-neutral-200 flex flex-col font-sans">
      <main className="flex-1 w-full flex flex-col">
        {/* Loading State */}
        {loading && (
          <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 pt-6">
            <Link href="/" className="inline-block cursor-pointer mb-8">
              <img
                src="/images/logo-dark.svg"
                alt="BACSTORY"
                className="h-6 sm:h-7 lg:h-8 w-auto object-contain"
              />
            </Link>
            <div className="max-w-md mx-auto w-full my-16 bg-white border border-neutral-200/90 rounded-3xl p-12 text-center shadow-sm space-y-4">
              <Loader2 className="w-10 h-10 text-neutral-800 animate-spin mx-auto" />
              <p className="text-sm font-medium text-neutral-600">Loading BACSTORY QR Identity...</p>
            </div>
          </div>
        )}

        {/* Error / Not Found State */}
        {!loading && errorMsg && (
          <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 pt-6">
            <Link href="/" className="inline-block cursor-pointer mb-8">
              <img
                src="/images/logo-dark.svg"
                alt="BACSTORY"
                className="h-6 sm:h-7 lg:h-8 w-auto object-contain"
              />
            </Link>
            <div className="max-w-lg mx-auto w-full my-16 bg-white border border-neutral-200/90 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-sm">
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
          </div>
        )}

        {/* UNLINKED STATE: Full Width Hero & Grid matching Reference Design */}
        {!loading && !errorMsg && qrData?.status === "unlinked" && !claimSuccess && (
          <div className="w-full flex-1 flex flex-col animate-in fade-in duration-300">
            {/* FULL WIDTH HERO BANNER CONTAINER */}
            <div className="w-full relative overflow-hidden bg-[#F3F0EA] min-h-[600px] lg:min-h-[680px] flex items-center">
              {/* Full Uncropped Background Image */}
              <div className="absolute inset-0 z-0 flex items-start justify-end">
                <img
                  src="/images/qr-about/qr-bacstory-about.png"
                  alt="BACSTORY Authentic Garment Tag"
                  className="w-full h-full object-cover object-top object-right"
                />
                {/* Soft gradient overlay for text readability on mobile/tablet */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F3]/60 via-[#FAF8F3]/30 to-[#FAF8F3]/40 lg:bg-gradient-to-r lg:from-[#FAF8F3]/95 lg:via-[#FAF8F3]/75 lg:to-transparent z-0" />
              </div>

              {/* Top Left Brand Logo Inside Hero Section */}
              <div className="absolute top-4 left-6 sm:left-10 lg:left-16 z-30">
                <Link href="/" className="inline-block cursor-pointer">
                  <img
                    src="/images/logo-dark.svg"
                    alt="BACSTORY"
                    className="h-6 sm:h-7 lg:h-8 w-auto object-contain"
                  />
                </Link>
              </div>

              {/* Main Inner Content Container aligned with Brand */}
              <div className="max-w-[1600px] mx-auto w-full px-6 sm:px-10 lg:px-16 pt-16 pb-10 lg:py-16 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-center">
                {/* Left Column: Brand Intro, Badges & Unclaimed Status - Exactly Centered */}
                <div className="lg:col-span-5 space-y-6 sm:space-y-8 my-auto">
                  {/* Title Header Block */}
                  <div className="space-y-3 pt-2">
                    <span className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-neutral-500 block">
                      W E L C O M E &nbsp; T O
                    </span>
                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-neutral-950 font-sans">
                      BACSTORY
                    </h1>
                    <div className="w-12 h-1 bg-[#6A6E53] rounded-full mt-2 mb-4" />
                    <p className="text-sm sm:text-base text-neutral-700 max-w-md leading-relaxed font-normal">
                      Every BACSTORY garment is more than just fashion — it's a story of quality, design, and authenticity.
                    </p>
                  </div>

                  {/* 3 Key Brand Pillars / Feature Pills */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-lg">
                    <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-2">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#E4E1D5] text-[#4E523A] flex items-center justify-center shadow-2xs">
                        <Award className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold tracking-wider text-neutral-800 uppercase leading-tight">
                        PREMIUM<br />QUALITY
                      </span>
                    </div>

                    <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-2 border-l border-neutral-300/60 pl-2 sm:pl-4">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#E4E1D5] text-[#4E523A] flex items-center justify-center shadow-2xs">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold tracking-wider text-neutral-800 uppercase leading-tight">
                        AUTHENTIC<br />GUARANTEE
                      </span>
                    </div>

                    <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-2 border-l border-neutral-300/60 pl-2 sm:pl-4">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#E4E1D5] text-[#4E523A] flex items-center justify-center shadow-2xs">
                        <Leaf className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold tracking-wider text-neutral-800 uppercase leading-tight">
                        RESPONSIBLE<br />FASHION
                      </span>
                    </div>
                  </div>

                  {/* Unclaimed Notification Banner Box */}
                  <div className="bg-[#FAF8F3]/90 backdrop-blur-xs border border-[#E3DFCFC0] rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 shadow-2xs max-w-lg">
                    <div className="w-10 h-10 rounded-full bg-[#E4E1D5] text-[#4E523A] flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-800 font-medium leading-normal">
                      This BACSTORY apparel QR code has <strong className="font-bold text-neutral-900">not been claimed</strong> yet.
                    </p>
                  </div>
                </div>

                {/* Right Column: Floating Claim Card positioned at mt-48 */}
                <div className="lg:col-span-7 w-full max-w-[100%] mx-auto mt-1 lg:mt-68">
                  <div className="md:bg-white/10 bg-[#FAF8F3]/90 backdrop-blur-md rounded-3xl p-6 border border-neutral-200/10 shadow-xl space-y-5">
                    {/* Header with Icon & Two-Line Title */}
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="space-y-0.5">
                          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 font-sans tracking-tight leading-tight">
                            Verify & Claim Your
                          </h2>
                          <h3 className="text-2xl sm:text-3xl font-bold text-[#767A59] font-sans tracking-tight leading-tight">
                            OR Garment
                          </h3>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-neutral-500 font-normal leading-relaxed pt-1">
                        Enter your Order ID and registered Email or Mobile Number below to receive a verification OTP and link this QR code to your profile.
                      </p>
                    </div>

                    {/* Horizontal Divider Line */}
                    <div className="border-b border-neutral-200/70 my-4" />

                    {!otpSent ? (
                      /* Step 1 Form: Single Horizontal Row Layout */
                      <form onSubmit={handleSendOtp} className="grid grid-cols-1 lg:grid-cols-12 gap-1 items-center pt-1">
                        {/* Order ID */}
                        <div className="lg:col-span-3">
                          <div className="relative">
                            <ShoppingBag className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5 pointer-events-none" />
                            <input
                              type="text"
                              required
                              maxLength={10}
                              placeholder="BAC-180019*"
                              value={orderId}
                              onChange={(e) => {
                                const raw = e.target.value.toUpperCase();
                                if (!raw) {
                                  setOrderId("");
                                  return;
                                }
                                let digitsAndLetters = raw.replace(/[^A-Z0-9]/g, "");
                                if (digitsAndLetters.startsWith("BAC")) {
                                  digitsAndLetters = digitsAndLetters.slice(3);
                                }
                                setOrderId(digitsAndLetters ? `BAC-${digitsAndLetters.slice(0, 6)}` : "BAC-");
                              }}
                              className="w-full bg-[#FAFAFA] border border-neutral-200/90 rounded-xl pl-9 pr-3 py-2.5 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black focus:bg-white text-xs sm:text-sm font-mono uppercase transition-colors"
                            />
                          </div>
                        </div>

                        {/* Email or Mobile */}
                        <div className="lg:col-span-4">
                          <div className="relative">
                            <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5 pointer-events-none" />
                            <input
                              type="text"
                              required
                              maxLength={50}
                              placeholder="Email or Mobile*"
                              value={email}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!val) {
                                  setEmail("");
                                  return;
                                }
                                if (val.includes("@")) {
                                  setEmail(val.toLowerCase().replace(/\s/g, "").slice(0, 50));
                                } else {
                                  const hasPlus = val.startsWith("+");
                                  const digits = val.replace(/\D/g, "");
                                  if (hasPlus) {
                                    setEmail(`+${digits.slice(0, 12)}`);
                                  } else {
                                    setEmail(digits.slice(0, 10));
                                  }
                                }
                              }}
                              className="w-full bg-[#FAFAFA] border border-neutral-200/90 rounded-xl pl-9 pr-3 py-2.5 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black focus:bg-white text-xs sm:text-sm transition-colors"
                            />
                          </div>
                        </div>

                        {/* Label */}
                        <div className="lg:col-span-3">
                          <div className="relative">
                            <Tag className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5 pointer-events-none" />
                            <input
                              type="text"
                              required
                              placeholder="Garment Label*"
                              value={garmentLabel}
                              onChange={(e) => setGarmentLabel(e.target.value)}
                              className="w-full bg-[#FAFAFA] border border-neutral-200/90 rounded-xl pl-9 pr-3 py-2.5 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black focus:bg-white text-xs sm:text-sm transition-colors"
                            />
                          </div>
                        </div>

                        {/* Verify Button */}
                        <div className="lg:col-span-2">
                          <button
                            type="submit"
                            disabled={sendingOtp}
                            className="w-full bg-black hover:bg-neutral-800 active:bg-neutral-900 text-white font-bold h-[42px] px-3 rounded-xl text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-md whitespace-nowrap"
                          >
                            {sendingOtp ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Verifying...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                                <span>Verify</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* Step 2 Form (OTP Input) */
                      <form onSubmit={handleVerifyAndClaim} className="space-y-4">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="text-xs text-emerald-800 space-y-0.5">
                            <p className="font-semibold">OTP Code Sent!</p>
                            <p>
                              We sent a 6-digit OTP code to <strong>{email}</strong>.
                            </p>
                            {mockOtpHint && (
                              <p className="text-[11px] font-mono text-emerald-700 pt-1">
                                (Dev OTP: <strong>{mockOtpHint}</strong>)
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                            ENTER 6-DIGIT VERIFICATION OTP
                          </label>
                          <div className="relative">
                            <KeyRound className="w-4 h-4 text-neutral-400 absolute left-4 top-3.5" />
                            <input
                              type="text"
                              required
                              placeholder="123456"
                              maxLength={6}
                              value={otp}
                              onChange={(e) => setOtp(e.target.value)}
                              className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-2xl pl-11 pr-4 py-3 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black focus:bg-white text-base font-mono tracking-widest text-center transition-colors"
                            />
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setOtpSent(false)}
                            className="px-5 py-3 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 font-semibold rounded-2xl text-xs sm:text-sm transition-colors"
                          >
                            Back
                          </button>
                          <button
                            type="submit"
                            disabled={verifying}
                            className="flex-1 bg-[#65684D] hover:bg-[#575A41] text-white font-bold py-3 px-6 rounded-2xl text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow-md"
                          >
                            {verifying ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-4 h-4 text-yellow" />
                                Verify Code
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* FULL WIDTH BOTTOM 4 FEATURES SECTION */}
            <div className="w-full bg-white/40 border-t border-neutral-200/80 py-6 sm:py-8">
              <div className="max-w-[1600px] mx-auto px-2 sm:px-6 lg:px-16">
                <div className="grid grid-cols-4 divide-x md:divide-neutral-200/70 divide-neutral-200/30">
                  {/* Feature 1 */}
                  <div className="flex flex-col items-center text-center px-1.5 sm:px-4">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#EFECE6] text-[#4E523A] flex items-center justify-center shrink-0 mb-2 shadow-2xs">
                      <Award className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.5]" />
                    </div>
                    <h4 className="text-[10px] sm:text-xs font-bold text-neutral-900 uppercase tracking-tight font-sans leading-tight">
                      100% Authentic
                    </h4>
                    <p className="text-[9px] sm:text-xs text-neutral-500 font-normal leading-tight mt-1">
                      Original products guaranteed.
                    </p>
                  </div>

                  {/* Feature 2 */}
                  <div className="flex flex-col items-center text-center px-1.5 sm:px-4">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#EFECE6] text-[#4E523A] flex items-center justify-center shrink-0 mb-2 shadow-2xs">
                      <User className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.5]" />
                    </div>
                    <h4 className="text-[10px] sm:text-xs font-bold text-neutral-900 uppercase tracking-tight font-sans leading-tight">
                      Digital Ownership
                    </h4>
                    <p className="text-[9px] sm:text-xs text-neutral-500 font-normal leading-tight mt-1">
                      Link your garment to your profile.
                    </p>
                  </div>

                  {/* Feature 3 */}
                  <div className="flex flex-col items-center text-center px-1.5 sm:px-4">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#EFECE6] text-[#4E523A] flex items-center justify-center shrink-0 mb-2 shadow-2xs">
                      <Gift className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.5]" />
                    </div>
                    <h4 className="text-[10px] sm:text-xs font-bold text-neutral-900 uppercase tracking-tight font-sans leading-tight">
                      Exclusive Benefits
                    </h4>
                    <p className="text-[9px] sm:text-xs text-neutral-500 font-normal leading-tight mt-1">
                      Get access to rewards and offers.
                    </p>
                  </div>

                  {/* Feature 4 */}
                  <div className="flex flex-col items-center text-center px-1.5 sm:px-4">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#EFECE6] text-[#4E523A] flex items-center justify-center shrink-0 mb-2 shadow-2xs">
                      <Headphones className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.5]" />
                    </div>
                    <h4 className="text-[10px] sm:text-xs font-bold text-neutral-900 uppercase tracking-tight font-sans leading-tight">
                      Customer Support
                    </h4>
                    <p className="text-[9px] sm:text-xs text-neutral-500 font-normal leading-tight mt-1">
                      We're here to help you anytime.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CLAIM SUCCESS STATE / QR LINKED BUT NOT ACTIVATED */}
        {(claimSuccess || (!loading && !errorMsg && qrData?.status !== "unlinked" && !qrData?.profileData?.customText && !qrData?.profileData?.bio)) && (
          <div className="min-h-screen w-full bg-[#E7DCD3] bg-[url('/images/qr-about/bg.png')] bg-cover bg-center bg-no-repeat relative overflow-hidden flex flex-col justify-between mx-auto px-6 sm:px-10 pt-6 select-none animate-in fade-in duration-300">
            {/* Background Decorative Rings & Effects */}

            {/* Top Brand Logo */}
            <div className="w-full max-w-[1600px] mx-auto z-20">
              <Link href="/" className="inline-block cursor-pointer">
                <img
                  src="/images/logo-dark.svg"
                  alt="BACSTORY"
                  className="h-6 sm:h-7 w-auto object-contain"
                />
              </Link>
            </div>

            {/* Main Center Card */}
            <div className="w-full max-w-lg mx-auto my-auto bg-white rounded-3xl p-8 sm:p-11 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-neutral-100/90 text-center space-y-6 relative z-10 my-10">
              {/* Green Circle Badge with Sparkles */}
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-pulse" />
                <div className="absolute inset-2 rounded-full bg-emerald-500/15" />
                <div className="relative w-12 h-12 rounded-full border-[2.5px] border-emerald-500 text-emerald-500 flex items-center justify-center bg-white shadow-2xs">
                  <Check className="w-6 h-6 stroke-[3] text-emerald-500" />
                </div>
                <Sparkles className="w-4 h-4 text-emerald-400 absolute top-1 left-2" />
                <Sparkles className="w-3 h-3 text-emerald-300 absolute bottom-2 right-2" />
                <Sparkles className="w-2.5 h-2.5 text-emerald-400 absolute top-4 right-1" />
                <Sparkles className="w-3 h-3 text-emerald-300 absolute bottom-3 left-3" />
              </div>

              {/* Pill Badge */}
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] text-[11px] font-bold tracking-wider uppercase">
                <Link2 className="w-3.5 h-3.5 text-[#D97706]" />
                <span>QR CLAIMED • STORY NOT ACTIVATED</span>
              </div>

              {/* Main Title Header */}
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight font-sans">
                  Your QR Code is <span className="text-[#22C55E] font-bold">Linked!</span>
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal px-2">
                  Your QR code <span className="font-mono text-[#22C55E] font-bold">{codeParam}</span> has been successfully linked to your account. Your digital story is currently unactivated.
                </p>
              </div>

              {/* Callout Box */}
              <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl p-4 text-xs sm:text-sm text-neutral-700 font-normal leading-relaxed text-left flex items-start gap-3">
                <span className="text-base select-none shrink-0">🪄</span>
                <p>
                  Now you can add your custom story message, bio, avatar, and social links from your <strong className="text-[#22C55E] font-bold">QR Identity</strong> section in your profile!
                </p>
              </div>

              {/* Dark CTA Button */}
              <div className="pt-2">
                <Link
                  href="/account/qr-identity"
                  className="w-full bg-[#111827] hover:bg-black text-white font-bold py-3.5 px-6 rounded-2xl text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer shadow-md group"
                >
                  <span className="w-6 h-6 rounded-lg border-[1.5px] border-[#22C55E] flex items-center justify-center text-[#22C55E] shrink-0">
                    <User className="w-3.5 h-3.5 stroke-[2.2]" />
                  </span>
                  <span>Go to Profile Section to Add Story</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Bottom Spacer */}
            <div className="h-4" />
          </div>
        )}

        {/* LINKED / ACTIVATED STATE: Display Public Story Profile (Matching Reference Design) */}
        {!loading && !errorMsg && qrData?.status !== "unlinked" && !claimSuccess && (qrData?.profileData?.customText || qrData?.profileData?.bio || qrData?.profileData?.title) && (
          <div className="min-h-screen w-full md:bg-[#E7DCD3] bg-[#E7DCD3]/40   lg:bg-[url('/images/qr-about/imageCopy.png')] bg-contain bg-start bg-no-repeat relative overflow-y-auto flex flex-col justify-between p-6 select-none animate-in fade-in duration-300">
            {/* Top Brand Header & Navigation Bar */}
            <div className="w-full max-w-full mx-auto z-20 md:pb-6 pb-0">
              <Link href="/" className="inline-block cursor-pointer">
                <img
                  src="/images/logo-dark.svg"
                  alt="BACSTORY"
                  className="h-6 sm:h-7 w-auto object-contain"
                />
              </Link>


            </div>

            {/* Main Center Container with Public Garment Card & Hangtag Graphic */}
            <div className="w-full max-w-[100%] md:max-w-[90%] mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10 md:py-6 py-0">
              {/* Left/Center Column: Public Garment Story Card */}
              <div className="lg:col-span-7 xl:col-span-6 w-full max-w-[100%] mx-auto bg-[#F8F5F2] rounded-[18px] p-7 sm:p-9 shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-neutral-100/90 text-center space-y-6 ">
                {/* Circular Avatar Image with Green Ring & Check Badge */}
                <div className="relative w-24 h-24 mx-auto">
                  <div className="w-full h-full rounded-full border-4 border-[#F3F4F1] shadow-xs overflow-hidden bg-neutral-100 flex items-center justify-center">
                    {qrData?.profileData?.avatarUrl ? (
                      <img
                        src={qrData.profileData.avatarUrl}
                        alt={qrData?.linkedUser?.name || "Owner"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#EFECE6] flex items-center justify-center text-[#707659]">
                        <User className="w-12 h-12 stroke-[1.5]" />
                      </div>
                    )}
                  </div>

                </div>

                {/* Owner Info & Verified Owner Badge */}
                <div>
                  {/* <p className="text-xs sm:text-sm font-medium text-neutral-500 font-sans">
                    This garment is claimed by
                  </p> */}
                  <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 capitalize tracking-tight font-sans flex items-center justify-center gap-1.5">
                    <span>{qrData?.profileData?.title?.trim() || qrData?.linkedUser?.name || "Anonymous"}</span>
                  </h2>


                </div>

                {/* Diamond Separator Line */}
                <div className="relative mb-4 flex items-center justify-center">
                  <div className="w-full border-t border-neutral-200/70" />
                  <div className="absolute px-2.5 text-[#C4C2B4] text-[10px]">✦</div>
                </div>

                {/* About the Owner Section */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-neutral-700 tracking-widest uppercase text-center">
                    ABOUT THE OWNER
                  </p>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal text-center px-2">
                    {qrData?.profileData?.bio || qrData?.profileData?.customText || "Loves minimal fashion, good coffee and creating a positive impact."}
                  </p>
                </div>

                {/* Connect Section (Social Links - Dynamic for all platforms) */}
                {qrData?.profileData?.socialLinks &&
                  Object.entries(qrData.profileData.socialLinks).some(([_, val]) => val && String(val).trim().length > 0) && (
                    <div className="space-y-2.5">
                      <p className="text-[11px] font-bold text-neutral-700 tracking-widest uppercase text-center">
                        CONNECT
                      </p>
                      <div className="bg-[#EFE9E5]/40 border border-neutral-200/60 rounded-2xl p-3.5 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                        {Object.entries(qrData.profileData.socialLinks).map(([platformId, linkVal]) => {
                          if (!linkVal || !String(linkVal).trim()) return null;
                          const rawVal = String(linkVal).trim();
                          const iconMap = {
                            instagram: "/images/landing-page/instagram.svg",
                            linkedin: "/images/landing-page/linkedin.svg",
                            twitter: "/images/landing-page/twitter.svg",
                            facebook: "/images/icons/facebook.svg",
                            snapchat: "/images/icons/snapchat.svg",
                            youtube: "/images/icons/youtube.svg",
                            spotify: "/images/icons/spotify.svg",
                            discord: "/images/icons/discord.svg",
                            dribble: "/images/icons/dribble.svg",
                            github: "/images/icons/github.svg",
                            pintrest: "/images/icons/pintrest.svg",
                            pinterest: "/images/icons/pintrest.svg",
                            telegram: "/images/icons/telegram.svg",
                            threds: "/images/icons/threds.svg",
                            threads: "/images/icons/threds.svg",
                            tiktok: "/images/icons/tiktok.svg",
                            whatsapp: "/images/icons/whatsapp.svg",
                            customUrl: "/images/landing-page/linkedin.svg",
                          };
                          const urlPrefixMap = {
                            instagram: "https://instagram.com/",
                            facebook: "https://facebook.com/",
                            snapchat: "https://snapchat.com/add/",
                            youtube: "https://youtube.com/",
                            twitter: "https://twitter.com/",
                            linkedin: "https://linkedin.com/in/",
                            spotify: "https://open.spotify.com/",
                            tiktok: "https://tiktok.com/@",
                            whatsapp: "https://wa.me/",
                            telegram: "https://t.me/",
                            github: "https://github.com/",
                            discord: "https://discord.gg/",
                            threds: "https://threads.net/@",
                            threads: "https://threads.net/@",
                            pintrest: "https://pinterest.com/",
                            pinterest: "https://pinterest.com/",
                            dribble: "https://dribbble.com/",
                          };

                          const iconSrc = iconMap[platformId] || "/images/landing-page/linkedin.svg";
                          const defaultPrefix = urlPrefixMap[platformId] || "https://";
                          const finalUrl = rawVal.startsWith("http")
                            ? rawVal
                            : `${defaultPrefix}${rawVal.replace(/^@/, "")}`;

                          return (
                            <a
                              key={platformId}
                              href={finalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-10 h-10 rounded-full bg-white shadow-2xs border border-neutral-200/80 flex items-center justify-center text-neutral-800 hover:scale-105 transition-transform cursor-pointer"
                              title={platformId}
                            >
                              <img src={iconSrc} alt={platformId} className="w-5 h-5 object-contain invert" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}


              </div>


            </div>

            {/* Bottom Footer Signoff */}
            <div className="w-full text-center space-y-1 pt-4 z-20">
              <p className="text-[11px] font-medium text-neutral-400 tracking-wide">
                Authentic Apparel. Built on Trust.
              </p>
              <img
                src="/images/logo-dark.svg"
                alt="BACSTORY"
                className="h-4 sm:h-5 w-auto mx-auto opacity-70 object-contain"
              />
            </div>
          </div>
        )}
      </main>

    </div>
  );
}
