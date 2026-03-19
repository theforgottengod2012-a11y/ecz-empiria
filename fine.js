const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const Government = require("../../database/models/Government");
const User = require("../../database/models/User");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fine")
    .setDescription("Issue a fine to a user")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((opt) =>
      opt.setName("user").setDescription("User to fine").setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt.setName("amount").setDescription("Fine amount").setRequired(true).setMinValue(1)
    )
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("Reason for fine")
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const target = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");
    const reason = interaction.options.getString("reason") || "No reason provided";

    let government = await Government.findOne({ guildId });
    if (!government || !government.government.enabled) {
      return interaction.reply({
        content: "❌ Government system is not enabled.",
        ephemeral: true
      });
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

    user.wallet = Math.max(0, user.wallet - amount);
    await user.save();

    await interaction.reply({
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
            { name: "Server", value: interaction.guild.name, inline: false },
            { name: "Fine Amount", value: `$${amount}`, inline: true },
            { name: "Reason", value: reason, inline: false }
          )
      ]
    }).catch(() => {});
  }
};
