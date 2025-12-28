const express = require('express');
const router = express.Router();
const { Clinic, User, Patient, Visit, Appointment, ActivityLog, Invoice, sequelize } = require('../models');
const { requireAdminAuth } = require('../middlewares/auth');
const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');
const { logActivity } = require('../utils/activityLogger');

/**
 * GET /admin
 * Admin dashboard
 */
router.get('/', requireAdminAuth, async (req, res) => {
  try {
    // Support both period (days) and custom date range
    let startDate, endDate;
    const { period, start_date, end_date } = req.query;

    if (start_date && end_date) {
      // Custom date range
      startDate = new Date(start_date);
      endDate = new Date(end_date);
      endDate.setHours(23, 59, 59, 999); // End of day
    } else {
      // Default to period-based (backward compatible)
      const daysAgo = parseInt(period || '30');
      startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      endDate = new Date();
    }

    // Get basic statistics
    const [
      totalClinics,
      activeClinics,
      totalUsers,
      totalPatients,
      totalVisits,
      totalAppointments,
    ] = await Promise.all([
      Clinic.count(),
      Clinic.count({ where: { subscriptionStatus: 'ACTIVE' } }),
      User.count(),
      Patient.count(),
      Visit.count(),
      Appointment.count(),
    ]);

    // Growth metrics (new items in selected period)
    const [
      newClinics,
      newUsers,
      newPatients,
      newVisits,
      newAppointments,
    ] = await Promise.all([
      Clinic.count({ where: { created_at: { [Op.between]: [startDate, endDate] } } }),
      User.count({ where: { created_at: { [Op.between]: [startDate, endDate] } } }),
      Patient.count({ where: { created_at: { [Op.between]: [startDate, endDate] } } }),
      Visit.count({ where: { created_at: { [Op.between]: [startDate, endDate] } } }),
      Appointment.count({ where: { created_at: { [Op.between]: [startDate, endDate] } } }),
    ]);

    // Time-based analytics - daily data for selected period
    const dailyStats = await Visit.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: {
        created_at: { [Op.between]: [startDate, endDate] },
      },
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      raw: true,
    });

    // User role distribution
    const userRoleDistribution = await User.findAll({
      attributes: [
        'role',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['role'],
      raw: true,
    });

    // Clinics by plan
    const clinicsByPlan = await Clinic.findAll({
      attributes: [
        'plan',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['plan'],
      raw: true,
    });

    // Clinic subscription status distribution
    const clinicsByStatus = await Clinic.findAll({
      attributes: [
        'subscriptionStatus',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['subscriptionStatus'],
      raw: true,
    });

    // Most active clinics (by visit count) - using raw SQL query
    const mostActiveClinicsRaw = await sequelize.query(
      `SELECT
        c.id,
        c.name,
        c.plan,
        c.subscription_status AS "subscriptionStatus",
        COUNT(v.id) AS "visitCount"
      FROM clinics c
      LEFT JOIN visits v ON c.id = v.clinic_id
      GROUP BY c.id, c.name, c.plan, c.subscription_status
      ORDER BY COUNT(v.id) DESC
      LIMIT 10`,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Convert to plain objects with proper formatting
    const mostActiveClinicsWithCounts = mostActiveClinicsRaw.map(item => ({
      id: item.id,
      name: item.name,
      plan: item.plan,
      subscriptionStatus: item.subscriptionStatus,
      visitCount: parseInt(item.visitCount) || 0,
    }));

    // Get recent clinics
    const recentClinics = await Clinic.findAll({
      limit: 10,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id'],
          limit: 1,
        },
      ],
    });

    // System health metrics
    const systemHealth = {
      database: 'healthy', // Could check actual DB connection
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      layout: 'layouts/admin',
      stats: {
        totalClinics,
        activeClinics,
        totalUsers,
        totalPatients,
        totalVisits,
        totalAppointments,
      },
      growth: {
        newClinics,
        newUsers,
        newPatients,
        newVisits,
        newAppointments,
        period: start_date && end_date ? null : parseInt(period || '30'),
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        isCustomRange: !!(start_date && end_date),
      },
      analytics: {
        dailyStats,
        userRoleDistribution,
        clinicsByPlan,
        clinicsByStatus,
        mostActiveClinics: mostActiveClinicsWithCounts,
      },
      recentClinics,
      systemHealth,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/admin',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
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
          attributes: ['id', 'name', 'email', 'role', 'status', 'created_at'],
        },
        {
          model: Patient,
          as: 'patients',
          attributes: ['id', 'name', 'phone', 'created_at'],
          limit: 10,
          order: [['created_at', 'DESC']],
        },
      ],
    });

    if (!clinic) {
      return res.status(404).render('errors/404', {
        title: 'Clinic Not Found',
        layout: 'layouts/admin',
      });
    }

    // Get visit count
    const visitCount = await Visit.count({
      where: { clinicId: clinic.id },
    });
    res.render('admin/clinic-detail', {
      title: `Clinic: ${clinic.name}`,
      layout: 'layouts/admin',
      clinic,
      visitCount,
    });
  } catch (error) {
    console.error('Admin clinic detail error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/admin',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * GET /admin/users
 * System-wide user management
 */
router.get('/users', requireAdminAuth, async (req, res) => {
  try {
    const { search, role, status, clinicId, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;
    if (clinicId) where.clinicId = clinicId;

    const { count, rows: users } = await User.findAndCountAll({
      where,
      include: [
        {
          model: Clinic,
          as: 'clinic',
          attributes: ['id', 'name'],
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    // User role distribution
    const roleDistribution = await User.findAll({
      attributes: [
        'role',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['role'],
      raw: true,
    });

    // User status distribution
    const statusDistribution = await User.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    // Get all clinics for filter
    const clinics = await Clinic.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
    });

    res.render('admin/users', {
      title: 'User Management',
      layout: 'layouts/admin',
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit)),
      },
      filters: { search, role, status, clinicId },
      roleDistribution,
      statusDistribution,
      clinics,
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/admin',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * GET /admin/users/:id
 * View user details
 */
router.get('/users/:id', requireAdminAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [
        {
          model: Clinic,
          as: 'clinic',
        },
        {
          model: Visit,
          as: 'visits',
          limit: 10,
          order: [['created_at', 'DESC']],
          include: [
            {
              model: Patient,
              as: 'patient',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
    });

    if (!user) {
      return res.status(404).render('errors/404', {
        title: 'User Not Found',
        layout: 'layouts/admin',
      });
    }

    // Get user statistics
    const visitCount = await Visit.count({ where: { doctorId: user.id } });
    const appointmentCount = await Appointment.count({ where: { doctorId: user.id } });

    // Get login history (last 20 logins)
    const loginHistory = await ActivityLog.findAll({
      where: {
        userId: user.id,
        action: { [Op.in]: ['USER_LOGIN_SUCCESS', 'USER_LOGIN_FAILED'] },
      },
      order: [['created_at', 'DESC']],
      limit: 20,
      attributes: ['id', 'action', 'created_at', 'ipAddress', 'userAgent'],
    });

    // Get user activity summary
    const activitySummary = await ActivityLog.findAll({
      attributes: [
        'action',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: {
        userId: user.id,
        created_at: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      group: ['action'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true,
    });

    res.render('admin/user-detail', {
      title: `User: ${user.name}`,
      layout: 'layouts/admin',
      user,
      stats: {
        visitCount,
        appointmentCount,
      },
      loginHistory,
      activitySummary,
    });
  } catch (error) {
    console.error('Admin user detail error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/admin',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * POST /admin/users/:id/status
 * Update user status
 */
router.post('/users/:id/status', requireAdminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const oldStatus = user.status;
    user.status = status;
    await user.save();

    // Log activity
    await logActivity({
      action: 'USER_STATUS_UPDATED',
      entityType: 'User',
      entityId: user.id,
      description: `User status changed from ${oldStatus} to ${status}`,
      adminId: req.session.admin?.id,
      clinicId: user.clinicId,
      req,
    });

    res.redirect(`/admin/users/${user.id}?success=User status updated`);
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

/**
 * POST /admin/users/bulk-status
 * Bulk update user status
 */
router.post('/users/bulk-status', requireAdminAuth, async (req, res) => {
  try {
    const { userIds, status } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'No users selected' });
    }

    const users = await User.findAll({
      where: { id: { [Op.in]: userIds } },
    });

    let updated = 0;
    for (const user of users) {
      const oldStatus = user.status;
      user.status = status;
      await user.save();

      // Log activity
      await logActivity({
        action: 'USER_STATUS_UPDATED',
        entityType: 'User',
        entityId: user.id,
        description: `Bulk update: User status changed from ${oldStatus} to ${status}`,
        adminId: req.session.admin?.id,
        clinicId: user.clinicId,
        req,
      });

      updated++;
    }

    res.json({ success: true, message: `${updated} users updated`, count: updated });
  } catch (error) {
    console.error('Bulk update user status error:', error);
    res.status(500).json({ error: 'Failed to update users' });
  }
});

/**
 * GET /admin/users/:id/activity
 * View user activity history
 */
router.get('/users/:id/activity', requireAdminAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{ model: Clinic, as: 'clinic', attributes: ['name'] }],
    });

    if (!user) {
      return res.status(404).render('errors/404', {
        title: 'User Not Found',
        layout: 'layouts/admin',
      });
    }

    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: activities } = await ActivityLog.findAndCountAll({
      where: { userId: user.id },
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
      include: [
        { model: Clinic, as: 'clinic', attributes: ['name'], required: false },
      ],
    });

    res.render('admin/user-activity', {
      title: `User Activity: ${user.name}`,
      layout: 'layouts/admin',
      user,
      activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('User activity error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/admin',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * GET /admin/clinics (enhanced)
 * List all clinics with search and filtering
 */
router.get('/clinics', requireAdminAuth, async (req, res) => {
  try {
    const { search, plan, status, startDate, endDate, sortBy = 'created_at', page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (plan) where.plan = plan;
    if (status) where.subscriptionStatus = status;

    // Date range filter
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.created_at[Op.lte] = end;
      }
    }

    // Determine sort order
    let order = [['created_at', 'DESC']];
    if (sortBy === 'name') order = [['name', 'ASC']];
    else if (sortBy === 'plan') order = [['plan', 'ASC'], ['created_at', 'DESC']];
    else if (sortBy === 'created_at') order = [['created_at', 'DESC']];

    const { count, rows: clinics } = await Clinic.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'name', 'email', 'role'],
          limit: 5,
        },
      ],
      limit: parseInt(limit),
      offset,
      order,
    });

    // Get statistics for filters
    const clinicsByPlan = await Clinic.findAll({
      attributes: [
        'plan',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['plan'],
      raw: true,
    });

    const clinicsByStatus = await Clinic.findAll({
      attributes: [
        'subscriptionStatus',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['subscriptionStatus'],
      raw: true,
    });

    res.render('admin/clinics', {
      title: 'Manage Clinics',
      layout: 'layouts/admin',
      clinics,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit)),
      },
      filters: { search, plan, status, startDate, endDate, sortBy },
      clinicsByPlan,
      clinicsByStatus,
    });
  } catch (error) {
    console.error('Admin clinics error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/admin',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * POST /admin/clinics/:id/status
 * Update clinic status
 */
router.post('/clinics/:id/status', requireAdminAuth, async (req, res) => {
  try {
    const { subscriptionStatus } = req.body;
    const clinic = await Clinic.findByPk(req.params.id);

    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    const oldStatus = clinic.subscriptionStatus;
    clinic.subscriptionStatus = subscriptionStatus;
    await clinic.save();

    // Log activity
    await logActivity({
      action: 'CLINIC_STATUS_UPDATED',
      entityType: 'Clinic',
      entityId: clinic.id,
      description: `Clinic status changed from ${oldStatus} to ${subscriptionStatus}`,
      adminId: req.session.admin?.id,
      clinicId: clinic.id,
      req,
    });

    res.redirect(`/admin/clinics/${clinic.id}?success=Clinic status updated`);
  } catch (error) {
    console.error('Update clinic status error:', error);
    res.status(500).json({ error: 'Failed to update clinic status' });
  }
});

/**
 * GET /admin/export/:type
 * Export data as CSV
 */
router.get('/export/:type', requireAdminAuth, async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'csv', start_date, end_date, ...filters } = req.query;

    // Build date filter if provided
    let dateFilter = {};
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      endDate.setHours(23, 59, 59, 999);
      dateFilter = { [Op.between]: [startDate, endDate] };
    }

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-${Date.now()}.csv"`);

      let data = [];
      let headers = [];

      switch (type) {
        case 'clinics':
          const clinicWhere = {};
          if (filters.plan) clinicWhere.plan = filters.plan;
          if (filters.status) clinicWhere.subscriptionStatus = filters.status;
          if (filters.search) {
            clinicWhere[Op.or] = [
              { name: { [Op.iLike]: `%${filters.search}%` } },
              { email: { [Op.iLike]: `%${filters.search}%` } },
            ];
          }
          if (Object.keys(dateFilter).length > 0) clinicWhere.created_at = dateFilter;

          data = await Clinic.findAll({
            where: Object.keys(clinicWhere).length > 0 ? clinicWhere : undefined,
            raw: true
          });
          headers = ['ID', 'Name', 'Email', 'Phone', 'Plan', 'Status', 'Created At', 'Updated At'];
          res.write(headers.join(',') + '\n');
          data.forEach(clinic => {
            res.write([
              clinic.id,
              `"${(clinic.name || '').replace(/"/g, '""')}"`,
              clinic.email || '',
              clinic.phone || '',
              clinic.plan || '',
              clinic.subscriptionStatus || '',
              clinic.created_at || '',
              clinic.updated_at || '',
            ].join(',') + '\n');
          });
          break;

        case 'users':
          const userWhere = {};
          if (filters.role) userWhere.role = filters.role;
          if (filters.status) userWhere.status = filters.status;
          if (filters.clinicId) userWhere.clinicId = filters.clinicId;
          if (filters.search) {
            userWhere[Op.or] = [
              { name: { [Op.iLike]: `%${filters.search}%` } },
              { email: { [Op.iLike]: `%${filters.search}%` } },
            ];
          }
          if (Object.keys(dateFilter).length > 0) userWhere.created_at = dateFilter;

          data = await User.findAll({
            where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
            include: [{ model: Clinic, as: 'clinic', attributes: ['name'], required: false }],
            raw: false,
          });
          headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Clinic', 'Created At', 'Last Login'];
          res.write(headers.join(',') + '\n');
          for (const user of data) {
            res.write([
              user.id,
              `"${(user.name || '').replace(/"/g, '""')}"`,
              user.email || '',
              user.role || '',
              user.status || '',
              user.clinic ? `"${user.clinic.name.replace(/"/g, '""')}"` : '',
              user.created_at || '',
              user.lastLogin || '',
            ].join(',') + '\n');
          }
          break;

        case 'patients':
          data = await Patient.findAll({ raw: true });
          headers = ['ID', 'Name', 'Phone', 'Age', 'Gender', 'Clinic ID', 'Created At'];
          res.write(headers.join(',') + '\n');
          data.forEach(patient => {
            res.write([
              patient.id,
              `"${patient.name}"`,
              patient.phone || '',
              patient.age || '',
              patient.gender || '',
              patient.clinicId,
              patient.created_at,
            ].join(',') + '\n');
          });
          break;

        case 'activity-logs':
          const logWhere = {};
          if (filters.action) logWhere.action = filters.action;
          if (filters.entityType) logWhere.entityType = filters.entityType;
          if (filters.userId) logWhere.userId = filters.userId;
          if (filters.clinicId) logWhere.clinicId = filters.clinicId;
          if (filters.adminId) logWhere.adminId = filters.adminId;
          if (filters.search) {
            logWhere[Op.or] = [
              { action: { [Op.iLike]: `%${filters.search}%` } },
              { description: { [Op.iLike]: `%${filters.search}%` } },
            ];
          }
          if (Object.keys(dateFilter).length > 0) {
            logWhere.created_at = dateFilter;
          } else if (filters.startDate || filters.endDate) {
            logWhere.created_at = {};
            if (filters.startDate) logWhere.created_at[Op.gte] = new Date(filters.startDate);
            if (filters.endDate) {
              const endDate = new Date(filters.endDate);
              endDate.setHours(23, 59, 59, 999);
              logWhere.created_at[Op.lte] = endDate;
            }
          }

          data = await ActivityLog.findAll({
            where: Object.keys(logWhere).length > 0 ? logWhere : undefined,
            include: [
              { model: User, as: 'user', attributes: ['name', 'email'], required: false },
              { model: Clinic, as: 'clinic', attributes: ['name'], required: false },
            ],
            order: [['created_at', 'DESC']],
            limit: 50000, // Increased limit
          });
          headers = ['ID', 'Timestamp', 'Action', 'Entity Type', 'Entity ID', 'Description', 'User', 'Clinic', 'IP Address'];
          res.write(headers.join(',') + '\n');
          data.forEach(log => {
            res.write([
              log.id,
              log.created_at || '',
              log.action || '',
              log.entityType || '',
              log.entityId || '',
              `"${(log.description || '').replace(/"/g, '""')}"`,
              log.user ? `"${log.user.name} (${log.user.email})"` : '',
              log.clinic ? `"${log.clinic.name.replace(/"/g, '""')}"` : '',
              log.ipAddress || '',
            ].join(',') + '\n');
          });
          break;

        case 'statistics':
          // Export dashboard statistics
          const stats = {
            totalClinics: await Clinic.count(),
            activeClinics: await Clinic.count({ where: { subscriptionStatus: 'ACTIVE' } }),
            totalUsers: await User.count(),
            totalPatients: await Patient.count(),
            totalVisits: await Visit.count(),
            totalAppointments: await Appointment.count(),
          };

          if (Object.keys(dateFilter).length > 0) {
            stats.newClinics = await Clinic.count({ where: { created_at: dateFilter } });
            stats.newUsers = await User.count({ where: { created_at: dateFilter } });
            stats.newPatients = await Patient.count({ where: { created_at: dateFilter } });
            stats.newVisits = await Visit.count({ where: { created_at: dateFilter } });
            stats.newAppointments = await Appointment.count({ where: { created_at: dateFilter } });
          }

          headers = ['Metric', 'Value', 'Period'];
          res.write(headers.join(',') + '\n');
          Object.entries(stats).forEach(([key, value]) => {
            res.write([
              `"${key.replace(/([A-Z])/g, ' $1').trim()}"`,
              value,
              Object.keys(dateFilter).length > 0 ? `${start_date} to ${end_date}` : 'All Time',
            ].join(',') + '\n');
          });
          break;

        default:
          return res.status(400).json({ error: 'Invalid export type' });
      }

      res.end();
    } else {
      res.status(400).json({ error: 'Unsupported format' });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

/**
 * GET /admin/analytics
 * Advanced analytics page with time-based trends
 */
router.get('/analytics', requireAdminAuth, async (req, res) => {
  try {
    const { startDate, endDate, period = '30', groupBy = 'day' } = req.query;
    let dateFilter = {};

    if (startDate && endDate) {
      dateFilter = {
        created_at: {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        },
      };
    } else {
      const daysAgo = parseInt(period);
      const start = new Date();
      start.setDate(start.getDate() - daysAgo);
      dateFilter = { created_at: { [Op.gte]: start } };
    }

    // Determine grouping function based on groupBy parameter
    let dateGroupFn;
    switch (groupBy) {
      case 'week':
        dateGroupFn = sequelize.fn('DATE_TRUNC', 'week', sequelize.col('created_at'));
        break;
      case 'month':
        dateGroupFn = sequelize.fn('DATE_TRUNC', 'month', sequelize.col('created_at'));
        break;
      case 'year':
        dateGroupFn = sequelize.fn('DATE_TRUNC', 'year', sequelize.col('created_at'));
        break;
      default: // 'day'
        dateGroupFn = sequelize.fn('DATE', sequelize.col('created_at'));
    }

    // Time-based analytics with different grouping
    const [
      clinicGrowth,
      userGrowth,
      patientGrowth,
      visitGrowth,
    ] = await Promise.all([
      Clinic.findAll({
        attributes: [
          [dateGroupFn, 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        where: dateFilter,
        group: [dateGroupFn],
        order: [[dateGroupFn, 'ASC']],
        raw: true,
      }),
      User.findAll({
        attributes: [
          [dateGroupFn, 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        where: dateFilter,
        group: [dateGroupFn],
        order: [[dateGroupFn, 'ASC']],
        raw: true,
      }),
      Patient.findAll({
        attributes: [
          [dateGroupFn, 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        where: dateFilter,
        group: [dateGroupFn],
        order: [[dateGroupFn, 'ASC']],
        raw: true,
      }),
      Visit.findAll({
        attributes: [
          [dateGroupFn, 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        where: dateFilter,
        group: [dateGroupFn],
        order: [[dateGroupFn, 'ASC']],
        raw: true,
      }),
    ]);

    // Calculate month-over-month and year-over-year comparisons
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);

    const [
      clinicsThisMonth,
      clinicsLastMonth,
      clinicsThisYear,
      clinicsLastYear,
      usersThisMonth,
      usersLastMonth,
      usersThisYear,
      usersLastYear,
      patientsThisMonth,
      patientsLastMonth,
      patientsThisYear,
      patientsLastYear,
      visitsThisMonth,
      visitsLastMonth,
      visitsThisYear,
      visitsLastYear,
    ] = await Promise.all([
      Clinic.count({ where: { created_at: { [Op.gte]: thisMonth } } }),
      Clinic.count({ where: { created_at: { [Op.gte]: lastMonth, [Op.lt]: thisMonth } } }),
      Clinic.count({ where: { created_at: { [Op.gte]: thisYear } } }),
      Clinic.count({ where: { created_at: { [Op.gte]: lastYear, [Op.lt]: thisYear } } }),
      User.count({ where: { created_at: { [Op.gte]: thisMonth } } }),
      User.count({ where: { created_at: { [Op.gte]: lastMonth, [Op.lt]: thisMonth } } }),
      User.count({ where: { created_at: { [Op.gte]: thisYear } } }),
      User.count({ where: { created_at: { [Op.gte]: lastYear, [Op.lt]: thisYear } } }),
      Patient.count({ where: { created_at: { [Op.gte]: thisMonth } } }),
      Patient.count({ where: { created_at: { [Op.gte]: lastMonth, [Op.lt]: thisMonth } } }),
      Patient.count({ where: { created_at: { [Op.gte]: thisYear } } }),
      Patient.count({ where: { created_at: { [Op.gte]: lastYear, [Op.lt]: thisYear } } }),
      Visit.count({ where: { created_at: { [Op.gte]: thisMonth } } }),
      Visit.count({ where: { created_at: { [Op.gte]: lastMonth, [Op.lt]: thisMonth } } }),
      Visit.count({ where: { created_at: { [Op.gte]: thisYear } } }),
      Visit.count({ where: { created_at: { [Op.gte]: lastYear, [Op.lt]: thisYear } } }),
    ]);

    const comparisons = {
      clinics: {
        thisMonth: clinicsThisMonth,
        lastMonth: clinicsLastMonth,
        thisYear: clinicsThisYear,
        lastYear: clinicsLastYear,
        monthOverMonth: clinicsLastMonth > 0 ? ((clinicsThisMonth - clinicsLastMonth) / clinicsLastMonth * 100).toFixed(1) : '0',
        yearOverYear: clinicsLastYear > 0 ? ((clinicsThisYear - clinicsLastYear) / clinicsLastYear * 100).toFixed(1) : '0',
      },
      users: {
        thisMonth: usersThisMonth,
        lastMonth: usersLastMonth,
        thisYear: usersThisYear,
        lastYear: usersLastYear,
        monthOverMonth: usersLastMonth > 0 ? ((usersThisMonth - usersLastMonth) / usersLastMonth * 100).toFixed(1) : '0',
        yearOverYear: usersLastYear > 0 ? ((usersThisYear - usersLastYear) / usersLastYear * 100).toFixed(1) : '0',
      },
      patients: {
        thisMonth: patientsThisMonth,
        lastMonth: patientsLastMonth,
        thisYear: patientsThisYear,
        lastYear: patientsLastYear,
        monthOverMonth: patientsLastMonth > 0 ? ((patientsThisMonth - patientsLastMonth) / patientsLastMonth * 100).toFixed(1) : '0',
        yearOverYear: patientsLastYear > 0 ? ((patientsThisYear - patientsLastYear) / patientsLastYear * 100).toFixed(1) : '0',
      },
      visits: {
        thisMonth: visitsThisMonth,
        lastMonth: visitsLastMonth,
        thisYear: visitsThisYear,
        lastYear: visitsLastYear,
        monthOverMonth: visitsLastMonth > 0 ? ((visitsThisMonth - visitsLastMonth) / visitsLastMonth * 100).toFixed(1) : '0',
        yearOverYear: visitsLastYear > 0 ? ((visitsThisYear - visitsLastYear) / visitsLastYear * 100).toFixed(1) : '0',
      },
    };

    res.render('admin/analytics', {
      title: 'Analytics',
      layout: 'layouts/admin',
      analytics: {
        clinicGrowth,
        userGrowth,
        patientGrowth,
        visitGrowth,
        comparisons,
      },
      filters: { startDate, endDate, period, groupBy },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/admin',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * GET /admin/activity-logs
 * Activity logs and audit trail
 */
router.get('/activity-logs', requireAdminAuth, async (req, res) => {
  try {
    const {
      search,
      action,
      entityType,
      userId,
      adminId,
      clinicId,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where[Op.or] = [
        { description: { [Op.iLike]: `%${search}%` } },
        { action: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (userId) where.userId = userId;
    if (adminId) where.adminId = adminId;
    if (clinicId) where.clinicId = clinicId;

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = new Date(startDate);
      if (endDate) where.created_at[Op.lte] = new Date(endDate);
    }

    const { count, rows: logs } = await ActivityLog.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'], required: false },
        { model: Clinic, as: 'clinic', attributes: ['id', 'name'], required: false },
      ],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    // Get unique actions for filter
    const actions = await ActivityLog.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('action')), 'action']],
      raw: true,
    });

    // Get unique entity types for filter
    const entityTypes = await ActivityLog.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('entity_type')), 'entityType']],
      where: { entityType: { [Op.ne]: null } },
      raw: true,
    });

    // Get users and clinics for filter dropdowns
    const users = await User.findAll({
      attributes: ['id', 'name', 'email'],
      limit: 100,
      order: [['name', 'ASC']],
    });

    const clinics = await Clinic.findAll({
      attributes: ['id', 'name'],
      limit: 100,
      order: [['name', 'ASC']],
    });

    res.render('admin/activity-logs', {
      title: 'Activity Logs',
      layout: 'layouts/admin',
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit)),
      },
      filters: { search, action, entityType, userId, adminId, clinicId, startDate, endDate },
      actions: actions.map(a => a.action).filter(Boolean),
      entityTypes: entityTypes.map(e => e.entityType).filter(Boolean),
      users,
      clinics,
    });
  } catch (error) {
    console.error('Activity logs error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/admin',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * POST /admin/clinics/:id/plan
 * Update clinic subscription plan
 */
/**
 * POST /admin/clinics/:id/plan
 * Update clinic subscription plan
 */
router.post('/clinics/:id/plan', requireAdminAuth, async (req, res) => {
  try {
    const { plan } = req.body;
    const clinic = await Clinic.findByPk(req.params.id);

    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    const validPlans = ['FREE', 'STARTER', 'CLINIC', 'PRO'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const oldPlan = clinic.plan;
    clinic.plan = plan;
    await clinic.save();

    // Log activity
    await logActivity({
      action: 'CLINIC_PLAN_UPDATED',
      entityType: 'Clinic',
      entityId: clinic.id,
      description: `Clinic plan changed from ${oldPlan} to ${plan}`,
      adminId: req.session.admin?.id,
      clinicId: clinic.id,
      req,
    });

    res.redirect(`/admin/clinics/${clinic.id}?success=Clinic plan updated`);
  } catch (error) {
    console.error('Update clinic plan error:', error);
    res.status(500).json({ error: 'Failed to update clinic plan' });
  }
});

/**
 * GET /admin/clinics/:id/health
 * Clinic health dashboard
 */
router.get('/clinics/:id/health', requireAdminAuth, async (req, res) => {
  try {
    const clinic = await Clinic.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'name', 'email', 'role', 'status'],
        },
      ],
    });

    if (!clinic) {
      return res.status(404).render('errors/404', {
        title: 'Clinic Not Found',
        layout: 'layouts/admin',
      });
    }

    // Get clinic statistics
    const [
      patientCount,
      visitCount,
      appointmentCount,
      activeUsers,
      recentVisits,
    ] = await Promise.all([
      Patient.count({ where: { clinicId: clinic.id } }),
      Visit.count({ where: { clinicId: clinic.id } }),
      Appointment.count({ where: { clinicId: clinic.id } }),
      User.count({ where: { clinicId: clinic.id, status: 'ACTIVE' } }),
      Visit.findAll({
        where: { clinicId: clinic.id },
        limit: 10,
        order: [['created_at', 'DESC']],
        include: [
          { model: Patient, as: 'patient', attributes: ['name'] },
          { model: User, as: 'doctor', attributes: ['name'] },
        ],
      }),
    ]);

    // Calculate health score (0-100)
    let healthScore = 100;
    if (clinic.subscriptionStatus !== 'ACTIVE') healthScore -= 30;
    if (activeUsers === 0) healthScore -= 20;
    if (visitCount === 0) healthScore -= 10;
    if (patientCount === 0) healthScore -= 10;
    if (clinic.plan === 'FREE' && visitCount > 100) healthScore -= 10; // May need upgrade

    res.render('admin/clinic-health', {
      title: `Clinic Health: ${clinic.name}`,
      layout: 'layouts/admin',
      clinic,
      stats: {
        patientCount,
        visitCount,
        appointmentCount,
        activeUsers,
        totalUsers: clinic.users.length,
      },
      healthScore: Math.max(0, healthScore),
      recentVisits,
    });
  } catch (error) {
    console.error('Clinic health error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/admin',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * GET /admin/security
 * Security dashboard
 */
router.get('/security', requireAdminAuth, async (req, res) => {
  try {
    // Get failed login attempts from activity logs (both user and admin)
    const failedLogins = await ActivityLog.findAll({
      where: {
        action: { [Op.in]: ['USER_LOGIN_FAILED', 'ADMIN_LOGIN_FAILED'] },
      },
      limit: 50,
      order: [['created_at', 'DESC']],
      include: [
        { model: User, as: 'user', attributes: ['name', 'email'], required: false },
        { model: Clinic, as: 'clinic', attributes: ['name'], required: false },
      ],
    });

    // Get suspicious activities (multiple failed logins from same IP)
    const suspiciousIPs = await sequelize.query(
      `SELECT
        ip_address,
        COUNT(*) as attempt_count,
        MAX(created_at) as last_attempt
      FROM activity_logs
      WHERE action IN ('USER_LOGIN_FAILED', 'ADMIN_LOGIN_FAILED')
        AND ip_address IS NOT NULL
        AND created_at > NOW() - INTERVAL '24 hours'
      GROUP BY ip_address
      HAVING COUNT(*) > 5
      ORDER BY attempt_count DESC
      LIMIT 10`,
      { type: sequelize.QueryTypes.SELECT }
    );

    // Get users with inactive status
    const inactiveUsers = await User.count({
      where: { status: { [Op.in]: ['INACTIVE', 'SUSPENDED'] } },
    });

    // Get recent security events
    const recentSecurityEvents = await ActivityLog.findAll({
      where: {
        action: {
          [Op.in]: [
            'USER_STATUS_UPDATED',
            'CLINIC_STATUS_UPDATED',
            'PASSWORD_CHANGED',
            'ROLE_CHANGED',
          ],
        },
      },
      limit: 20,
      order: [['created_at', 'DESC']],
      include: [
        { model: User, as: 'user', attributes: ['name', 'email'], required: false },
        { model: Clinic, as: 'clinic', attributes: ['name'], required: false },
      ],
    });

    res.render('admin/security', {
      title: 'Security Dashboard',
      layout: 'layouts/admin',
      failedLogins,
      suspiciousIPs,
      inactiveUsers,
      recentSecurityEvents,
    });
  } catch (error) {
    console.error('Security dashboard error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/admin',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * GET /admin/system-health
 * System health and monitoring
 */
router.get('/system-health', requireAdminAuth, async (req, res) => {
  try {
    // Database health check
    let dbStatus = 'healthy';
    let dbResponseTime = 0;
    try {
      const start = Date.now();
      await sequelize.query('SELECT 1');
      dbResponseTime = Date.now() - start;
      if (dbResponseTime > 1000) dbStatus = 'slow';
    } catch (error) {
      dbStatus = 'unhealthy';
    }

    // System metrics
    const memory = process.memoryUsage();
    const systemHealth = {
      database: {
        status: dbStatus,
        responseTime: dbResponseTime,
      },
      uptime: process.uptime(),
      memory: memory,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
    };

    // Database statistics (PostgreSQL specific - optional)
    let dbStats = [];
    try {
      // Get table sizes, only for tables that actually exist
      // Use a subquery to filter out non-existent tables before calculating sizes
      dbStats = await sequelize.query(`
        WITH existing_tables AS (
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            AND table_name NOT LIKE 'pg_%'
            AND table_name != 'spatial_ref_sys'
        )
        SELECT
          'public' AS schemaname,
          t.table_name AS tablename,
          pg_size_pretty(pg_total_relation_size('public.'||t.table_name)) AS size
        FROM existing_tables t
        WHERE pg_total_relation_size('public.'||t.table_name) IS NOT NULL
        ORDER BY pg_total_relation_size('public.'||t.table_name) DESC
        LIMIT 10
      `, { type: sequelize.QueryTypes.SELECT });
    } catch (error) {
      // Database stats query failed (might not be PostgreSQL or no permissions)
      // This is expected in some environments, so we just log a warning
      if (process.env.NODE_ENV === 'development') {
        console.warn('Database statistics query failed:', error.message);
      }
      dbStats = [];
    }

    // Recent errors from activity logs
    let recentErrors = [];
    try {
      recentErrors = await ActivityLog.findAll({
        where: {
          action: { [Op.like]: '%ERROR%' },
        },
        limit: 10,
        order: [['created_at', 'DESC']],
        include: [
          { model: User, as: 'user', attributes: ['name'], required: false },
          { model: Clinic, as: 'clinic', attributes: ['name'], required: false },
        ],
      });
    } catch (error) {
      // Activity log query failed
      console.warn('Recent errors query failed:', error.message);
      recentErrors = [];
    }

    // Calculate overall system health score (0-100)
    let healthScore = 100;
    if (dbStatus === 'unhealthy') healthScore -= 40;
    else if (dbStatus === 'slow') healthScore -= 20;
    if (dbResponseTime > 2000) healthScore -= 10;

    // Memory usage penalty (if using more than 80% of heap)
    const memoryUsagePercent = memory.heapTotal > 0
      ? (memory.heapUsed / memory.heapTotal) * 100
      : 0;
    if (memoryUsagePercent > 90) healthScore -= 20;
    else if (memoryUsagePercent > 80) healthScore -= 10;

    // Recent errors penalty
    if (recentErrors.length > 10) healthScore -= 10;
    else if (recentErrors.length > 5) healthScore -= 5;

    res.render('admin/system-health', {
      title: 'System Health',
      layout: 'layouts/admin',
      systemHealth,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      dbStats,
      recentErrors,
    });
  } catch (error) {
    console.error('System health error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/admin',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * GET /admin/financial
 * Financial & Subscription Management Dashboard
 */
router.get('/financial', requireAdminAuth, async (req, res) => {
  try {
    const { startDate, endDate, period = '30' } = req.query;
    let dateFilter = {};

    if (startDate && endDate) {
      dateFilter = {
        created_at: {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        },
      };
    } else {
      const daysAgo = parseInt(period);
      const start = new Date();
      start.setDate(start.getDate() - daysAgo);
      dateFilter = { created_at: { [Op.gte]: start } };
    }

    // Plan pricing
    const planPricing = {
      FREE: 0,
      STARTER: 29,
      CLINIC: 79,
      PRO: 149,
    };

    // Revenue tracking - filter by paid_date for revenue, created_at for invoice count
    let revenueWhere = {
      status: 'PAID',
    };

    // Apply date filter to paid_date for revenue calculation
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      revenueWhere.paid_date = { [Op.between]: [start, end] };
    } else if (startDate) {
      revenueWhere.paid_date = { [Op.gte]: new Date(startDate) };
    } else if (period) {
      const daysAgo = parseInt(period);
      const start = new Date();
      start.setDate(start.getDate() - daysAgo);
      revenueWhere.paid_date = { [Op.gte]: start };
    }

    const totalRevenue = await Invoice.sum('total_amount', {
      where: revenueWhere,
    }) || 0;

    // Monthly revenue - filter by paid_date (not created_at)
    let monthlyRevenueWhere = {
      status: 'PAID',
      paid_date: { [Op.ne]: null },
    };

    // Apply date filter to paid_date if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      monthlyRevenueWhere.paid_date = { [Op.between]: [start, end] };
    } else if (startDate) {
      monthlyRevenueWhere.paid_date = { [Op.gte]: new Date(startDate) };
    } else if (period) {
      const daysAgo = parseInt(period);
      const start = new Date();
      start.setDate(start.getDate() - daysAgo);
      monthlyRevenueWhere.paid_date = { [Op.gte]: start };
    }

    const monthlyRevenue = await Invoice.findAll({
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('paid_date')), 'month'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue'],
      ],
      where: monthlyRevenueWhere,
      group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('paid_date'))],
      order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('paid_date')), 'ASC']],
      raw: true,
    });

    // Subscription plan analytics
    const planDistribution = await Clinic.findAll({
      attributes: [
        'plan',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['plan'],
      raw: true,
    });

    const planRevenue = await Invoice.findAll({
      attributes: [
        'plan',
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: revenueWhere,
      group: ['plan'],
      raw: true,
    });

    // Payment history - filter by paid_date
    const recentPayments = await Invoice.findAll({
      where: revenueWhere,
      include: [
        { model: Clinic, as: 'clinic', attributes: ['id', 'name'] },
      ],
      order: [['paid_date', 'DESC']],
      limit: 50,
    });

    // Churn rate tracking
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const activeLastMonth = await Clinic.count({
      where: {
        subscriptionStatus: 'ACTIVE',
        created_at: { [Op.lt]: thisMonth },
      },
    });

    const churnedThisMonth = await Clinic.count({
      where: {
        subscriptionStatus: { [Op.in]: ['INACTIVE', 'EXPIRED'] },
        updated_at: { [Op.between]: [thisMonth, now] },
      },
    });

    const churnRate = activeLastMonth > 0 ? ((churnedThisMonth / activeLastMonth) * 100).toFixed(2) : 0;

    // Subscription upgrades/downgrades tracking
    const planChanges = await ActivityLog.findAll({
      where: {
        action: { [Op.in]: ['CLINIC_PLAN_UPDATED', 'CLINIC_STATUS_UPDATED'] },
        ...dateFilter,
      },
      include: [
        { model: Clinic, as: 'clinic', attributes: ['id', 'name', 'plan'] },
      ],
      order: [['created_at', 'DESC']],
      limit: 50,
    });

    // Upcoming renewals (invoices due in next 30 days)
    const upcomingRenewals = await Invoice.findAll({
      where: {
        status: 'PENDING',
        dueDate: {
          [Op.between]: [new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)],
        },
      },
      include: [
        { model: Clinic, as: 'clinic', attributes: ['id', 'name', 'plan', 'email'] },
      ],
      order: [['dueDate', 'ASC']],
    });

    // Revenue forecasting (next 3 months based on current trends)
    const last3MonthsRevenue = await Invoice.findAll({
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('paid_date')), 'month'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue'],
      ],
      where: {
        status: 'PAID',
        paid_date: {
          [Op.gte]: new Date(now.getFullYear(), now.getMonth() - 3, 1),
        },
      },
      group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('paid_date'))],
      order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('paid_date')), 'ASC']],
      raw: true,
    });

    // Calculate average monthly revenue for forecasting
    const avgMonthlyRevenue = last3MonthsRevenue.length > 0
      ? last3MonthsRevenue.reduce((sum, m) => sum + parseFloat(m.revenue || 0), 0) / last3MonthsRevenue.length
      : 0;

    // Payment methods distribution
    const paymentMethods = await Invoice.findAll({
      attributes: [
        'paymentMethod',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total'],
      ],
      where: {
        ...revenueWhere,
        paymentMethod: { [Op.ne]: null },
      },
      group: ['paymentMethod'],
      raw: true,
    });

    // Statistics summary
    const stats = {
      totalRevenue: parseFloat(totalRevenue) || 0,
      totalInvoices: await Invoice.count({ where: revenueWhere }),
      pendingInvoices: await Invoice.count({ where: { status: 'PENDING' } }),
      overdueInvoices: await Invoice.count({
        where: {
          status: 'OVERDUE',
          dueDate: { [Op.lt]: new Date() },
        },
      }),
      activeSubscriptions: await Clinic.count({ where: { subscriptionStatus: 'ACTIVE' } }),
      churnRate: parseFloat(churnRate),
      avgMonthlyRevenue: parseFloat(avgMonthlyRevenue) || 0,
    };

    res.render('admin/financial', {
      title: 'Financial & Subscription Management',
      layout: 'layouts/admin',
      stats,
      monthlyRevenue,
      planDistribution,
      planRevenue,
      recentPayments,
      planChanges,
      upcomingRenewals,
      paymentMethods,
      forecast: {
        nextMonth: avgMonthlyRevenue,
        next3Months: avgMonthlyRevenue * 3,
      },
      filters: { startDate, endDate, period },
    });
  } catch (error) {
    console.error('Financial dashboard error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/admin',
      error: process.env.NODE_ENV === 'development' ? error : {},
      NODE_ENV: process.env.NODE_ENV,
    });
  }
});

/**
 * GET /admin/financial/export
 * Export financial reports
 */
router.get('/financial/export', requireAdminAuth, async (req, res) => {
  try {
    const { format = 'csv', startDate, endDate, type = 'revenue' } = req.query;
    let dateFilter = {};

    if (startDate && endDate) {
      dateFilter = {
        created_at: {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        },
      };
    }

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="financial-report-${Date.now()}.csv"`);

      if (type === 'revenue') {
        const invoices = await Invoice.findAll({
          where: {
            status: 'PAID',
            ...dateFilter,
          },
          include: [
            { model: Clinic, as: 'clinic', attributes: ['name'] },
          ],
          order: [['paid_date', 'DESC']],
        });

        const headers = ['Invoice Number', 'Date', 'Clinic', 'Plan', 'Amount', 'Tax', 'Total', 'Payment Method', 'Transaction ID'];
        res.write(headers.join(',') + '\n');

        invoices.forEach(invoice => {
          res.write([
            invoice.invoiceNumber,
            invoice.paid_date || invoice.created_at,
            `"${invoice.clinic ? invoice.clinic.name.replace(/"/g, '""') : ''}"`,
            invoice.plan,
            invoice.amount,
            invoice.taxAmount || 0,
            invoice.totalAmount,
            invoice.paymentMethod || '',
            invoice.paymentTransactionId || '',
          ].join(',') + '\n');
        });
      } else if (type === 'subscriptions') {
        const clinics = await Clinic.findAll({
          attributes: ['id', 'name', 'plan', 'subscriptionStatus', 'created_at'],
          order: [['created_at', 'DESC']],
        });

        const headers = ['Clinic Name', 'Plan', 'Status', 'Created Date'];
        res.write(headers.join(',') + '\n');

        clinics.forEach(clinic => {
          res.write([
            `"${clinic.name.replace(/"/g, '""')}"`,
            clinic.plan,
            clinic.subscriptionStatus,
            clinic.created_at,
          ].join(',') + '\n');
        });
      }

      res.end();
    } else {
      res.status(400).json({ error: 'Unsupported format' });
    }
  } catch (error) {
    console.error('Financial export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

module.exports = router;
