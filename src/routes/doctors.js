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
const bcrypt = require('bcrypt');
const { generatePassword, isValidEmail } = require('../utils/helpers');
const { logActivity } = require('../utils/activityLogger');
const { sendEmail } = require('../utils/notification');

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
      success: req.query.success,
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
      const clinicId = req.session.user.clinicId;
      const { name, email, phone } = req.body;

      if (!name || !email) {
        return res.render('doctors/invite', {
          title: 'Invite Doctor',
          error: 'Name and email are required fields.',
          name: name || '',
          email: email || '',
          phone: phone || '',
        });
      }

      if (!isValidEmail(email)) {
        return res.render('doctors/invite', {
          title: 'Invite Doctor',
          error: 'Please enter a valid email address.',
          name,
          email,
          phone,
        });
      }

      // Check if email already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.render('doctors/invite', {
          title: 'Invite Doctor',
          error: 'A user with this email address already exists.',
          name,
          email,
          phone,
        });
      }

      // Generate temporary password
      const tempPassword = generatePassword(10);
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(tempPassword, saltRounds);

      // Create DOCTOR user
      const doctor = await User.create({
        clinicId,
        name,
        email,
        phone: phone || null,
        passwordHash,
        role: 'DOCTOR',
        status: 'ACTIVE',
      });

      // Log activity
      await logActivity({
        action: 'DOCTOR_INVITED',
        entityType: 'User',
        entityId: doctor.id,
        description: `Doctor ${name} invited by Admin`,
        userId: req.session.user.id,
        clinicId,
        req,
      });

      // Send invitation email via notification helper
      await sendEmail({
        to: email,
        subject: 'Welcome to MediTrack AI - Invitation to Join',
        body: `Hello Dr. ${name},\n\nYou have been invited to join the MediTrack AI clinic operations platform.\n\nYour temporary credentials are:\nEmail: ${email}\nPassword: ${tempPassword}\n\nPlease login and change your password at: http://localhost:3000/login\n\nBest regards,\nMediTrack Team`,
      });

      // Redirect with success message including temporary password so admin can copy it
      const successMessage = encodeURIComponent(
        `Doctor ${name} successfully invited! Temporary password: ${tempPassword}`
      );
      res.redirect(`/doctors?success=${successMessage}`);
    } catch (error) {
      console.error('Invite doctor error:', error);
      res.render('doctors/invite', {
        title: 'Invite Doctor',
        error: 'Failed to invite doctor. Please try again.',
        name: req.body.name || '',
        email: req.body.email || '',
        phone: req.body.phone || '',
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
