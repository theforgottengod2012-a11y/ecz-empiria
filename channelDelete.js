const Guild = require("../../database/models/GuildSettings");

module.exports = {
  name: "channelDelete",
  async execute(channel) {
    const guildData = await Guild.findOne({ guildId: channel.guild.id });
    if (!guildData?.antiNuke) return;

    const audit = await channel.guild.fetchAuditLogs({ type: 12, limit: 1 }); // 12 is CHANNEL_DELETE
    const entry = audit.entries.first();
    if (!entry) return;
    const executor = entry.executor;

    if (!guildData.whitelist.includes(executor.id)) {
      const member = await channel.guild.members.fetch(executor.id).catch(() => null);
      if (member && member.kickable) member.kick("Anti-Nuke triggered: channel deletion");

      const logChannel = channel.guild.channels.cache.get(guildData.logsChannel);
      if (logChannel) logChannel.send(`🚨 **${executor.tag}** deleted a channel and was kicked.`);
    }
  }
};