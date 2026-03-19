const { EmbedBuilder } = require("discord.js");
const InviteTracker = require("../../database/models/InviteTracker");

module.exports = {
  name: "inviteleaderboard",
  aliases: ["inviteboard"],
  description: "View the invite leaderboard",
  async execute(message, args) {
    const board = await InviteTracker.aggregate([
      { $match: { guildId: message.guild.id, fake: false } },
      { $group: { _id: "$inviter", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    if (board.length === 0) {
      return message.reply("📊 No invites yet!");
    }

    const embed = new EmbedBuilder()
      .setTitle("📊 Invite Leaderboard")
      .setColor("#5865F2")
      .setTimestamp();

    board.forEach((record, index) => {
      embed.addFields({
        name: `#${index + 1}`,
        value: `<@${record._id}> — **${record.count}** invites`,
        inline: false
      });
    });

    message.reply({ embeds: [embed] });
  }
};
