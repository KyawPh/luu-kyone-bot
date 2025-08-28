const { Scenes } = require('telegraf');
const { collections } = require('../config/firebase');
const { 
  cityKeyboard, 
  categoryKeyboard, 
  dateKeyboard,
  weightKeyboard,
  confirmKeyboard,
  mainMenu,
  contactButton
} = require('../utils/keyboards');
const { 
  parseDate, 
  formatDate, 
  formatRoute,
  generatePostId,
  formatPostForChannel,
  escapeHtml
} = require('../utils/helpers');
const { CITIES, CATEGORIES } = require('../config/constants');
const { logger, logEvent } = require('../utils/logger');

const travelScene = new Scenes.BaseScene('travelScene');

travelScene.enter(async (ctx) => {
  // Initialize state with passed data or empty object
  ctx.scene.state = ctx.scene.state || {};
  
  const message = '✈️ <b>Share Your Travel Plan</b>\n\n' +
    'Step 1: Where are you traveling FROM?';
  
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
      '✈️ <b>Share Your Travel Plan</b>\n\n' +
      `From: ${CITIES[Object.keys(CITIES).find(k => CITIES[k].code === city)]?.name}\n\n` +
      'Step 2: Where are you traveling TO?',
      { 
        parse_mode: 'HTML',
        ...cityKeyboard(city) // Exclude the FROM city
      }
    );
  } else if (!ctx.scene.state.toCity) {
    // Second city selection (TO)
    ctx.scene.state.toCity = city;
    await ctx.editMessageText(
      '✈️ <b>Share Your Travel Plan</b>\n\n' +
      `Route: ${formatRoute(ctx.scene.state.fromCity, ctx.scene.state.toCity)}\n\n` +
      'Step 3: When is your DEPARTURE date?',
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
    '✈️ <b>Share Your Travel Plan</b>\n\n' +
    `Route: ${formatRoute(ctx.scene.state.fromCity, ctx.scene.state.toCity)}\n\n` +
    'Step 3: Please enter the departure date in format DD/MM/YYYY:',
    { parse_mode: 'HTML' }
  );
});


// Weight selection prompt
async function promptWeight(ctx) {
  await ctx.editMessageText(
    '✈️ <b>Share Your Travel Plan</b>\n\n' +
    `Route: ${formatRoute(ctx.scene.state.fromCity, ctx.scene.state.toCity)}\n` +
    `Departure: ${formatDate(ctx.scene.state.departureDate)}\n\n` +
    'Step 4: How much luggage space do you have available?',
    { 
      parse_mode: 'HTML',
      ...weightKeyboard()
    }
  );
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
        '✈️ <b>Share Your Travel Plan</b>\n\n' +
        `Route: ${formatRoute(ctx.scene.state.fromCity, ctx.scene.state.toCity)}\n` +
        `Departure: ${formatDate(ctx.scene.state.departureDate)}\n\n` +
        'Step 4: Enter the available weight in kg (e.g., "20" or "20 kg"):',
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
      return ctx.reply('❌ Please enter weight as a number in kg (e.g., "20" or "20 kg"):');
    }
    
    const weightValue = weightMatch[1];
    ctx.scene.state.availableWeight = `${weightValue} kg`;
    ctx.scene.state.waitingForWeight = false;
    
    // Call promptCategories with useReply flag since we're responding to text input
    await promptCategories(ctx, true);
  } else if (ctx.scene.state.waitingForDate) {
    const date = parseDate(text);
    
    if (!date) {
      return ctx.reply(
        '❌ Invalid date format or date is in the past.\n' +
        'Please enter in format DD/MM/YYYY:'
      );
    }
    
    ctx.scene.state.departureDate = date;
    ctx.scene.state.waitingForDate = null;
    await promptWeight(ctx);
  }
});

// Category selection
async function promptCategories(ctx, useReply = false) {
  ctx.scene.state.categories = [];
  const message = '✈️ <b>Share Your Travel Plan</b>\n\n' +
    `Route: ${formatRoute(ctx.scene.state.fromCity, ctx.scene.state.toCity)}\n` +
    `Departure: ${formatDate(ctx.scene.state.departureDate)}\n` +
    `Available Space: ${ctx.scene.state.availableWeight}\n\n` +
    'Step 5: What categories can you help with?\n' +
    '<i>Select multiple categories, then confirm</i>';
  
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
    '✈️ <b>Share Your Travel Plan</b>\n\n' +
    '<b>Selected Categories:</b>\n' +
    selectedCats + '\n\n' +
    'Add more categories or confirm to post:',
    { 
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          ...categoryRows,
          [
            { text: '✅ Confirm', callback_data: 'confirm_post' },
            { text: '❌ Cancel', callback_data: 'cancel' }
          ]
        ]
      }
    }
  );
});

// Confirm and post
travelScene.action('confirm_post', async (ctx) => {
  await ctx.answerCbQuery();
  
  if (ctx.scene.state.categories.length === 0) {
    return ctx.reply('❌ Please select at least one category.');
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
    
    // Post to channel
    try {
      await ctx.telegram.sendMessage(
        process.env.FREE_CHANNEL_ID,
        channelMessage,
        {
          parse_mode: 'HTML',
          ...contactButton(userId, 'travel', postId)
        }
      );
      logEvent.channelMessageSent('travel_plan');
    } catch (error) {
      logger.error('Failed to post travel plan to channel', { 
        error: error.message, 
        postId 
      });
      await ctx.reply(
        '⚠️ <b>Note:</b> Your travel plan was saved but couldn\'t be posted to the channel.\n\n' +
        'Please ensure the bot is added as admin to @LuuKyone_Community channel.',
        { parse_mode: 'HTML' }
      );
    }
    
    // Success message
    await ctx.editMessageText(
      '✅ <b>Travel Plan Posted Successfully!</b>\n\n' +
      'Your travel plan has been shared with the community.\n' +
      'You will be notified when someone needs your help.\n\n' +
      `📌 <b>Reference:</b> ${postId}\n` +
      `<i>(Share this ID if someone asks about your post)</i>`,
      { parse_mode: 'HTML' }
    );
    
    // Show main menu
    setTimeout(() => {
      ctx.reply('What would you like to do next?', mainMenu());
    }, 1000);
    
    // Leave scene
    ctx.scene.leave();
  } catch (error) {
    const userId = ctx.from?.id || 'unknown';
    logger.error('Error creating travel plan', { 
      error: error.message,
      userId,
      state: ctx.scene.state 
    });
    logEvent.firebaseError('create_travel_plan', error);
    ctx.reply('❌ An error occurred while posting. Please try again.');
    ctx.scene.leave();
  }
});

// Handle cancel
travelScene.action('cancel', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText('❌ Travel plan cancelled.');
  ctx.scene.leave();
  ctx.reply('What would you like to do?', mainMenu());
});

module.exports = travelScene;