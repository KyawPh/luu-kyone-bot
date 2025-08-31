const cron = require('node-cron');
const { collections, db } = require('../config/firebase');
const { formatRoute, formatDate, userWantsDailySummary } = require('./helpers');
const { messages, formatMessage } = require('../config/messages');
const { logger, logEvent } = require('./logger');
const { CITIES } = require('../config/constants');
const { config } = require('../config');

// Create daily summary message
async function createDailySummary(isEvening = false) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    // Fetch all active posts
    const [travelPlansSnapshot, favorRequests] = await Promise.all([
      collections.travelPlans
        .where('status', '==', 'active')
        .orderBy('departureDate', 'asc')
        .limit(15) // Get extra to account for filtering
        .get(),
      collections.favorRequests
        .where('status', '==', 'active')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get()
    ]);
    
    // Filter out travel plans with past departure dates
    const travelPlans = travelPlansSnapshot.docs.filter(doc => {
      const plan = doc.data();
      const departureDate = plan.departureDate.toDate ? plan.departureDate.toDate() : plan.departureDate;
      return departureDate >= today; // Only include future or today's travels
    });
    
    const travelCount = travelPlans.length;
    const favorCount = favorRequests.size;
    
    // If no active posts
    if (travelCount === 0 && favorCount === 0) {
      const msgType = isEvening ? 'evening' : 'morning';
      return messages.channel.dailySummary[msgType].title + '\n\n' +
             messages.channel.dailySummary[msgType].noActive + '\n\n' +
             messages.channel.dailySummary[msgType].footer;
    }
    
    // Build summary message
    const msgType = isEvening ? 'evening' : 'morning';
    let summaryMessage = messages.channel.dailySummary[msgType].title + '\n' +
                         messages.channel.dailySummary[msgType].subtitle + '\n\n';
    
    // Add travel plans section
    if (travelCount > 0) {
      summaryMessage += formatMessage(messages.channel.dailySummary[msgType].travelCount, { 
        count: travelCount 
      }) + '\n';
      
      let travelList = '';
      travelPlans.slice(0, 10).forEach(doc => { // Limit to 10 for display
        const plan = doc.data();
        const route = formatRoute(plan.fromCity, plan.toCity);
        const date = formatDate(plan.departureDate.toDate ? plan.departureDate.toDate() : plan.departureDate);
        travelList += `• ${route} (${date})\n`;
      });
      summaryMessage += travelList + '\n';
    }
    
    // Add favor requests section
    if (favorCount > 0) {
      summaryMessage += formatMessage(messages.channel.dailySummary[msgType].favorCount, { 
        count: favorCount 
      }) + '\n';
      
      let favorList = '';
      favorRequests.forEach(doc => {
        const request = doc.data();
        const route = formatRoute(request.fromCity, request.toCity);
        const urgency = request.urgency === 'urgent' ? '🚨' : 
                       request.urgency === 'normal' ? '⏰' : '😌';
        favorList += `• ${route} ${urgency}\n`;
      });
      summaryMessage += favorList + '\n';
    }
    
    summaryMessage += messages.channel.dailySummary[msgType].footer;
    
    return summaryMessage;
    
  } catch (error) {
    logger.error('Error creating daily summary', { 
      error: error.message,
      isEvening 
    });
    return null;
  }
}

// Send summary to channel and users who have it enabled
async function sendDailySummary(bot, isEvening = false) {
  try {
    const summaryMessage = await createDailySummary(isEvening);
    
    if (!summaryMessage) {
      logger.warn('No summary message generated');
      return;
    }
    
    // Send to channel (always)
    await bot.telegram.sendMessage(
      config.telegram.channelId,
      summaryMessage,
      { parse_mode: 'HTML' }
    );
    
    // Send to users who have daily summaries enabled
    const usersSnapshot = await collections.users.get();
    let sentCount = 0;
    let skippedCount = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const wantsSummary = await userWantsDailySummary(userId, collections);
      
      // Check if user wants daily summaries
      if (wantsSummary) {
        try {
          await bot.telegram.sendMessage(
            userId,
            '📊 ' + summaryMessage,
            { parse_mode: 'HTML' }
          );
          sentCount++;
        } catch (error) {
          // User might have blocked bot or deleted account
          logger.debug('Could not send summary to user', { userId, error: error.message });
        }
      } else {
        skippedCount++;
      }
    }
    
    logEvent.channelMessageSent(isEvening ? 'evening_summary' : 'morning_summary');
    logger.info('Daily summary sent', { 
      type: isEvening ? 'evening' : 'morning',
      channelSent: true,
      usersSent: sentCount,
      usersSkipped: skippedCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error sending daily summary', { 
      error: error.message,
      isEvening 
    });
  }
}

// Clean up expired posts
async function cleanupExpiredPosts() {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const batch = db.batch();
    let expiredCount = 0;
    
    // Update expired travel plans (departure date has passed - check against start of today)
    const expiredTravels = await collections.travelPlans
      .where('status', '==', 'active')
      .where('departureDate', '<', today)
      .get();
    
    expiredTravels.forEach(doc => {
      batch.update(doc.ref, { 
        status: 'expired',
        expiredAt: now,
        expiredReason: 'departure_passed'
      });
      expiredCount++;
    });
    
    // Update urgent favor requests (older than 7 days)
    const urgentFavors = await collections.favorRequests
      .where('status', '==', 'active')
      .where('urgency', '==', 'urgent')
      .where('createdAt', '<', sevenDaysAgo)
      .get();
    
    urgentFavors.forEach(doc => {
      batch.update(doc.ref, { 
        status: 'expired',
        expiredAt: now,
        expiredReason: 'urgency_timeout'
      });
      expiredCount++;
    });
    
    // Update normal favor requests (older than 14 days)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const normalFavors = await collections.favorRequests
      .where('status', '==', 'active')
      .where('urgency', '==', 'normal')
      .where('createdAt', '<', fourteenDaysAgo)
      .get();
    
    normalFavors.forEach(doc => {
      batch.update(doc.ref, { 
        status: 'expired',
        expiredAt: now,
        expiredReason: 'normal_timeout'
      });
      expiredCount++;
    });
    
    // Update flexible favor requests (older than 30 days)
    const flexibleFavors = await collections.favorRequests
      .where('status', '==', 'active')
      .where('urgency', '==', 'flexible')
      .where('createdAt', '<', thirtyDaysAgo)
      .get();
    
    flexibleFavors.forEach(doc => {
      batch.update(doc.ref, { 
        status: 'expired',
        expiredAt: now,
        expiredReason: 'flexible_timeout'
      });
      expiredCount++;
    });
    
    if (expiredCount > 0) {
      await batch.commit();
      logger.info('Expired posts cleaned up', { 
        count: expiredCount,
        breakdown: {
          travels: expiredTravels.size,
          urgentFavors: urgentFavors.size,
          normalFavors: normalFavors.size,
          flexibleFavors: flexibleFavors.size
        }
      });
    }
    
  } catch (error) {
    logger.error('Error cleaning up expired posts', { 
      error: error.message 
    });
  }
}

// Send how-to-use reminder to channel
async function sendHowToUseReminder(bot) {
  try {
    const messages = [
      `📚 <b>How to Use Luu Kyone</b>\n\n✈️ <b>For Travelers:</b>\n1. Open @luukyonebot\n2. Click "✈️ ခရီးစဥ်" (Travel)\n3. Select your route & date\n4. Choose what you can help with\n5. Your post appears here!\n\n📦 <b>For Senders:</b>\n1. Open @luukyonebot\n2. Click "📦 ပါဆယ်" (Package)\n3. Select route & urgency\n4. Specify item details\n5. Wait for travelers to comment!\n\n💬 <b>To Connect:</b> Comment on any post\n\n#HowToUse #LuuKyone`,
      
      `🎯 <b>Quick Start Guide</b>\n\n<b>See a post you can help with?</b>\n→ Comment below the post\n→ Post owner will be notified\n→ Connect directly to arrange\n\n<b>Want to post your own?</b>\n→ @luukyonebot is your starting point\n→ Choose Travel or Package\n→ Fill in simple details\n→ Post appears here instantly!\n\n✅ FREE | ✅ SAFE | ✅ EASY\n\n#QuickStart #Tutorial`,
      
      `💡 <b>Did You Know?</b>\n\nYou can help someone today!\n\n• Traveling soon? Check @luukyonebot for requests on your route\n• Need something delivered? Post at @luukyonebot\n• See a post here? Comment to connect!\n\nEvery small act of kindness matters 💚\n\n#DidYouKnow #CommunityTips`
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    await bot.telegram.sendMessage(
      config.telegram.channelId,
      randomMessage,
      { parse_mode: 'HTML' }
    );
    
    logger.info('How-to-use reminder sent to channel');
  } catch (error) {
    logger.error('Error sending how-to-use reminder', { error: error.message });
  }
}

// Setup all scheduled jobs
function setupScheduledJobs(bot) {
  try {
    // Morning summary at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
      logger.info('Running morning summary job');
      await sendDailySummary(bot, false);
    }, {
      timezone: config.bot.timezone
    });
    
    // Evening summary at 6:00 PM
    cron.schedule('0 18 * * *', async () => {
      logger.info('Running evening summary job');
      await sendDailySummary(bot, true);
    }, {
      timezone: config.bot.timezone
    });
    
    // How-to-use reminder at 12:00 PM (noon) daily
    cron.schedule('0 12 * * *', async () => {
      logger.info('Running how-to-use reminder job');
      await sendHowToUseReminder(bot);
    }, {
      timezone: config.bot.timezone
    });
    
    // Weekly engagement reminder on Mondays at 10:00 AM
    cron.schedule('0 10 * * 1', async () => {
      logger.info('Running weekly engagement reminder');
      const message = `🎉 <b>Weekly Challenge!</b>\n\nThis week, let's aim for:\n• 100+ acts of kindness\n• 50+ new connections\n• 20+ successful deliveries\n\nEvery journey starts with a single step.\nEvery kindness starts with YOU!\n\n👉 Start now: @luukyonebot\n\n#WeeklyChallenge #MondayMotivation #LuuKyone`;
      
      await bot.telegram.sendMessage(
        config.telegram.channelId,
        message,
        { parse_mode: 'HTML' }
      );
    }, {
      timezone: config.bot.timezone
    });
    
    // Daily cleanup at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      logger.info('Running daily cleanup job');
      await cleanupExpiredPosts();
    }, {
      timezone: 'Asia/Singapore'
    });
    
    logger.info('Scheduled jobs setup complete', {
      jobs: [
        'morning_summary', 
        'evening_summary', 
        'how_to_use_reminder',
        'weekly_engagement',
        'daily_cleanup'
      ]
    });
    
  } catch (error) {
    logger.error('Error setting up scheduled jobs', { 
      error: error.message 
    });
  }
}

// Manual trigger for testing
async function testDailySummary(bot, isEvening = false) {
  await sendDailySummary(bot, isEvening);
}

module.exports = {
  setupScheduledJobs,
  sendDailySummary,
  testDailySummary,
  cleanupExpiredPosts
};