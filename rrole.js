const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const ReactionRole = require("../../database/models/ReactionRole");

module.exports = {
  name: "rrole",
  description: "Setup reaction role panels",
  permissions: ["Administrator"],
  async execute(message, args) {
    const sub = args[0]?.toLowerCase();

    if (sub === "panel") {
      // Create a panel for users to select roles
      const embed = new EmbedBuilder()
        .setTitle("🎭 Reaction Roles")
        .setDescription("Select roles from the dropdown menu below!")
        .setColor("#5865F2");

      const msg = await message.reply({ embeds: [embed] });

      await ReactionRole.create({
        guildId: message.guild.id,
        messageId: msg.id,
        channelId: message.channel.id,
        roles: []
      });

      message.reply(`✅ Reaction role panel created!\n**Message ID:** \`${msg.id}\`\nUse: \`$rrole add ${msg.id} <@role> <emoji>\``);
    }

    if (sub === "add") {
      const messageId = args[1];
      const role = message.mentions.roles.first();
      const emoji = args[3];

      if (!messageId || !role || !emoji) {
        return message.reply("❌ Usage: `$rrole add <messageId> <@role> <emoji>`");
      }

      const rrole = await ReactionRole.findOne({ messageId });
      if (!rrole) return message.reply("❌ Panel not found. Create one with `$rrole panel`");

      rrole.roles.push({ emoji, roleId: role.id, label: role.name });
      await rrole.save();

      // Update the message with select menu
      try {
        const msg = await message.guild.channels.cache.get(rrole.channelId)?.messages.fetch(messageId);
        if (msg) {
          const options = rrole.roles.map(r => ({
            label: r.label,
            value: r.roleId,
            emoji: r.emoji
          }));

          const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`rr_${messageId}`)
              .setPlaceholder("Select roles...")
              .addOptions(options)
          );

          await msg.edit({ components: [row] });
        }
      } catch (e) {}

      message.reply(`✅ Added **${role.name}** to panel!`);
    }

    if (sub === "remove") {
      const messageId = args[1];
      const roleId = message.mentions.roles.first()?.id;

      if (!messageId || !roleId) {
        return message.reply("❌ Usage: `$rrole remove <messageId> <@role>`");
      }

      const rrole = await ReactionRole.findOne({ messageId });
      if (!rrole) return message.reply("❌ Panel not found.");

      rrole.roles = rrole.roles.filter(r => r.roleId !== roleId);
      await rrole.save();

      message.reply("✅ Role removed from panel!");
    }
  }
};
