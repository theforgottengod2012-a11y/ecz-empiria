const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  guildId: String,
  channelId: String,
  userId: String,
  type: String, // Support, Report, etc.
  status: { type: String, default: "open" }, // open, claimed, closed
  claimedBy: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  closedAt: { type: Date, default: null },
  closeReason: { type: String, default: null },
  transcript: { type: String, default: null }
});

module.exports = mongoose.model("Ticket", ticketSchema);
