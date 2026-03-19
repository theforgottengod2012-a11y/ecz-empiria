const { EmbedBuilder } = require("discord.js");
const Event = require("../../database/models/Event");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  name: "event",
  description: "Create and manage server events",
  permissions: ["ManageGuild"],
  async execute(message, args) {
    const sub = args[0]?.toLowerCase();

    if (sub === "create") {
      const name = args[1];
      const type = args[2]; // movie, gaming, tournament, etc
      const timeStr = args[3]; // 1h, 2h, etc

      if (!name || !type || !timeStr) {
        return message.reply("❌ Usage: `$event create <name> <type> <time>` (e.g., `$event create Movie movie 2h`)");
      }

      const ms = require("ms");
      const duration = ms(timeStr);
      if (!duration) return message.reply("❌ Invalid time format.");

      const eventId = uuidv4();
      const startsAt = new Date();
      const endsAt = new Date(Date.now() + duration);

      const event = await Event.create({
        guildId: message.guild.id,
        eventId,
        name,
        type,
        description: args.slice(4).join(" ") || "No description",
        startsAt,
        endsAt,
        createdBy: message.author.id,
        status: "scheduled"
      });

      const embed = new EmbedBuilder()
        .setTitle(`🎉 ${name} Event`)
        .setDescription(`**Type:** ${type}\n**Starts:** <t:${Math.floor(startsAt.getTime() / 1000)}:R>\n**Ends:** <t:${Math.floor(endsAt.getTime() / 1000)}:R>`)
        .setColor("#5865F2")
        .setFooter({ text: `Event ID: ${eventId}` });

      const msg = await message.channel.send({ embeds: [embed] });

      event.messageId = msg.id;
      await event.save();

      await msg.react("👍");
      message.reply(`✅ Event **${name}** created!`);
    }

    if (sub === "list") {
      const events = await Event.find({ guildId: message.guild.id, status: { $ne: "completed" } });

      if (events.length === 0) {
        return message.reply("📅 No upcoming events.");
      }

      const embed = new EmbedBuilder()
        .setTitle("📅 Server Events")
        .setColor("#5865F2");

      events.forEach(e => {
        embed.addFields({
          name: `${e.name} (${e.type})`,
          value: `Starts: <t:${Math.floor(e.startsAt.getTime() / 1000)}:R> | ${e.participants.length} joined`,
          inline: false
        });
      });

      message.reply({ embeds: [embed] });
    }

    if (sub === "join") {
      const eventId = args[1];
      const event = await Event.findOne({ eventId });

      if (!event) return message.reply("❌ Event not found.");
      if (event.participants.includes(message.author.id)) return message.reply("✅ Already joined this event!");

      event.participants.push(message.author.id);
      await event.save();

      message.reply(`✅ Joined **${event.name}**! Total participants: ${event.participants.length}`);
    }

    if (sub === "start") {
      const eventId = args[1];
      const event = await Event.findOne({ eventId });

      if (!event) return message.reply("❌ Event not found.");
      if (event.status !== "scheduled") return message.reply("❌ Event already started.");

      event.status = "live";
      await event.save();

      message.reply(`🔴 **${event.name}** is now LIVE! ${event.participants.length} people are participating!`);
    }

    if (sub === "end") {
      const eventId = args[1];
      const event = await Event.findOne({ eventId });

      if (!event) return message.reply("❌ Event not found.");

      event.status = "completed";
      await event.save();

      message.reply(`✅ **${event.name}** event ended! Final participants: ${event.participants.length}`);
    }
  }
};
