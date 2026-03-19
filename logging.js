const config = require('../../config/server.json');
const { EmbedBuilder } = require('discord.js');

/**
 * Send a log message to the designated log channel
 * @param {Client} client - Discord client
 * @param {Guild} guild - Discord guild
 * @param {string} action - Type of action (e.g., 'MOD_ACTION', 'ECONOMY', 'TICKET')
 * @param {string} description - Description of the action
 * @param {string} userId - ID of the user involved
 * @param {object} details - Additional details to log
 */
async function logAction(client, guild, action, description, userId, details = {}) {
  if (!guild) return;
  
  try {
    const logChannel = guild.channels.cache.find(ch => 
      ch.name === config.mainLogChannel && ch.isTextBased()
    );
    
    if (!logChannel) {
      console.warn(`Log channel "${config.mainLogChannel}" not found in guild ${guild.name}`);
      return;
    }
    
    const embed = new EmbedBuilder()
      .setColor(config.botColor || '#FF6B6B')
      .setTitle(`📋 ${action}`)
      .setDescription(description)
      .addFields(
        { name: 'User ID', value: userId || 'System', inline: true },
        { name: 'Timestamp', value: new Date().toLocaleString(), inline: true },
        { name: 'Guild', value: guild.name, inline: false }
      );
    
    // Add additional details if provided
    if (Object.keys(details).length > 0) {
      for (const [key, value] of Object.entries(details)) {
        embed.addFields({
          name: key,
          value: String(value).slice(0, 1024),
          inline: true
        });
      }
    }
    
    await logChannel.send({ embeds: [embed] });
  } catch (error) {
    console.error(`Error logging action ${action}:`, error);
  }
}

/**
 * Log an error to the error log channel
 * @param {Client} client - Discord client
 * @param {Guild} guild - Discord guild
 * @param {string} errorMessage - Error message
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 */
async function logError(client, guild, errorMessage, error, context = '') {
  if (!guild) {
    console.error(`[ERROR] ${context}: ${errorMessage}`, error);
    return;
  }
  
  try {
    const errorChannel = guild.channels.cache.find(ch => 
      ch.name === config.errorLogChannel && ch.isTextBased()
    );
    
    if (!errorChannel) {
      console.error(`Error channel "${config.errorLogChannel}" not found`);
      return;
    }
    
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('⚠️ Bot Error')
      .setDescription(errorMessage)
      .addFields(
        { name: 'Context', value: context || 'Unknown', inline: false },
        { name: 'Error Details', value: error?.message || 'No details', inline: false },
        { name: 'Timestamp', value: new Date().toLocaleString(), inline: false }
      );
    
    if (error?.stack) {
      const stack = error.stack.slice(0, 1024);
      embed.addFields({ name: 'Stack Trace', value: `\`\`\`${stack}\`\`\``, inline: false });
    }
    
    await errorChannel.send({ embeds: [embed] });
  } catch (err) {
    console.error(`Failed to log error to channel:`, err);
  }
}

/**
 * Log a moderation action
 * @param {Client} client - Discord client
 * @param {Guild} guild - Discord guild
 * @param {string} action - Mod action (BAN, KICK, TIMEOUT, WARN, etc.)
 * @param {string} targetId - ID of the user being moderated
 * @param {string} moderatorId - ID of the moderator
 * @param {string} reason - Reason for the action
 */
async function logModAction(client, guild, action, targetId, moderatorId, reason) {
  await logAction(client, guild, `MOD_ACTION: ${action}`, reason, moderatorId, {
    'Target User': targetId,
    'Action': action,
    'Reason': reason || 'No reason provided'
  });
}

/**
 * Log an economy transaction
 * @param {Client} client - Discord client
 * @param {Guild} guild - Discord guild
 * @param {string} type - Type of transaction (WORK, DAILY, ROB, SHOP, GAMBLE, etc.)
 * @param {string} userId - ID of the user
 * @param {number} amount - Amount involved
 * @param {string} description - Description
 */
async function logEconomyTransaction(client, guild, type, userId, amount, description) {
  await logAction(client, guild, `ECONOMY: ${type}`, description, userId, {
    'Amount': amount,
    'Type': type
  });
}

/**
 * Log a ticket action
 * @param {Client} client - Discord client
 * @param {Guild} guild - Discord guild
 * @param {string} action - CREATED, CLOSED, CLAIMED, etc.
 * @param {string} ticketId - Ticket ID
 * @param {string} userId - User involved
 * @param {string} details - Additional details
 */
async function logTicketAction(client, guild, action, ticketId, userId, details) {
  await logAction(client, guild, `TICKET: ${action}`, details, userId, {
    'Ticket ID': ticketId,
    'Action': action
  });
}

/**
 * Log a giveaway action
 * @param {Client} client - Discord client
 * @param {Guild} guild - Discord guild
 * @param {string} action - STARTED, ENDED, WINNER_DRAWN, etc.
 * @param {string} prize - Prize description
 * @param {string} userId - User involved
 * @param {string} details - Additional details
 */
async function logGiveawayAction(client, guild, action, prize, userId, details) {
  await logAction(client, guild, `GIVEAWAY: ${action}`, details, userId, {
    'Prize': prize,
    'Action': action
  });
}

/**
 * Log member events (joins, leaves)
 * @param {Client} client - Discord client
 * @param {Guild} guild - Discord guild
 * @param {string} type - JOIN or LEAVE
 * @param {string} userId - User ID
 * @param {string} username - Username
 */
async function logMemberEvent(client, guild, type, userId, username) {
  const action = type === 'JOIN' ? 'MEMBER_JOIN' : 'MEMBER_LEAVE';
  const description = type === 'JOIN' 
    ? `${username} has joined the server`
    : `${username} has left the server`;
  
  await logAction(client, guild, action, description, userId, {
    'Username': username,
    'Type': type
  });
}

module.exports = {
  logAction,
  logError,
  logModAction,
  logEconomyTransaction,
  logTicketAction,
  logGiveawayAction,
  logMemberEvent
};
