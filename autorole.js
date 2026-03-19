const GuildSettings = require("../../database/models/GuildSettings");

module.exports = {
  name: "setautorole",
  permissions: ["Administrator"],
  async execute(message, args) {
    const role = message.mentions.roles.first();
    if (!role) return message.reply("Mention a valid role.");

    let settings = await GuildSettings.findOne({ guildId: message.guild.id });
    if (!settings) settings = new GuildSettings({ guildId: message.guild.id });

    settings.autorole = role.id;
    await settings.save();

    message.channel.send(`✅ Autorole set to ${role.name}`);
  }
};