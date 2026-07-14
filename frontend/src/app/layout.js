import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import CartDrawer from "@/components/layout/CartDrawer";
import WishlistDrawer from "@/components/layout/WishlistDrawer";

export const metadata = {
  title: "BACSTORY | Premium Narrative & Backstory Generator",
  description: "Craft deep, rich character backstories and lore with AI-powered narrative design tools.",
  icons: {
    icon: [
      {
        url: "/images/light-theme-icon.svg",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/images/dark-theme-icon.svg",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  }
};



export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CartProvider>
          <WishlistProvider>
            {children}
            <CartDrawer />
            <WishlistDrawer />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}

