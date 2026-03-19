const { addMoney, getUser } = require("../../utils/economy");
const { EmbedBuilder } = require("discord.js");

const BEG_CD = 60_000; // 1 minute

const NPCS = [
  { name: "A rich businessman",    emoji: "👔", min: 100, max: 600,   responseOk: "Fine, take this and get a job.",              responseNo: "Get away from me, peasant." },
  { name: "A kind grandma",        emoji: "👵", min: 20,  max: 250,   responseOk: "Oh you poor dear, here you go sweetheart.",   responseNo: "I spent my last cent on bingo, honey." },
  { name: "A famous streamer",     emoji: "🎮", min: 200, max: 1_500, responseOk: "Chat, should I give them money? Let's go PogChamp!", responseNo: "I already gave my monthly charity budget, man." },
  { name: "A Wall Street broker",  emoji: "💹", min: 500, max: 2_000, responseOk: "I made $50K today alone. Here, invest wisely.", responseNo: "Get off my trading floor!" },
  { name: "A suspicious stranger", emoji: "🕵️", min: 50,  max: 400,   responseOk: "Here. Don't ask where this came from.",       responseNo: "I don't know you. Walk away." },
  { name: "A pizza delivery guy",  emoji: "🍕", min: 10,  max: 100,   responseOk: "I've got a tip left over, take it!",         responseNo: "I need my tips for rent, sorry." },
  { name: "A celebrity",           emoji: "🌟", min: 300, max: 3_000, responseOk: "Anything for a fan! Here's a little something.", responseNo: "My publicist says no charity requests today." },
  { name: "A broke college student",emoji:"🎓", min: 1,   max: 30,    responseOk: "I only have this much but here you go.",      responseNo: "I have negative $200 in my account, bro." },
  { name: "A lottery winner",      emoji: "🎰", min: 500, max: 5_000, responseOk: "Just won $2M! Happy to share a bit.",        responseNo: "I'm saving it all for taxes, unfortunately." },
  { name: "A passing monk",        emoji: "🧘", min: 0,   max: 50,    responseOk: "Material wealth means nothing. But here, find peace.", responseNo: "Detachment from money is the path to happiness." },
  { name: "A government official", emoji: "🏛️", min: 200, max: 1_200, responseOk: "Here's a small stimulus cheque.",            responseNo: "The budget committee rejected your request." },
];

const FAIL_CHANCE = 0.30; // 30% chance they say no

module.exports = {
  name: "beg",
  aliases: ["begformoney"],
  description: "Beg a random person for money. 1 minute cooldown.",

  async execute(message, args, client) {
    const userId = message.author.id;

    if (!client._begCooldowns) client._begCooldowns = new Map();
    const lastUsed = client._begCooldowns.get(userId) || 0;
    const elapsed  = Date.now() - lastUsed;

    if (elapsed < BEG_CD) {
      const sec = Math.ceil((BEG_CD - elapsed) / 1_000);
      return message.reply({
        embeds: [new EmbedBuilder()
          .setTitle("🙏 Not Yet!")
          .setDescription(`You already begged recently. Wait **${sec}s**.`)
          .setColor(0xf1c40f)]
      });
    }

    client._begCooldowns.set(userId, Date.now());

    const npc  = NPCS[Math.floor(Math.random() * NPCS.length)];
    const fail = Math.random() < FAIL_CHANCE;

    if (fail || (npc.min === 0 && Math.random() < 0.4)) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setTitle(`🙏 Begging...`)
          .setColor(0x99aab5)
          .setDescription(
            `**${npc.emoji} ${npc.name}** looked at you and said:\n` +
            `> *"${npc.responseNo}"*\n\n` +
            `You received **$0**. Better luck next time!`
          )
          .setFooter({ text: "Try again in 1 minute" })]
      });
    }

    const reward = Math.floor(Math.random() * (npc.max - npc.min + 1)) + npc.min;
    if (reward <= 0) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setTitle("🙏 Begging...")
          .setColor(0x99aab5)
          .setDescription(`**${npc.emoji} ${npc.name}** said:\n> *"${npc.responseNo}"*\n\nYou got **$0**.`)
          .setFooter({ text: "Try again in 1 minute" })]
      });
    }

    await addMoney(userId, reward);
    const user = await getUser(userId);

    return message.reply({
      embeds: [new EmbedBuilder()
        .setTitle(`🙏 Someone was Generous!`)
        .setColor(0x57f287)
        .setDescription(
          `**${npc.emoji} ${npc.name}** said:\n` +
          `> *"${npc.responseOk}"*\n\n` +
          `You received **$${reward.toLocaleString()}**!`
        )
        .addFields(
          { name: "💰 Received",  value: `$${reward.toLocaleString()}`,          inline: true },
          { name: "💵 Wallet",    value: `$${user.wallet.toLocaleString()}`,      inline: true }
        )
        .setFooter({ text: "Beg again in 1 minute. Get a job for real income!" })]
    });
  },
};
