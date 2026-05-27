"use client";

import Link from "next/link";

export default function TermsOfService() {
  const handleDownload = () => {
    const markdownContent = `# Terms of Service and Support Policy for TokenPe

**Effective Date: May 19, 2026**

Welcome to **TokenPe** (accessible from https://tokenpe.online). These Terms of Service outline the rules and regulations for the use of TokenPe's Platform and Services.

By accessing this website, we assume you accept these terms and conditions. Do not continue to use TokenPe if you do not agree to take all of the terms and conditions stated on this page.

---

## 1. User Account Responsibilities
To use our services, you must register and maintain an active user account:
* Account Security: You are entirely responsible for maintaining the confidentiality of your login credentials and session tokens.
* Acceptable Use: You agree not to use TokenPe for any unlawful activities, malicious network attacks, automated bulk spamming, or fraudulent messaging.
* Account Termination: We reserve the right to suspend or terminate accounts that violate our security guidelines or engage in abusive platform usage without prior notice.

---

## 2. Notification Deliverability and Limitations
* Delivery Channels: TokenPe utilizes third-party global telecommunication routes and cloud message gateways to deliver real-time notifications and alerts.
* Carrier Delays: We strive to achieve instant delivery, but we are not liable for delayed or undelivered notifications resulting from local network outages, carrier filters, device settings, or telecommunication network dropouts.
* Carrier Charges: Standard messaging rates or data charges from your mobile operator may apply when receiving notifications on your device.

---

## 3. Intellectual Property
Unless otherwise stated, TokenPe and/or its licensors own the intellectual property rights for all material, logo designs, backend structures, and code on TokenPe. All intellectual property rights are reserved. You may access this from TokenPe for your own personal use subjected to restrictions set in these terms.

---

## 4. Refund and Service Cancellation Policy
* Cancellation: You can cancel your subscription or delete your TokenPe account at any time via your user dashboard.
* Refunds: If you are enrolled in any paid usage tiers, charges are billed in advance. Refund requests for unused credits or platform issues can be requested by emailing our help desk at tokenpe.online@gmail.com

---

## 5. Support and Contact Information
We are committed to helping you integrate and resolve any issues with your TokenPe experience:
* Support Desk Email: tokenpe.online@gmail.com
* Expected Response Time: Under 24 hours for all integration and configuration issues.
* Corporate Address: Mumbai, Maharashtra, India.`;

    const blob = new Blob([markdownContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tokenpe-terms-of-service.md";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-zinc-950 dark:text-zinc-100 py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        {/* Navigation / Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-200 dark:border-zinc-800">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline mb-2 group">
              <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Terms & Support Policy
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
              Effective Date: May 19, 2026 | Last Updated: May 19, 2026
            </p>
          </div>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm hover:shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Terms
          </button>
        </div>

        {/* Content Card with Glassmorphism / Sleek design */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl dark:shadow-2xl-dark p-6 sm:p-10 space-y-8 leading-relaxed">
          <section className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-5 text-sm sm:text-base text-indigo-950 dark:text-indigo-200">
            <strong>Welcome to TokenPe!</strong> By accessing and using our website (<Link href="https://tokenpe.online" className="text-indigo-600 dark:text-indigo-400 hover:underline">https://tokenpe.online</Link>), you agree to comply with and be bound by the following terms, conditions, and support policies.
          </section>

          <hr className="border-slate-200 dark:border-zinc-800" />

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-sm font-bold">1</span>
              User Account Responsibilities
            </h2>
            <p className="text-slate-600 dark:text-zinc-300">
              To use our services, you must register and maintain an active user account:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-zinc-300">
              <li>
                <strong className="text-slate-800 dark:text-white">Account Security</strong>: You are entirely responsible for maintaining the confidentiality of your login credentials and session tokens.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-white">Acceptable Use</strong>: You agree not to use TokenPe for any unlawful activities, malicious network attacks, automated bulk spamming, or fraudulent messaging.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-white">Account Termination</strong>: We reserve the right to suspend or terminate accounts that violate our security guidelines or engage in abusive platform usage without prior notice.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-sm font-bold">2</span>
              Notification Deliverability and Limitations
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-zinc-300">
              <li>
                <strong className="text-slate-800 dark:text-white">Delivery Channels</strong>: TokenPe utilizes third-party global telecommunication routes and cloud message gateways to deliver real-time notifications and alerts.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-white">Carrier Delays</strong>: We strive to achieve instant delivery, but we are not liable for delayed or undelivered notifications resulting from local network outages, carrier filters, device settings, or telecommunication network dropouts.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-white">Carrier Charges</strong>: Standard messaging rates or data charges from your mobile operator may apply when receiving notifications on your device.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-sm font-bold">3</span>
              Intellectual Property
            </h2>
            <p className="text-slate-600 dark:text-zinc-300">
              Unless otherwise stated, TokenPe and/or its licensors own the intellectual property rights for all material, logo designs, backend structures, and code on TokenPe. All intellectual property rights are reserved. You may access this from TokenPe for your own personal use subjected to restrictions set in these terms.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-sm font-bold">4</span>
              Refund and Service Cancellation Policy
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-zinc-300">
              <li>
                <strong className="text-slate-800 dark:text-white">Cancellation</strong>: You can cancel your subscription or delete your TokenPe account at any time via your user dashboard.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-white">Refunds</strong>: If you are enrolled in any paid usage tiers, charges are billed in advance. Refund requests for unused credits or platform issues can be requested by emailing our help desk at <a href="mailto:support@tokenpe.online" className="text-indigo-600 dark:text-indigo-400 hover:underline">support@tokenpe.online</a>.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-sm font-bold">5</span>
              Support and Contact Information
            </h2>
            <p className="text-slate-600 dark:text-zinc-300">
              We are committed to helping you integrate and resolve any issues with your TokenPe experience:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-slate-100 dark:border-zinc-700 shadow-sm">
                <span className="text-xs text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Email Support</span>
                <a href="mailto:tokenpe.online@gmail.com" className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold text-base sm:text-lg">
                  tokenpe.online@gmail.com

                </a>
              </div>
              <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-slate-100 dark:border-zinc-700 shadow-sm">
                <span className="text-xs text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Response Time</span>
                <span className="text-slate-800 dark:text-white font-bold text-base sm:text-lg">
                  Under 24 Hours
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2">
              <strong>Corporate Address:</strong> Mumbai, Maharashtra, India.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-400 dark:text-zinc-500">
          <p>© {new Date().getFullYear()} TokenPe. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
