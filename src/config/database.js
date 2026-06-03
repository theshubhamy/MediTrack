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
        ssl: {
          require: true,
        },
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 33010,
        idle: 10000,
      },
    });
  }
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
    console.log('✅ Database connected successfully');
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
