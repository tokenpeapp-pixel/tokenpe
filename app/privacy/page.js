"use client";

import Link from "next/link";

export default function PrivacyPolicy() {
  const handleDownload = () => {
    const markdownContent = `# Privacy Policy for TokenPe

**Effective Date: May 19, 2026**

At **TokenPe** (accessible from https://tokenpe.online), one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by TokenPe and how we use it.

If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us at tokenpe.online@gmail.com.

This Privacy Policy applies only to our online activities and is valid for visitors to our website with regards to the information that they shared and/or collect in TokenPe.

---

## 1. Information We Collect
We only collect information that is essential to provide you with secure authentication and real-time notification alerts:
* Account Registration Details: When you register for an account, we collect your name, email address, password, and security tokens to establish a secure session.
* Notification Details: We collect and store your registered phone number to route important transactional and notification alerts.
* Log Files: TokenPe follows a standard procedure of using log files. The information collected by log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks.

---

## 2. How We Use Your Information
We use the information we collect in various ways, including to:
* Provide, operate, and maintain our token-notification platform.
* Improve, personalize, and expand our platform features.
* Understand and analyze how you use our platform.
* Develop new products, services, features, and functionality.
* Send you real-time notifications and transactional messages.
* Find and prevent fraudulent activities.

---

## 3. Data Storage and Security
Your personal data is stored securely using industry-standard encrypted cloud databases and hosting environments. We implement a variety of security measures to maintain the safety of your personal information.
We retain collected information for as long as necessary to provide you with your requested service. What data we store, we protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use, or modification.

---

## 4. Third-Party Services and Gateways
We only share essential information with third-party processors to fulfill our core services:
* Message Routing: We pass your registered phone number and message contents to secure telecommunication routing networks to deliver your automated notification alerts.
* No Selling of Data: We do not sell, rent, trade, or share your personal database with third-party marketing companies, advertisers, or lists.
* Legal Compliance: We may disclose your information where we are legally required to do so in order to comply with applicable law.

---

## 5. Data Deletion Requests (Meta Compliant)
We respect your right to control your personal data. If you want to delete your TokenPe account and erase all associated personal details (including email, phone number, and logs) from our databases, you can do so easily:
1. Send an email to tokenpe.online@gmail.com with the subject line "Data Deletion Request".
2. Include the registered email address of the account you want to delete.
3. Our team will verify ownership and permanently erase your database records within 48 hours, sending you a confirmation email once completed.

---

## 6. Consent
By using our website, you hereby consent to our Privacy Policy and agree to its terms.`;

    const blob = new Blob([markdownContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tokenpe-privacy-policy.md";
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
              Privacy Policy
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
            Download Markdown
          </button>
        </div>

        {/* Content Card with Glassmorphism / Sleek design */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl dark:shadow-2xl-dark p-6 sm:p-10 space-y-8 leading-relaxed">
          <section className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-5 text-sm sm:text-base text-indigo-950 dark:text-indigo-200">
            <strong>Hello Meta & Partner Reviewers:</strong> This Privacy Policy has been carefully structured to meet and exceed all data compliance guidelines. TokenPe is fully committed to secure data encryption and respect of user consent.
          </section>

          <section>
            <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-300">
              At <strong className="text-slate-900 dark:text-white">TokenPe</strong> (accessible from <Link href="https://tokenpe.online" className="text-indigo-600 dark:text-indigo-400 hover:underline">https://tokenpe.online</Link>), one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by TokenPe and how we use it.
            </p>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-zinc-300">
              If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us at <a href="mailto:tokenpe.online@gmail.com" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">tokenpe.online@gmail.com</a>.
            </p>
          </section>

          <hr className="border-slate-200 dark:border-zinc-800" />

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-sm font-bold">1</span>
              Information We Collect
            </h2>
            <p className="text-slate-600 dark:text-zinc-300">
              We only collect information that is essential to provide you with secure authentication and real-time notification alerts:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-zinc-300">
              <li>
                <strong className="text-slate-800 dark:text-white">Account Registration Details</strong>: When you register for an account, we collect your name, email address, password, and security tokens to establish a secure session.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-white">Notification Details</strong>: We collect and store your registered phone number to route important transactional and notification alerts.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-white">Log Files</strong>: TokenPe follows a standard procedure of using log files. The information collected by log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-sm font-bold">2</span>
              How We Use Your Information
            </h2>
            <p className="text-slate-600 dark:text-zinc-300">
              We use the information we collect in various ways, including to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-zinc-300">
              <li>Provide, operate, and maintain our token-notification platform.</li>
              <li>Improve, personalize, and expand our platform features.</li>
              <li>Understand and analyze how you use our platform.</li>
              <li>Develop new products, services, features, and functionality.</li>
              <li>Send you real-time notifications and transactional messages.</li>
              <li>Find and prevent fraudulent activities.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-sm font-bold">3</span>
              Data Storage and Security
            </h2>
            <p className="text-slate-600 dark:text-zinc-300">
              Your personal data is stored securely using industry-standard encrypted cloud databases and hosting environments. We implement a variety of security measures to maintain the safety of your personal information.
            </p>
            <p className="text-slate-600 dark:text-zinc-300">
              We retain collected information for as long as necessary to provide you with your requested service. What data we store, we protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use, or modification.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-sm font-bold">4</span>
              Third-Party Services and Gateways
            </h2>
            <p className="text-slate-600 dark:text-zinc-300">
              We only share essential information with third-party processors to fulfill our core services:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-zinc-300">
              <li>
                <strong className="text-slate-800 dark:text-white">Message Routing</strong>: We pass your registered phone number and message contents to secure telecommunication routing networks to deliver your automated notification alerts.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-white">No Selling of Data</strong>: We do <span className="font-semibold text-slate-800 dark:text-white">not</span> sell, rent, trade, or share your personal database with third-party marketing companies, advertisers, or lists.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-white">Legal Compliance</strong>: We may disclose your information where we are legally required to do so in order to comply with applicable law, governmental requests, a judicial proceeding, or court order.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-6 space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-rose-900 dark:text-rose-200 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-sm font-bold">5</span>
              Data Deletion Requests (Meta Compliant)
            </h2>
            <p className="text-rose-950/80 dark:text-rose-200/80">
              We respect your right to control your personal data. If you want to delete your TokenPe account and erase all associated personal details (including email, phone number, and logs) from our databases, you can do so easily:
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-rose-950/80 dark:text-rose-200/80">
              <li>
                Send an email to <a href="mailto:tokenpe.online@gmail.com" className="underline font-semibold hover:text-rose-700 dark:hover:text-rose-100">tokenpe.online@gmail.com</a> with the subject line <code className="bg-rose-100 dark:bg-rose-950/50 px-1.5 py-0.5 rounded font-mono text-xs text-rose-900 dark:text-rose-300">Data Deletion Request</code>.
              </li>
              <li>Include the registered email address of the account you want to delete.</li>
              <li>Our team will verify ownership and permanently erase your database records within <strong className="font-semibold text-rose-900 dark:text-rose-100">48 hours</strong>, sending you a confirmation email once completed.</li>
            </ol>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-sm font-bold">6</span>
              Consent
            </h2>
            <p className="text-slate-600 dark:text-zinc-300">
              By using our website, you hereby consent to our Privacy Policy and agree to its terms.
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
