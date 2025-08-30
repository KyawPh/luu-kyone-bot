const { Scenes } = require('telegraf');
const { collections, storage } = require('../config/firebase');
const { 
  cityKeyboard, 
  categoryKeyboard, 
  urgencyKeyboard,
  confirmKeyboard,
  mainMenu,
  contactButton,
  skipKeyboard
} = require('../utils/keyboards');
const { 
  generatePostId,
  formatPostForChannel,
  escapeHtml,
  formatRoute
} = require('../utils/helpers');
const { CITIES, CATEGORIES, URGENCY_LEVELS } = require('../config/constants');
const { logger, logEvent } = require('../utils/logger');

const favorScene = new Scenes.BaseScene('favorScene');

favorScene.enter(async (ctx) => {
  // Initialize state with passed data or empty object
  ctx.scene.state = ctx.scene.state || {};
  
  // Log scene entry
  const userId = ctx.from.id.toString();
  logEvent.sceneEntered(userId, 'favorScene');
  
  const message = '📦 <b>Request a Personal Favor</b>\n\n' +
    'Step 1: Where does the item need to be picked up FROM?';
  
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
favorScene.action(/^city_(.+)$/, async (ctx) => {
  const city = ctx.match[1];
  await ctx.answerCbQuery();
  
  if (!ctx.scene.state.fromCity) {
    // First city selection (FROM)
    ctx.scene.state.fromCity = city;
    const cityName = Object.values(CITIES).find(c => c.code === city)?.name;
    
    await ctx.editMessageText(
      '📦 <b>Request a Personal Favor</b>\n\n' +
      `From: ${cityName}\n\n` +
      'Step 2: Where does the item need to be delivered TO?',
      { 
        parse_mode: 'HTML',
        ...cityKeyboard(city) // Exclude the FROM city
      }
    );
  } else {
    // Second city selection (TO)
    ctx.scene.state.toCity = city;
    const fromCityName = Object.values(CITIES).find(c => c.code === ctx.scene.state.fromCity)?.name;
    const toCityName = Object.values(CITIES).find(c => c.code === city)?.name;
    
    await ctx.editMessageText(
      '📦 <b>Request a Personal Favor</b>\n\n' +
      `Route: ${fromCityName} → ${toCityName}\n\n` +
      'Step 3: What category does your item belong to?',
      { 
        parse_mode: 'HTML',
        ...categoryKeyboard()
      }
    );
  }
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
    '📦 <b>Request a Personal Favor</b>\n\n' +
    `Route: ${fromCityName} → ${toCityName}\n\n` +
    '<b>Selected Categories:</b>\n' +
    selectedCats + '\n\n' +
    'Add more categories or confirm your selection:',
    { 
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          ...categoryRows,
          [
            { text: '✅ Confirm Categories', callback_data: 'confirm_categories' },
            { text: '❌ Cancel', callback_data: 'cancel' }
          ]
        ]
      }
    }
  );
});

// Handle category confirmation
favorScene.action('confirm_categories', async (ctx) => {
  await ctx.answerCbQuery();
  
  if (!ctx.scene.state.categories || ctx.scene.state.categories.length === 0) {
    return ctx.reply('❌ Please select at least one category.');
  }
  
  const fromCityName = Object.values(CITIES).find(c => c.code === ctx.scene.state.fromCity)?.name;
  const toCityName = Object.values(CITIES).find(c => c.code === ctx.scene.state.toCity)?.name;
  
  const selectedCats = ctx.scene.state.categories
    .map(id => CATEGORIES.find(c => c.id === id))
    .map(c => `${c.emoji} ${c.name}`)
    .join(', ');
  
  await ctx.editMessageText(
    '📦 <b>Request a Personal Favor</b>\n\n' +
    `Route: ${fromCityName} → ${toCityName}\n` +
    `Categories: ${selectedCats}\n\n` +
    'Step 4: How urgent is your request?',
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
  
  await ctx.editMessageText(
    '📦 <b>Request a Personal Favor</b>\n\n' +
    `Route: ${fromCityName} → ${toCityName}\n` +
    `Categories: ${selectedCats}\n` +
    `Urgency: ${urgency.emoji} ${urgency.label}\n\n` +
    'Step 5: Describe the item details (size, weight, contents, special handling):',
    { parse_mode: 'HTML' }
  );
  
  ctx.scene.state.waitingForDescription = true;
});

// Handle text input for description
favorScene.on('text', async (ctx) => {
  if (ctx.scene.state.waitingForDescription) {
    const description = ctx.message.text;
    
    if (description.length < 10) {
      return ctx.reply('❌ Please provide a more detailed description (at least 10 characters).');
    }
    
    if (description.length > 500) {
      return ctx.reply('❌ Description is too long. Please keep it under 500 characters.');
    }
    
    ctx.scene.state.description = description;
    ctx.scene.state.waitingForDescription = false;
    
    await ctx.reply(
      '📦 <b>Request a Personal Favor</b>\n\n' +
      'Step 6: Would you like to add a photo of the item?\n' +
      '<i>This helps travelers identify your item</i>',
      { 
        parse_mode: 'HTML',
        ...skipKeyboard()
      }
    );
    
    ctx.scene.state.waitingForPhoto = true;
  }
});

// Handle photo upload
favorScene.on('photo', async (ctx) => {
  if (ctx.scene.state.waitingForPhoto) {
    try {
      await ctx.reply('📸 Processing photo...');
      
      // Get the largest photo
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      const fileId = photo.file_id;
      
      // For now, we'll store the Telegram file ID
      // In production, you'd download and upload to Firebase Storage
      ctx.scene.state.photoUrl = fileId;
      ctx.scene.state.waitingForPhoto = false;
      
      await confirmFavorRequest(ctx);
    } catch (error) {
      logger.error('Error processing photo', { error: error.message });
      ctx.reply('❌ Failed to process photo. You can skip or try again.');
    }
  }
});

// Handle skip photo
favorScene.action('skip', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.scene.state.waitingForPhoto = false;
  await confirmFavorRequest(ctx);
});

// Show confirmation
async function confirmFavorRequest(ctx) {
  const fromCityName = Object.values(CITIES).find(c => c.code === ctx.scene.state.fromCity)?.name;
  const toCityName = Object.values(CITIES).find(c => c.code === ctx.scene.state.toCity)?.name;
  const urgency = URGENCY_LEVELS[ctx.scene.state.urgency];
  
  const selectedCats = ctx.scene.state.categories
    .map(id => CATEGORIES.find(c => c.id === id))
    .map(c => `${c.emoji} ${c.name}`)
    .join(', ');
  
  const summary = 
    '📦 <b>Review Your Favor Request</b>\n\n' +
    `<b>Route:</b> ${fromCityName} → ${toCityName}\n` +
    `<b>Categories:</b> ${selectedCats}\n` +
    `<b>Urgency:</b> ${urgency.emoji} ${urgency.label}\n` +
    `<b>Description:</b> ${escapeHtml(ctx.scene.state.description)}\n` +
    `<b>Photo:</b> ${ctx.scene.state.photoUrl ? 'Yes' : 'No'}\n\n` +
    'Post this favor request?';
  
  await ctx.reply(
    summary,
    { 
      parse_mode: 'HTML',
      ...confirmKeyboard('confirm_favor', 'cancel_favor')
    }
  );
}

// Confirm and post favor
favorScene.action('confirm_favor', async (ctx) => {
  await ctx.answerCbQuery();
  
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
      description: ctx.scene.state.description,
      photoUrl: ctx.scene.state.photoUrl || null,
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
      hasPhoto: !!ctx.scene.state.photoUrl
    });
    
    // Format message for channel
    const channelMessage = formatPostForChannel(favorRequest, 'favor');
    
    // Post to channel and save message ID
    try {
      let channelMsg;
      
      if (ctx.scene.state.photoUrl) {
        // Post with photo
        channelMsg = await ctx.telegram.sendPhoto(
          process.env.FREE_CHANNEL_ID,
          ctx.scene.state.photoUrl,
          {
            caption: channelMessage,
            parse_mode: 'HTML',
            ...contactButton(userId, 'favor', postId)
          }
        );
      } else {
        // Post without photo
        channelMsg = await ctx.telegram.sendMessage(
          process.env.FREE_CHANNEL_ID,
          channelMessage,
          {
            parse_mode: 'HTML',
            ...contactButton(userId, 'favor', postId)
          }
        );
      }
      
      // Save channel message ID for future updates
      await collections.favorRequests.doc(postId).update({
        channelMessageId: channelMsg.message_id,
        channelChatId: process.env.FREE_CHANNEL_ID
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
        '⚠️ <b>Note:</b> Your favor request was saved but couldn\'t be posted to the channel.\n\n' +
        'Please ensure the bot is added as admin to @LuuKyone_Community channel.',
        { parse_mode: 'HTML' }
      );
    }
    
    // Success message
    await ctx.editMessageText(
      '✅ <b>Favor Request Posted Successfully!</b>\n\n' +
      'Your request has been shared with the community.\n' +
      'Travelers on your route will be notified.\n\n' +
      `📌 <b>Reference:</b> ${postId}\n` +
      `<i>(Share this ID if someone asks about your request)</i>`,
      { parse_mode: 'HTML' }
    );
    
    // Show main menu
    setTimeout(() => {
      ctx.reply('What would you like to do next?', mainMenu());
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
    ctx.reply('❌ An error occurred while posting. Please try again.');
    logEvent.sceneLeft(userId, 'favorScene', 'error');
    ctx.scene.leave();
  }
});

// Handle cancel
favorScene.action(['cancel', 'cancel_favor'], async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText('❌ Favor request cancelled.');
  const userId = ctx.from.id.toString();
  logEvent.sceneLeft(userId, 'favorScene', 'cancelled');
  ctx.scene.leave();
  ctx.reply('What would you like to do?', mainMenu());
});

module.exports = favorScene;