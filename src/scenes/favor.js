const { Scenes } = require('telegraf');
const { collections } = require('../config/firebase');
const { 
  routeKeyboard, 
  categoryKeyboard, 
  urgencyKeyboard,
  weightKeyboard,
  mainMenu
} = require('../utils/keyboards');
const { 
  generatePostId,
  formatPostForChannel,
  formatRoute,
  validateWeight,
  validateCategories
} = require('../utils/helpers');
const { CITIES, CATEGORIES, URGENCY_LEVELS } = require('../config/constants');
const { logger, logEvent } = require('../utils/logger');
const { messages, formatMessage } = require('../config/messages');
const { config } = require('../config');

const favorScene = new Scenes.BaseScene('favorScene');

favorScene.enter(async (ctx) => {
  // Initialize state with passed data or empty object
  ctx.scene.state = ctx.scene.state || {};
  
  // Log scene entry
  const userId = ctx.from.id.toString();
  logEvent.sceneEntered(userId, 'favorScene');
  
  const message = messages.scenes.favor.title + '\n\n' +
    messages.scenes.favor.steps.selectRoute;
  
  // If we have a message to edit (from menu), edit it. Otherwise, send a new message
  if (ctx.scene.state.messageToEdit) {
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      ctx.scene.state.messageToEdit.message_id,
      null,
      message,
      { 
        parse_mode: 'HTML',
        ...routeKeyboard()
      }
    );
  } else {
    await ctx.reply(
      message,
      { 
        parse_mode: 'HTML',
        ...routeKeyboard()
      }
    );
  }
});

// Handle route selection
favorScene.action(/^route_(.+)_(.+)$/, async (ctx) => {
  const fromCity = ctx.match[1];
  const toCity = ctx.match[2];
  await ctx.answerCbQuery();
  
  // Set both cities at once
  ctx.scene.state.fromCity = fromCity;
  ctx.scene.state.toCity = toCity;
  
  await ctx.editMessageText(
    messages.scenes.favor.title + '\n\n' +
    `Route: ${formatRoute(fromCity, toCity)}\n\n` +
    messages.scenes.favor.steps.categories,
    { 
      parse_mode: 'HTML',
      ...categoryKeyboard()
    }
  );
});

// Handle category selection
favorScene.action(/^cat_(.+)$/, async (ctx) => {
  const categoryId = ctx.match[1];
  await ctx.answerCbQuery();
  
  // Initialize categories array if not exists
  if (!ctx.scene.state.categories) {
    ctx.scene.state.categories = [];
  }
  
  // Add category if not already added
  if (!ctx.scene.state.categories.includes(categoryId)) {
    ctx.scene.state.categories.push(categoryId);
  }
  
  const fromCityName = Object.values(CITIES).find(c => c.code === ctx.scene.state.fromCity)?.name;
  const toCityName = Object.values(CITIES).find(c => c.code === ctx.scene.state.toCity)?.name;
  
  const selectedCats = ctx.scene.state.categories
    .map(id => CATEGORIES.find(c => c.id === id))
    .map(c => `${c.emoji} ${c.name}`)
    .join('\n');
  
  // Build keyboard with remaining categories in 2 columns
  const remainingCategories = CATEGORIES.filter(c => !ctx.scene.state.categories.includes(c.id));
  const categoryRows = [];
  
  for (let i = 0; i < remainingCategories.length; i += 2) {
    const row = [];
    row.push({ 
      text: `${remainingCategories[i].emoji} ${remainingCategories[i].name}`, 
      callback_data: `cat_${remainingCategories[i].id}` 
    });
    
    if (i + 1 < remainingCategories.length) {
      row.push({ 
        text: `${remainingCategories[i + 1].emoji} ${remainingCategories[i + 1].name}`, 
        callback_data: `cat_${remainingCategories[i + 1].id}` 
      });
    }
    
    categoryRows.push(row);
  }
  
  await ctx.editMessageText(
    messages.scenes.favor.title + '\n\n' +
    `Route: ${fromCityName} → ${toCityName}\n\n` +
    messages.scenes.favor.categorySelection.title + '\n' +
    selectedCats + '\n\n' +
    messages.scenes.favor.categorySelection.prompt,
    { 
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          ...categoryRows,
          [
            { text: messages.buttons.common.confirmCategories, callback_data: 'confirm_categories' },
            { text: messages.buttons.common.cancel, callback_data: 'cancel' }
          ]
        ]
      }
    }
  );
});

// Handle category confirmation
favorScene.action('confirm_categories', async (ctx) => {
  await ctx.answerCbQuery();
  
  if (!validateCategories(ctx.scene.state.categories)) {
    return ctx.reply(messages.validation.selectCategories);
  }
  
  const fromCityName = Object.values(CITIES).find(c => c.code === ctx.scene.state.fromCity)?.name;
  const toCityName = Object.values(CITIES).find(c => c.code === ctx.scene.state.toCity)?.name;
  
  const selectedCats = ctx.scene.state.categories
    .map(id => CATEGORIES.find(c => c.id === id))
    .map(c => `${c.emoji} ${c.name}`)
    .join(', ');
  
  await ctx.editMessageText(
    messages.scenes.favor.title + '\n\n' +
    `Route: ${fromCityName} → ${toCityName}\n` +
    `Categories: ${selectedCats}\n\n` +
    messages.scenes.favor.steps.urgency,
    { 
      parse_mode: 'HTML',
      ...urgencyKeyboard()
    }
  );
});

// Handle urgency selection
favorScene.action(/^urgency_(.+)$/, async (ctx) => {
  const urgencyKey = ctx.match[1];
  await ctx.answerCbQuery();
  
  ctx.scene.state.urgency = urgencyKey;
  const urgency = URGENCY_LEVELS[urgencyKey];
  
  const fromCityName = Object.values(CITIES).find(c => c.code === ctx.scene.state.fromCity)?.name;
  const toCityName = Object.values(CITIES).find(c => c.code === ctx.scene.state.toCity)?.name;
  
  const selectedCats = ctx.scene.state.categories
    .map(id => CATEGORIES.find(c => c.id === id))
    .map(c => `${c.emoji} ${c.name}`)
    .join(', ');
  
  // Now ask for weight instead of description
  await ctx.editMessageText(
    messages.scenes.favor.title + '\n\n' +
    `Route: ${fromCityName} → ${toCityName}\n` +
    `Categories: ${selectedCats}\n` +
    `Urgency: ${urgency.emoji} ${urgency.label}\n\n` +
    messages.scenes.favor.steps.weight,
    { 
      parse_mode: 'HTML',
      ...weightKeyboard()
    }
  );
});

// Handle weight selection
favorScene.action(/^weight_(\w+)$/, async (ctx) => {
  const weight = ctx.match[1];
  await ctx.answerCbQuery();
  
  let weightText = '';
  switch(weight) {
    case '1': weightText = '< 1 kg'; break;
    case '3': weightText = '1-3 kg'; break;
    case '5': weightText = '3-5 kg'; break;
    case '10': weightText = '5-10 kg'; break;
    case 'more': weightText = '> 10 kg'; break;
    case 'custom':
      ctx.scene.state.waitingForWeight = true;
      return ctx.editMessageText(
        messages.scenes.favor.title + '\n\n' +
        messages.scenes.favor.steps.weightCustom,
        { parse_mode: 'HTML' }
      );
  }
  
  ctx.scene.state.requestedWeight = weightText;
  // Directly post the favor request without confirmation
  await postFavorRequest(ctx);
});

// Handle custom weight input
favorScene.on('text', async (ctx) => {
  if (ctx.scene.state.waitingForWeight) {
    const text = ctx.message.text;
    const validatedWeight = validateWeight(text);
    
    if (!validatedWeight) {
      return ctx.reply(messages.validation.enterWeightNumber);
    }
    
    ctx.scene.state.requestedWeight = validatedWeight;
    ctx.scene.state.waitingForWeight = false;
    
    // Directly post the favor request
    await postFavorRequest(ctx);
  }
});

// Direct post function without confirmation
async function postFavorRequest(ctx) {
  
  try {
    const userId = ctx.from.id.toString();
    const userDoc = await collections.users.doc(userId).get();
    const user = userDoc.data();
    
    // Create favor request with F prefix
    const postId = generatePostId('F');
    const favorRequest = {
      postId: postId,
      userId: userId,
      userName: user.userName,
      fromCity: ctx.scene.state.fromCity,
      toCity: ctx.scene.state.toCity,
      categories: ctx.scene.state.categories, // Now storing array of category IDs
      urgency: ctx.scene.state.urgency,
      requestedWeight: ctx.scene.state.requestedWeight, // Added weight instead of description
      status: 'active',
      createdAt: new Date()
    };
    
    // Calculate expiry based on urgency
    const daysToExpire = ctx.scene.state.urgency === 'urgent' ? 3 : 
                        ctx.scene.state.urgency === 'normal' ? 7 : 30;
    favorRequest.expiresAt = new Date(Date.now() + daysToExpire * 24 * 60 * 60 * 1000);
    
    // Save to database
    await collections.favorRequests.doc(postId).set(favorRequest);
    
    // Log the favor request creation
    const route = formatRoute(ctx.scene.state.fromCity, ctx.scene.state.toCity);
    const firstCategoryName = CATEGORIES.find(c => c.id === ctx.scene.state.categories[0])?.name;
    logEvent.favorRequestCreated(userId, route, firstCategoryName);
    logger.info('Favor request created successfully', {
      postId,
      userId,
      route,
      categories: ctx.scene.state.categories.length,
      urgency: ctx.scene.state.urgency,
      weight: ctx.scene.state.requestedWeight
    });
    
    // Format message for channel
    const channelMessage = formatPostForChannel(favorRequest, 'favor');
    
    // Post to channel and save message ID
    try {
      // Post without photo (simplified)
      const channelMsg = await ctx.telegram.sendMessage(
        config.telegram.channelId,
        channelMessage,
        {
          parse_mode: 'HTML'
        }
      );
      
      // Save channel message ID for future updates
      await collections.favorRequests.doc(postId).update({
        channelMessageId: channelMsg.message_id,
        channelChatId: config.telegram.channelId
      });
      
      logEvent.channelMessageSent('favor_request');
      logger.info('Favor request posted to channel', {
        postId,
        channelMessageId: channelMsg.message_id
      });
    } catch (error) {
      logger.error('Failed to post favor request to channel', { 
        error: error.message, 
        postId 
      });
      await ctx.reply(
        messages.errors.channelPostFailed,
        { parse_mode: 'HTML' }
      );
    }
    
    // Success message
    await ctx.editMessageText(
      messages.scenes.favor.confirmation.title + '\n\n' +
      formatMessage(messages.scenes.favor.confirmation.reference, { postId }),
      { parse_mode: 'HTML' }
    );
    
    // Show main menu
    setTimeout(() => {
      ctx.reply(messages.scenes.favor.whatToDo, mainMenu());
    }, 1000);
    
    // Leave scene
    logEvent.sceneLeft(userId, 'favorScene', 'completed');
    ctx.scene.leave();
  } catch (error) {
    const userId = ctx.from?.id || 'unknown';
    logger.error('Error creating favor request', { 
      error: error.message,
      userId,
      state: ctx.scene.state 
    });
    logEvent.firebaseError('create_favor_request', error);
    ctx.reply(messages.scenes.favor.errorPosting);
    logEvent.sceneLeft(userId, 'favorScene', 'error');
    ctx.scene.leave();
  }
}

// Handle cancel
favorScene.action(['cancel', 'cancel_favor'], async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(messages.scenes.favor.cancelled);
  const userId = ctx.from.id.toString();
  logEvent.sceneLeft(userId, 'favorScene', 'cancelled');
  ctx.scene.leave();
  ctx.reply(messages.scenes.favor.whatToDo, mainMenu());
});

module.exports = favorScene;