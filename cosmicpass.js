const { EmbedBuilder } = require("discord.js");
const Stardust = require("../../database/models/Stardust");

module.exports = {
    name: "cosmicpass",
    description: "Check your Cosmic Pass status or unlock rewards",
    async execute(message, args) {
        let data = await Stardust.findOne({ userId: message.author.id });
        
        const status = data && data.cosmicPass ? "✅ Active" : "❌ Inactive";
        
        const embed = new EmbedBuilder()
            .setTitle("🎟️ Cosmic Pass")
            .setDescription(`Your Cosmic Pass status: **${status}**\n\nActive pass holders get exclusive rewards and higher multipliers!`)
            .setColor("#3498db");

        message.reply({ embeds: [embed] });
    }
};