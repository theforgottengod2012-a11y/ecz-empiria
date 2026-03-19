const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "weather",
  description: "Get current weather for a city",
  module: "extra",
  async execute(message, args) {
    const city = args.join(" ");
    if (!city) return message.reply("❌ Please provide a city name.");

    try {
      const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, {
          headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      
      const current = data.current_condition[0];
      const area = data.nearest_area[0];

      const embed = new EmbedBuilder()
        .setTitle(`Weather in ${area.areaName[0].value}, ${area.country[0].value}`)
        .addFields(
          { name: "Temperature", value: `${current.temp_C}°C / ${current.temp_F}°F`, inline: true },
          { name: "Condition", value: current.weatherDesc[0].value, inline: true },
          { name: "Humidity", value: `${current.humidity}%`, inline: true },
          { name: "Wind", value: `${current.windspeedKmph} km/h`, inline: true }
        )
        .setColor(0x3498DB)
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (err) {
      message.reply("❌ Could not find weather for that city.");
    }
  }
};
