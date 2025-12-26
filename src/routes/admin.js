const express = require('express');
const router = express.Router();
const { Clinic, User, Patient, Visit, sequelize } = require('../models');
const { requireAdminAuth } = require('../middlewares/auth');
const { Op } = require('sequelize');

/**
 * GET /admin
 * Admin dashboard
 */
router.get('/', requireAdminAuth, async (req, res) => {
  try {
    // Get statistics
    const [
      totalClinics,
      activeClinics,
      totalUsers,
      totalPatients,
      totalVisits
    ] = await Promise.all([
      Clinic.count(),
      Clinic.count({ where: { subscriptionStatus: 'ACTIVE' } }),
      User.count(),
      Patient.count(),
      Visit.count()
    ]);

    // Get recent clinics
    const recentClinics = await Clinic.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'users',
        attributes: ['id'],
        limit: 1
      }]
    });

    // Get clinics by plan
    const clinicsByPlan = await Clinic.findAll({
      attributes: [
        'plan',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['plan'],
      raw: true
    });

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      layout: 'layouts/admin',
      stats: {
        totalClinics,
        activeClinics,
        totalUsers,
        totalPatients,
        totalVisits
      },
      recentClinics,
      clinicsByPlan
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/admin',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/**
 * GET /admin/clinics
 * List all clinics
 */
router.get('/clinics', requireAdminAuth, async (req, res) => {
  try {
    const clinics = await Clinic.findAll({
      include: [{
        model: User,
        as: 'users',
        attributes: ['id', 'name', 'email', 'role'],
        limit: 5
      }],
      order: [['createdAt', 'DESC']]
    });

    res.render('admin/clinics', {
      title: 'Manage Clinics',
      layout: 'layouts/admin',
      clinics
    });
  } catch (error) {
    console.error('Admin clinics error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/admin',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/**
 * GET /admin/clinics/:id
 * View clinic details
 */
router.get('/clinics/:id', requireAdminAuth, async (req, res) => {
  try {
    const clinic = await Clinic.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'name', 'email', 'role', 'status', 'createdAt']
        },
        {
          model: Patient,
          as: 'patients',
          attributes: ['id', 'name', 'phone', 'createdAt'],
          limit: 10,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!clinic) {
      return res.status(404).render('errors/404', {
        title: 'Clinic Not Found',
        layout: 'layouts/admin'
      });
    }

    // Get visit count
    const visitCount = await Visit.count({
      where: { clinicId: clinic.id }
    });

    res.render('admin/clinic-detail', {
      title: `Clinic: ${clinic.name}`,
      layout: 'layouts/admin',
      clinic,
      visitCount
    });
  } catch (error) {
    console.error('Admin clinic detail error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/admin',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

module.exports = router;

