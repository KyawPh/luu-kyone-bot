const { collections } = require('../config/firebase');
const { mainMenu } = require('../utils/keyboards');
const { canCreatePost } = require('../utils/helpers');
const { LIMITS } = require('../config/constants');
const { logger, logEvent } = require('../utils/logger');

const setupCommands = (bot) => {
  // Start command
  bot.command('start', async (ctx) => {
    const userId = ctx.from.id.toString();
    const userName = ctx.from.first_name;
    
    try {
      // Check if user is member of the community channel
      let isMember = false;
      let canCheckMembership = true;
      try {
        const chatMember = await bot.telegram.getChatMember(process.env.FREE_CHANNEL_ID, userId);
        isMember = ['member', 'administrator', 'creator'].includes(chatMember.status);
      } catch (error) {
        // Check if bot is not admin in channel
        if (error.message.includes('chat not found') || error.message.includes('bot is not a member')) {
          canCheckMembership = false;
        }
      }
      
      // If not a member, ask them to join first
      if (!isMember && canCheckMembership) {
        const joinKeyboard = {
          inline_keyboard: [
            [{ text: '📢 Join Community Channel', url: 'https://t.me/LuuKyone_Community' }],
            [{ text: '✅ I\'ve Joined', callback_data: 'check_membership' }]
          ]
        };
        
        return ctx.reply(
          `👋 Welcome ${userName}!\n\n` +
          `To use <b>Luu Kyone Bot</b>, please join our community channel first.\n\n` +
          `All travel plans and favor requests are shared there, so you can:\n` +
          `• See all active posts\n` +
          `• Connect with other members\n` +
          `• Build trust in the community\n\n` +
          `Please join the channel and click "I've Joined" below:`,
          {
            parse_mode: 'HTML',
            reply_markup: joinKeyboard
          }
        );
      }
      
      // If we can't check membership (bot not admin), continue anyway
      if (!canCheckMembership) {
        // Bot needs admin permissions in channel to verify membership
      }
      
      // Check if user exists
      const userDoc = await collections.users.doc(userId).get();
      
      if (!userDoc.exists) {
        // Create new user with basic Telegram info
        await collections.users.doc(userId).set({
          userId: userId,
          userName: userName,
          username: ctx.from.username || null,
          joinedAt: new Date(),
          lastActive: new Date(),
          isPremium: false,
          completedFavors: 0,
          rating: 0,
          language: 'en',
          isChannelMember: true // They must be a member to reach this point
        });
        
        logEvent.userJoined(userId, userName);
        
        // Send welcome message for new user
        await ctx.reply(
          `💚 <b>Welcome to Our Kindness Community!</b>\n\n` +
          `Hi ${userName}! You've just joined something special.\n\n` +
          `<b>Luu Kyone</b> (လူကြုံ) connects kind hearts across cities. We're neighbors helping neighbors with personal favors - not a delivery service.\n\n` +
          `<b>How it works:</b>\n` +
          `✈️ <b>Traveling?</b> Your empty luggage space can bring joy\n` +
          `🤝 <b>Need a favor?</b> Your neighbor might be traveling home\n\n` +
          `<b>Our routes:</b> 🇸🇬 Singapore ↔ 🇹🇭 Bangkok ↔ 🇲🇲 Yangon\n\n` +
          `<i>"Small acts, when multiplied by millions of people,\ncan transform the world"</i>\n\n` +
          `Ready to spread kindness? Let's start! 🙏`,
          { 
            parse_mode: 'HTML',
            ...mainMenu()
          }
        );
      } else {
        // Update last active and membership status
        await collections.users.doc(userId).update({
          lastActive: new Date(),
          isChannelMember: true
        });
        
        // Send main menu for existing user with helpful context
        const user = userDoc.data();
        const postCount = await require('../utils/helpers').getMonthlyPostCount(userId, collections);
        const postsRemaining = (user.isPremium ? LIMITS.premium.postsPerMonth : LIMITS.free.postsPerMonth) - postCount;
        
        await ctx.reply(
          `Welcome back, ${userName}! 🤝\n\n` +
          `<i>"Every act of kindness creates a ripple"</i>\n\n` +
          `<b>Your impact so far:</b>\n` +
          `📊 Favors this month: ${postCount}/${user.isPremium ? LIMITS.premium.postsPerMonth : LIMITS.free.postsPerMonth}\n` +
          `${user.completedFavors > 0 ? `💚 Acts of kindness: ${user.completedFavors}\n⭐ You're making a difference!` : `🌱 Your first act of kindness awaits!`}\n\n` +
          `Someone might need your help today. Let's see! 🙏`,
          { 
            parse_mode: 'HTML',
            ...mainMenu()
          }
        );
      }
      
      logEvent.userStarted(userId, userName);
    } catch (error) {
      logEvent.commandError('start', error, userId);
      ctx.reply('❌ An error occurred. Please try again.');
    }
  });
  
  // Help command
  bot.command('help', async (ctx) => {
    const helpMessage = `
❓ <b>How Luu Kyone Works</b>

We connect travelers with people needing personal favors.
It's about <b>kindness, not business</b>. 💚

<b>✈️ For Kind Travelers:</b>
Your empty luggage space = Someone's happiness!
• Tap /travel to share your journey
• Choose what you're comfortable carrying
• Connect with grateful neighbors
• <i>5 minutes of your time brings endless joy</i>

<b>🤝 For Those Needing Favors:</b>
Your neighbor might be traveling home!
• Tap /favor to request help
• Describe what you need clearly
• Add photos for better understanding
• <i>Small favors, big impact on lives</i>

<b>🛡️ Safety First:</b>
• Meet only in public places (airports, cafes)
• Document everything with photos
• Trust your instincts always
• Never carry unknown items

<b>💚 Community Guidelines:</b>
• This is NOT a delivery service
• Show gratitude with thank-you gifts
• Build trust through kindness
• ${LIMITS.free.postsPerMonth} favors/month (free members)

<i>"Kindness is free. Sprinkle it everywhere!"</i>

Need help? Join @LuuKyone_Community 🙏
    `;
    
    await ctx.reply(helpMessage, { 
      parse_mode: 'HTML',
      disable_web_page_preview: true 
    });
  });
  
  // Travel command
  bot.command('travel', async (ctx) => {
    const userId = ctx.from.id.toString();
    
    try {
      // Check channel membership first
      let isMember = false;
      try {
        const chatMember = await bot.telegram.getChatMember(process.env.FREE_CHANNEL_ID, userId);
        isMember = ['member', 'administrator', 'creator'].includes(chatMember.status);
      } catch (error) {
        // Membership check failed
      }
      
      if (!isMember) {
        return ctx.reply(
          '❌ Please join @LuuKyone_Community first!\n\n' +
          'Use /start to get the join link.'
        );
      }
      
      // Check if user exists
      const userDoc = await collections.users.doc(userId).get();
      if (!userDoc.exists) {
        return ctx.reply('Please start the bot first with /start');
      }
      
      // Check post limit
      const postCheck = await canCreatePost(userId, userDoc.data().isPremium, collections);
      
      if (!postCheck.canCreate) {
        return ctx.reply(
          `❌ You've reached your monthly limit of ${postCheck.limit} posts.\n` +
          `Posts used: ${postCheck.current}/${postCheck.limit}\n\n` +
          `Your limit will reset next month.`
        );
      }
      
      // Enter travel scene
      ctx.scene.enter('travelScene');
    } catch (error) {
      logEvent.commandError('travel', error, userId);
      ctx.reply('❌ An error occurred. Please try again.');
    }
  });
  
  // Favor command
  bot.command('favor', async (ctx) => {
    const userId = ctx.from.id.toString();
    
    try {
      // Check channel membership first
      let isMember = false;
      try {
        const chatMember = await bot.telegram.getChatMember(process.env.FREE_CHANNEL_ID, userId);
        isMember = ['member', 'administrator', 'creator'].includes(chatMember.status);
      } catch (error) {
        // Membership check failed
      }
      
      if (!isMember) {
        return ctx.reply(
          '❌ Please join @LuuKyone_Community first!\n\n' +
          'Use /start to get the join link.'
        );
      }
      
      // Check if user exists
      const userDoc = await collections.users.doc(userId).get();
      if (!userDoc.exists) {
        return ctx.reply('Please start the bot first with /start');
      }
      
      // Check post limit
      const postCheck = await canCreatePost(userId, userDoc.data().isPremium, collections);
      
      if (!postCheck.canCreate) {
        return ctx.reply(
          `❌ You've reached your monthly limit of ${postCheck.limit} posts.\n` +
          `Posts used: ${postCheck.current}/${postCheck.limit}\n\n` +
          `Your limit will reset next month.`
        );
      }
      
      // Enter favor scene
      ctx.scene.enter('favorScene');
    } catch (error) {
      logEvent.commandError('favor', error, userId);
      ctx.reply('❌ An error occurred. Please try again.');
    }
  });
  
  // Browse command
  bot.command('browse', async (ctx) => {
    try {
      // Get recent posts (simplified to avoid index requirements)
      const [travelPlans, favorRequests] = await Promise.all([
        collections.travelPlans
          .orderBy('createdAt', 'desc')
          .limit(20)
          .get(),
        collections.favorRequests
          .orderBy('createdAt', 'desc')
          .limit(20)
          .get()
      ]);
      
      // Filter for active status in memory
      const activeTravelPlans = [];
      const activeFavorRequests = [];
      
      travelPlans.forEach(doc => {
        if (doc.data().status === 'active') {
          activeTravelPlans.push(doc);
        }
      });
      
      favorRequests.forEach(doc => {
        if (doc.data().status === 'active') {
          activeFavorRequests.push(doc);
        }
      });
      
      if (activeTravelPlans.length === 0 && activeFavorRequests.length === 0) {
        return ctx.reply('📭 No active posts at the moment. Check back later!');
      }
      
      logEvent.postsViewed('unknown', 'browse', activeTravelPlans.length + activeFavorRequests.length);
      
      let message = '📋 <b>Recent Active Posts</b>\n\n';
      
      if (activeTravelPlans.length > 0) {
        message += '<b>✈️ Travel Plans:</b>\n';
        activeTravelPlans.slice(0, 10).forEach(doc => {
          const plan = doc.data();
          const fromCity = plan.fromCity || 'Unknown';
          const toCity = plan.toCity || 'Unknown';
          const date = plan.departureDate ? new Date(plan.departureDate.toDate()).toLocaleDateString() : 'Date TBD';
          message += `• ${fromCity} → ${toCity} (${date})\n`;
        });
        message += '\n';
      }
      
      if (activeFavorRequests.length > 0) {
        message += '<b>📦 Favor Requests:</b>\n';
        activeFavorRequests.slice(0, 10).forEach(doc => {
          const request = doc.data();
          const fromCity = request.fromCity || 'Unknown';
          const toCity = request.toCity || 'Unknown';
          // Handle both old single category and new multiple categories
          let categoryDisplay = 'Various';
          if (request.categories && Array.isArray(request.categories)) {
            categoryDisplay = request.categories.length > 1 
              ? `${request.categories.length} items` 
              : request.categories[0];
          } else if (request.category) {
            categoryDisplay = request.category;
          }
          message += `• ${fromCity} → ${toCity}: ${categoryDisplay} (${request.urgency})\n`;
        });
      }
      
      message += '\n<i>Visit our channel @LuuKyone_Community for details</i>';
      
      await ctx.reply(message, { parse_mode: 'HTML' });
    } catch (error) {
      logEvent.commandError('browse', error, 'unknown');
      ctx.reply('❌ An error occurred. Please try again.');
    }
  });
  
  // Profile command
  bot.command('profile', async (ctx) => {
    const userId = ctx.from.id.toString();
    
    try {
      const userDoc = await collections.users.doc(userId).get();
      
      if (!userDoc.exists) {
        return ctx.reply('Please start the bot first with /start');
      }
      
      const user = userDoc.data();
      const postCount = await require('../utils/helpers').getMonthlyPostCount(userId, collections);
      
      logEvent.userViewedProfile(userId);
      
      const profileMessage = `
👤 <b>Your Profile</b>

Name: ${user.userName}
Username: ${user.username ? `@${user.username}` : 'Not set'}
Member Type: ${user.isPremium ? '💎 Premium' : '🆓 Free'}

📊 <b>Statistics:</b>
Posts this month: ${postCount}/${user.isPremium ? LIMITS.premium.postsPerMonth : LIMITS.free.postsPerMonth}
Completed favors: ${user.completedFavors || 0}
${user.rating > 0 ? `Rating: ${'⭐'.repeat(Math.round(user.rating))} (${user.rating}/5)` : 'No ratings yet'}

Member since: ${new Date(user.joinedAt.toDate ? user.joinedAt.toDate() : user.joinedAt).toLocaleDateString()}
      `;
      
      await ctx.reply(profileMessage, { parse_mode: 'HTML' });
    } catch (error) {
      logEvent.commandError('profile', error, userId);
      ctx.reply('❌ An error occurred. Please try again.');
    }
  });
  
  // My Posts command - manage active posts
  bot.command('myposts', async (ctx) => {
    const { handleMyPosts } = require('../commands/myposts');
    await handleMyPosts(ctx);
  });
  
  // Cancel command
  bot.command('cancel', async (ctx) => {
    if (ctx.scene) {
      ctx.scene.leave();
    }
    await ctx.reply('❌ Operation cancelled.', mainMenu());
  });
  
  // Test daily summaries (admin only)
  bot.command('test_summary', async (ctx) => {
    const userId = ctx.from.id.toString();
    const ADMIN_IDS = ['1633991807']; // Add your Telegram user ID here
    
    if (!ADMIN_IDS.includes(userId)) {
      return ctx.reply('❌ This command is for admins only.');
    }
    
    const { testDailySummary } = require('../utils/scheduler');
    
    try {
      // Show options for morning or evening summary
      const keyboard = {
        inline_keyboard: [
          [{ text: '☀️ Test Morning Summary', callback_data: 'test_morning_summary' }],
          [{ text: '🌙 Test Evening Summary', callback_data: 'test_evening_summary' }],
          [{ text: '❌ Cancel', callback_data: 'cancel' }]
        ]
      };
      
      await ctx.reply(
        '📊 <b>Test Daily Summary</b>\n\n' +
        'Select which summary to test:',
        {
          parse_mode: 'HTML',
          reply_markup: keyboard
        }
      );
    } catch (error) {
      logger.error('Test summary command error', { error: error.message });
      ctx.reply('❌ Error accessing test menu.');
    }
  });
  
  // Cleanup expired posts (admin only)
  bot.command('cleanup', async (ctx) => {
    const userId = ctx.from.id.toString();
    const ADMIN_IDS = ['1633991807']; // Add your Telegram user ID here
    
    if (!ADMIN_IDS.includes(userId)) {
      return ctx.reply('❌ This command is for admins only.');
    }
    
    const { cleanupExpiredPosts } = require('../utils/scheduler');
    
    try {
      await ctx.reply('🧹 Running cleanup job...');
      await cleanupExpiredPosts();
      await ctx.reply('✅ Cleanup completed! Check logs for details.');
    } catch (error) {
      logger.error('Manual cleanup error', { error: error.message });
      ctx.reply(`❌ Cleanup failed: ${error.message}`);
    }
  });
  
  // Test channel features (admin only)
  bot.command('test_channel', async (ctx) => {
    const userId = ctx.from.id.toString();
    
    // Check if user is admin (you can add your user ID here)
    const ADMIN_IDS = ['1633991807']; // Add your Telegram user ID here
    
    if (!ADMIN_IDS.includes(userId)) {
      return ctx.reply('❌ This command is for admins only.');
    }
    
    try {
      // Show test options
      const testKeyboard = {
        inline_keyboard: [
          [{ text: '📢 Test Welcome Message', callback_data: 'test_welcome' }],
          [{ text: '💚 Test Daily Quote', callback_data: 'test_quote' }],
          [{ text: '🎊 Test Milestone (100 kindness)', callback_data: 'test_milestone_100' }],
          [{ text: '🎉 Test Milestone (500 members)', callback_data: 'test_milestone_500' }],
          [{ text: '📊 Test Weekly Stats', callback_data: 'test_stats' }],
          [{ text: '❌ Cancel', callback_data: 'cancel' }]
        ]
      };
      
      await ctx.reply(
        '🧪 <b>Channel Test Menu</b>\n\n' +
        'Select what you want to test:',
        { 
          parse_mode: 'HTML',
          reply_markup: testKeyboard
        }
      );
    } catch (error) {
      logger.error('Test command error', { error: error.message });
      ctx.reply('❌ Error accessing test menu.');
    }
  });
};

module.exports = setupCommands;