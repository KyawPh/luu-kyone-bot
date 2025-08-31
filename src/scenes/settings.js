const { Scenes } = require('telegraf');
const { collections } = require('../config/firebase');
const { messages } = require('../config/messages');
const { logger, logEvent } = require('../utils/logger');
const { Markup } = require('telegraf');

const settingsScene = new Scenes.BaseScene('settingsScene');

settingsScene.enter(async (ctx) => {
  ctx.scene.state = ctx.scene.state || {};
  
  const userId = ctx.from.id.toString();
  logEvent.sceneEntered(userId, 'settingsScene');
  
  try {
    const userDoc = await collections.users.doc(userId).get();
    const user = userDoc.data();
    
    // Simplified settings - only daily summary preference
    const dailySummaryEnabled = user.settings?.dailySummary !== false; // Default to true
    
    const message = messages.settings.title + '\n\n' +
      messages.settings.preferences + '\n\n' +
      messages.settings.tip;
    
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          `${dailySummaryEnabled ? '📊' : '📈'} Daily Summary: ${dailySummaryEnabled ? 'ON' : 'OFF'}`,
          'toggle_daily_summary'
        )
      ],
      [
        Markup.button.callback('📱 About', 'about'),
        Markup.button.callback('🔙 Back to Menu', 'back_to_menu')
      ]
    ]);
    
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
      await ctx.reply(message, { 
        parse_mode: 'HTML',
        ...keyboard
      });
    }
  } catch (error) {
    logger.error('Error entering settings scene', { error: error.message, userId });
    await ctx.reply(messages.common.genericError);
    ctx.scene.leave();
  }
});

async function updateSettingsDisplay(ctx) {
  const userId = ctx.from.id.toString();
  
  try {
    const userDoc = await collections.users.doc(userId).get();
    const user = userDoc.data();
    
    // Simplified settings - only daily summary preference
    const dailySummaryEnabled = user.settings?.dailySummary !== false; // Default to true
    
    const message = messages.settings.title + '\n\n' +
      messages.settings.preferences + '\n\n' +
      messages.settings.tip;
    
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          `${dailySummaryEnabled ? '📊' : '📈'} Daily Summary: ${dailySummaryEnabled ? 'ON' : 'OFF'}`,
          'toggle_daily_summary'
        )
      ],
      [
        Markup.button.callback('📱 About', 'about'),
        Markup.button.callback('🔙 Back to Menu', 'back_to_menu')
      ]
    ]);
    
    await ctx.editMessageText(message, { 
      parse_mode: 'HTML',
      ...keyboard
    });
  } catch (error) {
    logger.error('Error updating settings display', { error: error.message, userId });
  }
}

settingsScene.action('toggle_daily_summary', async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from.id.toString();
  
  try {
    const userDoc = await collections.users.doc(userId).get();
    const user = userDoc.data();
    
    // Toggle daily summary setting
    const currentValue = user.settings?.dailySummary !== false; // Default true
    const newValue = !currentValue;
    
    await collections.users.doc(userId).update({ 
      'settings.dailySummary': newValue 
    });
    
    logEvent.customEvent('settings_updated', { 
      userId, 
      setting: 'dailySummary', 
      value: newValue 
    });
    
    await updateSettingsDisplay(ctx);
    
    // Show confirmation message
    const confirmMsg = newValue 
      ? messages.settings.confirmOn
      : messages.settings.confirmOff;
    await ctx.answerCbQuery(confirmMsg, { show_alert: true });
    
  } catch (error) {
    logger.error('Error toggling daily summary', { error: error.message, userId });
    await ctx.answerCbQuery(messages.common.genericError);
  }
});

settingsScene.action('about', async (ctx) => {
  await ctx.answerCbQuery();
  
  const aboutMessage = '📱 <b>About Luu Kyone Bot</b>\n\n' +
    '🤝 Connecting Myanmar travelers worldwide\n\n' +
    '<b>Version:</b> 1.0.0\n' +
    '<b>Status:</b> Free Tier\n' +
    '<b>Community:</b> @LuuKyone_Community\n\n' +
    '<b>Features:</b>\n' +
    '• Share travel plans\n' +
    '• Request personal favors\n' +
    '• Connect with travelers\n' +
    '• Browse active posts\n\n' +
    '<b>Notifications:</b>\n' +
    '🔔 Connection alerts: Always on\n' +
    '📊 Daily summaries: Optional\n\n' +
    '<b>Limits:</b>\n' +
    '• 10 posts per month\n' +
    '• Posts expire after 30 days\n\n' +
    '<i>Created with ❤️ for the Myanmar community</i>';
  
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Back to Settings', 'back_to_settings')]
  ]);
  
  await ctx.editMessageText(aboutMessage, { 
    parse_mode: 'HTML',
    ...keyboard
  });
});

settingsScene.action('back_to_settings', async (ctx) => {
  await ctx.answerCbQuery();
  await updateSettingsDisplay(ctx);
});

settingsScene.action('back_to_menu', async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from.id.toString();
  logEvent.sceneLeft(userId, 'settingsScene', 'back_to_menu');
  ctx.scene.leave();
  
  const { mainMenu } = require('../utils/keyboards');
  await ctx.editMessageText(messages.common.whatToDo, mainMenu());
});

// Remove the old notification and connection alert handlers since they're no longer needed
settingsScene.action('toggle_notifications', async (ctx) => {
  await ctx.answerCbQuery(messages.callbacks.thisOptionRemoved, { show_alert: true });
  await updateSettingsDisplay(ctx);
});

settingsScene.action('toggle_connection_alerts', async (ctx) => {
  await ctx.answerCbQuery(messages.callbacks.connectionAlertsAlwaysOn, { show_alert: true });
  await updateSettingsDisplay(ctx);
});

module.exports = settingsScene;