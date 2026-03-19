const Leveling = require("../database/models/Leveling");
const { logAction } = require("./modLogging");

const XP_PER_MESSAGE = 5;
const XP_PER_MINUTE = 15;
const XP_TO_LEVEL = 100;

async function addMessageXp(guildId, userId) {
  let data = await Leveling.findOne({ guildId, userId });
  if (!data) {
    data = new Leveling({ guildId, userId });
  }

  data.xp += XP_PER_MESSAGE;
  data.messageXp += XP_PER_MESSAGE;
  data.totalXp += XP_PER_MESSAGE;

  const xpNeeded = data.level * XP_TO_LEVEL;
  if (data.xp >= xpNeeded) {
    data.level += 1;
    data.xp = 0;
    await logAction(guildId, userId, "LEVELUP", `Reached level ${data.level}`, userId, { newLevel: data.level });
    await data.save();
    return { leveledUp: true, newLevel: data.level };
  }

  await data.save();
  return { leveledUp: false };
}

async function getLeaderboard(guildId, limit = 10) {
  return await Leveling.find({ guildId })
    .sort({ level: -1, totalXp: -1 })
    .limit(limit);
}

async function getUserLevel(guildId, userId) {
  let data = await Leveling.findOne({ guildId, userId });
  if (!data) data = new Leveling({ guildId, userId });
  return data;
}

module.exports = { addMessageXp, getLeaderboard, getUserLevel, XP_PER_MESSAGE, XP_TO_LEVEL };
