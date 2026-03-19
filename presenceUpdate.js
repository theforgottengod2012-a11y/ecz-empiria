const ModActivity = require("../database/models/ModActivity");
const ModTracker  = require("../database/models/ModTracker");

module.exports = {
  name: "presenceUpdate",

  async execute(oldPresence, newPresence) {
    try {
      const user = newPresence?.user || oldPresence?.user;
      if (!user || user.bot) return;

      const guildId = (newPresence?.guild || oldPresence?.guild)?.id;
      if (!guildId) return;

      const oldStatus = oldPresence?.status || "offline";
      const newStatus = newPresence?.status  || "offline";
      if (oldStatus === newStatus) return;

      // Only track staff members
      const config = await ModTracker.findOne({ guildId });
      if (!config || !config.staffRoleIds.length) return;

      const guild  = newPresence?.guild || oldPresence?.guild;
      const member = guild?.members.cache.get(user.id);
      if (!member) return;

      const isStaff = member.roles.cache.some(r => config.staffRoleIds.includes(r.id));
      if (!isStaff) return;

      const now = new Date();

      const activity = await ModActivity.findOneAndUpdate(
        { guildId, userId: user.id },
        { $setOnInsert: { guildId, userId: user.id } },
        { upsert: true, new: true }
      );

      // Close out current session if they had one
      if (activity.sessionStart && activity.currentStatus !== "offline") {
        const elapsed = Math.floor((now - new Date(activity.sessionStart)) / 1000);
        activity.todayOnlineSeconds  = (activity.todayOnlineSeconds  || 0) + elapsed;
        activity.totalOnlineSeconds  = (activity.totalOnlineSeconds  || 0) + elapsed;
        activity.sessionStart = null;
      }

      // Start a new session if they are now online
      if (newStatus !== "offline" && newStatus !== "invisible") {
        activity.sessionStart = now;
        activity.lastSeen     = now;
      } else {
        activity.lastSeen = now;
      }

      activity.currentStatus = newStatus;
      await activity.save();

    } catch (err) {
      console.error("[presenceUpdate] error:", err.message);
    }
  },
};
