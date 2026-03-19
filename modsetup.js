const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const ModTracker  = require("../../database/models/ModTracker");
const { refreshGuild } = require("../../utils/modTracker");

module.exports = {
  name: "modsetup",
  description: "Configure the moderator activity tracker system",
  usage: "$modsetup <subcommand> [args]",
  aliases: ["modtrack", "actsetup"],
  module: "moderation",

  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff4444)
            .setTitle("❌ No Permission")
            .setDescription("You need **Administrator** to use this command.")
        ]
      });
    }

    const sub = (args[0] || "help").toLowerCase();

    // ── help ────────────────────────────────────────────────────────────────
    if (sub === "help") {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle("🛡️ Mod Activity Tracker — Setup Guide")
            .setDescription("A live activity tracker that shows each staff tier's message counts, online time, and more in dedicated channels.")
            .addFields(
              {
                name: "Step 1 — Define your staff roles (highest → lowest)",
                value: "`$modsetup staffroles @Admin @SrMod @Mod @TMod`"
              },
              {
                name: "Step 2 — Set the channel where messages are counted",
                value: "`$modsetup general #general-chat`"
              },
              {
                name: "Step 3 — Link each role to its display channel",
                value: [
                  "`$modsetup track @Admin #admin-activity`",
                  "`$modsetup track @SrMod #srmod-activity`",
                  "`$modsetup track @Mod #mod-activity`",
                  "`$modsetup track @TMod #tmod-activity`",
                ].join("\n")
              },
              {
                name: "Step 4 (optional) — Set history/log channel",
                value: "`$modsetup history #mod-history`\nDaily summaries will be posted here at midnight."
              },
              {
                name: "Other commands",
                value: [
                  "`$modsetup list` — View current configuration",
                  "`$modsetup remove @role` — Remove a role's tracking",
                  "`$modsetup refresh` — Force-refresh all embeds now",
                ].join("\n")
              },
              {
                name: "How the 'highest role' logic works",
                value: "If a member has a custom role above their staff role (e.g. Custom > Sr.Mod > Mod), the bot ignores the custom role and puts them under **Sr.Mod** — their highest *staff* role."
              }
            )
            .setFooter({ text: "Empiria Mod Tracker • Updates every 5s • Resets daily at midnight" })
        ]
      });
    }

    // ── staffroles @r1 @r2 ... ──────────────────────────────────────────────
    if (sub === "staffroles") {
      const roles = [...message.mentions.roles.values()];
      if (!roles.length) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xff4444)
              .setTitle("❌ No Roles Mentioned")
              .setDescription("Usage: `$modsetup staffroles @Admin @SrMod @Mod @TMod`\nMention all staff roles from highest to lowest.")
          ]
        });
      }

      await ModTracker.findOneAndUpdate(
        { guildId: message.guild.id },
        { $set: { staffRoleIds: roles.map(r => r.id) } },
        { upsert: true }
      );

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle("✅ Staff Roles Saved")
            .setDescription(roles.map((r, i) => `**${i + 1}.** ${r} — ${r.name}`).join("\n"))
            .setFooter({ text: "These roles are used for the highest-role logic and tracking." })
        ]
      });
    }

    // ── general #channel ────────────────────────────────────────────────────
    if (sub === "general") {
      const channel = message.mentions.channels.first() ||
        message.guild.channels.cache.get(args[1]);
      if (!channel) {
        return message.reply({
          embeds: [
            new EmbedBuilder().setColor(0xff4444)
              .setTitle("❌ Missing Channel")
              .setDescription("Usage: `$modsetup general #general-chat`")
          ]
        });
      }

      await ModTracker.findOneAndUpdate(
        { guildId: message.guild.id },
        { $set: { generalChannelId: channel.id } },
        { upsert: true }
      );

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle("✅ Counting Channel Set")
            .setDescription(`Messages from staff in ${channel} will now be counted.`)
        ]
      });
    }

    // ── history #channel ────────────────────────────────────────────────────
    if (sub === "history") {
      const channel = message.mentions.channels.first() ||
        message.guild.channels.cache.get(args[1]);
      if (!channel) {
        return message.reply({
          embeds: [
            new EmbedBuilder().setColor(0xff4444)
              .setTitle("❌ Missing Channel")
              .setDescription("Usage: `$modsetup history #mod-history`")
          ]
        });
      }

      await ModTracker.findOneAndUpdate(
        { guildId: message.guild.id },
        { $set: { historyChannelId: channel.id } },
        { upsert: true }
      );

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle("✅ History Channel Set")
            .setDescription(`Daily reset summaries will be posted in ${channel}.`)
        ]
      });
    }

    // ── track @role #channel ────────────────────────────────────────────────
    if (sub === "track") {
      const role    = message.mentions.roles.first();
      const channel = message.mentions.channels.first();

      if (!role || !channel) {
        return message.reply({
          embeds: [
            new EmbedBuilder().setColor(0xff4444)
              .setTitle("❌ Missing Arguments")
              .setDescription("Usage: `$modsetup track @role #channel`")
          ]
        });
      }

      let config = await ModTracker.findOne({ guildId: message.guild.id });
      if (!config) {
        config = await ModTracker.create({ guildId: message.guild.id });
      }

      const existing = config.roleChannels.find(rc => rc.roleId === role.id);
      if (existing) {
        existing.channelId = channel.id;
        existing.messageId = null;
      } else {
        config.roleChannels.push({ roleId: role.id, channelId: channel.id, messageId: null });
      }
      await config.save();

      // Also ensure this role is in staffRoleIds if not already
      if (!config.staffRoleIds.includes(role.id)) {
        config.staffRoleIds.push(role.id);
        await config.save();
      }

      await refreshGuild(client, message.guild);

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle("✅ Role Tracker Linked")
            .addFields(
              { name: "Role",    value: `${role}`,    inline: true },
              { name: "Channel", value: `${channel}`, inline: true }
            )
            .setDescription("Live activity embed posted. Auto-refreshes every 5 seconds.")
            .setFooter({ text: "Empiria Mod Tracker" })
        ]
      });
    }

    // ── remove @role ────────────────────────────────────────────────────────
    if (sub === "remove") {
      const role = message.mentions.roles.first();
      if (!role) {
        return message.reply({
          embeds: [
            new EmbedBuilder().setColor(0xff4444)
              .setTitle("❌ Missing Role")
              .setDescription("Usage: `$modsetup remove @role`")
          ]
        });
      }

      await ModTracker.updateOne(
        { guildId: message.guild.id },
        { $pull: { roleChannels: { roleId: role.id } } }
      );

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle("✅ Removed")
            .setDescription(`Tracking for **${role.name}** has been removed.`)
        ]
      });
    }

    // ── list ────────────────────────────────────────────────────────────────
    if (sub === "list") {
      const config = await ModTracker.findOne({ guildId: message.guild.id });

      if (!config) {
        return message.reply({
          embeds: [
            new EmbedBuilder().setColor(0xffa500)
              .setTitle("📋 No Config Found")
              .setDescription("Nothing is set up yet. Run `$modsetup help` to get started.")
          ]
        });
      }

      const generalCh = config.generalChannelId ? `<#${config.generalChannelId}>` : "*Not set*";
      const historyCh = config.historyChannelId ? `<#${config.historyChannelId}>` : "*Not set*";
      const staffList = config.staffRoleIds.length
        ? config.staffRoleIds.map((id, i) => {
            const r = message.guild.roles.cache.get(id);
            return `**${i + 1}.** ${r ? `${r}` : id}`;
          }).join("\n")
        : "*None configured*";
      const roleList = config.roleChannels.length
        ? config.roleChannels.map(rc => {
            const r = message.guild.roles.cache.get(rc.roleId);
            return `• **${r?.name || rc.roleId}** → <#${rc.channelId}>`;
          }).join("\n")
        : "*None configured*";

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle("📋 Mod Tracker Configuration")
            .addFields(
              { name: "💬 Message Counting Channel", value: generalCh,  inline: true },
              { name: "📅 History Channel",          value: historyCh,  inline: true },
              { name: "🛡️ Staff Roles (in order)",  value: staffList },
              { name: "📡 Role → Display Channel",   value: roleList  }
            )
            .setFooter({ text: "Empiria Mod Tracker" })
        ]
      });
    }

    // ── refresh ─────────────────────────────────────────────────────────────
    if (sub === "refresh") {
      const m = await message.reply({
        embeds: [
          new EmbedBuilder().setColor(0x5865f2)
            .setTitle("🔄 Refreshing all embeds...")
        ]
      });

      await refreshGuild(client, message.guild);

      return m.edit({
        embeds: [
          new EmbedBuilder().setColor(0x57f287)
            .setTitle("✅ All embeds refreshed")
        ]
      });
    }

    return message.reply({
      embeds: [
        new EmbedBuilder().setColor(0xff4444)
          .setTitle("❌ Unknown Subcommand")
          .setDescription("Run `$modsetup help` to see all options.")
      ]
    });
  }
};
