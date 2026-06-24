
const TOKEN = "ntn_a95548314665WoQaPGcmAOXn2d7anP8Agd8hsv59mos9yd";

// The parent page ID for "TokenPe Outreach"
const PARENT_PAGE_ID = "38823983286a804199dde4ec4dbfaa2a";

const headers = {
  "Authorization": `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
  "Notion-Version": "2022-06-28"
};

const h2 = (text) => ({ object: "block", type: "heading_2", heading_2: { rich_text: [{ text: { content: text } }] } });
const h3 = (text) => ({ object: "block", type: "heading_3", heading_3: { rich_text: [{ text: { content: text } }] } });
const p = (text) => ({ object: "block", type: "paragraph", paragraph: { rich_text: [{ text: { content: text } }] } });
const bullet = (text) => ({ object: "block", type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ text: { content: text } }] } });
const numbered = (text) => ({ object: "block", type: "numbered_list_item", numbered_list_item: { rich_text: [{ text: { content: text } }] } });
const divider = () => ({ object: "block", type: "divider", divider: {} });
const callout = (text, emoji = "💡") => ({ object: "block", type: "callout", callout: { rich_text: [{ text: { content: text } }], icon: { type: "emoji", emoji } } });
const quote = (text) => ({ object: "block", type: "quote", quote: { rich_text: [{ text: { content: text } }] } });
const code = (text) => ({ object: "block", type: "code", code: { rich_text: [{ text: { content: text } }], language: "plain text" } });

const n8nGuideBlocks = [
  callout("This guide explains how to set up an automated, 100% free cold email drip campaign for clinics using n8n, Google Sheets, and your Gmail account.", "🤖"),
  divider(),
  
  h2("🛠️ What You Need Before You Start"),
  bullet("An n8n account (n8n.cloud or self-hosted/desktop app)"),
  bullet("A Google account (for Gmail and Google Sheets)"),
  bullet("A Google Sheet containing your clinic leads"),
  divider(),

  h2("📋 Step 1: Prepare Your Google Sheet"),
  p("Create a Google Sheet with the following column headers exactly as written:"),
  bullet("ClinicName (e.g., 'City Dental')"),
  bullet("DoctorName (e.g., 'Dr. Sharma')"),
  bullet("Email (e.g., 'dr.sharma@example.com')"),
  bullet("Status (Set all new leads to 'New')"),
  bullet("LastEmailedDate (Leave blank initially)"),
  callout("Rule: Your n8n workflow will look at the 'Status' column to decide what email to send.", "📌"),
  divider(),

  h2("⚙️ Step 2: Set up n8n Connections"),
  p("In n8n, you need to add your credentials for Google:"),
  numbered("Go to 'Credentials' in the left menu of n8n."),
  numbered("Click 'Add Credential' and search for 'Google Sheets OAuth2 API'."),
  numbered("Connect your Google account so n8n can read/write your leads sheet."),
  numbered("Click 'Add Credential' again and search for 'Gmail OAuth2 API'."),
  numbered("Connect your Gmail account (this is what you will send emails from)."),
  divider(),

  h2("🏗️ Step 3: Build the n8n Workflow"),
  p("Here is the exact sequence of nodes you need to drag and drop:"),
  
  h3("Node 1: Schedule Trigger"),
  bullet("Add a 'Schedule Trigger' node."),
  bullet("Set it to run: Every Day at 10:00 AM."),

  h3("Node 2: Google Sheets (Read)"),
  bullet("Add a 'Google Sheets' node."),
  bullet("Operation: 'Get Many' (or 'Read Rows')."),
  bullet("Select your Leads spreadsheet and the specific sheet."),

  h3("Node 3: If / Switch Node (The Brain)"),
  bullet("Add an 'If' node (or Switch node)."),
  bullet("Condition 1: If Status == 'New' -> Route to Email 1"),
  bullet("Condition 2: If Status == 'E1 Sent' AND it's been 4 days -> Route to Email 2"),
  bullet("Condition 3: If Status == 'E2 Sent' AND it's been 10 days -> Route to Email 3"),

  h3("Node 4: Gmail (Send Email 1, 2, or 3)"),
  bullet("Add a 'Gmail' node to the end of your 'If' node branches."),
  bullet("Operation: 'Send Email'."),
  bullet("To: Drag the 'Email' column from your Google Sheet data."),
  bullet("Subject: Type your subject line."),
  bullet("Body: Type your email template. You can drag the 'DoctorName' column into the text to personalize it (e.g., 'Hi {{DoctorName}},')."),

  h3("Node 5: Google Sheets (Update)"),
  bullet("Add a 'Google Sheets' node after each Gmail node."),
  bullet("Operation: 'Update Row'."),
  bullet("Update the 'Status' column to 'E1 Sent' (or E2 Sent, etc.)."),
  bullet("Update the 'LastEmailedDate' to today's date."),
  divider(),

  h2("🛑 Step 4: The 'Stop on Reply' Safety Net (Crucial)"),
  callout("You do NOT want to send a cold follow-up email to a doctor who already replied to your first email! Here is how to stop the automation if they reply.", "⚠️"),
  numbered("Create a SECOND, separate workflow in n8n."),
  numbered("Trigger: 'Gmail Trigger' node (Listen for new emails in your inbox)."),
  numbered("Filter: Check if the incoming email is from someone in your Google Sheet."),
  numbered("Action: Add a 'Google Sheets' (Update) node. If a reply is received, change that doctor's Status to 'Replied' or 'Interested'."),
  p("Now, your main drip workflow (which only targets 'New', 'E1 Sent', or 'E2 Sent') will automatically skip this person tomorrow!"),
  divider(),

  h2("🎯 Why this setup is elite:"),
  quote("1. High Deliverability: Because emails come from a real Gmail account, they land in the primary inbox, not the Promotions tab like Resend or Mailchimp.\n2. Total Control: You visually see every step.\n3. Free forever: No SaaS subscriptions needed for outreach tools.")
];

async function createChildPage(parentId, title, blocks) {
  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers,
    body: JSON.stringify({
      parent: { page_id: parentId },
      properties: {
        title: { title: [{ text: { content: title } }] }
      },
      children: blocks
    })
  });
  const data = await res.json();
  if (data.object === "error") {
    console.error(`❌ Error creating "${title}":`, data.message);
    return null;
  }
  console.log(`✅ Created: "${title}" → ${data.url}`);
  return data;
}

async function main() {
  console.log("🚀 Pushing n8n Guide to Notion...\n");
  const data = await createChildPage(PARENT_PAGE_ID, "🤖 n8n Automated Email Guide", n8nGuideBlocks);
  if (data) {
     console.log("\n🎉 Done! Open Notion to see your page.");
  }
}

main().catch(console.error);
