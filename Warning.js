const mongoose = require("mongoose");

const warningSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
  warnings: [
    {
      moderatorId: String,
      reason: String,
      date: {
        type: Date,
        default: Date.now
      }
    }
  ]
});

module.exports = mongoose.model("Warning", warningSchema);
