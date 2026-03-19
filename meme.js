const { EmbedBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  name: "meme",
  description: "Get a random meme from Reddit",
  usage: "$meme",
  execute: async (message, args, client) => {
    try {
      const response = await axios.get("https://meme-api.com/gimme");
      
      if (response.data && response.data.code === 503) {
        throw new Error("Service Unavailable");
      }

      const meme = response.data;

      const embed = new EmbedBuilder()
        .setTitle(meme.title || "No Title")
        .setURL(meme.postLink || "https://reddit.com")
        .setImage(meme.url)
        .setColor(0xff4500)
        .setFooter({ text: `👍 ${meme.ups || 0} | r/${meme.subreddit || "unknown"}` });

      message.reply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      if (message && typeof message.reply === "function") {
        message.reply("❌ Failed to fetch a meme. Try again later!");
      }
    }
  }
};