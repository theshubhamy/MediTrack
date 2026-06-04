const fs = require('fs');
const path = require('path');

// Ensure the logs directory exists
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logFilePath = path.join(logDir, 'notification-simulations.log');

/**
 * Append a simulated notification entry to the log file
 * @param {string} type - 'EMAIL', 'SMS', or 'WHATSAPP'
 * @param {string} to - Recipient info
 * @param {Object} data - Payload data (subject, body, etc.)
 */
function logSimulation(type, to, data) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type,
    to,
    ...data,
  };

  try {
    fs.appendFileSync(logFilePath, JSON.stringify(logEntry) + '\n', 'utf8');
    
    // Print a clean, formatted preview to console
    console.log('\n==================================================');
    console.log(`🚀 [SIMULATION] ${type} SENT`);
    console.log(`📅 Timestamp: ${timestamp}`);
    console.log(`👤 To: ${to}`);
    if (data.subject) console.log(`📋 Subject: ${data.subject}`);
    console.log(`💬 Message:\n${data.body}`);
    console.log('==================================================\n');
  } catch (error) {
    console.error('Failed to write to notification simulation log:', error);
  }
}

/**
 * Send simulated email
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.body - Email body
 */
async function sendEmail({ to, subject, body }) {
  logSimulation('EMAIL', to, { subject, body });
  return { success: true, messageId: `sim-email-${Date.now()}` };
}

/**
 * Send simulated SMS
 * @param {Object} options
 * @param {string} options.to - Recipient phone number
 * @param {string} options.body - SMS body
 */
async function sendSMS({ to, body }) {
  logSimulation('SMS', to, { body });
  return { success: true, messageId: `sim-sms-${Date.now()}` };
}

/**
 * Send simulated WhatsApp message
 * @param {Object} options
 * @param {string} options.to - Recipient phone number
 * @param {string} options.body - Message body
 */
async function sendWhatsApp({ to, body }) {
  logSimulation('WHATSAPP', to, { body });
  return { success: true, messageId: `sim-whatsapp-${Date.now()}` };
}

module.exports = {
  sendEmail,
  sendSMS,
  sendWhatsApp,
};
