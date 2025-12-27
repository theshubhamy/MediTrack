const express = require('express');
const router = express.Router();
const { Patient, Visit, Appointment, User } = require('../models');
const { requireAuth, requireClinicAccess } = require('../middlewares/auth');
const { ROLES, canViewAllData } = require('../utils/roles');
const { Op } = require('sequelize');

/**
 * GET /search
 * Global search across patients, visits, and appointments
 */
router.get('/', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const clinicId = req.session.user.clinicId;
    const userRole = req.session.user.role;
    const userId = req.session.user.id;
    const { q, type } = req.query;

    if (!q || q.length < 2) {
      return res.render('search/results', {
        title: 'Search',
        query: q || '',
        results: {
          patients: [],
          visits: [],
          appointments: [],
        },
      });
    }

    const results = {
      patients: [],
      visits: [],
      appointments: [],
    };

    // Search patients
    if (!type || type === 'patients') {
      const patients = await Patient.findAll({
        where: {
          clinicId,
          [Op.or]: [
            { name: { [Op.iLike]: `%${q}%` } },
            { phone: { [Op.like]: `%${q}%` } },
          ],
        },
        limit: 10,
        order: [['name', 'ASC']],
      });
      results.patients = patients;
    }

    // Search visits
    if (!type || type === 'visits') {
      const visitWhere = {
        clinicId,
        [Op.or]: [
          { symptoms: { [Op.iLike]: `%${q}%` } },
          { diagnosis: { [Op.iLike]: `%${q}%` } },
          { notes: { [Op.iLike]: `%${q}%` } },
        ],
      };

      if (userRole === ROLES.DOCTOR) {
        visitWhere.doctorId = userId;
      }

      const visits = await Visit.findAll({
        where: visitWhere,
        include: [
          {
            model: Patient,
            as: 'patient',
            attributes: ['id', 'name'],
          },
          {
            model: User,
            as: 'doctor',
            attributes: ['id', 'name'],
          },
        ],
        limit: 10,
        order: [['created_at', 'DESC']],
      });
      results.visits = visits;
    }

    // Search appointments
    if (!type || type === 'appointments') {
      const appointmentWhere = {
        clinicId,
        [Op.or]: [
          { reason: { [Op.iLike]: `%${q}%` } },
          { notes: { [Op.iLike]: `%${q}%` } },
        ],
      };

      if (userRole === ROLES.DOCTOR) {
        appointmentWhere.doctorId = userId;
      }

      const appointments = await Appointment.findAll({
        where: appointmentWhere,
        include: [
          {
            model: Patient,
            as: 'patient',
            attributes: ['id', 'name'],
          },
          {
            model: User,
            as: 'doctor',
            attributes: ['id', 'name'],
          },
        ],
        limit: 10,
        order: [['appointment_date', 'DESC']],
      });
      results.appointments = appointments;
    }

    res.render('search/results', {
      title: 'Search Results',
      query: q,
      type: type || 'all',
      results,
      canViewAll: canViewAllData(req.session.user),
    });
  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

module.exports = router;

