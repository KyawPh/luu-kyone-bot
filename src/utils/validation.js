const moment = require('moment-timezone');
const { messages } = require('../config/messages');

/**
 * Validate weight input from user
 * @param {string} text - User input text
 * @returns {string|null} Formatted weight string or null if invalid
 */
const validateWeight = (text) => {
  const weightMatch = text.trim().match(/^(\d+)\s*(kg)?$/i);
  if (!weightMatch) {
    return null;
  }
  return `${weightMatch[1]} kg`;
};

/**
 * Validate that at least one category is selected
 * @param {Array} categories - Array of category IDs
 * @returns {boolean} True if valid
 */
const validateCategories = (categories) => {
  return categories && Array.isArray(categories) && categories.length > 0;
};

/**
 * Parse date from user input
 * @param {string} dateString - Date string in DD/MM/YYYY format
 * @returns {Date|null} Parsed date or null if invalid
 */
const parseDate = (dateString) => {
  const formats = ['DD/MM/YYYY', 'D/M/YYYY', 'DD-MM-YYYY', 'D-M-YYYY'];
  const date = moment(dateString, formats, true);
  
  if (!date.isValid()) {
    return null;
  }
  
  // Check if date is not in the past
  if (date.isBefore(moment().startOf('day'))) {
    return null;
  }
  
  return date.toDate();
};

/**
 * Validate user input based on scene state
 * @param {Object} ctx - Telegraf context
 * @param {string} text - User input text
 * @returns {Object} Validation result { isValid, data, error }
 */
const validateSceneInput = (ctx, text) => {
  const state = ctx.scene.state;
  
  // Validate weight input
  if (state.waitingForWeight) {
    const weight = validateWeight(text);
    if (!weight) {
      return {
        isValid: false,
        error: messages.validation.enterWeightNumber
      };
    }
    return {
      isValid: true,
      data: { weight }
    };
  }
  
  // Validate date input
  if (state.waitingForDate) {
    const date = parseDate(text);
    if (!date) {
      return {
        isValid: false,
        error: messages.validation.invalidDate
      };
    }
    return {
      isValid: true,
      data: { date }
    };
  }
  
  // No validation needed
  return {
    isValid: true,
    data: { text }
  };
};

/**
 * Validate post data before submission
 * @param {Object} postData - Post data to validate
 * @param {string} postType - 'travel' or 'favor'
 * @returns {Object} Validation result { isValid, errors }
 */
const validatePostData = (postData, postType) => {
  const errors = [];
  
  // Common validations
  if (!postData.fromCity || !postData.toCity) {
    errors.push('Route is required');
  }
  
  if (!validateCategories(postData.categories)) {
    errors.push(messages.validation.selectCategories);
  }
  
  // Travel-specific validations
  if (postType === 'travel') {
    if (!postData.departureDate) {
      errors.push('Departure date is required');
    }
    if (!postData.availableWeight) {
      errors.push('Available weight is required');
    }
  }
  
  // Favor-specific validations
  if (postType === 'favor') {
    if (!postData.urgency) {
      errors.push('Urgency level is required');
    }
    if (!postData.requestedWeight) {
      errors.push('Item weight is required');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateWeight,
  validateCategories,
  parseDate,
  validateSceneInput,
  validatePostData
};