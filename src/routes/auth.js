const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { User, Clinic, Admin } = require('../models');
const { requireAuth } = require('../middlewares/auth');
const { validateLogin } = require('../middlewares/validation');
const { getRoleRedirect } = require('../utils/roles');
const { Op } = require('sequelize');

/**
 * GET /login
 * Show login page
 */
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  if (req.session.admin) {
    return res.redirect('/admin');
  }
  res.render('auth/login', {
    title: 'Login',
    layout: 'layouts/auth'
  });
});

/**
 * GET /admin/login
 * Show admin login page
 */
router.get('/admin/login', (req, res) => {
  if (req.session.admin) {
    return res.redirect('/admin');
  }
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('admin/login', {
    title: 'Admin Login',
    layout: 'layouts/auth'
  });
});

/**
 * POST /admin/login
 * Handle admin login
 */
router.post('/admin/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin
    const admin = await Admin.findOne({
      where: { email }
    });

    if (!admin) {
      return res.render('admin/login', {
        title: 'Admin Login',
        layout: 'layouts/auth',
        error: 'Invalid email or password'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
    if (!isValidPassword) {
      return res.render('admin/login', {
        title: 'Admin Login',
        layout: 'layouts/auth',
        error: 'Invalid email or password'
      });
    }

    // Check admin status
    if (admin.status !== 'ACTIVE') {
      return res.render('admin/login', {
        title: 'Admin Login',
        layout: 'layouts/auth',
        error: 'Your account is not active. Please contact support.'
      });
    }

    // Create session
    req.session.admin = {
      id: admin.id,
      name: admin.name,
      email: admin.email
    };

    // Regenerate session ID for security
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error:', err);
      }
      res.redirect('/admin');
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.render('admin/login', {
      title: 'Admin Login',
      layout: 'layouts/auth',
      error: 'An error occurred. Please try again.'
    });
  }
});

/**
 * POST /login
 * Handle login
 */
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with clinic information
    const user = await User.findOne({
      where: { email },
      include: [{
        model: Clinic,
        as: 'clinic'
      }]
    });

    if (!user) {
      return res.render('auth/login', {
        title: 'Login',
        layout: 'layouts/auth',
        error: 'Invalid email or password'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.render('auth/login', {
        title: 'Login',
        layout: 'layouts/auth',
        error: 'Invalid email or password'
      });
    }

    // Check user status
    if (user.status !== 'ACTIVE') {
      return res.render('auth/login', {
        title: 'Login',
        layout: 'layouts/auth',
        error: 'Your account is not active. Please contact your administrator.'
      });
    }

    // Create session
    req.session.user = {
      id: user.id,
      clinicId: user.clinicId,
      name: user.name,
      email: user.email,
      role: user.role
    };

    req.session.clinic = {
      id: user.clinic.id,
      name: user.clinic.name
    };

    // Regenerate session ID for security
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error:', err);
      }
      // Redirect based on user role
      const redirectUrl = getRoleRedirect(user.role);
      res.redirect(redirectUrl);
    });
  } catch (error) {
    console.error('Login error:', error);
    res.render('auth/login', {
      title: 'Login',
      layout: 'layouts/auth',
      error: 'An error occurred. Please try again.'
    });
  }
});

/**
 * POST /logout
 * Handle logout
 */
router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login');
  });
});

/**
 * GET /logout
 * Handle logout (GET request for convenience)
 */
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login');
  });
});

/**
 * GET /admin/logout
 * Handle admin logout
 */
router.get('/admin/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/admin/login');
  });
});

module.exports = router;
