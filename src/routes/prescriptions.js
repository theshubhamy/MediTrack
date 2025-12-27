const express = require('express');
const router = express.Router();
const {
  Prescription,
  Visit,
  Patient,
  User,
  Medicine,
  PrescriptionTemplate,
} = require('../models');
const {
  requireAuth,
  requireClinicAccess,
  requireRole,
} = require('../middlewares/auth');
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
    if (userRole === ROLES.DOCTOR) {
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
router.get(
  '/history/:patientId',
  requireAuth,
  requireClinicAccess,
  async (req, res) => {
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
  },
);

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
      order: [
        ['is_default', 'DESC'],
        ['name', 'ASC'],
      ],
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

/**
 * GET /prescriptions/templates/new
 * Show new template form
 */
router.get(
  '/templates/new',
  requireAuth,
  requireClinicAccess,
  async (req, res) => {
    try {
      res.render('prescriptions/template-form', {
        title: 'New Prescription Template',
        template: null,
      });
    } catch (error) {
      console.error('New template form error:', error);
      res.status(500).render('errors/500', {
        title: 'Server Error',
        layout: 'layouts/main',
        error: process.env.NODE_ENV === 'development' ? error : {},
        NODE_ENV: process.env.NODE_ENV,
      });
    }
  },
);

/**
 * POST /prescriptions/templates
 * Create new template
 */
router.post(
  '/templates',
  requireAuth,
  requireClinicAccess,
  async (req, res) => {
    try {
      const clinicId = req.session.user.clinicId;
      const userId = req.session.user.id;
      const { name, description, medicines, isDefault } = req.body;

      // Parse medicines if it's a string
      let medicinesArray = [];
      if (typeof medicines === 'string') {
        try {
          medicinesArray = JSON.parse(medicines);
        } catch (e) {
          medicinesArray = [];
        }
      } else if (Array.isArray(medicines)) {
        medicinesArray = medicines;
      }

      // If setting as default, unset other defaults
      if (isDefault === 'true' || isDefault === true) {
        await PrescriptionTemplate.update(
          { isDefault: false },
          { where: { clinicId, isDefault: true } },
        );
      }

      const template = await PrescriptionTemplate.create({
        clinicId,
        createdBy: userId,
        name,
        description: description || null,
        medicines: medicinesArray,
        isDefault: isDefault === 'true' || isDefault === true,
      });

      res.redirect('/prescriptions/templates');
    } catch (error) {
      console.error('Create template error:', error);
      res.status(500).render('errors/500', {
        title: 'Server Error',
        layout: 'layouts/main',
        error: process.env.NODE_ENV === 'development' ? error : {},
        NODE_ENV: process.env.NODE_ENV,
      });
    }
  },
);

/**
 * GET /prescriptions/templates/:id
 * Get template data (API)
 */
router.get(
  '/templates/:id',
  requireAuth,
  requireClinicAccess,
  async (req, res) => {
    try {
      const clinicId = req.session.user.clinicId;

      const template = await PrescriptionTemplate.findOne({
        where: { id: req.params.id, clinicId },
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      res.json({ template });
    } catch (error) {
      console.error('Get template error:', error);
      res.status(500).json({ error: 'Failed to fetch template' });
    }
  },
);

/**
 * GET /prescriptions/templates/:id/edit
 * Show edit template form
 */
router.get(
  '/templates/:id/edit',
  requireAuth,
  requireClinicAccess,
  async (req, res) => {
    try {
      const clinicId = req.session.user.clinicId;

      const template = await PrescriptionTemplate.findOne({
        where: { id: req.params.id, clinicId },
      });

      if (!template) {
        return res.status(404).render('errors/404', {
          title: 'Template Not Found',
          layout: 'layouts/main',
        });
      }

      res.render('prescriptions/template-form', {
        title: 'Edit Prescription Template',
        template,
      });
    } catch (error) {
      console.error('Edit template form error:', error);
      res.status(500).render('errors/500', {
        title: 'Server Error',
        layout: 'layouts/main',
        error: process.env.NODE_ENV === 'development' ? error : {},
        NODE_ENV: process.env.NODE_ENV,
      });
    }
  },
);

/**
 * POST /prescriptions/templates/:id
 * Update template
 */
router.post(
  '/templates/:id',
  requireAuth,
  requireClinicAccess,
  async (req, res) => {
    try {
      const clinicId = req.session.user.clinicId;
      const { name, description, medicines, isDefault } = req.body;

      const template = await PrescriptionTemplate.findOne({
        where: { id: req.params.id, clinicId },
      });

      if (!template) {
        return res.status(404).render('errors/404', {
          title: 'Template Not Found',
          layout: 'layouts/main',
        });
      }

      // Parse medicines if it's a string
      let medicinesArray = [];
      if (typeof medicines === 'string') {
        try {
          medicinesArray = JSON.parse(medicines);
        } catch (e) {
          medicinesArray = [];
        }
      } else if (Array.isArray(medicines)) {
        medicinesArray = medicines;
      }

      // If setting as default, unset other defaults
      if (isDefault === 'true' || isDefault === true) {
        await PrescriptionTemplate.update(
          { isDefault: false },
          {
            where: {
              clinicId,
              isDefault: true,
              id: { [Op.ne]: req.params.id },
            },
          },
        );
      }

      await template.update({
        name,
        description: description || null,
        medicines: medicinesArray,
        isDefault: isDefault === 'true' || isDefault === true,
      });

      res.redirect('/prescriptions/templates');
    } catch (error) {
      console.error('Update template error:', error);
      res.status(500).render('errors/500', {
        title: 'Server Error',
        layout: 'layouts/main',
        error: process.env.NODE_ENV === 'development' ? error : {},
        NODE_ENV: process.env.NODE_ENV,
      });
    }
  },
);

/**
 * POST /prescriptions/templates/:id/delete
 * Delete template
 */
router.post(
  '/templates/:id/delete',
  requireAuth,
  requireClinicAccess,
  async (req, res) => {
    try {
      const clinicId = req.session.user.clinicId;

      const template = await PrescriptionTemplate.findOne({
        where: { id: req.params.id, clinicId },
      });

      if (!template) {
        return res.status(404).render('errors/404', {
          title: 'Template Not Found',
          layout: 'layouts/main',
        });
      }

      await template.destroy();

      res.redirect('/prescriptions/templates');
    } catch (error) {
      console.error('Delete template error:', error);
      res.status(500).render('errors/500', {
        title: 'Server Error',
        layout: 'layouts/main',
        error: process.env.NODE_ENV === 'development' ? error : {},
        NODE_ENV: process.env.NODE_ENV,
      });
    }
  },
);

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
    if (userRole === ROLES.DOCTOR && prescription.visit.doctorId !== userId) {
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
router.get(
  '/medicines/search',
  requireAuth,
  requireClinicAccess,
  async (req, res) => {
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
  },
);

/**
 * GET /prescriptions/new/:visitId
 * Show new prescription form for a visit
 */
router.get(
  '/new/:visitId',
  requireAuth,
  requireClinicAccess,
  requireRole(ROLES.CLINIC_ADMIN, ROLES.DOCTOR, ROLES.STAFF),
  async (req, res) => {
    try {
      const clinicId = req.session.user.clinicId;
      const { visitId } = req.params;
      const { templateId } = req.query;

      // Get visit with patient and doctor
      const visit = await Visit.findOne({
        where: { id: visitId, clinicId },
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

      if (!visit) {
        return res.status(404).render('errors/404', {
          title: 'Visit Not Found',
          layout: 'layouts/main',
        });
      }

      // Check if prescription already exists
      const existingPrescription = await Prescription.findOne({
        where: { visitId },
      });

      if (existingPrescription) {
        return res.redirect(`/prescriptions/${existingPrescription.id}/edit`);
      }

      // Get templates
      const templates = await PrescriptionTemplate.findAll({
        where: { clinicId },
        order: [
          ['is_default', 'DESC'],
          ['name', 'ASC'],
        ],
      });

      // Get selected template if provided
      let selectedTemplate = null;
      if (templateId) {
        selectedTemplate = await PrescriptionTemplate.findOne({
          where: { id: templateId, clinicId },
        });
      }

      res.render('prescriptions/new', {
        title: 'New Prescription',
        visit,
        patient: visit.patient,
        doctor: visit.doctor,
        templates,
        selectedTemplate,
      });
    } catch (error) {
      console.error('New prescription form error:', error);
      res.status(500).render('errors/500', {
        title: 'Server Error',
        layout: 'layouts/main',
        error: process.env.NODE_ENV === 'development' ? error : {},
        NODE_ENV: process.env.NODE_ENV,
      });
    }
  },
);

/**
 * POST /prescriptions
 * Create new prescription
 */
router.post(
  '/',
  requireAuth,
  requireClinicAccess,
  requireRole(ROLES.CLINIC_ADMIN, ROLES.DOCTOR, ROLES.STAFF),
  async (req, res) => {
    try {
      const clinicId = req.session.user.clinicId;
      const {
        visitId,
        medicines,
        advice,
        doctorSignature,
        doctorName,
        doctorLicense,
        templateId,
      } = req.body;

      // Verify visit belongs to clinic
      const visit = await Visit.findOne({
        where: { id: visitId, clinicId },
      });

      if (!visit) {
        return res.status(404).render('errors/404', {
          title: 'Visit Not Found',
          layout: 'layouts/main',
        });
      }

      // Check if prescription already exists
      const existingPrescription = await Prescription.findOne({
        where: { visitId },
      });

      if (existingPrescription) {
        return res.redirect(`/prescriptions/${existingPrescription.id}/edit`);
      }

      // Parse medicines if it's a string
      let medicinesArray = [];
      if (typeof medicines === 'string') {
        try {
          medicinesArray = JSON.parse(medicines);
        } catch (e) {
          medicinesArray = [];
        }
      } else if (Array.isArray(medicines)) {
        medicinesArray = medicines;
      }

      // Create prescription
      const prescription = await Prescription.create({
        visitId,
        medicines: medicinesArray,
        advice: advice || null,
        doctorSignature: doctorSignature || null,
        doctorName: doctorName || null,
        doctorLicense: doctorLicense || null,
        templateId: templateId || null,
      });

      res.redirect(`/prescriptions/${prescription.id}`);
    } catch (error) {
      console.error('Create prescription error:', error);
      res.status(500).render('errors/500', {
        title: 'Server Error',
        layout: 'layouts/main',
        error: process.env.NODE_ENV === 'development' ? error : {},
        NODE_ENV: process.env.NODE_ENV,
      });
    }
  },
);

/**
 * GET /prescriptions/:id/edit
 * Show edit prescription form
 */
router.get(
  '/:id/edit',
  requireAuth,
  requireClinicAccess,
  requireRole(ROLES.CLINIC_ADMIN, ROLES.DOCTOR, ROLES.STAFF),
  async (req, res) => {
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
      if (
        (userRole === ROLES.DOCTOR || userRole === ROLES.READ_ONLY) &&
        prescription.visit.doctorId !== userId
      ) {
        return res.status(403).render('errors/403', {
          title: 'Access Denied',
          layout: 'layouts/main',
        });
      }

      // Get templates
      const templates = await PrescriptionTemplate.findAll({
        where: { clinicId },
        order: [
          ['is_default', 'DESC'],
          ['name', 'ASC'],
        ],
      });

      res.render('prescriptions/edit', {
        title: 'Edit Prescription',
        prescription,
        visit: prescription.visit,
        patient: prescription.visit.patient,
        doctor: prescription.visit.doctor,
        templates,
      });
    } catch (error) {
      console.error('Edit prescription form error:', error);
      res.status(500).render('errors/500', {
        title: 'Server Error',
        layout: 'layouts/main',
        error: process.env.NODE_ENV === 'development' ? error : {},
        NODE_ENV: process.env.NODE_ENV,
      });
    }
  },
);

/**
 * POST /prescriptions/:id
 * Update prescription
 */
router.post(
  '/:id',
  requireAuth,
  requireClinicAccess,
  requireRole(ROLES.CLINIC_ADMIN, ROLES.DOCTOR, ROLES.STAFF),
  async (req, res) => {
    try {
      const clinicId = req.session.user.clinicId;
      const userRole = req.session.user.role;
      const userId = req.session.user.id;
      const {
        medicines,
        advice,
        doctorSignature,
        doctorName,
        doctorLicense,
        templateId,
      } = req.body;

      const prescription = await Prescription.findOne({
        where: { id: req.params.id },
        include: [
          {
            model: Visit,
            as: 'visit',
            where: { clinicId },
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
      if (
        (userRole === ROLES.DOCTOR || userRole === ROLES.READ_ONLY) &&
        prescription.visit.doctorId !== userId
      ) {
        return res.status(403).render('errors/403', {
          title: 'Access Denied',
          layout: 'layouts/main',
        });
      }

      // Parse medicines if it's a string
      let medicinesArray = [];
      if (typeof medicines === 'string') {
        try {
          medicinesArray = JSON.parse(medicines);
        } catch (e) {
          medicinesArray = [];
        }
      } else if (Array.isArray(medicines)) {
        medicinesArray = medicines;
      }

      // Update prescription
      await prescription.update({
        medicines: medicinesArray,
        advice: advice || null,
        doctorSignature: doctorSignature || null,
        doctorName: doctorName || null,
        doctorLicense: doctorLicense || null,
        templateId: templateId || null,
      });

      res.redirect(`/prescriptions/${prescription.id}`);
    } catch (error) {
      console.error('Update prescription error:', error);
      res.status(500).render('errors/500', {
        title: 'Server Error',
        layout: 'layouts/main',
        error: process.env.NODE_ENV === 'development' ? error : {},
        NODE_ENV: process.env.NODE_ENV,
      });
    }
  },
);

module.exports = router;
