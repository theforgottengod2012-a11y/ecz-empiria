module.exports = {
  name: "resume",
  module: "music",
  async execute(message, args, client) {
    const serverQueue = client.queue?.get(message.guild.id);
    if (!serverQueue) return message.reply("❌ Nothing is playing.");
    if (serverQueue.player?.unpause) { serverQueue.player.unpause(); message.channel.send("▶️ Resumed."); }
  }
};
