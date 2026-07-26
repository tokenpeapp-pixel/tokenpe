"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import LandingPageTemplate from "@/components/LandingPageTemplate";
import { Mic, MessageSquare, Zap, Bell, Calendar, QrCode } from "lucide-react";

export default function RootLandingPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      // Supabase fell back to the root Site URL. Forward it to the correct handler.
      router.replace('/auth/callback' + window.location.search + window.location.hash);
    }
  }, [router]);
  const config = {
    isRoot: true, // Enables the Vertical Selector
    theme: {
      bg: "#121315",
      textMain: "#f9fafb",
      textMuted: "#9ca3af",
      primaryStart: "#22c55e",
      primaryEnd: "#16a34a",
      secondaryAccent: "#2dd4a7",
      tint: "rgba(255, 255, 255, 0.05)",
    },
    hero: {
      tag: "The Universal Queue Management Platform",
      h1: "<span class=\"lp-h1-dim\">Stop making</span><br/><span class=\"lp-h1-white\">people wait.</span><br/><span class=\"lp-h1-green\">Manage queues</span><br/><span class=\"lp-h1-white\">on WhatsApp.</span>",
      sub: "Zero apps to download. Zero hardware. Just scan a QR code and let your customers wait comfortably anywhere while you manage the flow effortlessly."
    },
    compData: [
      { old: "Crowded waiting areas", new: "Wait comfortably anywhere" },
      { old: "No status updates", new: "Real-time WhatsApp alerts" },
      { old: "Manual token calling", new: "Automated notifications" },
      { old: "No customer data", new: "Full history & analytics" },
      { old: "App required to use", new: "Works on any phone via WhatsApp" }
    ],
    features: [
      { 
        ico: <MessageSquare size="22" color="#22c55e" strokeWidth={2.2} />, color: "transparent", iconColor: "#22c55e", bloom: "transparent", title: "Zero App for Customers", desc: "Scan QR → join queue. No downloads, no logins. Works on any phone.",
        GhostIco: MessageSquare,
        Deco: () => (
          <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="1.5" fill="currentColor"/><circle cx="20" cy="10" r="1.5" fill="currentColor"/><circle cx="30" cy="10" r="1.5" fill="currentColor"/>
            <circle cx="10" cy="20" r="1.5" fill="currentColor"/><circle cx="20" cy="20" r="1.5" fill="currentColor"/><circle cx="30" cy="20" r="1.5" fill="currentColor"/>
            <circle cx="10" cy="30" r="1.5" fill="currentColor"/><circle cx="20" cy="30" r="1.5" fill="currentColor"/><circle cx="30" cy="30" r="1.5" fill="currentColor"/>
          </svg>
        )
      },
      { 
        ico: <Zap size="22" color="#22c55e" strokeWidth={2.2} />, color: "transparent", iconColor: "#22c55e", bloom: "transparent", title: "Live Dashboard", desc: "See who's waiting, who's currently being served, and who's done.",
        GhostIco: Zap,
        Deco: () => (
          <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 35L20 20L35 25L55 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      },
      { 
        ico: <Bell size="22" color="#22c55e" strokeWidth={2.2} />, color: "transparent", iconColor: "#22c55e", bloom: "transparent", title: "Smart Auto Alerts", desc: "Automatic notifications to keep customers informed of their queue position.",
        GhostIco: Bell,
        Deco: () => (
          <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="30" cy="40" r="20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" fill="none"/>
            <circle cx="30" cy="40" r="35" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" fill="none"/>
          </svg>
        )
      }
    ]
  };

  return <LandingPageTemplate config={config} />;
}
