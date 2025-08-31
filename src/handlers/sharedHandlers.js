const { mainMenu } = require('../utils/keyboards');
const { LIMITS } = require('../config/constants');
const { messages, formatMessage } = require('../config/messages');

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

module.exports = {
  generateHelpMessage,
  handleHelp
};