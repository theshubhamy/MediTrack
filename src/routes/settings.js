const express = require('express');
const router = express.Router();
const { Clinic } = require('../models');
const { requireAuth, requireClinicAccess, requireRole } = require('../middlewares/auth');

/**
 * GET /settings
 * Show settings page
 */
router.get('/', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;

    const clinic = await Clinic.findByPk(clinicId);

    res.render('settings/index', {
      title: 'Settings',
      clinic
    });
  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/**
 * GET /billing
 * Show billing page
 */
router.get('/billing', requireAuth, requireClinicAccess, requireRole('CLINIC_ADMIN'), async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;

    const clinic = await Clinic.findByPk(clinicId);

    res.render('settings/billing', {
      title: 'Billing',
      clinic
    });
  } catch (error) {
    console.error('Billing error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

module.exports = router;
