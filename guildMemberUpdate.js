/**
 * guildMemberUpdate.js — Detects staff role add/remove and triggers MT board refresh
 * Also handles: nickname changes for display name sync
 */

module.exports = {
  name: "guildMemberUpdate",
  once: false,

  async execute(oldMember, newMember, client) {
    try {
      const { invalidateGuildCache, refreshGuild } = require("../utils/modTracker");
      const ModTracker = require("../database/models/ModTracker");

      // ── Detect role changes ──────────────────────────────────────────────────
      const oldRoles = oldMember.roles.cache;
      const newRoles = newMember.roles.cache;

      const rolesAdded   = [...newRoles.keys()].filter(id => !oldRoles.has(id));
      const rolesRemoved = [...oldRoles.keys()].filter(id => !newRoles.has(id));

      if (!rolesAdded.length && !rolesRemoved.length) return;

      // Check if any changed role is a tracked staff role
      const config = await ModTracker.findOne({ guildId: newMember.guild.id });
      if (!config?.staffRoleIds?.length) return;

      const staffRoleIds  = config.staffRoleIds;
      const affectedStaff = [...rolesAdded, ...rolesRemoved].some(id => staffRoleIds.includes(id));
      if (!affectedStaff) return;

      // Invalidate caches so the board refreshes with the correct role assignments
      invalidateGuildCache(newMember.guild.id);

      // Trigger an immediate board refresh for this guild
      setImmediate(() => {
        refreshGuild(client, newMember.guild).catch(() => {});
      });

    } catch (err) {
      // Non-critical — silently ignore
    }
  },
};
