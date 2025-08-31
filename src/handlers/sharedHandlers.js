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
    // For inline button: edit the message and show main menu after
    await ctx.answerCbQuery();
    await ctx.editMessageText(helpMessage, { 
      parse_mode: 'HTML',
      disable_web_page_preview: true 
    });
    
    // Show main menu after a short delay
    setTimeout(() => {
      ctx.reply(messages.common.whatToDo, mainMenu());
    }, 500);
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
          'Use /start to get the join link.'
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
        `Your limit will reset next month.`;
      
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
    
    const errorMessage = messages.common.genericError;
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
          'Use /start to get the join link.'
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
        `Your limit will reset next month.`;
      
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
    
    const errorMessage = messages.common.genericError;
    return isCallback ? ctx.editMessageText(errorMessage) : ctx.reply(errorMessage);
  }
};

module.exports = {
  generateHelpMessage,
  handleHelp,
  handleTravel,
  handleFavor
};