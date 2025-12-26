const express = require('express');
const router = express.Router();
const { Prescription, Visit, Patient, User, Medicine, PrescriptionTemplate } = require('../models');
const { requireAuth, requireClinicAccess } = require('../middlewares/auth');
const { ROLES, canViewAllData } = require('../utils/roles');
const { Op } = require('sequelize');

/**
 * GET /prescriptions
 * List all prescriptions
 */
router.get('/', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const userRole = req.session.user.role;
    const userId = req.session.user.id;

    const { patientId, doctorId, date } = req.query;

    // Build where clause for visits
    const visitWhere = { clinicId };
    if (userRole === ROLES.DOCTOR || userRole === ROLES.READ_ONLY) {
      visitWhere.doctorId = userId;
    }
    if (patientId) {
      visitWhere.patientId = patientId;
    }
    if (doctorId && canViewAllData(req.session.user)) {
      visitWhere.doctorId = doctorId;
    }

    // Get visits with prescriptions
    const visits = await Visit.findAll({
      where: visitWhere,
      include: [
        {
          model: Prescription,
          as: 'prescription',
          required: true, // Only visits with prescriptions
        },
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
      order: [['created_at', 'DESC']],
      limit: 50,
    });

    res.render('prescriptions/index', {
      title: 'Prescriptions',
      prescriptions: visits.map(v => ({
        ...v.prescription.toJSON(),
        visit: v,
        patient: v.patient,
        doctor: v.doctor,
      })),
      filters: { patientId, doctorId, date },
      canViewAll: canViewAllData(req.session.user),
    });
  } catch (error) {
    console.error('Prescriptions list error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * GET /prescriptions/history/:patientId
 * Get prescription history for a patient
 */
router.get('/history/:patientId', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const { patientId } = req.params;

    // Verify patient belongs to clinic
    const patient = await Patient.findOne({
      where: { id: patientId, clinicId },
    });

    if (!patient) {
      return res.status(404).render('errors/404', {
        title: 'Patient Not Found',
        layout: 'layouts/main',
      });
    }

    const visits = await Visit.findAll({
      where: { clinicId, patientId },
      include: [
        {
          model: Prescription,
          as: 'prescription',
          required: true,
        },
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'name'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.render('prescriptions/history', {
      title: 'Prescription History',
      patient,
      prescriptions: visits.map(v => ({
        ...v.prescription.toJSON(),
        visit: v,
        doctor: v.doctor,
      })),
    });
  } catch (error) {
    console.error('Prescription history error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * GET /prescriptions/:id
 * Show prescription details
 */
router.get('/:id', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const userRole = req.session.user.role;
    const userId = req.session.user.id;

    const prescription = await Prescription.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Visit,
          as: 'visit',
          where: { clinicId },
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
        },
      ],
    });

    if (!prescription) {
      return res.status(404).render('errors/404', {
        title: 'Prescription Not Found',
        layout: 'layouts/main',
      });
    }

    // Check access
    if ((userRole === ROLES.DOCTOR || userRole === ROLES.READ_ONLY) &&
        prescription.visit.doctorId !== userId) {
      return res.status(403).render('errors/403', {
        title: 'Access Denied',
        layout: 'layouts/main',
      });
    }

    res.render('prescriptions/show', {
      title: 'Prescription Details',
      prescription,
      visit: prescription.visit,
      patient: prescription.visit.patient,
      doctor: prescription.visit.doctor,
    });
  } catch (error) {
    console.error('Prescription detail error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * GET /prescriptions/:id/print
 * Print prescription
 */
router.get('/:id/print', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;

    const prescription = await Prescription.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Visit,
          as: 'visit',
          where: { clinicId },
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
        },
      ],
    });

    if (!prescription) {
      return res.status(404).render('errors/404', {
        title: 'Prescription Not Found',
        layout: 'layouts/main',
      });
    }

    res.render('prescriptions/print', {
      title: 'Print Prescription',
      layout: 'layouts/print',
      prescription,
      visit: prescription.visit,
      patient: prescription.visit.patient,
      doctor: prescription.visit.doctor,
    });
  } catch (error) {
    console.error('Print prescription error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * GET /prescriptions/medicines/search
 * Search medicines
 */
router.get('/medicines/search', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({ medicines: [] });
    }

    const medicines = await Medicine.findAll({
      where: {
        isActive: true,
        [Op.or]: [
          { clinicId: null }, // Global medicines
          { clinicId }, // Clinic-specific medicines
        ],
        [Op.or]: [
          { name: { [Op.iLike]: `%${q}%` } },
          { genericName: { [Op.iLike]: `%${q}%` } },
          { brandName: { [Op.iLike]: `%${q}%` } },
        ],
      },
      limit: 20,
      order: [['name', 'ASC']],
    });

    res.json({ medicines });
  } catch (error) {
    console.error('Medicine search error:', error);
    res.status(500).json({ error: 'Failed to search medicines' });
  }
});

/**
 * GET /prescriptions/templates
 * List prescription templates
 */
router.get('/templates', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;

    const templates = await PrescriptionTemplate.findAll({
      where: { clinicId },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name'],
        },
      ],
      order: [['is_default', 'DESC'], ['name', 'ASC']],
    });

    res.render('prescriptions/templates', {
      title: 'Prescription Templates',
      templates,
    });
  } catch (error) {
    console.error('Templates list error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

module.exports = router;

