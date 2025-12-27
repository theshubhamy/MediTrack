const { ActivityLog } = require('../models');

/**
 * Log an activity
 * @param {Object} options
 * @param {string} options.action - Action name (e.g., 'USER_CREATED', 'CLINIC_UPDATED')
 * @param {string} options.entityType - Entity type (e.g., 'User', 'Clinic')
 * @param {string} options.entityId - Entity ID
 * @param {string} options.description - Human-readable description
 * @param {Object} options.metadata - Additional metadata
 * @param {string} options.userId - User ID (if action by user)
 * @param {string} options.adminId - Admin ID (if action by admin)
 * @param {string} options.clinicId - Clinic ID (if applicable)
 * @param {Object} options.req - Express request object (for IP and user agent)
 */
async function logActivity({
  action,
  entityType = null,
  entityId = null,
  description = null,
  metadata = null,
  userId = null,
  adminId = null,
  clinicId = null,
  req = null,
}) {
  try {
    const ipAddress = req ? req.ip || req.connection?.remoteAddress : null;
    const userAgent = req ? req.get('user-agent') : null;

    await ActivityLog.create({
      action,
      entityType,
      entityId,
      description,
      metadata,
      userId,
      adminId,
      clinicId,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw - logging should not break the application
  }
}

module.exports = { logActivity };

