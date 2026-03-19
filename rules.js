module.exports = {
  name: "rules",
  description: "View server rules",
  async execute(message, args, client) {
    message.reply("📜 **Server Rules:**\n1. Be respectful\n2. No spam\n3. No NSFW\n4. Follow Discord TOS");
  }
};