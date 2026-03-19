const mongoose = require("mongoose");

module.exports = mongoose.model("AutoMod", new mongoose.Schema({
  guildId: String,
  enabled: { type: Boolean, default: false },
  
  // Filters
  profanity: Boolean,
  spam: Boolean,
  links: Boolean,
  caps: Boolean,
  invites: { type: Boolean, default: false },
  emojis: { type: Boolean, default: false },
  raid: { type: Boolean, default: false },
  
  // Spam Settings
  spamSensitivity: { type: Number, default: 3 }, // messages before action
  spamTimeWindow: { type: Number, default: 5 }, // seconds
  
  // Caps Settings
  capsPercentage: { type: Number, default: 70 }, // % of message in caps
  capsMinLength: { type: Number, default: 10 }, // min chars to trigger
  
  // Emoji Settings
  emojiLimit: { type: Number, default: 10 }, // emojis per message
  
  // Scam/Link Detection
  scamLinks: { type: Boolean, default: true },
  whitelistedLinks: [String], // domains to allow
  
  // Blacklisted Words
  blacklistedWords: [String],
  
  // Punishment Ladder
  punishments: {
    level1: { type: String, default: "warn" },     // warn, mute, timeout
    level2: { type: String, default: "mute" },
    level3: { type: String, default: "timeout" },
    level4: { type: String, default: "kick" },
    timeoutDuration: { type: Number, default: 600000 } // 10 minutes in ms
  },
  
  // Logging
  logs: { type: String, default: null },
  modLog: { type: String, default: null },
  
  autoRole: { type: String, default: null },
  
  ignoredChannels: [String],
  ignoredRoles: [String]
}));
