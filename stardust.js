const { EmbedBuilder } = require("discord.js");
const Stardust = require("../../database/models/Stardust");

module.exports = {
    name: "stardust",
    description: "Check your Stardust balance",
    async execute(message, args) {
        let data = await Stardust.findOne({ userId: message.author.id });
        if (!data) {
            data = await Stardust.create({ userId: message.author.id });
        }

        const embed = new EmbedBuilder()
            .setTitle("🌌 Stardust Balance")
            .setDescription(`You currently have **${data.stardust}** Stardust.`)
            .setColor("#9b59b6")
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};