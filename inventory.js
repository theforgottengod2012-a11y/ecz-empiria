const shopItems = require("../../data/shopItems");
const { getUser } = require("../../utils/economy");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "inventory",
  aliases: ["inv", "bag", "items"],
  description: "View your item inventory.",

  async execute(message, args, client) {
    const userId = message.author.id;
    const user   = await getUser(userId);

    const inv = user.inventory || [];

    if (!inv.length) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setTitle("🎒 Your Inventory")
          .setDescription("Your inventory is empty!\nBuy items from `$shop`.")
          .setColor(0x99aab5)]
      });
    }

    // Group by itemId and count
    const grouped = {};
    for (const entry of inv) {
      const id = entry.itemId || entry.item; // support both field names
      if (!id) continue;
      grouped[id] = (grouped[id] || 0) + (entry.quantity || 1);
    }

    // Build display by category
    const categoryMap = {};
    for (const [id, qty] of Object.entries(grouped)) {
      const itemData = shopItems.find(i => i.id === id);
      const name = itemData ? `${itemData.emoji || "📦"} ${itemData.name}` : `📦 ${id}`;
      const type = itemData?.type || "misc";
      const dur  = inv.find(i => (i.itemId || i.item) === id)?.durability;
      const durText = (dur !== null && dur !== undefined) ? ` *(${dur} uses left)*` : "";

      if (!categoryMap[type]) categoryMap[type] = [];
      categoryMap[type].push(`${name} ×**${qty}**${durText}`);
    }

    const CATEGORY_LABELS = {
      defense:    "🛡️ Defense",
      tool:       "🛠️ Tools",
      farming:    "🌾 Farming",
      consumable: "🍔 Consumables",
      prestige:   "💎 Prestige",
      special:    "✨ Special",
      misc:       "📦 Misc",
    };

    const fields = Object.entries(categoryMap).map(([type, items]) => ({
      name:  CATEGORY_LABELS[type] || type.toUpperCase(),
      value: items.join("\n"),
      inline: false,
    }));

    return message.reply({
      embeds: [new EmbedBuilder()
        .setTitle(`🎒 ${message.author.username}'s Inventory`)
        .setColor(0x3498db)
        .addFields(fields)
        .setFooter({ text: `${Object.values(grouped).reduce((a, b) => a + b, 0)} items total • Use $shop to buy more` })
        .setTimestamp()]
    });
  },
};
