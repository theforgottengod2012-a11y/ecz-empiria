# Empiria Deployment Guide

Empiria has **two parts**:
| Part | What it does | Deploy to |
|------|-------------|-----------|
| **Bot** (`server.js`) | Discord bot + full web dashboard | **Railway** |
| **Web** (`web.js`) | Dashboard only (no bot) | **Vercel** |

---

## Option A — Railway (RECOMMENDED — runs BOTH bot + web)

Railway supports long-running Node.js processes, perfect for Discord bots.

### Steps

1. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub**
2. Select your repo: `theforgottengod2012-a11y/empiria-3.0`
3. Railway auto-detects Node.js and uses `railway.json`
4. Set environment variables in Railway dashboard:

```
TOKEN=your_discord_bot_token
CLIENT_ID=your_client_id
GUILD_ID=your_guild_id
BOT_OWNER_ID=1359147702088237076
MONGO_URI=mongodb+srv://...
CLIENT_SECRET=your_oauth_secret
PORT=3000
NODE_ENV=production
```

5. Deploy → Railway runs `npm start` (which starts `server.js` — bot + web)
6. Your web dashboard URL: `https://your-project.up.railway.app`

---

## Option B — Vercel (web dashboard only) + Railway (bot only)

Use this if you want the web dashboard on Vercel's CDN for speed.

### Part 1 — Vercel (web dashboard)

1. Go to [vercel.com](https://vercel.com) → **New Project → Import from GitHub**
2. Select your repo
3. Vercel reads `vercel.json` → deploys `web.js`
4. Set environment variables in Vercel:

```
TOKEN=your_discord_bot_token
CLIENT_ID=your_client_id  
GUILD_ID=your_guild_id
MONGO_URI=mongodb+srv://...
NODE_ENV=production
```

5. Deploy → your dashboard is live at `https://empiria.vercel.app`

### Part 2 — Railway (Discord bot)

Follow Option A above, but in Railway set the start command to `npm start`.

---

## Push to GitHub

```bash
git init
git remote add origin https://github.com/theforgottengod2012-a11y/empiria-3.0.git
git add .
git commit -m "Empiria 3.0 - full bot + web"
git push -u origin main
```

---

## Environment Variables Quick Reference

| Variable | Where to get it |
|----------|----------------|
| `TOKEN` | Discord Developer Portal → Bot → Reset Token |
| `CLIENT_ID` | Discord Developer Portal → Application → General → Application ID |
| `GUILD_ID` | Right-click your server in Discord → Copy Server ID |
| `MONGO_URI` | MongoDB Atlas → Cluster → Connect → Drivers |
| `CLIENT_SECRET` | Discord Developer Portal → OAuth2 → Client Secret |
| `BOT_OWNER_ID` | Right-click your Discord profile → Copy User ID |

---

## File Structure

```
empiria-3.0/
├── server.js          ← Bot + Web (Railway / Replit)
├── web.js             ← Web only (Vercel)
├── vercel.json        ← Vercel config
├── railway.json       ← Railway config
├── Procfile           ← Heroku fallback
├── dashboard/         ← Express web dashboard
├── src/
│   ├── modules/       ← 197 prefix commands
│   ├── slashCommands/ ← 34 slash commands
│   ├── events/        ← Event handlers
│   ├── handlers/      ← Command/event loaders
│   └── database/      ← MongoDB models
└── .env.example       ← Copy to .env and fill in
```
