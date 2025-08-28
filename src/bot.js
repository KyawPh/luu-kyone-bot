const { Telegraf, session } = require('telegraf');
const { config } = require('./config');
const { collections } = require('./config/firebase');
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
  console.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply('❌ An error occurred. Please try again or contact support.');
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
        console.log('⚠️ No domain set, falling back to polling mode in production');
        // Fallback to polling in production if no domain is set
        const botInfo = await bot.telegram.getMe();
        bot.startPolling(30, 100, null, () => {
          console.log(`✅ Bot started as @${botInfo.username} (production polling mode)`);
        });
      } else {
        const webhookUrl = `https://${domain}/webhook`;
        await bot.telegram.setWebhook(webhookUrl);
        
        // Start webhook server
        bot.startWebhook('/webhook', null, config.server.port);
        
        console.log(`✅ Bot started in production mode on port ${config.server.port}`);
        console.log(`📡 Webhook URL: ${webhookUrl}`);
      }
    } else {
      // Development polling mode
      const botInfo = await bot.telegram.getMe();
      
      // Start polling
      bot.startPolling(30, 100, null, () => {
        console.log(`✅ Bot started as @${botInfo.username} (development mode)`);
      });
    }
    
    // Set bot commands menu
    await bot.telegram.setMyCommands([
      { command: 'start', description: '🚀 Start sharing kindness' },
      { command: 'travel', description: '✈️ Share your travel plan' },
      { command: 'favor', description: '💚 Request a kind favor' },
      { command: 'help', description: '❓ How to spread kindness' }
    ]);
    
    console.log('🤖 Luu Kyone Bot (@luukyonebot) is running!');
  } catch (error) {
    console.error('❌ Failed to launch bot:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.once('SIGINT', () => {
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
});

// Launch the bot
launch();