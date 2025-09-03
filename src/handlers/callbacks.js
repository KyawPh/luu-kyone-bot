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
    const userId = ctx.from.id.toString();
    
    try {
      // Re-check if user has joined the channel
      const isMember = await checkChannelMembership(bot, userId, config.telegram.channelId);
      logEvent.membershipChecked(userId, isMember);
      
      if (!isMember) {
        // Still not a member - show alert
        await ctx.answerCbQuery(messages.callbacks.pleaseJoinFirst, { show_alert: true });
        return;
      }
      
      // User has joined! Use shared handler to show appropriate welcome
      const { handleStart } = require('./sharedHandlers');
      await handleStart(ctx, true, bot, true);
      
    } catch (error) {
      await ctx.answerCbQuery();
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
  
  // Content Calendar Callbacks
  // Handle content posting from browse
  bot.action(/^post_content_(\d+)$/, async (ctx) => {
    const rowIndex = parseInt(ctx.match[1]);
    await ctx.answerCbQuery('Posting content...');
    
    try {
      const { contentScheduler } = require('../utils/contentScheduler');
      contentScheduler.setBot(bot);
      
      // Get content details
      const content = await contentScheduler.getContentByRowIndex(rowIndex);
      
      if (!content) {
        return ctx.editMessageText('❌ Content not found in sheet');
      }
      
      // Show preview with confirm/cancel buttons
      let preview = `📝 <b>Content Preview</b>\n\n`;
      preview += `<b>Date:</b> ${content.date}\n`;
      preview += `<b>Time:</b> ${content.time}\n`;
      preview += `<b>Type:</b> ${content.type}\n`;
      preview += `<b>Title:</b> ${content.title || 'No title'}\n`;
      preview += `<b>Status:</b> ${content.status}\n`;
      preview += `<b>Author:</b> ${content.author}\n\n`;
      preview += `<b>Message:</b>\n${content.message?.substring(0, 500)}${content.message?.length > 500 ? '...' : ''}\n\n`;
      preview += `Post this content now?`;
      
      await ctx.editMessageText(preview, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Post Now', callback_data: `confirm_post_${rowIndex}` },
              { text: '❌ Cancel', callback_data: 'cancel_post' }
            ]
          ]
        }
      });
    } catch (error) {
      logger.error('Post content preview error', { error: error.message });
      ctx.editMessageText('❌ Error loading content preview');
    }
  });
  
  // Confirm posting content
  bot.action(/^confirm_post_(\d+)$/, async (ctx) => {
    const rowIndex = parseInt(ctx.match[1]);
    await ctx.answerCbQuery('Posting to channel...');
    
    try {
      const { contentScheduler } = require('../utils/contentScheduler');
      contentScheduler.setBot(bot);
      
      const success = await contentScheduler.postContentManually(rowIndex);
      
      if (success) {
        await ctx.editMessageText('✅ Content posted successfully!');
      } else {
        await ctx.editMessageText('❌ Failed to post content. Check logs for details.');
      }
    } catch (error) {
      logger.error('Confirm post error', { error: error.message });
      ctx.editMessageText('❌ Error posting content');
    }
  });
  
  // Cancel posting
  bot.action('cancel_post', async (ctx) => {
    await ctx.answerCbQuery('Cancelled');
    await ctx.editMessageText('❌ Posting cancelled');
  });
  
  // Refresh content list
  bot.action('refresh_content_list', async (ctx) => {
    await ctx.answerCbQuery('Refreshing...');
    
    try {
      const { googleSheets } = require('../utils/googleSheets');
      const allContent = await googleSheets.getAllContent();
      
      if (allContent.length === 0) {
        return ctx.editMessageText('📭 No content found in Google Sheets');
      }
      
      // Group by status
      const draft = allContent.filter(c => c.status === 'draft');
      const approved = allContent.filter(c => c.status === 'approved');
      const published = allContent.filter(c => c.status === 'published');
      
      // Create inline keyboard with first 10 unpublished items
      const unpublished = [...draft, ...approved].slice(0, 10);
      const keyboard = {
        inline_keyboard: unpublished.map(item => [{
          text: `${item.date} - ${item.title || 'Untitled'} (${item.status})`,
          callback_data: `post_content_${item.rowIndex}`
        }])
      };
      
      // Add navigation
      keyboard.inline_keyboard.push([
        { text: '🔄 Refresh', callback_data: 'refresh_content_list' },
        { text: '❌ Close', callback_data: 'close_content_browser' }
      ]);
      
      const message = `📚 <b>Content Browser</b>\n\n` +
        `📝 Draft: ${draft.length}\n` +
        `✅ Approved: ${approved.length}\n` +
        `📤 Published: ${published.length}\n` +
        `━━━━━━━━━━━━━━━\n` +
        `<b>Select content to post:</b>`;
      
      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
    } catch (error) {
      logger.error('Refresh content list error', { error: error.message });
      ctx.editMessageText('❌ Error refreshing content list');
    }
  });
  
  // Close content browser
  bot.action('close_content_browser', async (ctx) => {
    await ctx.answerCbQuery('Closed');
    await ctx.deleteMessage();
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