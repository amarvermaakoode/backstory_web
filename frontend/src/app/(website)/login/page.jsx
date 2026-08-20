"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Mail, Lock, CheckCircle2, ArrowRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useUserAuth } from "@/context/UserAuthContext";

const slideshowImages = [
  "/images/login/login1.png",
  "/images/login/login2.png",
  "/images/login/login3.png",
  "/images/login/login4.png",
];

export default function LoginPage() {
  const router = useRouter();
  const { sendOtp, verifyOtp } = useUserAuth();
  const [activeTab, setActiveTab] = useState("mobile");

  // Mobile Auth States
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [mockOtpCode, setMockOtpCode] = useState("");
  const otpRefs = useRef([]);

  // Email Auth States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");

  // Common UI States
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [bgColors, setBgColors] = useState({
    "/images/login/login1.png": "#F4F0EA",
    "/images/login/login2.png": "#7A5236", // fallback brown matching the black t-shirt slide
    "/images/login/login3.png": "#F4F0EA",
    "/images/login/login4.png": "#F4F0EA",
  });

  // Extract background colors dynamically on mount
  useEffect(() => {
    slideshowImages.forEach((src) => {
      const img = new window.Image();
      img.src = src;
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 50;
          canvas.height = 50;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, 50, 50);
          // Sample the top-left corner
          const pixel = ctx.getImageData(2, 2, 1, 1).data;
          const hex = "#" + ((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1);
          setBgColors((prev) => ({ ...prev, [src]: hex }));
        } catch (err) {
          console.error("Failed to extract color for " + src, err);
        }
      };
    });
  }, []);

  // Background carousel loop
  useEffect(() => {
    const interval = setInterval(() => {
      setSlideshowIndex((prev) => (prev + 1) % slideshowImages.length);
    }, 4500); // Cross-fade every 4.5 seconds
    return () => clearInterval(interval);
  }, []);

  // Handle phone input formatting
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setPhoneNumber(value);
    }
  };

  // Send OTP from actual API
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const isValid = activeTab === "mobile" ? phoneNumber.length === 10 : email.includes("@");
    if (!isValid) return;

    setLoading(true);
    setOtpError("");
    const res = await sendOtp(
      activeTab === "mobile" ? { phoneNumber } : { email }
    );
    setLoading(false);

    if (res.success) {
      setOtpSent(true);
      if (res.mockOtp) {
        setMockOtpCode(res.mockOtp);
      }
    } else {
      setOtpError(res.error || "Failed to send verification code. Please try again.");
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    setOtpCode(["", "", "", "", "", ""]);
    setOtpError("");
    setLoading(true);
    const res = await sendOtp(
      activeTab === "mobile" ? { phoneNumber } : { email }
    );
    setLoading(false);
    if (res.success) {
      if (res.mockOtp) {
        setMockOtpCode(res.mockOtp);
      }
      otpRefs.current[0]?.focus();
    } else {
      setOtpError(res.error || "Failed to resend verification code.");
    }
  };

  // Handle OTP digit inputs
  const handleOtpInput = (index, value) => {
    const cleanVal = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otpCode];
    newOtp[index] = cleanVal;
    setOtpCode(newOtp);

    // Auto-focus next input
    if (cleanVal && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Auto-focus previous input on backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP from actual API
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const completeOtp = otpCode.join("");
    if (completeOtp.length === 6) {
      setLoading(true);
      setOtpError("");
      const res = await verifyOtp({
        otp: completeOtp,
        ...(activeTab === "mobile" ? { phoneNumber } : { email }),
      });
      setLoading(false);

      if (res.success) {
        setAuthSuccess(true);
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } else {
        setOtpError(res.error || "Invalid verification code. Please try again.");
      }
    }
  };

  const currentBgColor = bgColors[slideshowImages[slideshowIndex]] || "#F4F0EA";

  return (
    <div
      className="min-h-screen text-black flex flex-col font-sans justify-between transition-colors duration-1000 ease-in-out"
      style={{ backgroundColor: currentBgColor }}
    >
      <Navbar solid={true} light={true} />

      <main className="relative flex-grow pt-20 sm:pt-24 lg:pt-17 flex flex-col justify-center min-h-[calc(100vh-4.25rem)]">

        {/* Background (Fills entire screen below navbar) */}
        <div
          className="absolute inset-0 w-full h-full select-none z-0 transition-colors duration-1000 ease-in-out overflow-hidden"
          style={{ backgroundColor: currentBgColor }}
        >
          {/* Mobile Background Image (Small Screens Only) */}
          <div className="block lg:hidden absolute inset-0">
            <Image
              src="/images/login/login-phone.png"
              alt="Login background"
              fill
              priority
              unoptimized
              className="object-cover object-right select-none"
            />
          </div>

          {/* Desktop Slideshow (Desktop Screens Only) */}
          <div className="hidden lg:block absolute inset-0">
            {slideshowImages.map((src, index) => (
              <div
                key={src}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === slideshowIndex ? "opacity-100" : "opacity-0"
                  }`}
              >
                <Image
                  src={src}
                  alt={`Narrative storytelling login display ${index + 1}`}
                  fill
                  priority={index === 0}
                  unoptimized
                  className="object-contain object-right select-none"
                />
              </div>
            ))}
          </div>

          {/* Soft tint overlay */}
          <div className="absolute inset-0 bg-black/5 pointer-events-none" />
        </div>

        {/* Content Layer (Overlaid above the background slideshow) */}
        <div className="relative z-10 flex-grow w-full flex items-center justify-center lg:justify-start px-4 sm:px-8 lg:pl-[8%] py-6 sm:py-10 lg:py-16">
          <div className="w-full max-w-[460px] bg-white border border-neutral-200/30 p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-[32px] shadow-2xl relative min-h-[420px] sm:min-h-[460px] flex flex-col justify-between my-auto">

            {authSuccess ? (
              /* Success State Overlay */
              <div className="flex flex-col items-center justify-center text-center space-y-4 my-auto py-8 animate-scaleUp">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-2 border border-green-100">
                  <CheckCircle2 className="w-10 h-10 stroke-[1.5]" />
                </div>
                <h2 className="heading-sub text-black font-semibold">
                  Welcome Back!
                </h2>
                <p className="text-sm text-neutral-400 font-medium">
                  Your story begins. Redirecting you home...
                </p>
              </div>
            ) : (
              /* Authentication Forms */
              <>
                <div>
                  {/* Header */}
                  <div className="mb-8">
                    {otpSent && (
                      <button
                        onClick={() => {
                          setOtpSent(false);
                          setMockOtpCode("");
                          setOtpCode(["", "", "", "", "", ""]);
                          setOtpError("");
                        }}
                        className="text-xs sm:text-sm text-neutral-400 hover:text-black font-semibold mb-4 transition-colors cursor-pointer"
                      >
                        &lt; Back
                      </button>
                    )}
                    <h1 className="heading-sub text-black font-semibold mb-1">
                      {otpSent ? "Enter the OTP" : "Login or Sign Up"}
                    </h1>
                    <p className="text-xs sm:text-sm text-neutral-400 font-medium">
                      {otpSent
                        ? `We've sent an OTP to ${activeTab === "mobile" ? `+91 ${phoneNumber}` : email}`
                        : "Your story starts here"
                      }
                    </p>
                  </div>

                  {/* Segmented Tab Bar Control */}
                  {!otpSent && (
                    <div className="bg-neutral-100 p-1.5 rounded-2xl flex gap-1 mb-8">
                      <button
                        type="button"
                        onClick={() => setActiveTab("mobile")}
                        className={`flex-1 text-center py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${activeTab === "mobile"
                          ? "bg-white text-black shadow-xs"
                          : "text-neutral-400 hover:text-black"
                          }`}
                      >
                        Mobile Number
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("email")}
                        className={`flex-1 text-center py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${activeTab === "email"
                          ? "bg-white text-black shadow-xs"
                          : "text-neutral-400 hover:text-black"
                          }`}
                      >
                        Email Address
                      </button>
                    </div>
                  )}

                  {/* Form Block */}
                  {otpSent ? (
                    /* OTP Verification Form (shared by both Mobile and Email) */
                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                      {mockOtpCode && (
                        <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-3 text-center">
                          <p className="text-[11px] font-semibold text-amber-800">
                            Mock Verification Code: <span className="font-bold text-sm tracking-widest">{mockOtpCode}</span>
                          </p>
                        </div>
                      )}
                      {otpError && (
                        <p className="text-xs font-semibold text-red-500 bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                          {otpError}
                        </p>
                      )}
                      <div>
                        <div className="flex justify-between gap-2 max-w-[320px] mx-auto mb-4">
                          {otpCode.map((digit, idx) => (
                            <input
                              key={idx}
                              ref={(el) => (otpRefs.current[idx] = el)}
                              type="text"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOtpInput(idx, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                              className="w-11 h-14 border border-neutral-200 rounded-xl text-center font-bold text-lg focus:outline-none focus:border-black transition-colors bg-white text-black"
                            />
                          ))}
                        </div>
                        <div className="text-xs text-neutral-400 font-medium mt-3">
                          Didn&apos;t receive the code?{" "}
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            className="text-black font-bold hover:underline transition-colors cursor-pointer"
                          >
                            Resend
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={otpCode.some((d) => !d) || loading}
                        className={`w-full h-14 rounded-full font-bold text-sm transition-all duration-300 active:scale-[0.99] cursor-pointer flex items-center justify-center ${!otpCode.some((d) => !d) && !loading
                          ? "bg-black text-white hover:bg-neutral-800 hover:shadow-md"
                          : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                          }`}
                      >
                        {loading ? "Verifying..." : "Verify & Continue"}
                      </button>
                    </form>
                  ) : (
                    /* Credentials Input Stage */
                    <form onSubmit={handleSendOtp} className="space-y-6">
                      {activeTab === "mobile" ? (
                        /* Mobile Phone Input */
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-400 tracking-wider mb-2 uppercase">
                            Mobile Number
                          </label>
                          <div className="flex items-center border border-neutral-200 focus-within:border-black rounded-xl h-14 bg-white overflow-hidden transition-colors">
                            <div className="flex items-center justify-center px-4 bg-transparent text-sm font-semibold text-neutral-700 border-r border-neutral-200 h-full select-none">
                              +91
                            </div>
                            <input
                              type="tel"
                              required
                              value={phoneNumber}
                              onChange={handlePhoneChange}
                              placeholder="98765 43210"
                              className="flex-1 h-full px-4 outline-none text-sm font-medium bg-transparent text-black"
                            />
                          </div>
                          <p className="text-[11px] text-neutral-400 mt-2 font-medium">
                            We&apos;ll send an OTP to verify your number
                          </p>
                        </div>
                      ) : (
                        /* Email Address Input (Passwordless) */
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-400 tracking-wider mb-2 uppercase">
                            Email Address
                          </label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="johndoe@gmail.com"
                            className="w-full h-14 border border-neutral-200 focus:outline-none focus:border-black rounded-xl px-4 outline-none text-sm font-medium transition-colors bg-white text-black"
                          />
                          <p className="text-[11px] text-neutral-400 mt-2 font-medium">
                            We&apos;ll send an OTP to verify your email
                          </p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={
                          (activeTab === "mobile" ? phoneNumber.length !== 10 : !email.includes("@")) ||
                          loading
                        }
                        className={`w-full h-14 rounded-full font-bold text-sm transition-all duration-300 active:scale-[0.99] cursor-pointer flex items-center justify-center ${((activeTab === "mobile" ? phoneNumber.length === 10 : email.includes("@")) && !loading)
                          ? "bg-black text-white hover:bg-neutral-800 hover:shadow-md"
                          : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                          }`}
                      >
                        {loading ? "Sending..." : "Continue"}
                      </button>
                    </form>
                  )}
                </div>

                {/* Terms & Privacy Policy Footnote */}
                <div className="text-center text-[10px] text-neutral-400 font-medium pt-8 mt-4 border-t border-neutral-100">
                  By continuing, you agree to our{" "}
                  <Link href="#terms" className="text-black hover:underline">
                    Terms
                  </Link>{" "}
                  &{" "}
                  <Link href="/privacy-policy" className="text-black hover:underline">
                    Privacy Policy
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
