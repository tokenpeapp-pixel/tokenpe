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
  description: "TokenPe replaces paper queues with secure, real-time WhatsApp-based digital queues. Help your patients wait comfortably at home and save hours daily. Features automated 10-away & 5-away queue alerts, AI voice notes in 10 Indian languages, and instant patient feedback star ratings.",
  keywords: [
    "TokenPe",
    "TokenPe WhatsApp Queue",
    "clinic queue management",
    "WhatsApp queue system",
    "OPD management software",
    "doctor token system India",
    "digital queue for doctors",
    "10 away 5 away whatsapp queue alert",
    "whatsapp voice notes clinic",
    "patient feedback rating whatsapp"
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://tokenpe.online",
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

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "TokenPe",
  "alternateName": ["Token Pe", "TokenPe Online"],
  "url": "https://tokenpe.online",
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "TokenPe",
  "url": "https://tokenpe.online",
  "logo": "https://tokenpe.online/icon.png",
  "description": "TokenPe is a WhatsApp-based digital queue and token management platform for clinics, hospitals, and businesses in India. Features 10-away and 5-away reminders, 10-language AI voice notes, and patient feedback ratings.",
  "knowsAbout": [
    "WhatsApp Queue Management",
    "Clinic OPD Token System",
    "Digital Queue Software India",
    "Doctor Appointment Queues",
    "10-Away and 5-Away Queue Alerts",
    "Multilingual AI Voice Notes",
    "Patient Feedback Star Rating"
  ]
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "TokenPe",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "url": "https://tokenpe.online",
  "description": "WhatsApp-based digital queue management system for clinics and hospitals in India.",
  "featureList": [
    "Automated 10-Away and 5-Away WhatsApp Queue Reminders",
    "AI WhatsApp Voice Notes in 10 Indian Languages (Hindi, Marathi, Gujarati, Punjabi, Tamil, Telugu, Bengali, Kannada, Malayalam, English)",
    "Interactive WhatsApp Patient Feedback Star Rating (1 to 5 Stars)",
    "Real-time OPD Token Queue Tracking & Wait Time Predictions"
  ],
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

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is TokenPe?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "TokenPe is India's leading WhatsApp-based OPD digital queue and token management platform for clinics and hospitals."
      }
    },
    {
      "@type": "Question",
      "name": "How do TokenPe queue reminders work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "TokenPe automatically sends patients WhatsApp text and AI voice note reminders when they are 10 tokens away and 5 tokens away from their turn."
      }
    },
    {
      "@type": "Question",
      "name": "Does TokenPe support regional languages for voice notes?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, TokenPe sends AI voice notes in 10 Indian languages including Hindi, Marathi, Gujarati, Punjabi, Tamil, Telugu, Bengali, Kannada, Malayalam, and English."
      }
    },
    {
      "@type": "Question",
      "name": "How does TokenPe collect patient feedback ratings?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Immediately after a consultation is completed, TokenPe sends an interactive WhatsApp star rating prompt (1 to 5 stars) to collect patient feedback."
      }
    }
  ]
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify([websiteSchema, organizationSchema, softwareSchema, faqSchema]) }}
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
