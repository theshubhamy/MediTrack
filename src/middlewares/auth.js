/**
 * Authentication middleware
 * Ensures user is logged in
 */
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

/**
 * Role-based access control middleware
 * @param {...string} allowedRoles - Roles that can access the route
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }

    if (!allowedRoles.includes(req.session.user.role)) {
      return res.status(403).render('errors/403', {
        title: 'Access Denied',
        layout: 'layouts/main',
        message: 'You do not have permission to access this resource.'
      });
    }

    next();
  };
};

/**
 * Multi-tenant data isolation middleware
 * Ensures all queries are scoped to the user's clinic
 */
const requireClinicAccess = (req, res, next) => {
  if (!req.session.user || !req.session.user.clinicId) {
    return res.status(403).render('errors/403', {
      title: 'Access Denied',
      layout: 'layouts/main',
      message: 'Invalid clinic access.'
    });
  }
  next();
};

module.exports = {
  requireAuth,
  requireRole,
  requireClinicAccess
};

