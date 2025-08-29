const cron = require('node-cron');
const { collections } = require('../config/firebase');
const { formatRoute, formatDate } = require('./helpers');
const { messages, formatMessage } = require('../config/messages');
const { logger, logEvent } = require('./logger');
const { CITIES } = require('../config/constants');

// Create daily summary message
async function createDailySummary(isEvening = false) {
  try {
    // Fetch all active posts
    const [travelPlans, favorRequests] = await Promise.all([
      collections.travelPlans
        .where('status', '==', 'active')
        .orderBy('departureDate', 'asc')
        .limit(10)
        .get(),
      collections.favorRequests
        .where('status', '==', 'active')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get()
    ]);
    
    const travelCount = travelPlans.size;
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
      travelPlans.forEach(doc => {
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

// Send summary to channel
async function sendDailySummary(bot, isEvening = false) {
  try {
    const summaryMessage = await createDailySummary(isEvening);
    
    if (!summaryMessage) {
      logger.warn('No summary message generated');
      return;
    }
    
    // Send to channel
    await bot.telegram.sendMessage(
      process.env.FREE_CHANNEL_ID,
      summaryMessage,
      { parse_mode: 'HTML' }
    );
    
    logEvent.channelMessageSent(isEvening ? 'evening_summary' : 'morning_summary');
    logger.info('Daily summary sent to channel', { 
      type: isEvening ? 'evening' : 'morning',
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
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Update expired travel plans
    const expiredTravels = await collections.travelPlans
      .where('status', '==', 'active')
      .where('departureDate', '<', thirtyDaysAgo)
      .get();
    
    const batch = collections.db.batch();
    let expiredCount = 0;
    
    expiredTravels.forEach(doc => {
      batch.update(doc.ref, { 
        status: 'expired',
        expiredAt: now 
      });
      expiredCount++;
    });
    
    // Update old favor requests (older than 30 days)
    const oldFavors = await collections.favorRequests
      .where('status', '==', 'active')
      .where('createdAt', '<', thirtyDaysAgo)
      .get();
    
    oldFavors.forEach(doc => {
      batch.update(doc.ref, { 
        status: 'expired',
        expiredAt: now 
      });
      expiredCount++;
    });
    
    if (expiredCount > 0) {
      await batch.commit();
      logger.info('Expired posts cleaned up', { count: expiredCount });
    }
    
  } catch (error) {
    logger.error('Error cleaning up expired posts', { 
      error: error.message 
    });
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
      timezone: 'Asia/Singapore' // Adjust timezone as needed
    });
    
    // Evening summary at 6:00 PM
    cron.schedule('0 18 * * *', async () => {
      logger.info('Running evening summary job');
      await sendDailySummary(bot, true);
    }, {
      timezone: 'Asia/Singapore' // Adjust timezone as needed
    });
    
    // Daily cleanup at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      logger.info('Running daily cleanup job');
      await cleanupExpiredPosts();
    }, {
      timezone: 'Asia/Singapore'
    });
    
    logger.info('Scheduled jobs setup complete', {
      jobs: ['morning_summary', 'evening_summary', 'daily_cleanup']
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