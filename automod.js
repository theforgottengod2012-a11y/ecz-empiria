const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const AutoMod = require("../../database/models/AutoMod");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("automod")
    .setDescription("Configure automod settings")
    .addSubcommand(sub => sub.setName("status").setDescription("View current automod settings"))
    .addSubcommand(sub => sub.setName("enable").setDescription("Enable automod"))
    .addSubcommand(sub => sub.setName("disable").setDescription("Disable automod"))
    .addSubcommand(sub => 
      sub.setName("filter")
        .setDescription("Toggle a filter")
        .addStringOption(opt => opt.setName("type").setDescription("Filter type").setRequired(true)
          .addChoices(
            { name: "spam", value: "spam" },
            { name: "invites", value: "invites" },
            { name: "links", value: "links" },
            { name: "caps", value: "caps" },
            { name: "emojis", value: "emojis" },
            { name: "scamlinks", value: "scamLinks" }
          ))
    )
    .addSubcommand(sub =>
      sub.setName("punishment")
        .setDescription("Set punishment ladder")
        .addStringOption(opt => opt.setName("level").setDescription("Punishment level").setRequired(true)
          .addChoices(
            { name: "Level 1", value: "level1" },
            { name: "Level 2", value: "level2" },
            { name: "Level 3", value: "level3" },
            { name: "Level 4", value: "level4" }
          ))
        .addStringOption(opt => opt.setName("action").setDescription("Action").setRequired(true)
          .addChoices(
            { name: "warn", value: "warn" },
            { name: "mute", value: "mute" },
            { name: "timeout", value: "timeout" },
            { name: "kick", value: "kick" }
          ))
    )
    .addSubcommand(sub =>
      sub.setName("blacklist")
        .setDescription("Manage blacklisted words")
        .addStringOption(opt => opt.setName("action").setDescription("add/remove").setRequired(true)
          .addChoices({ name: "add", value: "add" }, { name: "remove", value: "remove" }))
        .addStringOption(opt => opt.setName("word").setDescription("The word to blacklist").setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName("spamsettings")
        .setDescription("Configure spam detection")
        .addIntegerOption(opt => opt.setName("sensitivity").setDescription("Messages before action (1-10)"))
        .addIntegerOption(opt => opt.setName("timewindow").setDescription("Seconds to detect spam (1-30)"))
    )
    .addSubcommand(sub =>
      sub.setName("logs")
        .setDescription("Set log channel")
        .addChannelOption(opt => opt.setName("channel").setDescription("Log channel").setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    let config = await AutoMod.findOne({ guildId: interaction.guild.id });
    if (!config) {
      config = new AutoMod({ guildId: interaction.guild.id });
    }

    if (subcommand === "status") {
      const status = (bool) => bool ? "✅ ON" : "❌ OFF";
      const embed = new EmbedBuilder()
        .setTitle("🤖 AutoMod Configuration")
        .setColor(0x5865F2)
        .addFields(
          { name: "Status", value: config.enabled ? "✅ **ENABLED**" : "❌ **DISABLED**", inline: false },
          { name: "Filters", value: `Spam: ${status(config.spam)}\nInvites: ${status(config.invites)}\nLinks: ${status(config.links)}\nCaps: ${status(config.caps)}\nEmojis: ${status(config.emojis)}\nScam Links: ${status(config.scamLinks)}`, inline: true },
          { name: "Punishment Ladder", value: `Level 1: ${config.punishments.level1}\nLevel 2: ${config.punishments.level2}\nLevel 3: ${config.punishments.level3}\nLevel 4: ${config.punishments.level4}`, inline: true },
          { name: "Spam Settings", value: `Sensitivity: ${config.spamSensitivity} msgs\nTime Window: ${config.spamTimeWindow}s`, inline: true },
          { name: "Blacklisted Words", value: config.blacklistedWords.length > 0 ? `${config.blacklistedWords.length} words` : "None", inline: true }
        )
        .setFooter({ text: `Ignored Channels: ${config.ignoredChannels.length} | Ignored Roles: ${config.ignoredRoles.length}` });
      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === "enable") {
      config.enabled = true;
      await config.save();
      return interaction.reply("✅ **AutoMod Enabled**");
    }

    if (subcommand === "disable") {
      config.enabled = false;
      await config.save();
      return interaction.reply("❌ **AutoMod Disabled**");
    }

    if (subcommand === "filter") {
      const filterType = interaction.options.getString("type");
      config[filterType] = !config[filterType];
      await config.save();
      return interaction.reply(`⚙️ **${filterType}** filter set to ${config[filterType] ? "✅ ON" : "❌ OFF"}`);
    }

    if (subcommand === "punishment") {
      const level = interaction.options.getString("level");
      const action = interaction.options.getString("action");
      config.punishments[level] = action;
      await config.save();
      return interaction.reply(`⚖️ **${level.toUpperCase()}** punishment set to **${action}**`);
    }

    if (subcommand === "blacklist") {
      const action = interaction.options.getString("action");
      const word = interaction.options.getString("word").toLowerCase();
      if (action === "add") {
        if (config.blacklistedWords.includes(word)) {
          return interaction.reply(`⚠️ **${word}** is already blacklisted.`);
        }
        config.blacklistedWords.push(word);
        await config.save();
        return interaction.reply(`✅ Added **${word}** to blacklist`);
      } else {
        config.blacklistedWords = config.blacklistedWords.filter(w => w !== word);
        await config.save();
        return interaction.reply(`✅ Removed **${word}** from blacklist`);
      }
    }

    if (subcommand === "spamsettings") {
      const sensitivity = interaction.options.getInteger("sensitivity");
      const timewindow = interaction.options.getInteger("timewindow");
      if (sensitivity) config.spamSensitivity = Math.max(1, Math.min(10, sensitivity));
      if (timewindow) config.spamTimeWindow = Math.max(1, Math.min(30, timewindow));
      await config.save();
      return interaction.reply(`⚙️ Spam settings updated\n**Sensitivity:** ${config.spamSensitivity}\n**Time Window:** ${config.spamTimeWindow}s`);
    }

    if (subcommand === "logs") {
      const channel = interaction.options.getChannel("channel");
      config.modLog = channel.id;
      await config.save();
      return interaction.reply(`📊 AutoMod logs set to ${channel}`);
    }
  }
};
