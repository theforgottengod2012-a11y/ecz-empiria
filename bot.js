require("dotenv").config();
const client    = require("./src/client");
const connectDB = require("./src/database/connect");

const OWNER_ID = process.env.BOT_OWNER_ID || "1359147702088237076";

async function start() {
  if (!process.env.MONGO_URI) {
    console.warn("⚠️  MONGO_URI not set — database features disabled.");
  } else {
    await connectDB();
  }

  if (!process.env.TOKEN) {
    console.error("❌  TOKEN not set — cannot start bot.");
    process.exit(1);
  }

  await client.login(process.env.TOKEN);

  // ── IPC: Report stats to parent (routes.ts) ────────────────────────────────
  if (process.send) {
    const reportStats = () => {
      if (!client.isReady()) return;
      const guildList = client.guilds.cache.map((g) => ({
        id:          g.id,
        name:        g.name,
        iconURL:     g.iconURL({ size: 64 }) || null,
        memberCount: g.memberCount,
        channels:    g.channels.cache
          .filter((c) => c.type === 0 || c.type === 5) // TextChannel / Announcement
          .map((c) => ({ id: c.id, name: c.name, type: c.type }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      })).sort((a, b) => b.memberCount - a.memberCount);

      process.send({
        type:      "stats",
        guilds:    client.guilds.cache.size,
        users:     client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0),
        commands:  (client.commands?.size || 0) + (client.slashCommands?.size || 0),
        ping:      client.ws.ping,
        uptime:    Math.floor(client.uptime / 1000),
        tag:       client.user?.tag,
        guildList,
      });
    };

    setInterval(reportStats, 10_000);
    client.once("ready", () => setTimeout(reportStats, 1500));

    // ── IPC: Handle messages from the dashboard ─────────────────────────────
    process.on("message", async (msg) => {
      if (!msg || typeof msg !== "object") return;

      // Send DM to a user
      if (msg.type === "send_dm" && msg.userId && msg.message) {
        try {
          const user = await client.users.fetch(msg.userId);
          await user.send(msg.message);
          console.log(`[IPC] DM sent to ${user.tag}`);
        } catch (err) {
          console.error(`[IPC] Failed to send DM to ${msg.userId}:`, err.message);
        }
      }

      // Send message to a server channel
      if (msg.type === "send_channel_message" && msg.channelId && msg.message) {
        try {
          const channel = await client.channels.fetch(msg.channelId);
          if (!channel || !channel.send) throw new Error("Channel not found or not a text channel.");
          await channel.send(msg.message);
          console.log(`[IPC] Message sent to channel ${msg.channelId}`);
        } catch (err) {
          console.error(`[IPC] Failed to send to channel ${msg.channelId}:`, err.message);
        }
      }
    });
  }
}

// Keep process alive and handle signals gracefully
process.on("SIGTERM", () => {
  console.log("[Bot] Received SIGTERM — shutting down gracefully...");
  client.destroy();
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("[Bot] Received SIGINT — shutting down gracefully...");
  client.destroy();
  process.exit(0);
});
process.on("unhandledRejection", (err) => {
  console.error("[Bot] Unhandled rejection:", err?.message || err);
});

start().catch((err) => {
  console.error("Bot startup error:", err);
  process.exit(1);
});
