module.exports = {
  name: "unlockall",
  description: "Unlock all public channels in the server",
  permissions: ["Administrator"],

  async execute(message, args) {
    const channels = message.guild.channels.cache.filter(c => c.type === 0);
    
    let count = 0;
    for (const [id, channel] of channels) {
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null }).catch(() => {});
      count++;
    }

    message.channel.send(`🔓 **Server unlocked.** Permissions reset for **${count}** channels.`);
  }
};