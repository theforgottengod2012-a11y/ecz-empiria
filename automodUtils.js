// Scam link patterns
const SCAM_PATTERNS = [
  /nitro\s*(free|code|gift|generator)/i,
  /free\s*(nitro|steam|game|robux)/i,
  /click\s*(here|link|now|here)/i,
  /(steam|steam\.com|getnitro\.com|freegiftcard)/i,
  /verify\s*(account|steam|discord)/i,
  /(bit\.ly|tinyurl|shortened\.link|short\.link)/i // shortened URLs
];

const WHITELISTED_DOMAINS = [
  "discord.com",
  "discordapp.com", 
  "youtube.com",
  "youtu.be",
  "twitter.com",
  "twitch.tv",
  "spotify.com",
  "imgur.com",
  "github.com"
];

exports.isScamLink = (content) => {
  for (const pattern of SCAM_PATTERNS) {
    if (pattern.test(content)) return true;
  }
  return false;
};

exports.isInviteLink = (content) => {
  return /(discord\.gg|discord\.com\/invite|invite\.gg)\//i.test(content);
};

exports.containsBlacklistedWord = (content, blacklist) => {
  const words = content.toLowerCase().split(/\s+/);
  return words.find(word => blacklist.includes(word.toLowerCase()));
};

exports.countCapsPercentage = (str) => {
  const letters = str.match(/[a-zA-Z]/g) || [];
  if (letters.length === 0) return 0;
  const caps = letters.filter(c => c === c.toUpperCase()).length;
  return Math.round((caps / letters.length) * 100);
};

exports.countEmojis = (str) => {
  const emojiRegex = /(\u00d7|\u20e3|[\u2300-\u23ff]|[\u2600-\u27bf]|[\ud83c][\udc00-\udfff]|[\ud83d][\udc00-\ude4f])/g;
  return (str.match(emojiRegex) || []).length;
};

exports.WHITELISTED_DOMAINS = WHITELISTED_DOMAINS;
