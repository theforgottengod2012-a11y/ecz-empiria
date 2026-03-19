const axios = require("axios");

module.exports = {
  name: "joke",
  description: "Get a random joke",
  usage: "$joke",
  execute: async (message, args, client) => {
    try {
      const response = await axios.get("https://v2.jokeapi.dev/joke/Any?safe-mode");
      const data = response.data;

      if (data.type === "single") {
        message.reply(`🤣 ${data.joke}`);
      } else {
        message.reply(`🤣 ${data.setup}\n\n*${data.delivery}*`);
      }
    } catch (err) {
      console.error(err);
      if (message && typeof message.reply === "function") {
        message.reply("❌ Failed to fetch a joke. Try again later!");
      }
    }
  }
};