require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const { collections } = require('./config/firebase');
const setupCommands = require('./handlers/commands');
const setupCallbacks = require('./handlers/callbacks');
const setupChannelHandlers = require('./handlers/channel');
const travelScene = require('./scenes/travel');
const favorScene = require('./scenes/favor');

// Check for required environment variables
if (!process.env.BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is not set in .env file');
  process.exit(1);
}

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

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
    if (process.env.NODE_ENV === 'production') {
      // Production webhook setup for Railway
      const domain = process.env.RAILWAY_STATIC_URL || process.env.VERCEL_URL;
      if (!domain) {
        throw new Error('Domain not set for production webhook');
      }
      
      const webhookUrl = `https://${domain}/webhook`;
      await bot.telegram.setWebhook(webhookUrl);
      
      // Start webhook server
      const port = process.env.PORT || 3000;
      bot.startWebhook('/webhook', null, port);
      
      console.log(`✅ Bot started in production mode on port ${port}`);
      console.log(`📡 Webhook URL: ${webhookUrl}`);
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