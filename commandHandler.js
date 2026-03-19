const fs   = require("fs");
const path = require("path");
const { Collection } = require("discord.js");

module.exports = (client) => {
  client.commands = new Collection();

  const modulesPath   = path.join(__dirname, "../modules");
  const moduleFolders = fs.readdirSync(modulesPath)
    .filter(f => fs.statSync(path.join(modulesPath, f)).isDirectory());

  for (const folder of moduleFolders) {
    const folderPath   = path.join(modulesPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(f => f.endsWith(".js"));

    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      delete require.cache[require.resolve(filePath)];

      let exported;
      try { exported = require(filePath); }
      catch (err) { console.error(`❌ Failed to load ${file}:`, err.message); continue; }

      // ── Support: module.exports.commands = [ {...}, {...} ] ────────────────
      const cmds = Array.isArray(exported?.commands) ? exported.commands : [exported];

      for (const command of cmds) {
        if (!command || !command.name || typeof command.execute !== "function") {
          if (!Array.isArray(exported?.commands)) {
            console.warn(`⚠️ Skipped invalid command file: ${file}`);
          }
          continue;
        }
        command.module = folder;
        client.commands.set(command.name, command);
      }
    }
  }

  console.log(`✅ Loaded ${client.commands.size} commands`);
};
