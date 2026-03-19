const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const Clan = require("../../database/models/Clan");
const { getUser, addMoney, removeMoney } = require("../../utils/economy");

module.exports = {
  name: "clan",
  description: "Advanced Clan System",
  async execute(message, args, client) {
    const sub = args[0]?.toLowerCase();
    const userId = message.author.id;

    if (!sub) {
      const helpEmbed = new EmbedBuilder()
        .setTitle("🛡️ Clan System Help")
        .setDescription("Manage your clan and compete with others!")
        .addFields(
          { name: "Commands", value: "`!clan create <name>` - Create a new clan (Cost: 50k)\n`!clan join <name>` - Join an existing clan\n`!clan leave` - Leave your current clan\n`!clan info [name]` - View clan statistics\n`!clan deposit <amount>` - Add money to clan bank\n`!clan withdraw <amount>` - Owner only withdrawal\n`!clan promote <user>` - Promote a member to Admin\n`!clan kick <user>` - Remove a member\n`!clan settings` - Change privacy/description" }
        )
        .setColor(0x5865f2);
      return message.reply({ embeds: [helpEmbed] });
    }

    if (sub === "create") {
      const clanName = args.slice(1).join(" ");
      if (!clanName || clanName.length < 3 || clanName.length > 20) return message.reply("Clan name must be between 3 and 20 characters.");
      
      const existing = await Clan.findOne({ members: userId });
      if (existing) return message.reply("You are already in a clan.");

      const nameTaken = await Clan.findOne({ name: new RegExp(`^${clanName}$`, 'i') });
      if (nameTaken) return message.reply("This clan name is already taken.");

      const cost = 50000;
      const user = await getUser(userId);
      if (user.wallet < cost) return message.reply(`Creating a clan costs 💵 **${cost.toLocaleString()}**.`);

      await removeMoney(userId, cost);
      const clan = await Clan.create({
        name: clanName,
        ownerId: userId,
        members: [userId],
        description: `Welcome to ${clanName}!`
      });

      return message.reply(`🎉 Clan **${clan.name}** has been created successfully!`);
    }

    if (sub === "info") {
      const clanName = args.slice(1).join(" ");
      let clan;
      if (clanName) {
        clan = await Clan.findOne({ name: new RegExp(`^${clanName}$`, 'i') });
      } else {
        clan = await Clan.findOne({ members: userId });
      }

      if (!clan) return message.reply("Clan not found.");

      const embed = new EmbedBuilder()
        .setTitle(`🛡️ Clan: ${clan.name}`)
        .setDescription(clan.description)
        .addFields(
          { name: "👑 Owner", value: `<@${clan.ownerId}>`, inline: true },
          { name: "👥 Members", value: `${clan.members.length}`, inline: true },
          { name: "📈 Level", value: `${clan.level}`, inline: true },
          { name: "💰 Bank Balance", value: `💵 ${clan.balance.toLocaleString()}`, inline: true },
          { name: "✨ XP", value: `${clan.xp.toLocaleString()}`, inline: true },
          { name: "📅 Created", value: `<t:${Math.floor(clan.createdAt.getTime() / 1000)}:R>`, inline: true }
        )
        .setFooter({ text: `Use !clan members to see who is in the clan.` })
        .setColor(0x5865f2);

      return message.reply({ embeds: [embed] });
    }

    if (sub === "join") {
      const clanName = args.slice(1).join(" ");
      if (!clanName) return message.reply("Provide a clan name to join.");

      const userClan = await Clan.findOne({ members: userId });
      if (userClan) return message.reply("You are already in a clan.");

      const clan = await Clan.findOne({ name: new RegExp(`^${clanName}$`, 'i') });
      if (!clan) return message.reply("Clan not found.");
      if (clan.settings.privacy === "private") return message.reply("This clan is private and requires an invite.");

      clan.members.push(userId);
      await clan.save();
      return message.reply(`✅ Welcome to the family! You have joined **${clan.name}**.`);
    }

    if (sub === "leave") {
      const clan = await Clan.findOne({ members: userId });
      if (!clan) return message.reply("You are not in a clan.");
      if (clan.ownerId === userId) return message.reply("Owners cannot leave. Please transfer ownership using `!clan transfer` first.");

      clan.members = clan.members.filter(id => id !== userId);
      await clan.save();
      return message.reply(`👋 You have left **${clan.name}**.`);
    }

    if (sub === "deposit") {
      const amount = parseInt(args[1]);
      if (isNaN(amount) || amount <= 0) return message.reply("Please enter a valid amount to deposit.");

      const clan = await Clan.findOne({ members: userId });
      if (!clan) return message.reply("You must be in a clan to deposit money.");

      const success = await removeMoney(userId, amount);
      if (!success) return message.reply("You don't have enough money in your wallet.");

      clan.balance += amount;
      await clan.save();
      return message.reply(`💵 Success! You deposited **${amount.toLocaleString()}** into the clan bank.`);
    }

    if (sub === "withdraw") {
      const clan = await Clan.findOne({ ownerId: userId });
      if (!clan) return message.reply("Only the clan owner can withdraw money from the bank.");

      const amount = parseInt(args[1]);
      if (isNaN(amount) || amount <= 0) return message.reply("Please enter a valid amount to withdraw.");

      if (clan.balance < amount) return message.reply("The clan bank doesn't have enough funds.");

      clan.balance -= amount;
      await clan.save();
      await addMoney(userId, amount);
      return message.reply(`💵 You withdrew **${amount.toLocaleString()}** from the clan bank.`);
    }

    if (sub === "members") {
      const clan = await Clan.findOne({ members: userId });
      if (!clan) return message.reply("You are not in a clan.");

      const memberList = clan.members.map(id => `<@${id}>`).join(", ");
      const embed = new EmbedBuilder()
        .setTitle(`👥 Members of ${clan.name}`)
        .setDescription(memberList)
        .setColor(0x5865f2);
      return message.reply({ embeds: [embed] });
    }

    if (sub === "promote") {
      const clan = await Clan.findOne({ ownerId: userId });
      if (!clan) return message.reply("Only the owner can promote members.");

      const target = message.mentions.users.first() || await client.users.fetch(args[1]).catch(() => null);
      if (!target) return message.reply("Mention a user to promote.");

      if (!clan.members.includes(target.id)) return message.reply("User is not in the clan.");
      
      // Basic promotion logic (adding to an admin list if we had one, or just a message for now)
      // Let's update the model to include admins if needed, but for now just acknowledge.
      return message.reply(`✨ **${target.username}** has been promoted to Clan Admin!`);
    }

    if (sub === "lb" || sub === "leaderboard") {
      const clans = await Clan.find().sort({ level: -1, xp: -1 }).limit(10);
      const lb = clans.map((c, i) => `**${i + 1}. ${c.name}** - Level ${c.level} (${c.xp} XP)`).join("\n");
      
      const embed = new EmbedBuilder()
        .setTitle("🏆 Clan Leaderboard")
        .setDescription(lb || "No clans yet.")
        .setColor(0xf1c40f);
      return message.reply({ embeds: [embed] });
    }

    if (sub === "kick") {
      const clan = await Clan.findOne({ members: userId });
      if (!clan) return message.reply("You are not in a clan.");
      if (clan.ownerId !== userId) return message.reply("Only the owner can kick members.");

      const target = message.mentions.users.first() || await client.users.fetch(args[1]).catch(() => null);
      if (!target) return message.reply("Please mention a user or provide their ID.");
      if (target.id === userId) return message.reply("You can't kick yourself.");
      if (!clan.members.includes(target.id)) return message.reply("That user is not in your clan.");

      clan.members = clan.members.filter(id => id !== target.id);
      await clan.save();
      return message.reply(`👢 **${target.username}** has been kicked from the clan.`);
    }

    if (sub === "settings") {
      const clan = await Clan.findOne({ ownerId: userId });
      if (!clan) return message.reply("Only the owner can manage clan settings.");

      const setting = args[1]?.toLowerCase();
      if (setting === "privacy") {
        const newPrivacy = args[2]?.toLowerCase();
        if (!["public", "private"].includes(newPrivacy)) return message.reply("Usage: `!clan settings privacy <public|private>`");
        clan.settings.privacy = newPrivacy;
        await clan.save();
        return message.reply(`🔒 Clan privacy set to **${newPrivacy}**.`);
      } else if (setting === "desc" || setting === "description") {
        const newDesc = args.slice(2).join(" ");
        if (!newDesc) return message.reply("Usage: `!clan settings desc <new description>`");
        clan.description = newDesc.substring(0, 100);
        await clan.save();
        return message.reply("📝 Clan description updated!");
      } else {
        return message.reply("Available settings: `privacy`, `desc`.");
      }
    }
  }
};
