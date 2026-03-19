const config = require('../../config/moderation.json');

/**
 * Check if a member has moderator role
 * @param {GuildMember} member - Discord guild member
 * @returns {boolean}
 */
function isMod(member) {
  if (!member) return false;
  return member.roles.cache.some(role => 
    role.name === config.modRole || role.name === config.adminRole
  );
}

/**
 * Check if a member has administrator role
 * @param {GuildMember} member - Discord guild member
 * @returns {boolean}
 */
function isAdmin(member) {
  if (!member) return false;
  return member.roles.cache.some(role => role.name === config.adminRole);
}

/**
 * Check if a member has owner permissions (bot owner or server owner)
 * @param {GuildMember} member - Discord guild member
 * @param {string} botOwnerId - Bot owner Discord ID
 * @returns {boolean}
 */
function isOwner(member, botOwnerId) {
  if (!member) return false;
  return member.id === botOwnerId || member.guild.ownerId === member.id;
}

/**
 * Check if a user has a specific role by name
 * @param {GuildMember} member - Discord guild member
 * @param {string} roleName - Name of the role
 * @returns {boolean}
 */
function hasRole(member, roleName) {
  if (!member) return false;
  return member.roles.cache.some(role => role.name === roleName);
}

/**
 * Check if a user has any of the specified roles
 * @param {GuildMember} member - Discord guild member
 * @param {Array<string>} roleNames - Names of roles to check
 * @returns {boolean}
 */
function hasAnyRole(member, roleNames) {
  if (!member || !Array.isArray(roleNames)) return false;
  return member.roles.cache.some(role => roleNames.includes(role.name));
}

/**
 * Check if a member can be moderated (target is not above moderator in hierarchy)
 * @param {GuildMember} moderator - Moderator member
 * @param {GuildMember} target - Target member
 * @returns {boolean}
 */
function canModerate(moderator, target) {
  if (!moderator || !target) return false;
  if (target.guild.ownerId === target.id) return false; // Can't moderate owner
  return moderator.roles.highest.position > target.roles.highest.position;
}

/**
 * Check if a command is restricted to moderators
 * @param {string} commandName - Name of the command
 * @returns {boolean}
 */
function isModOnlyCommand(commandName) {
  const modOnlyCommands = ['ban', 'kick', 'timeout', 'warn', 'mute', 'unmute', 'nuke', 'clear'];
  return modOnlyCommands.includes(commandName.toLowerCase());
}

/**
 * Check if a user has permission to use a command
 * @param {GuildMember} member - Discord guild member
 * @param {string} commandName - Name of the command
 * @param {string} botOwnerId - Bot owner Discord ID
 * @returns {boolean}
 */
function hasCommandPermission(member, commandName, botOwnerId) {
  if (!member) return false;
  
  // Owner always has permission
  if (isOwner(member, botOwnerId)) return true;
  
  // Check if command is mod-only
  if (isModOnlyCommand(commandName)) {
    return isMod(member);
  }
  
  return true;
}

module.exports = {
  isMod,
  isAdmin,
  isOwner,
  hasRole,
  hasAnyRole,
  canModerate,
  isModOnlyCommand,
  hasCommandPermission
};
