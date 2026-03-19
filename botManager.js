/**
 * botManager.js
 * Manages the Discord bot connection lifecycle from within the Express server.
 * Run / Stop / Restart are exposed so the web dashboard can control the bot.
 */

let _client = null;
let _status = "offline";   // "starting" | "online" | "offline" | "stopping"
let _startedAt = null;

function setClient(client) {
  _client = client;

  // Sync status with Discord.js events
  client.on("ready", () => {
    _status   = "online";
    _startedAt = new Date();
  });

  client.on("shardDisconnect", () => {
    if (_status !== "stopping") _status = "offline";
  });
}

async function startBot() {
  if (!_client) throw new Error("Client not initialised");
  if (_status === "online" || _status === "starting") return { ok: false, message: "Bot is already running." };

  _status = "starting";
  try {
    await _client.login(process.env.TOKEN);
    // status updated to "online" by the ready event
    return { ok: true, message: "Bot started." };
  } catch (err) {
    _status = "offline";
    return { ok: false, message: err.message };
  }
}

function stopBot() {
  if (!_client) return { ok: false, message: "Client not initialised." };
  _status = "stopping";
  _client.destroy();
  _status = "offline";
  _startedAt = null;
  return { ok: true, message: "Bot stopped. The web dashboard is still running." };
}

function restartBot() {
  // On Railway / Render: process.exit(0) triggers an automatic restart.
  // The Express server AND bot come back up together.
  process.exit(0);
}

function getStatus() {
  return {
    status:   _status,
    online:   _status === "online",
    uptime:   _startedAt ? Math.floor((Date.now() - _startedAt.getTime()) / 1000) : 0,
    guilds:   _client?.guilds?.cache?.size  || 0,
    users:    _client?.users?.cache?.size   || 0,
    commands: _client?.commands?.size       || 0,
    ping:     _client?.ws?.ping            ?? -1,
  };
}

module.exports = { setClient, startBot, stopBot, restartBot, getStatus };
