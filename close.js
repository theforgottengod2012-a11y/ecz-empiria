const Ticket = require("../../database/models/Ticket");

module.exports = {
  name: "ticketclose",

  async execute(message) {
    const ticket = await Ticket.findOne({ channelId: message.channel.id });
    if (!ticket) return;

    ticket.open = false;
    await ticket.save();

    message.channel.send("🔒 Ticket closing in 5 seconds...");
    setTimeout(() => message.channel.delete(), 5000);
  }
};
