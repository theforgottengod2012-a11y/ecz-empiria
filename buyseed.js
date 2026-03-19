const Farm = require("../../database/models/Farm");
const User = require("../../database/models/User");
const { CROPS } = require("../../utils/farmData");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "buyseed",
  aliases: ["seedbuy", "bseeds"],
  description: "Buy seeds from the farm shop. Usage: $buyseed <crop> [amount]",

  async execute(message, args, client) {
    const userId  = message.author.id;
    const guildId = message.guild.id;

    const cropKey = args[0]?.toLowerCase();
    if (!cropKey) {
      const list = Object.values(CROPS)
        .map(c => `${c.emoji} \`${c.id}\` — $${c.seedPrice.toLocaleString()}/seed`)
        .join("\n");
      return message.reply({
        embeds: [new EmbedBuilder()
          .setTitle("🌱 Seed Shop")
          .setDescription(`**Usage:** \`$buyseed <crop> [amount]\`\n\n${list}`)
          .setColor(0x57f287)
          .setFooter({ text: "Example: $buyseed wheat 5" })]
      });
    }

    const crop = CROPS[cropKey];
    if (!crop) {
      return message.reply(`❌ Unknown crop \`${cropKey}\`. Use \`$farmshop\` to see available crops.`);
    }

    const qty = Math.max(1, parseInt(args[1]) || 1);
    if (isNaN(qty) || qty < 1 || qty > 99) {
      return message.reply("❌ Quantity must be between 1 and 99.");
    }

    const totalCost = crop.seedPrice * qty;

    const user = await User.findOne({ userId });
    if (!user) return message.reply("❌ You need an account first. Use `$balance`.");

    if (user.wallet < totalCost) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xff4444)
          .setDescription(
            `💸 You need **$${totalCost.toLocaleString()}** but only have **$${user.wallet.toLocaleString()}**.\n` +
            `*(Each ${crop.emoji} ${crop.name} seed costs $${crop.seedPrice.toLocaleString()})*`
          )]
      });
    }

    // Deduct cost
    user.wallet -= totalCost;
    await user.save();

    // Add to farm seed inventory
    let farm = await Farm.findOne({ userId, guildId });
    if (!farm) farm = new Farm({ userId, guildId });

    let seedEntry = farm.seeds.find(s => s.seedId === crop.id);
    if (!seedEntry) {
      farm.seeds.push({ seedId: crop.id, quantity: qty });
    } else {
      seedEntry.quantity += qty;
    }

    farm.markModified("seeds");
    await farm.save();

    const newQty = farm.seeds.find(s => s.seedId === crop.id)?.quantity ?? qty;

    return message.reply({
      embeds: [new EmbedBuilder()
        .setTitle(`${crop.emoji} Seeds Purchased!`)
        .setColor(0x57f287)
        .addFields(
          { name: "🌱 Crop",       value: crop.name,                          inline: true },
          { name: "📦 Qty Bought", value: `×${qty}`,                          inline: true },
          { name: "💸 Total Cost", value: `$${totalCost.toLocaleString()}`,    inline: true },
          { name: "💰 Wallet",     value: `$${user.wallet.toLocaleString()}`,  inline: true },
          { name: "🌰 Seeds Now",  value: `×${newQty}`,                        inline: true }
        )
        .setFooter({ text: "Plant with $plant " + crop.id })]
    });
  },
};
