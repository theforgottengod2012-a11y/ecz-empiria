module.exports = {
  name: "say",
  description: "Make the bot say something",
  permissions: ["ManageMessages"],

  async execute(message, args) {
    const text = args.join(" ");
    if (!text) return message.reply("❌ Provide text.");
    
    await message.delete().catch(() => {});
    message.channel.send(text);
  }
};