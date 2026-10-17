"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

/**
 * QRCodeCard component - Premium QR Code display with BACSTORY logo embedded
 * precisely at the mathematical center with High Error Correction (Level H).
 */
export default function QRCodeCard({
  code = "BAC-BD7B9F-EAAAFF",
  targetUrl,
  className = "",
  size = "normal", // "normal" | "compact" | "large"
  logoPath = "/images/light-theme-icon.svg",
  darkColor = "#000000",
  lightColor = "#FFFFFF",
}) {
  const [dataUrl, setDataUrl] = useState("");

  const urlToEncode =
    targetUrl ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/qr/${code}`
      : `https://bacstory.com/qr/${code}`);

  useEffect(() => {
    let isMounted = true;

    // Use Error Correction Level Q (25% capacity) for resilient scanning with custom color themes & logo
    const canvas = document.createElement("canvas");
    QRCode.toCanvas(canvas, urlToEncode, {
      errorCorrectionLevel: "Q",
      margin: 4,
      width: 400,
      color: {
        dark: darkColor || "#000000",
        light: lightColor || "#FFFFFF",
      },
    })
      .then(() => {
        if (!isMounted) return;
        const ctx = canvas.getContext("2d");
        const w = canvas.width;
        const h = canvas.height;

        // Center position and logo dimensions (~14% of total QR size)
        const logoSize = w * 0.14;
        const bgSize = logoSize + 8;
        const centerX = w / 2;
        const centerY = h / 2;

        // Draw protective background square in exact center matching base color
        ctx.fillStyle = lightColor || "#FFFFFF";
        const borderRadius = 6;
        const bgX = centerX - bgSize / 2;
        const bgY = centerY - bgSize / 2;

        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(bgX, bgY, bgSize, bgSize, borderRadius);
        } else {
          ctx.rect(bgX, bgY, bgSize, bgSize);
        }
        ctx.fill();

        // Load logo image and render inside protective center area
        const logoImg = new Image();
        logoImg.crossOrigin = "anonymous";
        logoImg.onload = () => {
          if (!isMounted) return;
          const logoX = centerX - logoSize / 2;
          const logoY = centerY - logoSize / 2;
          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
          setDataUrl(canvas.toDataURL("image/png"));
        };
        logoImg.onerror = () => {
          if (isMounted) setDataUrl(canvas.toDataURL("image/png"));
        };
        logoImg.src = logoPath;
      })
      .catch((err) => {
        console.error("Error generating QR code:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [urlToEncode, logoPath, darkColor, lightColor]);

  // Sizing variations
  const cardPadding =
    size === "compact"
      ? "p-6"
      : size === "large"
        ? "p-10 sm:p-14"
        : "p-8 sm:p-10";

  const qrImageSize =
    size === "compact"
      ? "w-28 h-28"
      : size === "large"
        ? "w-44 h-44"
        : "w-36 h-36 sm:w-40 sm:h-40";

  return (
    <div
      className={`bg-white rounded-3xl border border-neutral-200/90 shadow-sm flex items-center justify-center mx-auto select-none transition-all ${cardPadding} ${className}`}
    >
      <div
        className="p-3 sm:p-4 rounded-2xl border border-neutral-100 shadow-2xs flex items-center justify-center relative transition-colors"
        style={{ backgroundColor: lightColor || "#FFFFFF" }}
      >
        <div className="relative flex items-center justify-center select-none aspect-square">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={`QR Code for ${code}`}
              className={`${qrImageSize} object-contain rounded-lg aspect-square`}
            />
          ) : (
            <div className={`${qrImageSize} bg-neutral-50 animate-pulse rounded-lg aspect-square`} />
          )}

          {/* Centered Embedded BACSTORY Logo Overlay */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[14%] h-[14%] flex items-center justify-center pointer-events-none">
            <div
              className="w-full h-full rounded-lg p-[1.5px] shadow-2xs flex items-center justify-center border overflow-hidden"
              style={{
                backgroundColor: lightColor || "#FFFFFF",
                borderColor: lightColor || "#FFFFFF",
              }}
            >
              <img
                src={logoPath}
                alt="BACSTORY Logo"
                className="w-full h-full object-contain rounded-[3px]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
