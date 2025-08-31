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
   - Firestore for data persistence (users, posts, notifications)
   - Supports three authentication methods: Base64 encoded credentials, service account file path, or individual Firebase variables
   - Collections: `users`, `posts`, `notifications`

3. **Channel Broadcasting System**: 
   - Posts are broadcast to a Telegram channel (`FREE_CHANNEL_ID`)
   - Users interact through channel comments
   - Bot monitors channel for comment notifications

4. **Message Architecture**: 
   - All user-facing messages centralized in `config/messages.js`
   - Hybrid language approach: English content with Myanmar (Burmese) button labels
   - Dynamic message formatting with `formatMessage` utility

5. **Handler Structure**:
   - **commands.js**: Handles bot commands (/start, /travel, /favor, /myposts, /help)
   - **callbacks.js**: Processes inline keyboard button callbacks
   - **channel.js**: Manages channel events and comment notifications

6. **State Management**:
   - Session middleware for maintaining conversation state
   - Scene state for multi-step flows
   - Firebase for persistent user and post data

7. **User Limits & Tiers**:
   - Free tier: 10 posts/month
   - Premium tier (planned): 30 posts/month
   - Membership verification through channel subscription

8. **Scheduled Jobs** (`utils/scheduler.js`):
   - Daily summary notifications
   - Post expiration checks
   - Automated cleanup tasks

## Important Implementation Details

- **Post IDs**: Generated using custom format with timestamp and random suffix
- **Route Selection**: Single-step selection from predefined city pairs (CITIES constant)
- **Categories**: Multi-select from predefined categories (CATEGORIES constant)
- **Date Handling**: Uses moment.js with Asia/Yangon timezone
- **Logging**: Winston-based logging system with event tracking
- **Error Handling**: Global error handler with user-friendly messages
- **Channel Verification**: Bot must be admin in channel to verify user membership

## Environment Configuration

Required environment variables:
- `BOT_TOKEN`: Telegram bot token
- `FREE_CHANNEL_ID`: Channel ID for broadcasting
- Firebase credentials (one of three methods)

Optional:
- `ADMIN_IDS`: Admin user IDs (comma-separated)
- `NODE_ENV`: development/production
- `WEBHOOK_DOMAIN`: For production webhook mode