module.exports = {
  name: "version",
  description: "Check bot version",
  async execute(message, args, client) {
    message.reply("🚀 **Empiria Version:** v2.1.4-advanced");
  },
};
