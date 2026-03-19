# Empiria Bot Dashboard v2

## Overview
Empiria is a fully-featured multipurpose Discord bot with a React management dashboard. The project is split into two parts that run simultaneously:

1. **Main Web Dashboard** (port 5000) — React + Express, serves the management UI
2. **Discord Bot Server** (port 3001) — Node.js server that manages the Discord bot process via child_process

## Architecture

```
workspace/
├── client/                    # React frontend (Vite + TailwindCSS)
│   └── src/
│       ├── pages/             # Dashboard, BotControl, DMManager, CommandsBrowser, Terms, Privacy
│       ├── components/        # AppSidebar, ThemeProvider
│       └── App.tsx            # Router + sidebar layout
├── server/                    # Express backend (TypeScript)
│   ├── index.ts               # Main server entry (port 5000)
│   └── routes.ts              # API proxy to discord-bot server (port 3001)
├── discord-bot/               # Discord.js bot
│   ├── server.js              # Bot manager server (port 3001, hardcoded)
│   ├── bot.js                 # Bot entry point + IPC handler
│   ├── src/
│   │   ├── client.js          # Discord client setup + command loader
│   │   ├── events/            # ready.js, messageCreate.js, interactionCreate.js, etc.
│   │   ├── modules/           # economy/, moderation/, fun/, farming/, pets/, government/, etc.
│   │   ├── utils/             # economy.js, modTracker.js, governmentTax.js, etc.
│   │   └── database/models/   # User, GuildConfig, ModTracker, ModActivity, DMLog, etc.
│   └── dashboard/             # Legacy EJS dashboard (not used by React app)
└── shared/                    # Shared TypeScript types (minimal)
```

## Workflows
- **Start application** — `npm run dev` — Starts the React/Express dashboard on port 5000 (webview)
- **Discord Bot Server** — `node discord-bot/server.js` — Starts the bot management server on port 3001 (console)

## API Routes (server/routes.ts proxies to port 3001)
- `GET /api/health` — Health check for UptimeRobot keep-alive
- `GET /api/bot/status` — Bot status, stats, and recent logs
- `POST /api/bot/start` — Start the bot
- `POST /api/bot/stop` — Stop the bot
- `POST /api/bot/restart` — Restart the bot
- `GET /api/bot/commands` — Load all commands from module files
- `GET /api/dms` — List all DM conversations stored in MongoDB
- `GET /api/dms/:userId` — Get messages for a specific DM thread
- `POST /api/dms/send` — Send a DM as the bot (via IPC to bot process)

## Dashboard Pages
| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Bot stats, live logs, system status, feature overview |
| `/control` | Bot Control | Start/stop/restart, full log viewer with filter/export |
| `/dms` | DM Manager | View all DMs to the bot, reply as bot |
| `/commands` | Commands | Browse 240+ commands by category with search |
| `/terms` | Terms of Service | Full legal ToS |
| `/privacy` | Privacy Policy | Full privacy policy |

## Bot Features
- **Economy** — Wallet/bank, jobs (20+ careers), gambling, shop, heists, prestige, leaderboards
- **Government** — Laws, taxes, treasury, budget management, government benefits
- **Fun & Games** — 8-ball, trivia, blackjack, connect4, wordle, chess, hangman, 20+ games
- **Farming** — Plant seeds, water, harvest, fertilize, market selling
- **Pets** — Catch, train, evolve, battle pets. XP-based leveling, tournaments
- **Moderation** — AutoMod, mod tracker, cases, warns, bans, anti-nuke, tickets, jail
- **Mod Tracker (MT)** — Live activity board, daily message tracking, online hours, auto-demotion
- **DM Management** — Log all DMs to bot in MongoDB, reply from dashboard

## DM Flow
1. User DMs the bot on Discord
2. `messageCreate.js` detects non-guild message, saves to `DMLog` model in MongoDB
3. Dashboard queries `/api/dms` → bot server queries MongoDB → returns thread list
4. To reply: dashboard POSTs to `/api/dms/send` → bot server sends IPC → bot.js fetches user → sends DM

## Mod Tracker (MT) System
- Config stored in `ModTracker` MongoDB model per guild
- Staff message counts tracked per day in `ModActivity`
- Live board updates every 5 seconds via `modTracker.js` `refreshAll()`
- Daily reset at midnight via `scheduleMidnightReset()`
- Auto-demotion system via `PendingDemotion` model
- Backfill on startup fetches missed messages while bot was offline

## Environment Variables Required
| Variable | Purpose |
|----------|---------|
| `TOKEN` | Discord bot token |
| `MONGO_URI` | MongoDB connection string |
| `SESSION_SECRET` | Express session secret |

## 24/7 Hosting
- Use UptimeRobot to ping `/api/health` every 5 minutes to keep Replit alive
- The keep-alive endpoint returns `{ status: "ok", timestamp: ... }`
- Optional: deploy the dashboard to Vercel for a permanent URL

## Bot Client ID
`1457754742104260771`

## Bot Owner ID
`1359147702088237076`

## Bot Prefix
`$` (configurable per guild via GuildConfig model)

## Theme
Discord-inspired dark mode with blurple primary color (`235 86% 65%`). Supports light/dark/system modes via ThemeProvider.
