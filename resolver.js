/**
 * Resolves a user from a mention, ID, or username/tag.
 * @param {import("discord.js").Message} message 
 * @param {string} query 
 * @returns {Promise<import("discord.js").User|null>}
 */
async function resolveUser(message, query) {
  if (!query) return null;
  
  // 1. Check for mention
  const mention = message.mentions.users.first();
  if (mention && (query.includes(mention.id))) return mention;

  // 2. Check for ID
  const idMatch = query.match(/^\d{17,19}$/);
  if (idMatch) {
    try {
      return await message.client.users.fetch(query);
    } catch (e) {
      return null;
    }
  }

  // 3. Check for username/tag in cache
  const normalizedQuery = query.toLowerCase();
  const cachedUser = message.client.users.cache.find(u => 
    u.username.toLowerCase() === normalizedQuery || 
    u.tag.toLowerCase() === normalizedQuery
  );
  if (cachedUser) return cachedUser;

  // 4. Search in guild members (more thorough)
  try {
    const members = await message.guild.members.fetch({ query, limit: 1 });
    if (members.first()) return members.first().user;
  } catch (e) {}

  return null;
}

/**
 * Resolves a member from a mention, ID, or username/tag.
 * @param {import("discord.js").Message} message 
 * @param {string} query 
 * @returns {Promise<import("discord.js").GuildMember|null>}
 */
async function resolveMember(message, query) {
  if (!query) return null;

  // 1. Check for mention
  const mention = message.mentions.members.first();
  if (mention && (query.includes(mention.id))) return mention;

  // 2. Check for ID
  const idMatch = query.match(/^\d{17,19}$/);
  if (idMatch) {
    try {
      return await message.guild.members.fetch(query);
    } catch (e) {
      return null;
    }
  }

  // 3. Search by name/tag
  try {
    const members = await message.guild.members.fetch({ query, limit: 1 });
    return members.first() || null;
  } catch (e) {}

  return null;
}

/**
 * Resolves a role from a mention, ID, or name.
 * @param {import("discord.js").Message} message 
 * @param {string} query 
 * @returns {import("discord.js").Role|null}
 */
function resolveRole(message, query) {
  if (!query) return null;

  // 1. Check for mention
  const mention = message.mentions.roles.first();
  if (mention && (query.includes(mention.id))) return mention;

  // 2. Check for ID
  const idMatch = query.match(/^\d{17,19}$/);
  if (idMatch) {
    return message.guild.roles.cache.get(query) || null;
  }

  // 3. Check for name
  const normalizedQuery = query.toLowerCase();
  return message.guild.roles.cache.find(r => 
    r.name.toLowerCase() === normalizedQuery
  ) || null;
}

module.exports = {
  resolveUser,
  resolveMember,
  resolveRole
};
