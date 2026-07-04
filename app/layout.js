import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { GoogleAnalytics } from '@next/third-parties/google';
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
  metadataBase: new URL("https://tokenpe.online"),
  title: "TokenPe - Smart WhatsApp Queues for Indian Clinics & Hospitals",
  description: "TokenPe replaces paper queues with secure, real-time WhatsApp-based digital queues. Help your patients wait comfortably at home and save hours daily.",
  keywords: ["clinic queue management", "WhatsApp queue system", "OPD management software", "doctor token system India", "digital queue for doctors"],
  alternates: {
    canonical: "https://tokenpe.online",
  },
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
    shortcut: '/icon.png',
  },
  verification: {
    google: "YOUR_GOOGLE_SEARCH_CONSOLE_VERIFICATION_STRING",
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
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "TokenPe",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "url": "https://tokenpe.online",
  "description": "WhatsApp-based digital queue management system for clinics and hospitals in India.",
  "offers": {
    "@type": "Offer",
    "price": "499",
    "priceCurrency": "INR"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "128"
  }
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <CookieConsent />
        <Analytics />
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || "G-XXXXXXXXXX"} />
      </body>
    </html>
  );
}
