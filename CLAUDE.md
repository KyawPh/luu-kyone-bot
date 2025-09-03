# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- **Run bot in development mode**: `npm run dev` (uses nodemon for auto-restart)
- **Run bot in production**: `npm start`
- **No test framework**: Currently no tests configured (`npm test` exits with error)

### Data Management Scripts
- **Clear all test data**: `npm run clear:all`
- **Clear posts only**: `npm run clear:posts`
- **Clear users only**: `npm run clear:users`
- **Dry run (preview changes)**: `npm run clear:dry`
- **Clear specific user**: `npm run clear:user`

## Architecture Overview

### Core Bot Architecture
This is a Telegram bot built with Telegraf framework that connects travelers with people needing personal favors across Southeast Asian borders. The bot follows a scene-based conversation flow pattern.

### Key Architectural Patterns

1. **Scene-Based Conversation Flow**: The bot uses Telegraf's Scenes to manage multi-step conversations for travel plans and favor requests. Each scene (`travel.js`, `favor.js`, `settings.js`) maintains its own state through the conversation flow.

2. **Firebase Integration**: 
   - Firestore for data persistence
   - Supports three authentication methods: Base64 encoded credentials, service account file path, or individual Firebase variables
   - Collections: `users`, `travelPlans`, `favorRequests`

3. **Channel Broadcasting System**: 
   - Posts are broadcast to a Telegram channel (`FREE_CHANNEL_ID`)
   - Discussion group support for comment notifications (`FREE_DISCUSSION_GROUP_ID`)
   - Bot monitors both channel and discussion group for comment notifications
   - Automatic notification to post owners when someone comments

4. **Message Architecture**: 
   - All user-facing messages centralized in `config/messages.js`
   - Hybrid language approach: English content with Myanmar (Burmese) button labels
   - Dynamic message formatting with `formatMessage` utility

5. **Handler Structure**:
   - **commands.js**: Handles all bot commands including user commands and admin content management
   - **callbacks.js**: Processes inline keyboard button callbacks
   - **channel.js**: Manages channel events, discussion group comments, and member join notifications
   - **sharedHandlers.js**: Common handler logic shared between commands and callbacks

6. **State Management**:
   - Session middleware for maintaining conversation state
   - Scene state for multi-step flows
   - Firebase for persistent user and post data

7. **User Limits & Tiers**:
   - Free tier: 10 posts/month
   - Premium tier (planned): 30 posts/month
   - Membership verification through channel subscription

8. **Scheduled Jobs** (`utils/scheduler.js`):
   - Morning summary (9:00 AM)
   - Evening summary (6:00 PM)
   - Content calendar check (2:00 AM) - loads Google Sheets content
   - Post expiration cleanup (2:00 AM)
   
9. **Google Sheets Integration** (`utils/googleSheets.js`, `utils/contentScheduler.js`):
   - Content calendar management
   - Automatic scheduling of approved content
   - Support for timed posts with images
   - Template generation for weekly content

## Important Implementation Details

- **Post IDs**: Generated using custom format (T-XXXX for travel, F-XXXX for favor) with timestamp suffix
- **Route Selection**: Single-step selection from predefined city pairs (CITIES constant)
- **Categories**: Multi-select from predefined categories (CATEGORIES constant)
- **Date Handling**: Uses moment.js with Asia/Yangon timezone
- **Logging**: Winston-based logging system with event tracking
- **Error Handling**: Global error handler with user-friendly messages
- **Channel Verification**: Bot must be admin in channel to verify user membership
- **Comment Notifications**: Supports both channel comments and discussion group replies
- **Anonymous Comments**: Handles anonymous comments from GroupAnonymousBot
- **Post Links**: Generates clickable links to channel posts in notifications

## Environment Configuration

Required environment variables:
- `BOT_TOKEN`: Telegram bot token
- `FREE_CHANNEL_ID`: Channel ID for broadcasting
- Firebase credentials (one of three methods):
  - `FIREBASE_CREDENTIALS_BASE64`: Base64 encoded service account JSON
  - `FIREBASE_SERVICE_ACCOUNT_PATH`: Path to service account JSON file
  - Individual credentials: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

Optional:
- `FREE_DISCUSSION_GROUP_ID`: Discussion group ID for comment notifications
- `ADMIN_IDS`: Admin user IDs (comma-separated)
- `NODE_ENV`: development/production (default: development)
- `WEBHOOK_DOMAIN`: For production webhook mode
- `PORT`: Server port (default: 3000)
- `FREE_POSTS_PER_MONTH`: Monthly post limit for free users (default: 10)
- `PREMIUM_POSTS_PER_MONTH`: Monthly post limit for premium users (default: 30)
- `SESSION_TIMEOUT_MINUTES`: Session timeout in minutes (default: 30)
- `BOT_TIMEZONE`: Bot timezone (default: Asia/Singapore)
- `GOOGLE_SHEETS_ID`: Google Sheet ID for content calendar
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: For Google Sheets (if not using Firebase credentials)
- `GOOGLE_PRIVATE_KEY`: For Google Sheets (if not using Firebase credentials)