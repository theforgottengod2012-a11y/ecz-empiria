module.exports.addClanXP = async (clan, amount) => {
  clan.xp += amount;

  const needed = clan.level * 1000;
  if (clan.xp >= needed) {
    clan.xp -= needed;
    clan.level++;
  }

  await clan.save();
};