const { EmbedBuilder } = require("discord.js");
const Warning = require("../../database/models/Warning");
const Case    = require("../../database/models/Case");
const { getNextCaseId } = require("../../utils/caseUtils");
const { resolveUser }   = require("../../utils/resolver");

const ESCALATION = [
  { count: 3, msg: "⚠️ **3 warnings** — User is approaching mute threshold." },
  { count: 5, msg: "🔇 **5 warnings** — Consider muting this user." },
  { count: 7, msg: "👢 **7 warnings** — Kick recommended." },
  { count: 10, msg: "🔨 **10 warnings** — Ban strongly recommended." },
];

module.exports = {
  name: "warn",
  description: "Warn a user — DMs them and tracks warning count with auto-escalation.",
  permissions: ["ModerateMembers"],

  async execute(message, args, client) {
    const user = await resolveUser(message, args[0]);
    if (!user) return message.reply("❌ Provide a valid user mention, ID, or username.");
    if (user.id === message.author.id) return message.reply("❌ You cannot warn yourself.");
    if (user.bot) return message.reply("❌ You cannot warn bots.");

    const reason  = args.slice(1).join(" ") || "No reason provided";
    const caseId  = await getNextCaseId(message.guild.id);
    const timestamp = Math.floor(Date.now() / 1000);

    let data = await Warning.findOne({ guildId: message.guild.id, userId: user.id });
    if (!data) data = new Warning({ guildId: message.guild.id, userId: user.id, warnings: [] });
    data.warnings.push({ moderatorId: message.author.id, reason, timestamp: new Date() });
    await data.save();

    await Case.create({
      guildId:     message.guild.id,
      caseId,
      userId:      user.id,
      moderatorId: message.author.id,
      action:      "WARN",
      reason,
    });

    const totalWarns = data.warnings.length;

    // DM the warned user
    const dmEmbed = new EmbedBuilder()
      .setTitle("⚠️ You Have Been Warned")
      .setColor(0xfee75c)
      .setDescription(`You have received a **warning** in **${message.guild.name}**.`)
      .addFields(
        { name: "📋 Reason",        value: reason,                        inline: false },
        { name: "👮 Moderator",     value: message.author.tag,            inline: true  },
        { name: "🕐 Time",          value: `<t:${timestamp}:F>`,          inline: true  },
        { name: "📁 Case",          value: `#${caseId}`,                  inline: true  },
        { name: "🔢 Total Warnings",value: `${totalWarns}`,               inline: true  }
      )
      .setFooter({ text: "Further rule violations may result in mute, kick, or ban." })
      .setTimestamp();

    await user.send({ embeds: [dmEmbed] }).catch(() => {});

    // Channel confirmation
    await message.channel.send({
      embeds: [new EmbedBuilder()
        .setTitle("⚠️ Warning Issued")
        .setColor(0xfee75c)
        .addFields(
          { name: "👤 User",           value: `${user.tag} (${user.id})`, inline: true  },
          { name: "👮 Mod",            value: message.author.tag,         inline: true  },
          { name: "📁 Case",           value: `#${caseId}`,               inline: true  },
          { name: "📋 Reason",         value: reason,                     inline: false },
          { name: "🔢 Total Warnings", value: `${totalWarns}`,            inline: true  },
          { name: "📩 DM Sent",        value: "✅ User was notified",     inline: true  }
        )
        .setTimestamp()]
    });

    // Auto-escalation
    const escalation = ESCALATION.find(e => e.count === totalWarns);
    if (escalation) {
      await message.channel.send({
        embeds: [new EmbedBuilder()
          .setTitle("🚨 Warning Threshold Reached")
          .setDescription(`${escalation.msg}\n\nUser currently has **${totalWarns}** warnings.`)
          .setColor(totalWarns >= 10 ? 0xed4245 : totalWarns >= 7 ? 0xe67e22 : 0xfee75c)]
      });
    }
  }
};
