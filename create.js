const User = require("../../database/models/User");
const Clan = require("../../database/models/Clan");

module.exports = {
  name: "clan-create",
  aliases: ["clan create"],
  async execute(message, args, client) {
    const clanName = args.join(" ");
    if (!clanName) {
      return message.reply("❌ You must provide a clan name.");
    }

    const user = await User.findOne({ userId: message.author.id });
    if (!user) {
      return message.reply("❌ You are not registered. Use `$register` first.");
    }

    if (user.clanId) {
      return message.reply("❌ You are already in a clan.");
    }

    const CLAN_CREATION_COST = 250000;

    // Note: The user model uses 'wallet' and 'bank'. Based on the 250k rule, we check total balance or wallet?
    // User model snippet: wallet: { type: Number, default: 500 }, bank: { type: Number, default: 0 }
    const totalBalance = (user.wallet || 0) + (user.bank || 0);

    if (totalBalance < CLAN_CREATION_COST) {
      return message.reply(
        `💸 You need **$${CLAN_CREATION_COST.toLocaleString()}** to create a clan.\nYour total balance: **$${totalBalance.toLocaleString()}**`
      );
    }

    const existingClan = await Clan.findOne({ name: { $regex: new RegExp(`^${clanName.trim()}$`, 'i') } });
    if (existingClan) {
      return message.reply("❌ A clan with this name already exists.");
    }

    if (clanName.length < 3 || clanName.length > 20) {
      return message.reply("❌ Clan name must be between 3 and 20 characters.");
    }

    // Deduct money (prioritize wallet, then bank)
    if (user.wallet >= CLAN_CREATION_COST) {
      user.wallet -= CLAN_CREATION_COST;
    } else {
      const remaining = CLAN_CREATION_COST - user.wallet;
      user.wallet = 0;
      user.bank -= remaining;
    }
    
    // Create clan
    const clanId = `CLAN-${Date.now()}`;
    const clan = new Clan({
      clanId,
      name: clanName,
      ownerId: message.author.id,
      members: [message.author.id],
      admins: [],
      bank: 0,
      level: 1,
      xp: 0,
      createdAt: new Date()
    });

    await clan.save();
    user.clanId = clanId;
    await user.save();

    message.reply(
      `🏰 **Clan Created Successfully!**\n` +
      `👑 Owner: ${message.author.username}\n` +
      `💸 Cost: **$250,000**\n` +
      `📛 Clan Name: **${clanName}**`
    );
  }
};