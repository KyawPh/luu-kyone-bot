const { collections } = require('../config/firebase');
const { mainMenu, contactButton } = require('../utils/keyboards');
const { escapeHtml, getMonthlyPostCount, formatRoute, formatDate, checkChannelMembership, isAdmin } = require('../utils/helpers');
const { LIMITS } = require('../config/constants');
const { logger, logEvent } = require('../utils/logger');
const { messages, formatMessage } = require('../config/messages');
const { config } = require('../config');

const setupCallbacks = (bot) => {
  // Check membership callback
  bot.action('check_membership', async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from.id.toString();
    const userName = ctx.from.first_name;
    
    try {
      // Re-check if user has joined the channel
      const isMember = await checkChannelMembership(bot, userId, config.telegram.channelId);
      logEvent.membershipChecked(userId, isMember);
      
      if (!isMember) {
        // Still not a member
        return ctx.reply(
          messages.errors.notMember + '\n\n' +
          'Please join @LuuKyone_Community first, then click "I\'ve Joined" again.'
        );
      }
      
      // User has joined! Check if they exist in database
      const userDoc = await collections.users.doc(userId).get();
      
      if (!userDoc.exists) {
        // Create new user
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
          isChannelMember: true
        });
        
        // Send welcome message
        await ctx.editMessageText(
          messages.welcome.newUser.title + '\n\n' +
          formatMessage(messages.welcome.newUser.greeting, { userName }) + '\n\n' +
          messages.welcome.newUser.intro + '\n\n' +
          messages.welcome.newUser.benefits.title + '\n' +
          messages.welcome.newUser.benefits.travel + '\n' +
          messages.welcome.newUser.benefits.favor + '\n' +
          messages.welcome.newUser.benefits.connect + '\n\n' +
          messages.welcome.newUser.start,
          { parse_mode: 'HTML' }
        );
      } else {
        // Update existing user
        await collections.users.doc(userId).update({
          lastActive: new Date(),
          isChannelMember: true
        });
        
        await ctx.editMessageText(
          messages.welcome.returningUser.title + '\n\n' +
          formatMessage(messages.welcome.returningUser.greeting, { userName }) + '\n\n' +
          messages.welcome.returningUser.prompt + '\n\n' +
          messages.welcome.returningUser.motto,
          { parse_mode: 'HTML' }
        );
      }
      
      // Show main menu after a short delay
      setTimeout(() => {
        ctx.reply(messages.common.howSpreadKindness, mainMenu());
      }, 500);
      
    } catch (error) {
      logger.error('Check membership error', { error: error.message });
      ctx.reply(messages.common.genericError + ' Please try /start again.');
    }
  });
  
  // Main menu callbacks
  bot.action('create_travel', async (ctx) => {
    await ctx.answerCbQuery();
    // Pass the message info when entering the scene
    ctx.scene.enter('travelScene', { 
      messageToEdit: ctx.callbackQuery.message 
    });
  });
  
  bot.action('create_favor', async (ctx) => {
    await ctx.answerCbQuery();
    // Pass the message info when entering the scene
    ctx.scene.enter('favorScene', { 
      messageToEdit: ctx.callbackQuery.message 
    });
  });
  
  bot.action('browse_requests', async (ctx) => {
    await ctx.answerCbQuery();
    
    try {
      // Get recent travel plans and favor requests (simplified to avoid index requirements)
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
        return ctx.editMessageText(messages.errors.noActivePost);
      }
      
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
          message += `• ${fromCity} → ${toCity}: ${request.category} (${request.urgency})\n`;
        });
      }
      
      message += '\n<i>Visit our channel @LuuKyone_Community for details</i>';
      
      await ctx.editMessageText(message, { parse_mode: 'HTML' });
      
      // Show main menu again
      setTimeout(() => {
        ctx.reply(messages.common.whatToDo, mainMenu());
      }, 500);
    } catch (error) {
      logger.error('Browse callback error', { error: error.message });
      ctx.reply(messages.common.genericError);
    }
  });
  
  bot.action('my_profile', async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from.id.toString();
    
    try {
      const userDoc = await collections.users.doc(userId).get();
      
      if (!userDoc.exists) {
        return ctx.reply(messages.common.startBotFirst);
      }
      
      const user = userDoc.data();
      const postCount = await getMonthlyPostCount(userId, collections);
      
      const profileMessage = `${messages.profile.title}\n\n` +
        `${formatMessage(messages.profile.name, { userName: user.userName })}\n` +
        `${formatMessage(messages.profile.username, { username: user.username ? `@${user.username}` : 'Not set' })}\n` +
        `${formatMessage(messages.profile.memberType, { type: user.isPremium ? '💎 Premium' : '🆓 Free' })}\n\n` +
        `${messages.profile.statistics.title}\n` +
        `${formatMessage(messages.profile.statistics.posts, { current: postCount, limit: user.isPremium ? LIMITS.premium.postsPerMonth : LIMITS.free.postsPerMonth })}\n` +
        `${formatMessage(messages.profile.statistics.completed, { count: user.completedFavors || 0 })}\n` +
        `${user.rating > 0 ? formatMessage(messages.profile.statistics.rating, { rating: user.rating }) : messages.profile.statistics.noRating}\n\n` +
        `${formatMessage(messages.profile.memberSince, { date: new Date(user.joinedAt.toDate ? user.joinedAt.toDate() : user.joinedAt).toLocaleDateString() })}`;
      
      await ctx.editMessageText(profileMessage, { parse_mode: 'HTML' });
      
      // Show main menu again
      setTimeout(() => {
        ctx.reply(messages.common.whatToDo, mainMenu());
      }, 500);
    } catch (error) {
      logger.error('Profile callback error', { error: error.message });
      ctx.reply(messages.common.genericError);
    }
  });
  
  bot.action('help', async (ctx) => {
    await ctx.answerCbQuery();
    
    const helpMessage = `${messages.help.title}\n\n` +
      `${messages.help.intro.title}\n` +
      `${messages.help.intro.description}\n\n` +
      `${messages.help.travelers.title}\n` +
      `${messages.help.travelers.step1}\n` +
      `${messages.help.travelers.step2}\n` +
      `${messages.help.travelers.step3}\n` +
      `${messages.help.travelers.step4}\n\n` +
      `${messages.help.requesters.title}\n` +
      `${messages.help.requesters.step1}\n` +
      `${messages.help.requesters.step2}\n` +
      `${messages.help.requesters.step3}\n` +
      `${messages.help.requesters.step4}\n\n` +
      `${messages.help.commands.title}\n` +
      `${messages.help.commands.start}\n` +
      `${messages.help.commands.travel}\n` +
      `${messages.help.commands.favor}\n` +
      `${messages.help.commands.browse}\n` +
      `${messages.help.commands.profile}\n` +
      `${messages.help.commands.settings}\n` +
      `${messages.help.commands.help}\n` +
      `${messages.help.commands.cancel}\n\n` +
      `${messages.help.limits.title}\n` +
      `${formatMessage(messages.help.limits.posts, { limit: LIMITS.free.postsPerMonth })}\n` +
      `${messages.help.limits.introduction}\n` +
      `${messages.help.limits.trust}\n\n` +
      `${messages.help.safety.title}\n` +
      `${messages.help.safety.meet}\n` +
      `${messages.help.safety.verify}\n` +
      `${messages.help.safety.photos}\n` +
      `${messages.help.safety.prohibited}\n` +
      `${messages.help.safety.instincts}\n\n` +
      `${messages.help.support}`;
    
    await ctx.editMessageText(helpMessage, { 
      parse_mode: 'HTML',
      disable_web_page_preview: true 
    });
    
    // Show main menu again
    setTimeout(() => {
      ctx.reply(messages.common.whatToDo, mainMenu());
    }, 500);
  });
  
  bot.action('settings', async (ctx) => {
    await ctx.answerCbQuery();
    // Enter the settings scene
    ctx.scene.enter('settingsScene', { 
      messageToEdit: ctx.callbackQuery.message 
    });
  });
  
  // Contact button handler
  bot.action(/^contact_(.+)_(.+)_(.+)$/, async (ctx) => {
    const [postType, postId, posterId] = ctx.match.slice(1);
    const requesterId = ctx.from.id.toString();
    
    await ctx.answerCbQuery('Processing your request...');
    
    try {
      // Check if it's the same user
      if (requesterId === posterId) {
        await ctx.answerCbQuery(messages.errors.cannotContactSelf, { show_alert: true });
        return;
      }
      
      // Get requester info
      const requesterDoc = await collections.users.doc(requesterId).get();
      if (!requesterDoc.exists) {
        await ctx.answerCbQuery(messages.common.startBotFirstAlert, { show_alert: true });
        return;
      }
      
      const requester = requesterDoc.data();
      
      // Check if connection already exists (one-time introduction)
      const existingConnection = await collections.connections
        .where('requesterId', '==', requesterId)
        .where('posterId', '==', posterId)
        .where('postId', '==', postId)
        .get();
      
      if (!existingConnection.empty) {
        await ctx.answerCbQuery(
          messages.errors.alreadyContacted,
          { show_alert: true }
        );
        return;
      }
      
      // Create connection record
      await collections.connections.add({
        requesterId: requesterId,
        posterId: posterId,
        postId: postId,
        postType: postType,
        createdAt: new Date(),
        status: 'introduced'
      });
      
      // Log the contact request
      logEvent.contactRequested(requesterId, posterId, postId, postType);
      
      // Get poster info
      const posterDoc = await collections.users.doc(posterId).get();
      const poster = posterDoc.data();
      
      // Get post details
      const postCollection = postType === 'travel' ? collections.travelPlans : collections.favorRequests;
      const postDoc = await postCollection.doc(postId).get();
      const postData = postDoc.data();
      
      // Send introduction message PRIVATELY to requester
      const postTypeDisplay = messages.postTypes[postType];
      await bot.telegram.sendMessage(
        requesterId,
        messages.contact.receivedInfo.title + '\n\n' +
        formatMessage(messages.contact.receivedInfo.postType, { postType: postTypeDisplay }) + '\n' +
        formatMessage(messages.contact.receivedInfo.route, { route: formatRoute(postData.fromCity, postData.toCity) }) + '\n' +
        formatMessage(messages.contact.receivedInfo.date, { date: postType === 'travel' ? formatDate(postData.departureDate) : 'As arranged' }) + '\n\n' +
        messages.contact.receivedInfo.contactPerson + '\n' +
        `👤 ${escapeHtml(poster.userName)}\n` +
        `${poster.username ? `💬 @${poster.username}` : `💬 <a href="tg://user?id=${posterId}">Click here to message</a>`}\n\n` +
        formatMessage(messages.contact.receivedInfo.tip, { postId }) + '\n\n' +
        messages.contact.receivedInfo.oneTime,
        { parse_mode: 'HTML' }
      );
      
      // Always send connection notification to poster (core functionality)
      try {
        const requesterTypeText = postType === 'travel' ? 'needs your help' : 'can help you';
        await bot.telegram.sendMessage(
          posterId,
          messages.contact.newMatch.title + '\n\n' +
          formatMessage(messages.contact.newMatch.someone, { action: requesterTypeText }) + '\n' +
          formatMessage(messages.contact.newMatch.route, { route: formatRoute(postData.fromCity, postData.toCity) }) + '\n' +
          formatMessage(messages.contact.newMatch.postId, { postId }) + '\n\n' +
          messages.contact.newMatch.interested + '\n' +
          `👤 ${escapeHtml(requester.userName)}\n` +
          `${requester.username ? `💬 @${requester.username}` : `💬 <a href="tg://user?id=${requesterId}">View profile</a>`}\n\n` +
          messages.contact.newMatch.willContact + '\n\n' +
          messages.contact.newMatch.tip,
          { parse_mode: 'HTML' }
        );
      } catch (error) {
        logger.error('Failed to notify poster', { error: error.message });
      }
      
    } catch (error) {
      logger.error('Contact callback error', { error: error.message });
      await ctx.answerCbQuery(messages.common.genericError, { show_alert: true });
    }
  });
  
  // Generic cancel callback
  bot.action('cancel', async (ctx) => {
    await ctx.answerCbQuery();
    if (ctx.scene) {
      ctx.scene.leave();
    }
    await ctx.editMessageText(messages.common.operationCancelled);
    await ctx.reply(messages.common.whatToDo, mainMenu());
  });
  
  // Generic back callback
  bot.action('back', async (ctx) => {
    await ctx.answerCbQuery();
    // This will be handled by specific scenes
    if (!ctx.scene || !ctx.scene.current) {
      await ctx.reply(messages.common.whatToDo, mainMenu());
    }
  });
  
  // Test channel callbacks
  bot.action('test_welcome', async (ctx) => {
    await ctx.answerCbQuery(messages.test.sendingWelcome);
    
    try {
      const welcomeMessages = [
        `💚 Welcome to our kindness family!\n\n"Your journey of a thousand acts of kindness begins with a single favor."\n\nReady to help? Start here: @luukyonebot`,
        `🤝 Another kind soul joins us!\n\n"Together we're building bridges of kindness across cities."\n\nShare your journey: @luukyonebot`,
        `✨ Welcome, neighbor!\n\n"Every new member makes our community stronger and kinder."\n\nBegin spreading joy: @luukyonebot`,
        `🌟 So happy you're here!\n\n"In a world where you can be anything, you chose to be kind."\n\nStart your kindness story: @luukyonebot`
      ];
      
      const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
      
      await bot.telegram.sendMessage(
        config.telegram.channelId,
        `🧪 TEST WELCOME MESSAGE\n\n${randomMessage}\n\n` +
        `#WelcomeWednesday #LuuKyoneFamily #KindnessInAction`,
        { parse_mode: 'HTML' }
      );
      
      await ctx.editMessageText(messages.test.welcomeMessageSent);
    } catch (error) {
      logger.error('Test welcome error', { error: error.message });
      await ctx.editMessageText(formatMessage(messages.common.failedToSend, { error: error.message }) + '\n\n' + messages.common.botAdminRequired);
    }
  });
  
  bot.action('test_quote', async (ctx) => {
    await ctx.answerCbQuery(messages.test.sendingQuote);
    
    try {
      await bot.telegram.sendDailyQuote();
      await ctx.editMessageText(messages.test.dailyQuoteSent);
    } catch (error) {
      logger.error('Test quote error', { error: error.message });
      await ctx.editMessageText(formatMessage(messages.common.failedToSend, { error: error.message }));
    }
  });
  
  bot.action('test_milestone_100', async (ctx) => {
    await ctx.answerCbQuery(messages.test.sendingMilestone);
    
    try {
      await bot.telegram.celebrateMilestone('kindness', 100);
      await ctx.editMessageText(messages.test.milestoneMessageSent);
    } catch (error) {
      logger.error('Test milestone error', { error: error.message });
      await ctx.editMessageText(formatMessage(messages.common.failedToSend, { error: error.message }));
    }
  });
  
  bot.action('test_milestone_500', async (ctx) => {
    await ctx.answerCbQuery(messages.test.sendingMilestone);
    
    try {
      await bot.telegram.celebrateMilestone('members', 500);
      await ctx.editMessageText(messages.test.milestoneMessageSent);
    } catch (error) {
      logger.error('Test milestone error', { error: error.message });
      await ctx.editMessageText(formatMessage(messages.common.failedToSend, { error: error.message }));
    }
  });
  
  bot.action('test_stats', async (ctx) => {
    await ctx.answerCbQuery('Generating stats...');
    
    try {
      // Get some real stats
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Count posts this week (simplified)
      const [travelDocs, favorDocs] = await Promise.all([
        collections.travelPlans.get(),
        collections.favorRequests.get()
      ]);
      
      let weeklyTravels = 0;
      let weeklyFavors = 0;
      
      travelDocs.forEach(doc => {
        const createdAt = doc.data().createdAt.toDate();
        if (createdAt >= weekAgo) weeklyTravels++;
      });
      
      favorDocs.forEach(doc => {
        const createdAt = doc.data().createdAt.toDate();
        if (createdAt >= weekAgo) weeklyFavors++;
      });
      
      const statsMessage = `📊 <b>Weekly Kindness Report</b>\n\n` +
        `✈️ Travel plans shared: ${weeklyTravels}\n` +
        `📦 Favor requests: ${weeklyFavors}\n` +
        `🤝 Total acts of kindness: ${weeklyTravels + weeklyFavors}\n\n` +
        `💚 <i>"Together we're making the world kinder!"</i>\n\n` +
        `Join us: @luukyonebot\n` +
        `#weeklyStats #kindness`;
      
      await bot.telegram.sendMessage(
        config.telegram.channelId,
        statsMessage,
        { parse_mode: 'HTML' }
      );
      
      await ctx.editMessageText('✅ Weekly stats sent to channel!');
    } catch (error) {
      logger.error('Test stats error', { error: error.message });
      await ctx.editMessageText(formatMessage(messages.common.failedToSend, { error: error.message }));
    }
  });
  
  // Post Management Callbacks
  const {
    handleManagePost,
    handleCompletePost,
    handleCancelPost,
    confirmCompletePost,
    confirmCancelPost,
    handleBackToPosts
  } = require('../commands/myposts');
  
  // Handle manage post callback
  bot.action(/^manage_post_(.+)_(.+)$/, async (ctx) => {
    const type = ctx.match[1];
    const postId = ctx.match[2];
    await handleManagePost(ctx, type, postId);
  });
  
  // Handle complete post callback
  bot.action(/^complete_post_(.+)_(.+)$/, async (ctx) => {
    const type = ctx.match[1];
    const postId = ctx.match[2];
    await handleCompletePost(ctx, type, postId);
  });
  
  // Handle cancel post callback
  bot.action(/^cancel_post_(.+)_(.+)$/, async (ctx) => {
    const type = ctx.match[1];
    const postId = ctx.match[2];
    await handleCancelPost(ctx, type, postId);
  });
  
  // Handle confirm complete callback
  bot.action(/^confirm_complete_(.+)_(.+)$/, async (ctx) => {
    const type = ctx.match[1];
    const postId = ctx.match[2];
    await confirmCompletePost(ctx, type, postId);
  });
  
  // Handle confirm cancel callback
  bot.action(/^confirm_cancel_(.+)_(.+)$/, async (ctx) => {
    const type = ctx.match[1];
    const postId = ctx.match[2];
    await confirmCancelPost(ctx, type, postId);
  });
  
  // Handle back to posts list
  bot.action('back_to_posts', async (ctx) => {
    await handleBackToPosts(ctx);
  });
  
  // Test daily summary callbacks
  bot.action('test_morning_summary', async (ctx) => {
    await ctx.answerCbQuery();
    const { testDailySummary } = require('../utils/scheduler');
    
    try {
      await testDailySummary(bot, false);
      await ctx.editMessageText('✅ Morning summary sent to channel!');
    } catch (error) {
      logger.error('Test morning summary error', { error: error.message });
      await ctx.editMessageText(formatMessage(messages.common.failedToSend, { error: error.message }));
    }
  });
  
  bot.action('test_evening_summary', async (ctx) => {
    await ctx.answerCbQuery();
    const { testDailySummary } = require('../utils/scheduler');
    
    try {
      await testDailySummary(bot, true);
      await ctx.editMessageText('✅ Evening summary sent to channel!');
    } catch (error) {
      logger.error('Test evening summary error', { error: error.message });
      await ctx.editMessageText(formatMessage(messages.common.failedToSend, { error: error.message }));
    }
  });
};

module.exports = setupCallbacks;