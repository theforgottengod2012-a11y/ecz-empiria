module.exports = {
  name: "dare",
  description: "Get a dare challenge",
  usage: "$dare",
  execute: async (message, args, client) => {
    const dares = [
      "Send a random emoji to the last person you DM'd.",
      "Tell a joke in this channel.",
      "Change your nickname to 'I am a potato' for 10 minutes.",
      "Type 'I love this bot' 5 times fast.",
      "Sing a song in a voice channel.",
      "Do 10 pushups (on camera if in VC).",
      "React to the next message with a random emoji.",
      "Tell everyone your most recent search history."
    ];
    const dare = dares[Math.floor(Math.random() * dares.length)];
    message.reply(`🔥 **Dare:** ${dare}`);
  }
};