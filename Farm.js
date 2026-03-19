const mongoose = require("mongoose");

const fieldSchema = new mongoose.Schema({
  fieldId:    { type: Number, required: true },
  seedId:     { type: String, default: null },
  plantedAt:  { type: Date,   default: null },
  readyAt:    { type: Date,   default: null },
  watered:    { type: Boolean, default: false },
  fertilized: { type: Boolean, default: false },
}, { _id: false });

const seedStockSchema = new mongoose.Schema({
  seedId:   { type: String, required: true },
  quantity: { type: Number, default: 0 },
}, { _id: false });

const barnSchema = new mongoose.Schema({
  cropId:   { type: String, required: true },
  quantity: { type: Number, default: 0 },
}, { _id: false });

const farmSchema = new mongoose.Schema({
  userId:  { type: String, required: true },
  guildId: { type: String, required: true },

  fields: [fieldSchema],

  seeds:  [seedStockSchema],
  barn:   [barnSchema],

  fertilizer:  { type: Number, default: 0 },
  wateringCan: { type: Number, default: 3 },

  totalHarvested: { type: Number, default: 0 },
  totalEarned:    { type: Number, default: 0 },
  createdAt:      { type: Date, default: Date.now },
});

farmSchema.index({ userId: 1, guildId: 1 }, { unique: true });
module.exports = mongoose.model("Farm", farmSchema);
