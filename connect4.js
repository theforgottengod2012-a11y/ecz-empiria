const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  name: "connect4",
  aliases: ["c4"],
  description: "Play Connect 4 with someone!",
  usage: "$connect4 <@user>",
  async execute(message, args, client) {
    const opponent = message.mentions.users.first();
    if (!opponent || opponent.bot || opponent.id === message.author.id) {
      return message.reply("❌ Please mention a valid user to play with.");
    }

    const board = Array(6).fill(null).map(() => Array(7).fill("⚪"));
    let currentPlayer = message.author;
    const emojis = { [message.author.id]: "🔴", [opponent.id]: "🟡" };

    const getDisplay = () => board.map(row => row.join("")).join("\n");

    const createButtons = () => {
      const row = new ActionRowBuilder();
      for (let i = 0; i < 7; i++) {
        row.addComponents(new ButtonBuilder().setCustomId(`c4_${i}`).setLabel(`${i + 1}`).setStyle(ButtonStyle.Secondary));
      }
      return [row];
    };

    const checkWinner = (r, c) => {
      const p = emojis[currentPlayer.id];
      const check = (dr, dc) => {
        let count = 0;
        for (let i = -3; i <= 3; i++) {
          const nr = r + i * dr, nc = c + i * dc;
          if (nr >= 0 && nr < 6 && nc >= 0 && nc < 7 && board[nr][nc] === p) {
            if (++count >= 4) return true;
          } else count = 0;
        }
        return false;
      };
      return check(0, 1) || check(1, 0) || check(1, 1) || check(1, -1);
    };

    const msg = await message.channel.send({
      content: `🎮 **Connect 4**: ${message.author} vs ${opponent}\n${getDisplay()}\nIt's ${currentPlayer}'s turn!`,
      components: createButtons()
    });

    const collector = msg.createMessageComponentCollector({ time: 120000 });

    collector.on("collect", async i => {
      if (i.user.id !== currentPlayer.id) return i.reply({ content: "Not your turn!", ephemeral: true });

      const col = parseInt(i.customId.split("_")[1]);
      let row = -1;
      for (let r = 5; r >= 0; r--) {
        if (board[r][col] === "⚪") {
          row = r;
          break;
        }
      }

      if (row === -1) return i.reply({ content: "Column full!", ephemeral: true });

      board[row][col] = emojis[currentPlayer.id];
      if (checkWinner(row, col)) {
        collector.stop();
        const { addMoney } = require("../../utils/economy");
        await addMoney(currentPlayer.id, 200);
        return i.update({ content: `🎉 **${currentPlayer} won Connect 4!** (Won 💰 200)\n${getDisplay()}`, components: [] });
      }

      if (board.every(r => r.every(cell => cell !== "⚪"))) {
        collector.stop();
        return i.update({ content: `🤝 **Connect 4 Tie!**\n${getDisplay()}`, components: [] });
      }

      currentPlayer = currentPlayer.id === message.author.id ? opponent : message.author;
      await i.update({ content: `🎮 **Connect 4**: ${message.author} vs ${opponent}\n${getDisplay()}\nIt's ${currentPlayer}'s turn!`, components: createButtons() });
    });
  }
};