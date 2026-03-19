const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("editrole")
    .setDescription("Edit a role's properties")
    .addRoleOption(option => option.setName("role").setDescription("The role to edit").setRequired(true))
    .addStringOption(option => option.setName("name").setDescription("The new name for the role"))
    .addStringOption(option => option.setName("color").setDescription("The new color for the role (hex code)"))
    .addBooleanOption(option => option.setName("hoist").setDescription("Whether the role should be displayed separately"))
    .addBooleanOption(option => option.setName("mentionable").setDescription("Whether the role should be mentionable"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    const role = interaction.options.getRole("role");
    const name = interaction.options.getString("name");
    const color = interaction.options.getString("color");
    const hoist = interaction.options.getBoolean("hoist");
    const mentionable = interaction.options.getBoolean("mentionable");

    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.reply({ content: "❌ I cannot edit this role as it is higher than or equal to my highest role.", ephemeral: true });
    }

    try {
      const data = {};
      if (name) data.name = name;
      if (color) data.color = color;
      if (hoist !== null) data.hoist = hoist;
      if (mentionable !== null) data.mentionable = mentionable;

      await role.edit(data);
      await interaction.reply({ content: `✅ Successfully updated role **${role.name}**.` });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: "❌ Failed to edit the role. Make sure the color hex is valid and I have permissions.", ephemeral: true });
    }
  }
};
