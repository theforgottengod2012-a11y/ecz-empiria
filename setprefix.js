const GuildConfig = require("../../database/models/GuildConfig");

module.exports = {
  name: "setprefix",
  aliases: ["prefix", "changeprefix"],
  description: "Change the bot's command prefix for this server",
  usage: "$setprefix <new prefix>",
  permissions: ["Administrator"],

  async execute(message, args) {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ You need **Administrator** permission to change the prefix.");
    }

    const newPrefix = args[0];

    if (!newPrefix) {
      const cfg = await GuildConfig.findOne({ guildId: message.guild.id });
      const current = cfg?.prefix || "$";
      return message.reply(`ℹ️ Current prefix is \`${current}\`\nUsage: \`${current}setprefix <new prefix>\``);
    }

    if (newPrefix.length > 5) {
      return message.reply("❌ Prefix must be **5 characters or fewer**.");
    }

    if (/\s/.test(newPrefix)) {
      return message.reply("❌ Prefix cannot contain spaces.");
    }

    await GuildConfig.findOneAndUpdate(
      { guildId: message.guild.id },
      { $set: { prefix: newPrefix } },
      { upsert: true }
    );

    return message.reply(`✅ Prefix updated to \`${newPrefix}\`\nAll commands now use \`${newPrefix}help\`, \`${newPrefix}modtracker\`, etc.`);
  },
};
