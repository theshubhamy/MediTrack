// src/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

function createSequelize() {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);

    return new Sequelize({
      database: url.pathname.replace('/', ''),
      username: url.username,
      password: url.password,
      host: url.hostname,
      port: Number(url.port) || 5432,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: {
        ssl: false,
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    });
  }

  // Fallback (non-URL)
  // Default to localhost for local development, postgres for Docker
  const defaultHost = process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV ? 'postgres' : 'localhost';

  return new Sequelize(
    process.env.POSTGRES_DB || process.env.DB_NAME || 'meditrack',
    process.env.POSTGRES_USER || process.env.DB_USER || 'meditrack',
    process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || 'meditrack_password',
    {
      host: process.env.DB_HOST || defaultHost,
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    },
  );
}

const sequelize = createSequelize();

// Test connection (only once)
// Don't exit on failure if this is being imported by a script (like seed)
let connectionTested = false;
(async () => {
  if (connectionTested) return;
  connectionTested = true;

  try {
    await sequelize.authenticate();
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Database connected');
    }
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    // Only exit if this is the main app, not if imported by scripts
    if (require.main === module || process.env.EXIT_ON_DB_ERROR === 'true') {
      process.exit(1);
    }
  }
})();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await sequelize.close();
  process.exit(0);
});

module.exports = sequelize;
