const { collections } = require('../config/firebase');
const { mainMenu, contactButton } = require('../utils/keyboards');
const { escapeHtml, getMonthlyPostCount, formatRoute, formatDate } = require('../utils/helpers');
const { LIMITS } = require('../config/constants');
const { logger, logEvent } = require('../utils/logger');

const setupCallbacks = (bot) => {
  // Check membership callback
  bot.action('check_membership', async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from.id.toString();
    const userName = ctx.from.first_name;
    
    try {
      // Re-check if user has joined the channel
      let isMember = false;
      try {
        const chatMember = await bot.telegram.getChatMember(process.env.FREE_CHANNEL_ID, userId);
        isMember = ['member', 'administrator', 'creator'].includes(chatMember.status);
        logEvent.membershipChecked(userId, isMember);
      } catch (error) {
        logger.error('Error checking membership', { error: error.message, userId });
        logEvent.telegramError('getChatMember', error);
      }
      
      if (!isMember) {
        // Still not a member
        return ctx.reply(
          '❌ You haven\'t joined the channel yet.\n\n' +
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
          `🎉 <b>Welcome to our Kindness Community!</b>\n\n` +
          `${userName}, you're now part of something special! 💚\n\n` +
          `Every day, our members share acts of kindness across borders:\n\n` +
          `✈️ <b>Traveling soon?</b>\n` +
          `Turn your empty luggage space into someone's happiness\n\n` +
          `📦 <b>Need a favor?</b>\n` +
          `Our kind travelers are ready to help!\n\n` +
          `<i>"A single act of kindness can change someone's entire day"</i>\n\n` +
          `Let's spread kindness together! 🤝`,
          { parse_mode: 'HTML' }
        );
      } else {
        // Update existing user
        await collections.users.doc(userId).update({
          lastActive: new Date(),
          isChannelMember: true
        });
        
        await ctx.editMessageText(
          `✅ <b>Welcome back to the kindness network!</b>\n\n` +
          `${userName}, great to see you again! 🤗\n\n` +
          `Our community is growing stronger every day.\n` +
          `Ready to share or receive kindness?\n\n` +
          `💚 <i>"Every act of kindness creates a ripple"</i>`,
          { parse_mode: 'HTML' }
        );
      }
      
      // Show main menu after a short delay
      setTimeout(() => {
        ctx.reply('How can we spread kindness today?', mainMenu());
      }, 500);
      
    } catch (error) {
      logger.error('Check membership error', { error: error.message });
      ctx.reply('❌ An error occurred. Please try /start again.');
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
        return ctx.editMessageText('📭 No active posts at the moment. Check back later!');
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
        ctx.reply('What would you like to do?', mainMenu());
      }, 500);
    } catch (error) {
      logger.error('Browse callback error', { error: error.message });
      ctx.reply('❌ An error occurred. Please try again.');
    }
  });
  
  bot.action('my_profile', async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from.id.toString();
    
    try {
      const userDoc = await collections.users.doc(userId).get();
      
      if (!userDoc.exists) {
        return ctx.reply('Please start the bot first with /start');
      }
      
      const user = userDoc.data();
      const postCount = await getMonthlyPostCount(userId, collections);
      
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
      
      await ctx.editMessageText(profileMessage, { parse_mode: 'HTML' });
      
      // Show main menu again
      setTimeout(() => {
        ctx.reply('What would you like to do?', mainMenu());
      }, 500);
    } catch (error) {
      logger.error('Profile callback error', { error: error.message });
      ctx.reply('❌ An error occurred. Please try again.');
    }
  });
  
  bot.action('help', async (ctx) => {
    await ctx.answerCbQuery();
    
    const helpMessage = `
📚 <b>How to Use Luu Kyone Bot</b>

<b>For Travelers:</b>
1. Use /travel to share your travel plan
2. Specify your route and date
3. Select categories you can help with
4. Get connected with people needing favors

<b>For Requesters:</b>
1. Use /favor to request help
2. Specify pickup and delivery locations
3. Add description and photos
4. Wait for travelers to contact you

<b>Commands:</b>
/start - Start the bot
/travel - Share travel plan
/favor - Request a favor
/browse - Browse active requests
/profile - View your profile
/help - Show this help message

<b>Limits (Free Tier):</b>
• ${LIMITS.free.postsPerMonth} posts per month
• One-time introduction only
• Community trust-based

<b>Safety Tips:</b>
✅ Meet in public places only
✅ Verify items before accepting
✅ Take photos of handover
✅ Never carry unknown packages
✅ Trust your instincts

<b>Support:</b> @luukyone_support
    `;
    
    await ctx.editMessageText(helpMessage, { 
      parse_mode: 'HTML',
      disable_web_page_preview: true 
    });
    
    // Show main menu again
    setTimeout(() => {
      ctx.reply('What would you like to do?', mainMenu());
    }, 500);
  });
  
  bot.action('settings', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '⚙️ <b>Settings</b>\n\n' +
      'To update your profile information, use:\n' +
      '/profile - View and edit profile\n\n' +
      'Premium features coming soon!',
      { parse_mode: 'HTML' }
    );
    
    // Show main menu again
    setTimeout(() => {
      ctx.reply('What would you like to do?', mainMenu());
    }, 500);
  });
  
  // Contact button handler
  bot.action(/^contact_(.+)_(.+)_(.+)$/, async (ctx) => {
    const [postType, postId, posterId] = ctx.match.slice(1);
    const requesterId = ctx.from.id.toString();
    
    await ctx.answerCbQuery('Processing your request...');
    
    try {
      // Check if it's the same user
      if (requesterId === posterId) {
        await ctx.answerCbQuery("❌ You can't contact yourself!", { show_alert: true });
        return;
      }
      
      // Get requester info
      const requesterDoc = await collections.users.doc(requesterId).get();
      if (!requesterDoc.exists) {
        await ctx.answerCbQuery('❌ Please start the bot first: @luukyonebot', { show_alert: true });
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
          "❌ You've already been introduced for this post. Free tier allows one-time introduction only.",
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
      const postTypeDisplay = postType === 'travel' ? 'Travel Plan' : 'Favor Request';
      await bot.telegram.sendMessage(
        requesterId,
        `✅ <b>Contact Information Received!</b>\n\n` +
        `You requested contact for this ${postTypeDisplay}:\n` +
        `<b>Route:</b> ${formatRoute(postData.fromCity, postData.toCity)}\n` +
        `<b>Date:</b> ${postType === 'travel' ? formatDate(postData.departureDate) : 'As arranged'}\n\n` +
        `<b>Please contact:</b>\n` +
        `👤 ${escapeHtml(poster.userName)}\n` +
        `${poster.username ? `💬 @${poster.username}` : `💬 <a href="tg://user?id=${posterId}">Click here to message</a>`}\n\n` +
        `<i>💡 Tip: Start by introducing yourself and mentioning the post ID #${postId}</i>\n\n` +
        `⚠️ <i>Note: This is a one-time introduction. Save this contact for future reference.</i>`,
        { parse_mode: 'HTML' }
      );
      
      // To poster
      try {
        const requesterTypeText = postType === 'travel' ? 'needs your help' : 'can help you';
        await bot.telegram.sendMessage(
          posterId,
          `🔔 <b>New Match for Your Post!</b>\n\n` +
          `Someone ${requesterTypeText} with:\n` +
          `<b>Route:</b> ${formatRoute(postData.fromCity, postData.toCity)}\n` +
          `<b>Post ID:</b> #${postId}\n\n` +
          `<b>Interested person:</b>\n` +
          `👤 ${escapeHtml(requester.userName)}\n` +
          `${requester.username ? `💬 @${requester.username}` : `💬 <a href="tg://user?id=${requesterId}">View profile</a>`}\n\n` +
          `They will contact you soon to discuss details.\n\n` +
          `<i>💡 If they don't reach out, you can message them first!</i>`,
          { parse_mode: 'HTML' }
        );
      } catch (error) {
        logger.error('Failed to notify poster', { error: error.message });
      }
      
    } catch (error) {
      logger.error('Contact callback error', { error: error.message });
      await ctx.answerCbQuery('❌ An error occurred. Please try again.', { show_alert: true });
    }
  });
  
  // Generic cancel callback
  bot.action('cancel', async (ctx) => {
    await ctx.answerCbQuery();
    if (ctx.scene) {
      ctx.scene.leave();
    }
    await ctx.editMessageText('❌ Operation cancelled.');
    await ctx.reply('What would you like to do?', mainMenu());
  });
  
  // Generic back callback
  bot.action('back', async (ctx) => {
    await ctx.answerCbQuery();
    // This will be handled by specific scenes
    if (!ctx.scene || !ctx.scene.current) {
      await ctx.reply('What would you like to do?', mainMenu());
    }
  });
  
  // Test channel callbacks
  bot.action('test_welcome', async (ctx) => {
    await ctx.answerCbQuery('Sending test welcome message...');
    
    try {
      const welcomeMessages = [
        `💚 Welcome to our kindness family!\n\n"Your journey of a thousand acts of kindness begins with a single favor."\n\nReady to help? Start here: @luukyonebot`,
        `🤝 Another kind soul joins us!\n\n"Together we're building bridges of kindness across cities."\n\nShare your journey: @luukyonebot`,
        `✨ Welcome, neighbor!\n\n"Every new member makes our community stronger and kinder."\n\nBegin spreading joy: @luukyonebot`,
        `🌟 So happy you're here!\n\n"In a world where you can be anything, you chose to be kind."\n\nStart your kindness story: @luukyonebot`
      ];
      
      const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
      
      await bot.telegram.sendMessage(
        process.env.FREE_CHANNEL_ID,
        `🧪 TEST WELCOME MESSAGE\n\n${randomMessage}\n\n` +
        `#WelcomeWednesday #LuuKyoneFamily #KindnessInAction`,
        { parse_mode: 'HTML' }
      );
      
      await ctx.editMessageText('✅ Test welcome message sent to channel!');
    } catch (error) {
      logger.error('Test welcome error', { error: error.message });
      await ctx.editMessageText(`❌ Failed to send: ${error.message}\n\n⚠️ Make sure bot is admin in channel!`);
    }
  });
  
  bot.action('test_quote', async (ctx) => {
    await ctx.answerCbQuery('Sending daily quote...');
    
    try {
      await bot.telegram.sendDailyQuote();
      await ctx.editMessageText('✅ Daily quote sent to channel!');
    } catch (error) {
      logger.error('Test quote error', { error: error.message });
      await ctx.editMessageText(`❌ Failed to send: ${error.message}`);
    }
  });
  
  bot.action('test_milestone_100', async (ctx) => {
    await ctx.answerCbQuery('Sending milestone celebration...');
    
    try {
      await bot.telegram.celebrateMilestone('kindness', 100);
      await ctx.editMessageText('✅ Milestone celebration sent to channel!');
    } catch (error) {
      logger.error('Test milestone error', { error: error.message });
      await ctx.editMessageText(`❌ Failed to send: ${error.message}`);
    }
  });
  
  bot.action('test_milestone_500', async (ctx) => {
    await ctx.answerCbQuery('Sending milestone celebration...');
    
    try {
      await bot.telegram.celebrateMilestone('members', 500);
      await ctx.editMessageText('✅ Member milestone sent to channel!');
    } catch (error) {
      logger.error('Test milestone error', { error: error.message });
      await ctx.editMessageText(`❌ Failed to send: ${error.message}`);
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
        process.env.FREE_CHANNEL_ID,
        statsMessage,
        { parse_mode: 'HTML' }
      );
      
      await ctx.editMessageText('✅ Weekly stats sent to channel!');
    } catch (error) {
      logger.error('Test stats error', { error: error.message });
      await ctx.editMessageText(`❌ Failed to send: ${error.message}`);
    }
  });
};

module.exports = setupCallbacks;