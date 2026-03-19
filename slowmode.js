const ms = require("ms");

module.exports = {
  name: "slowmode",
  description: "Set the slowmode for a channel",
  permissions: ["ManageChannels"],

  async execute(message, args) {
    if (!message.guild.members.me.permissionsIn(message.channel).has("ManageChannels")) {
      return message.reply("❌ I do not have permission to manage this channel.");
    }
    if (!args[0]) return message.reply("❌ Provide a time (e.g., 5s, 1m) or 'off'.");

    let seconds = 0;
    if (args[0].toLowerCase() !== "off") {
      const duration = ms(args[0]);
      if (!duration || isNaN(duration)) return message.reply("❌ Invalid time format.");
      seconds = Math.floor(duration / 1000);
    }

    if (seconds > 21600) return message.reply("❌ Slowmode cannot be longer than 6 hours.");

    try {
      await message.channel.setRateLimitPerUser(seconds);
      message.channel.send(`⏱️ Slowmode set to **${args[0].toLowerCase() === "off" ? "off" : args[0]}**.`);
    } catch (error) {
      console.error(error);
      message.reply("❌ Failed to set slowmode.");
    }
  }
};