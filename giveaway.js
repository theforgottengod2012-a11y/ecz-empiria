const { EmbedBuilder } = require("discord.js");
const Giveaway = require("../../database/models/Giveaway");
const User = require("../../database/models/User");
const ms = require("ms");

module.exports = {
  name: "gstart",
  description: "Start a giveaway with requirements",
  permissions: ["ManageGuild"],
  async execute(message, args) {
    // Basic giveaway command
    // Usage: $gstart <time> <winners> <prize>
    if (!args[0] || !args[1] || !args[2]) return message.reply("❌ Usage: `$gstart <time> <winners> <prize>`\nExample: `$gstart 24h 1 Nitro`.");

    const duration = ms(args[0]);
    const winners = parseInt(args[1]);
    const prize = args.slice(2).join(" ");

    // Advanced requirements (Optional flags)
    // $gstart 24h 1 Nitro --invites 3 --level 5 --role @Member
    const invitesReq = parseInt(message.content.split("--invites")[1]) || 0;
    const levelReq = parseInt(message.content.split("--level")[1]) || 0;
    const roleReq = message.mentions.roles.first()?.id;

    if (!duration) return message.reply("❌ Invalid duration.");
    if (isNaN(winners) || winners < 1) return message.reply("❌ Invalid winner count.");

    const endTime = Date.now() + duration;

    const embed = new EmbedBuilder()
      .setTitle("🎉 GIVEAWAY 🎉")
      .setDescription(`**Prize:** ${prize}\n**Winners:** ${winners}\n**Ends:** <t:${Math.floor(endTime / 1000)}:R>\n\n**Requirements:**\n${invitesReq ? `• Invites: ${invitesReq}\n` : ""}${levelReq ? `• Level: ${levelReq}\n` : ""}${roleReq ? `• Role: <@&${roleReq}>\n` : ""}*React with 🎉 to enter!*`)
      .setColor("#5865F2")
      .setFooter({ text: `Hosted by ${message.author.tag}` })
      .setTimestamp(endTime);

    const msg = await message.channel.send({ embeds: [embed] });
    await msg.react("🎉");

    await Giveaway.create({
      guildId: message.guild.id,
      messageId: msg.id,
      channelId: message.channel.id,
      prize,
      winners,
      endTime,
      hostedBy: message.author.id,
      requirements: {
        invites: invitesReq,
        level: levelReq,
        roles: roleReq ? [roleReq] : []
      }
    });
  }
};
