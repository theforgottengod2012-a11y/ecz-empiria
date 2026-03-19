import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Lock, Database, Eye, Shield, Trash2, Mail, Globe } from "lucide-react";

const LAST_UPDATED = "March 17, 2026";
const BOT_NAME = "Empiria";
const SUPPORT_SERVER = "discord.gg/ecz";

const sections = [
  {
    icon: Database,
    title: "1. Information We Collect",
    content: `${BOT_NAME} collects minimal data necessary to operate its features. Here is exactly what we collect and why:\n\n📋 Discord User IDs\nWhy: Required to track economy data (wallet, inventory, pets, farm), mod actions, cooldowns, and settings per user.\n\n🏠 Discord Guild (Server) IDs\nWhy: Required to store per-server configurations, mod logs, government settings, and activity trackers.\n\n📊 Activity Data\nWhy: For the Mod Tracker system, we record message counts and online time for staff members only (not regular users by default). The general message channel activity is tracked as a count, not content.\n\n🛡️ Moderation Records\nWhy: Warns, bans, kicks, timeouts, and case numbers are stored to maintain server moderation history.\n\n💬 DM Messages\nWhy: When users send DMs to the bot, the messages are stored to allow bot owners to view and respond via the dashboard.\n\n📈 Economy & Game Data\nWhy: Wallets, banks, inventories, pets, crops, farm fields, jobs, prestige levels, and gambling statistics are stored to power the economy system.`
  },
  {
    icon: Eye,
    title: "2. How We Use Your Information",
    content: `We use collected information exclusively to provide the Bot's features:\n\n• Economy: Storing your balance, inventory, and items\n• Moderation: Logging mod actions and warnings\n• Mod Tracker: Showing staff activity to server administrators\n• Government: Managing server-wide economic policies\n• Games & Fun: Tracking wins, streaks, and game states\n• Pets & Farming: Saving your pets, crops, and progress\n• Giveaways: Tracking entries and selecting winners\n• DM Management: Allowing the bot owner to view and reply to DMs\n\nWe do NOT:\n• Sell your data to any third party\n• Use your data for advertising\n• Share your data with other servers\n• Read your messages except for AutoMod filtering (content is not stored, only action taken)`
  },
  {
    icon: Shield,
    title: "3. Data Storage & Security",
    content: `All data is stored in MongoDB Atlas with industry-standard encryption at rest and in transit. We implement the following security measures:\n\n• All database connections use TLS/SSL encryption\n• API access is protected with secret tokens\n• Environment variables and secrets are never exposed publicly\n• Only the bot owner has dashboard access\n• Regular backups are maintained\n\nWhile we take all reasonable precautions, no internet-based system can guarantee 100% security. Use of the Bot is at your own risk.`
  },
  {
    icon: Globe,
    title: "4. Data Retention",
    content: `We retain data for as long as necessary to provide our services:\n\n• User economy data: Retained until you request deletion\n• Moderation logs: Retained for 1 year by default (configurable per server)\n• DM logs: Retained for 90 days\n• Server configuration: Retained until the bot is removed from the server\n• Giveaway data: Retained for 30 days after giveaway ends\n\nWhen you request deletion, we permanently remove all associated data from our databases within 30 days.`
  },
  {
    icon: Trash2,
    title: "5. Your Rights & Data Deletion",
    content: `You have the following rights regarding your data:\n\n🗑️ Right to Deletion\nYou may request complete deletion of your data at any time. Contact us via the support server and we will process your request within 30 days.\n\n📋 Right to Access\nYou may request a copy of all data we hold about you.\n\n✏️ Right to Correction\nIf any data we hold about you is incorrect, contact us and we will correct it.\n\n🚫 Right to Object\nYou may object to how we use your data. In most cases, we can only service this by deleting your data as we require it to operate.\n\nServer administrators may additionally request deletion of all data associated with their server by removing the Bot and contacting support.`
  },
  {
    icon: Lock,
    title: "6. Third-Party Services",
    content: `${BOT_NAME} uses the following third-party services:\n\n• Discord API — The platform the Bot operates on. Governed by Discord's Privacy Policy (discord.com/privacy)\n• MongoDB Atlas — Database storage. Governed by MongoDB's Privacy Policy\n• Replit — Hosting platform. Governed by Replit's Privacy Policy\n\nWe are not responsible for the privacy practices of these third-party services. We encourage you to review their respective privacy policies.`
  },
  {
    icon: Mail,
    title: "7. Contact & Changes",
    content: `If you have questions, concerns, or requests regarding this Privacy Policy or your data, contact us:\n\n• Discord Support Server: ${SUPPORT_SERVER}\n• Use the /ticket command in our support server\n\nWe may update this Privacy Policy periodically. We will announce significant changes in our support server. Continued use of ${BOT_NAME} after changes constitutes acceptance of the updated policy.\n\nThis policy was last updated on ${LAST_UPDATED}.`
  },
];

export default function Privacy() {
  return (
    <div className="flex-1 overflow-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto p-6 py-8 space-y-6 animate-slide-in-up">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-green-500/15 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: <strong>{LAST_UPDATED}</strong>
          </p>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            {BOT_NAME} is committed to protecting your privacy. This policy explains exactly what data we collect, why we collect it, and how it's protected.
          </p>
        </div>

        {/* GDPR/Compliance Notice */}
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-foreground mb-1">Privacy First</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We collect only what we need. We never sell your data. You can request deletion at any time.
                  {BOT_NAME} is designed with privacy in mind.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section) => (
            <Card key={section.title} className="border-card-border" data-testid={`privacy-section-${section.title.split(".")[0].trim()}`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <section.icon className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-foreground mb-3">{section.title}</h2>
                    <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {section.content}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator />

        <div className="text-center text-xs text-muted-foreground space-y-1 pb-8">
          <p>This privacy policy is effective as of {LAST_UPDATED}</p>
          <p>
            Questions? Join{" "}
            <a href={`https://${SUPPORT_SERVER}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {SUPPORT_SERVER}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
