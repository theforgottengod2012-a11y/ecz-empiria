import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, Shield, AlertTriangle, Users, Ban, RefreshCw } from "lucide-react";

const LAST_UPDATED = "March 17, 2026";
const BOT_NAME = "Empiria";
const SUPPORT_SERVER = "discord.gg/ecz";
const CONTACT_EMAIL = "support@empiria-bot.com";

const sections = [
  {
    icon: Users,
    title: "1. Acceptance of Terms",
    content: `By using ${BOT_NAME} ("the Bot", "we", "us") in any Discord server or via direct message, you agree to be bound by these Terms of Service. If you do not agree to these terms, you must remove the Bot from your server immediately and cease all use.\n\nThese Terms apply to all users of the Bot, including server administrators, moderators, and regular members. Usage of the Bot constitutes acceptance of these Terms in their entirety.`
  },
  {
    icon: FileText,
    title: "2. Description of Service",
    content: `${BOT_NAME} is a multipurpose Discord bot that provides economy, moderation, government simulation, fun and games, pet systems, farming mechanics, giveaways, music playback, and various utility features.\n\nWe reserve the right to modify, suspend, or discontinue any feature of the Bot at any time without prior notice. We are not liable for any loss resulting from such modifications.`
  },
  {
    icon: Shield,
    title: "3. Permitted Use",
    content: `You may use ${BOT_NAME} for lawful purposes only. You agree not to:\n\n• Use the Bot to harass, abuse, threaten, or harm any individual\n• Attempt to exploit, hack, or otherwise compromise the Bot's systems\n• Use the Bot to send spam, unsolicited messages, or illegal content\n• Attempt to gain unauthorized access to Bot data, databases, or backend systems\n• Use automated scripts, bots, or other means to abuse the Bot's economy or game systems\n• Impersonate Empiria staff or misrepresent your relationship with us\n• Use the Bot to violate Discord's Terms of Service\n\nViolation of these rules may result in an immediate permanent ban from the Bot.`
  },
  {
    icon: AlertTriangle,
    title: "4. Economy & Virtual Currency",
    content: `All virtual currency, items, pets, crops, and other in-game assets within ${BOT_NAME}'s economy system have no real-world monetary value. They cannot be exchanged for real money, goods, or services.\n\nWe reserve the right to reset, modify, or remove any user's virtual assets at any time, particularly in cases of:\n\n• Exploitation of bugs or glitches\n• Use of unauthorized third-party tools\n• Violation of these Terms of Service\n• Server or database corruption\n\nWe make no guarantees about the availability, continuity, or persistence of virtual assets.`
  },
  {
    icon: Shield,
    title: "5. Moderation & Data Collection",
    content: `${BOT_NAME} collects and stores the following data to provide its services:\n\n• Discord User IDs and Guild IDs (for economy, moderation, and configuration)\n• Message metadata (for mod tracking — not message content except for AutoMod filtering)\n• Moderation actions (warns, bans, kicks, timeouts)\n• Economy data (wallet, bank, inventory, job, farm, pets)\n• Activity data (online time, message counts for mod tracker)\n\nThis data is stored securely in MongoDB and is used solely to provide the Bot's features. We do not sell this data to third parties.\n\nServer administrators have the right to request deletion of their server's data by contacting support.`
  },
  {
    icon: Ban,
    title: "6. Termination",
    content: `We reserve the right to ban any user or server from using ${BOT_NAME} at any time, for any reason, including but not limited to:\n\n• Violation of these Terms of Service\n• Violation of Discord's Terms of Service\n• Abusive behavior toward Bot systems or community members\n• Fraudulent use of economy systems\n\nBanned users may appeal by contacting us at our support server: ${SUPPORT_SERVER}\n\nWe may also discontinue the Bot service entirely at any time without notice.`
  },
  {
    icon: AlertTriangle,
    title: "7. Disclaimer of Warranties",
    content: `${BOT_NAME} is provided "as is" and "as available" without warranties of any kind, express or implied. We do not warrant that:\n\n• The Bot will be uninterrupted, error-free, or secure\n• Any errors or defects will be corrected\n• The Bot will meet your specific requirements\n\nYou use the Bot entirely at your own risk. We are not responsible for any loss of data, virtual assets, or damages arising from your use of the Bot.`
  },
  {
    icon: RefreshCw,
    title: "8. Changes to Terms",
    content: `We reserve the right to update these Terms of Service at any time. Continued use of ${BOT_NAME} after changes constitutes acceptance of the new Terms. We will announce major changes in our support server.\n\nFor questions or concerns about these Terms, contact us at:\n• Discord: ${SUPPORT_SERVER}\n• Email: ${CONTACT_EMAIL}`
  },
];

export default function Terms() {
  return (
    <div className="flex-1 overflow-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto p-6 py-8 space-y-6 animate-slide-in-up">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
          <p className="text-muted-foreground">
            Last updated: <strong>{LAST_UPDATED}</strong>
          </p>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Please read these terms carefully before using {BOT_NAME}. By using the bot, you agree to be bound by these terms.
          </p>
        </div>

        <Separator />

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section) => (
            <Card key={section.title} className="border-card-border" data-testid={`section-${section.title.split(".")[0].trim()}`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <section.icon className="w-5 h-5 text-primary" />
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
          <p>These terms are effective as of {LAST_UPDATED}</p>
          <p>
            Questions? Join our support server at{" "}
            <a href={`https://${SUPPORT_SERVER}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {SUPPORT_SERVER}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
