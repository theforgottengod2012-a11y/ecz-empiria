module.exports = {
  name: "transcript",

  async execute(message) {
    const msgs = await message.channel.messages.fetch({ limit: 100 });
    const text = msgs.map(m => `${m.author.tag}: ${m.content}`).join("\n");

    require("fs").writeFileSync("transcript.txt", text);
    message.channel.send({ files: ["transcript.txt"] });
  }
};
