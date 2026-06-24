
const TOKEN = "ntn_a95548314665WoQaPGcmAOXn2d7anP8Agd8hsv59mos9yd";

// The Doctor Outreach Playbook page created earlier
const DOCTOR_PAGE_ID = "38823983-286a-812d-b574-e8f045d6eb08";

const headers = {
  "Authorization": `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
  "Notion-Version": "2022-06-28"
};

// ── Block helpers ─────────────────────────────────────────────────────────────
const h1 = (text) => ({ object: "block", type: "heading_1", heading_1: { rich_text: [{ text: { content: text } }] } });
const h2 = (text) => ({ object: "block", type: "heading_2", heading_2: { rich_text: [{ text: { content: text } }] } });
const h3 = (text) => ({ object: "block", type: "heading_3", heading_3: { rich_text: [{ text: { content: text } }] } });
const p = (text) => ({ object: "block", type: "paragraph", paragraph: { rich_text: [{ text: { content: text } }] } });
const bullet = (text) => ({ object: "block", type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ text: { content: text } }] } });
const divider = () => ({ object: "block", type: "divider", divider: {} });
const callout = (text, emoji = "💡") => ({ object: "block", type: "callout", callout: { rich_text: [{ text: { content: text } }], icon: { type: "emoji", emoji } } });
const code = (text) => ({ object: "block", type: "code", code: { rich_text: [{ text: { content: text } }], language: "plain text" } });
const quote = (text) => ({ object: "block", type: "quote", quote: { rich_text: [{ text: { content: text } }] } });

// ── Full content from doctor_outreach_guide.md ────────────────────────────────
const fullContent = [
  callout("The Golden Rule: You are not selling. You are a local person who built something to solve a real problem they already have. Doctors deal with queues every single day. Your job is just to get 10 minutes — not to pitch.", "💡"),
  divider(),

  // MINDSET SHIFT
  h2("🧠 The Mindset Shift"),
  p("Before you send a single message, burn these into your brain."),
  quote("❌ Never say: \"I have a product for you\"\n✅ Say instead: \"I noticed something and built a small solution — wanted to show you\""),
  quote("❌ Never say: \"Free trial\"\n✅ Say instead: \"You can try it with your actual patients, no setup needed\""),
  quote("❌ Never say: \"Our platform\"\n✅ Say instead: \"a simple WhatsApp-based system I built\""),
  quote("❌ Never say: \"I'm reaching out because...\"\n✅ Say instead: \"I was near your clinic and...\""),
  quote("❌ Never say: \"Features include...\"\n✅ Say instead: \"What happens is...\""),
  divider(),

  // WHATSAPP TEMPLATES
  h2("📱 WhatsApp Message Templates"),
  callout("WhatsApp works best. Doctors check it constantly. Keep it short. Always send from your personal number — not a business account. It feels more genuine.", "📌"),
  divider(),

  h3("W1 — First Message (Cold, Very Casual)"),
  callout("When to use: First contact with any doctor you've never spoken to.", "🎯"),
  code("Hi Dr. [Name],\n\nI'm Rahul — I'm from [City/Area]. I built a small system that \nmanages patient queues on WhatsApp for clinics.\n\nPatients get their token number and updates directly on WhatsApp — \nno app to download, nothing to install.\n\nWould love to show you how it works in 10 mins — \nat your clinic whenever it's convenient for you.\n\nNo pressure at all 🙂"),
  divider(),

  h3("W2 — If You've Seen a Long Queue at Their Clinic"),
  callout("When to use: When you've personally visited the clinic before or know they have heavy footfall.", "🎯"),
  code("Hi Dr. [Name],\n\nI've visited your clinic before and noticed patients waiting outside \nwithout knowing their turn.\n\nI built a WhatsApp queue system specifically for clinics like yours. \nPatients get their token and real-time updates on WhatsApp automatically.\n\nCan I show you how it works? Just 10 minutes — \ncompletely free to try with your own patients."),
  divider(),

  h3("W3 — Follow-Up (No Reply in 2–3 Days)"),
  callout("When to use: They haven't replied to W1 or W2. Send this once, not twice.", "🎯"),
  code("Hi Dr. [Name], just following up on my last message.\n\nTotally understand if you're busy — \njust wanted to leave you a quick video of how it works:\n👉 [loom.com/your-demo-video-link]\n\nIf you think it could be useful, I'm happy to come by any time."),
  callout("Pro Tip: The Loom video link in W3 is your most powerful asset. Record a 90-second demo showing a real patient receiving a WhatsApp token message. Doctors forward this to colleagues. One video can get you 5 demos.", "🎬"),
  divider(),

  h3("W4 — Warm Follow-Up (After They've Watched the Video)"),
  callout("When to use: They've watched your Loom video but haven't booked a demo yet.", "🎯"),
  code("Did you get a chance to see the video? \n\nI'm setting up free trials for a few clinics in [Area] this week \n— no payment needed, just wanted real feedback from doctors.\n\nWould your clinic be open to trying it for a week?"),
  divider(),

  // EMAIL TEMPLATES
  h2("📧 Cold Email Templates"),
  callout("Use email when you find a clinic email on Google Maps, JustDial, or Practo. Email is slower than WhatsApp but more formal and sometimes preferred by senior doctors.", "📌"),
  divider(),

  h3("E1 — First Email"),
  p("Subject: Quick question about your clinic's patient queue"),
  code("Hi Dr. [Name],\n\nMy name is Rahul and I'm from [City].\n\nI've been building a small WhatsApp-based queue management system \nfor clinics. The idea is simple: patients get their token number \nand live updates on WhatsApp — no waiting, no crowding, no app.\n\nI'm reaching out to a few doctors in [Area] to get honest feedback \nbefore I grow this further.\n\nWould you be open to a 10-minute call or visit this week? \nI can come to your clinic at your convenience.\n\nNo sales pitch — just a quick demo and your thoughts.\n\nThanks,\nRahul\n[Your phone number]"),
  divider(),

  h3("E2 — Follow-Up Email (Day 4–5, No Reply)"),
  p("Subject: Re: Quick question about your clinic's patient queue"),
  code("Hi Dr. [Name],\n\nJust following up on my earlier email.\n\nI recorded a quick 90-second video showing exactly how it works —\nmaybe easier than a call: [video link]\n\nHappy to answer any questions or come by whenever works for you.\n\nThanks,\nRahul"),
  divider(),

  h3("E3 — Final Follow-Up (Day 10)"),
  p("Subject: Closing the loop"),
  code("Hi Dr. [Name],\n\nI'll stop reaching out after this — just wanted to leave you with \nthe link in case it's ever useful:\n\n👉 tokenpe.online\n\nIt's a WhatsApp queue system built for Indian clinics. \nFree to try, no app download for patients.\n\nWishing you and your team all the best!\n\nRahul"),
  divider(),

  // OBJECTION HANDLING
  h2("💬 Objection Handling Scripts"),

  h3("When They Reply: \"Tell me more\""),
  callout("Keep it casual. Don't dump features. Push for the in-person meeting.", "🎯"),
  code("It's basically this:\n\n1. You share a link or QR code with your patients\n2. They click it on WhatsApp and get a token number  \n3. As the queue moves, they get automatic WhatsApp updates\n4. You see everything on a simple dashboard\n\nNo app to download, no hardware, nothing technical.\n\nThe best way to understand is to just try it for a day with real patients —\ntakes 2 minutes to set up.\n\nWant me to come by tomorrow or the day after?"),
  divider(),

  h3("When They Say: \"Send me more info\""),
  callout("Don't send a PDF or brochure. This is a delay tactic. Push back gently.", "⚠️"),
  code("Honestly the best way to get it is to see it live — \nit's very visual. Takes literally 2 minutes to show.\n\nCan I just come by for 10 minutes this week? \nEven between patients is fine."),
  divider(),

  // WHERE TO FIND CONTACTS
  h2("🔍 Where to Find Doctor Contacts"),
  bullet("Google Maps → Search 'clinic near [area]' → most have WhatsApp numbers listed"),
  bullet("JustDial → Search by specialty + city → phone numbers shown"),
  bullet("Practo → Doctor profiles sometimes list emails"),
  bullet("Instagram / Facebook → Many clinics have pages with direct contact"),
  bullet("Physical visit → Walk into the clinic and ask for the doctor's WhatsApp — highest conversion"),
  divider(),

  // BEST TIMES
  h2("🕐 Best Times to Send"),
  bullet("WhatsApp → 8–9 AM or 8–10 PM → Before/after OPD hours when doctors are free"),
  bullet("Email → Tue–Thu, 9–11 AM → Least ignored, highest open rates"),
  bullet("In-person visit → 2–4 PM → Slower OPD time, more likely to get a moment"),
  divider(),

  // LOOM VIDEO SCRIPT
  h2("🎬 The Loom Demo Video — Script (90 Seconds)"),
  callout("This is more powerful than any email or message. Record this once and use it forever.", "🏆"),
  p("Setup: Open two windows side by side:"),
  bullet("Left: tokenpe.online/[your-test-clinic-code] on your phone (patient view)"),
  bullet("Right: Your TokenPe dashboard (doctor view)"),
  p("What to say while recording:"),
  code("\"So this is how a patient joins the queue — \nthey just open this link on WhatsApp...\"\n\n[Show patient clicking link, entering name]\n\n\"They instantly get their token number on WhatsApp — \nno app, nothing to download...\"\n\n[Show the WhatsApp message appearing on phone]\n\n\"And on my side, I can see the queue live. \nWhen I click Next...\"\n\n[Click 'Call Next' on dashboard]\n\n\"The patient gets an automatic update on WhatsApp.\"\n\n[Show the WhatsApp notification arriving]\n\n\"That's it. The whole thing.\""),
  p("That 90 seconds closes more demos than any email."),
  divider(),

  // TRACKING TABLE
  h2("📊 Track Your Outreach"),
  p("Keep this table updated every day. Don't rely on memory."),
  callout("Use a Google Sheet with these columns:\nDoctor Name | Clinic | WhatsApp No. | Email | Date Sent | Template Used | Status | Notes", "📋"),
  p("Status Legend:"),
  bullet("🟡 Sent — Message sent, no reply yet"),
  bullet("💬 Replied — They responded something"),
  bullet("🟢 Interested — Want a demo"),
  bullet("📅 Demo Done — You showed them the product"),
  bullet("✅ Signed Up — They registered on TokenPe"),
  bullet("❌ Not Interested — Move on"),
  divider(),

  // DAILY TARGET
  h2("🎯 Daily Target"),
  callout("Aim for 20 messages per day. You only need 2–3 demo bookings per week to start getting real traction. One demo can turn into a referral to 5 more doctors.", "💪"),
  divider(),
  p("Built by Rahul · TokenPe · tokenpe.online"),
];

// Push blocks in batches of 100 (Notion API limit)
async function appendBlocks(pageId, blocks) {
  const batchSize = 100;
  for (let i = 0; i < blocks.length; i += batchSize) {
    const batch = blocks.slice(i, i + batchSize);
    const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ children: batch })
    });
    const data = await res.json();
    if (data.object === "error") {
      console.error(`❌ Error at batch ${i}:`, data.message);
      return false;
    }
    console.log(`✅ Pushed blocks ${i + 1}–${Math.min(i + batchSize, blocks.length)} of ${blocks.length}`);
  }
  return true;
}

async function main() {
  console.log("🚀 Pushing FULL Doctor Outreach Guide to Notion...\n");
  const ok = await appendBlocks(DOCTOR_PAGE_ID, fullContent);
  if (ok) {
    console.log("\n🎉 Done! Open your Doctor Outreach Playbook in Notion.");
    console.log("🔗 https://app.notion.com/p/Doctor-Outreach-Playbook-38823983286a812db574e8f045d6eb08");
  }
}

main().catch(console.error);
