const express = require('express');
const router = express.Router();
const { Visit, Patient, User, Prescription, File } = require('../models');
const { requireAuth, requireClinicAccess, requireRole } = require('../middlewares/auth');
const { validateVisit } = require('../middlewares/validation');
const { ROLES, canWrite } = require('../utils/roles');
const { Op } = require('sequelize');

/**
 * GET /visits/new/:patientId
 * Show new visit form (READ_ONLY cannot access)
 */
router.get('/new/:patientId', requireAuth, requireClinicAccess, requireRole(ROLES.CLINIC_ADMIN, ROLES.DOCTOR, ROLES.STAFF), async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const { patientId } = req.params;

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

    res.render('visits/new', {
      title: 'New Visit',
      patient,
      doctors,
      selectedDoctorId: req.session.user.role === 'DOCTOR' ? req.session.user.id : null
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
 * Create new visit (READ_ONLY cannot access)
 */
router.post('/', requireAuth, requireClinicAccess, requireRole(ROLES.CLINIC_ADMIN, ROLES.DOCTOR, ROLES.STAFF), validateVisit, async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const { patientId, doctorId, symptoms, diagnosis, notes, nextVisitDate } = req.body;

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

    // Create visit
    const visit = await Visit.create({
      clinicId,
      patientId,
      doctorId: doctorId || req.session.user.id,
      symptoms: symptoms || null,
      diagnosis: diagnosis || null,
      notes: notes || null,
      nextVisitDate: nextVisitDate ? new Date(nextVisitDate) : null
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

    // Doctors and READ_ONLY can only see their own visits
    if (userRole === ROLES.DOCTOR || userRole === ROLES.READ_ONLY) {
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

module.exports = router;
