module.exports = {
  name: "shell",
  description: "Execute shell commands (Developer only)",
  async execute(message, args, client) {
    if (message.author.id !== "YOUR_DEVELOPER_ID") return message.reply("❌ Developer only.");
    const { exec } = require("child_process");
    exec(args.join(" "), (error, stdout) => {
      message.reply(`\`\`\`bash\n${stdout || error.message}\n\`\`\``);
    });
  }
};