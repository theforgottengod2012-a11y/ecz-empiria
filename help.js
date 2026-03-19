const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");

// Module metadata: emoji + description for every module
const MODULE_META = {
  economy:      { emoji: "💰", color: 0xf1c40f, desc: "Economy, jobs, gambling, farming, pets" },
  moderation:   { emoji: "🛡️", color: 0xe74c3c, desc: "Ban, kick, warn, mute, automod" },
  fun:          { emoji: "🎮", color: 0x9b59b6, desc: "Games, memes, trivia, 8ball" },
  giveaway:     { emoji: "🎉", color: 0x2ecc71, desc: "Start, end and reroll giveaways" },
  clans:        { emoji: "⚔️", color: 0xe67e22, desc: "Create and manage clans" },
  government:   { emoji: "🏛️", color: 0x3498db, desc: "Government, laws, taxes, budget" },
  tickets:      { emoji: "🎫", color: 0x1abc9c, desc: "Support ticket system" },
  utility:      { emoji: "🔧", color: 0x95a5a6, desc: "Server info, roles, settings" },
  music:        { emoji: "🎵", color: 0xff6b9d, desc: "Play music in voice channels" },
  misc:         { emoji: "📦", color: 0x7f8c8d, desc: "Miscellaneous commands" },
  leaderboards: { emoji: "🏆", color: 0xf39c12, desc: "Rankings and leaderboards" },
  antinuke:     { emoji: "🔒", color: 0xc0392b, desc: "Anti-nuke protection" },
  automod:      { emoji: "🤖", color: 0x2980b9, desc: "Auto moderation rules" },
  stardust:     { emoji: "✨", color: 0x8e44ad, desc: "Stardust special system" },
  vanityroles:  { emoji: "🎨", color: 0xd35400, desc: "Custom vanity roles" },
  welcomer:     { emoji: "👋", color: 0x27ae60, desc: "Welcome messages" },
  pets:         { emoji: "🐾", color: 0x16a085, desc: "Pet training and battles" },
  extra:        { emoji: "➕", color: 0x7f8c8d, desc: "Extra features" },
  verify:       { emoji: "✅", color: 0x2ecc71, desc: "Verification system" },
  system:       { emoji: "⚙️", color: 0x607d8b, desc: "Core system commands" },
};

function getMeta(mod) {
  return MODULE_META[mod?.toLowerCase()] || { emoji: "📌", color: 0x5865f2, desc: "Various commands" };
}

function buildCategoryEmbed(moduleKey, commands) {
  const meta = getMeta(moduleKey);
  const embed = new EmbedBuilder()
    .setTitle(`${meta.emoji} ${moduleKey.toUpperCase()} Commands`)
    .setColor(meta.color)
    .setDescription(`*${meta.desc}*\nPrefix: \`$\` | Total: **${commands.length}** commands\n\u200b`);

  const CHUNK = 10;
  for (let i = 0; i < commands.length; i += CHUNK) {
    const slice = commands.slice(i, i + CHUNK);
    embed.addFields({
      name: i === 0 ? "Commands" : "​",
      value: slice.map(c =>
        `\`$${c.name}\`${c.aliases?.length ? ` *(${c.aliases.map(a=>`$${a}`).join(", ")})*` : ""} — ${c.description || "No description"}`
      ).join("\n"),
      inline: false,
    });
  }

  embed.setFooter({ text: "Use $help <command> for detailed info on any command" });
  return embed;
}

function buildCommandEmbed(cmd) {
  const meta = getMeta(cmd.module);
  return new EmbedBuilder()
    .setTitle(`${meta.emoji} $${cmd.name}`)
    .setColor(meta.color)
    .setDescription(cmd.description || "No description available.")
    .addFields(
      { name: "📌 Usage",    value: `\`${cmd.usage || `$${cmd.name}`}\``,               inline: true  },
      { name: "🏷️ Module",  value: cmd.module?.toUpperCase() || "SYSTEM",               inline: true  },
      { name: "🔀 Aliases", value: cmd.aliases?.map(a=>`\`$${a}\``).join(", ") || "None", inline: true },
    )
    .setFooter({ text: "Arguments in <> are required. [] are optional." });
}

module.exports = {
  name: "help",
  aliases: ["h", "commands", "cmds"],
  description: "Browse all commands with an interactive live menu",
  usage: "$help [command | module]",
  module: "system",

  execute: async (message, args, client) => {
    const query = args.join(" ").toLowerCase().trim();

    // ── 1. Single command lookup ─────────────────────────────────────────
    if (query) {
      const cmd =
        client.commands.get(query) ||
        [...client.commands.values()].find(c => c.aliases?.includes(query));

      if (cmd) {
        return message.reply({ embeds: [buildCommandEmbed(cmd)] });
      }

      // ── 2. Module lookup ──────────────────────────────────────────────
      const moduleCmds = [...client.commands.values()].filter(
        c => c.module?.toLowerCase() === query
      );
      if (moduleCmds.length) {
        return message.reply({ embeds: [buildCategoryEmbed(query, moduleCmds)] });
      }

      // ── 3. Fuzzy / partial match ───────────────────────────────────────
      const matches = [...client.commands.values()].filter(c =>
        c.name.includes(query) ||
        (c.description?.toLowerCase().includes(query)) ||
        (c.aliases?.some(a => a.includes(query)))
      );

      if (matches.length === 1) {
        return message.reply({ embeds: [buildCommandEmbed(matches[0])] });
      }
      if (matches.length > 1 && matches.length <= 20) {
        const embed = new EmbedBuilder()
          .setTitle("🔍 Search Results")
          .setColor(0x5865f2)
          .setDescription(`Found **${matches.length}** commands matching \`${query}\`:`)
          .addFields({
            name: "Matches",
            value: matches.map(c => `\`$${c.name}\` — ${c.description || "No description"}`).join("\n").substring(0, 1024)
          })
          .setFooter({ text: "Use $help <command> for full details" });
        return message.reply({ embeds: [embed] });
      }

      // Nothing found
      return message.reply({
        embeds: [new EmbedBuilder()
          .setTitle("❌ Not Found")
          .setColor(0xed4245)
          .setDescription(`No command or module found for \`${query}\`.\nTry \`$help\` to browse all categories.`)]
      });
    }

    // ── 4. Main menu with select dropdown ──────────────────────────────────
    const categories = {};
    [...client.commands.values()].forEach(cmd => {
      const mod = cmd.module || "system";
      if (!categories[mod]) categories[mod] = [];
      categories[mod].push(cmd);
    });

    const sortedMods = Object.keys(categories).sort();

    // Build overview embed
    const overviewEmbed = new EmbedBuilder()
      .setTitle("📡 Empiria 3.0 — Command Center")
      .setColor(0x5865f2)
      .setDescription(
        `**${client.commands.size} prefix commands** across **${sortedMods.length} modules**\n` +
        `Use the dropdown below, or:\n` +
        `• \`$help <module>\` — browse a category\n` +
        `• \`$help <command>\` — get command details\n` +
        `• \`$help <keyword>\` — search commands\n\n` +
        `**Module Overview:**`
      )
      .addFields(
        sortedMods.map(mod => {
          const meta = getMeta(mod);
          return {
            name: `${meta.emoji} ${mod.charAt(0).toUpperCase() + mod.slice(1)}`,
            value: `\`${categories[mod].length}\` commands`,
            inline: true,
          };
        })
      )
      .setFooter({ text: `Prefix: $ | discord.gg/ecz | ${new Date().toLocaleDateString()}` })
      .setThumbnail(client.user.displayAvatarURL());

    // Build select menu (max 25 options)
    const menuOptions = sortedMods.slice(0, 25).map(mod => {
      const meta = getMeta(mod);
      const label = `${meta.emoji} ${mod.charAt(0).toUpperCase() + mod.slice(1)}`.substring(0, 25);
      return new StringSelectMenuOptionBuilder()
        .setLabel(label)
        .setDescription(`${categories[mod].length} commands — ${meta.desc.substring(0, 50)}`)
        .setValue(mod);
    });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`help_select_${message.author.id}`)
      .setPlaceholder("📂 Select a module to view commands...")
      .addOptions(menuOptions);

    const homeBtn = new ButtonBuilder()
      .setCustomId(`help_home_${message.author.id}`)
      .setLabel("🏠 Home")
      .setStyle(ButtonStyle.Secondary);

    const row1 = new ActionRowBuilder().addComponents(selectMenu);
    const row2 = new ActionRowBuilder().addComponents(homeBtn);

    const response = await message.reply({
      embeds: [overviewEmbed],
      components: [row1, row2],
    });

    const collector = response.createMessageComponentCollector({
      time: 120_000,
    });

    collector.on("collect", async i => {
      if (i.user.id !== message.author.id) {
        return i.reply({ content: "❌ This menu belongs to someone else.", ephemeral: true });
      }

      // Home button
      if (i.customId === `help_home_${message.author.id}`) {
        return i.update({ embeds: [overviewEmbed], components: [row1, row2] });
      }

      // Category select
      if (i.customId === `help_select_${message.author.id}`) {
        const selected = i.values[0];
        const cmds = categories[selected] || [];
        const catEmbed = buildCategoryEmbed(selected, cmds);
        return i.update({ embeds: [catEmbed], components: [row1, row2] });
      }
    });

    collector.on("end", () => {
      response.edit({ components: [] }).catch(() => {});
    });
  },
};
