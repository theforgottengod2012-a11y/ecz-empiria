const GuildSettings = require("../database/models/GuildSettings");
const AutoMod = require("../database/models/AutoMod");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "guildMemberAdd",
  once: false,

  async execute(member, client) {
    try {
      const config = await AutoMod.findOne({ guildId: member.guild.id });
      if (config && config.autoRole) {
        const role = member.guild.roles.cache.get(config.autoRole);
        if (role) {
          await member.roles.add(role).catch(() => {});
        }
      }

      const settings = await GuildSettings.findOne({ guildId: member.guild.id });
      if (!settings || !settings.welcomeChannel) return;

      const channel = member.guild.channels.cache.get(settings.welcomeChannel);
      if (!channel) return;

      const msg = (settings.welcomeMessage || "Welcome {user} to {server}!")
        .replace("{user}", `<@${member.id}>`)
        .replace("{server}", member.guild.name)
        .replace("{memberCount}", member.guild.memberCount);

      const embed = new EmbedBuilder()
        .setTitle(`🎉 Welcome to ${member.guild.name}!`)
        .setDescription(msg)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setColor(0x57f287)
        .addFields(
          { name: "👤 Member", value: `<@${member.id}>`, inline: true },
          { name: "🔢 Member #", value: `${member.guild.memberCount}`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: member.guild.name });

      channel.send({ content: `<@${member.id}>`, embeds: [embed] });
    } catch (err) {
      console.error("[guildMemberAdd]", err.message);
    }
  },
};
