const { EmbedBuilder } = require("discord.js");
const InviteTracker = require("../../database/models/InviteTracker");

module.exports = {
  name: "invites",
  description: "Check your invite count",
  async execute(message, args) {
    const user = args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : message.member;
    if (!user) return message.reply("❌ User not found.");

    const invites = await InviteTracker.countDocuments({ guildId: message.guild.id, inviter: user.id, fake: false });

    const embed = new EmbedBuilder()
      .setTitle(`📊 Invite Stats for ${user.user.username}`)
      .setDescription(`**Total Invites:** ${invites}`)
      .setColor("#5865F2")
      .setFooter({ text: "Fake invites are detected when users leave quickly" });

    message.reply({ embeds: [embed] });
  }
};
