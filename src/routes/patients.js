const express = require('express');
const router = express.Router();
const { Patient, Visit, User, Prescription } = require('../models');
const {
  requireAuth,
  requireClinicAccess,
  requireRole,
} = require('../middlewares/auth');
const { validatePatient } = require('../middlewares/validation');
const { ROLES, canWrite } = require('../utils/roles');
const { Op } = require('sequelize');

/**
 * GET /patients
 * List all patients with advanced search and filters
 */
router.get('/', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const { search, ageMin, ageMax, gender, sortBy, sortOrder, export: exportData } = req.query;

    const where = {
      clinicId,
    };

    // Advanced search
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
      ];
    }

    // Age filter
    if (ageMin || ageMax) {
      where.age = {};
      if (ageMin) where.age[Op.gte] = parseInt(ageMin);
      if (ageMax) where.age[Op.lte] = parseInt(ageMax);
    }

    // Gender filter
    if (gender) {
      where.gender = gender;
    }

    // Sort options
    const order = [];
    if (sortBy) {
      order.push([sortBy, sortOrder === 'desc' ? 'DESC' : 'ASC']);
    } else {
      order.push([['created_at', 'DESC']]);
    }

    const patients = await Patient.findAll({
      where,
      order,
      limit: exportData ? null : 100,
    });

    // Export functionality
    if (exportData === 'csv') {
      const csv = [
        ['Name', 'Phone', 'Age', 'Gender', 'Created Date'].join(','),
        ...patients.map(p => [
          `"${p.name}"`,
          p.phone || '',
          p.age || '',
          p.gender || '',
          new Date(p.createdAt).toLocaleDateString(),
        ].join(',')),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=patients.csv');
      return res.send(csv);
    }

    res.render('patients/index', {
      title: 'Patients',
      patients,
      filters: { search, ageMin, ageMax, gender, sortBy, sortOrder },
    });
  } catch (error) {
    console.error('Patients list error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * GET /patients/new
 * Show new patient form (READ_ONLY cannot access)
 */
router.get(
  '/new',
  requireAuth,
  requireClinicAccess,
  requireRole(ROLES.CLINIC_ADMIN, ROLES.DOCTOR, ROLES.STAFF),
  (req, res) => {
    res.render('patients/new', {
      title: 'Add New Patient',
    });
  },
);

/**
 * POST /patients
 * Create new patient (READ_ONLY cannot access)
 */
router.post(
  '/',
  requireAuth,
  requireClinicAccess,
  requireRole(ROLES.CLINIC_ADMIN, ROLES.DOCTOR, ROLES.STAFF),
  validatePatient,
  async (req, res) => {
    try {
      const clinicId = req.session.user.clinicId;
      const { name, phone, age, gender } = req.body;

      const patient = await Patient.create({
        clinicId,
        name,
        phone: phone || null,
        age: age ? parseInt(age) : null,
        gender: gender || null,
      });

      res.redirect(`/patients/${patient.id}`);
    } catch (error) {
      console.error('Create patient error:', error);
      res.render('patients/new', {
        title: 'Add New Patient',
        error: 'Failed to create patient. Please try again.',
        ...req.body,
      });
    }
  },
);

/**
 * GET /patients/:id
 * Show patient details
 */
router.get('/:id', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const { id } = req.params;

    const patient = await Patient.findOne({
      where: {
        id,
        clinicId, // Multi-tenant isolation
      },
      include: [
        {
          model: Visit,
          as: 'visits',
          order: [['created_at', 'DESC']],
          include: [
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
        },
      ],
    });

    if (!patient) {
      return res.status(404).render('errors/404', {
        title: 'Patient Not Found',
        layout: 'layouts/main',
      });
    }

    res.render('patients/show', {
      title: `Patient: ${patient.name}`,
      patient,
    });
  } catch (error) {
    console.error('Patient details error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
    });
  }
});

module.exports = router;
