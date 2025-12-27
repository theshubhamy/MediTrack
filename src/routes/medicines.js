const express = require('express');
const router = express.Router();
const { Medicine, Clinic } = require('../models');
const { requireAuth, requireClinicAccess, requireRole } = require('../middlewares/auth');
const { ROLES, canManageClinic } = require('../utils/roles');
const { Op } = require('sequelize');

/**
 * GET /medicines
 * List all medicines (global and clinic-specific)
 */
router.get('/', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const { search, type, isActive, export: exportData } = req.query;

    const where = {
      [Op.or]: [
        { clinicId: null }, // Global medicines
        { clinicId }, // Clinic-specific medicines
      ],
    };

    if (search) {
      where[Op.and] = [
        {
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } },
            { genericName: { [Op.iLike]: `%${search}%` } },
            { brandName: { [Op.iLike]: `%${search}%` } },
          ],
        },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const medicines = await Medicine.findAll({
      where,
      order: [['name', 'ASC']],
      limit: exportData ? null : 100,
    });

    // Export functionality
    if (exportData === 'csv') {
      const csv = [
        ['Name', 'Generic Name', 'Brand Name', 'Type', 'Strength', 'Unit', 'Dosage Form', 'Is Active'].join(','),
        ...medicines.map(m => [
          `"${m.name}"`,
          `"${m.genericName || ''}"`,
          `"${m.brandName || ''}"`,
          m.type || '',
          m.strength || '',
          m.unit || '',
          m.dosageForm || '',
          m.isActive ? 'Yes' : 'No',
        ].join(',')),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=medicines.csv');
      return res.send(csv);
    }

    res.render('medicines/index', {
      title: 'Medicine Database',
      medicines,
      filters: { search, type, isActive },
      canManage: canManageClinic(req.session.user),
    });
  } catch (error) {
    console.error('Medicines list error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * GET /medicines/new
 * Show new medicine form
 */
router.get('/new', requireAuth, requireClinicAccess, requireRole(ROLES.CLINIC_ADMIN, ROLES.DOCTOR), async (req, res) => {
  try {
    res.render('medicines/form', {
      title: 'Add New Medicine',
      medicine: null,
    });
  } catch (error) {
    console.error('New medicine form error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * POST /medicines
 * Create new medicine
 */
router.post('/', requireAuth, requireClinicAccess, requireRole(ROLES.CLINIC_ADMIN, ROLES.DOCTOR), async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const {
      name,
      genericName,
      brandName,
      type,
      strength,
      unit,
      dosageForm,
      frequency,
      duration,
      instructions,
      sideEffects,
      contraindications,
      isGlobal,
    } = req.body;

    const medicine = await Medicine.create({
      clinicId: isGlobal === 'true' ? null : clinicId,
      name,
      genericName: genericName || null,
      brandName: brandName || null,
      type: type || 'TABLET',
      strength: strength || null,
      unit: unit || 'mg',
      dosageForm: dosageForm || null,
      frequency: frequency || null,
      duration: duration || null,
      instructions: instructions || null,
      sideEffects: sideEffects || null,
      contraindications: contraindications || null,
      isActive: true,
    });

    res.redirect('/medicines');
  } catch (error) {
    console.error('Create medicine error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * GET /medicines/:id/edit
 * Show edit medicine form
 */
router.get('/:id/edit', requireAuth, requireClinicAccess, requireRole(ROLES.CLINIC_ADMIN, ROLES.DOCTOR), async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;

    const medicine = await Medicine.findOne({
      where: {
        id: req.params.id,
        [Op.or]: [
          { clinicId: null },
          { clinicId },
        ],
      },
    });

    if (!medicine) {
      return res.status(404).render('errors/404', {
        title: 'Medicine Not Found',
        layout: 'layouts/main',
      });
    }

    res.render('medicines/form', {
      title: 'Edit Medicine',
      medicine,
    });
  } catch (error) {
    console.error('Edit medicine form error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * POST /medicines/:id
 * Update medicine
 */
router.post('/:id', requireAuth, requireClinicAccess, requireRole(ROLES.CLINIC_ADMIN, ROLES.DOCTOR), async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const {
      name,
      genericName,
      brandName,
      type,
      strength,
      unit,
      dosageForm,
      frequency,
      duration,
      instructions,
      sideEffects,
      contraindications,
      isActive,
    } = req.body;

    const medicine = await Medicine.findOne({
      where: {
        id: req.params.id,
        [Op.or]: [
          { clinicId: null },
          { clinicId },
        ],
      },
    });

    if (!medicine) {
      return res.status(404).render('errors/404', {
        title: 'Medicine Not Found',
        layout: 'layouts/main',
      });
    }

    await medicine.update({
      name,
      genericName: genericName || null,
      brandName: brandName || null,
      type: type || 'TABLET',
      strength: strength || null,
      unit: unit || 'mg',
      dosageForm: dosageForm || null,
      frequency: frequency || null,
      duration: duration || null,
      instructions: instructions || null,
      sideEffects: sideEffects || null,
      contraindications: contraindications || null,
      isActive: isActive === 'true' || isActive === true,
    });

    res.redirect('/medicines');
  } catch (error) {
    console.error('Update medicine error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * POST /medicines/:id/delete
 * Delete medicine (soft delete by setting isActive to false)
 */
router.post('/:id/delete', requireAuth, requireClinicAccess, requireRole(ROLES.CLINIC_ADMIN, ROLES.DOCTOR), async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;

    const medicine = await Medicine.findOne({
      where: {
        id: req.params.id,
        [Op.or]: [
          { clinicId: null },
          { clinicId },
        ],
      },
    });

    if (!medicine) {
      return res.status(404).render('errors/404', {
        title: 'Medicine Not Found',
        layout: 'layouts/main',
      });
    }

    // Soft delete
    await medicine.update({ isActive: false });

    res.redirect('/medicines');
  } catch (error) {
    console.error('Delete medicine error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

module.exports = router;

