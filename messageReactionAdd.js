const { Events } = require("discord.js");
const giveawayJoin = require("../giveaways/join");

module.exports = {
  name: Events.MessageReactionAdd,
  once: false,
  async execute(reaction, user, client) {
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.error("Something went wrong when fetching the message:", error);
        return;
      }
    }
    
    await giveawayJoin(reaction, user);
  },
};
