const { CROPS, FIELD_PRICES, MAX_FIELDS, fmtMs } = require("../../utils/farmData");
const { EmbedBuilder } = require("discord.js");
const Farm = require("../../database/models/Farm");

module.exports = {
  name: "farmshop",
  aliases: ["seedshop", "fseed"],
  description: "Browse the farming shop — seeds, tools, and more.",

  async execute(message, args, client) {
    try {
      const userId  = message.author.id;
      const guildId = message.guild?.id;
      const page    = args[0]?.toLowerCase();

      const farm = guildId ? await Farm.findOne({ userId, guildId }).catch(() => null) : null;
      const fieldsOwned   = farm?.fields?.length ?? 0;
      const nextFieldCost = fieldsOwned < MAX_FIELDS
        ? `$${FIELD_PRICES[fieldsOwned].toLocaleString()}`
        : "**MAXED OUT** 🏆";

      // ── Page 2: Premium crops ─────────────────────────────────────────────
      if (page === "2" || page === "premium") {
        const premiumCrops = ["pumpkin", "strawberry", "sunflower", "coffee", "grape", "diamond"];
        const lines = premiumCrops.map(k => {
          const c = CROPS[k];
          return `${c.emoji} **${c.name}** — \`$buyseed ${c.id}\`\n┣ 💵 **$${c.seedPrice.toLocaleString()}**/seed  ┣ 💰 Sells **$${c.sellPrice.toLocaleString()}**  ┗ ⏱️ ${fmtMs(c.growMs)}`;
        }).join("\n\n");
        return message.reply({ embeds: [
          new EmbedBuilder()
            .setTitle("🌾 Farming Shop — Premium Crops (Page 2/3)")
            .setColor(0xffd700)
            .setDescription(lines)
            .setFooter({ text: "$farmshop 3 → Tools & Fields | $farmshop → Starter" })
        ]});
      }

      // ── Page 3: Tools & Fields ────────────────────────────────────────────
      if (page === "3" || page === "tools" || page === "fields") {
        return message.reply({ embeds: [
          new EmbedBuilder()
            .setTitle("🌾 Farming Shop — Tools & Fields (Page 3/3)")
            .setColor(0x8b5e3c)
            .setDescription([
              "**🛠️ Farm Tools** — buy with `$buy <id>`",
              "`watering_can` 🪣 — **$3,500** | 5 charges | ⏱️ Cuts grow by **10%**",
              "`fertilizer`   🌿 — **$7,000** | 1 use | ⏱️ Cuts grow by **35%**",
              "`premium_fert` 💚 — **$20,000** | 1 use | ⏱️ Cuts grow by **60%**",
              "",
              "**🟫 Farm Fields** — buy with `$buyfield`",
              `You own **${fieldsOwned}/${MAX_FIELDS}** fields. More = more simultaneous crops!`,
              `Next field costs: **${nextFieldCost}**`,
            ].join("\n"))
            .setFooter({ text: "$farmshop → Starter | $farmshop 2 → Premium" })
        ]});
      }

      // ── Page 1 (Default): Starter crops ──────────────────────────────────
      const starterCrops = ["wheat", "carrot", "potato", "corn", "tomato"];
      const starterLines = starterCrops.map(k => {
        const c = CROPS[k];
        return `${c.emoji} **${c.name}** — \`$buyseed ${c.id}\`\n┣ 💵 **$${c.seedPrice.toLocaleString()}**/seed  ┣ 💰 Sells **$${c.sellPrice.toLocaleString()}**  ┗ ⏱️ ${fmtMs(c.growMs)} | ⭐ ${c.xp} XP`;
      }).join("\n\n");

      return message.reply({ embeds: [
        new EmbedBuilder()
          .setTitle("🌾 Farming Shop — Starter Crops (Page 1/3)")
          .setColor(0x57f287)
          .setDescription(starterLines)
          .addFields({
            name: "📖 More Pages",
            value: "`$farmshop 2` — Premium Crops 💎\n`$farmshop 3` — Tools & Fields 🛠️",
          })
          .setFooter({ text: `Your farm: ${fieldsOwned}/${MAX_FIELDS} fields | Next field: ${nextFieldCost}` })
          .setTimestamp()
      ]});

    } catch (err) {
      console.error("[farmshop] Error:", err.message);
      return message.reply("❌ An error occurred loading the shop. Please try again.");
    }
  },
};
