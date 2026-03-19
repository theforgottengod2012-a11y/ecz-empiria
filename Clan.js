const mongoose = require("mongoose");

const clanSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  ownerId: { type: String, required: true },
  description: { type: String, default: "No description provided." },
  members: [{ type: String }], // Array of user IDs
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  settings: {
    privacy: { type: String, enum: ["public", "private"], default: "public" },
  }
});

module.exports = mongoose.model("Clan", clanSchema);
