require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');

// Initialize Sequelize models
require('./models');

const app = express();
const PORT = process.env.PORT || 3301;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
};

// Initialize Redis for session storage (if available)
const { initRedis } = require('./config/redis');

// Initialize Redis and set up session store
initRedis()
  .then(redisClient => {
    if (redisClient) {
      const RedisStore = require('connect-redis').default;
      sessionConfig.store = new RedisStore({ client: redisClient });
      console.log('✅ Redis session store configured');
    } else {
      console.log('⚠️ Using in-memory session store (Redis not available)');
    }
  })
  .catch(err => {
    console.error('Redis initialization error:', err.message);
    console.log('⚠️  Using in-memory session store');
  });

app.use(session(sessionConfig));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Make user and role helpers available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.clinic = req.session.clinic || null;
  res.locals.admin = req.session.admin || null;

  // Role helper functions for views
  if (req.session.user) {
    const {
      canWrite,
      canManageClinic,
      canManageDoctors,
      canCreateVisits,
      canViewAllData,
      hasRole,
      hasAnyRole,
    } = require('./utils/roles');
    res.locals.canWrite = () => canWrite(req.session.user);
    res.locals.canManageClinic = () => canManageClinic(req.session.user);
    res.locals.canManageDoctors = () => canManageDoctors(req.session.user);
    res.locals.canCreateVisits = () => canCreateVisits(req.session.user);
    res.locals.canViewAllData = () => canViewAllData(req.session.user);
    res.locals.hasRole = role => hasRole(req.session.user, role);
    res.locals.hasAnyRole = (...roles) =>
      hasAnyRole(req.session.user, ...roles);
  }

  next();
});

// Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const patientRoutes = require('./routes/patients');
const visitRoutes = require('./routes/visits');
const doctorRoutes = require('./routes/doctors');
const settingsRoutes = require('./routes/settings');
const adminRoutes = require('./routes/admin');
const appointmentRoutes = require('./routes/appointments');
const availabilityRoutes = require('./routes/availability');
const prescriptionRoutes = require('./routes/prescriptions');

app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/patients', patientRoutes);
app.use('/visits', visitRoutes);
app.use('/doctors', doctorRoutes);
app.use('/settings', settingsRoutes);
app.use('/admin', adminRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/availability', availabilityRoutes);
app.use('/prescriptions', prescriptionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('errors/404', {
    title: 'Page Not Found',
    layout: 'layouts/main',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).render('errors/500', {
    title: 'Server Error',
    layout: 'layouts/main',
    error: process.env.NODE_ENV === 'development' ? err : {},
    NODE_ENV: process.env.NODE_ENV || 'production',
  });
});

// Start scheduled jobs
if (process.env.NODE_ENV !== 'test') {
  const { startReminderJob } = require('./jobs/reminders');
  startReminderJob();
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
