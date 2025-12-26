const express = require('express');
const router = express.Router();
const { Patient, Visit, User } = require('../models');
const { requireAuth, requireClinicAccess } = require('../middlewares/auth');
const { ROLES, canViewAllData } = require('../utils/roles');
const { Op } = require('sequelize');

/**
 * GET /dashboard
 * Show dashboard with role-based data filtering
 */
router.get('/', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const userRole = req.session.user.role;
    const userId = req.session.user.id;

    // Build where clause based on role
    const visitWhere = { clinicId };
    const patientWhere = { clinicId };

    // Doctors and READ_ONLY users see only their own visits
    if (userRole === ROLES.DOCTOR || userRole === ROLES.READ_ONLY) {
      visitWhere.doctorId = userId;
    }

    // Get statistics based on role
    const statsPromises = [
      Patient.count({ where: patientWhere }),
      Visit.count({ where: visitWhere }),
    ];

    // Only admins and staff see doctor count
    if (canViewAllData(req.session.user)) {
      statsPromises.push(
        User.count({
          where: {
            clinicId,
            role: { [Op.in]: ['DOCTOR', 'CLINIC_ADMIN'] },
            status: 'ACTIVE',
          },
        }),
      );
    } else {
      statsPromises.push(Promise.resolve(0));
    }

    const [totalPatients, totalVisits, totalDoctors] = await Promise.all(
      statsPromises,
    );

    // Get recent visits with role-based filtering
    const recentVisits = await Visit.findAll({
      where: visitWhere,
      limit: 10,
      order: [['created_at', 'DESC']],
      include: [
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
    });

    // Get user's own visit count for doctors
    let myVisitsCount = null;
    if (userRole === ROLES.DOCTOR) {
      myVisitsCount = await Visit.count({
        where: {
          clinicId,
          doctorId: userId,
        },
      });
    }

    res.render('dashboard/index', {
      title: 'Dashboard',
      stats: {
        totalPatients,
        totalVisits,
        totalDoctors: canViewAllData(req.session.user) ? totalDoctors : null,
        myVisitsCount,
      },
      recentVisits,
      userRole,
      canViewAll: canViewAllData(req.session.user),
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
    });
  }
});

module.exports = router;
