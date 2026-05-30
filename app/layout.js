import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import CookieConsent from "./components/CookieConsent";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "TokenPe - Smart WhatsApp Queues for Indian Clinics & Hospitals",
  description: "TokenPe replaces paper queues with secure, real-time WhatsApp-based digital queues. Help your patients wait comfortably at home and save hours daily.",
  icons: {
    icon: "/logo-icon.svg",
    shortcut: "/logo-icon.svg",
    apple: "/logo-icon.svg",
  },
  openGraph: {
    title: "TokenPe - Smart WhatsApp Queues",
    description: "Replace paper queues with real-time WhatsApp updates. Built for Indian Clinics.",
    url: "https://tokenpe.online",
    siteName: "TokenPe",
    images: [
      {
        url: "https://tokenpe.online/og-image.png",
        width: 1200,
        height: 630,
      }
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TokenPe - Smart WhatsApp Queues",
    description: "Replace paper queues with real-time WhatsApp updates. Built for Indian Clinics.",
    images: ["https://tokenpe.online/og-image.png"],
  }
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  );
}
