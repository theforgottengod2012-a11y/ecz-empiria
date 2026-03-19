const mongoose = require("mongoose");

const stardustSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  isBot: { type: Boolean, default: false },
  stardust: { type: Number, default: 0 },
  crates: [{ crateId: String, quantity: Number }],
  cosmicPass: { type: Boolean, default: false },
  premiumTitles: [{ titleId: String }]
});

module.exports = mongoose.model("Stardust", stardustSchema);