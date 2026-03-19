const ModLog = require("../database/models/ModLog");

async function logAction(guildId, userId, action, reason, target = null, details = {}) {
  try {
    await ModLog.create({
      guildId,
      userId,
      action,
      reason,
      target,
      details,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("Error logging action:", error);
  }
}

async function getModLogs(guildId, filter = {}, limit = 10) {
  return await ModLog.find({ guildId, ...filter })
    .sort({ timestamp: -1 })
    .limit(limit);
}

module.exports = { logAction, getModLogs };
