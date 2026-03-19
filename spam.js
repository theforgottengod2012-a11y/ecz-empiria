const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
} = require("discord.js");

const OWNER_ID = "1359147702088237076";

module.exports = {
  name: "spam",
  description: "Advanced spam command with settings!",

  // Prefix command
  async execute(message, args) {
    if (message.author.id !== OWNER_ID)
      return message.reply("❌ You don't have permission to use this command!");

    if (!args[0] || !args[1] || !args[2])
      return message.reply("Usage: !spam <count> <delay(ms)> <message>");

    const count = parseInt(args[0]);
    const delay = parseInt(args[1]);
    const spamMessage = args.slice(2).join(" ");

    if (isNaN(count) || isNaN(delay))
      return message.reply("Count and delay must be numbers!");
    if (
      count >
      100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
    )
      return message.reply(
        "Maximum 100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000 messages at once!",
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("stopSpam")
        .setLabel("Stop Spam")
        .setStyle(ButtonStyle.Danger),
    );

    const sentMessage = await message.reply({
      content: `Starting spam of ${count} messages with ${delay}ms delay.`,
      components: [row],
    });

    let stopped = false;
    let i = 0;

    const collector = sentMessage.createMessageComponentCollector({
      filter: (interaction) => interaction.user.id === OWNER_ID,
      time: count * delay + 10000,
    });

    collector.on("collect", async (interaction) => {
      if (interaction.customId === "stopSpam") {
        stopped = true;
        await interaction.update({ content: "Spam stopped!", components: [] });
        collector.stop();
      }
    });

    const interval = setInterval(async () => {
      if (stopped || i >= count) {
        clearInterval(interval);
        if (!stopped)
          sentMessage.edit({ content: "Spam complete!", components: [] });
        return;
      }
      await message.channel.send(spamMessage);
      i++;
    }, delay);
  },

  // Slash command
  data: new SlashCommandBuilder()
    .setName("spam")
    .setDescription("Advanced spam command with settings!")
    .addIntegerOption((option) =>
      option
        .setName("count")
        .setDescription("Number of times to send the message")
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("delay")
        .setDescription("Delay in milliseconds between messages")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Message to spam")
        .setRequired(true),
    )
    .addChannelOption((option) =>
      option.setName("channel").setDescription("Optional channel to spam in"),
    ),

  async slashExecute(interaction) {
    if (interaction.user.id !== OWNER_ID)
      return interaction.reply({
        content: "❌ You don't have permission to use this command!",
        ephemeral: true,
      });

    const count = interaction.options.getInteger("count");
    const delay = interaction.options.getInteger("delay");
    const spamMessage = interaction.options.getString("message");
    const channel =
      interaction.options.getChannel("channel") || interaction.channel;

    if (
      count >
      100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
    )
      return interaction.reply({
        content:
          "Maximum 100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000 messages allowed!",
        ephemeral: true,
      });

    await interaction.reply({
      content: `Starting spam of ${count} messages in ${channel}`,
      ephemeral: true,
    });

    for (let i = 0; i < count; i++) {
      await channel.send(spamMessage);
      await new Promise((r) => setTimeout(r, delay));
    }

    await interaction.editReply({ content: "Spam complete! ✅" });
  },
};
