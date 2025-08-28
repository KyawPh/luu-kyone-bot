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
    // Always clear any existing webhook/polling first to prevent conflicts
    try {
      await bot.telegram.deleteWebhook({ drop_pending_updates: true });
      logger.info('Cleared any existing webhook/polling to prevent conflicts');
    } catch (error) {
      logger.warn('Could not clear webhook', { error: error.message });
    }
    
    if (config.environment === 'production') {
      // Production webhook setup for Railway
      const domain = process.env.RAILWAY_PUBLIC_DOMAIN || 
                     process.env.RAILWAY_STATIC_URL || 
                     config.telegram.webhookDomain;
      
      if (!domain) {
        logger.error('❌ CRITICAL: No domain configured for production!');
        logger.error('Please set RAILWAY_PUBLIC_DOMAIN in Railway environment variables');
        logger.error('The bot cannot run in polling mode on Railway as it causes conflicts');
        // Exit to prevent polling mode conflicts in production
        throw new Error('Production requires webhook mode. Set RAILWAY_PUBLIC_DOMAIN in Railway.');
      } else {
        const webhookUrl = `https://${domain}/webhook`;
        
        // Set webhook with drop_pending_updates to clear any queued messages
        await bot.telegram.setWebhook(webhookUrl, {
          drop_pending_updates: true
        });
        logEvent.webhookSet(webhookUrl);
        
        // Use bot.launch for proper webhook setup
        await bot.launch({
          webhook: {
            domain: domain,
            path: '/webhook',
            port: config.server.port
          }
        });
        
        logEvent.botStarted('production-webhook', { 
          port: config.server.port, 
          webhookUrl 
        });
        
        logger.info(`✅ Bot launched in webhook mode on ${webhookUrl}`);
      }
    } else {
      // Development polling mode
      const botInfo = await bot.telegram.getMe();
      
      // Use bot.launch for proper polling setup
      await bot.launch({
        dropPendingUpdates: true
      });
      
      logEvent.botStarted('development', { username: botInfo.username });
      logger.info(`✅ Bot launched in polling mode for development`);
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