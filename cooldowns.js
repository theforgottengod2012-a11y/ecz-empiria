const cooldowns = new Map();

/**
 * Check if a user is on cooldown for a specific command
 * @param {string} commandName - Name of the command
 * @param {string} userId - Discord user ID
 * @returns {number} - Remaining cooldown in milliseconds, or 0 if not on cooldown
 */
function getCooldownRemaining(commandName, userId) {
  const key = `${commandName}-${userId}`;
  
  if (!cooldowns.has(key)) {
    return 0;
  }
  
  const expirationTime = cooldowns.get(key);
  const now = Date.now();
  const remaining = expirationTime - now;
  
  if (remaining <= 0) {
    cooldowns.delete(key);
    return 0;
  }
  
  return remaining;
}

/**
 * Set a cooldown for a user on a specific command
 * @param {string} commandName - Name of the command
 * @param {string} userId - Discord user ID
 * @param {number} cooldownMs - Cooldown duration in milliseconds
 */
function setCooldown(commandName, userId, cooldownMs) {
  const key = `${commandName}-${userId}`;
  const expirationTime = Date.now() + cooldownMs;
  cooldowns.set(key, expirationTime);
  
  // Auto-delete after cooldown expires
  setTimeout(() => {
    cooldowns.delete(key);
  }, cooldownMs);
}

/**
 * Check if user is on cooldown and set it if not
 * @param {string} commandName - Name of the command
 * @param {string} userId - Discord user ID
 * @param {number} cooldownMs - Cooldown duration in milliseconds
 * @returns {number} - Remaining cooldown if on cooldown, 0 if cooldown was set successfully
 */
function applyAndCheckCooldown(commandName, userId, cooldownMs) {
  const remaining = getCooldownRemaining(commandName, userId);
  
  if (remaining > 0) {
    return remaining;
  }
  
  setCooldown(commandName, userId, cooldownMs);
  return 0;
}

/**
 * Clear cooldown for a user on a specific command
 * @param {string} commandName - Name of the command
 * @param {string} userId - Discord user ID
 */
function clearCooldown(commandName, userId) {
  const key = `${commandName}-${userId}`;
  cooldowns.delete(key);
}

/**
 * Clear all cooldowns for a user
 * @param {string} userId - Discord user ID
 */
function clearUserCooldowns(userId) {
  for (const key of cooldowns.keys()) {
    if (key.endsWith(`-${userId}`)) {
      cooldowns.delete(key);
    }
  }
}

/**
 * Get cooldown in seconds
 * @param {string} commandName - Name of the command
 * @param {string} userId - Discord user ID
 * @returns {number} - Remaining cooldown in seconds
 */
function getCooldownSeconds(commandName, userId) {
  const remaining = getCooldownRemaining(commandName, userId);
  return Math.ceil(remaining / 1000);
}

module.exports = {
  getCooldownRemaining,
  setCooldown,
  applyAndCheckCooldown,
  clearCooldown,
  clearUserCooldowns,
  getCooldownSeconds
};
