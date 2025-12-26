const express = require('express');
const router = express.Router();
const { DoctorAvailability, User } = require('../models');
const { requireAuth, requireClinicAccess } = require('../middlewares/auth');
const { ROLES, canManageDoctors } = require('../utils/roles');
const { Op } = require('sequelize');

/**
 * GET /availability/:doctorId
 * Get doctor's availability schedule
 */
router.get('/:doctorId', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const clinicId = req.session.user.clinicId;

    // Verify doctor belongs to clinic
    const doctor = await User.findOne({
      where: {
        id: doctorId,
        clinicId,
        role: ROLES.DOCTOR,
      },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const availability = await DoctorAvailability.findAll({
      where: { doctorId },
      order: [['day_of_week', 'ASC']],
    });

    res.json({ availability });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

/**
 * POST /availability/:doctorId
 * Update doctor's availability
 */
router.post('/:doctorId', requireAuth, requireClinicAccess, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const clinicId = req.session.user.clinicId;
    const userRole = req.session.user.role;

    // Only clinic admin can manage availability, or doctor can manage their own
    if (!canManageDoctors(req.session.user) && req.session.user.id !== doctorId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify doctor belongs to clinic
    const doctor = await User.findOne({
      where: {
        id: doctorId,
        clinicId,
        role: ROLES.DOCTOR,
      },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const { schedule } = req.body; // Array of { dayOfWeek, startTime, endTime, isAvailable, slotDuration }

    // Delete existing availability
    await DoctorAvailability.destroy({ where: { doctorId } });

    // Create new availability
    if (schedule && Array.isArray(schedule)) {
      const availabilityRecords = schedule.map(item => ({
        doctorId,
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
        isAvailable: item.isAvailable !== false,
        slotDuration: item.slotDuration || 30,
      }));

      await DoctorAvailability.bulkCreate(availabilityRecords);
    }

    res.json({ success: true, message: 'Availability updated successfully' });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

module.exports = router;

