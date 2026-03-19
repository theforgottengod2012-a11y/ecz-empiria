module.exports = {
  name: "pause",
  module: "music",
  async execute(message, args, client) {
    const serverQueue = client.queue?.get(message.guild.id);
    if (!serverQueue) return message.reply("❌ Nothing is playing.");
    if (serverQueue.player?.pause) { serverQueue.player.pause(); message.channel.send("⏸️ Paused."); }
  }
};
