// src/config/redis.js
const redis = require('redis');
require('dotenv').config();

let client;
let connected = false;

async function initRedis() {
  if (!process.env.REDIS_URL) {
    console.log('⚠️  Redis disabled (REDIS_URL not set)');
    return null;
  }

  try {
    console.log('🔌 Connecting to Redis...');

    client = redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: retries => {
          if (retries > 10) {
            console.error('❌ Redis reconnect failed');
            return false;
          }
          return Math.min(retries * 100, 3301);
        },
      },
    });

    client.on('connect', () => {
      connected = true;
      console.log('✅ Redis connected');
    });

    client.on('error', err => {
      connected = false;
      console.error('❌ Redis error:', err.message);
    });

    client.on('end', () => {
      connected = false;
      console.log('⚠️  Redis disconnected');
    });

    await client.connect();
    return client;
  } catch (err) {
    console.error('❌ Redis connection failed:', err.message);
    console.log('⚠️  Continuing without Redis');
    return null;
  }
}

function getRedisClient() {
  return connected ? client : null;
}

function isRedisConnected() {
  return connected;
}

async function closeRedis() {
  if (client && connected) {
    await client.quit();
    connected = false;
    console.log('✅ Redis closed');
  }
}

// Graceful shutdown
process.on('SIGTERM', closeRedis);
process.on('SIGINT', closeRedis);

module.exports = {
  initRedis,
  getRedisClient,
  isRedisConnected,
  closeRedis,
};
