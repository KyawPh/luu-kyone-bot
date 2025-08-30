# Changelog

All notable changes to the Luu Kyone Bot project will be documented in this file.

## [1.2.0] - 2024-12-30

### Added
- **Comment-based Contact System**: Replaced direct contact buttons with channel comments
  - Users now comment on posts to express interest
  - Post owners receive notifications when someone comments
  - Notifications are kept minimal to avoid spam
- **Multi-Category Support**: Both travel plans and favor requests now support multiple categories
- **Single-Step Route Selection**: Simplified city selection from two steps to one
  - Combined FROM and TO selection into route selection
  - Using city codes (YGN, SG, BKK) instead of full names
  - Myanmar-related routes prioritized in the interface
- **Post Management**: Added `/myposts` command for users to manage their active posts
  - Mark posts as completed
  - Cancel active posts
  - Updates reflected in channel messages
- **Daily Summary Settings**: Users can now opt in/out of daily summary notifications
  - Connection alerts remain always-on (core feature)
  - Settings accessible via `/settings` command

### Changed
- **UI Language**: Hybrid approach - English messages with Myanmar button labels
- **Post Format**: Channel posts now show "💬 Comment below if interested" instead of contact button
- **Route Display**: Shows bidirectional routes in same row (e.g., YGN→SG | SG→YGN)
- **Configuration**: Centralized all configuration values
  - Admin IDs moved to environment variables
  - Timezone configuration added (BOT_TIMEZONE)
  - Constants consolidated in `/config/constants.js`

### Fixed
- **Post Limit Bug**: Fixed issue where users could bypass monthly limits via inline buttons
- **HTML Parsing Error**: Fixed invalid HTML in favor request channel messages
- **Code Duplication**: Extracted common patterns to utility functions
  - `checkChannelMembership()`
  - `isAdmin()`
  - `validateWeight()`
  - `validateCategories()`

### Removed
- **Browse Command**: Removed `/browse` command (not implemented)
- **Profile Command**: Removed `/profile` command (simplified flow)
- **Contact Buttons**: Removed "ဆက်သွယ်ရန်" buttons from channel posts
- **Rating System**: Postponed due to inability to track actual transaction completion

## [1.1.0] - 2024-12-24

### Added
- **Message Centralization**: All text messages moved to `/config/messages.js`
- **Notification System**: Simplified notification preferences
- **Weight Selection**: Added weight specification for both travel plans and favor requests

### Changed
- **Database Structure**: Updated to support multiple categories per post
- **Error Handling**: Improved error messages and logging

## [1.0.0] - 2024-12-20

### Initial Release
- User registration and profile creation
- Travel plan posting to community channel
- Favor request posting with urgency levels
- Monthly post limits (10 for free tier)
- Channel membership verification
- Basic command structure