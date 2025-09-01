const { collections } = require('../config/firebase');
const { mainMenu } = require('../utils/keyboards');
const { escapeHtml, getMonthlyPostCount, formatRoute, formatDate, checkChannelMembership, isAdmin, canCreatePost } = require('../utils/helpers');
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
          messages.callbacks.pleaseJoinFirst
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
          messages.commands.start.newUser.title + '\n\n' +
          formatMessage(messages.commands.start.newUser.greetingShort, { userName }) + '\n\n' +
          messages.commands.start.newUser.intro + '\n\n' +
          messages.commands.start.newUser.benefits.title + '\n' +
          messages.commands.start.newUser.benefits.travel + '\n' +
          messages.commands.start.newUser.benefits.favor + '\n' +
          messages.commands.start.newUser.benefits.connect + '\n\n' +
          messages.commands.start.newUser.start,
          { parse_mode: 'HTML' }
        );
      } else {
        // Update existing user
        await collections.users.doc(userId).update({
          lastActive: new Date(),
          isChannelMember: true
        });
        
        await ctx.editMessageText(
          messages.commands.start.returningUser.title + '\n\n' +
          formatMessage(messages.commands.start.returningUser.greetingShort, { userName }) + '\n\n' +
          messages.commands.start.returningUser.prompt + '\n\n' +
          messages.commands.start.returningUser.motto,
          { parse_mode: 'HTML' }
        );
      }
      
      // Show main menu after a short delay
      setTimeout(() => {
        ctx.reply(messages.common.howSpreadKindness, mainMenu());
      }, 500);
      
    } catch (error) {
      logger.error('Check membership error', { error: error.message });
      ctx.reply(messages.errors.generic + ' Please try /start again.');
    }
  });
  
  // Main menu callbacks
  bot.action('create_travel', async (ctx) => {
    const { handleTravel } = require('./sharedHandlers');
    await handleTravel(ctx, true);
  });
  
  bot.action('create_favor', async (ctx) => {
    const { handleFavor } = require('./sharedHandlers');
    await handleFavor(ctx, true);
  });
  
  bot.action('browse_requests', async (ctx) => {
    const { handleBrowse } = require('./sharedHandlers');
    await handleBrowse(ctx, true);
  });
  
  bot.action('my_profile', async (ctx) => {
    const { handleProfile } = require('./sharedHandlers');
    await handleProfile(ctx, true);
  });
  
  bot.action('help', async (ctx) => {
    const { handleHelp } = require('./sharedHandlers');
    await handleHelp(ctx, true);
  });
  
  bot.action('settings', async (ctx) => {
    const { handleSettings } = require('./sharedHandlers');
    await handleSettings(ctx, true);
  });
  
  bot.action('back_to_menu', async (ctx) => {
    const { handleBackToMenu } = require('./sharedHandlers');
    await handleBackToMenu(ctx);
  });
  
  // Contact button handler
  bot.action(/^contact_(.+)_(.+)_(.+)$/, async (ctx) => {
    const [postType, postId, posterId] = ctx.match.slice(1);
    const requesterId = ctx.from.id.toString();
    
    await ctx.answerCbQuery(messages.callbacks.processing);
    
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
      await ctx.answerCbQuery(messages.errors.generic, { show_alert: true });
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
      const welcomeMessages = messages.channelWelcome;
      
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
    await ctx.answerCbQuery(messages.callbacks.generatingStats);
    
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
      
      await ctx.editMessageText(messages.callbacks.weeklyStatsSent);
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
      await ctx.editMessageText(messages.callbacks.morningSummarySent);
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
      await ctx.editMessageText(messages.callbacks.eveningSummarySent);
    } catch (error) {
      logger.error('Test evening summary error', { error: error.message });
      await ctx.editMessageText(formatMessage(messages.common.failedToSend, { error: error.message }));
    }
  });
};

module.exports = setupCallbacks;