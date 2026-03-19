const Farm = require("../../database/models/Farm");
const User = require("../../database/models/User");
const { FIELD_PRICES, MAX_FIELDS } = require("../../utils/farmData");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "farmfieldbuy",
  aliases: ["buyfield", "fieldadd"],
  description: "Purchase a new farm field to grow more crops.",

  async execute(message, args, client) {
    const userId  = message.author.id;
    const guildId = message.guild.id;

    let farm = await Farm.findOne({ userId, guildId });
    if (!farm) farm = new Farm({ userId, guildId });

    const fieldsOwned = farm.fields.length;

    if (fieldsOwned >= MAX_FIELDS) {
      return message.reply(`🌾 You already own the maximum of **${MAX_FIELDS}** fields. That's a huge farm!`);
    }

    const cost = FIELD_PRICES[fieldsOwned];
    const user = await User.findOne({ userId });
    if (!user) return message.reply("❌ You don't have an account yet. Use `$balance` to start.");

    if (user.wallet < cost) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setTitle("💸 Can't Afford Field")
          .setDescription(`You need **$${cost.toLocaleString()}** but only have **$${user.wallet.toLocaleString()}**.`)
          .setColor(0xff4444)
          .addFields(
            { name: "💰 Your Balance", value: `$${user.wallet.toLocaleString()}`, inline: true },
            { name: "💸 Field Cost",   value: `$${cost.toLocaleString()}`,         inline: true },
            { name: "💡 Tip",         value: `Earn more with \`$work\`, \`$daily\`, or sell crops with \`$sellcrop\``, inline: false }
          )]
      });
    }

    // Purchase
    user.wallet -= cost;
    const newFieldId = fieldsOwned + 1;
    farm.fields.push({
      fieldId:    newFieldId,
      seedId:     null,
      plantedAt:  null,
      readyAt:    null,
      watered:    false,
      fertilized: false,
    });

    farm.markModified("fields");
    await Promise.all([user.save(), farm.save()]);

    const nextCost = farm.fields.length < MAX_FIELDS
      ? `$${FIELD_PRICES[farm.fields.length].toLocaleString()}`
      : "N/A (Max reached)";

    return message.reply({
      embeds: [new EmbedBuilder()
        .setTitle("✅ Field Purchased!")
        .setColor(0x57f287)
        .setDescription(`You now own **${farm.fields.length}/${MAX_FIELDS}** fields!`)
        .addFields(
          { name: "🆕 Field Number",  value: `#${newFieldId}`,                inline: true },
          { name: "💸 Cost Paid",     value: `$${cost.toLocaleString()}`,      inline: true },
          { name: "💰 Wallet Left",   value: `$${user.wallet.toLocaleString()}`, inline: true },
          { name: "➕ Next Field",    value: nextCost,                          inline: true }
        )
        .setFooter({ text: "Plant a seed with $plant <crop> • View farm with $farm" })]
    });
  },
};
