/**
 * Roleplay / Fun action commands — uses waifu.pics free API for GIFs
 * Commands: kiss, hug, slap, punch, pat, poke, bite, cuddle, kick, cry,
 *           wave, wink, blush, lick, bonk, yeet, glomp, highfive, dance
 */
const { EmbedBuilder } = require("discord.js");

// ── waifu.pics free API ───────────────────────────────────────────────────────
const WAIFU_BASE = "https://api.waifu.pics/sfw";

// Map: commandName → { apiType, color, verb, targetRequired }
const ACTIONS = {
  kiss:      { type: "kiss",      color: 0xff6b9d, verb: "kisses",     target: true  },
  hug:       { type: "hug",       color: 0xffa07a, verb: "hugs",       target: true  },
  slap:      { type: "slap",      color: 0xff4444, verb: "slaps",       target: true  },
  punch:     { type: "slap",      color: 0xff2222, verb: "punches",     target: true  },
  pat:       { type: "pat",       color: 0x98fb98, verb: "pats",        target: true  },
  poke:      { type: "poke",      color: 0x87ceeb, verb: "pokes",       target: true  },
  bite:      { type: "bite",      color: 0x9b59b6, verb: "bites",       target: true  },
  cuddle:    { type: "cuddle",    color: 0xffb6c1, verb: "cuddles",     target: true  },
  kick:      { type: "kick",      color: 0xe74c3c, verb: "kicks",       target: true  },
  lick:      { type: "lick",      color: 0x2ecc71, verb: "licks",       target: true  },
  bonk:      { type: "bonk",      color: 0xf39c12, verb: "bonks",       target: true  },
  yeet:      { type: "yeet",      color: 0x1abc9c, verb: "yeets",       target: true  },
  glomp:     { type: "glomp",     color: 0x3498db, verb: "glomps",      target: true  },
  highfive:  { type: "highfive",  color: 0xf1c40f, verb: "high-fives",  target: true  },
  wave:      { type: "wave",      color: 0x5dade2, verb: "waves at",    target: true  },
  wink:      { type: "wink",      color: 0xe8daef, verb: "winks at",    target: false },
  blush:     { type: "blush",     color: 0xff69b4, verb: "blushes at",  target: false },
  cry:       { type: "cry",       color: 0x7fb3d3, verb: "cries",       target: false },
  dance:     { type: "dance",     color: 0xa569bd, verb: "dances",      target: false },
  smug:      { type: "smug",      color: 0x5dade2, verb: "looks smug",  target: false },
};

async function fetchGif(type) {
  try {
    const res  = await fetch(`${WAIFU_BASE}/${type}`);
    const json = await res.json();
    return json.url || null;
  } catch {
    return null;
  }
}

function makeCommand(name, cfg) {
  return {
    name,
    aliases: [],
    description: `${cfg.verb.charAt(0).toUpperCase() + cfg.verb.slice(1).replace("s","")}-related fun command with GIF`,

    async execute(message, args, client) {
      try {
        const target = message.mentions.users.first();

        if (cfg.target && !target) {
          return message.reply(`❌ Mention someone to ${name}! e.g. \`$${name} @user\``);
        }
        if (target?.id === message.author.id) {
          return message.reply(`😅 You can't ${name} yourself!`);
        }

        const gifUrl = await fetchGif(cfg.type);
        const author = message.member?.displayName || message.author.username;
        const tgt    = target ? (message.guild?.members.cache.get(target.id)?.displayName || target.username) : null;

        const title = tgt
          ? `💫 ${author} ${cfg.verb} ${tgt}!`
          : `💫 ${author} ${cfg.verb}!`;

        const embed = new EmbedBuilder()
          .setTitle(title)
          .setColor(cfg.color)
          .setFooter({ text: `Empiria Fun System • Powered by waifu.pics` })
          .setTimestamp();

        if (gifUrl) embed.setImage(gifUrl);
        else embed.setDescription("*(GIF unavailable — try again in a moment)*");

        return message.reply({ embeds: [embed] });
      } catch (err) {
        console.error(`[roleplay:${name}] Error:`, err.message);
        return message.reply("❌ Something went wrong. Try again in a moment.");
      }
    },
  };
}

// Export all commands as an array
module.exports.commands = Object.entries(ACTIONS).map(([name, cfg]) => makeCommand(name, cfg));
