const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },

  // 💰 Economy
  wallet: { type: Number, default: 500, min: 0 },
  bank: { type: Number, default: 0, min: 0 },

  // 🎰 Gambling stats
  gambling: {
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    totalWon: { type: Number, default: 0 },
    totalLost: { type: Number, default: 0 },
  },

  // 🎒 Inventory
  inventory: [
    {
      itemId: String,
      quantity: { type: Number, default: 1 },
      durability: { type: Number, default: null }
    }
  ],

  // 🐾 Pets
  pets: {
    activePet: { type: String, default: null },
    ownedPets: [
      {
        petId: String,
        name: { type: String, default: null },
        level: { type: Number, default: 1 },
        xp: { type: Number, default: 0 },
        skills: { type: Array, default: [] },
        abilities: { type: Array, default: [] },
        bond: { type: Number, default: 0 },
        evolved: { type: Boolean, default: false },
      },
    ],
  },

  // 🚜 Farming
  farming: {
    fieldsOwned: { type: Number, default: 0 },
    seeds: [{ seedId: String, quantity: Number }],
    crops: [{ cropId: String, quantity: Number }],
  },

  // 👔 Jobs & XP
  job: { type: String, default: null },
  shifts: { type: Number, default: 0 },
  pingEmojis: { type: [String], default: [] },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  prestige: {
    level: { type: Number, default: 0 },
    bonusMultiplier: { type: Number, default: 1 }, // 1x initially
    perks: { type: [String], default: [] }, // array of unlocked perks
  },
  lastWork: { type: Date, default: null },
  dailyStreak:     { type: Number, default: 0 },
  lastWeeklyDate:  { type: Date,   default: null },
  weeklyStreak:    { type: Number, default: 0 },
  lastDailyDate: { type: String, default: null },
  workStreak: { type: Number, default: 0 },
  lastWorkDate: { type: String, default: null },

  // 🏥 Health & Injuries
  health: { type: Number, default: 100, min: 0, max: 100 },
  injuries: [
    {
      type: String,
      severity: Number, // 1-10
      treated: { type: Boolean, default: false },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  lastCrime: { type: Date, default: null },

  // 🛡️ Cooldowns
  cooldowns: {
    daily:  { type: Number, default: 0 },
    weekly: { type: Number, default: 0 },
    gamble: { type: Number, default: 0 },
    rob:    { type: Number, default: 0 },
    work:   { type: Number, default: 0 },
    heist:  { type: Number, default: 0 },
  },

  // 💤 AFK System
  afk: {
    status: { type: Boolean, default: false },
    reason: { type: String, default: "AFK" },
    timestamp: { type: Date, default: null },
    lastMessage: { type: String, default: null },
  },

  // 👥 Clan
  clanId: { type: String, default: null },
  isBot: { type: Boolean, default: false },

  // 🕒 Meta
  games: {
    played: { type: Number, default: 0 },
    wins: { type: Number, default: 0 }
  },
  customRole: {
    roleId: { type: String, default: null },
    expiry: { type: Date, default: null }
  },
  clanRole: {
    roleId: { type: String, default: null }
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
