const express = require('express');
const router = express.Router();
const { Visit, Patient, User, Prescription, File, Appointment } = require('../models');
const { requireAuth, requireClinicAccess, requireRole } = require('../middlewares/auth');
const { validateVisit } = require('../middlewares/validation');
const { ROLES, canWrite } = require('../utils/roles');
const { Op } = require('sequelize');

/**
 * GET /visits/new/:patientId
 * Show new visit form
 */
router.get('/new/:patientId', requireAuth, requireClinicAccess, requireRole(ROLES.CLINIC_ADMIN, ROLES.DOCTOR), async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const { patientId } = req.params;
    const { doctorId, appointmentId } = req.query; // Get doctorId and appointmentId from query params

    // Verify patient belongs to clinic
    const patient = await Patient.findOne({
      where: {
        id: patientId,
        clinicId
      }
    });

    if (!patient) {
      return res.status(404).render('errors/404', {
        title: 'Patient Not Found',
        layout: 'layouts/main'
      });
    }

    // Get doctors for this clinic
    const doctors = await User.findAll({
      where: {
        clinicId,
        role: { [Op.in]: ['DOCTOR', 'CLINIC_ADMIN'] },
        status: 'ACTIVE'
      },
      attributes: ['id', 'name']
    });

    // Determine selected doctor: from query param, or current user if doctor, or null
    let selectedDoctorId = null;
    if (doctorId) {
      // Verify the doctorId is valid and belongs to clinic
      const doctor = doctors.find(d => d.id === doctorId);
      if (doctor) {
        selectedDoctorId = doctorId;
      }
    } else if (req.session.user.role === 'DOCTOR') {
      selectedDoctorId = req.session.user.id;
    }

    res.render('visits/new', {
      title: 'New Visit',
      patient,
      doctors,
      selectedDoctorId,
      appointmentId: appointmentId || null // Pass appointmentId to form
    });
  } catch (error) {
    console.error('New visit form error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/**
 * POST /visits
 * Create new visit
 */
router.post('/', requireAuth, requireClinicAccess, requireRole(ROLES.CLINIC_ADMIN, ROLES.DOCTOR), validateVisit, async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const { patientId, doctorId, symptoms, diagnosis, notes, nextVisitDate, appointmentId } = req.body;

    // Verify patient belongs to clinic
    const patient = await Patient.findOne({
      where: {
        id: patientId,
        clinicId
      }
    });

    if (!patient) {
      return res.status(404).render('errors/404', {
        title: 'Patient Not Found',
        layout: 'layouts/main'
      });
    }

    // If appointmentId is provided, verify it belongs to the clinic
    if (appointmentId) {
      const { Appointment } = require('../models');
      const appointment = await Appointment.findOne({
        where: {
          id: appointmentId,
          clinicId,
          patientId
        }
      });

      if (!appointment) {
        return res.status(400).render('errors/400', {
          title: 'Invalid Appointment',
          layout: 'layouts/main',
          error: 'The appointment does not exist or does not belong to this patient.'
        });
      }
    }

    // Create visit
    const visit = await Visit.create({
      clinicId,
      patientId,
      doctorId: doctorId || req.session.user.id,
      symptoms: symptoms || null,
      diagnosis: diagnosis || null,
      notes: notes || null,
      nextVisitDate: nextVisitDate ? new Date(nextVisitDate) : null,
      appointmentId: appointmentId || null
    });

    res.redirect(`/visits/${visit.id}`);
  } catch (error) {
    console.error('Create visit error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/**
 * GET /visits/:id
 * Show visit details (role-based access)
 */
router.get('/:id', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const userId = req.session.user.id;
    const userRole = req.session.user.role;
    const { id } = req.params;

    // Build where clause based on role
    const where = {
      id,
      clinicId // Multi-tenant isolation
    };

    // Doctors can only see their own visits
    if (userRole === ROLES.DOCTOR) {
      where.doctorId = userId;
    }

    const visit = await Visit.findOne({
      where,
      include: [{
        model: Patient,
        as: 'patient'
      }, {
        model: User,
        as: 'doctor',
        attributes: ['id', 'name', 'email']
      }, {
        model: Prescription,
        as: 'prescription'
      }, {
        model: File,
        as: 'files'
      }, {
        model: Appointment,
        as: 'appointment',
        attributes: ['id', 'appointmentDate', 'appointmentTime', 'status']
      }]
    });

    if (!visit) {
      return res.status(404).render('errors/404', {
        title: 'Visit Not Found',
        layout: 'layouts/main'
      });
    }

    res.render('visits/show', {
      title: `Visit Details`,
      visit,
      canEdit: canWrite({ role: userRole })
    });
  } catch (error) {
    console.error('Visit details error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/**
 * GET /visits
 * List all visits with filters
 */
router.get('/', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const userRole = req.session.user.role;
    const userId = req.session.user.id;
    const {
      search,
      doctorId,
      diagnosis,
      dateFrom,
      dateTo,
      patientId,
      sortBy,
      sortOrder,
      export: exportData
    } = req.query;

    // Build where clause
    const where = { clinicId };

    // Role-based filtering
    if (userRole === ROLES.DOCTOR) {
      where.doctorId = userId;
    }

    // Doctor filter
    if (doctorId && canWrite({ role: userRole })) {
      where.doctorId = doctorId;
    }

    // Diagnosis filter
    if (diagnosis) {
      where.diagnosis = { [Op.iLike]: `%${diagnosis}%` };
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) {
        where.created_at[Op.gte] = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.created_at[Op.lte] = endDate;
      }
    }

    // Patient filter
    if (patientId) {
      where.patientId = patientId;
    }

    // Search filter (searches in symptoms, diagnosis, notes)
    if (search) {
      where[Op.or] = [
        { symptoms: { [Op.iLike]: `%${search}%` } },
        { diagnosis: { [Op.iLike]: `%${search}%` } },
        { notes: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Sort options
    const order = [];
    if (sortBy) {
      order.push([sortBy, sortOrder === 'desc' ? 'DESC' : 'ASC']);
    } else {
      order.push(['created_at', 'DESC']);
    }

    const visits = await Visit.findAll({
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
        {
          model: Prescription,
          as: 'prescription',
        },
      ],
      order,
      limit: exportData ? null : 100,
    });

    // Get doctors for filter dropdown
    const doctors = await User.findAll({
      where: {
        clinicId,
        role: { [Op.in]: ['DOCTOR', 'CLINIC_ADMIN'] },
        status: 'ACTIVE',
      },
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
    });

    // Export functionality
    if (exportData === 'csv') {
      const csv = [
        ['Date', 'Patient', 'Doctor', 'Diagnosis', 'Symptoms', 'Notes'].join(','),
        ...visits.map(v => [
          `"${new Date(v.createdAt).toLocaleString()}"`,
          `"${v.patient.name}"`,
          `"${v.doctor.name}"`,
          `"${v.diagnosis || ''}"`,
          `"${(v.symptoms || '').replace(/"/g, '""')}"`,
          `"${(v.notes || '').replace(/"/g, '""')}"`,
        ].join(',')),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=visits.csv');
      return res.send(csv);
    }

    res.render('visits/index', {
      title: 'Visits',
      visits,
      doctors,
      filters: { search, doctorId, diagnosis, dateFrom, dateTo, patientId, sortBy, sortOrder },
      canViewAll: canWrite({ role: userRole }),
    });
  } catch (error) {
    console.error('Visits list error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

module.exports = router;
