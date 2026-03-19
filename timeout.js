const ms = require("ms");
const Case = require("../../database/models/Case");
const { getNextCaseId } = require("../../utils/caseUtils");
const { resolveMember } = require("../../utils/resolver");

module.exports = {
  name: "timeout",
  aliases: ["mute"],
  description: "Timeout a member",
  permissions: ["ModerateMembers"],

  async execute(message, args) {
    const member = await resolveMember(message, args[0]);
    if (!member) return message.reply("❌ Please provide a valid member mention, ID, or username.");

    if (
      member.roles.highest.position >=
      message.guild.members.me.roles.highest.position
    ) {
      return message.reply(
        "❌ I cannot timeout this member due to role hierarchy.",
      );
    }
    if (
      message.member.roles.highest.position <= member.roles.highest.position &&
      message.author.id !== message.guild.ownerId
    ) {
      return message.reply(
        "❌ You cannot timeout someone with an equal or higher role.",
      );
    }

    const duration = ms(args[1] || "");
    if (!duration)
      return message.reply("❌ Provide a valid duration (e.g., 10m, 1h).");

    const reason = args.slice(2).join(" ") || "No reason";

    try {
      await member.timeout(duration, reason);

      const caseId = await getNextCaseId(message.guild.id);
      await Case.create({
        guildId: message.guild.id,
        caseId,
        userId: member.id,
        moderatorId: message.author.id,
        action: "TIMEOUT",
        reason: `${args[1]} - ${reason}`,
      });

      message.channel.send(
        `⏳ **${member.user.tag} timed out** for ${args[1]} (Case #${caseId})`,
      );
    } catch (error) {
      console.error(error);
      message.reply("❌ Failed to timeout member.");
    }
  },
};
