const { Telegraf, session } = require('telegraf');
const { config } = require('./config');
const { collections } = require('./config/firebase');
const { logger, logEvent } = require('./utils/logger');
const setupCommands = require('./handlers/commands');
const setupCallbacks = require('./handlers/callbacks');
const setupChannelHandlers = require('./handlers/channel');
const travelScene = require('./scenes/travel');
const favorScene = require('./scenes/favor');

// Initialize bot
const bot = new Telegraf(config.telegram.botToken);

// Middleware
bot.use(session());

// Error handling
bot.catch((err, ctx) => {
  const userId = ctx.from?.id || 'unknown';
  const updateType = ctx.updateType || 'unknown';
  
  logEvent.telegramError(updateType, err);
  logger.error('Bot error occurred', {
    error: err.message,
    updateType,
    userId,
    chat: ctx.chat?.id
  });
  
  ctx.reply(
    `😔 Oops! Something went wrong.\n\n` +
    `Don't worry, it happens! Please try again.\n\n` +
    `If this keeps happening, our community is here to help:\n` +
    `👉 @LuuKyone_Community\n\n` +
    `<i>"Even technology needs kindness sometimes!"</i>`,
    { parse_mode: 'HTML' }
  ).catch(() => {}); // Ignore reply errors
});

// Register scenes
const { Stage } = require('telegraf/scenes');
const stage = new Stage([travelScene, favorScene]);
bot.use(stage.middleware());

// Setup handlers
setupCommands(bot);
setupCallbacks(bot);
setupChannelHandlers(bot);

// Launch bot
const launch = async () => {
  try {
    if (config.environment === 'production') {
      // Production webhook setup for Railway
      const domain = process.env.RAILWAY_PUBLIC_DOMAIN || 
                     process.env.RAILWAY_STATIC_URL || 
                     config.telegram.webhookDomain;
      
      if (!domain) {
        logger.warn('No domain set, falling back to polling mode in production');
        // Fallback to polling in production if no domain is set
        const botInfo = await bot.telegram.getMe();
        bot.startPolling(30, 100, null, () => {
          logEvent.botStarted('production-polling', { username: botInfo.username });
        });
      } else {
        const webhookUrl = `https://${domain}/webhook`;
        await bot.telegram.setWebhook(webhookUrl);
        logEvent.webhookSet(webhookUrl);
        
        // Start webhook server
        bot.startWebhook('/webhook', null, config.server.port);
        
        logEvent.botStarted('production-webhook', { 
          port: config.server.port, 
          webhookUrl 
        });
      }
    } else {
      // Development polling mode
      const botInfo = await bot.telegram.getMe();
      
      // Start polling
      bot.startPolling(30, 100, null, () => {
        logEvent.botStarted('development', { username: botInfo.username });
      });
    }
    
    // Set bot commands menu
    await bot.telegram.setMyCommands([
      { command: 'start', description: '🚀 Start sharing kindness' },
      { command: 'travel', description: '✈️ Share your travel plan' },
      { command: 'favor', description: '💚 Request a kind favor' },
      { command: 'help', description: '❓ How to spread kindness' }
    ]);
    
    logger.info('🤖 Luu Kyone Bot (@luukyonebot) is running!');
  } catch (error) {
    logger.error('Failed to launch bot', { error: error.message });
    process.exit(1);
  }
};

// Graceful shutdown
process.once('SIGINT', () => {
  logEvent.botStopped('SIGINT');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  logEvent.botStopped('SIGTERM');
  bot.stop('SIGTERM');
});

// Launch the bot
launch();