// src/config/config.js
require('dotenv').config();

function parseDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);

    return {
      username: url.username,
      password: url.password,
      database: url.pathname.replace('/', ''),
      host: url.hostname,
      port: Number(url.port) || 5432,
    };
  }
}

const baseConfig = {
  ...parseDatabaseUrl(),
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
    },
  },
};

module.exports = {
  development: {
    ...baseConfig,
    logging: console.log,
  },
  production: {
    ...baseConfig,
    logging: false,
  },
  test: {
    ...baseConfig,
    logging: false,
  },
};
