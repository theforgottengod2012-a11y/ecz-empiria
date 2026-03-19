module.exports = {
  name: "truth",
  description: "Get a truth question",
  usage: "$truth",
  execute: async (message, args, client) => {
    const truths = [
      "What is your biggest fear?",
      "What is the most embarrassing thing you've ever done?",
      "Who is your secret crush?",
      "What is a secret you've never told anyone?",
      "What is your biggest regret?",
      "If you could change one thing about yourself, what would it be?",
      "What is the most childish thing you still do?",
      "Have you ever lied to get out of trouble?"
    ];
    const truth = truths[Math.floor(Math.random() * truths.length)];
    message.reply(`🤔 **Truth:** ${truth}`);
  }
};