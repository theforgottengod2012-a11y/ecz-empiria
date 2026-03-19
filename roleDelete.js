const Guild = require("../../database/models/GuildSettings");

module.exports = {
  name: "roleDelete",
  async execute(role) {
    const guildData = await Guild.findOne({ guildId: role.guild.id });
    if (!guildData?.antiNuke) return;

    // Check who deleted
    const audit = await role.guild.fetchAuditLogs({ type: 31, limit: 1 }); // 31 is ROLE_DELETE
    const entry = audit.entries.first();
    if (!entry) return;
    const executor = entry.executor;

    // If executor not whitelisted
    if (!guildData.whitelist.includes(executor.id)) {
      // punish: kick
      const member = await role.guild.members.fetch(executor.id).catch(() => null);
      if (member && member.kickable) member.kick("Anti-Nuke triggered: role deletion");

      // Log
      const logChannel = role.guild.channels.cache.get(guildData.logsChannel);
      if (logChannel) logChannel.send(`🚨 **${executor.tag}** deleted a role and was kicked.`);
    }
  }
};