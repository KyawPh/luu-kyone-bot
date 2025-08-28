const { collections } = require('../config/firebase');
const { mainMenu } = require('../utils/keyboards');
const { canCreatePost } = require('../utils/helpers');
const { LIMITS } = require('../config/constants');

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
        
        // Send welcome message for new user
        await ctx.reply(
          `🎉 <b>Welcome to Luu Kyone</b>, ${userName}!\n\n` +
          `<b>Luu Kyone</b> ("လူကြုံ" in Myanmar) is a <b>kindness-based platform</b> connecting travelers with people who need personal favors.\n\n` +
          `🤝 <i>Neighbors helping neighbors across borders</i>\n\n` +
          `<b>Routes:</b> Singapore 🇸🇬 ↔ Bangkok 🇹🇭 ↔ Yangon 🇲🇲\n\n` +
          `✈️ <b>Traveling?</b> Share kindness by helping others\n` +
          `📦 <b>Need help?</b> Find kind travelers on your route\n\n` +
          `💚 <i>"A small act of kindness can make a big difference"</i>\n\n` +
          `Let's help each other! What would you like to do?`,
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
          `Welcome back, ${userName}! 👋\n\n` +
          `💚 <i>"Kindness is a language everyone understands"</i>\n\n` +
          `<b>Your kindness journey:</b>\n` +
          `📊 Posts this month: ${postCount}/${user.isPremium ? LIMITS.premium.postsPerMonth : LIMITS.free.postsPerMonth}\n` +
          `${user.completedFavors > 0 ? `🤝 Kindness shared: ${user.completedFavors} times\n` : `🌱 Ready to share your first act of kindness?\n`}\n` +
          `Let's spread kindness across borders today!`,
          { 
            parse_mode: 'HTML',
            ...mainMenu()
          }
        );
      }
    } catch (error) {
      console.error('Start command error:', error);
      ctx.reply('❌ An error occurred. Please try again.');
    }
  });
  
  // Help command
  bot.command('help', async (ctx) => {
    const helpMessage = `
📚 <b>How to Use Luu Kyone Bot</b>

<b>For Travelers:</b>
1. Use /travel to share your travel plan
2. Specify your route and dates
3. Select categories you can help with
4. Get connected with people needing favors

<b>For Requesters:</b>
1. Use /favor to request help
2. Specify destination and urgency
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
      console.error('Travel command error:', error);
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
      console.error('Favor command error:', error);
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
      
      await ctx.reply(message, { parse_mode: 'HTML' });
    } catch (error) {
      console.error('Browse command error:', error);
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
      console.error('Profile command error:', error);
      ctx.reply('❌ An error occurred. Please try again.');
    }
  });
  
  // Cancel command
  bot.command('cancel', async (ctx) => {
    if (ctx.scene) {
      ctx.scene.leave();
    }
    await ctx.reply('❌ Operation cancelled.', mainMenu());
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
      console.error('Test command error:', error);
      ctx.reply('❌ Error accessing test menu.');
    }
  });
};

module.exports = setupCommands;