const express = require('express');
const router = express.Router();
const { Appointment, Patient, User, DoctorAvailability } = require('../models');
const { requireAuth, requireClinicAccess } = require('../middlewares/auth');
const { ROLES, canViewAllData } = require('../utils/roles');
const { Op } = require('sequelize');
const { sendSMS, sendWhatsApp, sendEmail } = require('../utils/notification');

/**
 * GET /appointments
 * List all appointments with filters
 */
router.get('/', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const userRole = req.session.user.role;
    const userId = req.session.user.id;

    const { date, doctorId, status, patientId } = req.query;

    // Build where clause
    const where = { clinicId };

    // Doctors see only their appointments
    if (userRole === ROLES.DOCTOR) {
      where.doctorId = userId;
    }

    if (date) {
      where.appointmentDate = date;
    }

    if (doctorId && canViewAllData(req.session.user)) {
      where.doctorId = doctorId;
    }

    if (status) {
      where.status = status;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    const appointments = await Appointment.findAll({
      where,
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'name', 'phone'],
        },
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [
        ['appointment_date', 'ASC'],
        ['appointment_time', 'ASC'],
      ],
    });

    res.render('appointments/index', {
      title: 'Appointments',
      appointments,
      filters: { date, doctorId, status, patientId },
      canViewAll: canViewAllData(req.session.user),
    });
  } catch (error) {
    console.error('Appointments list error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * GET /appointments/calendar
 * Calendar view of appointments
 */
router.get('/calendar', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const userRole = req.session.user.role;
    const userId = req.session.user.id;

    const { month, year } = req.query;
    const currentDate = new Date();
    const viewMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const viewYear = year ? parseInt(year) : currentDate.getFullYear();

    // Get start and end of month
    const startDate = new Date(viewYear, viewMonth - 1, 1);
    const endDate = new Date(viewYear, viewMonth, 0);

    const where = {
      clinicId,
      appointmentDate: {
        [Op.between]: [
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
        ],
      },
    };

    if (userRole === ROLES.DOCTOR) {
      where.doctorId = userId;
    }

    const appointments = await Appointment.findAll({
      where,
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'name', 'phone'],
        },
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'name'],
        },
      ],
      order: [['appointment_time', 'ASC']],
    });

    // Get doctors for filter
    let doctors = [];
    if (canViewAllData(req.session.user)) {
      doctors = await User.findAll({
        where: {
          clinicId,
          role: ROLES.DOCTOR,
          status: 'ACTIVE',
        },
        attributes: ['id', 'name'],
        order: [['name', 'ASC']],
      });
    }

    res.render('appointments/calendar', {
      title: 'Appointment Calendar',
      appointments,
      doctors,
      currentMonth: viewMonth,
      currentYear: viewYear,
      canViewAll: canViewAllData(req.session.user),
    });
  } catch (error) {
    console.error('Calendar error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * GET /appointments/new
 * Show new appointment form
 */
router.get('/new', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const userRole = req.session.user.role;
    const userId = req.session.user.id;

    // Get patients
    const patients = await Patient.findAll({
      where: { clinicId },
      attributes: ['id', 'name', 'phone'],
      order: [['name', 'ASC']],
    });

    // Get doctors
    let doctors = [];
    if (canViewAllData(req.session.user)) {
      doctors = await User.findAll({
        where: {
          clinicId,
          role: ROLES.DOCTOR,
          status: 'ACTIVE',
        },
        attributes: ['id', 'name'],
        order: [['name', 'ASC']],
      });
    } else if (userRole === ROLES.DOCTOR) {
      doctors = await User.findAll({
        where: {
          id: userId,
          status: 'ACTIVE',
        },
        attributes: ['id', 'name'],
      });
    }

    const { patientId, doctorId, date } = req.query;

    res.render('appointments/new', {
      title: 'New Appointment',
      patients,
      doctors,
      preselectedPatientId: patientId,
      preselectedDoctorId: doctorId,
      preselectedDate: date,
      canViewAll: canViewAllData(req.session.user),
    });
  } catch (error) {
    console.error('New appointment error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * GET /appointments/available-slots
 * Get available time slots for a doctor on a specific date
 */
router.get('/available-slots', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ error: 'Doctor ID and date are required' });
    }

    // Get doctor's availability for the day of week
    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay();

    let availability = await DoctorAvailability.findOne({
      where: {
        doctorId,
        dayOfWeek,
        isAvailable: true,
      },
    });

    // If no availability is set, use default working hours (9 AM - 5 PM)
    if (!availability) {
      // Check if doctor has any availability set at all
      const hasAnyAvailability = await DoctorAvailability.findOne({
        where: { doctorId },
      });

      if (!hasAnyAvailability) {
        // No availability configured - return default slots
        const defaultStartTime = '09:00:00';
        const defaultEndTime = '17:00:00';
        const defaultSlotDuration = 30;

        // Get existing appointments for that day
        const existingAppointments = await Appointment.findAll({
          where: {
            doctorId,
            appointmentDate: date,
            status: {
              [Op.in]: ['SCHEDULED', 'CONFIRMED'],
            },
          },
          attributes: ['appointment_time', 'duration'],
        });

        // Generate default time slots
        const slots = [];
        const start = new Date(`2000-01-01 ${defaultStartTime}`);
        const end = new Date(`2000-01-01 ${defaultEndTime}`);

        let currentTime = new Date(start);
        while (currentTime < end) {
          const timeStr = currentTime.toTimeString().slice(0, 5);
          const endTime = new Date(currentTime.getTime() + defaultSlotDuration * 60000);
          const endTimeStr = endTime.toTimeString().slice(0, 5);

          // Check if slot is available
          let isAvailable = true;
          for (const apt of existingAppointments) {
            const aptStart = new Date(`2000-01-01 ${apt.appointmentTime}`);
            const aptEnd = new Date(aptStart.getTime() + (apt.duration || 30) * 60000);

            if (
              (currentTime >= aptStart && currentTime < aptEnd) ||
              (endTime > aptStart && endTime <= aptEnd) ||
              (currentTime <= aptStart && endTime >= aptEnd)
            ) {
              isAvailable = false;
              break;
            }
          }

          slots.push({
            time: timeStr,
            endTime: endTimeStr,
            available: isAvailable,
          });

          currentTime = new Date(currentTime.getTime() + defaultSlotDuration * 60000);
        }

        return res.json({ slots, message: 'Using default hours (9 AM - 5 PM). Configure availability for custom hours.' });
      } else {
        // Doctor has availability but not for this day
        return res.json({ slots: [], message: 'Doctor is not available on this day.' });
      }
    }

    // Get existing appointments for that day
    const existingAppointments = await Appointment.findAll({
      where: {
        doctorId,
        appointmentDate: date,
        status: {
          [Op.in]: ['SCHEDULED', 'CONFIRMED'],
        },
      },
      attributes: ['appointment_time', 'duration'],
    });

    // Generate time slots
    const slots = [];
    const start = new Date(`2000-01-01 ${availability.startTime}`);
    const end = new Date(`2000-01-01 ${availability.endTime}`);
    const slotDuration = availability.slotDuration || 30;

    let currentTime = new Date(start);
    while (currentTime < end) {
      const timeStr = currentTime.toTimeString().slice(0, 5);
      const endTime = new Date(currentTime.getTime() + slotDuration * 60000);
      const endTimeStr = endTime.toTimeString().slice(0, 5);

      // Check if slot is available
      let isAvailable = true;
      for (const apt of existingAppointments) {
        const aptStart = new Date(`2000-01-01 ${apt.appointmentTime}`);
        const aptEnd = new Date(aptStart.getTime() + (apt.duration || 30) * 60000);

        if (
          (currentTime >= aptStart && currentTime < aptEnd) ||
          (endTime > aptStart && endTime <= aptEnd) ||
          (currentTime <= aptStart && endTime >= aptEnd)
        ) {
          isAvailable = false;
          break;
        }
      }

      slots.push({
        time: timeStr,
        endTime: endTimeStr,
        available: isAvailable,
      });

      currentTime = new Date(currentTime.getTime() + slotDuration * 60000);
    }

    res.json({ slots });
  } catch (error) {
    console.error('Available slots error:', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
});

/**
 * POST /appointments
 * Create new appointment
 */
router.post('/', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const { patientId, doctorId, appointmentDate, appointmentTime, duration, reason, notes } = req.body;

    // Validation
    if (!patientId || !doctorId || !appointmentDate || !appointmentTime) {
      return res.render('appointments/new', {
        title: 'New Appointment',
        error: 'Please fill in all required fields',
        ...req.body,
      });
    }

    // Check if slot is available
    const existingAppointment = await Appointment.findOne({
      where: {
        doctorId,
        appointmentDate,
        appointmentTime,
        status: {
          [Op.in]: ['SCHEDULED', 'CONFIRMED'],
        },
      },
    });

    if (existingAppointment) {
      return res.render('appointments/new', {
        title: 'New Appointment',
        error: 'This time slot is already booked',
        ...req.body,
      });
    }

    const appointment = await Appointment.create({
      clinicId,
      patientId,
      doctorId,
      appointmentDate,
      appointmentTime,
      duration: duration || 30,
      reason,
      notes,
      status: 'SCHEDULED',
    });

    // Send Confirmation Notifications
    try {
      const patient = await Patient.findByPk(patientId);
      const doctor = await User.findByPk(doctorId);
      if (patient) {
        const message = `Appointment Confirmed: Dear ${patient.name}, your appointment with Dr. ${doctor ? doctor.name : 'the doctor'} is scheduled for ${appointmentDate} at ${appointmentTime}.`;
        
        if (patient.phone) {
          await sendSMS({ to: patient.phone, body: message });
          await sendWhatsApp({ to: patient.phone, body: message });
        }
        if (patient.email) {
          await sendEmail({
            to: patient.email,
            subject: 'Appointment Scheduled Confirmation',
            body: message,
          });
        }
      }
    } catch (notifError) {
      console.error('Failed to send appointment confirmation notifications:', notifError);
    }

    res.redirect(`/appointments/${appointment.id}`);
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * GET /appointments/:id
 * Show appointment details
 */
router.get('/:id', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const userRole = req.session.user.role;
    const userId = req.session.user.id;

    const appointment = await Appointment.findOne({
      where: {
        id: req.params.id,
        clinicId,
      },
      include: [
        {
          model: Patient,
          as: 'patient',
        },
        {
          model: User,
          as: 'doctor',
        },
      ],
    });

    if (!appointment) {
      return res.status(404).render('errors/404', {
        title: 'Appointment Not Found',
        layout: 'layouts/main',
      });
    }

    // Check if user has access (doctors can only see their own)
    if (userRole === ROLES.DOCTOR && appointment.doctorId !== userId) {
      return res.status(403).render('errors/403', {
        title: 'Access Denied',
        layout: 'layouts/main',
      });
    }

    res.render('appointments/show', {
      title: 'Appointment Details',
      appointment,
      canViewAll: canViewAllData(req.session.user),
    });
  } catch (error) {
    console.error('Appointment detail error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * POST /appointments/:id/status
 * Update appointment status
 */
router.post('/:id/status', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const { status } = req.body;

    const appointment = await Appointment.findOne({
      where: {
        id: req.params.id,
        clinicId,
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    appointment.status = status;
    await appointment.save();

    // Send Status Update Notifications
    try {
      const patient = await Patient.findByPk(appointment.patientId);
      const doctor = await User.findByPk(appointment.doctorId);
      if (patient) {
        const message = `Appointment Status Updated: Dear ${patient.name}, the status of your appointment with Dr. ${doctor ? doctor.name : 'the doctor'} scheduled for ${appointment.appointmentDate} at ${appointment.appointmentTime} has been updated to "${status}".`;
        
        if (patient.phone) {
          await sendSMS({ to: patient.phone, body: message });
          await sendWhatsApp({ to: patient.phone, body: message });
        }
        if (patient.email) {
          await sendEmail({
            to: patient.email,
            subject: 'Appointment Status Updated',
            body: message,
          });
        }
      }
    } catch (notifError) {
      console.error('Failed to send appointment status update notifications:', notifError);
    }

    res.redirect(`/appointments/${appointment.id}`);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

/**
 * POST /appointments/:id/delete
 * Cancel/delete appointment
 */
router.post('/:id/delete', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;

    const appointment = await Appointment.findOne({
      where: {
        id: req.params.id,
        clinicId,
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Soft delete by changing status to CANCELLED
    appointment.status = 'CANCELLED';
    await appointment.save();

    // Send Cancellation Notifications
    try {
      const patient = await Patient.findByPk(appointment.patientId);
      const doctor = await User.findByPk(appointment.doctorId);
      if (patient) {
        const message = `Appointment Cancelled: Dear ${patient.name}, your appointment with Dr. ${doctor ? doctor.name : 'the doctor'} scheduled for ${appointment.appointmentDate} at ${appointment.appointmentTime} has been cancelled.`;
        
        if (patient.phone) {
          await sendSMS({ to: patient.phone, body: message });
          await sendWhatsApp({ to: patient.phone, body: message });
        }
        if (patient.email) {
          await sendEmail({
            to: patient.email,
            subject: 'Appointment Cancelled Notice',
            body: message,
          });
        }
      }
    } catch (notifError) {
      console.error('Failed to send appointment cancellation notifications:', notifError);
    }

    res.redirect('/appointments');
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

module.exports = router;

