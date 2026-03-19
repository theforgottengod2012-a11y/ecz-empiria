module.exports = {
  name: "reload",
  description: "Reload a command (Developer only)",
  async execute(message, args, client) {
    if (message.author.id !== "YOUR_DEVELOPER_ID") return message.reply("❌ Developer only.");
    const commandName = args[0];
    if (!commandName) return message.reply("❌ Provide a command name.");
    delete require.cache[require.resolve(`./${commandName}.js`)];
    const newCommand = require(`./${commandName}.js`);
    client.commands.set(newCommand.name, newCommand);
    message.reply(`✅ Command \`${commandName}\` reloaded!`);
  }
};