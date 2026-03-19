const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reactionrole")
    .setDescription("Create a reaction role message")
    .addStringOption(option => 
      option.setName("title")
        .setDescription("The title of the embed")
        .setRequired(true))
    .addStringOption(option => 
      option.setName("description")
        .setDescription("The description of the embed")
        .setRequired(true))
    .addRoleOption(option => 
      option.setName("role")
        .setDescription("The role to give")
        .setRequired(true))
    .addStringOption(option => 
      option.setName("emoji")
        .setDescription("The emoji to use (can be server emoji)")
        .setRequired(true)),

  async execute(interaction) {
    if (!interaction.member.permissions.has("ManageRoles")) {
      return interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
    }

    const title = interaction.options.getString("title");
    const description = interaction.options.getString("description");
    const role = interaction.options.getRole("role");
    const emojiInput = interaction.options.getString("emoji");

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(`${description}\n\nClick the button below to get the **${role.name}** role!`)
      .setColor(0x0099FF);

    const button = new ButtonBuilder()
      .setCustomId(`role_${role.id}`)
      .setLabel(`Get ${role.name}`)
      .setStyle(ButtonStyle.Primary);

    // Try to parse emoji
    try {
        button.setEmoji(emojiInput);
    } catch (e) {
        // If it's a custom emoji string like <:name:id>, discord.js handles it
        // If it's just the ID, we might need to fetch it, but setEmoji usually works with the raw string
    }

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
