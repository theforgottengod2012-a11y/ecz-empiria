const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    name: 'embedbuilder',
    description: 'Create advanced futuristic embeds with functional role and link buttons.',
    category: 'utility',
    async execute(message, args, client) {
        if (!message.member.permissions.has('ManageMessages')) {
            return message.reply('❌ ACCESS_DENIED: Insufficient permissions to access the Embed-Core.');
        }

        const embed = new EmbedBuilder()
            .setTitle('🚀 EMBED_CONSTRUCTOR_v2.0')
            .setDescription('System ready. Initialize parameters using the interface below.')
            .setColor('#00ffff');

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('eb_title')
                    .setLabel('Set Cyber-Title')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📝'),
                new ButtonBuilder()
                    .setCustomId('eb_desc')
                    .setLabel('Set Data-Stream')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📄'),
                new ButtonBuilder()
                    .setCustomId('eb_color')
                    .setLabel('Set Hex-Core')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎨'),
                new ButtonBuilder()
                    .setCustomId('eb_image')
                    .setLabel('Set Visual')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🖼️'),
                new ButtonBuilder()
                    .setCustomId('eb_footer')
                    .setLabel('Set Metadata')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📑')
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('eb_addbutton')
                    .setLabel('Add Link')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔗'),
                new ButtonBuilder()
                    .setCustomId('eb_addrolebutton')
                    .setLabel('Add Role')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🎭'),
                new ButtonBuilder()
                    .setCustomId('eb_send')
                    .setLabel('DEPLOY')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🚀'),
                new ButtonBuilder()
                    .setCustomId('eb_cancel')
                    .setLabel('ABORT')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🗑️')
            );

        const builderMsg = await message.channel.send({
            embeds: [embed],
            components: [row1, row2]
        });

        const collector = builderMsg.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 600000
        });

        const currentEmbed = new EmbedBuilder()
            .setColor('#00ffff')
            .setTimestamp();
        const buttons = [];

        collector.on('collect', async i => {
            if (i.customId === 'eb_cancel') {
                await builderMsg.delete().catch(() => null);
                collector.stop();
                return;
            }

            if (i.customId === 'eb_send') {
                if (!currentEmbed.data.title && !currentEmbed.data.description) {
                    return i.reply({ content: '❌ ERROR: Payload empty. Set title or description.', flags: [64] });
                }
                const sendOptions = { embeds: [currentEmbed] };
                if (buttons.length > 0) {
                    const row = new ActionRowBuilder().addComponents(
                        buttons.map((b, index) => {
                            if (b.roleId) {
                                return new ButtonBuilder()
                                    .setCustomId(`role_${b.roleId}_${Date.now()}_${index}`)
                                    .setLabel(b.label)
                                    .setStyle(ButtonStyle.Secondary)
                                    .setEmoji('🛡️');
                            }
                            return new ButtonBuilder()
                                .setLabel(b.label)
                                .setURL(b.url)
                                .setStyle(ButtonStyle.Link)
                                .setEmoji('🌐');
                        })
                    );
                    sendOptions.components = [row];
                }
                await i.channel.send(sendOptions);
                await builderMsg.delete().catch(() => null);
                collector.stop();
                return;
            }

            if (i.customId === 'eb_addbutton' || i.customId === 'eb_addrolebutton') {
                if (buttons.length >= 5) {
                    return i.reply({ content: '❌ ERROR: Buffer full (Max 5 buttons).', flags: [64] });
                }
                const isRole = i.customId === 'eb_addrolebutton';
                const modal = new ModalBuilder()
                    .setCustomId(`modal_${i.customId}`)
                    .setTitle(isRole ? 'ADD ROLE_PROTOCOL' : 'ADD LINK_PROTOCOL');

                const labelInput = new TextInputBuilder()
                    .setCustomId('eb_button_label')
                    .setLabel('BUTTON_LABEL')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(80);

                const valueInput = new TextInputBuilder()
                    .setCustomId('eb_button_value')
                    .setLabel(isRole ? 'ROLE_ID' : 'TARGET_URL')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(labelInput),
                    new ActionRowBuilder().addComponents(valueInput)
                );
                await i.showModal(modal);

                const submitted = await i.awaitModalSubmit({
                    time: 60000,
                    filter: mi => mi.customId === `modal_${i.customId}` && mi.user.id === i.user.id,
                }).catch(() => null);

                if (submitted) {
                    await submitted.deferReply({ flags: [64] });
                    const label = submitted.fields.getTextInputValue('eb_button_label');
                    const value = submitted.fields.getTextInputValue('eb_button_value');
                    
                    if (isRole) {
                        const role = message.guild.roles.cache.get(value);
                        if (!role) return submitted.editReply({ content: '❌ ERROR: Unknown Role ID.' });
                        buttons.push({ label, roleId: value });
                        await submitted.editReply({ content: `✅ ROLE_LINKED: ${role.name}` });
                    } else {
                        try {
                            new URL(value);
                            buttons.push({ label, url: value });
                            await submitted.editReply({ content: `✅ LINK_ESTABLISHED: ${label}` });
                        } catch (err) {
                            await submitted.editReply({ content: '❌ ERROR: Invalid URL protocol.' });
                        }
                    }
                }
                return;
            }

            if (i.customId === 'eb_image') {
                await i.reply({ content: '📤 **Please upload or drag an image into this channel now.**\n*Type "cancel" to abort.*', flags: [64] });
                
                const filter = m => m.author.id === message.author.id;
                const imageCollector = message.channel.createMessageCollector({ filter, time: 60000, max: 1 });

                imageCollector.on('collect', async m => {
                    if (m.content.toLowerCase() === 'cancel') {
                        imageCollector.stop();
                        return message.channel.send('❌ Image upload aborted.').then(msg => setTimeout(() => msg.delete().catch(() => null), 3000));
                    }

                    const attachment = m.attachments.first();
                    const url = attachment ? attachment.url : m.content;

                    try {
                        currentEmbed.setImage(url);
                        await builderMsg.edit({ embeds: [currentEmbed] });
                        if (m.deletable) await m.delete().catch(() => null);
                        await message.channel.send('✅ Visual Data Synchronized.').then(msg => setTimeout(() => msg.delete().catch(() => null), 3000));
                    } catch (err) {
                        await message.channel.send('❌ ERROR: Invalid Visual Protocol.').then(msg => setTimeout(() => msg.delete().catch(() => null), 5000));
                    }
                });
                return;
            }

            const modal = new ModalBuilder()
                .setCustomId(`modal_${i.customId}`)
                .setTitle('SYSTEM_CONFIG');

            const input = new TextInputBuilder()
                .setCustomId('eb_input')
                .setLabel('ENTER DATA')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            if (i.customId === 'eb_title') input.setLabel('ENTER CYBER-TITLE').setMaxLength(256);
            if (i.customId === 'eb_desc') input.setLabel('ENTER DATA-STREAM (DESCRIPTION)').setMaxLength(4000);
            if (i.customId === 'eb_color') input.setLabel('ENTER HEX-CORE (e.g. #00ffff)');
            if (i.customId === 'eb_footer') input.setLabel('ENTER METADATA (FOOTER TEXT)');

            modal.addComponents(new ActionRowBuilder().addComponents(input));
            await i.showModal(modal);

            const submitted = await i.awaitModalSubmit({
                time: 60000,
                filter: mi => mi.customId === `modal_${i.customId}` && mi.user.id === i.user.id,
            }).catch(() => null);

            if (submitted) {
                await submitted.deferReply({ flags: [64] });
                const value = submitted.fields.getTextInputValue('eb_input');
                try {
                    if (i.customId === 'eb_title') currentEmbed.setTitle(`> ${value.toUpperCase()}`);
                    if (i.customId === 'eb_desc') currentEmbed.setDescription(value);
                    if (i.customId === 'eb_color') currentEmbed.setColor(value.startsWith('#') ? value : `#${value}`);
                    if (i.customId === 'eb_footer') currentEmbed.setFooter({ text: `SYSTEM_LOG: ${value}`, iconURL: message.client.user.displayAvatarURL() });

                    await builderMsg.edit({ embeds: [currentEmbed] });
                    await submitted.editReply({ content: '✅ DATA_SYNC_COMPLETE.' });
                } catch (err) {
                    await submitted.editReply({ content: '❌ CRITICAL_FAILURE: Input rejected.' });
                }
            }
        });
    }
};
