const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const prisma = require('../config/database');
const { requireAuth } = require('../middlewares/auth');
const { validateLogin } = require('../middlewares/validation');
const { getRoleRedirect } = require('../utils/roles');

/**
 * GET /login
 * Show login page
 */
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('auth/login', {
    title: 'Login',
    layout: 'layouts/auth'
  });
});

/**
 * POST /login
 * Handle login
 */
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with clinic information
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        clinic: true
      }
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
router.get('/logout', requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login');
  });
});

module.exports = router;

