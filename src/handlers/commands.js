const { collections } = require('../config/firebase');
const { mainMenu } = require('../utils/keyboards');
const { canCreatePost, checkChannelMembership, isAdmin } = require('../utils/helpers');
const { LIMITS } = require('../config/constants');
const { logger, logEvent } = require('../utils/logger');
const { messages, formatMessage } = require('../config/messages');
const { config } = require('../config');

const setupCommands = (bot) => {
  // Start command
  bot.command('start', async (ctx) => {
    const userId = ctx.from.id.toString();
    const userName = ctx.from.first_name;
    
    try {
      // Check if user is member of the community channel
      const membershipStatus = await checkChannelMembership(bot, userId, config.telegram.channelId);
      const isMember = membershipStatus === true;
      const canCheckMembership = membershipStatus !== null;
      
      // If not a member, ask them to join first
      if (!isMember && canCheckMembership) {
        const joinKeyboard = {
          inline_keyboard: [
            [{ text: '📢 Community Channel သို့ဝင်ရောက်ရန်', url: 'https://t.me/LuuKyone_Community' }],
            [{ text: '✅ ဝင်ရောက်ပြီးပါပြီ', callback_data: 'check_membership' }]
          ]
        };
        
        return ctx.reply(
          `👋 Welcome ${userName}!\n\n` +
          messages.welcome.notMember.description + '\n\n' +
          messages.welcome.notMember.steps.title + '\n' +
          messages.welcome.notMember.steps.step1 + '\n' +
          messages.welcome.notMember.steps.step2 + '\n' +
          messages.welcome.notMember.steps.step3,
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
        const welcomeMsg = [
          formatMessage(messages.commands.start.newUser.greeting, { userName }),
          messages.commands.start.newUser.intro,
          messages.commands.start.newUser.howItWorks,
          messages.commands.start.newUser.routes,
          messages.commands.start.newUser.motto,
          messages.commands.start.newUser.ready
        ].join('\n\n');
        
        await ctx.reply(welcomeMsg, { 
          parse_mode: 'HTML',
          ...mainMenu()
        });
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
        
        const limit = user.isPremium ? LIMITS.premium.postsPerMonth : LIMITS.free.postsPerMonth;
        const returningMsg = [
          formatMessage(messages.commands.start.returningUser.greeting, { userName }),
          messages.commands.start.returningUser.motto,
          messages.commands.start.returningUser.impact,
          formatMessage(messages.commands.start.returningUser.postsMonth, { current: postCount, limit }),
          user.completedFavors > 0 ? 
            formatMessage(messages.commands.start.returningUser.completedFavors, { count: user.completedFavors }) + '\n' + messages.commands.start.returningUser.makingDifference :
            messages.commands.start.returningUser.firstAct,
          messages.commands.start.returningUser.ready
        ].join('\n\n');
        
        await ctx.reply(returningMsg, { 
          parse_mode: 'HTML',
          ...mainMenu()
        });
      }
      
      logEvent.userStarted(userId, userName);
    } catch (error) {
      logEvent.commandError('start', error, userId);
      ctx.reply(messages.common.genericError);
    }
  });
  
  // Help command
  bot.command('help', async (ctx) => {
    const { handleHelp } = require('./sharedHandlers');
    await handleHelp(ctx, false);
  });
  
  // Travel command
  bot.command('travel', async (ctx) => {
    const { handleTravel } = require('./sharedHandlers');
    await handleTravel(ctx, false, bot);
  });
  
  // Favor command
  bot.command('favor', async (ctx) => {
    const { handleFavor } = require('./sharedHandlers');
    await handleFavor(ctx, false, bot);
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
        return ctx.reply(messages.errors.noActivePost);
      }
      
      logEvent.postsViewed('unknown', 'browse', activeTravelPlans.length + activeFavorRequests.length);
      
      let message = messages.commands.browse.title + '\n\n';
      
      if (activeTravelPlans.length > 0) {
        message += messages.commands.browse.travelPlans + '\n';
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
        message += messages.commands.browse.favorRequests + '\n';
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
      
      message += '\n' + messages.commands.browse.footer;
      
      await ctx.reply(message, { parse_mode: 'HTML' });
    } catch (error) {
      logEvent.commandError('browse', error, 'unknown');
      ctx.reply(messages.common.genericError);
    }
  });
  
  // Settings command
  bot.command('settings', async (ctx) => {
    const userId = ctx.from.id.toString();
    logEvent.commandUsed(userId, 'settings');
    
    try {
      // Enter the settings scene
      ctx.scene.enter('settingsScene');
    } catch (error) {
      logger.error('Settings command error', { error: error.message, userId });
      ctx.reply(messages.common.genericError);
    }
  });
  
  // Profile command
  bot.command('profile', async (ctx) => {
    const userId = ctx.from.id.toString();
    
    try {
      const userDoc = await collections.users.doc(userId).get();
      
      if (!userDoc.exists) {
        return ctx.reply(messages.common.startBotFirst);
      }
      
      const user = userDoc.data();
      const postCount = await require('../utils/helpers').getMonthlyPostCount(userId, collections);
      
      logEvent.userViewedProfile(userId);
      
      const limit = user.isPremium ? LIMITS.premium.postsPerMonth : LIMITS.free.postsPerMonth;
      const memberType = user.isPremium ? '💎 Premium' : '🆓 Free';
      const username = user.username ? `@${user.username}` : 'Not set';
      const rating = user.rating > 0 ? 
        formatMessage(messages.commands.profile.ratingStars, {
          stars: '⭐'.repeat(Math.round(user.rating)),
          rating: user.rating
        }) : messages.commands.profile.noRating;
      const memberSince = new Date(user.joinedAt.toDate ? user.joinedAt.toDate() : user.joinedAt).toLocaleDateString();
      
      const profileMessage = [
        messages.commands.profile.title,
        '',
        formatMessage(messages.commands.profile.info, {
          userName: user.userName,
          username: username,
          memberType: memberType
        }),
        '',
        formatMessage(messages.commands.profile.statistics, {
          current: postCount,
          limit: limit,
          completed: user.completedFavors || 0,
          rating: rating
        }),
        '',
        formatMessage(messages.commands.profile.memberSince, { date: memberSince })
      ].join('\n');
      
      await ctx.reply(profileMessage, { parse_mode: 'HTML' });
    } catch (error) {
      logEvent.commandError('profile', error, userId);
      ctx.reply(messages.common.genericError);
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
    await ctx.reply(messages.common.operationCancelled, mainMenu());
  });
  
  // Test daily summaries (admin only)
  bot.command('test_summary', async (ctx) => {
    const userId = ctx.from.id.toString();
    if (!isAdmin(userId, config.telegram.adminIds)) {
      return ctx.reply(messages.admin.adminOnly);
    }
    
    const { testDailySummary } = require('../utils/scheduler');
    
    try {
      // Show options for morning or evening summary
      const keyboard = {
        inline_keyboard: [
          [{ text: '☀️ မနက်ပိုင်း အကျဉ်းချုပ် စမ်းသပ်ရန်', callback_data: 'test_morning_summary' }],
          [{ text: '🌙 ညနေပိုင်း အကျဉ်းချုပ် စမ်းသပ်ရန်', callback_data: 'test_evening_summary' }],
          [{ text: '❌ မလုပ်တော့ပါ', callback_data: 'cancel' }]
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
      ctx.reply(messages.admin.errorAccessingMenu);
    }
  });
  
  // Test notification settings (admin only)
  bot.command('test_notifications', async (ctx) => {
    const userId = ctx.from.id.toString();
    if (!isAdmin(userId, config.telegram.adminIds)) {
      return ctx.reply(messages.admin.adminOnly);
    }
    
    const { userWantsDailySummary } = require('../utils/helpers');
    
    try {
      const wantsSummary = await userWantsDailySummary(userId, collections);
      
      let message = '🔔 <b>Testing Notification Settings</b>\n\n';
      message += `<b>Your Current Settings:</b>\n`;
      message += formatMessage(messages.settings.notifications.connection) + '\n';
      message += formatMessage(messages.settings.notifications.daily, { 
        status: wantsSummary ? '📊 ON' : '📈 OFF' 
      }) + '\n\n';
      
      message += '💡 <b>What this means:</b>\n';
      message += '• You will ALWAYS be notified when someone contacts you\n';
      
      if (wantsSummary) {
        message += '• You WILL receive daily summaries at 9am and 6pm\n';
      } else {
        message += '• You will NOT receive daily summaries\n';
      }
      
      message += '\n<i>Use /settings to change your preferences</i>';
      
      await ctx.reply(message, { parse_mode: 'HTML' });
    } catch (error) {
      logger.error('Test notifications error', { error: error.message });
      ctx.reply(messages.errors.generic);
    }
  });
  
  // Channel info command
  bot.command('channelinfo', async (ctx) => {
    const channelInfoMessage = [
      messages.commands.channelInfo.title,
      '',
      messages.commands.channelInfo.howTheyWork,
      '',
      messages.commands.channelInfo.userJourney,
      '',
      messages.commands.channelInfo.whySystem,
      '',
      messages.commands.channelInfo.tips,
      '',
      messages.commands.channelInfo.footer
    ].join('\n');
    
    await ctx.reply(channelInfoMessage, { parse_mode: 'HTML' });
    logEvent.commandUsed(ctx.from.id.toString(), 'channelinfo');
  });
  
  // Statistics command
  bot.command('stats', async (ctx) => {
    try {
      const userId = ctx.from.id.toString();
      
      // Get current stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Count active posts
      const [travelPlans, favorRequests] = await Promise.all([
        collections.travelPlans
          .where('status', '==', 'active')
          .get(),
        collections.favorRequests
          .where('status', '==', 'active')
          .get()
      ]);
      
      // Count this month's posts
      const [monthlyTravels, monthlyFavors] = await Promise.all([
        collections.travelPlans
          .where('createdAt', '>=', startOfMonth)
          .get(),
        collections.favorRequests
          .where('createdAt', '>=', startOfMonth)
          .get()
      ]);
      
      // Count completed posts
      const [completedTravels, completedFavors] = await Promise.all([
        collections.travelPlans
          .where('status', '==', 'completed')
          .get(),
        collections.favorRequests
          .where('status', '==', 'completed')
          .get()
      ]);
      
      // Get total users count
      const usersSnapshot = await collections.users.get();
      
      const statsMessage = [
        messages.commands.stats.title,
        '',
        formatMessage(messages.commands.stats.community, { members: usersSnapshot.size }),
        '',
        formatMessage(messages.commands.stats.activePosts, {
          travels: travelPlans.size,
          favors: favorRequests.size,
          total: travelPlans.size + favorRequests.size
        }),
        '',
        formatMessage(messages.commands.stats.thisMonth, {
          travels: monthlyTravels.size,
          favors: monthlyFavors.size,
          total: monthlyTravels.size + monthlyFavors.size
        }),
        '',
        formatMessage(messages.commands.stats.allTime, {
          travels: completedTravels.size,
          favors: completedFavors.size,
          total: completedTravels.size + completedFavors.size
        }),
        '',
        formatMessage(messages.commands.stats.impact, {
          lives: (completedTravels.size + completedFavors.size) * 2
        }),
        '',
        messages.commands.stats.footer
      ].join('\n');
      
      await ctx.reply(statsMessage, { parse_mode: 'HTML' });
      
      logEvent.commandUsed(userId, 'stats');
    } catch (error) {
      logger.error('Stats command error', { error: error.message });
      ctx.reply(messages.errors.generic);
    }
  });

  // Cleanup command (admin only) - manually trigger cleanup
  bot.command('cleanup', async (ctx) => {
    const userId = ctx.from.id.toString();
    
    if (!isAdmin(userId, config.telegram.adminIds)) {
      return ctx.reply(messages.admin.adminOnly);
    }
    
    try {
      await ctx.reply(messages.admin.runningCleanup);
      const { cleanupExpiredPosts } = require('../utils/scheduler');
      await cleanupExpiredPosts();
      await ctx.reply(messages.admin.cleanupCompleted);
      logEvent.customEvent('manual_cleanup', { adminId: userId });
    } catch (error) {
      logger.error('Manual cleanup error', { error: error.message });
      ctx.reply(formatMessage(messages.admin.cleanupFailed, { error: error.message }));
    }
  });

  // Test channel features (admin only)
  bot.command('test_channel', async (ctx) => {
    const userId = ctx.from.id.toString();
    
    // Check if user is admin (you can add your user ID here)
    if (!isAdmin(userId, config.telegram.adminIds)) {
      return ctx.reply(messages.admin.adminOnly);
    }
    
    try {
      // Show test options
      const testKeyboard = {
        inline_keyboard: [
          [{ text: '📢 ကြိုဆိုစကား စမ်းသပ်ရန်', callback_data: 'test_welcome' }],
          [{ text: '💚 နေ့စဉ် စကားပုံ စမ်းသပ်ရန်', callback_data: 'test_quote' }],
          [{ text: '🎊 မှတ်တိုင် စမ်းသပ်ရန် (ကူညီမှု ၁၀၀)', callback_data: 'test_milestone_100' }],
          [{ text: '🎉 မှတ်တိုင် စမ်းသပ်ရန် (အဖွဲ့ဝင် ၅၀၀)', callback_data: 'test_milestone_500' }],
          [{ text: '📊 အပတ်စဉ် စာရင်းဇယား စမ်းသပ်ရန်', callback_data: 'test_stats' }],
          [{ text: '❌ မလုပ်တော့ပါ', callback_data: 'cancel' }]
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
      ctx.reply(messages.admin.errorAccessingMenu);
    }
  });
};

module.exports = setupCommands;