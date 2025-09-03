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
    const { handleStart } = require('./sharedHandlers');
    await handleStart(ctx, false, bot);
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
    const { handleBrowse } = require('./sharedHandlers');
    await handleBrowse(ctx, false);
  });
  
  // Settings command
  bot.command('settings', async (ctx) => {
    const { handleSettings } = require('./sharedHandlers');
    await handleSettings(ctx, false);
  });
  
  // Profile command
  bot.command('profile', async (ctx) => {
    const { handleProfile } = require('./sharedHandlers');
    await handleProfile(ctx, false);
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

  // Test comment handler (admin only)
  bot.command('test_comment_handler', async (ctx) => {
    const userId = ctx.from.id.toString();
    
    // Check if user is admin
    if (!isAdmin(userId, config.telegram.adminIds)) {
      return ctx.reply(messages.admin.accessDenied);
    }
    
    try {
      // Check if channel handlers are registered
      const handlersInfo = {
        channelId: config.telegram.channelId,
        botUsername: ctx.botInfo?.username,
        timestamp: new Date().toISOString()
      };
      
      logger.info('🧪 TEST: Comment handler check initiated', handlersInfo);
      
      await ctx.reply(
        `🧪 <b>Comment Handler Test</b>\n\n` +
        `✅ Handler is registered\n` +
        `📢 Channel: ${config.telegram.channelId}\n` +
        `💬 Discussion Group: ${config.telegram.discussionGroupId || '❌ Not configured'}\n` +
        `🤖 Bot: @${ctx.botInfo?.username}\n\n` +
        `<b>Status:</b>\n` +
        `${config.telegram.discussionGroupId ? 
          '✅ Discussion group configured - comments will be detected' : 
          '⚠️ Discussion group NOT configured - comments won\'t work!'}\n\n` +
        `<b>To test:</b>\n` +
        `1. Post something in the channel\n` +
        `2. Reply to that post (comment)\n` +
        `3. Check logs in Railway\n\n` +
        `Logs will show "📨 Channel post event received"`,
        { parse_mode: 'HTML' }
      );
      
      // Also log to Railway
      logger.info('Comment handler test completed', handlersInfo);
      
    } catch (error) {
      logger.error('Test comment handler error', { error: error.message });
      ctx.reply('❌ Test failed: ' + error.message);
    }
  });

  // Content calendar commands (admin only)
  bot.command('content_today', async (ctx) => {
    const userId = ctx.from.id.toString();
    
    if (!isAdmin(userId, config.telegram.adminIds)) {
      return ctx.reply(messages.admin.adminOnly);
    }
    
    try {
      const { googleSheets } = require('../utils/googleSheets');
      const { contentScheduler } = require('../utils/contentScheduler');
      
      // Check if Google Sheets is initialized
      if (!googleSheets.initialized) {
        return ctx.reply(
          '⚠️ Google Sheets content calendar is not available\n\n' +
          'Possible reasons:\n' +
          '1. Google Sheets API not enabled\n' +
          '2. Sheet not shared with service account\n' +
          '3. GOOGLE_SHEETS_ID not configured\n\n' +
          'Check logs for details.'
        );
      }
      
      // Get today's content
      const todayContent = await googleSheets.getTodayContent();
      
      if (todayContent.length === 0) {
        return ctx.reply('📅 No content scheduled for today');
      }
      
      // Get currently scheduled items
      const scheduled = contentScheduler.getScheduledContent();
      
      let message = '📅 <b>Today\'s Content Calendar</b>\n\n';
      
      // Show scheduled content
      if (scheduled.length > 0) {
        message += '<b>Currently Scheduled:</b>\n';
        scheduled.forEach(item => {
          message += `• ${item.time} - ${item.title} (${item.type})\n`;
        });
        message += '\n';
      }
      
      // Show all today's content
      message += '<b>All Today\'s Content:</b>\n';
      todayContent.forEach(item => {
        const statusEmoji = item.status === 'published' ? '✅' : 
                          item.status === 'approved' ? '⏰' : '📝';
        message += `${statusEmoji} ${item.time} - ${item.title}\n`;
        message += `   Type: ${item.type}, Author: ${item.author || 'Unknown'}\n`;
      });
      
      await ctx.reply(message, { parse_mode: 'HTML' });
    } catch (error) {
      logger.error('Content today command error', { error: error.message });
      ctx.reply('❌ Error fetching content calendar');
    }
  });
  
  bot.command('content_refresh', async (ctx) => {
    const userId = ctx.from.id.toString();
    
    if (!isAdmin(userId, config.telegram.adminIds)) {
      return ctx.reply(messages.admin.adminOnly);
    }
    
    try {
      await ctx.reply('🔄 Refreshing content calendar...');
      
      const { loadContentCalendar } = require('../utils/scheduler');
      const count = await loadContentCalendar(bot);
      
      if (count > 0) {
        await ctx.reply(`✅ Content calendar refreshed!\n${count} items scheduled for today.`);
      } else {
        await ctx.reply('📅 No content to schedule for today');
      }
    } catch (error) {
      logger.error('Content refresh error', { error: error.message });
      ctx.reply('❌ Error refreshing content calendar');
    }
  });
  
  bot.command('content_test', async (ctx) => {
    const userId = ctx.from.id.toString();
    
    if (!isAdmin(userId, config.telegram.adminIds)) {
      return ctx.reply(messages.admin.adminOnly);
    }
    
    try {
      // Get row index from command (e.g., /content_test 5)
      const args = ctx.message.text.split(' ');
      if (args.length < 2) {
        return ctx.reply('Usage: /content_test <row_number>');
      }
      
      const rowIndex = parseInt(args[1]);
      if (isNaN(rowIndex)) {
        return ctx.reply('Invalid row number. Usage: /content_test <row_number>');
      }
      
      const { contentScheduler } = require('../utils/contentScheduler');
      contentScheduler.setBot(bot);
      
      const success = await contentScheduler.postContentManually(rowIndex);
      
      if (success) {
        await ctx.reply('✅ Content posted successfully!');
      } else {
        await ctx.reply('❌ Failed to post content. Check logs for details.');
      }
    } catch (error) {
      logger.error('Content test error', { error: error.message });
      ctx.reply('❌ Error testing content post');
    }
  });
  
  // Browse all content in Google Sheets
  bot.command('content_browse', async (ctx) => {
    const userId = ctx.from.id.toString();
    
    if (!isAdmin(userId, config.telegram.adminIds)) {
      return ctx.reply(messages.admin.adminOnly);
    }
    
    try {
      const { googleSheets } = require('../utils/googleSheets');
      const allContent = await googleSheets.getAllContent();
      
      if (allContent.length === 0) {
        return ctx.reply('📭 No content found in Google Sheets');
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
      
      await ctx.reply(message, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
    } catch (error) {
      logger.error('Content browse error', { error: error.message });
      ctx.reply('❌ Error browsing content');
    }
  });
  
  // Post content for specific date
  bot.command('content_date', async (ctx) => {
    const userId = ctx.from.id.toString();
    
    if (!isAdmin(userId, config.telegram.adminIds)) {
      return ctx.reply(messages.admin.adminOnly);
    }
    
    try {
      const args = ctx.message.text.split(' ');
      if (args.length < 2) {
        return ctx.reply('Usage: /content_date MM/DD/YYYY');
      }
      
      const dateStr = args[1];
      const dateParts = dateStr.split('/');
      if (dateParts.length !== 3) {
        return ctx.reply('Invalid date format. Use MM/DD/YYYY');
      }
      
      const { googleSheets } = require('../utils/googleSheets');
      const { contentScheduler } = require('../utils/contentScheduler');
      const { logger } = require('../utils/logger');
      
      // Parse date - Month is 0-based in JavaScript Date
      const month = parseInt(dateParts[0]) - 1; // MM (1-12) -> 0-11
      const day = parseInt(dateParts[1]);
      const year = parseInt(dateParts[2]);
      
      logger.debug('Parsing date for content_date', {
        input: dateStr,
        parsed: { month: month + 1, day, year }
      });
      const targetDate = new Date(year, month, day);
      
      // Get content for that date
      const content = await googleSheets.getContentForDate(targetDate);
      const approvedContent = content.filter(c => c.status === 'approved');
      
      if (approvedContent.length === 0) {
        return ctx.reply(`📅 No approved content found for ${dateStr}`);
      }
      
      await ctx.reply(`📤 Posting ${approvedContent.length} items for ${dateStr}...`);
      
      contentScheduler.setBot(bot);
      const result = await contentScheduler.postMultipleContent(approvedContent);
      
      await ctx.reply(
        `✅ Batch posting completed!\n` +
        `Success: ${result.success}\n` +
        `Failed: ${result.failed}`
      );
    } catch (error) {
      logger.error('Content date error', { error: error.message });
      ctx.reply('❌ Error posting content by date');
    }
  });
  
  // Show all available row indices
  bot.command('content_rows', async (ctx) => {
    const userId = ctx.from.id.toString();
    
    if (!isAdmin(userId, config.telegram.adminIds)) {
      return ctx.reply(messages.admin.adminOnly);
    }
    
    try {
      const { googleSheets } = require('../utils/googleSheets');
      
      const allContent = await googleSheets.getAllContent();
      
      if (allContent.length === 0) {
        return ctx.reply('📭 No content found in Google Sheets');
      }
      
      let message = '📋 <b>Available Rows in Google Sheets:</b>\n\n';
      
      allContent.forEach(content => {
        const status = content.status || 'draft';
        const statusEmoji = status === 'published' ? '✅' : 
                           status === 'approved' ? '🟢' : 
                           status === 'error' ? '❌' : '📝';
        
        message += `Row ${content.rowIndex}: ${statusEmoji} ${content.title || 'Untitled'}\n`;
        message += `   Date: ${content.date}, Status: ${status}\n\n`;
      });
      
      message += `\n<i>Use /content_test [row_number] to post any row</i>`;
      
      await ctx.reply(message, { parse_mode: 'HTML' });
    } catch (error) {
      logger.error('Content rows error', { error: error.message });
      ctx.reply('❌ Error listing content rows');
    }
  });
  
  // Batch post multiple rows
  bot.command('content_batch', async (ctx) => {
    const userId = ctx.from.id.toString();
    
    if (!isAdmin(userId, config.telegram.adminIds)) {
      return ctx.reply(messages.admin.adminOnly);
    }
    
    try {
      const args = ctx.message.text.split(' ');
      if (args.length < 2) {
        return ctx.reply('Usage: /content_batch row1,row2,row3');
      }
      
      // Parse row numbers
      const rowIndices = args[1].split(',').map(r => parseInt(r.trim()));
      const validRows = rowIndices.filter(r => !isNaN(r));
      
      if (validRows.length === 0) {
        return ctx.reply('No valid row numbers provided');
      }
      
      const { googleSheets } = require('../utils/googleSheets');
      const { contentScheduler } = require('../utils/contentScheduler');
      
      // Get content for specified rows
      const content = await googleSheets.getContentByRows(validRows);
      
      if (content.length === 0) {
        return ctx.reply('No content found for specified rows');
      }
      
      await ctx.reply(`📤 Posting ${content.length} items...`);
      
      contentScheduler.setBot(bot);
      const result = await contentScheduler.postMultipleContent(content);
      
      await ctx.reply(
        `✅ Batch posting completed!\n` +
        `Success: ${result.success}\n` +
        `Failed: ${result.failed}`
      );
    } catch (error) {
      logger.error('Content batch error', { error: error.message });
      ctx.reply('❌ Error batch posting content');
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