/**
 * Scheduled job for sending follow-up reminders
 * Run daily to check for upcoming visits
 */

const cron = require('node-cron');
const { Visit, Patient, Clinic, Appointment } = require('../models');
const { Op } = require('sequelize');

/**
 * Send reminder for upcoming visits
 * This is a placeholder - implement actual SMS/WhatsApp sending logic
 */
const sendVisitReminder = async (visit, patient) => {
    // TODO: Implement actual reminder sending
    // This could use Twilio, WhatsApp Business API, or similar service
    console.log(`Reminder: Patient ${patient.name} has a visit scheduled for ${visit.nextVisitDate}`);

    // Example structure:
    // await sendSMS(patient.phone, `Reminder: You have an appointment on ${visit.nextVisitDate}`);
    // or
    // await sendWhatsApp(patient.phone, `Reminder: You have an appointment on ${visit.nextVisitDate}`);
};

/**
 * Send reminder for upcoming appointments
 */
const sendAppointmentReminder = async (appointment, patient) => {
    // TODO: Implement actual reminder sending
    const appointmentDateTime = `${appointment.appointmentDate} at ${appointment.appointmentTime}`;
    console.log(`Appointment Reminder: Patient ${patient.name} has an appointment on ${appointmentDateTime}`);

    // Mark reminder as sent
    appointment.reminderSent = true;
    appointment.reminderSentAt = new Date();
    await appointment.save();

    // Example structure:
    // await sendSMS(patient.phone, `Reminder: You have an appointment on ${appointmentDateTime}`);
    // or
    // await sendEmail(patient.email, 'Appointment Reminder', `You have an appointment on ${appointmentDateTime}`);
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
                await sendVisitReminder(visit, visit.patient);
            }
        }
    } catch (error) {
        console.error('Error checking upcoming visits:', error);
    }
};

/**
 * Check for upcoming appointments and send reminders
 * Runs daily at 9 AM and 6 PM (for next day appointments)
 */
const checkUpcomingAppointments = async () => {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);

        // Find appointments for tomorrow that haven't had reminders sent
        const upcomingAppointments = await Appointment.findAll({
            where: {
                appointmentDate: {
                    [Op.gte]: tomorrow.toISOString().split('T')[0],
                    [Op.lt]: dayAfter.toISOString().split('T')[0],
                },
                status: {
                    [Op.in]: ['SCHEDULED', 'CONFIRMED'],
                },
                reminderSent: false,
            },
            include: [{
                model: Patient,
                as: 'patient',
            }],
        });

        console.log(`Found ${upcomingAppointments.length} upcoming appointments for reminders`);

        for (const appointment of upcomingAppointments) {
            if (appointment.patient.phone || appointment.patient.email) {
                await sendAppointmentReminder(appointment, appointment.patient);
            }
        }
    } catch (error) {
        console.error('Error checking upcoming appointments:', error);
    }
};

/**
 * Schedule the reminder jobs
 * Runs daily at 9:00 AM and 6:00 PM
 */
const startReminderJob = () => {
    // Cron expression: 0 9 * * * (9 AM every day) - for visits
    cron.schedule('0 9 * * *', async () => {
        console.log('Running visit reminder job...');
        await checkUpcomingVisits();
    });

    // Cron expression: 0 9,18 * * * (9 AM and 6 PM every day) - for appointments
    cron.schedule('0 9,18 * * *', async () => {
        console.log('Running appointment reminder job...');
        await checkUpcomingAppointments();
    });

    console.log('✅ Reminder jobs scheduled (visits at 9 AM, appointments at 9 AM and 6 PM)');
};

module.exports = {
    startReminderJob,
    checkUpcomingVisits,
    checkUpcomingAppointments,
};
