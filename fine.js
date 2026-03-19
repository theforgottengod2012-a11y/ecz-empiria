const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const Government = require("../../database/models/Government");
const User = require("../../database/models/User");

module.exports = {
  name: "fine",
  description: "Issue a fine to a user",
  category: "government",
  ownerOnly: false,
  userPermissions: [PermissionFlagsBits.Administrator],
  async execute(message, args) {
    const guildId = message.guild.id;
    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);
    const reason = args.slice(2).join(" ") || "No reason provided";

    if (!target) {
      return message.reply("❌ Please mention a user to fine.");
    }

    if (isNaN(amount) || amount <= 0) {
      return message.reply("❌ Please enter a valid amount.");
    }

    let government = await Government.findOne({ guildId });
    if (!government || !government.government.enabled) {
      return message.reply("❌ Government system is not enabled.");
    }

    let user = await User.findOne({ userId: target.id });
    if (!user) {
      user = new User({ userId: target.id });
    }

    const fineRecord = {
      userId: target.id,
      amount,
      reason,
      issuedAt: new Date(),
      isPaid: false
    };

    government.enforcement.fines.push(fineRecord);
    await government.save();

    // Deduct from wallet
    user.wallet = Math.max(0, user.wallet - amount);
    await user.save();

    message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("🚨 Fine Issued")
          .addFields(
            { name: "User", value: `${target.tag}`, inline: true },
            { name: "Amount", value: `$${amount}`, inline: true },
            { name: "Reason", value: reason, inline: false }
          )
      ]
    });

    target.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("⚠️ You've Been Fined!")
          .addFields(
            { name: "Server", value: message.guild.name, inline: false },
            { name: "Fine Amount", value: `$${amount}`, inline: true },
            { name: "Reason", value: reason, inline: false }
          )
      ]
    }).catch(() => {});
  }
};
