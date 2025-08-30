const { Scenes } = require('telegraf');
const { collections } = require('../config/firebase');
const { 
  cityKeyboard, 
  categoryKeyboard, 
  dateKeyboard,
  weightKeyboard,
  mainMenu,
  contactButton
} = require('../utils/keyboards');
const { 
  parseDate, 
  formatDate, 
  formatRoute,
  generatePostId,
  formatPostForChannel,
  validateCategories
} = require('../utils/helpers');
const { CITIES, CATEGORIES } = require('../config/constants');
const { logger, logEvent } = require('../utils/logger');
const { messages, formatMessage } = require('../config/messages');
const { config } = require('../config');

const travelScene = new Scenes.BaseScene('travelScene');

travelScene.enter(async (ctx) => {
  // Initialize state with passed data or empty object
  ctx.scene.state = ctx.scene.state || {};
  
  // Log scene entry
  const userId = ctx.from.id.toString();
  logEvent.sceneEntered(userId, 'travelScene');
  
  const message = messages.scenes.travel.title + '\n\n' +
    messages.scenes.travel.steps.fromCity;
  
  // If we have a message to edit (from menu), edit it. Otherwise, send a new message
  if (ctx.scene.state.messageToEdit) {
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      ctx.scene.state.messageToEdit.message_id,
      null,
      message,
      { 
        parse_mode: 'HTML',
        ...cityKeyboard()
      }
    );
  } else {
    await ctx.reply(
      message,
      { 
        parse_mode: 'HTML',
        ...cityKeyboard()
      }
    );
  }
});

// Handle city selection
travelScene.action(/^city_(.+)$/, async (ctx) => {
  const city = ctx.match[1];
  await ctx.answerCbQuery();
  
  if (!ctx.scene.state.fromCity) {
    // First city selection (FROM)
    ctx.scene.state.fromCity = city;
    await ctx.editMessageText(
      messages.scenes.travel.title + '\n\n' +
      `From: ${CITIES[Object.keys(CITIES).find(k => CITIES[k].code === city)]?.name}\n\n` +
      messages.scenes.travel.steps.toCity,
      { 
        parse_mode: 'HTML',
        ...cityKeyboard(city) // Exclude the FROM city
      }
    );
  } else if (!ctx.scene.state.toCity) {
    // Second city selection (TO)
    ctx.scene.state.toCity = city;
    await ctx.editMessageText(
      messages.scenes.travel.title + '\n\n' +
      `Route: ${formatRoute(ctx.scene.state.fromCity, ctx.scene.state.toCity)}\n\n` +
      messages.scenes.travel.steps.departure,
      { 
        parse_mode: 'HTML',
        ...dateKeyboard()
      }
    );
  }
});

// Handle date selection
travelScene.action('date_today', async (ctx) => {
  await ctx.answerCbQuery();
  const today = new Date();
  ctx.scene.state.departureDate = today;
  await promptWeight(ctx);
});

travelScene.action('date_tomorrow', async (ctx) => {
  await ctx.answerCbQuery();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  ctx.scene.state.departureDate = tomorrow;
  await promptWeight(ctx);
});

travelScene.action('date_custom', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.scene.state.waitingForDate = 'departure';
  // We need to send a new message for text input since user needs to see the prompt while typing
  await ctx.editMessageText(
    messages.scenes.travel.title + '\n\n' +
    `Route: ${formatRoute(ctx.scene.state.fromCity, ctx.scene.state.toCity)}\n\n` +
    messages.scenes.travel.steps.departureCustom,
    { parse_mode: 'HTML' }
  );
});


// Weight selection prompt
async function promptWeight(ctx, useReply = false) {
  const message = messages.scenes.travel.title + '\n\n' +
    `Route: ${formatRoute(ctx.scene.state.fromCity, ctx.scene.state.toCity)}\n` +
    `Departure: ${formatDate(ctx.scene.state.departureDate)}\n\n` +
    messages.scenes.travel.steps.weight;
  
  const options = { 
    parse_mode: 'HTML',
    ...weightKeyboard()
  };
  
  if (useReply) {
    await ctx.reply(message, options);
  } else {
    await ctx.editMessageText(message, options);
  }
}

// Handle weight selection
travelScene.action(/^weight_(\w+)$/, async (ctx) => {
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
        messages.scenes.travel.title + '\n\n' +
        `Route: ${formatRoute(ctx.scene.state.fromCity, ctx.scene.state.toCity)}\n` +
        `Departure: ${formatDate(ctx.scene.state.departureDate)}\n\n` +
        messages.scenes.travel.steps.weightCustom,
        { parse_mode: 'HTML' }
      );
  }
  
  ctx.scene.state.availableWeight = weightText;
  await promptCategories(ctx);
});

// Handle custom weight input
travelScene.on('text', async (ctx) => {
  const text = ctx.message.text.trim();
  
  if (ctx.scene.state.waitingForWeight) {
    // Parse the weight input - expecting format like "20 kg" or "20kg"
    const weightMatch = text.match(/^(\d+)\s*(kg)?$/i);
    
    if (!weightMatch) {
      return ctx.reply(messages.errors.invalidWeight);
    }
    
    const weightValue = weightMatch[1];
    ctx.scene.state.availableWeight = `${weightValue} kg`;
    ctx.scene.state.waitingForWeight = false;
    
    // Call promptCategories with useReply flag since we're responding to text input
    await promptCategories(ctx, true);
  } else if (ctx.scene.state.waitingForDate) {
    const date = parseDate(text);
    
    if (!date) {
      return ctx.reply(messages.validation.invalidDate);
    }
    
    ctx.scene.state.departureDate = date;
    ctx.scene.state.waitingForDate = null;
    // Use reply mode since this is responding to text input
    await promptWeight(ctx, true);
  }
});

// Category selection
async function promptCategories(ctx, useReply = false) {
  ctx.scene.state.categories = [];
  const message = messages.scenes.travel.title + '\n\n' +
    `Route: ${formatRoute(ctx.scene.state.fromCity, ctx.scene.state.toCity)}\n` +
    `Departure: ${formatDate(ctx.scene.state.departureDate)}\n` +
    `Available Space: ${ctx.scene.state.availableWeight}\n\n` +
    messages.scenes.travel.steps.categories;
  
  const options = { 
    parse_mode: 'HTML',
    ...categoryKeyboard()
  };
  
  if (useReply) {
    await ctx.reply(message, options);
  } else {
    await ctx.editMessageText(message, options);
  }
}

travelScene.action(/^cat_(.+)$/, async (ctx) => {
  const categoryId = ctx.match[1];
  await ctx.answerCbQuery();
  
  // Add category if not already added
  if (!ctx.scene.state.categories.includes(categoryId)) {
    ctx.scene.state.categories.push(categoryId);
  }
  
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
    messages.scenes.travel.title + '\n\n' +
    messages.scenes.travel.categorySelection.title + '\n' +
    selectedCats + '\n\n' +
    messages.scenes.travel.categorySelection.prompt,
    { 
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          ...categoryRows,
          [
            { text: messages.buttons.common.confirmPost, callback_data: 'confirm_post' },
            { text: messages.buttons.common.cancel, callback_data: 'cancel' }
          ]
        ]
      }
    }
  );
});

// Confirm and post
travelScene.action('confirm_post', async (ctx) => {
  await ctx.answerCbQuery();
  
  if (!validateCategories(ctx.scene.state.categories)) {
    return ctx.reply(messages.validation.selectCategories);
  }
  
  try {
    const userId = ctx.from.id.toString();
    const userDoc = await collections.users.doc(userId).get();
    const user = userDoc.data();
    
    // Create travel plan with T prefix
    const postId = generatePostId('T');
    const travelPlan = {
      postId: postId,
      userId: userId,
      userName: user.userName,
      fromCity: ctx.scene.state.fromCity,
      toCity: ctx.scene.state.toCity,
      departureDate: ctx.scene.state.departureDate,
      availableWeight: ctx.scene.state.availableWeight,
      categories: ctx.scene.state.categories,
      status: 'active',
      createdAt: new Date(),
      // Expire after 30 days from departure
      expiresAt: new Date(ctx.scene.state.departureDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    };
    
    // Save to database
    await collections.travelPlans.doc(postId).set(travelPlan);
    
    // Log the travel plan creation
    const route = formatRoute(ctx.scene.state.fromCity, ctx.scene.state.toCity);
    logEvent.travelPlanCreated(userId, route, ctx.scene.state.departureDate);
    logger.info('Travel plan created successfully', {
      postId,
      userId,
      route,
      categories: ctx.scene.state.categories.length,
      weight: ctx.scene.state.availableWeight
    });
    
    // Format message for channel
    const channelMessage = formatPostForChannel(travelPlan, 'travel');
    
    // Post to channel and save message ID
    try {
      const channelMsg = await ctx.telegram.sendMessage(
        config.telegram.channelId,
        channelMessage,
        {
          parse_mode: 'HTML',
          ...contactButton(userId, 'travel', postId)
        }
      );
      
      // Save channel message ID for future updates
      await collections.travelPlans.doc(postId).update({
        channelMessageId: channelMsg.message_id,
        channelChatId: config.telegram.channelId
      });
      
      logEvent.channelMessageSent('travel_plan');
      logger.info('Travel plan posted to channel', {
        postId,
        channelMessageId: channelMsg.message_id
      });
    } catch (error) {
      logger.error('Failed to post travel plan to channel', { 
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
      messages.scenes.travel.confirmation.title + '\n\n' +
      messages.scenes.travel.confirmation.body + '\n\n' +
      formatMessage(messages.scenes.travel.confirmation.reference, { postId }),
      { parse_mode: 'HTML' }
    );
    
    // Show main menu
    setTimeout(() => {
      ctx.reply(messages.scenes.travel.nextPrompt, mainMenu());
    }, 1000);
    
    // Leave scene
    logEvent.sceneLeft(userId, 'travelScene', 'completed');
    ctx.scene.leave();
  } catch (error) {
    const userId = ctx.from?.id || 'unknown';
    logger.error('Error creating travel plan', { 
      error: error.message,
      userId,
      state: ctx.scene.state 
    });
    logEvent.firebaseError('create_travel_plan', error);
    ctx.reply(messages.scenes.travel.errorPosting);
    logEvent.sceneLeft(userId, 'travelScene', 'error');
    ctx.scene.leave();
  }
});

// Handle cancel
travelScene.action('cancel', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(messages.scenes.travel.cancelled);
  const userId = ctx.from.id.toString();
  logEvent.sceneLeft(userId, 'travelScene', 'cancelled');
  ctx.scene.leave();
  ctx.reply(messages.scenes.travel.whatToDo, mainMenu());
});

module.exports = travelScene;