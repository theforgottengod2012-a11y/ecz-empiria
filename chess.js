const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  name: "chess",
  description: "Start a simple Chess match (UI only, logic simplified)",
  usage: "$chess <@user>",
  async execute(message, args, client) {
    if (!message || !message.mentions || !message.mentions.users) return;
    const opponent = message.mentions.users.first();
    if (!opponent || opponent.bot || opponent.id === message.author.id) {
      return message.reply("❌ Mention a valid user to play chess with.");
    }

    const embed = new EmbedBuilder()
      .setTitle("♟️ Chess Match")
      .setDescription(`${message.author} (White) vs ${opponent} (Black)\n\n*Chess is a complex game. For now, this is a placeholder UI for an interactive match. In a full version, this would use a library like chess.js.*`)
      .setColor(0x2F3136);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("chess_accept").setLabel("Accept Challenge").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("chess_decline").setLabel("Decline").setStyle(ButtonStyle.Danger)
    );

    const msg = await message.reply({ content: `${opponent}, you have been challenged to a game of Chess!`, embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({ time: 60000 });

    collector.on("collect", async i => {
      if (i.user.id !== opponent.id) return i.reply({ content: "This is not for you!", ephemeral: true });

      if (i.customId === "chess_decline") {
        collector.stop();
        return i.update({ content: "❌ Challenge declined.", embeds: [], components: [] });
      }

      await i.update({ content: "🎮 Game started! (Note: Full chess logic requires heavy processing, coming soon in v3!)", components: [] });
      collector.stop();
    });
  }
};