const express  = require("express");
const path     = require("path");
const session  = require("express-session");
const MongoStore    = require("connect-mongo");
const DiscordOAuth2 = require("discord-oauth2");

// Module metadata for commands page
const MODULE_META = {
  economy:      { emoji: "💰", desc: "Economy, jobs, gambling, farming, pets" },
  moderation:   { emoji: "🛡️", desc: "Ban, kick, warn, mute, automod" },
  fun:          { emoji: "🎮", desc: "Games, memes, trivia, 8ball" },
  giveaway:     { emoji: "🎉", desc: "Start, end and reroll giveaways" },
  clans:        { emoji: "⚔️", desc: "Create and manage clans" },
  government:   { emoji: "🏛️", desc: "Government, laws, taxes, budget" },
  tickets:      { emoji: "🎫", desc: "Support ticket system" },
  utility:      { emoji: "🔧", desc: "Server info, roles, settings" },
  music:        { emoji: "🎵", desc: "Play music in voice channels" },
  misc:         { emoji: "📦", desc: "Miscellaneous commands" },
  leaderboards: { emoji: "🏆", desc: "Rankings and leaderboards" },
  antinuke:     { emoji: "🔒", desc: "Anti-nuke protection" },
  automod:      { emoji: "🤖", desc: "Auto moderation rules" },
  stardust:     { emoji: "✨", desc: "Stardust special system" },
  vanityroles:  { emoji: "🎨", desc: "Custom vanity roles" },
  welcomer:     { emoji: "👋", desc: "Welcome messages" },
  pets:         { emoji: "🐾", desc: "Pet training and battles" },
  extra:        { emoji: "➕", desc: "Extra features" },
  verify:       { emoji: "✅", desc: "Verification system" },
  system:       { emoji: "⚙️", desc: "Core system commands" },
};

// Accept botManager object from server.js instead of client directly
module.exports = (botManager) => {
  const app   = express();
  const oauth = new DiscordOAuth2();

  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));
  app.use(express.static(path.join(__dirname, "public")));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const sessionConfig = {
    secret: process.env.SESSION_SECRET || "empiria-secret-key-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 604800000 },
  };
  if (process.env.MONGO_URI) {
    sessionConfig.store = MongoStore.create({ mongoUrl: process.env.MONGO_URI });
  }
  app.use(session(sessionConfig));

  const CLIENT_ID     = process.env.CLIENT_ID || "1457754742104260771";
  const CLIENT_SECRET = process.env.CLIENT_SECRET;
  const BOT_OWNER_ID  = process.env.BOT_OWNER_ID || "1359147702088237076";

  function getRedirectUri(req) {
    const host = req.get("host");
    const proto = req.headers["x-forwarded-proto"] || req.protocol;
    return `${proto}://${host}/auth/callback`;
  }

  // ── Auth middleware ─────────────────────────────────────────────────────────
  function requireLogin(req, res, next) {
    if (!req.session.user) return res.redirect("/login");
    next();
  }

  function requireOwner(req, res, next) {
    if (!req.session.user || req.session.user.id !== BOT_OWNER_ID) {
      return res.status(403).render("error", { message: "Access denied. Bot owner only.", user: req.session.user || null });
    }
    next();
  }

  // ── Home page ───────────────────────────────────────────────────────────────
  app.get("/", (req, res) => {
    const stats = botManager.getStats();
    res.render("index", {
      stats: {
        servers:  stats.guilds   || 0,
        users:    stats.users    || 0,
        commands: stats.commands || 0,
      },
      user:        req.session.user || null,
      supportLink: "https://discord.gg/9tTquEvm2K",
      inviteLink:  `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&permissions=8&integration_type=0&scope=bot`,
      voteLink:    "https://top.gg/discord/servers/809323948479131648",
    });
  });

  // ── Auth ────────────────────────────────────────────────────────────────────
  app.get("/login", (req, res) => {
    const REDIRECT_URI = getRedirectUri(req);
    const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20guilds`;
    res.redirect(url);
  });

  app.get("/auth/callback", async (req, res) => {
    const code = req.query.code;
    if (!code) return res.redirect("/");
    if (!CLIENT_SECRET) return res.redirect("/?error=no_secret");

    try {
      const REDIRECT_URI = getRedirectUri(req);
      const tokenData = await oauth.tokenRequest({
        clientId:    CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        code,
        scope:        "identify guilds",
        grantType:    "authorization_code",
        redirectUri:  REDIRECT_URI,
      });

      const user = await oauth.getUser(tokenData.access_token);
      req.session.user = user;
      res.redirect("/dashboard");
    } catch (error) {
      console.error(error);
      res.redirect("/");
    }
  });

  app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
  });

  // ── Commands ─────────────────────────────────────────────────────────────────
  app.get("/commands", (req, res) => {
    // Read commands from a static manifest if bot isn't running
    const stats    = botManager.getStats();
    const cmdCount = stats.commands || 0;

    // Build a synthetic categories list from file system if possible
    let categories = {};
    try {
      const fs   = require("fs");
      const pt   = require("path");
      const mods = pt.join(__dirname, "../src/modules");
      fs.readdirSync(mods).forEach(folder => {
        const files = fs.readdirSync(pt.join(mods, folder)).filter(f => f.endsWith(".js"));
        categories[folder] = files.map(f => {
          try {
            const cmd = require(pt.join(mods, folder, f));
            return {
              name:        cmd.name        || f.replace(".js", ""),
              description: cmd.description || "",
              usage:       cmd.usage       || `$${cmd.name || f.replace(".js", "")}`,
              aliases:     cmd.aliases     || [],
              module:      folder,
            };
          } catch { return null; }
        }).filter(Boolean);
      });
    } catch {}

    Object.keys(categories).forEach(cat =>
      categories[cat].sort((a, b) => a.name.localeCompare(b.name))
    );

    const allCommandsList = Object.values(categories).flat();

    res.render("commands", {
      categories,
      catMeta:       MODULE_META,
      totalCommands: allCommandsList.length,
      allCommandsList,
      user:          req.session.user || null,
    });
  });

  // ── Guide ────────────────────────────────────────────────────────────────────
  app.get("/guide", (req, res) => {
    res.render("guide", { user: req.session.user || null });
  });

  // ── User Dashboard ──────────────────────────────────────────────────────────
  app.get("/dashboard", requireLogin, async (req, res) => {
    let dbUser = null;
    let clan   = null;

    if (process.env.MONGO_URI) {
      try {
        const User = require("../src/database/models/User");
        const Clan = require("../src/database/models/Clan");
        dbUser = await User.findOne({ userId: req.session.user.id });
        clan   = dbUser?.clanId ? await Clan.findOne({ clanId: dbUser.clanId }) : null;
      } catch {}
    }

    res.render("dashboard", { user: req.session.user, dbUser, clan });
  });

  // ── Bot Control Panel (owner only) ─────────────────────────────────────────
  app.get("/panel", requireOwner, (req, res) => {
    res.render("control", {
      user:   req.session.user,
      status: botManager.getStatus(),
      stats:  botManager.getStats(),
      logs:   botManager.getLogs(80),
    });
  });

  // ── Error page ───────────────────────────────────────────────────────────────
  app.use((req, res) => {
    res.status(404).render("error", { message: "Page not found (404)", user: req.session.user || null });
  });

  return app;
};
