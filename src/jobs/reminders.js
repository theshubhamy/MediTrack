/**
 * Scheduled job for sending follow-up reminders
 * Run daily to check for upcoming visits
 */

const cron = require('node-cron');
const { Visit, Patient, Clinic } = require('../models');
const { Op } = require('sequelize');

/**
 * Send reminder for upcoming visits
 * This is a placeholder - implement actual SMS/WhatsApp sending logic
 */
const sendReminder = async (visit, patient) => {
    // TODO: Implement actual reminder sending
    // This could use Twilio, WhatsApp Business API, or similar service
    console.log(`Reminder: Patient ${patient.name} has a visit scheduled for ${visit.nextVisitDate}`);

    // Example structure:
    // await sendSMS(patient.phone, `Reminder: You have an appointment on ${visit.nextVisitDate}`);
    // or
    // await sendWhatsApp(patient.phone, `Reminder: You have an appointment on ${visit.nextVisitDate}`);
};

/**
 * Check for upcoming visits and send reminders
 * Runs daily at 9 AM
 */
const checkUpcomingVisits = async () => {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);

        // Find visits with next visit date tomorrow
        const upcomingVisits = await Visit.findAll({
            where: {
                nextVisitDate: {
                    [Op.gte]: tomorrow,
                    [Op.lt]: dayAfter
                }
            },
            include: [{
                model: Patient,
                as: 'patient'
            }, {
                model: Clinic,
                as: 'clinic'
            }]
        });

        console.log(`Found ${upcomingVisits.length} upcoming visits for reminders`);

        for (const visit of upcomingVisits) {
            if (visit.patient.phone) {
                await sendReminder(visit, visit.patient);
            }
        }
    } catch (error) {
        console.error('Error checking upcoming visits:', error);
    }
};

/**
 * Schedule the reminder job
 * Runs daily at 9:00 AM
 */
const startReminderJob = () => {
    // Cron expression: 0 9 * * * (9 AM every day)
    cron.schedule('0 9 * * *', async () => {
        console.log('Running reminder job...');
        await checkUpcomingVisits();
    });

    console.log('✅ Reminder job scheduled (runs daily at 9 AM)');
};

module.exports = {
    startReminderJob,
    checkUpcomingVisits
};
