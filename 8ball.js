module.exports = {
  name: "8ball",
  aliases: ["8b"],
  description: "Ask the magic 8ball a question",
  usage: "$8ball <question>",
  execute: async (message, args, client) => {
    if(!args[0]) return message.reply("Please ask a question!");
    const responses = ["Yes.", "No.", "Maybe.", "Definitely!", "Absolutely not."];
    const answer = responses[Math.floor(Math.random() * responses.length)];
    message.reply(`🎱 ${answer}`);
  }
};