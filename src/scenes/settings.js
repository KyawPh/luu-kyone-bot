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
          dailySummaryEnabled ? messages.settings.buttons.dailySummary.on : messages.settings.buttons.dailySummary.off,
          'toggle_daily_summary'
        )
      ],
      [
        Markup.button.callback(messages.settings.buttons.about, 'about'),
        Markup.button.callback(messages.settings.buttons.backToMenu, 'back_to_menu')
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
    await ctx.reply(messages.errors.generic);
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
          dailySummaryEnabled ? messages.settings.buttons.dailySummary.on : messages.settings.buttons.dailySummary.off,
          'toggle_daily_summary'
        )
      ],
      [
        Markup.button.callback(messages.settings.buttons.about, 'about'),
        Markup.button.callback(messages.settings.buttons.backToMenu, 'back_to_menu')
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
    await ctx.answerCbQuery(messages.errors.generic);
  }
});

settingsScene.action('about', async (ctx) => {
  await ctx.answerCbQuery();
  
  const aboutMessage = messages.settings.about.title + '\n\n' +
    messages.settings.about.subtitle + '\n\n' +
    messages.settings.about.version + '\n' +
    messages.settings.about.status + '\n' +
    messages.settings.about.community + '\n\n' +
    messages.settings.about.features.title + '\n' +
    messages.settings.about.features.list.join('\n') + '\n\n' +
    messages.settings.about.notifications.title + '\n' +
    messages.settings.about.notifications.connection + '\n' +
    messages.settings.about.notifications.daily + '\n\n' +
    messages.settings.about.limits.title + '\n' +
    messages.settings.about.limits.posts + '\n' +
    messages.settings.about.limits.expiry + '\n\n' +
    messages.settings.about.footer;
  
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback(messages.settings.buttons.backToSettings, 'back_to_settings')]
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