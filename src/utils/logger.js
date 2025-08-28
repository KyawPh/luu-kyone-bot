const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Tell winston about our colors
winston.addColors(colors);

// Define format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define format for console (colored and simple)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...args } = info;
    const ts = timestamp.slice(0, 8);
    
    // Add emoji for different levels
    const emoji = {
      error: '❌',
      warn: '⚠️',
      info: '✅',
      http: '🌐',
      debug: '🔍'
    };
    
    return `${ts} ${emoji[info.level] || ''} ${level}: ${message} ${
      Object.keys(args).length ? JSON.stringify(args, null, 2) : ''
    }`;
  })
);

// Define which transports to use
const transports = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
  })
];

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
      filename: 'logs/combined.log',
      format,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels,
  format,
  transports,
});

// Create a stream for Morgan HTTP logger
logger.stream = {
  write: (message) => logger.http(message.trim())
};

// Log important events
const logEvent = {
  // User events
  userJoined: (userId, userName) => {
    logger.info('New user joined', { userId, userName, event: 'USER_JOINED' });
  },
  
  userStarted: (userId, userName) => {
    logger.info('User started bot', { userId, userName, event: 'USER_STARTED' });
  },
  
  // Post events
  travelPlanCreated: (userId, route, date) => {
    logger.info('Travel plan created', { userId, route, date, event: 'TRAVEL_CREATED' });
  },
  
  favorRequestCreated: (userId, route, category) => {
    logger.info('Favor request created', { userId, route, category, event: 'FAVOR_CREATED' });
  },
  
  postCompleted: (postId, type) => {
    logger.info('Post marked complete', { postId, type, event: 'POST_COMPLETED' });
  },
  
  // Channel events
  channelMessageSent: (type) => {
    logger.info('Channel message sent', { type, event: 'CHANNEL_MESSAGE' });
  },
  
  memberJoinedChannel: (userName) => {
    logger.info('Member joined channel', { userName, event: 'CHANNEL_MEMBER_JOINED' });
  },
  
  // Error events
  commandError: (command, error, userId) => {
    logger.error('Command failed', { 
      command, 
      error: error.message, 
      stack: error.stack, 
      userId, 
      event: 'COMMAND_ERROR' 
    });
  },
  
  firebaseError: (operation, error) => {
    logger.error('Firebase operation failed', { 
      operation, 
      error: error.message, 
      event: 'FIREBASE_ERROR' 
    });
  },
  
  telegramError: (method, error) => {
    logger.error('Telegram API error', { 
      method, 
      error: error.message, 
      event: 'TELEGRAM_ERROR' 
    });
  },
  
  // System events
  botStarted: (mode, info = {}) => {
    logger.info('Bot started', { mode, ...info, event: 'BOT_STARTED' });
  },
  
  botStopped: (signal) => {
    logger.info('Bot stopped', { signal, event: 'BOT_STOPPED' });
  },
  
  webhookSet: (url) => {
    logger.info('Webhook configured', { url, event: 'WEBHOOK_SET' });
  },
  
  // Metrics
  dailyStats: (stats) => {
    logger.info('Daily statistics', { ...stats, event: 'DAILY_STATS' });
  }
};

module.exports = { logger, logEvent };