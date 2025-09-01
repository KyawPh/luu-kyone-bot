const { mainMenu } = require('../utils/keyboards');
const { LIMITS } = require('../config/constants');
const { messages, formatMessage } = require('../config/messages');
const { collections } = require('../config/firebase');
const { canCreatePost, checkChannelMembership } = require('../utils/helpers');
const { logger, logEvent } = require('../utils/logger');
const { config } = require('../config');

/**
 * Generates the help message content
 * @returns {string} Formatted help message
 */
const generateHelpMessage = () => {
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
    `${messages.help.commands.myposts}\n` +
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
  
  return helpMessage;
};

/**
 * Unified help handler for both command and inline button
 * @param {Context} ctx - Telegraf context
 * @param {boolean} isCallback - Whether this is from an inline button callback
 */
const handleHelp = async (ctx, isCallback = false) => {
  const helpMessage = generateHelpMessage();
  
  if (isCallback) {
    // For inline button: edit the message with back button
    await ctx.answerCbQuery();
    const { Markup } = require('telegraf');
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(messages.buttons.common.backToMenu, 'back_to_menu')]
    ]);
    await ctx.editMessageText(helpMessage, { 
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...keyboard
    });
  } else {
    // For command: send as new message
    await ctx.reply(helpMessage, { 
      parse_mode: 'HTML',
      disable_web_page_preview: true 
    });
  }
};

/**
 * Unified travel handler for both command and inline button
 * @param {Context} ctx - Telegraf context
 * @param {boolean} isCallback - Whether this is from an inline button callback
 * @param {Object} bot - Bot instance (needed for channel membership check)
 */
const handleTravel = async (ctx, isCallback = false, bot = null) => {
  const userId = ctx.from.id.toString();
  
  try {
    // For commands, check channel membership first
    if (!isCallback && bot) {
      const isMember = await checkChannelMembership(bot, userId, config.telegram.channelId);
      
      if (!isMember) {
        return ctx.reply(
          messages.errors.notMember + '\n\n' +
          messages.shared.useStartForLink
        );
      }
    }
    
    // Check if user exists
    const userDoc = await collections.users.doc(userId).get();
    if (!userDoc.exists) {
      const message = messages.common.startBotFirst;
      return isCallback ? ctx.editMessageText(message) : ctx.reply(message);
    }
    
    // Check post limit
    const postCheck = await canCreatePost(userId, userDoc.data().isPremium, collections);
    
    if (!postCheck.canCreate) {
      const limitMessage = formatMessage(messages.errors.limitReached, { limit: postCheck.limit }) + '\n' +
        `Posts used: ${postCheck.current}/${postCheck.limit}\n\n` +
        messages.shared.limitResetsNextMonth;
      
      return isCallback ? ctx.editMessageText(limitMessage) : ctx.reply(limitMessage);
    }
    
    // Enter travel scene with appropriate context
    if (isCallback) {
      await ctx.answerCbQuery();
      ctx.scene.enter('travelScene', { 
        messageToEdit: ctx.callbackQuery.message 
      });
    } else {
      ctx.scene.enter('travelScene');
    }
  } catch (error) {
    const errorContext = isCallback ? 'create_travel callback' : 'travel command';
    logEvent.commandError(errorContext, error, userId);
    logger.error(`${errorContext} error`, { error: error.message, userId });
    
    const errorMessage = messages.errors.generic;
    return isCallback ? ctx.editMessageText(errorMessage) : ctx.reply(errorMessage);
  }
};

/**
 * Unified favor handler for both command and inline button
 * @param {Context} ctx - Telegraf context
 * @param {boolean} isCallback - Whether this is from an inline button callback
 * @param {Object} bot - Bot instance (needed for channel membership check)
 */
const handleFavor = async (ctx, isCallback = false, bot = null) => {
  const userId = ctx.from.id.toString();
  
  try {
    // For commands, check channel membership first
    if (!isCallback && bot) {
      const isMember = await checkChannelMembership(bot, userId, config.telegram.channelId);
      
      if (!isMember) {
        return ctx.reply(
          messages.errors.notMember + '\n\n' +
          messages.shared.useStartForLink
        );
      }
    }
    
    // Check if user exists
    const userDoc = await collections.users.doc(userId).get();
    if (!userDoc.exists) {
      const message = messages.common.startBotFirst;
      return isCallback ? ctx.editMessageText(message) : ctx.reply(message);
    }
    
    // Check post limit
    const postCheck = await canCreatePost(userId, userDoc.data().isPremium, collections);
    
    if (!postCheck.canCreate) {
      const limitMessage = formatMessage(messages.errors.limitReached, { limit: postCheck.limit }) + '\n' +
        `Posts used: ${postCheck.current}/${postCheck.limit}\n\n` +
        messages.shared.limitResetsNextMonth;
      
      return isCallback ? ctx.editMessageText(limitMessage) : ctx.reply(limitMessage);
    }
    
    // Enter favor scene with appropriate context
    if (isCallback) {
      await ctx.answerCbQuery();
      ctx.scene.enter('favorScene', { 
        messageToEdit: ctx.callbackQuery.message 
      });
    } else {
      ctx.scene.enter('favorScene');
    }
  } catch (error) {
    const errorContext = isCallback ? 'create_favor callback' : 'favor command';
    logEvent.commandError(errorContext, error, userId);
    logger.error(`${errorContext} error`, { error: error.message, userId });
    
    const errorMessage = messages.errors.generic;
    return isCallback ? ctx.editMessageText(errorMessage) : ctx.reply(errorMessage);
  }
};

/**
 * Unified profile handler for both command and inline button
 * @param {Context} ctx - Telegraf context
 * @param {boolean} isCallback - Whether this is from an inline button callback
 */
const handleProfile = async (ctx, isCallback = false) => {
  const userId = ctx.from.id.toString();
  
  try {
    const userDoc = await collections.users.doc(userId).get();
    
    if (!userDoc.exists) {
      const message = messages.common.startBotFirst;
      return isCallback ? ctx.reply(message) : ctx.reply(message);
    }
    
    const user = userDoc.data();
    const { getMonthlyPostCount } = require('../utils/helpers');
    const postCount = await getMonthlyPostCount(userId, collections);
    
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
    
    if (isCallback) {
      await ctx.answerCbQuery();
      // Add back to menu button
      const { Markup } = require('telegraf');
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback(messages.buttons.common.backToMenu, 'back_to_menu')]
      ]);
      await ctx.editMessageText(profileMessage, { 
        parse_mode: 'HTML',
        ...keyboard
      });
    } else {
      await ctx.reply(profileMessage, { parse_mode: 'HTML' });
    }
  } catch (error) {
    const errorContext = isCallback ? 'profile callback' : 'profile command';
    logEvent.commandError(errorContext, error, userId);
    logger.error(`${errorContext} error`, { error: error.message, userId });
    ctx.reply(messages.errors.generic);
  }
};

/**
 * Unified settings handler for both command and inline button
 * @param {Context} ctx - Telegraf context
 * @param {boolean} isCallback - Whether this is from an inline button callback
 */
const handleSettings = async (ctx, isCallback = false) => {
  const userId = ctx.from.id.toString();
  logEvent.commandUsed(userId, 'settings');
  
  try {
    if (isCallback) {
      await ctx.answerCbQuery();
      // Enter the settings scene with message to edit
      ctx.scene.enter('settingsScene', { 
        messageToEdit: ctx.callbackQuery.message 
      });
    } else {
      // Enter the settings scene
      ctx.scene.enter('settingsScene');
    }
  } catch (error) {
    logger.error('Settings error', { error: error.message, userId });
    ctx.reply(messages.errors.generic);
  }
};

/**
 * Unified browse handler for both command and inline button
 * @param {Context} ctx - Telegraf context
 * @param {boolean} isCallback - Whether this is from an inline button callback
 */
const handleBrowse = async (ctx, isCallback = false) => {
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
      const noPostsMessage = messages.errors.noActivePost;
      return isCallback ? ctx.editMessageText(noPostsMessage) : ctx.reply(noPostsMessage);
    }
    
    logEvent.postsViewed(ctx.from?.id?.toString() || 'unknown', 'browse', activeTravelPlans.length + activeFavorRequests.length);
    
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
    
    if (isCallback) {
      await ctx.answerCbQuery();
      // Add back to menu button
      const { Markup } = require('telegraf');
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback(messages.buttons.common.backToMenu, 'back_to_menu')]
      ]);
      await ctx.editMessageText(message, { 
        parse_mode: 'HTML',
        ...keyboard
      });
    } else {
      await ctx.reply(message, { parse_mode: 'HTML' });
    }
  } catch (error) {
    logEvent.commandError('browse', error, ctx.from?.id?.toString() || 'unknown');
    logger.error('Browse error', { error: error.message });
    ctx.reply(messages.errors.generic);
  }
};

/**
 * Handle back to menu action
 * @param {Context} ctx - Telegraf context
 */
const handleBackToMenu = async (ctx) => {
  await ctx.answerCbQuery();
  const userName = ctx.from.first_name;
  
  // Create a welcoming message for returning to menu
  const menuMessage = [
    `👋 Hi ${userName}!`,
    '',
    '💚 What would you like to do today?',
    '',
    messages.shared.chooseOptionBelow
  ].join('\n');
  
  await ctx.editMessageText(menuMessage, {
    parse_mode: 'HTML',
    ...mainMenu()
  });
};

module.exports = {
  generateHelpMessage,
  handleHelp,
  handleTravel,
  handleFavor,
  handleProfile,
  handleSettings,
  handleBrowse,
  handleBackToMenu
};