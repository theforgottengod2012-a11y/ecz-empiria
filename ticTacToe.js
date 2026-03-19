const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  name: "tictactoe",
  aliases: ["ttt"],
  description: "Play Tic-Tac-Toe with someone!",
  usage: "$tictactoe <@user>",
  async execute(message, args, client) {
    const opponent = message.mentions.users.first();
    if (!opponent || opponent.bot || opponent.id === message.author.id) {
      return message.reply("❌ Please mention a valid user to play with.");
    }

    const board = Array(9).fill(null);
    let currentPlayer = message.author;

    const createButtons = () => {
      const rows = [];
      for (let i = 0; i < 3; i++) {
        const row = new ActionRowBuilder();
        for (let j = 0; j < 3; j++) {
          const index = i * 3 + j;
          const label = board[index] === "X" ? "X" : board[index] === "O" ? "O" : " ";
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`ttt_${index}`)
              .setLabel(label)
              .setStyle(board[index] ? (board[index] === "X" ? ButtonStyle.Primary : ButtonStyle.Danger) : ButtonStyle.Secondary)
              .setDisabled(!!board[index])
          );
        }
        rows.push(row);
      }
      return rows;
    };

    const checkWinner = () => {
      const wins = [[0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6]];
      for (const [a, b, c] of wins) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
      }
      return board.includes(null) ? null : "tie";
    };

    const msg = await message.channel.send({
      content: `🎮 **Tic-Tac-Toe**: ${message.author} vs ${opponent}\nIt's ${currentPlayer}'s turn!`,
      components: createButtons()
    });

    const collector = msg.createMessageComponentCollector({ time: 60000 });

    collector.on("collect", async i => {
      if (i.user.id !== currentPlayer.id) {
        return i.reply({ content: "It's not your turn!", ephemeral: true });
      }

      const index = parseInt(i.customId.split("_")[1]);
      board[index] = currentPlayer.id === message.author.id ? "X" : "O";

      const winner = checkWinner();
      if (winner) {
        collector.stop();
        const result = winner === "tie" ? "It's a tie!" : `${currentPlayer} won!`;
        
        if (winner !== "tie") {
          const { addMoney } = require("../../utils/economy");
          await addMoney(currentPlayer.id, 100);
        }

        return i.update({ content: `🎮 **Tic-Tac-Toe**: ${result}${winner !== "tie" ? " (Won 💰 100)" : ""}`, components: createButtons().map(r => {
          r.components.forEach(b => b.setDisabled(true));
          return r;
        }) });
      }

      currentPlayer = currentPlayer.id === message.author.id ? opponent : message.author;
      await i.update({ content: `🎮 **Tic-Tac-Toe**: ${message.author} vs ${opponent}\nIt's ${currentPlayer}'s turn!`, components: createButtons() });
    });
  }
};