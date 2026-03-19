const { REST, Routes } = require("discord.js");
const fs = require("fs");
const { clientId, guildId, token } = require("./config.json"); // replace with your own

const commands = [];
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.data) commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    // For testing in one server (guild)
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    });

    // If you want global commands (takes up to 1 hour to appear)
    // await rest.put(Routes.applicationCommands(clientId), { body: commands });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();
