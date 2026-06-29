import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata = {
  title: "BACSTORY | Premium Narrative & Backstory Generator",
  description: "Craft deep, rich character backstories and lore with AI-powered narrative design tools.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

