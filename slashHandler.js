const fs   = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");
require("dotenv").config();

module.exports = async (client) => {
  client.slashCommands = new Map();
  const commands  = [];
  const slashPath = path.join(__dirname, "../slashCommands");
  let   loaded    = 0;
  let   failed    = 0;

  for (const folder of fs.readdirSync(slashPath)) {
    const folderPath = path.join(slashPath, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    for (const file of fs.readdirSync(folderPath).filter(f => f.endsWith(".js"))) {
      try {
        const command = require(path.join(folderPath, file));
        if (!command.data) { failed++; continue; }
        if (!command.execute && command.slashExecute) command.execute = command.slashExecute;
        if (!command.execute) { failed++; continue; }

        client.slashCommands.set(command.data.name, command);
        commands.push(command.data.toJSON());
        loaded++;
      } catch (err) {
        console.error(`[SlashHandler] Error loading ${file}:`, err.message);
        failed++;
      }
    }
  }

  console.log(`[SlashHandler] ✅ Loaded ${loaded} slash commands${failed ? ` (${failed} skipped)` : ""} — OPTIONAL feature`);
  console.log(`[SlashHandler] ℹ️  Primary commands use PREFIX ($). Slash commands are supplementary.`);

  // ── Register slash commands with Discord (optional — won't crash if it fails) ─
  client.once("ready", async () => {
    if (!commands.length) return console.log("[SlashHandler] No slash commands to register.");

    try {
      const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
      const data = await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: commands }
      );
      console.log(`[SlashHandler] ✅ Registered ${data.length} slash commands with Discord.`);
    } catch (err) {
      console.warn(`[SlashHandler] ⚠️  Slash command registration skipped: ${err.message}`);
      console.warn(`[SlashHandler]    This is non-fatal — all prefix ($) commands still work.`);
    }
  });
};
