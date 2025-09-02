const { Telegraf, session } = require('telegraf');
const { config } = require('./config');
const { collections } = require('./config/firebase');
const { logger, logEvent } = require('./utils/logger');
const { messages } = require('./config/messages');
const setupCommands = require('./handlers/commands');
const setupCallbacks = require('./handlers/callbacks');
const setupChannelHandlers = require('./handlers/channel');
const travelScene = require('./scenes/travel');
const favorScene = require('./scenes/favor');
const settingsScene = require('./scenes/settings');
const { setupScheduledJobs } = require('./utils/scheduler');

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
    `<i>${messages.system.techNeedsKindness}</i>`,
    { parse_mode: 'HTML' }
  ).catch(() => {}); // Ignore reply errors
});

// Register scenes
const { Stage } = require('telegraf/scenes');
const stage = new Stage([travelScene, favorScene, settingsScene]);
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
        logger.error('❌ CRITICAL: No domain configured for production!');
        logger.error('Please set RAILWAY_PUBLIC_DOMAIN in Railway environment variables');
        logger.error('The bot cannot run in polling mode on Railway as it causes conflicts');
        // Exit to prevent polling mode conflicts in production
        throw new Error(messages.system.productionWebhookRequired);
      } else {
        const webhookUrl = `https://${domain}/webhook`;
        
        // Check current webhook to avoid unnecessary updates
        let webhookNeedsUpdate = false;
        try {
          const webhookInfo = await bot.telegram.getWebhookInfo();
          if (webhookInfo.url !== webhookUrl) {
            logger.info(messages.system.webhookUrlChanged);
            // Only delete if we need to change the webhook
            await bot.telegram.deleteWebhook({ drop_pending_updates: true });
            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1500));
            webhookNeedsUpdate = true;
          } else {
            logger.info(messages.system.webhookAlreadyConfigured);
          }
        } catch (error) {
          // Could not check webhook info, will set webhook
          webhookNeedsUpdate = true;
        }
        
        // Only set webhook if it needs updating
        if (webhookNeedsUpdate) {
          await bot.telegram.setWebhook(webhookUrl, {
            drop_pending_updates: false // Don't drop in production unless necessary
          });
          logEvent.webhookSet(webhookUrl);
        }
        
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
        
        // Warn if discussion group not configured in production
        if (!config.telegram.discussionGroupId) {
          logger.warn('⚠️ WARNING: Discussion group ID not configured!');
          logger.warn('Comments on channel posts will NOT trigger notifications.');
          logger.warn('Add FREE_DISCUSSION_GROUP_ID to your environment variables.');
        }
      }
    } else {
      // Development polling mode
      // Clear any existing webhook for development
      try {
        await bot.telegram.deleteWebhook({ drop_pending_updates: true });
      } catch (error) {
        // Ignore webhook clear errors in development
      }
      
      const botInfo = await bot.telegram.getMe();
      
      // Use bot.launch for proper polling setup
      await bot.launch({
        dropPendingUpdates: true
      });
      
      logEvent.botStarted('development', { username: botInfo.username });
      logger.info(`✅ Bot launched in polling mode for development`);
      
      // Warn if discussion group not configured
      if (!config.telegram.discussionGroupId) {
        logger.warn('⚠️ WARNING: Discussion group ID not configured!');
        logger.warn('Comments on channel posts will NOT trigger notifications.');
        logger.warn('Add FREE_DISCUSSION_GROUP_ID to your .env file.');
      }
    }
    
    // Set bot commands menu
    await bot.telegram.setMyCommands([
      { command: 'start', description: '🚀 Start sharing kindness' },
      { command: 'travel', description: '✈️ Share your travel plan' },
      { command: 'favor', description: '💚 Request a kind favor' },
      { command: 'myposts', description: '📋 Manage your active posts' },
      { command: 'stats', description: '📊 View community statistics' },
      { command: 'channelinfo', description: '📢 How channel & bot work together' },
      { command: 'help', description: '❓ How to spread kindness' }
    ]);
    
    // Setup scheduled jobs
    setupScheduledJobs(bot);
    
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