const { PermissionFlagsBits } = require("discord.js");
const { resolveMember } = require("../../utils/resolver");

module.exports = {
  name: "jail",
  description: "Jail a member (requires 'Jailed' role setup)",
  module: "moderation",
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply("❌ You need `Moderate Members` permission.");
    }

    const member = await resolveMember(message, args[0]);
    if (!member) return message.reply("❌ Usage: `$jail <@member|ID>`");

    let jailRole = message.guild.roles.cache.find(r => r.name.toLowerCase() === "jailed");
    
    if (!jailRole) {
      message.reply("🔄 'Jailed' role not found. Creating it and setting up permissions...");
      try {
        jailRole = await message.guild.roles.create({
          name: "Jailed",
          color: "#000000",
          reason: "Jail system setup"
        });

        for (const [id, channel] of message.guild.channels.cache) {
          if (channel.type === 0 || channel.type === 2) { // Text or Voice
            await channel.permissionOverwrites.edit(jailRole, {
              SendMessages: false,
              Speak: false,
              AddReactions: false,
              Connect: false
            }).catch(() => {});
          }
        }
      } catch (e) {
        return message.reply("❌ Failed to setup Jail role. Check my permissions.");
      }
    }

    try {
      await member.roles.add(jailRole);
      message.reply(`🔒 **${member.user.tag}** has been jailed.`);
    } catch (err) {
      message.reply("❌ Failed to jail member.");
    }
  }
};
