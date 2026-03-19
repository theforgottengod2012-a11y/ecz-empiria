# 🚀 Push to GitHub + Deploy to Vercel (24/7 Hosting)

## Step 1: Prepare Your Project

Your project is **READY** with:
- ✅ `.gitignore` - Excludes node_modules, .env, logs
- ✅ `vercel.json` - Deployment configuration
- ✅ `Dockerfile` - Docker containerization
- ✅ `.env.example` - Environment variables template
- ✅ All dependencies in `package.json`
- ✅ MongoDB connection configured
- ✅ Bot fully functional with 197 commands

## Step 2: Push to GitHub

### First Time Setup
```bash
git config user.email "your@email.com"
git config user.name "Your Name"
git add .
git commit -m "Deploy Empiria bot to production"
git remote add origin https://github.com/YOUR_USERNAME/empiria-bot.git
git branch -M main
git push -u origin main
```

### Future Updates
```bash
git add .
git commit -m "Update: [describe changes]"
git push origin main
```

## Step 3: Deploy to Vercel (Recommended)

### Option A: Vercel UI (Easiest)
1. Go to **https://vercel.com/new**
2. Click "Import Git Repository"
3. Paste: `https://github.com/YOUR_USERNAME/empiria-bot`
4. Authorize Vercel
5. Configure Environment Variables (see below)
6. Click "Deploy"

### Option B: Vercel CLI
```bash
npm i -g vercel
vercel login
vercel
```

## Step 4: Set Environment Variables in Vercel

In Vercel project settings → Environment Variables, add:

| Variable | Value |
|----------|-------|
| `DISCORD_TOKEN` | Your bot token from Discord Dev Portal |
| `CLIENT_ID` | Your bot's Client ID |
| `GUILD_ID` | Your test/main server ID |
| `MONGODB_URI` | Your MongoDB connection string |
| `BOT_OWNER_ID` | `1359147702088237076` (or your ID) |

**Get Discord Bot Token:**
1. Go to https://discord.com/developers/applications
2. Select your bot
3. Click "Token" → Copy

## Step 5: Verify Deployment

After deploying to Vercel:
1. Vercel creates a unique URL for your bot (e.g., `empiria-bot.vercel.app`)
2. Bot runs 24/7 on Vercel's servers
3. Check bot status: `$ping` in Discord
4. View logs: Vercel Dashboard → your project → Deployments → Logs

## Troubleshooting

### "Bot not responding"
- Check Vercel deployment status (green = success)
- Verify environment variables are set
- Check logs: `vercel logs [project-name]`

### "MongoDB connection failed"
- Ensure `MONGODB_URI` is correct
- Add Vercel IP to MongoDB whitelist:
  - MongoDB Atlas → Network Access → Add IP → `0.0.0.0/0`

### "Missing slash commands"
- Vercel redeployed? Give it 2-3 minutes
- Run `node deploy-commands.js` locally to force sync

## Alternative Hosting Options

### Docker + Railway (5min setup, free tier)
```bash
git push
# Railway auto-detects Dockerfile
# Set environment variables in Railway Dashboard
```

### PM2 + Your VPS
```bash
npm i -g pm2
pm2 start PM2_ECOSYSTEM.config.js
pm2 logs
pm2 save
pm2 startup
```

## Performance Tips for Low Pings

✅ Already Optimized:
- Database connection pooling
- Keep-alive server on port 3000
- Lazy loading of commands
- Embed responses (faster rendering)

Monitor with:
```bash
$ping  # Shows bot latency
```

## Cost

- **Vercel Free Tier**: $0/month (up to 100 deployments)
- **MongoDB Atlas Free**: $0/month (512MB storage)
- **Total**: **FREE for 24/7 hosting!**

## Next Steps

1. Create GitHub account (if needed)
2. Fork/push this project to GitHub
3. Connect to Vercel
4. Set environment variables
5. Deploy!
6. Test with `$ping` in Discord

You're done! Your bot is now running 24/7. 🎉
