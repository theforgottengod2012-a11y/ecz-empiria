module.exports = {
  name: "nowplaying",
  aliases: ["np"],
  module: "music",
  async execute(message, args, client) {
    const serverQueue = client.queue?.get(message.guild.id);
    if (!serverQueue?.songs?.length) return message.reply("❌ Nothing is playing.");
    message.channel.send(`🎵 Now playing: **${serverQueue.songs[0].title}**`);
  }
};
