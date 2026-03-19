const { getUser, addMoney, removeMoney, checkCooldown } = require("../../utils/economy");
const HIGHLOW_COOLDOWN = 10*1000;

module.exports = {
  name: "highlow",
  aliases: ["hl"],
  description: "Guess if dice is high (4-6) or low (1-3)",
  module: "economy",

  async execute(message, args, client){
    const userId = message.author.id;
    const bet = parseInt(args[0]);
    const MAX_BET = 250000;
    const guess = args[1]?.toLowerCase();
    if(!bet||bet<=0||bet > MAX_BET||!guess||!["high","low"].includes(guess)) return message.reply(`❌ Usage: \`$highlow <high|low> <amount>\` (Max: 💵 ${MAX_BET})`);

    const user = await getUser(userId);
    if(user.wallet<bet) return message.reply("❌ Not enough money");

    const timeLeft = await checkCooldown(userId,"highlow",HIGHLOW_COOLDOWN);
    if(timeLeft>0) return message.reply("⏳ Wait a few seconds before playing again");

    const roll = Math.floor(Math.random()*6)+1;
    let winnings=0;
    const result = roll>=4?"high":"low";

    if(result===guess){ winnings=bet*2; await addMoney(userId,winnings); }
    else await removeMoney(userId,bet);

    message.reply({
      embeds:[{
        title:"🎲 HighLow",
        color:winnings>0?0x57f287:0xed4245,
        fields:[
          {name:"Your guess", value:guess, inline:true},
          {name:"Roll result", value:roll.toString(), inline:true},
          {name:"Winnings", value:winnings>0?`💵 ${winnings}`:"💀 Lost", inline:true}
        ]
      }]
    });
  }
};
