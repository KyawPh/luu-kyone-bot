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
    
    const currentSettings = user.settings || {
      notifications: true,
      dailySummary: true,
      connectionAlerts: true
    };
    
    const message = '⚙️ <b>Settings</b>\n\n' +
      'Manage your notification preferences:';
    
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          `${currentSettings.notifications ? '🔔' : '🔕'} All Notifications: ${currentSettings.notifications ? 'ON' : 'OFF'}`,
          'toggle_notifications'
        )
      ],
      [
        Markup.button.callback(
          `${currentSettings.dailySummary ? '📊' : '📈'} Daily Summary: ${currentSettings.dailySummary ? 'ON' : 'OFF'}`,
          'toggle_daily_summary'
        )
      ],
      [
        Markup.button.callback(
          `${currentSettings.connectionAlerts ? '👥' : '👤'} Connection Alerts: ${currentSettings.connectionAlerts ? 'ON' : 'OFF'}`,
          'toggle_connection_alerts'
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
    await ctx.reply('❌ Error loading settings. Please try again.');
    ctx.scene.leave();
  }
});

async function updateSettingsDisplay(ctx) {
  const userId = ctx.from.id.toString();
  
  try {
    const userDoc = await collections.users.doc(userId).get();
    const user = userDoc.data();
    
    const currentSettings = user.settings || {
      notifications: true,
      dailySummary: true,
      connectionAlerts: true
    };
    
    const message = '⚙️ <b>Settings</b>\n\n' +
      'Manage your notification preferences:';
    
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          `${currentSettings.notifications ? '🔔' : '🔕'} All Notifications: ${currentSettings.notifications ? 'ON' : 'OFF'}`,
          'toggle_notifications'
        )
      ],
      [
        Markup.button.callback(
          `${currentSettings.dailySummary ? '📊' : '📈'} Daily Summary: ${currentSettings.dailySummary ? 'ON' : 'OFF'}`,
          'toggle_daily_summary'
        )
      ],
      [
        Markup.button.callback(
          `${currentSettings.connectionAlerts ? '👥' : '👤'} Connection Alerts: ${currentSettings.connectionAlerts ? 'ON' : 'OFF'}`,
          'toggle_connection_alerts'
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

settingsScene.action('toggle_notifications', async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from.id.toString();
  
  try {
    const userDoc = await collections.users.doc(userId).get();
    const user = userDoc.data();
    const currentSettings = user.settings || { notifications: true, dailySummary: true, connectionAlerts: true };
    
    currentSettings.notifications = !currentSettings.notifications;
    
    if (!currentSettings.notifications) {
      currentSettings.dailySummary = false;
      currentSettings.connectionAlerts = false;
    }
    
    await collections.users.doc(userId).update({ settings: currentSettings });
    
    logEvent.customEvent('settings_updated', { userId, setting: 'notifications', value: currentSettings.notifications });
    await updateSettingsDisplay(ctx);
  } catch (error) {
    logger.error('Error toggling notifications', { error: error.message, userId });
    await ctx.answerCbQuery('❌ Error updating setting');
  }
});

settingsScene.action('toggle_daily_summary', async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from.id.toString();
  
  try {
    const userDoc = await collections.users.doc(userId).get();
    const user = userDoc.data();
    const currentSettings = user.settings || { notifications: true, dailySummary: true, connectionAlerts: true };
    
    if (!currentSettings.notifications) {
      await ctx.answerCbQuery('⚠️ Enable notifications first');
      return;
    }
    
    currentSettings.dailySummary = !currentSettings.dailySummary;
    
    await collections.users.doc(userId).update({ settings: currentSettings });
    
    logEvent.customEvent('settings_updated', { userId, setting: 'dailySummary', value: currentSettings.dailySummary });
    await updateSettingsDisplay(ctx);
  } catch (error) {
    logger.error('Error toggling daily summary', { error: error.message, userId });
    await ctx.answerCbQuery('❌ Error updating setting');
  }
});

settingsScene.action('toggle_connection_alerts', async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from.id.toString();
  
  try {
    const userDoc = await collections.users.doc(userId).get();
    const user = userDoc.data();
    const currentSettings = user.settings || { notifications: true, dailySummary: true, connectionAlerts: true };
    
    if (!currentSettings.notifications) {
      await ctx.answerCbQuery('⚠️ Enable notifications first');
      return;
    }
    
    currentSettings.connectionAlerts = !currentSettings.connectionAlerts;
    
    await collections.users.doc(userId).update({ settings: currentSettings });
    
    logEvent.customEvent('settings_updated', { userId, setting: 'connectionAlerts', value: currentSettings.connectionAlerts });
    await updateSettingsDisplay(ctx);
  } catch (error) {
    logger.error('Error toggling connection alerts', { error: error.message, userId });
    await ctx.answerCbQuery('❌ Error updating setting');
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
  await ctx.editMessageText('What would you like to do?', mainMenu());
});

module.exports = settingsScene;