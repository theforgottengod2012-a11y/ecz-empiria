const axios = require('axios');

/**
 * Sends an SMS message using the TextBelt free API.
 * Note: The free tier of TextBelt is limited to 1 message per day per IP.
 * @param {string} number - The phone number to send to.
 * @param {string} message - The message content.
 * @returns {Promise<object>} - The response from TextBelt.
 */
async function sendSMS(number, message) {
  try {
    const response = await axios.post('https://textbelt.com/text', {
      number: number,
      message: message,
      key: 'textbelt',
    });
    return response.data;
  } catch (error) {
    console.error('Error sending SMS via TextBelt:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { sendSMS };
