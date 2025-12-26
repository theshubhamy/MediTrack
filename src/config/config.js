// src/config/config.js
require('dotenv').config();

function parseDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    return {
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      host: process.env.DB_HOST || 'postgres',
      port: 5432,
    };
  }

  const url = new URL(process.env.DATABASE_URL);

  return {
    username: url.username,
    password: url.password,
    database: url.pathname.replace('/', ''),
    host: url.hostname,
    port: Number(url.port) || 5432,
  };
}

const baseConfig = {
  ...parseDatabaseUrl(),
  dialect: 'postgres',
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
