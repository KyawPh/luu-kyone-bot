const { Markup } = require('telegraf');
const { CITIES, CATEGORIES, URGENCY_LEVELS } = require('../config/constants');

// Main menu keyboard
const mainMenu = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('✈️ Travel', 'create_travel'),
      Markup.button.callback('📦 Favor', 'create_favor')
    ],
    [
      Markup.button.callback('🔍 Browse', 'browse_requests'),
      Markup.button.callback('👤 Profile', 'my_profile')
    ],
    [
      Markup.button.callback('📚 Help', 'help'),
      Markup.button.callback('⚙️ Settings', 'settings')
    ]
  ]);
};

// City selection keyboard
const cityKeyboard = (excludeCity = null) => {
  const buttons = Object.values(CITIES)
    .filter(city => city.code !== excludeCity)
    .map(city => [Markup.button.callback(`${city.emoji} ${city.name}`, `city_${city.code}`)]);
  
  buttons.push([Markup.button.callback('❌ Cancel', 'cancel')]);
  return Markup.inlineKeyboard(buttons);
};

// Category selection keyboard (2 columns layout)
const categoryKeyboard = () => {
  const buttons = [];
  
  // Create rows with 2 categories each
  for (let i = 0; i < CATEGORIES.length; i += 2) {
    const row = [];
    row.push(Markup.button.callback(`${CATEGORIES[i].emoji} ${CATEGORIES[i].name}`, `cat_${CATEGORIES[i].id}`));
    
    // Add second button if it exists
    if (i + 1 < CATEGORIES.length) {
      row.push(Markup.button.callback(`${CATEGORIES[i + 1].emoji} ${CATEGORIES[i + 1].name}`, `cat_${CATEGORIES[i + 1].id}`));
    }
    
    buttons.push(row);
  }
  
  buttons.push([Markup.button.callback('❌ Cancel', 'cancel')]);
  return Markup.inlineKeyboard(buttons);
};

// Urgency selection keyboard
const urgencyKeyboard = () => {
  const buttons = Object.entries(URGENCY_LEVELS).map(([key, value]) => 
    [Markup.button.callback(`${value.emoji} ${value.label}`, `urgency_${key}`)]
  );
  buttons.push([Markup.button.callback('❌ Cancel', 'cancel')]);
  return Markup.inlineKeyboard(buttons);
};

// Yes/No confirmation keyboard
const confirmKeyboard = (yesCallback = 'yes', noCallback = 'no') => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Yes', yesCallback),
      Markup.button.callback('❌ No', noCallback)
    ]
  ]);
};

// Back/Cancel keyboard
const backKeyboard = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('⬅️ Back', 'back')],
    [Markup.button.callback('❌ Cancel', 'cancel')]
  ]);
};

// Contact button for posts
const contactButton = (userId, postType, postId) => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('💬 Contact', `contact_${postType}_${postId}_${userId}`)]
  ]);
};

// Date navigation keyboard
const dateKeyboard = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('📅 Today', 'date_today'),
      Markup.button.callback('📅 Tomorrow', 'date_tomorrow')
    ],
    [Markup.button.callback('📅 Custom Date', 'date_custom')],
    [Markup.button.callback('❌ Cancel', 'cancel')]
  ]);
};

// Skip button
const skipKeyboard = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('⏭️ Skip', 'skip')],
    [Markup.button.callback('❌ Cancel', 'cancel')]
  ]);
};

// Weight selection keyboard
const weightKeyboard = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('< 1 kg', 'weight_1'),
      Markup.button.callback('1-3 kg', 'weight_3')
    ],
    [
      Markup.button.callback('3-5 kg', 'weight_5'),
      Markup.button.callback('5-10 kg', 'weight_10')
    ],
    [
      Markup.button.callback('> 10 kg', 'weight_more'),
      Markup.button.callback('✏️ Custom', 'weight_custom')
    ],
    [Markup.button.callback('❌ Cancel', 'cancel')]
  ]);
};

module.exports = {
  mainMenu,
  cityKeyboard,
  categoryKeyboard,
  urgencyKeyboard,
  confirmKeyboard,
  backKeyboard,
  contactButton,
  dateKeyboard,
  skipKeyboard,
  weightKeyboard
};