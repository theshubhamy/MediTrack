const express = require('express');
const router = express.Router();
const { Patient, Visit, User, Prescription, Appointment } = require('../models');
const { requireAuth, requireClinicAccess } = require('../middlewares/auth');
const { ROLES, canViewAllData } = require('../utils/roles');
const { Op } = require('sequelize');
const { sequelize } = require('../models');

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

    // Doctors see only their own visits
    if (userRole === ROLES.DOCTOR) {
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

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's visits
    const todayVisitsWhere = {
      ...visitWhere,
      created_at: {
        [Op.gte]: today,
        [Op.lt]: tomorrow,
      },
    };
    const todayVisits = await Visit.findAll({
      where: todayVisitsWhere,
      limit: 5,
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

    // Get upcoming appointments from Appointments table
    const appointmentWhere = { clinicId };

    // Doctors see only their appointments
    if (userRole === ROLES.DOCTOR) {
      appointmentWhere.doctorId = userId;
    }

    // Only show scheduled/confirmed appointments (not completed/cancelled)
    appointmentWhere.status = {
      [Op.in]: ['SCHEDULED', 'CONFIRMED']
    };

    // Get appointments from today onwards
    appointmentWhere.appointmentDate = {
      [Op.gte]: today.toISOString().split('T')[0] // DATEONLY format
    };

    const upcomingAppointments = await Appointment.findAll({
      where: appointmentWhere,
      limit: 5,
      order: [
        ['appointment_date', 'ASC'],
        ['appointment_time', 'ASC']
      ],
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

    // Also get upcoming follow-ups from Visit.nextVisitDate
    const upcomingFollowUps = await Visit.findAll({
      where: {
        ...visitWhere,
        nextVisitDate: {
          [Op.gte]: today,
        },
      },
      limit: 5,
      order: [['next_visit_date', 'ASC']],
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

    // Get monthly statistics
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyVisitsWhere = {
      ...visitWhere,
      created_at: {
        [Op.gte]: startOfMonth,
      },
    };
    const monthlyStats = {
      visitsThisMonth: await Visit.count({ where: monthlyVisitsWhere }),
      newPatientsThisMonth: await Patient.count({
        where: {
          ...patientWhere,
          created_at: {
            [Op.gte]: startOfMonth,
          },
        },
      }),
    };

    // Get recent patients
    const recentPatients = await Patient.findAll({
      where: patientWhere,
      limit: 5,
      order: [['created_at', 'DESC']],
    });

    // Get visit trends for last 7 days
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const allRecentVisits = await Visit.findAll({
      where: {
        ...visitWhere,
        created_at: {
          [Op.gte]: sevenDaysAgo,
        },
      },
      attributes: ['created_at'],
      raw: true,
    });

    // Group visits by date
    const visitTrendsMap = {};
    allRecentVisits.forEach(visit => {
      const date = new Date(visit.created_at).toISOString().split('T')[0];
      visitTrendsMap[date] = (visitTrendsMap[date] || 0) + 1;
    });

    // Convert to array and fill missing dates
    const visitTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      visitTrends.push({
        date: dateStr,
        count: visitTrendsMap[dateStr] || 0,
      });
    }

    // Get total prescriptions count for this clinic
    const visitIds = await Visit.findAll({
      where: visitWhere,
      attributes: ['id'],
      raw: true,
    });
    const visitIdArray = visitIds.map(v => v.id);
    const totalPrescriptions = visitIdArray.length > 0
      ? await Prescription.count({
          where: {
            visitId: {
              [Op.in]: visitIdArray,
            },
          },
        })
      : 0;

    // Get this week's visits
    const startOfWeek = new Date(today);
    startOfWeek.setDate(startOfWeek.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const weeklyVisits = await Visit.count({
      where: {
        ...visitWhere,
        created_at: {
          [Op.gte]: startOfWeek,
        },
      },
    });

    res.render('dashboard/index', {
      title: 'Dashboard',
      stats: {
        totalPatients,
        totalVisits,
        totalDoctors: canViewAllData(req.session.user) ? totalDoctors : null,
        myVisitsCount,
        todayVisitsCount: todayVisits.length,
        weeklyVisits,
        monthlyVisits: monthlyStats.visitsThisMonth,
        newPatientsThisMonth: monthlyStats.newPatientsThisMonth,
        totalPrescriptions,
      },
      recentVisits,
      todayVisits,
      upcomingAppointments,
      upcomingFollowUps,
      recentPatients,
      visitTrends,
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
