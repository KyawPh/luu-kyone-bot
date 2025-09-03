const cron = require('node-cron');
const { googleSheets } = require('./googleSheets');
const { logger } = require('./logger');
const { config } = require('../config');

class ContentScheduler {
  constructor() {
    this.scheduledTasks = new Map();
    this.bot = null;
  }

  setBot(bot) {
    this.bot = bot;
  }

  // Parse time string (HH:MM) to hour and minute
  parseTime(timeStr) {
    if (!timeStr) return null;
    
    const parts = timeStr.split(':');
    if (parts.length !== 2) return null;
    
    const hour = parseInt(parts[0]);
    const minute = parseInt(parts[1]);
    
    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return null;
    }
    
    return { hour, minute };
  }

  // Schedule a single content item
  scheduleContent(content) {
    const time = this.parseTime(content.time);
    if (!time) {
      logger.warn('Invalid time format for content', { 
        title: content.title, 
        time: content.time 
      });
      return false;
    }

    // Create cron expression for this specific time today
    const cronExpression = `${time.minute} ${time.hour} * * *`;
    
    // Create unique task ID
    const taskId = `content_${content.rowIndex}_${Date.now()}`;
    
    // Check if we're past this time today
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(time.hour, time.minute, 0, 0);
    
    if (scheduledTime <= now) {
      logger.info('Content time has passed for today, skipping', {
        title: content.title,
        scheduledTime: content.time
      });
      return false;
    }

    // Schedule the task
    const task = cron.schedule(cronExpression, async () => {
      await this.postContent(content);
      // Remove task after execution
      this.scheduledTasks.delete(taskId);
    }, {
      scheduled: false,
      timezone: config.bot.timezone
    });

    // Start the task
    task.start();
    
    // Store task reference
    this.scheduledTasks.set(taskId, {
      task,
      content,
      scheduledFor: scheduledTime
    });

    logger.info('Content scheduled', {
      title: content.title,
      time: content.time,
      type: content.type,
      taskId
    });

    return true;
  }

  // Post content to channel
  async postContent(content) {
    if (!this.bot) {
      logger.error('Bot not initialized for content scheduler');
      return false;
    }

    try {
      // Build the message
      let message = '';
      
      // Add title if exists
      if (content.title) {
        message += `<b>${content.title}</b>\n\n`;
      }
      
      // Add main message
      message += content.message || '';
      
      // Add tags if exist
      if (content.tags) {
        message += `\n\n${content.tags}`;
      }

      // Send message (with or without image)
      if (content.imageUrl) {
        // Send photo with caption
        await this.bot.telegram.sendPhoto(
          config.telegram.channelId,
          content.imageUrl,
          {
            caption: message,
            parse_mode: 'HTML'
          }
        );
      } else {
        // Send text only
        await this.bot.telegram.sendMessage(
          config.telegram.channelId,
          message,
          { parse_mode: 'HTML' }
        );
      }

      // Update status in sheet
      if (content.row) {
        content.row.set('Status', 'published');
        content.row.set('PostedAt', new Date().toISOString());
        await content.row.save();
      } else if (content.rowIndex) {
        await googleSheets.updateStatus(content.rowIndex, 'published');
      }

      logger.info('Content posted successfully', {
        title: content.title,
        type: content.type,
        author: content.author
      });

      return true;
    } catch (error) {
      logger.error('Failed to post content', {
        error: error.message,
        title: content.title
      });
      
      // Update status to error
      if (content.row) {
        content.row.set('Status', 'error');
        content.row.set('Notes', `Error: ${error.message}`);
        await content.row.save();
      }
      
      return false;
    }
  }

  // Load and schedule today's content
  async loadTodayContent() {
    try {
      logger.info('Loading today\'s content from Google Sheets');
      
      // Clear any existing scheduled tasks
      this.clearScheduledTasks();
      
      // Get today's content
      const todayContent = await googleSheets.getTodayContent();
      
      if (todayContent.length === 0) {
        logger.info('No content scheduled for today');
        return 0;
      }

      // Schedule each content item
      let scheduledCount = 0;
      for (const content of todayContent) {
        if (this.scheduleContent(content)) {
          scheduledCount++;
        }
      }

      logger.info(`Scheduled ${scheduledCount} content items for today`);
      return scheduledCount;
    } catch (error) {
      logger.error('Failed to load today content', { error: error.message });
      return 0;
    }
  }

  // Clear all scheduled tasks
  clearScheduledTasks() {
    for (const [taskId, taskInfo] of this.scheduledTasks) {
      taskInfo.task.stop();
    }
    this.scheduledTasks.clear();
    logger.info('Cleared all scheduled content tasks');
  }

  // Get scheduled content for preview
  getScheduledContent() {
    const scheduled = [];
    for (const [taskId, taskInfo] of this.scheduledTasks) {
      scheduled.push({
        title: taskInfo.content.title,
        time: taskInfo.content.time,
        type: taskInfo.content.type,
        scheduledFor: taskInfo.scheduledFor,
        author: taskInfo.content.author
      });
    }
    
    // Sort by time
    scheduled.sort((a, b) => a.scheduledFor - b.scheduledFor);
    return scheduled;
  }

  // Post content immediately (no scheduling)
  async postContentNow(content) {
    if (!this.bot) {
      logger.error('Bot not initialized for content scheduler');
      return false;
    }

    return await this.postContent(content);
  }

  // Post multiple content items immediately
  async postMultipleContent(contentItems) {
    if (!this.bot) {
      logger.error('Bot not initialized for content scheduler');
      return { success: 0, failed: 0 };
    }

    let successCount = 0;
    let failedCount = 0;

    for (const content of contentItems) {
      const success = await this.postContent(content);
      if (success) {
        successCount++;
      } else {
        failedCount++;
      }
      
      // Add small delay between posts to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    logger.info('Batch content posting completed', {
      success: successCount,
      failed: failedCount
    });

    return { success: successCount, failed: failedCount };
  }

  // Get content by row index from any date
  async getContentByRowIndex(rowIndex) {
    try {
      const allContent = await googleSheets.getAllContent();
      // The rowIndex from google-spreadsheet starts at 2 for first data row
      // So when user says row 2, they mean rowIndex 2
      const content = allContent.find(c => c.rowIndex === rowIndex);
      
      if (!content) {
        logger.debug('Content not found', { 
          requestedRowIndex: rowIndex,
          availableRows: allContent.map(c => ({ 
            rowIndex: c.rowIndex, 
            title: c.title,
            date: c.date
          }))
        });
      }
      
      return content || null;
    } catch (error) {
      logger.error('Failed to get content by row index', { 
        error: error.message,
        rowIndex 
      });
      return null;
    }
  }

  // Manually trigger content post (for testing)
  async postContentManually(rowIndex) {
    try {
      const content = await this.getContentByRowIndex(rowIndex);
      
      if (!content) {
        logger.warn('Content not found for manual posting', { rowIndex });
        return false;
      }

      return await this.postContent(content);
    } catch (error) {
      logger.error('Failed to post content manually', { 
        error: error.message,
        rowIndex 
      });
      return false;
    }
  }
}

// Create singleton instance
const contentScheduler = new ContentScheduler();

module.exports = {
  contentScheduler,
  ContentScheduler
};