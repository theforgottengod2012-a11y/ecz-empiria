const Ticket = require("../database/models/Ticket");
const ReactionRole = require("../database/models/ReactionRole");
const Event = require("../database/models/Event");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

async function createTicket(interaction, type) {
  try {
    const channel = await interaction.guild.channels.create({
      name: `ticket-${type}-${interaction.user.username}`,
      type: 0,
      permissionOverwrites: [
        { id: interaction.guild.id, deny: ["ViewChannel"] },
        { id: interaction.user.id, allow: ["ViewChannel", "SendMessages"] }
      ]
    });

    await Ticket.create({
      guildId: interaction.guild.id,
      channelId: channel.id,
      userId: interaction.user.id,
      type
    });

    const embed = new EmbedBuilder()
      .setTitle(`🎫 ${type.toUpperCase()} TICKET`)
      .setDescription(`Hello <@${interaction.user.id}>, staff will be with you shortly.\n\n**Category:** ${type}`)
      .setColor("Blue");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("claim_ticket").setLabel("Claim").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("close_ticket").setLabel("Close").setStyle(ButtonStyle.Danger)
    );

    await channel.send({ content: `<@${interaction.user.id}> | Staff`, embeds: [embed], components: [row] });
    await interaction.reply({ content: `✅ Ticket created: ${channel}`, ephemeral: true });
  } catch (err) {
    console.error(err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: "❌ Error creating ticket.", ephemeral: true }).catch(() => {});
    }
  }
}

// ── Demotion button handler ───────────────────────────────────────────────────
async function handleDemotionButton(interaction, action, pendingId) {
  const PendingDemotion = require("../database/models/PendingDemotion");
  const ModTracker      = require("../database/models/ModTracker");
  const ModActivity     = require("../database/models/ModActivity");

  const pending = await PendingDemotion.findById(pendingId).catch(() => null);
  if (!pending || pending.status !== "pending") {
    return interaction.reply({
      content: "❌ This demotion request no longer exists or has already been processed.",
      ephemeral: true
    });
  }

  const cfg = await ModTracker.findOne({ guildId: pending.guildId });

  // Permission check
  const canDecide =
    interaction.member.permissions.has("Administrator") ||
    (cfg?.confirmationRoleIds || []).some(id => interaction.member.roles.cache.has(id));

  if (!canDecide) {
    return interaction.reply({
      content: "❌ You don't have permission to handle demotion confirmations.",
      ephemeral: true
    });
  }

  if (action === "cancel") {
    pending.status    = "cancelled";
    pending.decidedBy = interaction.user.id;
    await pending.save();

    await ModActivity.findOneAndUpdate(
      { guildId: pending.guildId, userId: pending.userId },
      { pendingDemotion: false }
    );

    const cancelEmbed = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(0x00c851)
      .setTitle("✅ Demotion Cancelled")
      .setFooter({ text: `Cancelled by ${interaction.user.tag} • ${new Date().toLocaleString()}` });

    return interaction.update({ embeds: [cancelEmbed], components: [] });
  }

  if (action === "confirm") {
    const guild  = interaction.guild;
    const member = await guild.members.fetch(pending.userId).catch(() => null);

    if (!member) {
      pending.status    = "cancelled";
      pending.decidedBy = interaction.user.id;
      await pending.save();
      return interaction.update({
        content: "❌ Member not found in server — demotion cancelled.",
        embeds: [],
        components: []
      });
    }

    // Remove current role
    const currentRole = guild.roles.cache.get(pending.currentRoleId);
    if (currentRole) {
      await member.roles.remove(currentRole).catch((err) => {
        console.error("[Demotion] Failed to remove role:", err.message);
      });
    }

    // Add target role (null = full demotion to member)
    if (pending.targetRoleId) {
      const targetRole = guild.roles.cache.get(pending.targetRoleId);
      if (targetRole) {
        await member.roles.add(targetRole).catch((err) => {
          console.error("[Demotion] Failed to add role:", err.message);
        });
      }
    }

    pending.status    = "confirmed";
    pending.decidedBy = interaction.user.id;
    await pending.save();

    await ModActivity.findOneAndUpdate(
      { guildId: pending.guildId, userId: pending.userId },
      { consecutiveFailDays: 0, pendingDemotion: false }
    );

    const targetRole = pending.targetRoleId ? guild.roles.cache.get(pending.targetRoleId) : null;
    const confirmEmbed = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(0xff4444)
      .setTitle("⬇️ Demotion Confirmed & Executed")
      .setDescription(
        `<@${pending.userId}> has been demoted from ${currentRole ? `**${currentRole.name}**` : "their role"} ` +
        `to ${targetRole ? `**${targetRole.name}**` : "**Member** (all staff roles removed)"}.`
      )
      .setFooter({ text: `Confirmed by ${interaction.user.tag} • ${new Date().toLocaleString()}` });

    return interaction.update({ embeds: [confirmEmbed], components: [] });
  }
}

module.exports = {
  name: "interactionCreate",
  once: false,
  async execute(interaction, client) {

    // ── String select menus ─────────────────────────────────────────────────
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === "ticket_select") {
        const type = interaction.values[0];
        await createTicket(interaction, type);
        return;
      }

      if (interaction.customId.startsWith("rr_")) {
        const messageId = interaction.customId.split("_")[1];
        const roleId    = interaction.values[0];
        const rrole     = await ReactionRole.findOne({ messageId });
        if (!rrole) return interaction.reply({ content: "❌ Role panel not found.", ephemeral: true });

        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) return interaction.reply({ content: "❌ Role not found.", ephemeral: true });

        try {
          if (interaction.member.roles.cache.has(roleId)) {
            await interaction.member.roles.remove(role);
            await interaction.reply({ content: `✅ Removed **${role.name}**`, ephemeral: true });
          } else {
            await interaction.member.roles.add(role);
            await interaction.reply({ content: `✅ Added **${role.name}**`, ephemeral: true });
          }
        } catch {
          await interaction.reply({ content: "❌ Failed to manage role.", ephemeral: true });
        }
        return;
      }
    }

    // ── Buttons ─────────────────────────────────────────────────────────────
    if (interaction.isButton()) {
      const { customId } = interaction;

      // Demotion confirmation/cancellation
      if (customId.startsWith("demotion_confirm_") || customId.startsWith("demotion_cancel_")) {
        const parts    = customId.split("_");
        const action   = parts[1]; // "confirm" or "cancel"
        const pendingId = parts.slice(2).join("_"); // MongoDB ObjectId
        await handleDemotionButton(interaction, action, pendingId);
        return;
      }

      if (customId === "claim_ticket") {
        const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
        if (!ticket) return interaction.reply({ content: "❌ Ticket not found.", ephemeral: true });
        if (ticket.status !== "open") return interaction.reply({ content: "❌ Ticket already claimed.", ephemeral: true });

        ticket.status    = "claimed";
        ticket.claimedBy = interaction.user.id;
        await ticket.save();

        const embed = new EmbedBuilder()
          .setDescription(`👤 Ticket claimed by <@${interaction.user.id}>`)
          .setColor("Green");
        await interaction.reply({ embeds: [embed] });
        return;
      }

      if (customId === "close_ticket") {
        const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
        if (!ticket) return interaction.reply({ content: "❌ Ticket not found.", ephemeral: true });

        ticket.status   = "closed";
        ticket.closedAt = new Date();
        await ticket.save();

        await interaction.reply("🔒 Closing ticket in 5 seconds...");
        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
        return;
      }

      if (customId === "confirm_nuke") {
        if (!interaction.member.permissions.has("Administrator")) {
          return interaction.reply({ content: "❌ Permissions missing.", ephemeral: true });
        }
        const channel  = interaction.channel;
        const position = channel.position;
        try {
          const newChannel = await channel.clone();
          await channel.delete();
          await newChannel.setPosition(position);
          await newChannel.send("☢️ **Channel Nuked.**");
        } catch (error) {
          console.error(error);
          if (!interaction.replied) await interaction.reply({ content: "❌ Failed to nuke.", ephemeral: true });
        }
        return;
      }

      if (customId.startsWith("role_")) {
        const roleId = customId.split("_")[1];
        const role   = interaction.guild.roles.cache.get(roleId);
        if (!role) return interaction.reply({ content: "❌ Role not found.", flags: [64] });

        try {
          if (interaction.member.roles.cache.has(roleId)) {
            await interaction.member.roles.remove(role);
            await interaction.reply({ content: `✅ Removed the role: **${role.name}**`, flags: [64] });
          } else {
            await interaction.member.roles.add(role);
            await interaction.reply({ content: `✅ Added the role: **${role.name}**`, flags: [64] });
          }
        } catch (err) {
          console.error(err);
          await interaction.reply({ content: "❌ I do not have permission to manage this role.", flags: [64] });
        }
        return;
      }

      if (customId.startsWith("ticket_")) {
        const type = customId.split("_")[1];
        try {
          const channel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: 0,
            permissionOverwrites: [
              { id: interaction.guild.id, deny: ["ViewChannel"] },
              { id: interaction.user.id, allow: ["ViewChannel", "SendMessages"] }
            ]
          });

          await Ticket.create({
            guildId: interaction.guild.id,
            channelId: channel.id,
            userId: interaction.user.id,
            type
          });

          interaction.reply({ content: `✅ Ticket created: ${channel}`, ephemeral: true });
        } catch (err) {
          console.error(err);
          interaction.reply({ content: "❌ Failed to create ticket channel.", ephemeral: true });
        }
        return;
      }
    }

    // ── Slash commands ──────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.slashCommands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(error);
        const msg = { content: "❌ There was an error executing this command!", ephemeral: true };
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp(msg).catch(() => {});
        } else {
          await interaction.reply(msg).catch(() => {});
        }
      }
    }
  },
};
