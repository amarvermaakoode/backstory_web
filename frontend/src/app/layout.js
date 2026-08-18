import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata = {
  title: "BACSTORY | Story-Inspired Apparel",
  description:
    "Explore BACSTORY apparel inspired by identity, journeys, and personal stories. Discover unique pieces designed to be worn and remembered.",
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
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-black focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}

