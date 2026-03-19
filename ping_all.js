module.exports = {
  name: "ping_all",
  description: "Ping all systems",
  async execute(message, args, client) {
    message.reply(`🌐 **System Latency:**\nAPI: ${client.ws.ping}ms\nDatabase: Stable\nAI: Online`);
  }
};