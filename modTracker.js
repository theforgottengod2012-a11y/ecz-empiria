/**
 * modTracker.js — Core utility for the Mod Activity Tracker + Auto-Demotion System
 * v2: in-memory live tracking for 1-second real-time board accuracy
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const ModActivity     = require("../database/models/ModActivity");
const ModTracker      = require("../database/models/ModTracker");
const PendingDemotion = require("../database/models/PendingDemotion");

// ── In-memory message cache (board messages) ──────────────────────────────────
// Key: `${guildId}-${roleId}` → Discord.js Message object
const msgCache = new Map();

// ── Live message delta (real-time, per-message accuracy) ─────────────────────
// Key: guildId → Map<userId, countDelta>
// Reset whenever the activity cache for that guild expires/refreshes
const liveMessages = new Map();

// ── DB query caches (reduce DB load at 1-second refresh rate) ─────────────────
const activityCache = new Map(); // guildId → { docs, at }
const configCache   = new Map(); // guildId → { config, at }
const ACTIVITY_TTL  = 5_000;    // 5 seconds — matches DB update latency
const CONFIG_TTL    = 30_000;   // 30 seconds — config rarely changes

// ── Public: call this from messageCreate whenever a staff message is counted ──
function trackLiveMessage(guildId, userId) {
  if (!liveMessages.has(guildId)) liveMessages.set(guildId, new Map());
  const gMap = liveMessages.get(guildId);
  gMap.set(userId, (gMap.get(userId) || 0) + 1);
}

// ── Invalidate caches for a guild (e.g. after role changes) ──────────────────
function invalidateGuildCache(guildId) {
  activityCache.delete(guildId);
  configCache.delete(guildId);
  liveMessages.delete(guildId);
}

async function getCachedConfig(guildId) {
  const cached = configCache.get(guildId);
  if (cached && Date.now() - cached.at < CONFIG_TTL) return cached.config;
  const config = await ModTracker.findOne({ guildId });
  configCache.set(guildId, { config, at: Date.now() });
  return config;
}

async function getCachedActivities(guildId) {
  const cached = activityCache.get(guildId);
  if (cached && Date.now() - cached.at < ACTIVITY_TTL) return cached.docs;
  const docs = await ModActivity.find({ guildId });
  // Cache refreshed → live delta for this guild is now baked into DB docs
  liveMessages.delete(guildId);
  activityCache.set(guildId, { docs, at: Date.now() });
  return docs;
}

// ── Format helpers ────────────────────────────────────────────────────────────

function fmtTime(seconds) {
  if (!seconds || seconds < 1) return "0s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function statusDot(status) {
  return { online: "🟢", idle: "🟡", dnd: "🔴", offline: "⚫", invisible: "⚫" }[status] || "⚫";
}

function statusLabel(status) {
  return { online: "Online", idle: "Idle", dnd: "Do Not Disturb", offline: "Offline", invisible: "Invisible" }[status] || "Offline";
}

function sinceStr(date) {
  if (!date) return "Never";
  const diff = Date.now() - new Date(date).getTime();
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "Just now";
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ── Live online time (including active session) ───────────────────────────────

function liveOnlineSeconds(activity) {
  let total = activity?.todayOnlineSeconds || 0;
  if (activity?.sessionStart && activity?.currentStatus !== "offline") {
    total += Math.floor((Date.now() - new Date(activity.sessionStart).getTime()) / 1000);
  }
  return total;
}

// ── Highest staff role (ignores custom roles above staff roles) ────────────────

function getHighestStaffRole(member, staffRoleIds) {
  if (!staffRoleIds?.length) return null;
  return member.roles.cache
    .filter(r => staffRoleIds.includes(r.id))
    .sort((a, b) => b.position - a.position)
    .first() || null;
}

// ── Build live role embed ─────────────────────────────────────────────────────

async function buildRoleEmbed(guild, role, config) {
  await guild.members.fetch().catch(() => {});

  const staffRoleIds  = config.staffRoleIds || [];
  const minDailyMsgs  = config.minDailyMessages || 250;
  const failThreshold = config.failDaysThreshold || 3;

  const members = guild.members.cache.filter(m => {
    if (m.user.bot) return false;
    return getHighestStaffRole(m, staffRoleIds)?.id === role.id;
  });

  // Use cached activities + live delta for instant accuracy without per-second DB queries
  const actDocs    = await getCachedActivities(guild.id);
  const actMap     = {};
  actDocs.forEach(a => { actMap[a.userId] = a; });
  const guildLive  = liveMessages.get(guild.id) || new Map();

  const generalCh = config.generalChannelId ? `<#${config.generalChannelId}>` : "*Not set*";

  if (!members.size) {
    return new EmbedBuilder()
      .setColor(role.color || 0x5865f2)
      .setTitle(`${role.name} — Activity Tracker`)
      .setDescription("No members currently hold this as their highest staff role.")
      .addFields({ name: "💬 Counting in", value: generalCh })
      .setFooter({ text: "Empiria Tracker • Resets daily at midnight" })
      .setTimestamp();
  }

  const sorted = [...members.values()].sort((a, b) => {
    const am = (actMap[a.id]?.todayMessages || 0) + (guildLive.get(a.id) || 0);
    const bm = (actMap[b.id]?.todayMessages || 0) + (guildLive.get(b.id) || 0);
    if (bm !== am) return bm - am;
    return liveOnlineSeconds(actMap[b.id]) - liveOnlineSeconds(actMap[a.id]);
  });

  const lines = sorted.map((member, i) => {
    const act      = actMap[member.id] || {};
    const msgs     = (act.todayMessages || 0) + (guildLive.get(member.id) || 0);
    const total    = act.totalMessages || 0;
    const online   = liveOnlineSeconds(act);
    const status   = act.currentStatus || "offline";
    const failDays = act.consecutiveFailDays || 0;
    const metReq   = msgs >= minDailyMsgs;
    const medal    = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `**${i + 1}.**`;

    const warnBar = failDays > 0
      ? ` ⚠️ **${failDays}/${failThreshold}** fail day${failDays > 1 ? "s" : ""}`
      : "";
    const reqIcon = metReq ? "✅" : "❌";

    return (
      `${medal} ${statusDot(status)} **${member.displayName}**${warnBar}\n` +
      `> 💬 Today: **${msgs}** ${reqIcon}  *(min: ${minDailyMsgs})*  |  📈 All-time: **${total.toLocaleString()}**\n` +
      `> ⏱️ Online: **${fmtTime(online)}**  |  📝 Last msg: **${sinceStr(act.lastMessage)}**`
    );
  });

  const MAX   = 8;
  const shown = lines.slice(0, MAX);
  const extra = lines.length > MAX ? `\n\n*...and ${lines.length - MAX} more members*` : "";
  const nowTs = Math.floor(Date.now() / 1000);

  return new EmbedBuilder()
    .setColor(role.color || 0x5865f2)
    .setTitle(`${statusDot("online")} ${role.name} — Live Activity Board`)
    .setDescription(shown.join("\n\n") + extra)
    .addFields(
      { name: "💬 Counted in",  value: generalCh,               inline: true },
      { name: "👥 Members",     value: `${members.size}`,        inline: true },
      { name: "📊 Daily min",   value: `${minDailyMsgs} msgs`,   inline: true },
      { name: "🔄 Updated",     value: `<t:${nowTs}:R>`,         inline: true },
      { name: "⚠️ Fail limit", value: `${failThreshold} days`,  inline: true },
      { name: "📅 Resets",      value: "Daily at midnight",      inline: true }
    )
    .setFooter({ text: "Empiria Mod Tracker • discord.gg/ecz" })
    .setTimestamp();
}

// ── Warm the message cache for a guild on startup ────────────────────────────
// Finds existing bot messages in each role channel so restarts don't duplicate

async function warmMsgCache(client, guild, config) {
  for (const rc of (config.roleChannels || [])) {
    const ch = guild.channels.cache.get(rc.channelId);
    if (!ch) continue;
    const cacheKey = `${guild.id}-${rc.roleId}`;
    if (msgCache.has(cacheKey)) continue;
    if (rc.messageId) {
      try {
        const msg = await ch.messages.fetch(rc.messageId);
        msgCache.set(cacheKey, msg);
        continue;
      } catch (_) {}
    }
    // Scan last 20 msgs for a bot message to reclaim
    try {
      const recent = await ch.messages.fetch({ limit: 20 });
      const botMsg = recent.find(m => m.author.id === client.user.id);
      if (botMsg) {
        msgCache.set(cacheKey, botMsg);
        await ModTracker.updateOne(
          { guildId: guild.id, "roleChannels.roleId": rc.roleId },
          { $set: { "roleChannels.$.messageId": botMsg.id } }
        );
        rc.messageId = botMsg.id;
      }
    } catch (_) {}
  }
}

// ── Post or EDIT single role embed ────────────────────────────────────────────
// Strategy: always EDIT (no notification spam). Only delete+resend if the
// message has been deleted — in that case we purge all stale bot messages
// from the channel first so there's never more than 1 board per slot.

async function updateRoleChannel(client, guild, roleCfg, config) {
  try {
    const role    = guild.roles.cache.get(roleCfg.roleId);
    const channel = guild.channels.cache.get(roleCfg.channelId);
    if (!role || !channel) return;

    const embed    = await buildRoleEmbed(guild, role, config);
    const cacheKey = `${guild.id}-${roleCfg.roleId}`;

    // ① Fastest — edit in-memory cached message
    const cached = msgCache.get(cacheKey);
    if (cached) {
      try {
        await cached.edit({ embeds: [embed] });
        return;
      } catch (_) {
        msgCache.delete(cacheKey);
      }
    }

    // ② Fetch by saved messageId and edit
    if (roleCfg.messageId) {
      try {
        const msg = await channel.messages.fetch(roleCfg.messageId);
        await msg.edit({ embeds: [embed] });
        msgCache.set(cacheKey, msg);
        return;
      } catch (_) {
        // Message gone — fall through to clean send
      }
    }

    // ③ Message lost — delete ALL stale bot messages in this channel first,
    //    then send exactly ONE fresh message so there's never any duplicates.
    try {
      const recent  = await channel.messages.fetch({ limit: 50 });
      const botMsgs = recent.filter(m => m.author.id === client.user.id);
      for (const [, m] of botMsgs) await m.delete().catch(() => {});
    } catch (_) {}

    const sent = await channel.send({ embeds: [embed] });
    msgCache.set(cacheKey, sent);

    await ModTracker.updateOne(
      { guildId: guild.id, "roleChannels.roleId": roleCfg.roleId },
      { $set: { "roleChannels.$.messageId": sent.id } }
    );
    roleCfg.messageId = sent.id;

  } catch (err) {
    console.error("[ModTracker] updateRoleChannel:", err.message);
  }
}

// ── Offline backfill ──────────────────────────────────────────────────────────
// When the bot comes back online, fetch Discord message history from the general
// channel to count any messages we missed while offline. Uses the stored
// lastSeenMessageId as a cursor so we never double-count.

async function backfillMessages(client) {
  console.log("[ModTracker] Running offline message backfill...");
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  for (const [, guild] of client.guilds.cache) {
    try {
      const config = await ModTracker.findOne({ guildId: guild.id });
      if (!config?.generalChannelId) continue;

      const channel = guild.channels.cache.get(config.generalChannelId);
      if (!channel) continue;

      await guild.members.fetch().catch(() => {});

      // Warm the msg cache while we're here
      await warmMsgCache(client, guild, config);

      const lastSeenId = config.lastSeenMessageId;
      const msgCounts  = {}; // userId → count
      let   before     = null;
      let   done       = false;
      let   latestId   = null;

      while (!done) {
        const opts = { limit: 100 };
        if (before) opts.before = before;
        const messages = await channel.messages.fetch(opts).catch(() => null);
        if (!messages?.size) break;

        for (const [id, msg] of messages) {
          if (!latestId) latestId = id; // first batch = newest messages
          if (msg.author.bot) continue;
          if (msg.createdAt < todayStart) { done = true; break; }
          if (lastSeenId && id <= lastSeenId) { done = true; break; }

          const member = guild.members.cache.get(msg.author.id);
          if (!member) continue;
          const isStaff = config.staffRoleIds.some(rid => member.roles.cache.has(rid));
          if (isStaff) msgCounts[msg.author.id] = (msgCounts[msg.author.id] || 0) + 1;
        }

        if (!done) {
          const oldest = messages.last();
          before = oldest.id;
          if (messages.size < 100) done = true;
        }
      }

      // Apply backfilled counts to DB
      for (const [userId, count] of Object.entries(msgCounts)) {
        await ModActivity.findOneAndUpdate(
          { guildId: guild.id, userId },
          {
            $inc: { todayMessages: count, totalMessages: count },
            $set: { lastMessage: new Date(), guildId: guild.id, userId },
          },
          { upsert: true }
        );
      }

      // Persist cursor for next startup
      if (latestId) {
        await ModTracker.updateOne({ guildId: guild.id }, { $set: { lastSeenMessageId: latestId } });
      }

      const total = Object.values(msgCounts).reduce((a, b) => a + b, 0);
      if (total > 0) console.log(`[ModTracker] Backfilled ${total} msgs for ${guild.name}`);

    } catch (err) {
      console.error("[ModTracker] backfill error:", err.message);
    }
  }
  console.log("[ModTracker] Backfill complete.");
}

// ── Refresh all channels for a guild ─────────────────────────────────────────

async function refreshGuild(client, guild) {
  try {
    const config = await getCachedConfig(guild.id);
    if (!config?.roleChannels?.length) return;
    // Process each role channel sequentially to avoid rate limit bursts
    for (const rc of config.roleChannels) {
      await updateRoleChannel(client, guild, rc, config);
    }
  } catch (err) {
    console.error("[ModTracker] refreshGuild:", err.message);
  }
}

// ── Refresh all guilds (staggered to respect rate limits) ────────────────────

let _refreshBusy = false;
async function refreshAll(client) {
  if (_refreshBusy) return; // skip if previous refresh is still running
  _refreshBusy = true;
  try {
    for (const [, guild] of client.guilds.cache) {
      await refreshGuild(client, guild);
    }
  } finally {
    _refreshBusy = false;
  }
}

// ── Trigger demotion confirmation in Staff Chat ───────────────────────────────

async function triggerDemotionConfirmation(client, guild, config, member, activity) {
  if (!config.staffChatChannelId) return;
  const staffChat = guild.channels.cache.get(config.staffChatChannelId);
  if (!staffChat) return;

  const staffRoleIds = config.staffRoleIds || [];
  const currentRole  = getHighestStaffRole(member, staffRoleIds);
  if (!currentRole) return;

  const currentIndex = staffRoleIds.indexOf(currentRole.id);
  const targetRoleId = currentIndex < staffRoleIds.length - 1
    ? staffRoleIds[currentIndex + 1]
    : null;
  const targetRole = targetRoleId ? guild.roles.cache.get(targetRoleId) : null;

  await PendingDemotion.updateMany(
    { guildId: guild.id, userId: member.id, status: "pending" },
    { $set: { status: "expired" } }
  );

  const pending = await PendingDemotion.create({
    guildId:       guild.id,
    userId:        member.id,
    currentRoleId: currentRole.id,
    targetRoleId:  targetRoleId || null,
  });

  const pings = (config.confirmationRoleIds || [])
    .map(id => `<@&${id}>`)
    .join(" ");

  const embed = new EmbedBuilder()
    .setColor(0xff4444)
    .setTitle("⚠️ Staff Demotion Confirmation Required")
    .setDescription(
      `${member} has failed the **${config.minDailyMessages} message minimum** for **${activity.consecutiveFailDays} consecutive days**.\n\n` +
      `**Proposed action:** ${currentRole} → ${targetRole ? targetRole.toString() : "**Member** (all staff roles removed)"}\n\n` +
      `Only <@&${(config.confirmationRoleIds?.[0] || "staff")}> and above can approve or cancel.`
    )
    .addFields(
      { name: "👤 Staff Member",   value: `${member} (${member.user.tag})`, inline: true },
      { name: "🛡️ Current Role",  value: `${currentRole}`,                 inline: true },
      { name: "⬇️ Demote To",     value: targetRole ? `${targetRole}` : "Member", inline: true },
      { name: "💬 Messages Today", value: `${activity.todayMessages || 0}`, inline: true },
      { name: "📅 Fail Days",      value: `${activity.consecutiveFailDays}/${config.failDaysThreshold}`, inline: true },
      { name: "⏳ Expires In",     value: "48 hours",                       inline: true }
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: `Pending ID: ${pending._id} • Empiria Mod Tracker` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`demotion_confirm_${pending._id}`)
      .setLabel("✅ Confirm Demotion")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`demotion_cancel_${pending._id}`)
      .setLabel("❌ Stop / Cancel")
      .setStyle(ButtonStyle.Success)
  );

  const content = pings ? `${pings} — Staff demotion requires your approval!` : undefined;
  const sent = await staffChat.send({ content, embeds: [embed], components: [row] });

  await PendingDemotion.findByIdAndUpdate(pending._id, {
    channelId: staffChat.id,
    messageId: sent.id,
  });

  activity.pendingDemotion = true;
  await activity.save();
}

// ── Midnight reset + demotion check ──────────────────────────────────────────

async function doMidnightReset(client) {
  console.log("[ModTracker] Running midnight reset...");
  const today = todayStr();

  for (const [, guild] of client.guilds.cache) {
    try {
      const config = await ModTracker.findOne({ guildId: guild.id });
      if (!config) continue;

      await guild.members.fetch().catch(() => {});
      const docs = await ModActivity.find({ guildId: guild.id });

      const summaryLines = [];

      for (const doc of docs) {
        const member = guild.members.cache.get(doc.userId);

        let sessionBonus = 0;
        if (doc.sessionStart && doc.currentStatus !== "offline") {
          sessionBonus = Math.floor((Date.now() - new Date(doc.sessionStart).getTime()) / 1000);
          doc.todayOnlineSeconds += sessionBonus;
          doc.totalOnlineSeconds += sessionBonus;
          doc.sessionStart = doc.currentStatus !== "offline" ? new Date() : null;
        }

        const todayMsgs     = doc.todayMessages || 0;
        const todayOnline   = doc.todayOnlineSeconds || 0;
        const metRequirement = todayMsgs >= (config.minDailyMessages || 250);

        doc.dailyHistory = [
          ...(doc.dailyHistory || []),
          { date: today, messages: todayMsgs, onlineSeconds: todayOnline, metRequirement }
        ].slice(-30);

        if (config.demotionEnabled && member) {
          const isStaff = config.staffRoleIds.some(id => member.roles.cache.has(id));
          if (isStaff) {
            if (!metRequirement) {
              doc.consecutiveFailDays = (doc.consecutiveFailDays || 0) + 1;
              if (
                doc.consecutiveFailDays >= config.failDaysThreshold &&
                !doc.pendingDemotion
              ) {
                await triggerDemotionConfirmation(client, guild, config, member, doc);
              }
            } else {
              doc.consecutiveFailDays = 0;
            }
          }
        }

        if (todayMsgs > 0 || todayOnline > 0) {
          const name = member?.displayName || `<@${doc.userId}>`;
          const icon = metRequirement ? "✅" : "❌";
          summaryLines.push(
            `${icon} **${name}** — 💬 ${todayMsgs}/${config.minDailyMessages || 250} msgs | ⏱️ ${fmtTime(todayOnline)}`
          );
        }

        doc.todayMessages      = 0;
        doc.todayOnlineSeconds = 0;
        doc.lastReset          = new Date();
        await doc.save();
      }

      if (config.historyChannelId && summaryLines.length) {
        const histCh = guild.channels.cache.get(config.historyChannelId);
        if (histCh) {
          await histCh.send({
            embeds: [
              new EmbedBuilder()
                .setColor(0x5865f2)
                .setTitle(`📅 Daily Activity Summary — ${today}`)
                .setDescription(summaryLines.join("\n"))
                .addFields(
                  { name: "📊 Daily Minimum",   value: `${config.minDailyMessages || 250} messages`, inline: true },
                  { name: "✅ Met Requirement", value: `${summaryLines.filter(l => l.startsWith("✅")).length}`, inline: true },
                  { name: "❌ Failed",           value: `${summaryLines.filter(l => l.startsWith("❌")).length}`, inline: true }
                )
                .setFooter({ text: "Empiria Mod Tracker • Daily Reset" })
                .setTimestamp()
            ]
          }).catch(() => {});
        }
      }

      // Clear message cache for this guild so boards refresh fresh after reset
      for (const [key] of msgCache) {
        if (key.startsWith(guild.id)) msgCache.delete(key);
      }
      await refreshGuild(client, guild);

    } catch (err) {
      console.error("[ModTracker] reset error:", err.message);
    }
  }

  scheduleMidnightReset(client);
}

// ── Schedule next midnight reset ──────────────────────────────────────────────

function scheduleMidnightReset(client) {
  const now      = new Date();
  const midnight = new Date(now);
  midnight.setDate(midnight.getDate() + 1);
  midnight.setHours(0, 0, 5, 0);
  const msUntil = midnight.getTime() - now.getTime();
  setTimeout(() => doMidnightReset(client), msUntil);
  console.log(`[ModTracker] Next daily reset in ${Math.round(msUntil / 3600000)}h`);
}

// ── Member stats embed ────────────────────────────────────────────────────────

async function buildMemberStatsEmbed(guild, member, config) {
  const act          = await ModActivity.findOne({ guildId: guild.id, userId: member.id });
  const staffRoleIds = config?.staffRoleIds || [];
  const highestRole  = getHighestStaffRole(member, staffRoleIds);
  const generalCh    = config?.generalChannelId ? `<#${config.generalChannelId}>` : "*Not set*";
  const minReq       = config?.minDailyMessages || 250;
  const failThresh   = config?.failDaysThreshold || 3;

  const todayMsgs   = act?.todayMessages      || 0;
  const totalMsgs   = act?.totalMessages      || 0;
  const todayOnline = act ? liveOnlineSeconds(act) : 0;
  const totalOnline = (act?.totalOnlineSeconds || 0) +
    (act?.sessionStart && act?.currentStatus !== "offline"
      ? Math.floor((Date.now() - new Date(act.sessionStart).getTime()) / 1000) : 0);
  const status      = act?.currentStatus || "offline";
  const failDays    = act?.consecutiveFailDays || 0;
  const metToday    = todayMsgs >= minReq;

  const lastSeen = act?.lastSeen
    ? `<t:${Math.floor(new Date(act.lastSeen).getTime() / 1000)}:R>` : "Never";
  const lastMsg = act?.lastMessage
    ? `<t:${Math.floor(new Date(act.lastMessage).getTime() / 1000)}:R>` : "Never";

  const history   = (act?.dailyHistory || []).slice(-7).reverse();
  const histLines = history.length
    ? history.map(d => {
        const icon = d.metRequirement ? "✅" : "❌";
        return `${icon} \`${d.date}\` — 💬 **${d.messages}** | ⏱️ ${fmtTime(d.onlineSeconds)}`;
      }).join("\n")
    : "No history yet.";

  const warnField = failDays > 0
    ? `⚠️ **${failDays}/${failThresh}** consecutive fail days${act?.pendingDemotion ? " *(demotion pending confirmation)*" : ""}`
    : "✅ No active warnings";

  return new EmbedBuilder()
    .setColor(member.displayHexColor !== "#000000" ? member.displayHexColor : 0x5865f2)
    .setAuthor({
      name:    `${member.displayName} — Activity Report`,
      iconURL: member.user.displayAvatarURL({ dynamic: true })
    })
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .addFields(
      { name: "📶 Status",          value: `${statusDot(status)} ${statusLabel(status)}`, inline: true },
      { name: "🛡️ Staff Role",     value: highestRole ? `${highestRole}` : "None",         inline: true },
      { name: "⚠️ Demotion Risk",  value: warnField,                                       inline: false },

      { name: "💬 Messages Today",  value: `${todayMsgs} ${metToday ? "✅" : "❌"} *(min: ${minReq})*`, inline: true },
      { name: "📈 All-time Msgs",   value: totalMsgs.toLocaleString(), inline: true },
      { name: "‎",                  value: "‎", inline: true },

      { name: "⏱️ Online Today",   value: fmtTime(todayOnline),  inline: true },
      { name: "⏱️ Total Online",   value: fmtTime(totalOnline),  inline: true },
      { name: "‎",                  value: "‎", inline: true },

      { name: "📝 Last Message",    value: lastMsg,  inline: true },
      { name: "👁️ Last Seen",      value: lastSeen, inline: true },
      { name: "💬 Tracked In",     value: generalCh, inline: true },

      { name: "📅 Last 7 Days",    value: histLines }
    )
    .setFooter({ text: "Empiria Mod Tracker • discord.gg/ecz" })
    .setTimestamp();
}

module.exports = {
  refreshAll,
  refreshGuild,
  updateRoleChannel,
  scheduleMidnightReset,
  doMidnightReset,
  backfillMessages,
  warmMsgCache,
  buildMemberStatsEmbed,
  getHighestStaffRole,
  fmtTime,
  statusDot,
  statusLabel,
  liveOnlineSeconds,
  trackLiveMessage,
  invalidateGuildCache,
  getCachedConfig,
};
