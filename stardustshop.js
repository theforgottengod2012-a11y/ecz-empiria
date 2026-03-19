const { EmbedBuilder } = require("discord.js");
const Stardust = require("../../database/models/Stardust");

module.exports = {
    name: "stardustshop",
    description: "Buy premium items with Stardust",
    async execute(message, args) {
        const shopEmbed = new EmbedBuilder()
            .setTitle("🌌 Stardust Premium Shop")
            .setDescription("Welcome to the premium shop! Use `$stardustshop buy <item>` to purchase.")
            .addFields(
                { name: "📦 Stardust Crate (50 🌌)", value: "A crate containing random rewards. ID: `crate`" },
                { name: "🎟️ Cosmic Pass (500 🌌)", value: "Unlock exclusive rewards and titles. ID: `pass`" }
            )
            .setColor("#9b59b6")
            .setFooter({ text: "More items coming soon!" });

        message.reply({ embeds: [shopEmbed] });
    }
};