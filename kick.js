const { EmbedBuilder } = require("discord.js");
const Case = require("../../database/models/Case");
const { getNextCaseId } = require("../../utils/caseUtils");
const { resolveMember } = require("../../utils/resolver");

module.exports = {
  name: "kick",
  description: "Kick a member from the server",
  permissions: ["KickMembers"],

  async execute(message, args, client) {
    const member = await resolveMember(message, args[0]);
    if (!member) return message.reply("❌ Provide a valid member mention, ID, or username.");
    if (member.id === message.author.id) return message.reply("❌ You cannot kick yourself.");
    if (member.id === client?.user?.id)  return message.reply("❌ I cannot kick myself.");

    if (!member.kickable) return message.reply("❌ I cannot kick this member — role hierarchy prevents it.");
    if (
      message.member.roles.highest.position <= member.roles.highest.position &&
      message.author.id !== message.guild.ownerId
    ) return message.reply("❌ You cannot kick someone with an equal or higher role.");

    const reason    = args.slice(1).join(" ") || "No reason provided";
    const caseId    = await getNextCaseId(message.guild.id);
    const timestamp = Math.floor(Date.now() / 1000);

    // DM before kicking
    const dmEmbed = new EmbedBuilder()
      .setTitle("👢 You Have Been Kicked")
      .setColor(0xe67e22)
      .setDescription(`You have been **kicked** from **${message.guild.name}**.`)
      .addFields(
        { name: "📋 Reason",    value: reason,               inline: false },
        { name: "👮 Moderator", value: message.author.tag,   inline: true  },
        { name: "🕐 Time",      value: `<t:${timestamp}:F>`, inline: true  },
        { name: "📁 Case",      value: `#${caseId}`,         inline: true  }
      )
      .setFooter({ text: "You may rejoin the server unless you are banned." })
      .setTimestamp();

    await member.send({ embeds: [dmEmbed] }).catch(() => {});

    try {
      await member.kick(`[Case #${caseId}] ${reason}`);
    } catch (err) {
      return message.reply(`❌ Failed to kick: ${err.message}`);
    }

    await Case.create({
      guildId:     message.guild.id,
      caseId,
      userId:      member.id,
      moderatorId: message.author.id,
      action:      "KICK",
      reason,
    });

    return message.channel.send({
      embeds: [new EmbedBuilder()
        .setTitle("👢 User Kicked")
        .setColor(0xe67e22)
        .addFields(
          { name: "👤 User",    value: `${member.user.tag} (${member.id})`, inline: true },
          { name: "👮 Mod",     value: message.author.tag,                  inline: true },
          { name: "📁 Case",    value: `#${caseId}`,                        inline: true },
          { name: "📋 Reason",  value: reason,                              inline: false },
          { name: "📩 DM Sent", value: "✅ User was notified",             inline: true  }
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp()]
    });
  }
};
