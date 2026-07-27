"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import LandingPageTemplate from "@/components/LandingPageTemplate";
import { MessageSquare, Zap, Bell, CreditCard, Bot, Star, PhoneCall, Languages, BarChart3 } from "lucide-react";

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
      },
      { 
        ico: <CreditCard size="22" color="#22c55e" strokeWidth={2.2} />, color: "transparent", iconColor: "#22c55e", bloom: "transparent", title: "Built-in POS Billing", desc: "Bill customers directly from the same dashboard — no separate POS software needed.",
        GhostIco: CreditCard,
        Deco: () => (
          <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="10" width="50" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <line x1="5" y1="16" x2="55" y2="16" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        )
      },
      { 
        ico: <Bot size="22" color="#22c55e" strokeWidth={2.2} />, color: "transparent", iconColor: "#22c55e", bloom: "transparent", title: "WhatsApp Chatbot", desc: "Auto-reply to customer queries, bookings & FAQs on WhatsApp — 24/7, no manual typing.",
        GhostIco: Bot,
        Deco: () => (
          <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="15" cy="20" r="4" fill="currentColor"/>
            <circle cx="45" cy="20" r="4" fill="currentColor"/>
            <circle cx="30" cy="30" r="4" fill="currentColor"/>
          </svg>
        )
      },
      { 
        ico: <Star size="22" color="#22c55e" strokeWidth={2.2} />, color: "transparent", iconColor: "#22c55e", bloom: "transparent", title: "Google Review Sync", desc: "Auto-request ratings after each visit and grow your Google reviews on autopilot.",
        GhostIco: Star,
        Deco: () => (
          <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M30 5L36 18L50 20L40 30L42 44L30 37L18 44L20 30L10 20L24 18Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      },
      { 
        ico: <PhoneCall size="22" color="#22c55e" strokeWidth={2.2} />, color: "transparent", iconColor: "#22c55e", bloom: "transparent", title: "AI Voice Agent", desc: "Never miss a call — our voice agent answers, books slots & handles queries for you.",
        GhostIco: PhoneCall,
        Deco: () => (
          <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 20C10 12 18 5 30 5C42 5 50 12 50 20C50 28 42 35 30 35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )
      },
      { 
        ico: <Languages size="22" color="#22c55e" strokeWidth={2.2} />, color: "transparent", iconColor: "#22c55e", bloom: "transparent", title: "Voice Notes, 10 Languages", desc: "Customers get spoken alerts in their own language — Hindi, Tamil, Bengali & more.",
        GhostIco: Languages,
        Deco: () => (
          <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 20L15 10L20 30L25 15L30 25L35 5L40 35L45 15L50 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      },
      { 
        ico: <BarChart3 size="22" color="#22c55e" strokeWidth={2.2} />, color: "transparent", iconColor: "#22c55e", bloom: "transparent", title: "Analytics & Reports", desc: "Complete queue data, peak hour trends & revenue insights for any past date at a glance.",
        GhostIco: BarChart3,
        Deco: () => (
          <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="25" width="8" height="15" rx="2" fill="currentColor"/>
            <rect x="20" y="15" width="8" height="25" rx="2" fill="currentColor"/>
            <rect x="35" y="5" width="8" height="35" rx="2" fill="currentColor"/>
            <rect x="50" y="20" width="8" height="20" rx="2" fill="currentColor"/>
          </svg>
        )
      }
    ]
  };

  return <LandingPageTemplate config={config} />;
}
