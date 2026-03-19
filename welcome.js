const GuildSettings = require("../../database/models/GuildSettings");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "setwelcome",
  permissions: ["Administrator"],
  async execute(message, args) {
    const channel = message.mentions.channels.first();
    if (!channel) return message.reply("Mention a valid channel.");

    const msg = args.slice(1).join(" ") || "Welcome {user} to {server}!";
    let settings = await GuildSettings.findOne({ guildId: message.guild.id });
    if (!settings) settings = new GuildSettings({ guildId: message.guild.id });

    settings.welcomeChannel = channel.id;
    settings.welcomeMessage = msg;
    await settings.save();

    message.channel.send(`✅ Welcome channel set to ${channel} with message: "${msg}"`);
  }
};