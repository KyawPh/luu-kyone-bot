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
  escapeHtml
} = require('../utils/helpers');
const { CITIES, CATEGORIES, URGENCY_LEVELS } = require('../config/constants');

const favorScene = new Scenes.BaseScene('favorScene');

favorScene.enter(async (ctx) => {
  // Initialize state with passed data or empty object
  ctx.scene.state = ctx.scene.state || {};
  
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
  
  const category = CATEGORIES.find(c => c.id === categoryId);
  ctx.scene.state.category = category.name;
  
  const fromCityName = Object.values(CITIES).find(c => c.code === ctx.scene.state.fromCity)?.name;
  const toCityName = Object.values(CITIES).find(c => c.code === ctx.scene.state.toCity)?.name;
  
  await ctx.editMessageText(
    '📦 <b>Request a Personal Favor</b>\n\n' +
    `Route: ${fromCityName} → ${toCityName}\n` +
    `Category: ${category.emoji} ${category.name}\n\n` +
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
  const category = CATEGORIES.find(c => c.name === ctx.scene.state.category);
  
  await ctx.editMessageText(
    '📦 <b>Request a Personal Favor</b>\n\n' +
    `Route: ${fromCityName} → ${toCityName}\n` +
    `Category: ${category.emoji} ${ctx.scene.state.category}\n` +
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
      console.error('Error processing photo:', error);
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
  const category = CATEGORIES.find(c => c.name === ctx.scene.state.category);
  const urgency = URGENCY_LEVELS[ctx.scene.state.urgency];
  
  const summary = 
    '📦 <b>Review Your Favor Request</b>\n\n' +
    `<b>Route:</b> ${fromCityName} → ${toCityName}\n` +
    `<b>Category:</b> ${category.emoji} ${ctx.scene.state.category}\n` +
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
      category: ctx.scene.state.category,
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
    
    // Format message for channel
    const channelMessage = formatPostForChannel(favorRequest, 'favor');
    
    // Post to channel
    try {
      if (ctx.scene.state.photoUrl) {
        // Post with photo
        await ctx.telegram.sendPhoto(
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
        await ctx.telegram.sendMessage(
          process.env.FREE_CHANNEL_ID,
          channelMessage,
          {
            parse_mode: 'HTML',
            ...contactButton(userId, 'favor', postId)
          }
        );
      }
    } catch (error) {
      console.error('Failed to post to channel:', error);
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
    ctx.scene.leave();
  } catch (error) {
    console.error('Error posting favor request:', error);
    ctx.reply('❌ An error occurred while posting. Please try again.');
    ctx.scene.leave();
  }
});

// Handle cancel
favorScene.action(['cancel', 'cancel_favor'], async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText('❌ Favor request cancelled.');
  ctx.scene.leave();
  ctx.reply('What would you like to do?', mainMenu());
});

module.exports = favorScene;