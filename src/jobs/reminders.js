
const cron = require('node-cron');
const { Visit, Patient, Clinic, Appointment, User } = require('../models');
const { Op } = require('sequelize');
const { sendSMS, sendWhatsApp, sendEmail } = require('../utils/notification');

const sendVisitReminder = async (visit, patient) => {
    const clinicName = visit.clinic ? visit.clinic.name : 'the clinic';
    const message = `Reminder: Dear ${patient.name}, you have a follow-up visit scheduled for ${visit.nextVisitDate} at ${clinicName}.`;
    
    if (patient.phone) {
        await sendSMS({ to: patient.phone, body: message });
        await sendWhatsApp({ to: patient.phone, body: message });
    }
};

const sendAppointmentReminder = async (appointment, patient) => {
    const appointmentDateTime = `${appointment.appointmentDate} at ${appointment.appointmentTime}`;
    const message = `Appointment Reminder: Dear ${patient.name}, you have an appointment scheduled for ${appointmentDateTime}.`;

    appointment.reminderSent = true;
    appointment.reminderSentAt = new Date();
    await appointment.save();

    if (patient.phone) {
        await sendSMS({ to: patient.phone, body: message });
        await sendWhatsApp({ to: patient.phone, body: message });
    }

    if (patient.email) {
        await sendEmail({
            to: patient.email,
            subject: 'Upcoming Appointment Reminder',
            body: message,
        });
    }
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
 * Check for past scheduled appointments and mark them as NO_SHOW (missed)
 * Runs daily at 11 PM
 */
const recoverMissedAppointments = async () => {
    try {
        console.log('🔄 Running missed appointment recovery...');
        const todayStr = new Date().toISOString().split('T')[0];
        
        const missedAppointments = await Appointment.findAll({
            where: {
                appointmentDate: {
                    [Op.lt]: todayStr,
                },
                status: {
                    [Op.in]: ['SCHEDULED', 'CONFIRMED'],
                },
            },
            include: [
                { model: Patient, as: 'patient' },
                { model: User, as: 'doctor', attributes: ['name'] }
            ],
        });

        console.log(`Found ${missedAppointments.length} missed appointments to recover`);

        for (const apt of missedAppointments) {
            apt.status = 'NO_SHOW';
            await apt.save();

            if (apt.patient && (apt.patient.phone || apt.patient.email)) {
                const docName = apt.doctor ? apt.doctor.name : 'the doctor';
                const message = `Hello ${apt.patient.name}, we missed you at your appointment with Dr. ${docName} on ${apt.appointmentDate}. Please reply or call us to reschedule your checkup!`;
                
                if (apt.patient.phone) {
                    await sendSMS({ to: apt.patient.phone, body: message });
                    await sendWhatsApp({ to: apt.patient.phone, body: message });
                }
                if (apt.patient.email) {
                    await sendEmail({
                        to: apt.patient.email,
                        subject: 'We missed you! Reschedule your appointment',
                        body: message,
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error recovering missed appointments:', error);
    }
};

/**
 * Identify inactive patients (no visit or appointment in 6 months) and send recurring checkup reminders
 * Runs weekly on Sundays at 10 AM
 */
const checkInactivePatients = async () => {
    try {
        console.log('🔄 Running recurring checkup check for inactive patients...');
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);

        const patients = await Patient.findAll();
        
        for (const patient of patients) {
            const recentVisit = await Visit.findOne({
                where: {
                    patientId: patient.id,
                    created_at: {
                        [Op.gte]: sixMonthsAgo
                    }
                }
            });

            const recentApt = await Appointment.findOne({
                where: {
                    patientId: patient.id,
                    appointmentDate: {
                        [Op.gte]: sixMonthsAgo.toISOString().split('T')[0]
                    }
                }
            });

            if (!recentVisit && !recentApt) {
                const message = `Hi ${patient.name}, it has been over 6 months since your last visit. Regular checkups are important for your ongoing health. Would you like to schedule a routine consultation?`;
                
                if (patient.phone) {
                    await sendSMS({ to: patient.phone, body: message });
                    await sendWhatsApp({ to: patient.phone, body: message });
                }
            }
        }
    } catch (error) {
        console.error('Error checking inactive patients:', error);
    }
};

/**
 * Schedule the reminder jobs
 * Runs daily at 9:00 AM, 6:00 PM, 11:00 PM, and Sundays at 10:00 AM
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

    // Cron expression: 0 23 * * * (11 PM every day) - for missed appointment recovery
    cron.schedule('0 23 * * *', async () => {
        console.log('Running missed appointment recovery job...');
        await recoverMissedAppointments();
    });

    // Cron expression: 0 10 * * 0 (10 AM every Sunday) - for inactive patient checkups
    cron.schedule('0 10 * * 0', async () => {
        console.log('Running inactive patient checkup check...');
        await checkInactivePatients();
    });
};

module.exports = {
    startReminderJob,
    checkUpcomingVisits,
    checkUpcomingAppointments,
    recoverMissedAppointments,
    checkInactivePatients,
};
