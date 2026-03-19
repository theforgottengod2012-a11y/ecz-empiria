const { EmbedBuilder } = require("discord.js");
const User = require("../../database/models/User");

const JOBS = {
  // ── Entry Level (1-3) ───────────────────────────────────────────────────────
  waiter:       { salary: 600,   minLevel: 1,  emoji: "🍽️",  desc: "Serve restaurant customers" },
  cashier:      { salary: 700,   minLevel: 1,  emoji: "💳",  desc: "Handle transactions" },
  gardener:     { salary: 950,   minLevel: 3,  emoji: "🌸",  desc: "Tend gardens" },
  barista:      { salary: 800,   minLevel: 2,  emoji: "☕",  desc: "Make coffee" },
  fisherman:    { salary: 900,   minLevel: 2,  emoji: "🎣",  desc: "Catch fish" },

  // ── Skilled (4-7) ───────────────────────────────────────────────────────────
  farmer:       { salary: 1_100, minLevel: 4,  emoji: "👨‍🌾", desc: "Grow crops" },
  baker:        { salary: 1_200, minLevel: 4,  emoji: "🍞",  desc: "Bake bread" },
  tailor:       { salary: 1_100, minLevel: 4,  emoji: "👗",  desc: "Sew clothing" },
  artist:       { salary: 1_000, minLevel: 4,  emoji: "🎨",  desc: "Create masterpieces" },
  chef:         { salary: 800,   minLevel: 3,  emoji: "👨‍🍳", desc: "Cook delicious meals" },
  miner:        { salary: 500,   minLevel: 1,  emoji: "⛏️",  desc: "Mine valuable ores" },
  mechanic:     { salary: 1_700, minLevel: 6,  emoji: "🔩",  desc: "Fix vehicles" },
  carpenter:    { salary: 1_600, minLevel: 5,  emoji: "🪵",  desc: "Build with wood" },
  security:     { salary: 1_400, minLevel: 5,  emoji: "🛡️",  desc: "Protect people" },
  butcher:      { salary: 1_300, minLevel: 5,  emoji: "🥩",  desc: "Process meat" },
  photographer: { salary: 1_300, minLevel: 6,  emoji: "📸",  desc: "Take photos" },
  salesman:     { salary: 1_500, minLevel: 6,  emoji: "🤝",  desc: "Sell products" },
  blacksmith:   { salary: 1_500, minLevel: 6,  emoji: "⚒️",  desc: "Forge metal" },
  trainer:      { salary: 1_600, minLevel: 7,  emoji: "💪",  desc: "Train people" },
  plumber:      { salary: 1_900, minLevel: 7,  emoji: "🔧",  desc: "Fix water systems" },
  teacher:      { salary: 1_500, minLevel: 7,  emoji: "👨‍🏫", desc: "Educate the masses" },

  // ── Professional (8-12) ────────────────────────────────────────────────────
  journalist:   { salary: 1_800, minLevel: 8,  emoji: "📰",  desc: "Report the news" },
  musician:     { salary: 2_000, minLevel: 8,  emoji: "🎵",  desc: "Play music" },
  coach:        { salary: 1_800, minLevel: 8,  emoji: "🏆",  desc: "Coach sports teams" },
  electrician:  { salary: 2_100, minLevel: 8,  emoji: "⚡",  desc: "Fix electrical systems" },
  firefighter:  { salary: 2_100, minLevel: 9,  emoji: "🚒",  desc: "Fight fires" },
  marketer:     { salary: 2_000, minLevel: 9,  emoji: "📢",  desc: "Market products" },
  engineer:     { salary: 2_200, minLevel: 9,  emoji: "👷",  desc: "Build infrastructure" },
  manager:      { salary: 2_200, minLevel: 10, emoji: "📋",  desc: "Manage teams" },
  accountant:   { salary: 2_400, minLevel: 10, emoji: "📊",  desc: "Handle finances" },
  programmer:   { salary: 1_200, minLevel: 5,  emoji: "💻",  desc: "Code software" },
  nurse:        { salary: 2_300, minLevel: 10, emoji: "💉",  desc: "Care for patients" },
  jeweler:      { salary: 2_300, minLevel: 10, emoji: "💎",  desc: "Craft jewelry" },
  consultant:   { salary: 2_500, minLevel: 11, emoji: "💼",  desc: "Give expert advice" },
  banker:       { salary: 2_700, minLevel: 11, emoji: "🏦",  desc: "Manage banks" },
  veterinarian: { salary: 2_600, minLevel: 11, emoji: "🐾",  desc: "Treat animals" },
  scientist:    { salary: 2_800, minLevel: 11, emoji: "🔬",  desc: "Conduct research" },
  detective:    { salary: 2_600, minLevel: 12, emoji: "🔍",  desc: "Solve crimes" },
  psychologist: { salary: 2_900, minLevel: 12, emoji: "🧠",  desc: "Counsel clients" },
  realtor:      { salary: 3_100, minLevel: 12, emoji: "🏠",  desc: "Sell properties" },
  lawyer:       { salary: 3_000, minLevel: 12, emoji: "⚖️",  desc: "Practice law" },
  knight:       { salary: 2_800, minLevel: 13, emoji: "⚔️",  desc: "Fight for honor" },
  dentist:      { salary: 3_200, minLevel: 13, emoji: "🦷",  desc: "Fix teeth" },

  // ── Expert (15-30) ────────────────────────────────────────────────────────
  athlete:      { salary: 3_500, minLevel: 15, emoji: "🏃",  desc: "Play professional sports" },
  alchemist:    { salary: 3_000, minLevel: 16, emoji: "🧪",  desc: "Brew potions" },
  doctor:       { salary: 2_500, minLevel: 10, emoji: "⚕️",  desc: "Save lives" },
  hacker:       { salary: 2_000, minLevel: 8,  emoji: "💀",  desc: "Exploit systems" },
  thief:        { salary: 2_000, minLevel: 8,  emoji: "🗝️",  desc: "Steal valuables" },
  pilot:        { salary: 4_000, minLevel: 20, emoji: "✈️",  desc: "Fly planes" },
  ceo:          { salary: 5_000, minLevel: 25, emoji: "👔",  desc: "Run a company" },
  astronaut:    { salary: 6_000, minLevel: 30, emoji: "🚀",  desc: "Explore space" },
};

module.exports = {
  name: "jobs",
  aliases: ["job", "applyjob", "career"],
  description: "View available jobs and apply for one. Usage: $jobs [jobname]",

  async execute(message, args) {
    const choice = args[0]?.toLowerCase();

    // ── Show job list ─────────────────────────────────────────────────────────
    if (!choice) {
      const tiers = [
        { label: "🟢 Entry Level (Lv 1-3)",     keys: ["waiter","cashier","gardener","barista","fisherman","miner","chef"] },
        { label: "🔵 Skilled (Lv 4-7)",          keys: ["farmer","baker","tailor","artist","mechanic","carpenter","security","butcher","photographer","salesman","blacksmith","trainer","plumber","teacher"] },
        { label: "🟣 Professional (Lv 8-14)",    keys: ["journalist","musician","coach","electrician","firefighter","marketer","engineer","manager","accountant","programmer","nurse","jeweler","consultant","banker","veterinarian","scientist","detective","psychologist","realtor","lawyer","knight","dentist","doctor","hacker","thief"] },
        { label: "🔴 Expert (Lv 15+)",           keys: ["athlete","alchemist","pilot","ceo","astronaut"] },
      ];

      const embed = new EmbedBuilder()
        .setTitle("💼 Career Board")
        .setColor(0x3498db)
        .setDescription(`**${Object.keys(JOBS).length} jobs available** — use \`$jobs <jobname>\` to apply`)
        .setFooter({ text: "Tip: Better jobs earn more per $work shift!" });

      for (const tier of tiers) {
        const lines = tier.keys
          .filter(k => JOBS[k])
          .map(k => `${JOBS[k].emoji} \`${k}\` Lv${JOBS[k].minLevel}+ — $${JOBS[k].salary.toLocaleString()}/shift`)
          .join("\n");
        embed.addFields({ name: tier.label, value: lines || "—", inline: false });
      }

      return message.reply({ embeds: [embed] });
    }

    // ── Apply for job ─────────────────────────────────────────────────────────
    const jobData = JOBS[choice];
    if (!jobData) {
      return message.reply(`❌ Job \`${choice}\` doesn't exist. Use \`$jobs\` to see the full list.`);
    }

    const user = await User.findOne({ userId: message.author.id })
      || new User({ userId: message.author.id });

    if (user.level < jobData.minLevel) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xff4444)
          .setDescription(
            `❌ You need **Level ${jobData.minLevel}** for this job.\n` +
            `You are currently **Level ${user.level}**. Earn XP with \`$work\`, \`$daily\`, and other commands!`
          )]
      });
    }

    const oldJob = user.job;
    user.job = choice;
    await user.save();

    return message.reply({
      embeds: [new EmbedBuilder()
        .setTitle("✅ Job Applied!")
        .setColor(0x57f287)
        .setDescription(
          oldJob
            ? `You quit **${oldJob}** and are now a **${jobData.emoji} ${choice.charAt(0).toUpperCase() + choice.slice(1)}**!`
            : `You are now working as a **${jobData.emoji} ${choice.charAt(0).toUpperCase() + choice.slice(1)}**!`
        )
        .addFields(
          { name: "💰 Salary",   value: `$${jobData.salary.toLocaleString()}/shift`, inline: true },
          { name: "📊 Req Level",value: `Level ${jobData.minLevel}`,                 inline: true },
          { name: "💡 Tip",      value: "Use `$work` every 30 min to earn your salary!", inline: false }
        )]
    });
  },
};
