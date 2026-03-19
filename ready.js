const { ActivityType } = require("discord.js");

module.exports = {
  name: "ready",
  once: true,
  execute(client) {
    console.log(`🤖 Empiria v2 online as ${client.user.tag}`);
    console.log("------------------------------------------");
    console.log("The bot is now fully connected to Discord!");
    console.log("------------------------------------------");

    // Start Giveaway End Checker
    require("../giveaways/end")(client);

    // ─── Mod Activity Tracker ───────────────────────────────────────────────
    const { refreshAll, scheduleMidnightReset, backfillMessages } = require("../utils/modTracker");

    // Backfill any messages missed while the bot was offline (runs once on boot)
    setTimeout(() => backfillMessages(client).catch(e =>
      console.error("[ready] backfill error:", e.message)
    ), 5_000);

    // Live board refresh every 1 second (edit-in-place, no notification spam)
    // refreshAll has a built-in _refreshBusy guard against overlapping runs
    // DB queries are cached (5s for activity, 30s for config) so this is efficient
    setTimeout(() => {
      refreshAll(client);
      setInterval(() => refreshAll(client), 1_000);
    }, 12_000);

    // Schedule daily midnight reset
    scheduleMidnightReset(client);

    // ─── Rotating Status ───────────────────────────────────────────────────
    const statuses = [
      { text: "discord.gg/ecz",                  type: ActivityType.Watching  },
      { text: "discord.gg/ecz",                  type: ActivityType.Watching  },
      { text: "discord.gg/ecz",                  type: ActivityType.Watching  },
      { text: "Join our server: discord.gg/ecz", type: ActivityType.Playing   },
      { text: "Join our server: discord.gg/ecz", type: ActivityType.Playing   },
      { text: "Bot prefix: $",                   type: ActivityType.Listening },
      { text: "Bot prefix: $",                   type: ActivityType.Listening },
      { text: "$help for commands",              type: ActivityType.Playing   },
      { text: "Empiria v2 | discord.gg/ecz",    type: ActivityType.Playing   },
      { text: "Economy | Farm | Moderation",     type: ActivityType.Watching  },
      { text: "Protecting your server 🛡️",      type: ActivityType.Watching  },
      { text: "discord.gg/ecz",                  type: ActivityType.Watching  },
      { text: "245+ commands loaded",            type: ActivityType.Playing   },
      { text: "Farm 🌾 | Pets 🐾 | Gov 🏛️",    type: ActivityType.Playing   },
      { text: "discord.gg/ecz",                  type: ActivityType.Watching  },
    ];

    let index = 0;
    const setStatus = () => {
      const s = statuses[index % statuses.length];
      client.user.setPresence({
        activities: [{ name: s.text, type: s.type }],
        status: "online",
      });
      index++;
    };

    setStatus();
    setInterval(setStatus, 20_000);
  },
};
