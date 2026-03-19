const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  guildId: String,
  eventId: String,
  name: String,
  description: String,
  type: String, // movie, gaming, tournament, etc
  startsAt: Date,
  endsAt: Date,
  createdBy: String,
  participants: [String],
  status: { type: String, enum: ["scheduled", "live", "completed"], default: "scheduled" },
  messageId: { type: String, default: null }
});

module.exports = mongoose.model("Event", eventSchema);
