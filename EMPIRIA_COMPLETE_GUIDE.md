# 🤖 EMPIRIA - Complete Feature & Command Guide

## Table of Contents
1. [About Empiria](#about-empiria)
2. [10 Core Systems](#10-core-systems)
3. [Complete Command Reference](#complete-command-reference)
4. [Prefix & Slash Commands](#prefix--slash-commands)
5. [Tips & Tricks](#tips--tricks)

---

## About Empiria

**Empiria v2 Advanced** is a sophisticated, all-in-one Discord bot designed to be your server's complete operating system. It handles moderation, economy, governance, entertainment, events, and community management—all in one bot.

### Key Features at a Glance
- 🛡️ **Advanced Moderation** with auto-escalation warnings
- 🤖 **Intelligent AutoMod** with 6 detection types
- 💰 **Deep Economy System** with jobs, crimes, and gambling
- 🏛️ **Real Government Simulation** with taxation and budgets
- ⭐ **Leveling/XP System** with leaderboards
- 📨 **Invite Tracking** with fake invite detection
- 🎉 **Giveaways** with advanced requirements
- 🎫 **Ticket System** with claim support
- 🎭 **Reaction Roles** with persistent panels
- 📅 **Event System** for hosting server activities

---

# 10 Core Systems

## 1. 🛡️ MODERATION & SECURITY SYSTEM

The most powerful moderation system for managing your server.

### Features
- **Warning System**: Track warnings per user with dates, reasons, and moderators
- **Auto-Escalation**: Automatically alert mods at 3, 5, and 7 warnings
- **Case Tracking**: Every moderation action gets a unique case ID
- **Comprehensive Logging**: All actions recorded in database

### Commands

#### Warning Commands
| Command | Usage | Description |
|---------|-------|-------------|
| `/warn` | `/warn <user> [reason]` | Warn a member (tracks in database) |
| `/warnlist` | `/warnlist <user>` | View all warnings for a user |
| `/removewarn` | `/removewarn <user> <warning_number>` | Remove a specific warning |
| `$warnings` | `$warnings [@user]` | View warnings (prefix version) |

#### Punishment Commands
| Command | Usage | Description |
|---------|-------|-------------|
| `$ban` | `$ban <user> [reason]` | Ban a user from server |
| `$kick` | `$kick <user> [reason]` | Kick a user from server |
| `/timeout` | `/timeout <user> <duration> [reason]` | Timeout (mute) a user |
| `$timeout` | `$timeout <user> <time> [reason]` | Prefix version of timeout |
| `$jail` | `$jail <user>` | Send user to jail role |
| `$unjail` | `$unjail <user>` | Release user from jail |

#### Case & Logging Commands
| Command | Usage | Description |
|---------|-------|-------------|
| `$case` | `$case <caseId>` | View details of a specific case |
| `$cases` | `$cases [@user]` | View all cases for a user |
| `$logs` | `$logs [@user] [action]` | View moderation logs (advanced filter) |

#### Channel Management
| Command | Usage | Description |
|---------|-------|-------------|
| `$lock` | `$lock` | Lock current channel (prevent messages) |
| `$unlock` | `$unlock` | Unlock current channel |
| `$lockdown` | `$lockdown` | Lock entire server |
| `$lockdown_server` | `$lockdown_server off` | Disable server lockdown |
| `$clear` | `$clear <amount>` | Delete messages in bulk |
| `$nuke` | `$nuke` | Nuke (delete and recreate) channel |

### How It Works

```
User Warned → Database Tracked → Auto-Escalation Check → Mod Alerted
        ↓
   3 Warnings → "⚠️ Timeout recommended"
   5 Warnings → "🚨 Kick recommended"
   7 Warnings → "⛔ Ban recommended"
```

### Example Workflow
```
1. $warn @User Spamming messages
   → Case #1 created, User has 1/7 warnings
   
2. $warn @User Spam continued
   → Case #2 created, User has 2/7 warnings
   
3. $warn @User More spam
   → Case #3 created, User has 3/7 warnings
   → Bot alerts: "⚠️ Timeout recommended"
   
4. $timeout @User 1h Spam violation
   → User timed out, Case #4 created
   
5. $removewarn @User 2
   → Warning #2 removed, User now has 3/7 warnings
```

---

## 2. 🤖 AUTOMOD SYSTEM

Automated moderation that runs 24/7 to keep your server clean.

### Detection Types
1. **Spam Detection** - Multiple messages in short time
2. **Invite Links** - Discord server invites (can be disabled per channel)
3. **Scam Links** - Phishing, nitro generators, suspicious URLs
4. **Caps Spam** - Messages with excessive capital letters
5. **Emoji Spam** - Too many emojis in one message
6. **Blacklisted Words** - Custom banned words

### Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `$automod status` | Shows all automod settings | View current configuration |
| `$automod enable` | Turn on all filters | Enable automod |
| `$automod disable` | Turn off all filters | Disable automod |
| `$automod filter <type>` | `$automod filter spam` | Toggle a specific filter (on/off) |
| `$automod filter spam on` | Explicitly enable spam detection | Fine-grained control |
| `$automod filter capslock disable` | Disable caps detection | Turn off specific filter |
| `$automod punishment <level> <action>` | `$automod punishment level1 warn` | Set punishment for violation level |
| `$automod blacklist add <word>` | Add word to blacklist | Ban specific words |
| `$automod blacklist remove <word>` | Remove from blacklist | Remove banned word |
| `$automod spamsettings <sensitivity> <timewindow>` | `$automod spamsettings 5 10` | Tune spam detection (5-10 msgs in 10 seconds) |
| `$automod logs <#channel>` | Set log channel | Where automod logs violations |

### Punishment Ladder
```
Violation 1 → Level 1 Punishment (default: WARN)
Violation 2 → Level 2 Punishment (default: MUTE)
Violation 3 → Level 3 Punishment (default: TIMEOUT)
Violation 4+ → Level 4 Punishment (default: KICK)
```

### Configuration Example
```
$automod enable                                    (Turn on AutoMod)
$automod filter invites on                         (Block invite links)
$automod filter scamlinks on                       (Block suspicious links)
$automod punishment level1 warn                    (First violation = warn)
$automod punishment level2 timeout                 (Second violation = timeout)
$automod spamsettings 3 5                          (3+ msgs in 5 seconds = spam)
$automod blacklist add scamword                    (Add to blacklist)
$automod logs #automod-logs                        (Set log channel)
```

---

## 3. 🎉 GIVEAWAY SYSTEM

Host giveaways with advanced requirements and professional UI.

### Features
- **Requirements**: Invite count, Level, Role, Account age
- **Persistent**: Giveaways continue if bot restarts
- **Automated**: Auto-picks winners when time expires
- **Reroll Support**: Pick new winners if needed

### Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `$gstart` | `$gstart <time> <winners> <prize>` | Start a basic giveaway |
| `$gstart` | `$gstart 1h 1 Nitro --invites 3 --level 5 --role @Member` | Giveaway with requirements |
| `$gend` | `$gend <messageId>` | End a giveaway early |
| `$greroll` | `$greroll <messageId>` | Pick new winner(s) |

### Requirements Syntax
```
$gstart 24h 1 "Discord Nitro" --invites 5
   Time: 24 hours
   Winners: 1
   Prize: Discord Nitro
   Required: 5 invites to server

$gstart 48h 3 "Premium Role" --level 10 --role @VIP
   Time: 48 hours
   Winners: 3
   Prize: Premium Role
   Required: Level 10 AND @VIP role
```

### Example Giveaway Setup
```
1. $gstart 24h 1 Nitro Classic --invites 3 --level 5
2. Bot posts giveaway with requirements
3. Users react with 🎉 to enter (if they meet requirements)
4. After 24 hours, bot picks random winner
5. $greroll <messageId> to pick new winner if needed
```

---

## 4. 🎫 TICKET SYSTEM

Professional support ticket management with categories and claims.

### Features
- **Categories**: Support, Report, Appeal, Partnership
- **Claim System**: Staff claim tickets to handle
- **Transcripts**: Save ticket conversation history
- **Status Tracking**: Open → Claimed → Closed

### Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `$ticket setup` | Creates ticket panel in current channel | Setup support system |

### How to Use

1. **Setup**
   ```
   $ticket setup
   → Bot posts ticket panel with dropdown
   ```

2. **User Opens Ticket**
   - User clicks dropdown → Selects category (Support/Report/Appeal/Partnership)
   - Bot creates private channel: `ticket-category-username`
   - User and staff can discuss

3. **Staff Manages Ticket**
   - Click **Claim** button → Staff takes ownership
   - Handle user's issue in the channel
   - Click **Close** button → Channel deleted in 5 seconds

---

## 5. 💰 ECONOMY SYSTEM

Deep economy with jobs, crimes, gambling, farming, and government taxes.

### Core Features
- **Wallet & Bank**: Money management with interest
- **Jobs**: Earn steady income (Miner, Programmer, Doctor)
- **Crimes**: High-risk, high-reward actions with injury chance
- **Gambling**: Multiple games with tax mechanics
- **Farming**: Plant crops, grow fields
- **Pets**: Breed, train, battle creatures
- **Clans**: Team up with friends

### Commands

#### Basic Economy
| Command | Usage | Description |
|---------|-------|-------------|
| `$balance` | View your money | Check wallet & bank balance |
| `$daily` | Claim daily reward | Free money (taxed by government) |
| `$work` | Earn from work | Answer trivia for money |
| `$deposit <amount>` | Move wallet → bank | Save money safely |
| `$withdraw <amount>` | Move bank → wallet | Access your savings |

#### Jobs System
| Command | Usage | Description |
|---------|-------|-------------|
| `$jobs` | List all jobs | See available positions |
| `$jobs miner` | Apply for job | Become a Miner (Level 1) |
| `$jobs programmer` | Apply for job | Programmer role (Level 5) |
| `$jobs doctor` | Apply for job | Doctor role (Level 10) |

#### Crime System
| Command | Usage | Description |
|---------|-------|-------------|
| `$crime` | Commit a crime | 50% success rate, high reward, injury risk |
| `$heal` | Get medical care | Cure injuries at hospital |

#### Gambling
| Command | Usage | Description |
|---------|-------|-------------|
| `$coinflip <heads/tails> <amount>` | Flip a coin | Simple 50/50 bet |
| `$coinflip_vs <@user> <amount>` | Challenge a player | Head-to-head coinflip |
| `$blackjack <amount>` | Play vs dealer | Classic card game |
| `$slots <amount>` | Spin the slots | Lucky winner gambles |
| `$roulette <number> <amount>` | Bet on number | Roulette wheel |
| `$dicegame <amount>` | Roll dice | 50/50 game |

#### Custom Roles
| Command | Usage | Description |
|---------|-------|-------------|
| `$customrename <name>` | Rename custom role | Change your role's name |
| `$customhex <#FFFFFF>` | Change role color | Set hex color code |
| `$customicon <url>` | Set role icon | Add emoji to role |

### Economy Flow
```
Earn Money (daily/work/crime) 
   ↓
Taxes Collected (government takes %)
   ↓
Net Amount to Wallet
   ↓
Spend (gamble, heal, items)
```

### Tax Example
```
$daily → Earn $1000
Government has 10% income tax
Taxes: $100 → Treasury
You get: $900 → Wallet

$coinflip heads 500 → Win $1000
Government has 25% gambling tax
Taxes: $250 → Treasury
You get: $750 → Wallet
```

---

## 6. 📊 LOGGING SYSTEM

Automatic logging of all important server actions.

### Features
- **Auto-Logging**: Every moderation & economy action logged
- **Searchable**: Filter by user, action type, date
- **Detailed Metadata**: Reasons, targets, amounts, results

### Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `$logs` | View latest 10 logs | See recent server activity |
| `$logs @user` | View logs for user | See specific user's history |
| `$logs warn` | View warn logs only | Filter by action type |
| `$logs @user crime` | User's crimes only | Combined filters |

### What Gets Logged
- ✅ Warnings issued
- ✅ Timeouts/bans/kicks
- ✅ Crimes committed
- ✅ Healing (hospital visits)
- ✅ Money transactions
- ✅ Level-ups
- ✅ Custom role changes

---

## 7. ⭐ LEVELING/XP SYSTEM

Automatic progression as users chat in your server.

### Features
- **Auto XP**: +5 XP per message (any channel)
- **Level Progression**: 100 XP = 1 level
- **Notifications**: Server announcement on level-up
- **Leaderboards**: Track top members

### Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `$leaderboard xp` | View top leveled users | See leaderboard by level |
| `$leaderboard wallet` | View richest members | See economy leaderboard |
| `/rank` | View your rank card | (Coming soon: visual cards) |

### XP Progression
```
Level 1: 0-100 XP
Level 2: 100-200 XP
Level 3: 200-300 XP
...
Level 10: 900-1000 XP
Level 100: 9900-10000 XP
```

### Example
```
User sends 20 messages in a day
20 messages × 5 XP = 100 XP earned
🎉 User leveled up to Level 2!
```

---

## 8. 📨 INVITE TRACKER SYSTEM

Track who's inviting people and identify fake invites.

### Features
- **Invite Tracking**: Records every server join
- **Fake Detection**: Spots invites from users who leave quickly
- **Leaderboards**: Rank top inviters
- **Per-Guild**: Tracks separately for each server

### Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `$invites` | Check your invites | See how many people you invited |
| `$invites @user` | Check user's invites | See someone else's invite count |
| `$inviteleaderboard` | Top inviters | Global leaderboard |

### How It Works
```
User A invites User B
  → Recorded: A invited B
  
If B stays 1+ week
  → Valid invite ✅
  
If B leaves in 1 hour
  → Fake invite (detected) ❌
  → Doesn't count toward A's score
```

---

## 9. 🎭 REACTION ROLE SYSTEM

Let members assign themselves roles via dropdown menu.

### Features
- **Select Menu UI**: Professional dropdown interface
- **Persistent**: Panels survive bot restarts
- **Easy Setup**: Add/remove roles on the fly
- **Toggle**: Click to add/remove roles

### Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `$rrole panel` | Create reaction role panel | Setup new panel |
| `$rrole add <msgId> <@role> <emoji>` | Add role to panel | Add new role |
| `$rrole remove <msgId> <@role>` | Remove role from panel | Remove role |

### Setup Example
```
1. $rrole panel
   → Bot creates panel message
   → Returns: Message ID: 123456789

2. $rrole add 123456789 @Gamer 🎮
   → Add Gamer role with 🎮 emoji

3. $rrole add 123456789 @Artist 🎨
   → Add Artist role with 🎨 emoji

4. $rrole add 123456789 @Music 🎵
   → Add Music role with 🎵 emoji

Now users can:
- Click dropdown
- Select "Gamer" → Role added
- Select "Gamer" again → Role removed
```

---

## 10. 📅 EVENT SYSTEM

Host server activities with built-in participant tracking.

### Features
- **Event Types**: Movies, Gaming, Tournaments, Custom
- **Scheduling**: Plan events for future times
- **Participant Tracking**: See who's joining
- **Status Management**: Scheduled → Live → Completed

### Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `$event create <name> <type> <time>` | Create event | `$event create MovieNight movie 2h` |
| `$event list` | View upcoming events | See all active events |
| `$event join <eventId>` | Participate in event | Sign up for event |
| `$event start <eventId>` | Go live | Event is now happening |
| `$event end <eventId>` | Finish event | Complete event & show stats |

### Event Example
```
1. $event create "Minecraft Night" gaming 3h
   → Creates event lasting 3 hours
   → Returns: Event ID: abc123

2. $event list
   → Shows: Minecraft Night [SCHEDULED] - 3 participants

3. User joins: $event join abc123
   → Participant count increases

4. Admin: $event start abc123
   → Status: LIVE
   → Announcement sent to server

5. Later: $event end abc123
   → Status: COMPLETED
   → Final count: 10 participants
```

---

## COMPLETE COMMAND REFERENCE

### Prefix vs Slash Commands

**Prefix Commands** (use `$` or mention bot)
```
$warn @user spam
$automod status
$crime
$balance
```

**Slash Commands** (use `/`)
```
/warn target:@user reason:spam
/timeout target:@user duration:1h reason:spam
/automod filter type:spam
```

### All Commands by Category

#### MODERATION (20+ commands)
- `$ban`, `$kick`, `/timeout`, `$unjail`
- `/warn`, `/warnlist`, `/removewarn`
- `$case`, `$cases`, `$logs`
- `$lock`, `$unlock`, `$lockdown`, `$clear`, `$nuke`
- `$jail`, `$softban`, `$purgeuser`
- `$slowmode`, `$nick`, `$addrole`, `$removerole`

#### AUTOMOD
- `$automod` (status, enable, disable, filter, punishment, blacklist, spamsettings, logs)

#### ECONOMY (30+ commands)
- **Basics**: `$balance`, `$daily`, `$work`, `$deposit`, `$withdraw`
- **Jobs**: `$jobs`
- **Crime**: `$crime`, `$heal`
- **Gambling**: `$coinflip`, `$coinflip_vs`, `$blackjack`, `$slots`, `$roulette`, `$dicegame`
- **Custom**: `$customrename`, `$customhex`, `$customicon`
- **Other**: `$leaderboard`, `$balance`, `$prestige`

#### SYSTEM
- `$logs`, `$invites`, `$inviteleaderboard`
- `$ticket`, `$gstart`, `$gend`, `$greroll`
- `$rrole`, `$event`

---

## Tips & Tricks

### 1. Moderation Pro Tips
- Use `/warnlist @user` before deciding on punishment
- Set up `/timeout` before banning for repeat offenders
- Review `$logs` regularly to spot patterns
- Use `$lockdown` during raids

### 2. Economy Tips
- Always check `$balance` before gambling big
- Use `$daily` + `$work` for steady income
- `$crime` is risky - good for quick money but injury chance
- Join events to earn rewards
- Build wealth through `$deposit` (save to bank)

### 3. Leveling Tips
- Active users naturally level fast
- Encourage participation for XP growth
- Check `$leaderboard xp` to see engagement
- Rewards for high levels coming soon!

### 4. AutoMod Tips
- Use `$automod filter spam on` to catch bots early
- Add common spam words to blacklist
- Set appropriate sensitivity (default: 3 msgs in 5 sec)
- Monitor logs to fine-tune settings

### 5. Event Tips
- Use `$event create` before big announcements
- Start with `/event start` when ready
- Check participants with `$event list`
- End properly with `$event end` for stats

### 6. Giveaway Tips
- Use `--invites 3` to reward referrals
- Use `--level 5` to engage leveling system
- Reroll with `$greroll` if winner inactive
- Long durations (24h+) get more entries

### 7. Ticket Tips
- Setup categories matching support needs
- Check `$logs` for ticket handle time
- Use claim button to assign staff responsibility
- Closing auto-deletes old conversations

---

## Government System (Bonus)

### How It Works
```
Members earn money → Taxes automatically collected → Money to treasury
                                    ↓
                           Government allocates to budgets
                                    ↓
              Citizens receive bonuses from spending
```

### Tax Types
- **Income Tax**: On daily rewards & work earnings
- **Gambling Tax**: On game winnings
- **Capital Gains**: On special earnings
- **Business Tax**: On business income
- **Wealth Tax**: On accumulated money

### Budget Categories
- **Welfare**: +5% bonus on daily rewards
- **Healthcare**: -50% cost for hospital visits
- **Education**: +3% bonus on daily rewards
- **Defense**: Protection from raids
- **Infrastructure**: Faster cooldowns

---

## Frequently Asked Questions

**Q: Why did I get timed out by AutoMod?**
A: You triggered a filter (spam, caps, bad word, etc). Check `$logs` to see why.

**Q: How do I get a custom role?**
A: Purchase with `$buy customrole`, then use `$customrename`, `$customhex`, `$customicon`.

**Q: Can I transfer money to another player?**
A: Not yet - coming in future update. For now, gamble against them or contribute to clans.

**Q: How are invites tracked?**
A: Automatically when someone joins. If they leave within days, marked as fake.

**Q: Do I keep XP between servers?**
A: No - XP is server-specific. Encourages engagement in each community.

**Q: How do taxes work?**
A: Automatic deduction when you earn money. View government `/treasury` to see where money goes.

---

## Need Help?

- Use `$help` for quick command list
- Mention bot for status info: `@Empiria`
- Check logs: `$logs @yourname`
- Review settings: `$automod status`

**Empiria is your server's complete operating system!** 🚀

