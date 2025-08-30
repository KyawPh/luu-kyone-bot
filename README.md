# Luu Kyone Bot

Telegram bot for connecting travelers with people needing personal favors across Southeast Asian borders.

## Setup Instructions

### 1. Prerequisites
- Node.js 16+ installed
- Firebase project created
- Telegram Bot Token from @BotFather

### 2. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing
3. Enable Firestore Database
4. Enable Storage
5. Go to Project Settings > Service Accounts
6. Generate new private key
7. Save as `firebase-service-account.json` in project root

### 3. Telegram Bot Setup
1. Create bot via @BotFather on Telegram
2. Get your bot token
3. Create a public channel for free tier (e.g., @LuuKyone_Community)
4. Add your bot as admin to the channel

### 4. Environment Configuration
1. Copy `.env.example` to `.env`
2. Fill in your values:
```bash
BOT_TOKEN=your_bot_token_here
FREE_CHANNEL_ID=@LuuKyone_Community
PREMIUM_CHANNEL_ID=your_premium_channel_id
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
NODE_ENV=development
ADMIN_IDS=your_telegram_id
BOT_TIMEZONE=Asia/Yangon
```

### 5. Install & Run
```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Run in production
npm start
```

## Bot Commands
- `/start` - Start the bot and set up profile
- `/travel` - Share your travel plan
- `/favor` - Request a personal favor
- `/myposts` - Manage your active posts
- `/help` - Get help and guidelines

## Project Structure
```
/src
  /bot.js           - Main bot entry point
  /config           - Configuration files
    /index.js       - Main configuration
    /constants.js   - App constants (cities, categories, etc.)
    /messages.js    - All text messages (hybrid: English + Myanmar buttons)
    /firebase.js    - Firebase initialization
  /handlers         - Command and callback handlers
    /commands.js    - Command handlers
    /callbacks.js   - Button callback handlers
    /channel.js     - Channel event handlers
  /scenes           - Multi-step conversation flows
    /travel.js      - Travel plan creation flow
    /favor.js       - Favor request creation flow
    /settings.js    - User settings management
  /commands         - Individual command modules
    /myposts.js     - Post management functionality
  /utils            - Helper functions
    /helpers.js     - Utility functions
    /keyboards.js   - Keyboard layouts
    /logger.js      - Logging system
    /scheduler.js   - Scheduled tasks
```

## Phase 1 Features (Free Tier)
- ✅ User registration and profiles
- ✅ Travel plan posting with multi-category support
- ✅ Favor request posting with multi-category support
- ✅ Channel broadcasting with comment-based contact
- ✅ Comment notifications system
- ✅ 10 posts/month limit
- ✅ Single-step route selection
- ✅ Post management (complete/cancel)
- ✅ Daily summary notifications (optional)

## Phase 2 Features (Premium - Coming Soon)
- [ ] Premium membership system
- [ ] Payment verification
- [ ] Milestone tracking
- [ ] 30 posts/month for premium
- [ ] Advanced filtering and search

## Deployment

### Railway
1. Push to GitHub
2. Connect to Railway
3. Set environment variables
4. Deploy

### Local Development
Uses long polling in development mode. Switch to webhook for production.

## Support
For issues or questions, contact @luukyone_support