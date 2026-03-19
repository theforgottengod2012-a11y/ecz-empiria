const mongoose = require("mongoose");

const governmentSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },

  // 🏛️ Government Settings
  government: {
    enabled: { type: Boolean, default: false },
    governmentType: { type: String, enum: ["democracy", "monarchy", "autocracy", "republic"], default: "democracy" },
    presidentId: { type: String, default: null },
    vicePresidentId: { type: String, default: null },
    cabinet: [
      {
        position: String,
        userId: String,
        salary: { type: Number, default: 0 }
      }
    ]
  },

  // 💰 Tax System
  taxes: {
    incomeTax: { type: Number, default: 10, min: 0, max: 100 },
    capitalGainsTax: { type: Number, default: 15, min: 0, max: 100 },
    wealthTax: { type: Number, default: 5, min: 0, max: 100 },
    businessTax: { type: Number, default: 20, min: 0, max: 100 },
    gambling: { type: Number, default: 25, min: 0, max: 100 },
    treasury: { type: Number, default: 0, min: 0 }
  },

  // ⚖️ Laws
  laws: [
    {
      lawId: String,
      name: String,
      description: String,
      penalty: { type: Number, default: 0 },
      enabled: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],

  // 👮 Law Enforcement
  enforcement: {
    policeDepartmentLeaderId: { type: String, default: null },
    officers: [String],
    fines: [
      {
        userId: String,
        amount: Number,
        reason: String,
        issuedAt: Date,
        isPaid: { type: Boolean, default: false }
      }
    ]
  },

  // 📋 Regulations
  regulations: [
    {
      regulationId: String,
      name: String,
      category: String,
      rules: String,
      enabled: { type: Boolean, default: true }
    }
  ],

  // 🏛️ Government Budget
  budget: {
    totalRevenue: { type: Number, default: 0 },
    totalExpenses: { type: Number, default: 0 },
    infrastructure: { type: Number, default: 0 },
    healthcare: { type: Number, default: 0 },
    education: { type: Number, default: 0 },
    defense: { type: Number, default: 0 },
    welfare: { type: Number, default: 0 }
  },

  // 📜 Elections
  elections: [
    {
      electionId: String,
      position: String,
      candidates: [
        {
          userId: String,
          votes: { type: Number, default: 0 }
        }
      ],
      startDate: Date,
      endDate: Date,
      status: { type: String, enum: ["ongoing", "completed"], default: "ongoing" },
      winner: { type: String, default: null }
    }
  ],

  // 🎖️ Citizenship
  citizenship: [
    {
      userId: String,
      joinedAt: Date,
      status: { type: String, enum: ["citizen", "resident", "visitor"], default: "citizen" },
      reputation: { type: Number, default: 0 }
    }
  ]
});

module.exports = mongoose.model("Government", governmentSchema);
