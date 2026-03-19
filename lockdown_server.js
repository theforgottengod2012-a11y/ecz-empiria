const { PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "lockdown",
  description: "Lock or unlock the entire server (all channels)",
  module: "moderation",
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply("❌ Only administrators can use server lockdown.");
    }

    const mode = args[0]?.toLowerCase();
    if (mode !== "on" && mode !== "off") return message.reply("❌ Usage: `$lockdown <on|off>`");

    const channels = message.guild.channels.cache.filter(c => c.type === 0); // Text channels
    let count = 0;

    await message.reply(`🔄 Processing lockdown **${mode}** for ${channels.size} channels...`);

    for (const [id, channel] of channels) {
      try {
        await channel.permissionOverwrites.edit(message.guild.id, {
          SendMessages: mode === "off"
        });
        count++;
      } catch (e) {}
    }

    message.channel.send(`✅ Lockdown **${mode.toUpperCase()}** complete. Updated **${count}** channels.`);
  }
};
