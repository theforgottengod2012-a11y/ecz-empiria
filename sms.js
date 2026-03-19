const { sendSMS } = require('../../utils/sms');

module.exports = {
  name: 'sms',
  description: 'Send a free SMS message (TextBelt)',
  usage: '<number> <message>',
  module: 'fun',
  async execute(message, args, client) {
    if (args.length < 2) {
      return message.reply('Please provide a phone number and a message. Usage: `!sms <number> <message>`');
    }

    const number = args[0];
    const smsMessage = args.slice(1).join(' ');

    const sentMsg = await message.reply('⏳ Sending SMS...');

    try {
      const result = await sendSMS(number, smsMessage);

      if (result.success) {
        await sentMsg.edit(`✅ SMS sent successfully! (Quota remaining: ${result.quotaRemaining})`);
      } else {
        await sentMsg.edit(`❌ Failed to send SMS: ${result.error || 'Unknown error'}. Note: TextBelt free tier is limited to 1 message per day per IP.`);
      }
    } catch (error) {
      await sentMsg.edit('❌ An error occurred while sending the SMS.');
    }
  },
};
