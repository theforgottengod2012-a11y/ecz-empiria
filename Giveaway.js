const mongoose = require("mongoose");

module.exports = mongoose.model(
  "Giveaway",
  new mongoose.Schema({
    guildId: String,
    channelId: String,
    messageId: String,
    prize: String,
    winners: Number,
    endTime: Number,
    entries: [String],
    ended: { type: Boolean, default: false },
    hostedBy: String,
    requirements: {
      invites: { type: Number, default: 0 },
      level: { type: Number, default: 0 },
      roles: [String],
      accountAge: { type: Number, default: 0 }
    }
  })
);
