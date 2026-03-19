const User = require("../../database/models/User");
const { getUser, addMoney, removeMoney } = require("../../utils/economy");
const { collectTax }                     = require("../../utils/governmentTax");
const { EmbedBuilder } = require("discord.js");

const CRIME_CD      = 45 * 60_000; // 45 min
const SUCCESS_RATE  = 0.60;        // 60% chance of success

const CRIMES = [
  {
    name: "Pickpocket",
    emoji: "🤚",
    successMsg: ["swiped a wallet from a tourist", "slipped a phone out of someone's pocket", "grabbed a purse in the crowd"],
    failMsg: ["got caught mid-grab and the crowd tackled you", "tried to pickpocket a cop (bad idea)", "the target turned around at the worst moment"],
    minReward: 200, maxReward: 700,
    minFine: 100,   maxFine: 400,
    injuryChance: 0.0,
  },
  {
    name: "Shoplifting",
    emoji: "🛒",
    successMsg: ["snuck out of the store with a full cart", "distracted staff and emptied a shelf", "used a fake receipt to walk out undetected"],
    failMsg: ["loss prevention tackled you at the exit", "got caught on camera and arrested", "store manager recognized you immediately"],
    minReward: 350, maxReward: 1_000,
    minFine: 200,   maxFine: 600,
    injuryChance: 0.05,
  },
  {
    name: "Car Theft",
    emoji: "🚗",
    successMsg: ["hotwired a BMW and sold it to a chop shop", "jacked a sports car and resold the parts", "stole an unattended vehicle and drove it across town"],
    failMsg: ["the GPS tracker led police right to you", "the car had a kill switch and you got arrested", "caught on a red-light camera speeding away"],
    minReward: 800, maxReward: 2_200,
    minFine: 400,   maxFine: 1_000,
    injuryChance: 0.10,
  },
  {
    name: "Bank Heist",
    emoji: "🏦",
    successMsg: ["cracked the vault before the guards arrived", "disguised as maintenance and walked out with bags of cash", "hacked the ATM network and siphoned funds"],
    failMsg: ["the dye pack exploded and you were caught blue-handed", "silent alarm triggered, police surrounded the building", "hostage negotiation didn't go as planned"],
    minReward: 1_500, maxReward: 4_000,
    minFine: 700,     maxFine: 2_000,
    injuryChance: 0.20,
  },
  {
    name: "Hacking",
    emoji: "💻",
    successMsg: ["exploited a zero-day and drained a corporate account", "social engineered a bank employee into wiring funds", "breached a crypto exchange and transferred coins"],
    failMsg: ["your VPN dropped mid-exploit and they traced you", "FBI's cyber division had already been monitoring you", "the honeypot trapped your session"],
    minReward: 1_000, maxReward: 3_000,
    minFine: 500,     maxFine: 1_500,
    injuryChance: 0.0,
  },
  {
    name: "Drug Deal",
    emoji: "💊",
    successMsg: ["sold an exclusive stash to a high-end client", "flipped a package for triple the price", "moved product through a secure underground market"],
    failMsg: ["the buyer was an undercover cop", "the deal went sideways and you barely escaped", "your supplier ratted you out"],
    minReward: 600, maxReward: 2_000,
    minFine: 300,   maxFine: 800,
    injuryChance: 0.15,
  },
];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
  name: "crime",
  aliases: ["rob2", "heist2"],
  description: "Commit a crime for big money — but risk fines and injuries. 45 min cooldown.",

  async execute(message, args, client) {
    const userId = message.author.id;
    const user   = await getUser(userId);

    // ── Cooldown ──────────────────────────────────────────────────────────────
    const lastCrime = user.lastCrime ? new Date(user.lastCrime).getTime() : 0;
    const elapsed   = Date.now() - lastCrime;
    if (elapsed < CRIME_CD) {
      const left = CRIME_CD - elapsed;
      const min  = Math.floor(left / 60_000);
      const sec  = Math.floor((left % 60_000) / 1_000);
      return message.reply({
        embeds: [new EmbedBuilder()
          .setTitle("🚨 Laying Low")
          .setDescription(`You need to lay low after your last crime!\nTry again in **${min}m ${sec}s**.`)
          .setColor(0xff4444)]
      });
    }

    // Update cooldown
    user.lastCrime = new Date();
    await user.save();

    // Pick random crime
    const crime   = CRIMES[Math.floor(Math.random() * CRIMES.length)];
    const success = Math.random() < SUCCESS_RATE;
    const msgIdx  = Math.floor(Math.random() * (success ? crime.successMsg.length : crime.failMsg.length));

    if (success) {
      // ── Success ──────────────────────────────────────────────────────────────
      const grossReward = rand(crime.minReward, crime.maxReward);
      const { taxAmount: crimeTax, netAmount: crimeNet } =
        await collectTax(message.guild?.id, userId, grossReward, "income");
      const reward = Math.round(crimeNet);
      await addMoney(userId, reward);

      return message.reply({
        embeds: [new EmbedBuilder()
          .setTitle(`${crime.emoji} Crime Succeeded — ${crime.name}`)
          .setColor(0x57f287)
          .setDescription(
            `🟢 **Success!**\n${message.author.username} ${crime.successMsg[msgIdx]}.`
          )
          .addFields(
            { name: "💰 Net Earned",  value: `$${reward.toLocaleString()}`,                                              inline: true },
            { name: "🏦 Tax",         value: crimeTax > 0 ? `–$${crimeTax.toLocaleString()}` : "None",                  inline: true },
            { name: "⏱️ Next Crime",  value: "In 45 minutes",                                                            inline: true }
          )
          .setFooter({ text: "60% success rate | Crimes escalate in risk & reward • Gov taxes auto-apply" })]
      });
    } else {
      // ── Failure ──────────────────────────────────────────────────────────────
      const fine     = rand(crime.minFine, crime.maxFine);
      const injured  = Math.random() < crime.injuryChance;
      const actualFine = Math.min(fine, user.wallet); // can't go below 0

      if (actualFine > 0) await removeMoney(userId, actualFine);

      let injuryText = "";
      if (injured) {
        const dbUser = await User.findOne({ userId });
        if (dbUser) {
          dbUser.health = Math.max(0, (dbUser.health || 100) - 20);
          dbUser.injuries.push({ type: "Criminal Injury", severity: Math.ceil(Math.random() * 5), timestamp: new Date() });
          await dbUser.save();
        }
        injuryText = "\n🚑 **You were injured!** Lost 20 HP. Use `$heal` or buy a medkit.";
      }

      return message.reply({
        embeds: [new EmbedBuilder()
          .setTitle(`${crime.emoji} Crime Failed — ${crime.name}`)
          .setColor(0xff4444)
          .setDescription(
            `🔴 **Busted!**\n${message.author.username} ${crime.failMsg[msgIdx]}.${injuryText}`
          )
          .addFields(
            { name: "💸 Fine Paid",  value: `$${actualFine.toLocaleString()}`, inline: true },
            { name: "⏱️ Next Crime", value: "In 45 minutes",                   inline: true }
          )
          .setFooter({ text: "Better luck next time. 40% fail rate." })]
      });
    }
  },
};
