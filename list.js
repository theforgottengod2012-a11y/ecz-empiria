const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "list",
  description: "List members with a specific role",
  module: "utility",
  async execute(message, args) {
    const sub = args[0]?.toLowerCase();
    if (sub !== "inrole") return message.reply("Usage: `$list inrole <role/role id>`");

    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
    if (!role) return message.reply("❌ Please provide a valid role or role ID.");

    // Ensure we have all members cached
    await message.guild.members.fetch();
    const members = role.members.map(m => `\`${m.user.tag}\``);
    
    const embed = new EmbedBuilder()
      .setTitle(`Members with Role: ${role.name}`)
      .setColor(role.color || "#3498db")
      .setDescription(members.length > 0 ? members.join(", ").slice(0, 2048) : "No members found in this role.")
      .setFooter({ text: `Total: ${members.length} members` });

    message.reply({ embeds: [embed] });
  },
};
