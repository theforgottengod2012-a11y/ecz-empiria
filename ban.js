const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const Case = require("../../database/models/Case");
const { getNextCaseId } = require("../../utils/caseUtils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user from the server")
    .addUserOption(option => 
      option.setName("target")
        .setDescription("The user to ban")
        .setRequired(true))
    .addStringOption(option => 
      option.setName("reason")
        .setDescription("The reason for the ban")
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const user = interaction.options.getUser("target");
    const reason = interaction.options.getString("reason") || "No reason";
    const member = interaction.guild.members.cache.get(user.id);

    if (member) {
      if (!member.bannable) {
        return interaction.reply({ content: "❌ I cannot ban this user. They might have a higher role than me or I lack permissions.", ephemeral: true });
      }
      if (interaction.member.roles.highest.position <= member.roles.highest.position && interaction.user.id !== interaction.guild.ownerId) {
        return interaction.reply({ content: "❌ You cannot ban someone with an equal or higher role.", ephemeral: true });
      }
    }

    if (user.id === "1359147702088237076") return interaction.reply({ content: "❌ You cannot ban the bot owner.", ephemeral: true });

    try {
      await interaction.guild.members.ban(user, { reason });
    } catch (error) {
      console.error(error);
      return interaction.reply({ content: "❌ Failed to ban the user. Check my permissions and role hierarchy.", ephemeral: true });
    }

    const caseId = await getNextCaseId(interaction.guild.id);
    await Case.create({
      guildId: interaction.guild.id,
      caseId,
      userId: user.id,
      moderatorId: interaction.user.id,
      action: "BAN",
      reason
    });

    await interaction.reply({
      content: `🔨 **${user.tag} banned**\nReason: ${reason}\nCase #${caseId}`
    });
  }
};
