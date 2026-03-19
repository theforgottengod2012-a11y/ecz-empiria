const { EmbedBuilder } = require("discord.js");
const Stardust = require("../../database/models/Stardust");

module.exports = {
    name: "stardustrank",
    description: "View the Stardust leaderboard",
    async execute(message, args) {
        const top = await Stardust.find({ isBot: { $not: { $eq: true } } }).sort({ stardust: -1 }).limit(10);
        
        let leaderboard = top.map((user, index) => {
            return `**#${index + 1}** <@${user.userId}> — ${user.stardust} 🌌`;
        }).join("\n");

        const embed = new EmbedBuilder()
            .setTitle("🌌 Stardust Leaderboard")
            .setDescription(leaderboard || "No one has Stardust yet!")
            .setColor("#9b59b6")
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};