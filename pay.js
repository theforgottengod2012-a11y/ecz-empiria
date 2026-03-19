const { getUser, removeMoney, addMoney } = require("../../utils/economy");
const { resolveUser } = require("../../utils/resolver");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "pay",
  aliases: ["give", "transfer", "send"],
  description: "Send money to another user. Usage: $pay @user <amount>",

  async execute(message, args, client) {
    const targetMember = message.mentions.members?.first()
      || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);

    if (!targetMember) {
      return message.reply("❌ **Usage:** `$pay @user <amount>`");
    }

    if (targetMember.id === message.author.id) {
      return message.reply("❌ You can't pay yourself!");
    }

    if (targetMember.user.bot) {
      return message.reply("❌ You can't pay bots.");
    }

    const amountArg = args[1] || args[0];
    const amount    = parseInt(amountArg?.replace(/,/g, ""));

    if (!amount || isNaN(amount) || amount < 1) {
      return message.reply("❌ **Usage:** `$pay @user <amount>` — amount must be a positive number.");
    }

    if (amount > 1_000_000_000) {
      return message.reply("❌ You can't send more than $1,000,000,000 at a time.");
    }

    const sender = await getUser(message.author.id);

    if (sender.wallet < amount) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xff4444)
          .setDescription(
            `💸 You don't have enough money!\n` +
            `You need **$${amount.toLocaleString()}** but only have **$${sender.wallet.toLocaleString()}** in wallet.`
          )]
      });
    }

    await removeMoney(message.author.id, amount);
    await addMoney(targetMember.id, amount);

    const updatedSender = await getUser(message.author.id);

    return message.reply({
      embeds: [new EmbedBuilder()
        .setTitle("💸 Transfer Complete!")
        .setColor(0x57f287)
        .setDescription(
          `**${message.author.username}** sent **$${amount.toLocaleString()}** to **${targetMember.displayName}**!`
        )
        .addFields(
          { name: "📤 Sender",      value: message.author.username,                         inline: true },
          { name: "📥 Receiver",    value: targetMember.displayName,                        inline: true },
          { name: "💰 Amount",      value: `$${amount.toLocaleString()}`,                   inline: true },
          { name: "💵 Your Wallet", value: `$${updatedSender.wallet.toLocaleString()}`,     inline: true }
        )
        .setTimestamp()
        .setFooter({ text: "Use $balance to check your wallet" })]
    });
  },
};
