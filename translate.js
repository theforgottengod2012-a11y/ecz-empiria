const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "translate",
  description: "Translate text to English",
  module: "extra",
  async execute(message, args) {
    const text = args.join(" ");
    if (!text) return message.reply("❌ Please provide text to translate.");

    try {
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|en`);
      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      
      if (!data.responseData || !data.responseData.translatedText) throw new Error("Translation failed");
      const translated = data.responseData.translatedText;

      const embed = new EmbedBuilder()
        .setTitle("Translation")
        .addFields(
          { name: "Original", value: text.substring(0, 1024) },
          { name: "Translated (EN)", value: translated.substring(0, 1024) }
        )
        .setColor(0x2ECC71);

      message.reply({ embeds: [embed] });
    } catch (err) {
      message.reply("❌ Translation failed.");
    }
  }
};
