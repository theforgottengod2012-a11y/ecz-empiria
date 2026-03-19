module.exports = {
  name: "credits",
  description: "View bot contributors",
  async execute(message, args, client) {
    message.reply("Credits: **Empiria Development Team** and our amazing community supporters!");
  }
};