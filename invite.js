module.exports = {
  name: "invite",
  description: "Get bot invite link",
  async execute(message, args, client) {
    message.reply(
      `🔗 **Invite me:** https://discord.com/oauth2/authorize?client_id=1457754742104260771&permissions=8&integration_type=0&scope=bot`,
    );
  },
};
