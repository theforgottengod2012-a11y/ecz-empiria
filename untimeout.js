const Case = require("../../database/models/Case");
const { getNextCaseId } = require("../../utils/caseUtils");

module.exports = {
  name: "untimeout",
  aliases: ["unmute"],
  description: "Remove timeout from a member",
  permissions: ["ModerateMembers"],

  async execute(message, args) {
    const member = message.mentions.members.first();
    if (!member) return message.reply("❌ Mention a member.");

    if (
      member.roles.highest.position >=
      message.guild.members.me.roles.highest.position
    ) {
      return message.reply(
        "❌ I cannot modify this member's timeout due to role hierarchy.",
      );
    }
    if (
      message.member.roles.highest.position <= member.roles.highest.position &&
      message.author.id !== message.guild.ownerId
    ) {
      return message.reply(
        "❌ You cannot modify the timeout of someone with an equal or higher role.",
      );
    }

    try {
      await member.timeout(null);

      const caseId = await getNextCaseId(message.guild.id);
      await Case.create({
        guildId: message.guild.id,
        caseId,
        userId: member.id,
        moderatorId: message.author.id,
        action: "UNTIMEOUT",
        reason: "Manual untimeout",
      });

      message.channel.send(
        `✅ Removed timeout from **${member.user.tag}** (Case #${caseId})`,
      );
    } catch (error) {
      console.error(error);
      message.reply("❌ Failed to remove timeout.");
    }
  },
};
