// client.js
const { Client, GatewayIntentBits, Collection, Partials } = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();
client.slashCommands = new Collection();
client.cooldowns = new Collection();
client.spamMap = new Map();

// ✅ Load handlers
require("./handlers/eventHandler")(client);
require("./handlers/commandHandler")(client);
require("./handlers/slashHandler")(client);

module.exports = client;
