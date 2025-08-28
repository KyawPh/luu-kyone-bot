require('dotenv').config();
const { Telegraf } = require('telegraf');

console.log('Testing bot connection...');
console.log('Token present:', !!process.env.BOT_TOKEN);
console.log('Token length:', process.env.BOT_TOKEN?.length);

if (!process.env.BOT_TOKEN) {
  console.error('BOT_TOKEN not found in .env');
  process.exit(1);
}

const bot = new Telegraf(process.env.BOT_TOKEN);

// Test connection by getting bot info
bot.telegram.getMe()
  .then(botInfo => {
    console.log('✅ Bot connected successfully!');
    console.log('Bot info:', {
      id: botInfo.id,
      username: botInfo.username,
      first_name: botInfo.first_name,
      can_join_groups: botInfo.can_join_groups,
      can_read_all_group_messages: botInfo.can_read_all_group_messages
    });
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Failed to connect:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  });