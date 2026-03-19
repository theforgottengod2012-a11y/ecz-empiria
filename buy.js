const shopItems = require("../../data/shopItems");
const { getUser, addItem } = require("../../utils/economy");
const { EmbedBuilder } = require("discord.js");
const Farm = require("../../database/models/Farm");
const Clan = require("../../database/models/Clan");

module.exports = {
  name: "buy",
  aliases: ["purchase"],
  description: "Buy an item from the shop. Usage: $buy <item_id> [qty]",
  module: "economy",

  async execute(message, args, client) {
    const itemKey = args[0]?.toLowerCase();
    if (!itemKey) {
      return message.reply("❌ **Usage:** `$buy <item_id> [qty]`\nBrowse the shop with `$shop`.");
    }

    const item = shopItems.find(i => i.id === itemKey);
    if (!item) {
      return message.reply(`❌ Item \`${itemKey}\` not found. Use \`$shop\` to browse available items.`);
    }

    const qty = Math.max(1, parseInt(args[1]) || 1);

    const user = await getUser(message.author.id);

    // ── Prestige requirement ───────────────────────────────────────────────────
    if (item.type === "prestige" && (user.prestige?.level || 0) < (item.requiredPrestigeLevel || 0)) {
      return message.reply(`❌ You need **Prestige Level ${item.requiredPrestigeLevel}** to buy this item.`);
    }

    // ── Total cost ─────────────────────────────────────────────────────────────
    const totalCost = item.price * qty;

    if (user.wallet < totalCost) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xff4444)
          .setDescription(
            `💸 You can't afford this!\n` +
            `Need: **$${totalCost.toLocaleString()}** | Have: **$${user.wallet.toLocaleString()}**`
          )]
      });
    }

    // ══════════════════════════════════════════════════════
    //  SPECIAL ITEM HANDLERS
    // ══════════════════════════════════════════════════════

    // ── Farming items → go to Farm model ─────────────────────────────────────
    if (item.id === "watering_can" || item.id === "fertilizer" || item.id === "premium_fertilizer") {
      const farm = await Farm.findOne({ userId: message.author.id, guildId: message.guild.id })
        || new Farm({ userId: message.author.id, guildId: message.guild.id });

      user.wallet -= totalCost;
      await user.save();

      if (item.id === "watering_can") {
        farm.wateringCan = (farm.wateringCan || 0) + (item.effect.waterCharges * qty);
      } else {
        farm.fertilizer = (farm.fertilizer || 0) + qty;
      }
      await farm.save();

      return message.reply({
        embeds: [new EmbedBuilder()
          .setTitle(`✅ Purchased ${item.name}`)
          .setColor(0x57f287)
          .setDescription(
            item.id === "watering_can"
              ? `🪣 Added **${item.effect.waterCharges * qty}** watering can charges.`
              : `🌿 Added **${qty}** fertilizer bag${qty > 1 ? "s" : ""} to your farm.`
          )
          .addFields(
            { name: "💸 Paid",      value: `$${totalCost.toLocaleString()}`, inline: true },
            { name: "💵 Wallet",    value: `$${(user.wallet).toLocaleString()}`, inline: true }
          )]
      });
    }

    // ── Clan role ─────────────────────────────────────────────────────────────
    if (item.id === "clan_role") {
      if (!user.clanId) return message.reply("❌ You must be in a clan.");
      const clan = await Clan.findOne({ clanId: user.clanId });
      if (!clan || clan.ownerId !== message.author.id) return message.reply("❌ Only the clan owner can buy this.");
      if (clan.bank < 50_000_000) return message.reply("❌ Your clan bank needs at least $50M.");

      try {
        const role = await message.guild.roles.create({
          name: `${clan.name} Member`,
          reason: `Clan role purchase by ${message.author.tag}`
        });
        clan.roleId = role.id;
        await clan.save();

        for (const memberId of clan.members) {
          const m = await message.guild.members.fetch(memberId).catch(() => null);
          if (m) await m.roles.add(role).catch(() => {});
        }

        user.wallet -= item.price;
        user.inventory.push({ itemId: item.id, quantity: 1, durability: null });
        await user.save();

        return message.reply(`✅ **Clan Role** created and applied to all members! Expires in 60 days.`);
      } catch (e) {
        return message.reply("❌ Failed to create role. Check my permissions.");
      }
    }

    // ── Custom role ───────────────────────────────────────────────────────────
    if (item.id === "custom_role") {
      try {
        const role = await message.guild.roles.create({
          name: `${message.author.username}'s Role`,
          reason: `Custom role purchase by ${message.author.tag}`
        });
        user.wallet -= item.price;
        user.inventory.push({ itemId: item.id, quantity: 1, durability: null });
        await message.member.roles.add(role);
        await user.save();
        return message.reply(`✅ **Custom Role** created! Manage it with \`$customrename\`, \`$customhex\`, \`$customicon\`. Expires in 60 days.`);
      } catch (e) {
        return message.reply("❌ Failed to create role. Check my permissions.");
      }
    }

    // ── Ping reaction ─────────────────────────────────────────────────────────
    if (item.id === "ping_reaction") {
      user.wallet -= item.price;
      user.inventory.push({ itemId: item.id, quantity: 1, durability: null });
      await user.save();
      return message.reply("✨ **Ping Reaction** purchased! Set your emojis with `$use ping_reaction <emoji1> <emoji2> <emoji3>`.");
    }

    // ── Prestige perk ─────────────────────────────────────────────────────────
    if (item.type === "prestige") {
      if (user.prestige?.perks?.includes(item.perk)) {
        return message.reply(`❌ You already have the **${item.name}** perk.`);
      }
      user.wallet -= item.price;
      if (!user.prestige) user.prestige = { level: 0, bonusMultiplier: 1, perks: [] };
      user.prestige.perks.push(item.perk);
      await user.save();
      return message.reply({
        embeds: [new EmbedBuilder()
          .setTitle(`💎 Prestige Perk Unlocked!`)
          .setColor(0x9b59b6)
          .setDescription(`**${item.name}** activated!\n${item.description}`)
          .addFields(
            { name: "💸 Paid",   value: `$${item.price.toLocaleString()}`, inline: true },
            { name: "💵 Wallet", value: `$${(user.wallet).toLocaleString()}`, inline: true }
          )]
      });
    }

    // ── Standard item ─────────────────────────────────────────────────────────
    user.wallet -= totalCost;
    await user.save();
    await addItem(message.author.id, itemKey, qty, item.durability || null);

    return message.reply({
      embeds: [new EmbedBuilder()
        .setTitle(`✅ Purchased ${item.emoji || "📦"} ${item.name}`)
        .setColor(0x57f287)
        .setDescription(item.description)
        .addFields(
          { name: "📦 Qty",    value: `×${qty}`,                       inline: true },
          { name: "💸 Paid",   value: `$${totalCost.toLocaleString()}`, inline: true },
          { name: "💵 Wallet", value: `$${user.wallet.toLocaleString()}`, inline: true }
        )
        .setFooter({ text: "Use $inv to view your inventory" })]
    });
  },
};
