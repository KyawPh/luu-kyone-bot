require('dotenv').config();

function getRequiredEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnv(key, defaultValue = '') {
  return process.env[key] || defaultValue;
}

const config = {
  telegram: {
    botToken: getRequiredEnv('BOT_TOKEN'),
    channelId: getRequiredEnv('FREE_CHANNEL_ID'),
    adminIds: getOptionalEnv('ADMIN_IDS', '1633991807').split(','),
    webhookDomain: getOptionalEnv('WEBHOOK_DOMAIN'),
  },
  
  firebase: {
    // Handled by firebase.js which supports multiple methods:
    // FIREBASE_CREDENTIALS_BASE64, file path, or individual variables
    credentialsBase64: getOptionalEnv('FIREBASE_CREDENTIALS_BASE64'),
    serviceAccountPath: getOptionalEnv('FIREBASE_SERVICE_ACCOUNT_PATH'),
    projectId: getOptionalEnv('FIREBASE_PROJECT_ID'),
    privateKey: getOptionalEnv('FIREBASE_PRIVATE_KEY'),
    clientEmail: getOptionalEnv('FIREBASE_CLIENT_EMAIL'),
  },
  
  bot: {
    limits: {
      free: {
        postsPerMonth: parseInt(getOptionalEnv('FREE_POSTS_PER_MONTH', '10'), 10),
      },
      premium: {
        postsPerMonth: parseInt(getOptionalEnv('PREMIUM_POSTS_PER_MONTH', '30'), 10),
      },
    },
    sessionTimeoutMinutes: parseInt(getOptionalEnv('SESSION_TIMEOUT_MINUTES', '30'), 10),
  },
  
  server: {
    port: parseInt(getOptionalEnv('PORT', '3000'), 10),
  },
  
  environment: getOptionalEnv('NODE_ENV', 'development'),
};

function validateConfig() {
  try {
    // Validate limits
    if (config.bot.limits.free.postsPerMonth <= 0) {
      throw new Error('FREE_POSTS_PER_MONTH must be greater than 0');
    }
    
    if (config.bot.limits.premium.postsPerMonth <= config.bot.limits.free.postsPerMonth) {
      throw new Error('PREMIUM_POSTS_PER_MONTH must be greater than FREE_POSTS_PER_MONTH');
    }
    
    // Validate port
    if (config.server.port <= 0 || config.server.port > 65535) {
      throw new Error('PORT must be between 1 and 65535');
    }
    
    // Validate environment
    if (!['development', 'production', 'test'].includes(config.environment)) {
      throw new Error('NODE_ENV must be development, production, or test');
    }
    
    return true;
  } catch (error) {
    throw error;
  }
}

// Validate on load
validateConfig();

module.exports = { config, validateConfig };