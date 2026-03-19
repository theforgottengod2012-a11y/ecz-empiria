const Case = require("../../database/models/Case");
const { getNextCaseId } = require("../../utils/caseUtils");

module.exports = {
  name: "softban",
  description: "Ban and immediately unban to clear messages",
  permissions: ["BanMembers"],

  async execute(message, args) {
    const member = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!member) return message.reply("❌ Mention a member or provide a user ID.");

    if (member instanceof require("discord.js").GuildMember) {
      if (!member.bannable) return message.reply("❌ I cannot ban this member due to role hierarchy.");
      if (message.member.roles.highest.position <= member.roles.highest.position && message.author.id !== message.guild.ownerId) {
        return message.reply("❌ You cannot ban someone with an equal or higher role.");
      }
    }

    const reason = args.slice(1).join(" ") || "No reason";

    try {
      await message.guild.members.ban(member.id, { deleteMessageSeconds: 7 * 24 * 60 * 60, reason: `Softban: ${reason}` });
      await message.guild.members.unban(member.id, "Softban complete");

      const caseId = await getNextCaseId(message.guild.id);
      await Case.create({
        guildId: message.guild.id,
        caseId,
        userId: member.id,
        moderatorId: message.author.id,
        action: "SOFTBAN",
        reason
      });

      message.channel.send(`🍃 **${member.user?.tag || member.id} softbanned** (Case #${caseId})`);
    } catch (error) {
      console.error(error);
      message.reply("❌ Failed to softban member.");
    }
  }
};