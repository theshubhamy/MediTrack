const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { requireAuth, requireClinicAccess } = require('../middlewares/auth');
const { ROLES, canViewAllData } = require('../utils/roles');

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
      prisma.patient.count({ where: patientWhere }),
      prisma.visit.count({ where: visitWhere })
    ];

    // Only admins and staff see doctor count
    if (canViewAllData(req.session.user)) {
      statsPromises.push(
        prisma.user.count({
          where: {
            clinicId,
            role: { in: ['DOCTOR', 'CLINIC_ADMIN'] },
            status: 'ACTIVE'
          }
        })
      );
    } else {
      statsPromises.push(Promise.resolve(0));
    }

    const [totalPatients, totalVisits, totalDoctors] = await Promise.all(statsPromises);

    // Get recent visits with role-based filtering
    const recentVisits = await prisma.visit.findMany({
      where: visitWhere,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Get user's own visit count for doctors
    let myVisitsCount = null;
    if (userRole === ROLES.DOCTOR) {
      myVisitsCount = await prisma.visit.count({
        where: {
          clinicId,
          doctorId: userId
        }
      });
    }

    res.render('dashboard/index', {
      title: 'Dashboard',
      stats: {
        totalPatients,
        totalVisits,
        totalDoctors: canViewAllData(req.session.user) ? totalDoctors : null,
        myVisitsCount
      },
      recentVisits,
      userRole,
      canViewAll: canViewAllData(req.session.user)
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

module.exports = router;

