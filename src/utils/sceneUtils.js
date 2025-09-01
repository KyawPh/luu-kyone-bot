const { formatRoute, formatDate } = require('./helpers');
const { messages } = require('../config/messages');

/**
 * Build a consistent scene message with title, route, and other details
 * @param {string} title - Scene title
 * @param {Object} state - Scene state object
 * @param {string} prompt - Current step prompt
 * @returns {string} Formatted message
 */
const buildSceneMessage = (title, state, prompt) => {
  let message = title + '\n\n';
  
  // Add route if available
  if (state.fromCity && state.toCity) {
    message += `${messages.fieldLabels.route}: ${formatRoute(state.fromCity, state.toCity)}\n`;
  }
  
  // Add departure date if available (travel scene)
  if (state.departureDate) {
    message += `${messages.fieldLabels.departure}: ${formatDate(state.departureDate)}\n`;
  }
  
  // Add weight if available
  if (state.availableWeight || state.requestedWeight) {
    const weight = state.availableWeight || state.requestedWeight;
    message += `${messages.fieldLabels.weight}: ${weight}\n`;
  }
  
  // Add categories if selected
  if (state.categories && state.categories.length > 0) {
    const { CATEGORIES } = require('../config/constants');
    const categoriesDisplay = state.categories
      .map(id => {
        const cat = CATEGORIES.find(c => c.id === id);
        return cat ? `${cat.emoji} ${cat.name}` : '';
      })
      .filter(c => c)
      .join(', ');
    message += `${messages.fieldLabels.categories}: ${categoriesDisplay}\n`;
  }
  
  // Add urgency if available (favor scene)
  if (state.urgency) {
    const { URGENCY_LEVELS } = require('../config/constants');
    const urgency = URGENCY_LEVELS[state.urgency];
    if (urgency) {
      message += `${messages.fieldLabels.urgency}: ${urgency.emoji} ${urgency.label}\n`;
    }
  }
  
  // Add the prompt
  if (prompt) {
    message += '\n' + prompt;
  }
  
  return message;
};

/**
 * Common scene entry handler
 * @param {Object} ctx - Telegraf context
 * @param {string} sceneName - Name of the scene for logging
 * @param {string} title - Scene title
 * @param {string} prompt - Initial prompt
 * @param {Object} keyboard - Keyboard to show
 */
const handleSceneEntry = async (ctx, sceneName, title, prompt, keyboard) => {
  // Initialize state
  ctx.scene.state = ctx.scene.state || {};
  
  // Log scene entry
  const userId = ctx.from.id.toString();
  const { logEvent } = require('./logger');
  logEvent.sceneEntered(userId, sceneName);
  
  const message = title + '\n\n' + prompt;
  
  // If we have a message to edit (from menu), edit it. Otherwise, send a new message
  if (ctx.scene.state.messageToEdit) {
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      ctx.scene.state.messageToEdit.message_id,
      null,
      message,
      { 
        parse_mode: 'HTML',
        ...keyboard
      }
    );
  } else {
    await ctx.reply(
      message,
      { 
        parse_mode: 'HTML',
        ...keyboard
      }
    );
  }
};

/**
 * Handle scene cancellation
 * @param {Object} ctx - Telegraf context
 * @param {string} sceneName - Name of the scene for logging
 * @param {string} cancelMessage - Message to show on cancel
 */
const handleSceneCancel = async (ctx, sceneName, cancelMessage) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(cancelMessage);
  
  const userId = ctx.from.id.toString();
  const { logEvent } = require('./logger');
  logEvent.sceneLeft(userId, sceneName, 'cancelled');
  
  ctx.scene.leave();
  
  // Show main menu
  const { mainMenu } = require('./keyboards');
  ctx.reply(messages.common.whatToDo, mainMenu());
};

/**
 * Handle scene error
 * @param {Object} ctx - Telegraf context
 * @param {string} sceneName - Name of the scene for logging
 * @param {Error} error - Error object
 * @param {string} errorMessage - User-friendly error message
 */
const handleSceneError = async (ctx, sceneName, error, errorMessage) => {
  const userId = ctx.from?.id || 'unknown';
  const { logger, logEvent } = require('./logger');
  
  logger.error(`Error in ${sceneName}`, { 
    error: error.message,
    userId,
    state: ctx.scene.state 
  });
  
  logEvent.firebaseError(`${sceneName}_error`, error);
  
  await ctx.reply(errorMessage);
  
  logEvent.sceneLeft(userId, sceneName, 'error');
  ctx.scene.leave();
};

module.exports = {
  buildSceneMessage,
  handleSceneEntry,
  handleSceneCancel,
  handleSceneError
};