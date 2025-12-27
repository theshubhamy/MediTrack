const express = require('express');
const router = express.Router();
const { User } = require('../models');
const {
  requireAuth,
  requireClinicAccess,
  requireRole,
} = require('../middlewares/auth');
const { ROLES, canManageDoctors } = require('../utils/roles');
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
        status: 'ACTIVE',
      },
      attributes: ['id', 'name', 'email', 'phone', 'role', 'created_at'],
      order: [['created_at', 'DESC']],
    });
    console.log(
      'doctors',
      doctors.map(doctor => new Date(doctor.createdAt).toLocaleString()),
    );

    res.render('doctors/index', {
      title: 'Doctors',
      doctors,
      canManageDoctors: canManageDoctors(req.session.user),
      currentUserId: req.session.user.id,
      userRole: req.session.user.role,
    });
  } catch (error) {
    console.error('Doctors list error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
    });
  }
});

/**
 * GET /doctors/invite
 * Show invite doctor form (only for clinic admins)
 */
router.get(
  '/invite',
  requireAuth,
  requireClinicAccess,
  requireRole('CLINIC_ADMIN'),
  (req, res) => {
    res.render('doctors/invite', {
      title: 'Invite Doctor',
    });
  },
);

/**
 * POST /doctors/invite
 * Invite new doctor (only for clinic admins)
 */
router.post(
  '/invite',
  requireAuth,
  requireClinicAccess,
  requireRole('CLINIC_ADMIN'),
  async (req, res) => {
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
        error: 'Failed to invite doctor. Please try again.',
      });
    }
  },
);

/**
 * GET /doctors/:id/edit
 * Show edit doctor profile form
 * CLINIC_ADMIN can edit any doctor, DOCTOR can edit their own profile
 */
router.get('/:id/edit', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const userId = req.session.user.id;
    const userRole = req.session.user.role;
    const { id } = req.params;

    // Check authorization: CLINIC_ADMIN can edit any doctor, DOCTOR can only edit their own
    if (userRole !== ROLES.CLINIC_ADMIN && id !== userId) {
      return res.status(403).render('errors/403', {
        title: 'Access Denied',
        layout: 'layouts/main',
      });
    }

    const doctor = await User.findOne({
      where: {
        id,
        clinicId,
        role: { [Op.in]: ['DOCTOR', 'CLINIC_ADMIN'] },
      },
    });

    if (!doctor) {
      return res.status(404).render('errors/404', {
        title: 'Doctor Not Found',
        layout: 'layouts/main',
      });
    }

    res.render('doctors/edit', {
      title: `Edit Doctor: ${doctor.name}`,
      doctor,
      isOwnProfile: id === userId,
      success: req.query.success,
    });
  } catch (error) {
    console.error('Edit doctor form error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
    });
  }
});

/**
 * POST /doctors/:id
 * Update doctor profile
 * CLINIC_ADMIN can update any doctor, DOCTOR can update their own profile
 */
router.post('/:id', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const userId = req.session.user.id;
    const userRole = req.session.user.role;
    const { id } = req.params;
    const { name, phone, preferredLanguage, timezone, emailNotificationsEnabled, smsNotificationsEnabled, appointmentReminders, visitReminders } = req.body;

    // Check authorization: CLINIC_ADMIN can update any doctor, DOCTOR can only update their own
    if (userRole !== ROLES.CLINIC_ADMIN && id !== userId) {
      return res.status(403).render('errors/403', {
        title: 'Access Denied',
        layout: 'layouts/main',
      });
    }

    const doctor = await User.findOne({
      where: {
        id,
        clinicId,
        role: { [Op.in]: ['DOCTOR', 'CLINIC_ADMIN'] },
      },
    });

    if (!doctor) {
      return res.status(404).render('errors/404', {
        title: 'Doctor Not Found',
        layout: 'layouts/main',
      });
    }

    // Update doctor profile
    await doctor.update({
      name: name || doctor.name,
      phone: phone || doctor.phone,
      preferredLanguage: preferredLanguage || doctor.preferredLanguage,
      timezone: timezone || doctor.timezone,
      emailNotificationsEnabled: emailNotificationsEnabled === 'on' || emailNotificationsEnabled === true,
      smsNotificationsEnabled: smsNotificationsEnabled === 'on' || smsNotificationsEnabled === true,
      appointmentReminders: appointmentReminders === 'on' || appointmentReminders === true,
      visitReminders: visitReminders === 'on' || visitReminders === true,
    });

    // Update session if updating own profile
    if (id === userId) {
      req.session.user = {
        ...req.session.user,
        name: doctor.name,
      };
    }

    res.redirect(`/doctors/${id}/edit?success=Profile updated successfully`);
  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
    });
  }
});

module.exports = router;
