module.exports = {
  name: "eval",
  description: "Evaluate JavaScript code (Developer only)",
  async execute(message, args, client) {
    if (message.author.id !== "YOUR_DEVELOPER_ID") return message.reply("❌ Developer only.");
    try {
      const code = args.join(" ");
      let evaled = eval(code);
      if (typeof evaled !== "string") evaled = require("util").inspect(evaled);
      message.reply(`\`\`\`js\n${evaled}\n\`\`\``);
    } catch (err) {
      message.reply(`\`\`\`js\n${err}\n\`\`\``);
    }
  }
};