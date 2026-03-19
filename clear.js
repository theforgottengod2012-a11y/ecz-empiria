const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const config = require("../../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Purge messages from the channel")
    .addIntegerOption(option => 
      option.setName("amount")
        .setDescription("Number of messages to clear (1-100)")
        .setMinValue(1)
        .setMaxValue(100))
    .addUserOption(option =>
      option.setName("user")
        .setDescription("Clear messages from a specific user"))
    .addStringOption(option =>
      option.setName("type")
        .setDescription("Type of messages to clear")
        .addChoices(
          { name: "Bots", value: "bots" },
          { name: "Links", value: "links" },
          { name: "Images", value: "images" }
        ))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const amount = interaction.options.getInteger("amount") || 100;
    const targetUser = interaction.options.getUser("user");
    const type = interaction.options.getString("type");

    await interaction.deferReply({ ephemeral: true });

    const messages = await interaction.channel.messages.fetch({ limit: 100 });
    let toDelete = Array.from(messages.values());

    if (targetUser) {
      toDelete = toDelete.filter(m => m.author.id === targetUser.id).slice(0, amount);
    } else if (type === "bots") {
      toDelete = toDelete.filter(m => m.author.bot).slice(0, amount);
    } else if (type === "links") {
      toDelete = toDelete.filter(m => m.content.includes("http")).slice(0, amount);
    } else if (type === "images") {
      toDelete = toDelete.filter(m => m.attachments.size > 0).slice(0, amount);
    } else {
      toDelete = toDelete.slice(0, amount);
    }

    if (toDelete.length === 0) {
      return interaction.editReply("❌ Nothing to delete.");
    }

    try {
      await interaction.channel.bulkDelete(toDelete, true);
      await interaction.editReply(`🧹 Deleted ${toDelete.length} messages.`);
      
      const logChannel = interaction.guild.channels.cache.find(c => c.name === config.modLogChannel);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle("🧹 Messages Cleared")
          .addFields(
            { name: "Moderator", value: interaction.user.tag },
            { name: "Channel", value: interaction.channel.toString() },
            { name: "Amount", value: `${toDelete.length}` }
          )
          .setColor("Blue")
          .setTimestamp();
        logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error(error);
      await interaction.editReply("❌ Failed to delete messages. They might be older than 14 days.");
    }
  }
};
