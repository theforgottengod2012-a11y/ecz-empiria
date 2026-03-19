const { PermissionFlagsBits, PermissionsBitField } = require("discord.js");
const { resolveRole } = require("../../utils/resolver");

module.exports = {
  name: "roleperm",
  description: "Give or take permissions from a role",
  module: "moderation",
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return message.reply("❌ You need `Manage Roles` permission.");
    }

    const role = resolveRole(message, args[0]);
    if (!role) return message.reply("❌ Usage: `$roleperm <@role|ID|name> <add/remove> <permission_name>`\nExample: `$roleperm @Staff add ManageMessages` ");

    const action = args[1]?.toLowerCase();
    const permName = args[2];

    if (!action || !permName) return message.reply("❌ Specify action (add/remove) and permission name.");

    if (role.position >= message.guild.members.me.roles.highest.position) {
      return message.reply("❌ I cannot edit this role due to hierarchy.");
    }

    const perm = PermissionFlagsBits[permName];
    if (!perm) return message.reply(`❌ Invalid permission name. Example: \`Administrator\`, \`ManageMessages\`, \`BanMembers\`.`);

    try {
      const currentPerms = new PermissionsBitField(role.permissions);
      if (action === "add") {
        await role.setPermissions(currentPerms.add(perm));
        message.reply(`✅ Added **${permName}** to **${role.name}**.`);
      } else if (action === "remove") {
        await role.setPermissions(currentPerms.remove(perm));
        message.reply(`✅ Removed **${permName}** from **${role.name}**.`);
      }
    } catch (err) {
      message.reply("❌ Failed to update role permissions.");
    }
  }
};
