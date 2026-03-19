const User = require("../database/models/User");

/**
 * Core engine to handle game starts, rewards, and stats
 */
async function startGame({
  message,
  userId,
  gameName,
  rewardRange,
  onWin,
  onLose
}) {
  const reward =
    Math.floor(
      Math.random() * (rewardRange.max - rewardRange.min + 1)
    ) + rewardRange.min;

  // Execute win/loss callbacks if provided
  if (onWin) await onWin(reward);
  if (onLose) await onLose();

  // Unified stats and economy update
  await User.findOneAndUpdate(
    { userId },
    {
      $inc: {
        "games.played": 1,
        "games.wins": onWin ? 1 : 0,
        wallet: onWin ? reward : 0
      }
    },
    { upsert: true }
  );

  return reward;
}

module.exports = {
  startGame,
};
