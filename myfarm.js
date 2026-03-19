const Farm = require("../../database/models/Farm");
const { getUser } = require("../../utils/economy");
const { CROPS, EMPTY_FIELD, READY_FIELD, fmtMs, MAX_FIELDS, FIELD_PRICES } = require("../../utils/farmData");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "myfarm",
  aliases: ["farm"],
  description: "View your farm — fields, crops growing, barn, and seeds.",

  async execute(message, args, client) {
    const userId  = message.author.id;
    const guildId = message.guild.id;

    const farm = await Farm.findOne({ userId, guildId })
      || new Farm({ userId, guildId });

    const now = Date.now();

    // ── Fields section ────────────────────────────────────────────────────────
    let fieldDisplay;
    if (farm.fields.length === 0) {
      fieldDisplay = `${EMPTY_FIELD} You have no fields! Buy your first field for **$${FIELD_PRICES[0].toLocaleString()}** using \`$buyfield\`.`;
    } else {
      const lines = farm.fields.map(f => {
        if (!f.seedId) {
          return `┃ **Field #${f.fieldId}** — ${EMPTY_FIELD} Empty *(use \`$plant\`)*`;
        }
        const crop = CROPS[f.seedId];
        const readyAt = f.readyAt?.getTime() || 0;
        const isReady = readyAt <= now;
        const timeLeft = isReady ? "**Ready to harvest!** ✅" : `Ready <t:${Math.floor(readyAt / 1000)}:R>`;
        const boosts = [f.watered ? "💧" : "", f.fertilized ? "🌿" : ""].filter(Boolean).join("");
        return `┃ **Field #${f.fieldId}** — ${crop?.emoji || "🌾"} **${crop?.name || f.seedId}** ${isReady ? READY_FIELD : "🌱"} ${timeLeft}${boosts ? ` ${boosts}` : ""}`;
      });
      fieldDisplay = lines.join("\n");
    }

    // ── Barn section ─────────────────────────────────────────────────────────
    let barnDisplay;
    if (!farm.barn || farm.barn.length === 0) {
      barnDisplay = "Empty — harvest crops to fill the barn";
    } else {
      barnDisplay = farm.barn.map(b => {
        const crop = CROPS[b.cropId];
        const sellVal = crop ? (crop.sellPrice * b.quantity).toLocaleString() : "?";
        return `${crop?.emoji || "🌾"} **${crop?.name || b.cropId}** ×${b.quantity} — Worth $${sellVal}`;
      }).join("\n");
    }

    // ── Seeds section ─────────────────────────────────────────────────────────
    let seedDisplay;
    if (!farm.seeds || farm.seeds.length === 0) {
      seedDisplay = "No seeds — buy some with `$farmshop`";
    } else {
      seedDisplay = farm.seeds.map(s => {
        const crop = CROPS[s.seedId];
        return `${crop?.emoji || "🌱"} **${crop?.name || s.seedId}** seeds ×${s.quantity}`;
      }).join("\n");
    }

    // ── Next field cost ───────────────────────────────────────────────────────
    const nextFieldCost = farm.fields.length < MAX_FIELDS
      ? `$${FIELD_PRICES[farm.fields.length].toLocaleString()}`
      : "Max fields owned";

    const embed = new EmbedBuilder()
      .setTitle(`🚜 ${message.author.username}'s Farm`)
      .setColor(0x57f287)
      .setThumbnail("https://i.imgur.com/7fQSH8M.png")
      .addFields(
        { name: `🌱 Fields (${farm.fields.length}/${MAX_FIELDS})`, value: fieldDisplay, inline: false },
        { name: "📦 Barn (Harvested Crops)", value: barnDisplay, inline: false },
        { name: "🌰 Seed Inventory",         value: seedDisplay, inline: false },
        { name: "🪣 Watering Can Charges",   value: `${farm.wateringCan}`,                    inline: true },
        { name: "🌿 Fertilizer Bags",        value: `${farm.fertilizer}`,                     inline: true },
        { name: "📈 Total Harvested",         value: farm.totalHarvested.toString(),            inline: true },
        { name: "💰 Total Earned",            value: `$${farm.totalEarned.toLocaleString()}`,  inline: true },
        { name: "➕ Next Field Cost",         value: nextFieldCost,                            inline: true },
      )
      .setFooter({ text: "$plant <crop> • $harvest • $farmshop • $buyfield • $sellcrop • $water • $fertilize" })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
