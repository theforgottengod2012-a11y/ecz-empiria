const { EmbedBuilder } = require("discord.js");
const Stardust = require("../../database/models/Stardust");

module.exports = {
    name: "stardustcrate",
    description: "Open a Stardust crate",
    async execute(message, args) {
        let data = await Stardust.findOne({ userId: message.author.id });
        if (!data || !data.crates.find(c => c.crateId === "crate" && c.quantity > 0)) {
            return message.reply("❌ You don't have any Stardust crates!");
        }

        // Simple logic: remove 1 crate, give random stardust or nothing for now
        const crateIndex = data.crates.findIndex(c => c.crateId === "crate");
        data.crates[crateIndex].quantity -= 1;
        if (data.crates[crateIndex].quantity === 0) {
            data.crates.splice(crateIndex, 1);
        }

        const reward = Math.floor(Math.random() * 100) + 10;
        data.stardust += reward;
        await data.save();

        const embed = new EmbedBuilder()
            .setTitle("📦 Crate Opened!")
            .setDescription(`You opened a Stardust Crate and found **${reward}** Stardust!`)
            .setColor("#f1c40f");

        message.reply({ embeds: [embed] });
    }
};