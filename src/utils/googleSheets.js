const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const { logger } = require('./logger');
const { config } = require('../config');

class GoogleSheetsService {
  constructor() {
    this.doc = null;
    this.sheet = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Check if Google Sheets is configured
      const sheetsId = process.env.GOOGLE_SHEETS_ID;
      if (!sheetsId) {
        logger.warn('Google Sheets ID not configured - content calendar disabled');
        return false;
      }

      // Initialize auth - try to use Firebase service account if available
      let serviceAccountAuth;
      
      // Option 1: Use separate Google service account credentials
      if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
        serviceAccountAuth = new JWT({
          email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
      } 
      // Option 2: Use existing Firebase credentials (they're also Google credentials)
      else if (config.firebase.credentialsBase64) {
        const credentials = JSON.parse(
          Buffer.from(config.firebase.credentialsBase64, 'base64').toString('utf-8')
        );
        serviceAccountAuth = new JWT({
          email: credentials.client_email,
          key: credentials.private_key,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
      }
      // Option 3: Use Firebase service account file
      else if (config.firebase.serviceAccountPath) {
        const credentials = require(config.firebase.serviceAccountPath);
        serviceAccountAuth = new JWT({
          email: credentials.client_email,
          key: credentials.private_key,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
      }
      // Option 4: Use individual Firebase credentials
      else if (config.firebase.clientEmail && config.firebase.privateKey) {
        serviceAccountAuth = new JWT({
          email: config.firebase.clientEmail,
          key: config.firebase.privateKey.replace(/\\n/g, '\n'),
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
      } else {
        logger.warn('No Google/Firebase credentials found - content calendar disabled');
        return false;
      }

      // Initialize the document
      this.doc = new GoogleSpreadsheet(sheetsId, serviceAccountAuth);
      await this.doc.loadInfo();
      
      // Get the first sheet (or you can get by title)
      this.sheet = this.doc.sheetsByIndex[0];
      
      // Ensure headers are set up
      await this.ensureHeaders();
      
      this.initialized = true;
      logger.info('Google Sheets content calendar initialized', {
        title: this.doc.title,
        sheetName: this.sheet.title,
        rowCount: this.sheet.rowCount
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to initialize Google Sheets', { error: error.message });
      return false;
    }
  }

  async ensureHeaders() {
    try {
      // Check if headers exist
      await this.sheet.loadHeaderRow();
      
      // If no headers, set them
      if (!this.sheet.headerValues || this.sheet.headerValues.length === 0) {
        await this.sheet.setHeaderRow([
          'Date',
          'Time', 
          'Type',
          'Title',
          'Message',
          'ImageUrl',
          'Tags',
          'Status',
          'Author',
          'Notes',
          'PostedAt'
        ]);
        logger.info('Content calendar headers created');
      }
    } catch (error) {
      // Headers might not exist, create them
      await this.sheet.setHeaderRow([
        'Date',
        'Time',
        'Type', 
        'Title',
        'Message',
        'ImageUrl',
        'Tags',
        'Status',
        'Author',
        'Notes',
        'PostedAt'
      ]);
      logger.info('Content calendar headers created');
    }
  }

  async getTodayContent() {
    if (!this.initialized) {
      const success = await this.initialize();
      if (!success) return [];
    }

    try {
      // Load all rows
      const rows = await this.sheet.getRows();
      
      // Get today's date in MM/DD/YYYY format
      const today = new Date();
      const todayStr = `${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}/${today.getFullYear()}`;
      
      // Filter for today's content that is approved
      const todayContent = rows
        .filter(row => {
          const rowDate = row.get('Date');
          const status = row.get('Status');
          return rowDate === todayStr && status === 'approved';
        })
        .map(row => ({
          date: row.get('Date'),
          time: row.get('Time'),
          type: row.get('Type'),
          title: row.get('Title'),
          message: row.get('Message'),
          imageUrl: row.get('ImageUrl'),
          tags: row.get('Tags'),
          status: row.get('Status'),
          author: row.get('Author'),
          notes: row.get('Notes'),
          rowIndex: row.rowIndex,
          row: row // Keep reference to update status later
        }));
      
      logger.info(`Found ${todayContent.length} content items for today`);
      return todayContent;
    } catch (error) {
      logger.error('Failed to get today content', { error: error.message });
      return [];
    }
  }

  async getContentForDate(date) {
    if (!this.initialized) {
      const success = await this.initialize();
      if (!success) return [];
    }

    try {
      const rows = await this.sheet.getRows();
      
      // Format date as MM/DD/YYYY
      const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
      
      const content = rows
        .filter(row => row.get('Date') === dateStr)
        .map(row => ({
          date: row.get('Date'),
          time: row.get('Time'),
          type: row.get('Type'),
          title: row.get('Title'),
          message: row.get('Message'),
          imageUrl: row.get('ImageUrl'),
          tags: row.get('Tags'),
          status: row.get('Status'),
          author: row.get('Author'),
          notes: row.get('Notes'),
          rowIndex: row.rowIndex
        }));
      
      return content;
    } catch (error) {
      logger.error('Failed to get content for date', { error: error.message, date });
      return [];
    }
  }

  async updateStatus(rowIndex, newStatus) {
    if (!this.initialized) {
      const success = await this.initialize();
      if (!success) return false;
    }

    try {
      const rows = await this.sheet.getRows();
      const row = rows.find(r => r.rowIndex === rowIndex);
      
      if (row) {
        row.set('Status', newStatus);
        if (newStatus === 'published') {
          row.set('PostedAt', new Date().toISOString());
        }
        await row.save();
        logger.info('Content status updated', { rowIndex, newStatus });
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Failed to update status', { error: error.message, rowIndex });
      return false;
    }
  }

  async getAllContent() {
    if (!this.initialized) {
      const success = await this.initialize();
      if (!success) return [];
    }

    try {
      const rows = await this.sheet.getRows();
      
      const content = rows.map(row => ({
        date: row.get('Date'),
        time: row.get('Time'),
        type: row.get('Type'),
        title: row.get('Title'),
        message: row.get('Message'),
        imageUrl: row.get('ImageUrl'),
        tags: row.get('Tags'),
        status: row.get('Status'),
        author: row.get('Author'),
        notes: row.get('Notes'),
        rowIndex: row.rowIndex,
        row: row
      }));
      
      return content;
    } catch (error) {
      logger.error('Failed to get all content', { error: error.message });
      return [];
    }
  }

  async getUnpublishedContent() {
    if (!this.initialized) {
      const success = await this.initialize();
      if (!success) return [];
    }

    try {
      const rows = await this.sheet.getRows();
      
      const content = rows
        .filter(row => {
          const status = row.get('Status');
          return status === 'draft' || status === 'approved';
        })
        .map(row => ({
          date: row.get('Date'),
          time: row.get('Time'),
          type: row.get('Type'),
          title: row.get('Title'),
          message: row.get('Message'),
          imageUrl: row.get('ImageUrl'),
          tags: row.get('Tags'),
          status: row.get('Status'),
          author: row.get('Author'),
          notes: row.get('Notes'),
          rowIndex: row.rowIndex,
          row: row
        }));
      
      return content;
    } catch (error) {
      logger.error('Failed to get unpublished content', { error: error.message });
      return [];
    }
  }

  async getContentByRows(rowIndices) {
    if (!this.initialized) {
      const success = await this.initialize();
      if (!success) return [];
    }

    try {
      const rows = await this.sheet.getRows();
      
      const content = rows
        .filter(row => rowIndices.includes(row.rowIndex))
        .map(row => ({
          date: row.get('Date'),
          time: row.get('Time'),
          type: row.get('Type'),
          title: row.get('Title'),
          message: row.get('Message'),
          imageUrl: row.get('ImageUrl'),
          tags: row.get('Tags'),
          status: row.get('Status'),
          author: row.get('Author'),
          notes: row.get('Notes'),
          rowIndex: row.rowIndex,
          row: row
        }));
      
      return content;
    } catch (error) {
      logger.error('Failed to get content by rows', { error: error.message, rowIndices });
      return [];
    }
  }

  async addContent(content) {
    if (!this.initialized) {
      const success = await this.initialize();
      if (!success) return false;
    }

    try {
      await this.sheet.addRow({
        Date: content.date,
        Time: content.time,
        Type: content.type,
        Title: content.title,
        Message: content.message,
        ImageUrl: content.imageUrl || '',
        Tags: content.tags || '',
        Status: content.status || 'draft',
        Author: content.author || 'Bot',
        Notes: content.notes || '',
        PostedAt: ''
      });
      
      logger.info('Content added to calendar', { title: content.title });
      return true;
    } catch (error) {
      logger.error('Failed to add content', { error: error.message });
      return false;
    }
  }
}

// Create singleton instance
const googleSheets = new GoogleSheetsService();

module.exports = {
  googleSheets,
  GoogleSheetsService
};