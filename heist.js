const User = require("../../database/models/User");
const heists = require("../../data/heists");

module.exports = {
  name: "heist",
  description: "Start a group robbery with 2-5 players.",
  usage: "$heist @user1 @user2",
  async execute(message, args, client) {
    const mentions = message.mentions.users;
    if (mentions.size < 1)
      return message.reply("❌ **TEAMWORK REQUIRED**\nMention at least 1 teammate to plan a heist. (Total 2-5 players)");

    const members = [message.author.id, ...mentions.map(u => u.id)];
    if (members.length > 5)
      return message.reply("❌ **TOO CROWDED**\nMax 5 players allowed in a single heist operation.");

    const users = await User.find({ userId: { $in: members } });
    if (users.length < members.length)
      return message.reply("❌ **UNREGISTERED CREW**\nSome team members haven't registered yet.");

    const minWallet = 5000;
    const poorMembers = users.filter(u => u.wallet < minWallet);
    if (poorMembers.length > 0)
      return message.reply(`❌ **FUNDING ISSUE**\nEveryone needs at least $${minWallet.toLocaleString()} in their wallet to buy gear.`);

    const now = Date.now();
    const HEIST_COOLDOWN = 6 * 60 * 60 * 1000; // 6 hours
    
    for (const u of users) {
      const lastHeist = u.cooldowns.heist || 0;
      if (now - lastHeist < HEIST_COOLDOWN) {
        const remaining = Math.ceil((HEIST_COOLDOWN - (now - lastHeist)) / 60000);
        return message.reply(`⏳ **HEAT IS ON**\nSomeone in the crew is still being watched by the cops. Wait ${remaining}m.`);
      }
    }

    const heist = heists[Math.floor(Math.random() * heists.length)];
    const successChance = (members.length * 0.15) + Math.random();

    if (successChance >= heist.difficulty) {
      const reward = Math.floor(Math.random() * (heist.reward[1] - heist.reward[0]) + heist.reward[0]);
      const split = Math.floor(reward / members.length);

      for (const u of users) {
        u.wallet += split;
        u.cooldowns.heist = now;
        await u.save();
      }

      message.reply(`💰 **HEIST SUCCESSFUL!**\n🏦 **Target:** ${heist.name}\n💎 **Total Loot:** $${reward.toLocaleString()}\n💵 **Your Share:** $${split.toLocaleString()} each!`);
    } else {
      for (const u of users) {
        const loss = Math.floor(u.wallet * (0.1 + Math.random() * 0.15));
        u.wallet -= loss;
        u.cooldowns.heist = now;
        await u.save();
      }

      message.reply(`🚨 **BUSTED!**\nThe heist at **${heist.name}** went south. Everyone lost a portion of their wallet to fines and legal fees.`);
    }
  }
};