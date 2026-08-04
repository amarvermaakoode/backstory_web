import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata = {
  title: "BACSTORY | Premium Narrative & Bacstory Generator",
  description: "Craft deep, rich character bacstories and lore with AI-powered narrative design tools.",
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
        {children}
      </body>
    </html>
  );
}

