// ═══════════════════════════════════════════════════════
//  FARM DATA — Central source of truth for all farm logic
// ═══════════════════════════════════════════════════════

const CROPS = {
  wheat:      { id: "wheat",     emoji: "🌾", name: "Wheat",        growMs: 10 * 60_000,       seedPrice: 25,    sellPrice: 85,    xp: 5   },
  carrot:     { id: "carrot",    emoji: "🥕", name: "Carrot",       growMs: 20 * 60_000,       seedPrice: 45,    sellPrice: 160,   xp: 10  },
  potato:     { id: "potato",    emoji: "🥔", name: "Potato",       growMs: 40 * 60_000,       seedPrice: 75,    sellPrice: 290,   xp: 18  },
  corn:       { id: "corn",      emoji: "🌽", name: "Corn",         growMs: 90 * 60_000,       seedPrice: 130,   sellPrice: 480,   xp: 28  },
  tomato:     { id: "tomato",    emoji: "🍅", name: "Tomato",       growMs: 2 * 3_600_000,     seedPrice: 160,   sellPrice: 650,   xp: 40  },
  pumpkin:    { id: "pumpkin",   emoji: "🎃", name: "Pumpkin",      growMs: 4 * 3_600_000,     seedPrice: 280,   sellPrice: 1_300, xp: 65  },
  strawberry: { id: "strawberry",emoji: "🍓", name: "Strawberry",   growMs: 5 * 3_600_000,     seedPrice: 380,   sellPrice: 1_800, xp: 80  },
  sunflower:  { id: "sunflower", emoji: "🌻", name: "Sunflower",    growMs: 6 * 3_600_000,     seedPrice: 450,   sellPrice: 2_200, xp: 95  },
  coffee:     { id: "coffee",    emoji: "☕", name: "Coffee Bean",  growMs: 8 * 3_600_000,     seedPrice: 600,   sellPrice: 3_000, xp: 120 },
  grape:      { id: "grape",     emoji: "🍇", name: "Grape",        growMs: 12 * 3_600_000,    seedPrice: 900,   sellPrice: 4_500, xp: 160 },
  diamond:    { id: "diamond",   emoji: "💎", name: "Crystal Plant",growMs: 24 * 3_600_000,    seedPrice: 2_200, sellPrice: 12_000,xp: 400 },
};

// Emoji used when a field is empty
const EMPTY_FIELD = "🟫";
const READY_FIELD = "✨";

// Field purchase costs (index = fields already owned, so first field = index 0)
const FIELD_PRICES = [800, 2_000, 5_000, 10_000, 22_000, 50_000, 100_000, 200_000, 400_000, 800_000];

const MAX_FIELDS = 10;

// ── Fertilizer / watering can (cuts grow time) ────────────────────────────────
const WATER_REDUCTION   = 0.10; // watering can cuts grow time by 10%
const FERTILIZE_REDUCTION = 0.35; // fertilizer cuts grow time by 35%

// ── Helper: format milliseconds into human-readable string ────────────────────
function fmtMs(ms) {
  if (ms <= 0) return "**Ready!** ✅";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ── Helper: get next field price ──────────────────────────────────────────────
function nextFieldPrice(fieldsOwned) {
  if (fieldsOwned >= MAX_FIELDS) return null;
  return FIELD_PRICES[fieldsOwned];
}

module.exports = { CROPS, FIELD_PRICES, MAX_FIELDS, EMPTY_FIELD, READY_FIELD, WATER_REDUCTION, FERTILIZE_REDUCTION, fmtMs, nextFieldPrice };
