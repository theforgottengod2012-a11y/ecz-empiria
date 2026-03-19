const Giveaway = require("../database/models/Giveaway");
const { pickWeighted } = require("../utils/weightedRandom");

module.exports = async client => {
  setInterval(async () => {
    try {
      const giveaways = await Giveaway.find({
        ended: false,
        endsAt: { $lte: Date.now() }
      });

      for (const g of giveaways) {
        try {
          const channel = await client.channels.fetch(g.channelId).catch(() => null);
          if (!channel) {
            g.ended = true;
            await g.save();
            continue;
          }
          
          const msg = await channel.messages.fetch(g.messageId).catch(() => null);

          let winners = [];
          if (g.entries.length > 0) {
            const entryPool = g.entries.map(id => ({ id, weight: 1 }));
            for (let i = 0; i < Math.min(g.winners, g.entries.length); i++) {
              const winnerId = pickWeighted(entryPool);
              if (winnerId && !winners.includes(`<@${winnerId}>`)) {
                winners.push(`<@${winnerId}>`);
              }
            }
          }

          if (winners.length > 0) {
            await channel.send(
              `🎉 **GIVEAWAY ENDED!**\nPrize: **${g.prize}**\nWinners: ${winners.join(", ")}`
            );
          } else {
            await channel.send(`❌ **GIVEAWAY ENDED!**\nPrize: **${g.prize}**\nNo valid entries.`);
          }

          try {
            await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
              SendMessages: false
            });
          } catch (e) {}

          g.ended = true;
          await g.save();
        } catch (err) {
          console.error("Error ending giveaway:", err);
          g.ended = true;
          await g.save();
        }
      }
    } catch (err) {
      console.error("Database error in end-giveaway interval:", err);
    }
  }, 5000);
};
