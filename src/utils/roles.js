/**
 * Role-based helper functions
 */

const ROLES = {
  CLINIC_ADMIN: 'CLINIC_ADMIN',
  DOCTOR: 'DOCTOR',
  STAFF: 'STAFF',
  READ_ONLY: 'READ_ONLY'
};

/**
 * Get redirect URL based on user role
 */
const getRoleRedirect = (role) => {
  switch (role) {
    case ROLES.CLINIC_ADMIN:
    case ROLES.DOCTOR:
    case ROLES.STAFF:
    case ROLES.READ_ONLY:
      return '/dashboard';
    default:
      return '/dashboard';
  }
};

/**
 * Check if user has a specific role
 */
const hasRole = (user, role) => {
  return user && user.role === role;
};

/**
 * Check if user has any of the specified roles
 */
const hasAnyRole = (user, ...roles) => {
  return user && roles.includes(user.role);
};

/**
 * Check if user can perform write operations
 */
const canWrite = (user) => {
  if (!user) return false;
  return [ROLES.CLINIC_ADMIN, ROLES.DOCTOR, ROLES.STAFF].includes(user.role);
};

/**
 * Check if user can manage clinic settings
 */
const canManageClinic = (user) => {
  if (!user) return false;
  return user.role === ROLES.CLINIC_ADMIN;
};

/**
 * Check if user can manage doctors
 */
const canManageDoctors = (user) => {
  if (!user) return false;
  return user.role === ROLES.CLINIC_ADMIN;
};

/**
 * Check if user can create visits
 */
const canCreateVisits = (user) => {
  if (!user) return false;
  return [ROLES.CLINIC_ADMIN, ROLES.DOCTOR, ROLES.STAFF].includes(user.role);
};

/**
 * Check if user can view all data (not just their own)
 */
const canViewAllData = (user) => {
  if (!user) return false;
  return [ROLES.CLINIC_ADMIN, ROLES.STAFF].includes(user.role);
};

module.exports = {
  ROLES,
  getRoleRedirect,
  hasRole,
  hasAnyRole,
  canWrite,
  canManageClinic,
  canManageDoctors,
  canCreateVisits,
  canViewAllData
};

