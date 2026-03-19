const User = require("../database/models/User");
const raidConfig = require("../data/raidConfig");

async function getUser(userId, isBot = false) {
  let user = await User.findOne({ userId });
  if (!user) {
    user = await User.create({ userId, isBot });
  }
  if (user.level === undefined) user.level = 1;
  if (user.reputation === undefined) user.reputation = 0;
  if (!user.inventory) user.inventory = [];
  if (!user.shiftsUsed) user.shiftsUsed = 0;
  if (!user.lastShiftReset) user.lastShiftReset = Date.now();
  if (Date.now() - user.lastShiftReset > 86_400_000) {
    user.shiftsUsed = 0;
    user.lastShiftReset = Date.now();
  }
  return user;
}

async function addMoney(userId, amount) {
  if (amount <= 0) return false;
  return await User.findOneAndUpdate(
    { userId },
    { $inc: { wallet: amount } },
    { new: true, upsert: true },
  );
}

async function removeMoney(userId, amount) {
  const user = await getUser(userId);
  if (user.wallet < amount) return false;
  user.wallet -= amount;
  await user.save();
  return true;
}

async function canAfford(userId, amount) {
  const user = await getUser(userId);
  return user.wallet >= amount;
}

async function checkCooldown(userId, type, cooldownMs) {
  const user = await getUser(userId);
  const now  = Date.now();
  if (user.cooldowns[type] && user.cooldowns[type] > now) {
    return user.cooldowns[type] - now;
  }
  await User.findOneAndUpdate(
    { userId },
    { [`cooldowns.${type}`]: now + cooldownMs },
  );
  return 0;
}

// ── FIXED: use itemId not item, and respect schema durability ─────────────────
async function addItem(userId, itemKey, quantity = 1, durability = null) {
  const shopItems = require("../data/shopItems");
  const itemData  = shopItems.find(i => i.id === itemKey);

  // Use item's default durability if it has one
  const dur = itemData?.durability || durability;

  const user = await getUser(userId);

  // Stack same items
  const existing = user.inventory.find(i => (i.itemId || i.item) === itemKey && i.durability === null);
  if (existing && dur === null) {
    existing.quantity = (existing.quantity || 1) + quantity;
  } else {
    for (let n = 0; n < quantity; n++) {
      user.inventory.push({ itemId: itemKey, quantity: 1, durability: dur });
    }
  }

  await user.save();
}

// ── Remove one use of an item (handles durability + stacking) ─────────────────
async function useItem(userId, itemKey) {
  const user = await getUser(userId);
  const idx  = user.inventory.findIndex(i => (i.itemId || i.item) === itemKey);
  if (idx === -1) return false;

  const entry = user.inventory[idx];
  if (entry.durability !== null) {
    entry.durability -= 1;
    if (entry.durability <= 0) user.inventory.splice(idx, 1);
  } else if (entry.quantity > 1) {
    entry.quantity -= 1;
  } else {
    user.inventory.splice(idx, 1);
  }

  user.markModified("inventory");
  await user.save();
  return true;
}

// ── Check if user owns a specific item ────────────────────────────────────────
function hasItem(user, itemKey) {
  return user.inventory?.some(i => (i.itemId || i.item) === itemKey) || false;
}

function applyPrestigeCoins(user, baseAmount) {
  let multiplier = user.prestige?.bonusMultiplier || 1;
  if (user.prestige?.perks?.includes("coinBoost")) multiplier += 0.2;
  const raidMultiplier = (raidConfig && raidConfig.isActive) ? 1.5 : 1;
  return Math.floor(baseAmount * multiplier * raidMultiplier);
}

function applyPrestigeXp(user, baseXp) {
  let multiplier = user.prestige?.bonusMultiplier || 1;
  if (user.prestige?.perks?.includes("xpBoost")) multiplier += 0.2;
  const raidMultiplier = (raidConfig && raidConfig.isActive) ? 1.5 : 1;
  return Math.floor(baseXp * multiplier * raidMultiplier);
}

function getWorkCooldown(user, baseCooldown) {
  if (user.prestige?.perks?.includes("fastWork")) return baseCooldown / 2;
  return baseCooldown;
}

function canBeRobbed(user) {
  if (user.prestige?.perks?.includes("robImmunity")) return false;
  return true;
}

module.exports = {
  getUser,
  addMoney,
  removeMoney,
  canAfford,
  checkCooldown,
  addItem,
  useItem,
  hasItem,
  applyPrestigeCoins,
  applyPrestigeXp,
  getWorkCooldown,
  canBeRobbed,
};
