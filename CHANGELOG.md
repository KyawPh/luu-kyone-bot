# Changelog

All notable changes to the Luu Kyone Bot project will be documented in this file.

## [1.4.0] - 2025-01-03
[📖 Detailed Release Notes](docs/releases/v1.4.0-notes.md)

### Added
- **Google Sheets Content Calendar**: Complete integration for scheduled content management
  - 8 new content management commands for admins
  - Automatic daily scheduling at 2:00 AM
  - Support for timed posts with images
  - Template generation for weekly content
  - Status tracking (draft/approved/published)
- **Content Commands**:
  - `/content_today` - View scheduled content
  - `/content_browse` - Interactive browser
  - `/content_post` - Post single row
  - `/content_date` - Post by date
  - `/content_batch` - Post multiple rows
  - `/content_refresh` - Reload schedule
  - `/content_templates` - Generate templates
  - `/content_rows` - List all rows

### Changed
- **Content Management**: Migrated from hardcoded functions to Google Sheets
- **Command Names**: Renamed `/content_test` to `/content_post` for clarity
- **Message Structure**: Consolidated duplicate admin messages

### Removed
- **Hardcoded Content Functions**: Removed `sendDailyQuote()`, `sendGratitudePost()`, `sendSafetyReminder()`, `sendRouteHighlight()`
- **Test Commands**: Removed `/test_channel` and all related test callbacks
- **Duplicate Messages**: Cleaned up `accessDenied` and `menuError` duplicates

### Fixed
- **Row Indexing**: Fixed undefined rowIndex issue with google-spreadsheet library
- **Date Parsing**: Corrected MM/DD/YYYY date format handling
- **Message Paths**: Fixed incorrect message references in commands

## [1.3.2] - 2025-01-02
[📖 Detailed Release Notes](docs/releases/v1.3.2-notes.md)

### Added
- **Discussion Group Support**: Full support for comment notifications from discussion groups
- **Enhanced Notifications**: Clickable links to channel posts in comment notifications

### Changed
- **Welcome Messages**: Simplified from 6 lines to 2 lines, more concise and welcoming
- **Post IDs**: Display without dashes in notifications (e.g., #T369235)

### Removed
- **Contact System**: Removed 100+ lines of unused contact button code
- **Verbose Logging**: Reduced debug logging by 70%

### Fixed
- **Comment Notifications**: Now working properly with discussion group support
- **Message ID Mapping**: Proper handling between channel and discussion group messages

## [1.3.1] - 2025-01-01

### Added
- **Scene Utilities Module**: New `sceneUtils.js` module for consistent scene behavior
  - `buildSceneMessage()` - Unified message formatting across scenes
  - `handleSceneEntry()` - Standardized scene initialization
  - `handleSceneCancel()` - Consistent cancellation flow
  - `handleSceneError()` - Centralized error handling

### Changed
- **Myanmar Language Updates**: Enhanced Myanmar translations in messages
  - Updated back-to-menu greeting messages with better Myanmar phrasing
  - Refined button labels for better clarity
  - Improved scene navigation prompts
- **Scene Navigation Flow**: Smoother transitions in travel and favor scenes
  - Direct return to main menu on cancel without intermediate messages
  - Cleaner single-edit message updates throughout scene flow
  - Eliminated redundant message sending after scene completion

### Fixed
- **Message Flow**: Removed duplicate "What would you like to do?" messages after scene actions
- **Cancel Action**: Fixed cancel behavior to properly return to main menu with greeting

### Technical Improvements
- **Code Reusability**: Extracted common scene patterns to utility functions
- **Consistency**: Standardized scene behavior across travel and favor flows
- **Maintainability**: Centralized scene-related logic for easier updates

## [1.3.0] - 2024-12-31
[📖 Detailed Refactoring Notes](docs/releases/v1.3.0-refactoring.md)

### Added
- **Unified Command/Button Handlers**: Created shared handlers for consistent behavior across all interaction methods
  - Help, Travel, Favor, Profile, Settings, and Browse now use single source of truth
  - New `sharedHandlers.js` module containing all reusable handler functions
  - Centralized business logic with proper separation of concerns
- **Back to Menu Navigation**: Implemented clean single-message navigation
  - Profile, Browse, and Help screens now display "Back to Menu" button (🏠 မူလစာမျက်နှာ)
  - Eliminates message clutter in conversation history
  - Consistent navigation pattern across all non-scene views
- **Restored Main Menu Features**: 
  - Browse button (📋 ကြည့်ရှုရန်) restored to main menu
  - Profile button (👤 ပရိုဖိုင်) restored to main menu
  - Main menu now has 3 rows with 6 total options

### Changed
- **Clean UI/UX Flow**: Transformed from multi-message to single-message navigation
  - Cancel actions in Travel/Favor scenes return directly to main menu
  - Removed all `setTimeout()` calls that created duplicate messages
  - All interactions edit existing messages instead of sending new ones
  - Cleaner conversation history without message spam
- **Consistent Error Handling**: Standardized error handling across all handlers
  - Unified error messages and logging
  - Better error context for debugging
  - Graceful fallbacks for all error scenarios
- **Improved Code Organization**: 
  - Eliminated approximately 500 lines of duplicate code
  - Centralized validation and business logic
  - Better separation between UI behavior and business logic
  - Channel membership checks preserved for commands, skipped for buttons

### Fixed
- **Duplicate Command Bug**: Removed duplicate `/cleanup` command definition (was defined twice)
- **Channel Membership Logic**: Fixed inconsistent membership checking between commands and buttons
- **Message Formatting**: Ensured consistent use of `formatMessage()` utility across all handlers
- **Category Handling**: Browse handler now properly handles both single and multiple categories

### Technical Improvements
- **60% Code Reduction**: Reduced handler code duplication by unifying common patterns
- **Single Source of Truth**: Each feature now has one implementation used by both commands and buttons
- **Better Maintainability**: Changes only need to be made in one place
- **Consistent Behavior**: All handlers follow the same patterns and conventions
- **Performance**: Reduced require() calls by centralizing imports

## [1.2.0] - 2024-08-31
[📖 Detailed Release Notes](docs/releases/v1.2.0-notes.md)

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