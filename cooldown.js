const cooldowns = new Map();

/**
 * Shared cooldown system for games and commands
 */
function hasCooldown(userId, command, time) {
  const key = `${userId}-${command}`;
  const now = Date.now();

  if (!cooldowns.has(key)) {
    cooldowns.set(key, now);
    return false;
  }

  const expiration = cooldowns.get(key) + time;
  if (now < expiration) return true;

  cooldowns.set(key, now);
  return false;
}

module.exports = { hasCooldown };
