const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { requireAuth, requireClinicAccess, requireRole } = require('../middlewares/auth');
const { Op } = require('sequelize');

/**
 * GET /doctors
 * List all doctors
 */
router.get('/', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;

    const doctors = await User.findAll({
      where: {
        clinicId,
        role: { [Op.in]: ['DOCTOR', 'CLINIC_ADMIN'] },
        status: 'ACTIVE'
      },
      attributes: ['id', 'name', 'email', 'phone', 'role', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    res.render('doctors/index', {
      title: 'Doctors',
      doctors
    });
  } catch (error) {
    console.error('Doctors list error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/**
 * GET /doctors/invite
 * Show invite doctor form (only for clinic admins)
 */
router.get('/invite', requireAuth, requireClinicAccess, requireRole('CLINIC_ADMIN'), (req, res) => {
  res.render('doctors/invite', {
    title: 'Invite Doctor'
  });
});

/**
 * POST /doctors/invite
 * Invite new doctor (only for clinic admins)
 */
router.post('/invite', requireAuth, requireClinicAccess, requireRole('CLINIC_ADMIN'), async (req, res) => {
  try {
    // TODO: Implement doctor invitation logic
    // This would typically involve:
    // 1. Creating a user account
    // 2. Sending invitation email
    // 3. Setting up temporary password

    res.redirect('/doctors');
  } catch (error) {
    console.error('Invite doctor error:', error);
    res.render('doctors/invite', {
      title: 'Invite Doctor',
      error: 'Failed to invite doctor. Please try again.'
    });
  }
});

module.exports = router;
