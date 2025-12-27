const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { Clinic, User, Invoice } = require('../models');
const { requireAuth, requireClinicAccess, requireRole } = require('../middlewares/auth');
const { ROLES, canManageClinic } = require('../utils/roles');
const { Op } = require('sequelize');

/**
 * GET /settings
 * Show settings dashboard
 */
router.get('/', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const clinic = await Clinic.findByPk(clinicId);
    const user = await User.findByPk(req.session.user.id);

    res.render('settings/index', {
      title: 'Settings',
      clinic,
      user,
      success: req.query.success,
    });
  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * GET /settings/clinic
 * Clinic profile management
 */
router.get('/clinic', requireAuth, requireClinicAccess, requireRole(ROLES.CLINIC_ADMIN), async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const clinic = await Clinic.findByPk(clinicId);

    res.render('settings/clinic', {
      title: 'Clinic Profile',
      clinic,
      success: req.query.success,
    });
  } catch (error) {
    console.error('Clinic settings error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * POST /settings/clinic
 * Update clinic profile
 */
router.post('/clinic', requireAuth, requireClinicAccess, requireRole(ROLES.CLINIC_ADMIN), async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const {
      name,
      phone,
      address,
      email,
      website,
      registrationNumber,
      taxId,
    } = req.body;

    const clinic = await Clinic.findByPk(clinicId);
    if (!clinic) {
      return res.status(404).render('errors/404', {
        title: 'Clinic Not Found',
        layout: 'layouts/main',
      });
    }

    await clinic.update({
      name: name || clinic.name,
      phone: phone || clinic.phone,
      address: address || clinic.address,
      email: email || clinic.email,
      website: website || clinic.website,
      registrationNumber: registrationNumber || clinic.registrationNumber,
      taxId: taxId || clinic.taxId,
    });

    req.session.clinic = {
      id: clinic.id,
      name: clinic.name,
    };

    res.redirect('/settings/clinic?success=Profile updated successfully');
  } catch (error) {
    console.error('Update clinic error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * GET /settings/profile
 * User profile management
 */
router.get('/profile', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.user.id, {
      attributes: ['id', 'name', 'email', 'phone', 'role', 'preferredLanguage', 'timezone', 'emailNotificationsEnabled', 'smsNotificationsEnabled', 'appointmentReminders', 'visitReminders']
    });

    res.render('settings/profile', {
      title: 'My Profile',
      user,
      success: req.query.success,
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * POST /settings/profile
 * Update user profile
 */
router.post('/profile', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const { name, phone, preferredLanguage, timezone } = req.body;

    const user = await User.findByPk(req.session.user.id);
    if (!user) {
      return res.status(404).render('errors/404', {
        title: 'User Not Found',
        layout: 'layouts/main',
      });
    }

    await user.update({
      name: name || user.name,
      phone: phone || user.phone,
      preferredLanguage: preferredLanguage || user.preferredLanguage,
      timezone: timezone || user.timezone,
    });

    req.session.user = {
      ...req.session.user,
      name: user.name,
    };

    res.redirect('/settings/profile?success=Profile updated successfully');
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * GET /settings/password
 * Password change page
 */
router.get('/password', requireAuth, requireClinicAccess, async (req, res) => {
  res.render('settings/password', {
    title: 'Change Password',
  });
});

/**
 * POST /settings/password
 * Change password
 */
router.post('/password', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.render('settings/password', {
        title: 'Change Password',
        error: 'All fields are required',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.render('settings/password', {
        title: 'Change Password',
        error: 'New passwords do not match',
      });
    }

    if (newPassword.length < 6) {
      return res.render('settings/password', {
        title: 'Change Password',
        error: 'Password must be at least 6 characters',
      });
    }

    const user = await User.findByPk(req.session.user.id);

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.render('settings/password', {
        title: 'Change Password',
        error: 'Current password is incorrect',
      });
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    await user.update({
      passwordHash: newPasswordHash,
    });

    res.redirect('/settings/password?success=Password changed successfully');
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * GET /settings/email
 * Email settings
 */
router.get('/email', requireAuth, requireClinicAccess, requireRole(ROLES.CLINIC_ADMIN), async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const clinic = await Clinic.findByPk(clinicId);

    res.render('settings/email', {
      title: 'Email Settings',
      clinic,
      success: req.query.success,
    });
  } catch (error) {
    console.error('Email settings error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * POST /settings/email
 * Update email settings
 */
router.post('/email', requireAuth, requireClinicAccess, requireRole(ROLES.CLINIC_ADMIN), async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const {
      email,
      emailNotificationsEnabled,
      smsNotificationsEnabled,
      appointmentReminders,
      visitReminders,
    } = req.body;

    const clinic = await Clinic.findByPk(clinicId);
    await clinic.update({
      email: email || clinic.email,
      emailNotificationsEnabled: emailNotificationsEnabled === 'on',
      smsNotificationsEnabled: smsNotificationsEnabled === 'on',
      appointmentReminders: appointmentReminders === 'on',
      visitReminders: visitReminders === 'on',
    });

    res.redirect('/settings/email?success=Email settings updated successfully');
  } catch (error) {
    console.error('Update email settings error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * GET /settings/notifications
 * Notification preferences
 */
router.get('/notifications', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.user.id);

    res.render('settings/notifications', {
      title: 'Notification Preferences',
      user,
      success: req.query.success,
    });
  } catch (error) {
    console.error('Notifications settings error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * POST /settings/notifications
 * Update notification preferences
 */
router.post('/notifications', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const {
      emailNotificationsEnabled,
      smsNotificationsEnabled,
      appointmentReminders,
      visitReminders,
    } = req.body;

    const user = await User.findByPk(req.session.user.id);
    await user.update({
      emailNotificationsEnabled: emailNotificationsEnabled === 'on',
      smsNotificationsEnabled: smsNotificationsEnabled === 'on',
      appointmentReminders: appointmentReminders === 'on',
      visitReminders: visitReminders === 'on',
    });

    res.redirect('/settings/notifications?success=Notification preferences updated successfully');
  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * GET /settings/billing
 * Billing & subscription management
 */
router.get('/billing', requireAuth, requireClinicAccess, requireRole(ROLES.CLINIC_ADMIN), async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const clinic = await Clinic.findByPk(clinicId);

    // Get invoices
    const invoices = await Invoice.findAll({
      where: { clinicId },
      order: [['created_at', 'DESC']],
      limit: 10,
    });

    // Plan pricing (example)
    const planPricing = {
      FREE: { price: 0, features: ['Basic features', 'Up to 50 patients'] },
      STARTER: { price: 29, features: ['All basic features', 'Up to 200 patients', 'Email support'] },
      CLINIC: { price: 79, features: ['All starter features', 'Unlimited patients', 'Priority support', 'Advanced analytics'] },
      PRO: { price: 149, features: ['All clinic features', 'Custom integrations', 'Dedicated support', 'API access'] },
    };

    res.render('settings/billing', {
      title: 'Billing & Subscription',
      clinic,
      invoices,
      planPricing,
    });
  } catch (error) {
    console.error('Billing error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * POST /settings/billing/upgrade
 * Upgrade subscription plan
 */
router.post('/billing/upgrade', requireAuth, requireClinicAccess, requireRole(ROLES.CLINIC_ADMIN), async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const { plan } = req.body;

    if (!['FREE', 'STARTER', 'CLINIC', 'PRO'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const clinic = await Clinic.findByPk(clinicId);
    await clinic.update({
      plan,
      subscriptionStatus: 'ACTIVE',
    });

    res.json({ success: true, message: 'Plan upgraded successfully' });
  } catch (error) {
    console.error('Upgrade plan error:', error);
    res.status(500).json({ error: 'Failed to upgrade plan' });
  }
});

/**
 * GET /settings/invoices
 * List all invoices
 */
router.get('/invoices', requireAuth, requireClinicAccess, requireRole(ROLES.CLINIC_ADMIN), async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const invoices = await Invoice.findAll({
      where: { clinicId },
      order: [['created_at', 'DESC']],
    });

    res.render('settings/invoices', {
      title: 'Invoices',
      invoices,
    });
  } catch (error) {
    console.error('Invoices list error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * GET /settings/invoices/:id
 * View invoice
 */
router.get('/invoices/:id', requireAuth, requireClinicAccess, requireRole(ROLES.CLINIC_ADMIN), async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const invoice = await Invoice.findOne({
      where: {
        id: req.params.id,
        clinicId,
      },
      include: [
        {
          model: Clinic,
          as: 'clinic',
        },
      ],
    });

    if (!invoice) {
      return res.status(404).render('errors/404', {
        title: 'Invoice Not Found',
        layout: 'layouts/main',
      });
    }

    res.render('settings/invoice-detail', {
      title: 'Invoice Details',
      invoice,
    });
  } catch (error) {
    console.error('Invoice detail error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * GET /settings/invoices/:id/print
 * Print invoice
 */
router.get('/invoices/:id/print', requireAuth, requireClinicAccess, requireRole(ROLES.CLINIC_ADMIN), async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const invoice = await Invoice.findOne({
      where: {
        id: req.params.id,
        clinicId,
      },
      include: [
        {
          model: Clinic,
          as: 'clinic',
        },
      ],
    });

    if (!invoice) {
      return res.status(404).render('errors/404', {
        title: 'Invoice Not Found',
        layout: 'layouts/main',
      });
    }

    res.render('settings/invoice-print', {
      title: 'Invoice',
      layout: 'layouts/print',
      invoice,
    });
  } catch (error) {
    console.error('Print invoice error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * POST /settings/payment
 * Process payment (placeholder for payment integration)
 */
router.post('/payment', requireAuth, requireClinicAccess, requireRole(ROLES.CLINIC_ADMIN), async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const { plan, paymentMethod, amount } = req.body;

    // TODO: Integrate with payment gateway (Stripe, PayPal, etc.)
    // This is a placeholder implementation

    // Generate invoice
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const invoice = await Invoice.create({
      clinicId,
      invoiceNumber,
      plan,
      amount: parseFloat(amount),
      taxAmount: parseFloat(amount) * 0.1, // 10% tax (example)
      totalAmount: parseFloat(amount) * 1.1,
      currency: 'USD',
      status: 'PAID',
      dueDate: dueDate.toISOString().split('T')[0],
      paidDate: new Date(),
      paymentMethod,
      paymentTransactionId: `TXN-${Date.now()}`,
      billingPeriodStart: new Date().toISOString().split('T')[0],
      billingPeriodEnd: dueDate.toISOString().split('T')[0],
    });

    // Update clinic plan
    const clinic = await Clinic.findByPk(clinicId);
    await clinic.update({
      plan,
      subscriptionStatus: 'ACTIVE',
    });

    res.json({
      success: true,
      message: 'Payment processed successfully',
      invoiceId: invoice.id,
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

module.exports = router;
