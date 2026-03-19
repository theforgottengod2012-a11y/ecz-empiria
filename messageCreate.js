const AutoMod      = require("../database/models/AutoMod");
const User         = require("../database/models/User");
const ModActivity  = require("../database/models/ModActivity");
const ModTracker   = require("../database/models/ModTracker");
const GuildConfig  = require("../database/models/GuildConfig");
const { EmbedBuilder } = require("discord.js");

const OWNER_ID = process.env.BOT_OWNER_ID || "1359147702088237076";

// Per-guild prefix cache (refreshed every 5 minutes)
const prefixCache = new Map();
async function getPrefix(guildId) {
  const cached = prefixCache.get(guildId);
  if (cached && Date.now() - cached.ts < 60_000) return cached.prefix;
  try {
    const cfg    = await GuildConfig.findOne({ guildId });
    const prefix = cfg?.prefix || process.env.PREFIX || "$";
    prefixCache.set(guildId, { prefix, ts: Date.now() });
    return prefix;
  } catch {
    return process.env.PREFIX || "$";
  }
}

module.exports = {
  name: "messageCreate",
  once: false,

  async execute(message, client) {
    if (message.author.bot) return;

    // ── DM Handler ──────────────────────────────────────────────────────────────
    if (!message.guild) {
      (async () => {
        try {
          const DMLog = require("../database/models/DMLog");
          await DMLog.findOneAndUpdate(
            { userId: message.author.id },
            {
              $push: {
                messages: {
                  $each: [{
                    messageId:  message.id,
                    content:    message.content || "[No text content]",
                    fromBot:    false,
                    authorName: message.author.username,
                    timestamp:  message.createdAt,
                  }],
                  $slice: -500,
                }
              },
              $set: {
                username:      message.author.username,
                avatarUrl:     message.author.displayAvatarURL({ size: 128 }),
                lastMessage:   message.content || "[No text content]",
                lastMessageAt: message.createdAt,
                unread:        true,
              }
            },
            { upsert: true, new: true }
          );
        } catch (err) {
          console.error("[DM Handler] Failed to log DM:", err.message);
        }
      })();
      // Auto-reply for DMs
      const content = message.content.toLowerCase().trim();
      if (content === "help" || content === "$help") {
        return message.channel.send("👋 Hi! I'm **Empiria**, a multipurpose bot. Use **$help** in a server to see all commands. Join our server: https://discord.gg/ecz");
      }
      return;
    }

    // ── Owner Ping Alert ─────────────────────────────────────────────────────
    const mentionsOwner =
      message.mentions.users.has(OWNER_ID) ||
      message.content.includes(`<@${OWNER_ID}>`) ||
      message.content.includes(`<@!${OWNER_ID}>`);

    if (mentionsOwner && message.author.id !== OWNER_ID) {
      (async () => {
        try {
          const MentionLog = require("../database/models/MentionLog");

          // Fetch some context (previous messages)
          let contextText = null;
          try {
            const fetched = await message.channel.messages.fetch({ limit: 5, before: message.id });
            const sorted  = [...fetched.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);
            contextText   = sorted.map(m => `[${m.author.username}]: ${m.content}`).join("\n");
          } catch {}

          await MentionLog.create({
            guildId:     message.guild.id,
            guildName:   message.guild.name,
            channelId:   message.channel.id,
            channelName: message.channel.name,
            userId:      message.author.id,
            username:    message.author.username,
            displayName: message.member?.displayName || message.author.username,
            avatarUrl:   message.author.displayAvatarURL({ size: 128 }),
            content:     message.content,
            messageId:   message.id,
            messageUrl:  message.url,
            context:     contextText,
          });

          // DM the owner
          const owner = await client.users.fetch(OWNER_ID).catch(() => null);
          if (owner) {
            const alertEmbed = new EmbedBuilder()
              .setColor(0xff4444)
              .setTitle("🔔 You Were Mentioned!")
              .setDescription(`**${message.member?.displayName || message.author.username}** (\`${message.author.tag}\`) mentioned you in **${message.guild.name}**`)
              .addFields(
                { name: "📢 Server", value: message.guild.name, inline: true },
                { name: "💬 Channel", value: `<#${message.channel.id}>`, inline: true },
                { name: "🔗 Jump", value: `[View Message](${message.url})`, inline: true },
                { name: "💬 Message", value: message.content.slice(0, 1020) || "[No text]" },
              )
              .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 128 }))
              .setTimestamp()
              .setFooter({ text: `Empiria Alert System • ${message.guild.name}` });

            if (contextText) {
              alertEmbed.addFields({ name: "📜 Context (before)", value: ("```\n" + contextText.slice(0, 800) + "\n```") });
            }

            await owner.send({ embeds: [alertEmbed] }).catch(() => {});
          }
        } catch (err) {
          console.error("[OwnerAlert] Failed:", err.message);
        }
      })();
    }

    // ── Mod Activity: count messages in general-chat for staff ──────────────
    (async () => {
      try {
        const { trackLiveMessage, getCachedConfig } = require("../utils/modTracker");
        const tracker = await getCachedConfig(message.guild.id);
        if (tracker?.generalChannelId && message.channel.id === tracker.generalChannelId) {
          const isStaff = tracker.staffRoleIds.length &&
            message.member?.roles.cache.some(r => tracker.staffRoleIds.includes(r.id));
          if (isStaff) {
            // ① Instant in-memory update — board shows new count within 1 second
            trackLiveMessage(message.guild.id, message.author.id);
            // ② Persist to DB asynchronously (board caches will absorb the delay)
            ModActivity.findOneAndUpdate(
              { guildId: message.guild.id, userId: message.author.id },
              {
                $inc: { todayMessages: 1, totalMessages: 1 },
                $set: { lastMessage: new Date() },
                $setOnInsert: { guildId: message.guild.id, userId: message.author.id },
              },
              { upsert: true }
            ).catch(() => {});
          }
          // Always advance the cursor so backfill knows where we left off
          ModTracker.updateOne(
            { guildId: message.guild.id },
            { $set: { lastSeenMessageId: message.id } }
          ).catch(() => {});
        }
      } catch (_) {}
    })();

    // 💤 AFK Check (Mentions)
    if (message.mentions.users.size > 0) {
      for (const [id, user] of message.mentions.users) {
        if (id === message.author.id) continue;
        const userData = await User.findOne({ userId: id });
        
        // 🎭 PING REACTORS LOGIC (Not on reply and not a mention within a message)
        const isOnlyPing = message.content.trim() === user.toString() || message.content.trim() === `<@!${id}>`;
        if (userData?.pingEmojis?.length > 0 && !message.reference && isOnlyPing) {
          for (const emoji of userData.pingEmojis) {
            try { await message.react(emoji); } catch (e) {}
          }
        }

        if (userData?.afk?.status) {
          const now = new Date();
          const diff = Math.floor((now - userData.afk.timestamp) / 60000);
          const timeStr = diff === 0 ? "less than a minute" : `${diff} minute${diff === 1 ? "" : "s"}`;
          
          const embed = new EmbedBuilder()
            .setColor("#2f3136")
            .setAuthor({ name: "🌙 User is AFK" })
            .setDescription(`**${user.username}** is currently chilling away from the keyboard.\n\n> **Reason:** ${userData.afk.reason}\n> **Away for:** ${timeStr}`)
            .setFooter({ text: `Eternal Chill Zone • AFK System • ${userData.afk.timestamp.toLocaleDateString()}` });
          message.reply({ embeds: [embed] });
        }
      }
    }

    // 💤 AFK Remove (On message)
    const authorData = await User.findOne({ userId: message.author.id });
    if (authorData?.afk?.status) {
      authorData.afk.status = false;
      await authorData.save();
      const welcomeEmbed = new EmbedBuilder()
        .setColor("#5865F2")
        .setDescription(`✨ **Welcome back, ${message.author.username}!**\nI've removed your AFK status. Hope you had a good break in the **Eternal Chill Zone**.`);
      message.reply({ embeds: [welcomeEmbed] }).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    const config = await AutoMod.findOne({
      guildId: message.guild.id,
    });

    if (config && config.enabled) {
      // Skip if user is staff or in ignored channel/role
      const isMod = message.member && message.member.permissions.has("ManageMessages");
      const inIgnoredChannel = config.ignoredChannels.includes(message.channel.id);
      const hasIgnoredRole = message.member && config.ignoredRoles.some(role => message.member.roles.cache.has(role));
      
      if (!isMod && !inIgnoredChannel && !hasIgnoredRole) {
        const { isScamLink, isInviteLink, containsBlacklistedWord, countCapsPercentage, countEmojis } = require("../utils/automodUtils");
        
        // ⚠️ SPAM DETECTION
        if (config.spam) {
          if (!client.spamMap) client.spamMap = new Map();
          const now = Date.now();
          const userData = client.spamMap.get(message.author.id) || { count: 0, lastMessage: 0, content: "", warnings: 0 };
          const isSimilar = userData.content === message.content;
          const tooFast = now - userData.lastMessage < (config.spamTimeWindow * 1000);
          
          if (tooFast || (isSimilar && message.content.length > 5)) {
            userData.count++;
          } else {
            userData.count = 1;
          }
          
          userData.lastMessage = now;
          userData.content = message.content;
          client.spamMap.set(message.author.id, userData);
          
          if (userData.count >= config.spamSensitivity) {
            await message.delete().catch(() => {});
            userData.warnings++;
            const punishment = getPunishment(config, userData.warnings);
            await applyPunishment(message, message.author, punishment, "Spam detected", config);
            userData.count = 0;
          }
          
          // Repetitive characters
          if (/(.)\1{6,}/.test(message.content) && message.content.length > 6) {
            await message.delete().catch(() => {});
            return message.channel.send(`⚠️ ${message.author}, too many repetitive characters.`).then((m) => setTimeout(() => m.delete().catch(() => {}), 3000));
          }
        }
        
        // 🔗 INVITE LINK DETECTION
        if (config.invites && isInviteLink(message.content)) {
          await message.delete().catch(() => {});
          message.channel.send(`🚫 ${message.author}, invite links are not allowed.`).then((m) => setTimeout(() => m.delete().catch(() => {}), 3000));
          
          const inviteData = client.spamMap.get(message.author.id) || { inviteWarnings: 0 };
          inviteData.inviteWarnings = (inviteData.inviteWarnings || 0) + 1;
          const punishment = getPunishment(config, inviteData.inviteWarnings);
          if (inviteData.inviteWarnings >= 2) {
            await applyPunishment(message, message.author, punishment, "Posting invite links", config);
            inviteData.inviteWarnings = 0;
          }
          client.spamMap.set(message.author.id, inviteData);
        }
        
        // 🔗 LINK DETECTION
        if (config.links && message.content.includes("http")) {
          const { WHITELISTED_DOMAINS } = require("../utils/automodUtils");
          const isWhitelisted = WHITELISTED_DOMAINS.some(domain => message.content.includes(domain));
          if (!isWhitelisted) {
            await message.delete().catch(() => {});
            return message.channel.send(`🔗 Links are not allowed here.`).then((m) => setTimeout(() => m.delete().catch(() => {}), 3000));
          }
        }
        
        // ⚠️ SCAM LINK DETECTION
        if (config.scamLinks && isScamLink(message.content)) {
          await message.delete().catch(() => {});
          message.channel.send(`🚨 ${message.author}, that link looks suspicious!`).then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));
          const scamData = client.spamMap.get(message.author.id) || { scamWarnings: 0 };
          scamData.scamWarnings = (scamData.scamWarnings || 0) + 1;
          if (scamData.scamWarnings >= 2) {
            await applyPunishment(message, message.author, "timeout", "Posting scam links", config);
            scamData.scamWarnings = 0;
          }
          client.spamMap.set(message.author.id, scamData);
        }
        
        // 📝 BLACKLISTED WORDS
        if (config.blacklistedWords.length > 0) {
          const badWord = containsBlacklistedWord(message.content, config.blacklistedWords);
          if (badWord) {
            await message.delete().catch(() => {});
            message.channel.send(`⛔ ${message.author}, that word is not allowed here.`).then((m) => setTimeout(() => m.delete().catch(() => {}), 3000));
            const badWordData = client.spamMap.get(message.author.id) || { badWordWarnings: 0 };
            badWordData.badWordWarnings = (badWordData.badWordWarnings || 0) + 1;
            const punishment = getPunishment(config, badWordData.badWordWarnings);
            if (badWordData.badWordWarnings >= 2) {
              await applyPunishment(message, message.author, punishment, `Used blacklisted word: ${badWord}`, config);
              badWordData.badWordWarnings = 0;
            }
            client.spamMap.set(message.author.id, badWordData);
          }
        }
        
        // 📌 CAPS SPAM
        if (config.caps && message.content.length >= (config.capsMinLength || 10)) {
          const capsPercent = countCapsPercentage(message.content);
          if (capsPercent >= (config.capsPercentage || 70)) {
            await message.delete().catch(() => {});
            return message.channel.send(`🔤 ${message.author}, no excessive caps.`).then((m) => setTimeout(() => m.delete().catch(() => {}), 3000));
          }
        }
        
        // 😂 EMOJI SPAM
        if (config.emojis) {
          const emojiCount = countEmojis(message.content);
          if (emojiCount > config.emojiLimit) {
            await message.delete().catch(() => {});
            return message.channel.send(`😂 ${message.author}, too many emojis.`).then((m) => setTimeout(() => m.delete().catch(() => {}), 3000));
          }
        }
      }
    }

    const prefix = await getPrefix(message.guild.id);

    if (message.content.startsWith(`<@!${client.user.id}>`) || message.content.startsWith(`<@${client.user.id}>`)) {
      const prompt = message.content.replace(`<@!${client.user.id}>`, "").replace(`<@${client.user.id}>`, "").trim();
      const lp     = prompt.toLowerCase();

      // ── @bot stats [@user] ───────────────────────────────────────────────
      if (lp.startsWith("stats") || lp.startsWith("actstats") || lp.startsWith("act stability") || lp.startsWith("actstability")) {
        const { buildMemberStatsEmbed, statusDot, statusLabel, fmtTime, liveOnlineSeconds } = require("../utils/modTracker");
        const config = await ModTracker.findOne({ guildId: message.guild.id });
        const staffRoleIds = config?.staffRoleIds || [];

        const isStaff =
          !staffRoleIds.length ||
          message.member.roles.cache.some(r => staffRoleIds.includes(r.id)) ||
          message.member.permissions.has("Administrator") ||
          message.author.id === process.env.BOT_OWNER_ID;

        if (!isStaff) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0xff4444)
                .setTitle("❌ Staff Only")
                .setDescription("Activity stats are only available to staff members.")
            ]
          });
        }

        // If "act stability" — show system overview
        if (lp.startsWith("act stability") || lp.startsWith("actstability")) {
          const uptime   = process.uptime();
          const h        = Math.floor(uptime / 3600);
          const m        = Math.floor((uptime % 3600) / 60);
          const trackers = await ModTracker.find({});
          const totalDocs = await (require("../database/models/ModActivity")).countDocuments();
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0x5865f2)
                .setTitle("📊 Mod Tracker — System Stability")
                .addFields(
                  { name: "🤖 Bot Uptime",         value: `${h}h ${m}m`,            inline: true },
                  { name: "🏠 Guilds",              value: `${client.guilds.cache.size}`, inline: true },
                  { name: "📡 Tracked Guilds",      value: `${trackers.length}`,     inline: true },
                  { name: "📋 Activity Records",    value: `${totalDocs}`,           inline: true },
                  { name: "🔄 Refresh Rate",        value: "Every 1 second (live)",  inline: true },
                  { name: "🕛 Next Daily Reset",    value: "Midnight (auto)",        inline: true }
                )
                .setFooter({ text: "Empiria Mod Tracker • discord.gg/ecz" })
                .setTimestamp()
            ]
          });
        }

        // Otherwise show individual stats
        const target = message.mentions.members.first() || message.member;
        const embed  = await buildMemberStatsEmbed(message.guild, target, config);
        return message.reply({ embeds: [embed] });
      }

      // ── @bot (no prompt) ──────────────────────────────────────────────────
      if (!prompt) {
        const categories = {};
        [...client.commands.values()].forEach((cmd) => {
          const moduleName = cmd.module || "SYSTEM";
          if (!categories[moduleName]) categories[moduleName] = [];
          categories[moduleName].push(`\`${cmd.name}\``);
        });
        const infoEmbed = new EmbedBuilder()
          .setTitle("🤖 EMPIRIA ADVANCED SYSTEM")
          .setDescription(`I am an advanced multipurpose Discord bot.\n\n**PREFIX:** \`${prefix}\` or Mention\n**MODULES:** ${Object.keys(categories).length}\n**COMMANDS:** ${client.commands.size}\n\nUse \`${prefix}help\` to see all commands!\nTry **@Empiria stats** for your activity or **@Empiria act stability** for system info.`)
          .setColor(0x00ae86)
          .setTimestamp();
        return message.reply({ embeds: [infoEmbed] });
      }

      const knowledgeBase = {
        "what is your name": "I am Empiria, your advanced assistant.",
        "what is the prefix": `The current prefix is \`${prefix}\`. You can also mention me!`
      };
      const lowPrompt = prompt.toLowerCase();
      for (const [q, a] of Object.entries(knowledgeBase)) {
        if (lowPrompt.includes(q)) return message.reply(a);
      }
    }

    if (!message.content.startsWith(prefix)) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName) || [...client.commands.values()].find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    if (!command) return;

    if (command.permissions) {
      const authorPerms = message.channel.permissionsFor(message.author);
      if (!authorPerms || !command.permissions.every(perm => authorPerms.has(perm))) {
        if (message.author.id !== "1359147702088237076") { return message.reply("❌ You do not have permissions to use this command."); }
      }
    }

    try { await command.execute(message, args, client); } catch (error) { console.error(error); message.reply("❌ There was an error trying to execute that command!"); }
  },
};

// ⚡ Helper function to get punishment level
function getPunishment(config, violationCount) {
  if (violationCount === 1) return config.punishments.level1;
  if (violationCount === 2) return config.punishments.level2;
  if (violationCount === 3) return config.punishments.level3;
  return config.punishments.level4;
}

// ⚡ Helper function to apply punishment
async function applyPunishment(message, user, punishment, reason, config) {
  try {
    if (punishment === "warn") {
      const Warning = require("../database/models/Warning");
      const Case = require("../database/models/Case");
      const { getNextCaseId } = require("../utils/caseUtils");
      
      let warningData = await Warning.findOne({
        guildId: message.guild.id,
        userId: user.id
      });
      
      if (!warningData) {
        warningData = new Warning({
          guildId: message.guild.id,
          userId: user.id,
          warnings: []
        });
      }
      
      warningData.warnings.push({ moderatorId: message.client.user.id, reason });
      await warningData.save();
      
      const caseId = await getNextCaseId(message.guild.id);
      await Case.create({
        guildId: message.guild.id,
        caseId,
        userId: user.id,
        moderatorId: message.client.user.id,
        action: "AUTOMOD_WARN",
        reason
      });
      
      message.channel.send(`⚠️ ${user} **warned** for: ${reason}`).catch(() => {});
    } else if (punishment === "mute") {
      message.channel.send(`🔇 ${user} muted for: ${reason}`).catch(() => {});
    } else if (punishment === "timeout") {
      const member = await message.guild.members.fetch(user.id).catch(() => null);
      if (member) {
        await member.timeout(config.punishments.timeoutDuration, reason).catch(() => {});
        message.channel.send(`⏳ ${user} timed out for ${config.punishments.timeoutDuration / 60000}m - ${reason}`).catch(() => {});
      }
    } else if (punishment === "kick") {
      const member = await message.guild.members.fetch(user.id).catch(() => null);
      if (member && member.kickable) {
        await member.kick(reason).catch(() => {});
        message.channel.send(`👢 ${user} kicked for: ${reason}`).catch(() => {});
      }
    }
  } catch (error) {
    console.error("Error applying punishment:", error);
  }
}
