const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "fun",
  description: "Extra fun commands like kiss, hug, poke, marry, kill",
  async execute(message, args) {
    const action = args[0]?.toLowerCase();
    const target = message.mentions.users.first();

    const availableActions = ["kiss", "hug", "poke", "marry", "kill", "slap"];

    if (!action || !availableActions.includes(action) || !target) 
      return message.reply("Usage: `$fun <kiss/hug/poke/marry/kill/slap> @user`");

    const folderPath = path.resolve(__dirname, "../../assets/fun", action);
    
    if (!fs.existsSync(folderPath)) {
        return message.reply("Action media folder not found! Please make sure the assets exist.");
    }

    const files = fs.readdirSync(folderPath).filter(f => f.endsWith(".mp4") || f.endsWith(".gif") || f.endsWith(".png") || f.endsWith(".jpg"));
    
    if (!files.length) {
        // Fallback to a simple message if no media is found
        const embed = new EmbedBuilder()
          .setTitle(`${message.author.username} ${action}s ${target.username}!`)
          .setColor("Random")
          .setFooter({ text: "Extra Fun Command 😎" });
        return message.reply({ embeds: [embed] });
    }

    const chosenFile = files[Math.floor(Math.random() * files.length)];
    const filePath = path.join(folderPath, chosenFile);
    const attachmentName = chosenFile.replace(/\s+/g, "_");
    const attachment = new AttachmentBuilder(filePath, { name: attachmentName });

    const embed = new EmbedBuilder()
      .setTitle(`${message.author.username} ${action}s ${target.username}!`)
      .setImage(`attachment://${attachmentName}`)
      .setColor("Random")
      .setFooter({ text: "Empiria Advanced Fun System 😎" });

    message.reply({ embeds: [embed], files: [attachment] });
  },
};