const { Markup } = require('telegraf');
const { CITIES, CATEGORIES, URGENCY_LEVELS } = require('../config/constants');
const { messages } = require('../config/messages');

// Main menu keyboard
const mainMenu = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(messages.buttons.mainMenu.travel, 'create_travel'),
      Markup.button.callback(messages.buttons.mainMenu.favor, 'create_favor')
    ],
    [
      Markup.button.callback(messages.buttons.mainMenu.help, 'help'),
      Markup.button.callback(messages.buttons.mainMenu.settings, 'settings')
    ]
  ]);
};

// Route selection keyboard - shows all possible routes with bidirectional pairing
const routeKeyboard = () => {
  const buttons = [
    // Myanmar ↔ Singapore routes (prioritized)
    [
      Markup.button.callback('🇲🇲 YGN → 🇸🇬 SG', 'route_YGN_SG'),
      Markup.button.callback('🇸🇬 SG → 🇲🇲 YGN', 'route_SG_YGN')
    ],
    // Myanmar ↔ Bangkok routes
    [
      Markup.button.callback('🇲🇲 YGN → 🇹🇭 BKK', 'route_YGN_BKK'),
      Markup.button.callback('🇹🇭 BKK → 🇲🇲 YGN', 'route_BKK_YGN')
    ],
    // Singapore ↔ Bangkok routes
    [
      Markup.button.callback('🇸🇬 SG → 🇹🇭 BKK', 'route_SG_BKK'),
      Markup.button.callback('🇹🇭 BKK → 🇸🇬 SG', 'route_BKK_SG')
    ],
    // Cancel button
    [Markup.button.callback(messages.buttons.common.cancel, 'cancel')]
  ];
  
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
  
  buttons.push([Markup.button.callback(messages.buttons.common.cancel, 'cancel')]);
  return Markup.inlineKeyboard(buttons);
};

// Urgency selection keyboard
const urgencyKeyboard = () => {
  const buttons = Object.entries(URGENCY_LEVELS).map(([key, value]) => 
    [Markup.button.callback(`${value.emoji} ${value.label}`, `urgency_${key}`)]
  );
  buttons.push([Markup.button.callback(messages.buttons.common.cancel, 'cancel')]);
  return Markup.inlineKeyboard(buttons);
};

// Back/Cancel keyboard
const backKeyboard = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback(messages.buttons.common.back, 'back')],
    [Markup.button.callback(messages.buttons.common.cancel, 'cancel')]
  ]);
};

// Date navigation keyboard
const dateKeyboard = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(messages.buttons.date.today, 'date_today'),
      Markup.button.callback(messages.buttons.date.tomorrow, 'date_tomorrow')
    ],
    [Markup.button.callback(messages.buttons.date.custom, 'date_custom')],
    [Markup.button.callback(messages.buttons.common.cancel, 'cancel')]
  ]);
};

// Weight selection keyboard
const weightKeyboard = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(messages.buttons.weight.less1, 'weight_1'),
      Markup.button.callback(messages.buttons.weight.kg1to3, 'weight_3')
    ],
    [
      Markup.button.callback(messages.buttons.weight.kg3to5, 'weight_5'),
      Markup.button.callback(messages.buttons.weight.kg5to10, 'weight_10')
    ],
    [
      Markup.button.callback(messages.buttons.weight.more10, 'weight_more'),
      Markup.button.callback(messages.buttons.weight.custom, 'weight_custom')
    ],
    [Markup.button.callback(messages.buttons.common.cancel, 'cancel')]
  ]);
};

module.exports = {
  mainMenu,
  routeKeyboard,
  categoryKeyboard,
  urgencyKeyboard,
  backKeyboard,
  dateKeyboard,
  weightKeyboard
};