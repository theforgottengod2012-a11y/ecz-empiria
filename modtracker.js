const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const ModTracker      = require("../../database/models/ModTracker");
const ModActivity     = require("../../database/models/ModActivity");
const PendingDemotion = require("../../database/models/PendingDemotion");
const {
  buildMemberStatsEmbed,
  fmtTime,
  liveOnlineSeconds,
  statusDot,
  statusLabel,
} = require("../../utils/modTracker");

// ── Helpers ───────────────────────────────────────────────────────────────────
async function getConfig(guildId) {
  let cfg = await ModTracker.findOne({ guildId });
  if (!cfg) cfg = await ModTracker.create({ guildId });
  return cfg;
}

function isAdmin(message) {
  return message.member.permissions.has("Administrator");
}

function mentionToId(str) {
  return str?.replace(/[<@&>]/g, "");
}

function buildRoleListEmbed(guild, cfg) {
  const lines = cfg.staffRoleIds.map((id, i) => {
    const role = guild.roles.cache.get(id);
    return `**${i + 1}.** ${role ? `<@&${id}> (${role.name})` : `~~${id}~~ (deleted)`}`;
  });
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("⚙️ Staff Role Hierarchy (Highest → Lowest)")
    .setDescription(lines.length ? lines.join("\n") : "*No roles configured.*")
    .setFooter({ text: "Position 1 = highest staff rank" });
}

function buildConfigEmbed(guild, cfg) {
  const roleList = cfg.staffRoleIds.map((id, i) => {
    const role = guild.roles.cache.get(id);
    return `${i + 1}. ${role ? `<@&${id}>` : `~~${id}~~ (deleted)`}`;
  }).join("\n") || "*None*";

  const boardList = cfg.roleChannels.map(rc => {
    const role = guild.roles.cache.get(rc.roleId);
    const ch   = guild.channels.cache.get(rc.channelId);
    return `• ${role ? `<@&${rc.roleId}>` : rc.roleId} → ${ch ? `<#${rc.channelId}>` : rc.channelId}`;
  }).join("\n") || "*None*";

  const authList = cfg.confirmationRoleIds.map(id => {
    const role = guild.roles.cache.get(id);
    return role ? `<@&${id}>` : `~~${id}~~`;
  }).join(", ") || "*None*";

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("📊 Mod Tracker — Full Configuration")
    .addFields(
      { name: "💬 Count Channel",   value: cfg.generalChannelId   ? `<#${cfg.generalChannelId}>`   : "*Not set*", inline: true },
      { name: "📋 History Channel", value: cfg.historyChannelId   ? `<#${cfg.historyChannelId}>`   : "*Not set*", inline: true },
      { name: "🗣️ Staff Chat",      value: cfg.staffChatChannelId ? `<#${cfg.staffChatChannelId}>` : "*Not set*", inline: true },
      { name: "📝 Daily Min",       value: `${cfg.minDailyMessages} messages`, inline: true },
      { name: "⚠️ Fail Threshold",  value: `${cfg.failDaysThreshold} days`,   inline: true },
      { name: "🔄 Demotion System", value: cfg.demotionEnabled ? "✅ Enabled" : "❌ Disabled", inline: true },
      { name: "👑 Staff Roles (Hierarchy)", value: roleList },
      { name: "📌 Live Boards",     value: boardList },
      { name: "🔐 Confirm Roles",   value: authList },
    )
    .setFooter({ text: "Empiria Mod Tracker" })
    .setTimestamp();
}

// ── Usage embed ───────────────────────────────────────────────────────────────
function buildHelp(prefix) {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("📊 ModTracker — Prefix Command Reference")
    .setDescription(`Use \`${prefix}mt <group> <action> [args...]\` or the alias \`${prefix}modtracker\``)
    .addFields(
      {
        name: "📡 channels",
        value: [
          `\`${prefix}mt channels set #count #history #staffchat\``,
          `\`${prefix}mt channels view\``,
        ].join("\n"),
      },
      {
        name: "👑 roles",
        value: [
          `\`${prefix}mt roles add @role [position]\``,
          `\`${prefix}mt roles remove @role\``,
          `\`${prefix}mt roles list\``,
          `\`${prefix}mt roles move @role <position>\``,
        ].join("\n"),
      },
      {
        name: "⬇️ demotion",
        value: [
          `\`${prefix}mt demotion enable\``,
          `\`${prefix}mt demotion disable\``,
          `\`${prefix}mt demotion setmin <amount>\``,
          `\`${prefix}mt demotion setdays <days>\``,
          `\`${prefix}mt demotion addauth @role\``,
          `\`${prefix}mt demotion removeauth @role\``,
        ].join("\n"),
      },
      {
        name: "📌 board",
        value: [
          `\`${prefix}mt board set @role #channel\``,
          `\`${prefix}mt board remove @role\``,
          `\`${prefix}mt board list\``,
        ].join("\n"),
      },
      {
        name: "👤 member",
        value: [
          `\`${prefix}mt stats [@user]\``,
          `\`${prefix}mt forgive @user [reason]\``,
          `\`${prefix}mt forcedemote @user [reason]\``,
          `\`${prefix}mt leaderboard\``,
        ].join("\n"),
      },
      {
        name: "🔍 view",
        value: [
          `\`${prefix}mt config\``,
          `\`${prefix}mt pending\``,
        ].join("\n"),
      },
    )
    .setFooter({ text: "ModTracker requires Administrator permission" });
}

// ── Main command ──────────────────────────────────────────────────────────────
module.exports = {
  name: "modtracker",
  aliases: ["mt", "modtrack", "tracker"],
  description: "Configure and manage the Mod Activity Tracker",
  usage: "$mt <group> <action> [args...]",
  permissions: ["Administrator"],

  async execute(message, args, client) {
    if (!isAdmin(message)) {
      return message.reply("❌ You need **Administrator** permission to use ModTracker commands.");
    }

    const GuildConfig = require("../../database/models/GuildConfig");
    const guildCfg    = await GuildConfig.findOne({ guildId: message.guild.id });
    const prefix      = guildCfg?.prefix || "$";

    const group  = args[0]?.toLowerCase();
    const action = args[1]?.toLowerCase();

    if (!group) {
      return message.reply({ embeds: [buildHelp(prefix)] });
    }

    const { guild } = message;
    const cfg       = await getConfig(guild.id);

    // ══════════════════════════════════════════════════════════════════════════
    //  channels
    // ══════════════════════════════════════════════════════════════════════════
    if (group === "channels") {
      if (!action || action === "view") {
        return message.reply({
          embeds: [new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle("📡 Mod Tracker Channels")
            .addFields(
              { name: "💬 Count Channel",   value: cfg.generalChannelId   ? `<#${cfg.generalChannelId}>`   : "*Not set*", inline: true },
              { name: "📋 History Channel", value: cfg.historyChannelId   ? `<#${cfg.historyChannelId}>`   : "*Not set*", inline: true },
              { name: "🗣️ Staff Chat",      value: cfg.staffChatChannelId ? `<#${cfg.staffChatChannelId}>` : "*Not set*", inline: true },
            )
          ]
        });
      }

      if (action === "set") {
        // Args after "channels set" are channel mentions/IDs
        // Usage: $mt channels set #count #history #staffchat
        const mentions = message.mentions.channels;
        const chArray  = [...mentions.values()];

        if (chArray.length === 0) {
          return message.reply(`❌ Mention the channels. Example:\n\`${prefix}mt channels set #general-chat #mod-history #staff-chat\``);
        }

        if (chArray[0]) cfg.generalChannelId   = chArray[0].id;
        if (chArray[1]) cfg.historyChannelId   = chArray[1].id;
        if (chArray[2]) cfg.staffChatChannelId = chArray[2].id;
        await cfg.save();

        const fields = [];
        if (chArray[0]) fields.push(`💬 **Count channel:** <#${chArray[0].id}>`);
        if (chArray[1]) fields.push(`📋 **History channel:** <#${chArray[1].id}>`);
        if (chArray[2]) fields.push(`🗣️ **Staff chat:** <#${chArray[2].id}>`);

        return message.reply({
          embeds: [new EmbedBuilder().setColor(0x00c851).setTitle("✅ Channels Updated").setDescription(fields.join("\n"))]
        });
      }

      // Allow setting individual channels by keyword
      // $mt channels count #channel  /  $mt channels history #channel  / $mt channels staffchat #channel
      const ch = message.mentions.channels.first();
      if (!ch) return message.reply(`❌ Mention a channel. Usage: \`${prefix}mt channels set #count #history #staffchat\``);

      if (action === "count")     { cfg.generalChannelId   = ch.id; await cfg.save(); return message.reply(`✅ Count channel set to <#${ch.id}>`); }
      if (action === "history")   { cfg.historyChannelId   = ch.id; await cfg.save(); return message.reply(`✅ History channel set to <#${ch.id}>`); }
      if (action === "staffchat" || action === "staff") { cfg.staffChatChannelId = ch.id; await cfg.save(); return message.reply(`✅ Staff chat set to <#${ch.id}>`); }

      return message.reply(`❌ Unknown channel action. Try \`${prefix}mt channels view\` or \`${prefix}mt channels set #count #history #staffchat\``);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  roles
    // ══════════════════════════════════════════════════════════════════════════
    if (group === "roles") {
      if (!action || action === "list") {
        return message.reply({ embeds: [buildRoleListEmbed(guild, cfg)] });
      }

      if (action === "add") {
        const role = message.mentions.roles.first();
        if (!role) return message.reply(`❌ Mention a role. Usage: \`${prefix}mt roles add @SrMod [position]\``);

        if (cfg.staffRoleIds.includes(role.id)) {
          return message.reply(`❌ <@&${role.id}> is already in the hierarchy.`);
        }

        const pos = parseInt(args[2]);
        if (!isNaN(pos) && pos >= 1 && pos <= cfg.staffRoleIds.length) {
          cfg.staffRoleIds.splice(pos - 1, 0, role.id);
        } else {
          cfg.staffRoleIds.push(role.id);
        }
        await cfg.save();

        return message.reply({ embeds: [buildRoleListEmbed(guild, cfg).setTitle(`✅ Added ${role.name} to hierarchy`)] });
      }

      if (action === "remove") {
        const role = message.mentions.roles.first();
        if (!role) return message.reply(`❌ Mention a role. Usage: \`${prefix}mt roles remove @Mod\``);

        const idx = cfg.staffRoleIds.indexOf(role.id);
        if (idx === -1) return message.reply(`❌ <@&${role.id}> is not in the hierarchy.`);

        cfg.staffRoleIds.splice(idx, 1);
        cfg.roleChannels = cfg.roleChannels.filter(rc => rc.roleId !== role.id);
        await cfg.save();

        return message.reply({ embeds: [buildRoleListEmbed(guild, cfg).setTitle(`✅ Removed ${role.name}`)] });
      }

      if (action === "move") {
        const role   = message.mentions.roles.first();
        const newPos = parseInt(args[2]) || parseInt(args[3]);
        if (!role) return message.reply(`❌ Mention a role. Usage: \`${prefix}mt roles move @Mod 2\``);
        if (!newPos || newPos < 1) return message.reply("❌ Provide a valid position number.");

        const idx = cfg.staffRoleIds.indexOf(role.id);
        if (idx === -1) return message.reply(`❌ <@&${role.id}> is not in the hierarchy.`);

        cfg.staffRoleIds.splice(idx, 1);
        cfg.staffRoleIds.splice(Math.min(newPos - 1, cfg.staffRoleIds.length), 0, role.id);
        await cfg.save();

        return message.reply({ embeds: [buildRoleListEmbed(guild, cfg).setTitle(`✅ Moved ${role.name} to position ${newPos}`)] });
      }

      return message.reply(`❌ Unknown roles action. Options: \`add\`, \`remove\`, \`list\`, \`move\``);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  demotion
    // ══════════════════════════════════════════════════════════════════════════
    if (group === "demotion") {
      if (!action) {
        const status = cfg.demotionEnabled ? "✅ Enabled" : "❌ Disabled";
        return message.reply({
          embeds: [new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle("⬇️ Demotion System")
            .addFields(
              { name: "Status",        value: status,                           inline: true },
              { name: "Min Messages",  value: `${cfg.minDailyMessages}/day`,    inline: true },
              { name: "Fail Days",     value: `${cfg.failDaysThreshold} days`,  inline: true },
              { name: "Confirm Roles", value: cfg.confirmationRoleIds.map(id => `<@&${id}>`).join(", ") || "*None*" }
            )
          ]
        });
      }

      if (action === "enable") {
        if (!cfg.staffChatChannelId) return message.reply(`❌ Set a staff chat first: \`${prefix}mt channels staffchat #channel\``);
        if (!cfg.confirmationRoleIds.length) return message.reply(`❌ Add a confirmation role first: \`${prefix}mt demotion addauth @role\``);
        cfg.demotionEnabled = true;
        await cfg.save();
        return message.reply(`✅ Demotion system **enabled**.\nStaff who miss **${cfg.minDailyMessages} msgs/day** for **${cfg.failDaysThreshold} consecutive days** will trigger a confirmation in <#${cfg.staffChatChannelId}>.`);
      }

      if (action === "disable") {
        cfg.demotionEnabled = false;
        await cfg.save();
        return message.reply("✅ Demotion system **disabled**.");
      }

      if (action === "setmin") {
        const amount = parseInt(args[2]);
        if (!amount || amount < 1) return message.reply(`❌ Provide a valid number. Example: \`${prefix}mt demotion setmin 250\``);
        cfg.minDailyMessages = amount;
        await cfg.save();
        return message.reply(`✅ Minimum daily messages set to **${amount}**.`);
      }

      if (action === "setdays") {
        const days = parseInt(args[2]);
        if (!days || days < 1) return message.reply(`❌ Provide a valid number. Example: \`${prefix}mt demotion setdays 3\``);
        cfg.failDaysThreshold = days;
        await cfg.save();
        return message.reply(`✅ Fail days threshold set to **${days} days**.`);
      }

      if (action === "addauth") {
        const role = message.mentions.roles.first();
        if (!role) return message.reply(`❌ Mention a role. Usage: \`${prefix}mt demotion addauth @StaffManager\``);
        if (cfg.confirmationRoleIds.includes(role.id)) return message.reply(`❌ <@&${role.id}> already has demotion authority.`);
        cfg.confirmationRoleIds.push(role.id);
        await cfg.save();
        return message.reply(`✅ <@&${role.id}> can now confirm or cancel demotion requests.`);
      }

      if (action === "removeauth") {
        const role = message.mentions.roles.first();
        if (!role) return message.reply(`❌ Mention a role.`);
        const idx = cfg.confirmationRoleIds.indexOf(role.id);
        if (idx === -1) return message.reply(`❌ <@&${role.id}> is not a confirmation role.`);
        cfg.confirmationRoleIds.splice(idx, 1);
        await cfg.save();
        return message.reply(`✅ Removed <@&${role.id}> from demotion confirmers.`);
      }

      return message.reply(`❌ Unknown demotion action. Options: \`enable\`, \`disable\`, \`setmin\`, \`setdays\`, \`addauth\`, \`removeauth\``);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  board
    // ══════════════════════════════════════════════════════════════════════════
    if (group === "board") {
      if (!action || action === "list") {
        if (!cfg.roleChannels.length) {
          return message.reply("📌 No live boards configured yet.");
        }
        const lines = cfg.roleChannels.map(rc => {
          const role = guild.roles.cache.get(rc.roleId);
          const ch   = guild.channels.cache.get(rc.channelId);
          return `• ${role ? `<@&${rc.roleId}>` : rc.roleId} → ${ch ? `<#${rc.channelId}>` : rc.channelId}`;
        });
        return message.reply({
          embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle("📌 Live Boards").setDescription(lines.join("\n"))]
        });
      }

      if (action === "set") {
        const role = message.mentions.roles.first();
        const ch   = message.mentions.channels.first();
        if (!role) return message.reply(`❌ Mention a role and channel. Usage: \`${prefix}mt board set @Mod #mod-tracker\``);
        if (!ch)   return message.reply(`❌ Mention a channel. Usage: \`${prefix}mt board set @Mod #mod-tracker\``);

        if (!cfg.staffRoleIds.includes(role.id)) {
          return message.reply(`❌ <@&${role.id}> is not in the tracked hierarchy. Add it first: \`${prefix}mt roles add @${role.name}\``);
        }

        const existing = cfg.roleChannels.find(rc => rc.roleId === role.id);
        if (existing) {
          existing.channelId = ch.id;
          existing.messageId = null;
        } else {
          cfg.roleChannels.push({ roleId: role.id, channelId: ch.id, messageId: null });
        }
        await cfg.save();
        return message.reply(`✅ Live board for <@&${role.id}> will be posted in <#${ch.id}> and refreshed every 5 seconds.`);
      }

      if (action === "remove") {
        const role = message.mentions.roles.first();
        if (!role) return message.reply(`❌ Mention a role. Usage: \`${prefix}mt board remove @Mod\``);

        const idx = cfg.roleChannels.findIndex(rc => rc.roleId === role.id);
        if (idx === -1) return message.reply(`❌ No board configured for <@&${role.id}>.`);

        cfg.roleChannels.splice(idx, 1);
        await cfg.save();
        return message.reply(`✅ Removed live board for <@&${role.id}>.`);
      }

      return message.reply(`❌ Unknown board action. Options: \`set\`, \`remove\`, \`list\``);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  stats / leaderboard / forgive / forcedemote  (short aliases)
    // ══════════════════════════════════════════════════════════════════════════
    if (group === "stats") {
      const target = message.mentions.users.first() || message.author;
      const member = await guild.members.fetch(target.id).catch(() => null);
      if (!member) return message.reply("❌ User not found.");
      const embed = await buildMemberStatsEmbed(guild, member, cfg);
      return message.reply({ embeds: [embed] });
    }

    if (group === "leaderboard" || group === "lb") {
      await guild.members.fetch().catch(() => {});
      const docs = await ModActivity.find({ guildId: guild.id }).lean();
      const staffMembers = docs
        .filter(doc => {
          const m = guild.members.cache.get(doc.userId);
          return m && cfg.staffRoleIds.some(id => m.roles.cache.has(id));
        })
        .map(doc => ({
          member: guild.members.cache.get(doc.userId),
          msgs:   doc.todayMessages || 0,
          online: liveOnlineSeconds(doc),
          met:    (doc.todayMessages || 0) >= cfg.minDailyMessages,
          failDays: doc.consecutiveFailDays || 0,
        }))
        .sort((a, b) => b.msgs - a.msgs);

      if (!staffMembers.length) return message.reply("📊 No activity data yet for today.");

      const MEDAL = ["🥇", "🥈", "🥉"];
      const lines = staffMembers.slice(0, 15).map((d, i) => {
        const medal   = MEDAL[i] || `**${i + 1}.**`;
        const reqIcon = d.met ? "✅" : "❌";
        const warn    = d.failDays > 0 ? ` ⚠️ ${d.failDays}d` : "";
        return `${medal} **${d.member.displayName}**${warn}\n> 💬 ${d.msgs}/${cfg.minDailyMessages} ${reqIcon} | ⏱️ ${fmtTime(d.online)}`;
      });

      const metCount = staffMembers.filter(d => d.met).length;
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle("🏆 Staff Activity Leaderboard — Today")
          .setDescription(lines.join("\n\n"))
          .addFields(
            { name: "📊 Min",        value: `${cfg.minDailyMessages} msgs`, inline: true },
            { name: "✅ Met",        value: `${metCount}/${staffMembers.length}`, inline: true },
            { name: "❌ Below",      value: `${staffMembers.length - metCount}/${staffMembers.length}`, inline: true },
          )
          .setFooter({ text: "Empiria Mod Tracker • Resets at midnight" })
          .setTimestamp()
        ]
      });
    }

    if (group === "forgive") {
      const target = message.mentions.users.first();
      if (!target) return message.reply(`❌ Mention a user. Usage: \`${prefix}mt forgive @user [reason]\``);
      const reason = args.slice(2).join(" ") || "No reason provided";

      await ModActivity.findOneAndUpdate(
        { guildId: guild.id, userId: target.id },
        { consecutiveFailDays: 0, pendingDemotion: false }
      );
      await PendingDemotion.updateMany(
        { guildId: guild.id, userId: target.id, status: "pending" },
        { $set: { status: "cancelled", decidedBy: message.author.id } }
      );

      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x00c851)
          .setTitle("✅ Staff Member Forgiven")
          .addFields(
            { name: "👤 Member", value: `<@${target.id}>`, inline: true },
            { name: "📋 Reason", value: reason, inline: true },
            { name: "🔄 Result", value: "Fail days reset to 0. Any pending demotion cancelled." }
          )
          .setThumbnail(target.displayAvatarURL())
          .setFooter({ text: `Forgiven by ${message.author.tag}` })
        ]
      });
    }

    if (group === "forcedemote") {
      const target = message.mentions.users.first();
      if (!target) return message.reply(`❌ Mention a user. Usage: \`${prefix}mt forcedemote @user [reason]\``);

      const member = await guild.members.fetch(target.id).catch(() => null);
      if (!member) return message.reply("❌ User not found.");
      if (!cfg.staffRoleIds.length) return message.reply("❌ No staff roles configured in the hierarchy.");

      let currentRoleId = null, currentRoleIdx = -1;
      for (let i = 0; i < cfg.staffRoleIds.length; i++) {
        if (member.roles.cache.has(cfg.staffRoleIds[i])) {
          currentRoleId  = cfg.staffRoleIds[i];
          currentRoleIdx = i;
          break;
        }
      }

      if (!currentRoleId) return message.reply(`❌ ${member} doesn't hold any tracked staff role.`);

      const currentRole  = guild.roles.cache.get(currentRoleId);
      const targetRoleId = currentRoleIdx < cfg.staffRoleIds.length - 1 ? cfg.staffRoleIds[currentRoleIdx + 1] : null;
      const targetRole   = targetRoleId ? guild.roles.cache.get(targetRoleId) : null;
      const reason       = args.slice(2).join(" ") || "Manual demotion";

      if (currentRole) await member.roles.remove(currentRole).catch(() => {});
      if (targetRole)  await member.roles.add(targetRole).catch(() => {});

      await ModActivity.findOneAndUpdate(
        { guildId: guild.id, userId: target.id },
        { consecutiveFailDays: 0, pendingDemotion: false }
      );
      await PendingDemotion.updateMany(
        { guildId: guild.id, userId: target.id, status: "pending" },
        { $set: { status: "confirmed", decidedBy: message.author.id } }
      );

      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xff4444)
          .setTitle("⬇️ Force Demotion Executed")
          .addFields(
            { name: "👤 Member", value: `${member}`, inline: true },
            { name: "🛡️ Was",   value: currentRole ? `${currentRole}` : "Unknown", inline: true },
            { name: "⬇️ Now",   value: targetRole ? `${targetRole}` : "**Member**", inline: true },
            { name: "📋 Reason", value: reason }
          )
          .setThumbnail(target.displayAvatarURL())
          .setFooter({ text: `Demoted by ${message.author.tag}` })
        ]
      });
    }

    if (group === "pending") {
      const pending = await PendingDemotion.find({ guildId: guild.id, status: "pending" }).lean();
      if (!pending.length) return message.reply("✅ No pending demotion requests.");

      const lines = pending.map(p => {
        const cr = guild.roles.cache.get(p.currentRoleId);
        const tr = p.targetRoleId ? guild.roles.cache.get(p.targetRoleId) : null;
        const ts = Math.floor(new Date(p.expiresAt).getTime() / 1000);
        return `• <@${p.userId}> — ${cr?.name || "Unknown"} → ${tr?.name || "**Member**"}\n  Expires <t:${ts}:R>`;
      });

      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xff9900)
          .setTitle(`⏳ Pending Demotions (${pending.length})`)
          .setDescription(lines.join("\n\n"))
        ]
      });
    }

    if (group === "config") {
      return message.reply({ embeds: [buildConfigEmbed(guild, cfg)] });
    }

    // member subgroup
    if (group === "member") {
      if (!action) return message.reply(`❌ Usage: \`${prefix}mt member stats/forgive/forcedemote/leaderboard\``);
      if (action === "stats") {
        const target = message.mentions.users.first() || message.author;
        const member = await guild.members.fetch(target.id).catch(() => null);
        if (!member) return message.reply("❌ User not found.");
        const embed = await buildMemberStatsEmbed(guild, member, cfg);
        return message.reply({ embeds: [embed] });
      }
      if (action === "leaderboard") {
        args.shift(); args.shift(); // remove "member leaderboard" so rest of handler works
        return module.exports.execute(message, ["leaderboard", ...args], client);
      }
      if (action === "forgive") {
        args.shift(); // remove "member"
        return module.exports.execute(message, ["forgive", ...args.slice(1)], client);
      }
      if (action === "forcedemote") {
        args.shift();
        return module.exports.execute(message, ["forcedemote", ...args.slice(1)], client);
      }
    }

    // Unknown group — show help
    return message.reply({ embeds: [buildHelp(prefix)] });
  },
};
