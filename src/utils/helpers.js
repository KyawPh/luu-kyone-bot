const moment = require('moment-timezone');
const { CITIES, LIMITS } = require('../config/constants');
const { logger } = require('./logger');

// Check if user is a member of the community channel
const checkChannelMembership = async (bot, userId, channelId) => {
  try {
    const chatMember = await bot.telegram.getChatMember(channelId, userId);
    return ['member', 'administrator', 'creator'].includes(chatMember.status);
  } catch (error) {
    logger.error('Error checking membership', { error: error.message, userId });
    // If bot is not admin in channel or channel not found
    if (error.message.includes('chat not found') || error.message.includes('bot is not a member')) {
      return null; // Cannot check membership
    }
    return false;
  }
};

// Check if user is an admin
const isAdmin = (userId, adminIds) => {
  return adminIds.includes(userId.toString());
};


// Format date for display
const formatDate = (date) => {
  return moment(date).format('DD MMM YYYY');
};


// Get user's post count for the current month
const getMonthlyPostCount = async (userId, collections) => {
  const startOfMonth = moment().startOf('month').toDate();
  const endOfMonth = moment().endOf('month').toDate();
  
  // Note: Firestore requires composite indexes for compound queries with inequality operators
  // If these queries fail, create indexes or fall back to the in-memory filtering approach
  try {
    const [travelPlans, favorRequests] = await Promise.all([
      collections.travelPlans
        .where('userId', '==', userId)
        .where('createdAt', '>=', startOfMonth)
        .where('createdAt', '<=', endOfMonth)
        .get(),
      collections.favorRequests
        .where('userId', '==', userId)
        .where('createdAt', '>=', startOfMonth)
        .where('createdAt', '<=', endOfMonth)
        .get()
    ]);
    
    return travelPlans.size + favorRequests.size;
  } catch (error) {
    // Fallback to in-memory filtering if indexes are not set up
    logger.debug('Using fallback for getMonthlyPostCount - consider adding Firestore indexes', { error: error.message });
    
    const [travelPlans, favorRequests] = await Promise.all([
      collections.travelPlans
        .where('userId', '==', userId)
        .get(),
      collections.favorRequests
        .where('userId', '==', userId)
        .get()
    ]);
    
    // Filter by date in memory
    const travelCount = travelPlans.docs.filter(doc => {
      const createdAt = doc.data().createdAt.toDate();
      return createdAt >= startOfMonth && createdAt <= endOfMonth;
    }).length;
    
    const favorCount = favorRequests.docs.filter(doc => {
      const createdAt = doc.data().createdAt.toDate();
      return createdAt >= startOfMonth && createdAt <= endOfMonth;
    }).length;
    
    return travelCount + favorCount;
  }
};

// Check if user can create more posts
const canCreatePost = async (userId, isPremium, collections) => {
  const postCount = await getMonthlyPostCount(userId, collections);
  const limit = isPremium ? LIMITS.premium.postsPerMonth : LIMITS.free.postsPerMonth;
  
  return {
    canCreate: postCount < limit,
    remaining: limit - postCount,
    limit: limit,
    current: postCount
  };
};

// Format city pair for display
const formatRoute = (fromCity, toCity) => {
  const from = Object.values(CITIES).find(c => c.code === fromCity);
  const to = Object.values(CITIES).find(c => c.code === toCity);
  
  if (!from || !to) return 'Unknown Route';
  
  return `${from.emoji} ${from.name} → ${to.emoji} ${to.name}`;
};

// Generate user-friendly post ID (e.g., T-1234 for travel, F-5678 for favor)
const generatePostId = (type = 'T') => {
  // Generate a 4-digit number
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const timestamp = Date.now().toString(36).slice(-2).toUpperCase();
  return `${type}-${randomNum}${timestamp}`;
};

// Escape HTML for Telegram
const escapeHtml = (text) => {
  if (!text) return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, m => map[m]);
};

// Format post for channel broadcast (detailed and informative)
const formatPostForChannel = (post, postType, status = 'active') => {
  let message = '';
  const { CATEGORIES } = require('../config/constants');
  let hashtags = [];
  
  // Add status indicator based on current status
  let statusPrefix = '';
  if (status === 'completed') {
    statusPrefix = '✅ COMPLETED - ';
  } else if (status === 'cancelled') {
    statusPrefix = '❌ CANCELLED - ';
  } else if (status === 'expired') {
    statusPrefix = '⏰ EXPIRED - ';
  }
  
  if (postType === 'travel') {
    // Get category names with emojis from CATEGORIES constant
    const categoriesDisplay = post.categories
      .map(id => {
        const cat = CATEGORIES.find(c => c.id === id);
        return cat ? `${cat.emoji} ${cat.name}` : '';
      })
      .filter(c => c)
      .join(', ');
    
    message = `✈️ <b>${statusPrefix}Travel Plan${status === 'active' ? ' Available' : ''}</b>\n\n`;
    message += `<b>Route:</b> ${formatRoute(post.fromCity, post.toCity)}\n`;
    message += `<b>Date:</b> ${formatDate(post.departureDate)}\n`;
    
    if (status === 'active') {
      message += `<b>Available:</b> ${post.availableWeight}\n`;
      message += `<b>Can help with:</b> ${categoriesDisplay}\n\n`;
      message += `💬 Comment below if interested\n`;
      message += `📱 Post your travel: @luukyonebot`;
    } else if (status === 'completed') {
      message += `<b>Status:</b> Successfully completed on ${formatDate(post.completedAt || new Date())}\n`;
      message += `<b>Helper connected:</b> Yes ✅`;
    } else if (status === 'cancelled') {
      message += `<b>Status:</b> Cancelled by user on ${formatDate(post.cancelledAt || new Date())}`;
    } else if (status === 'expired') {
      message += `<b>Status:</b> Expired (departure date passed)`;
    }
    
    // Build hashtags
    hashtags.push('#travel');
    hashtags.push(`#${status}`);
    hashtags.push(`#${post.fromCity.toUpperCase()}_${post.toCity.toUpperCase()}`);
    
    // Add category hashtags
    post.categories.forEach(id => {
      hashtags.push(`#${id}`);
    });
    
    // Add post ID hashtag (remove dash for valid hashtag)
    const postIdTag = post.postId.replace('-', '');
    hashtags.push(`#${postIdTag}`);
    
    // Add month hashtag
    const postDate = post.departureDate.toDate ? post.departureDate.toDate() : post.departureDate;
    hashtags.push(`#${moment(postDate).format('MMM')}${moment(postDate).format('YYYY')}`);
    
  } else if (postType === 'favor') {
    // Get urgency label
    const { URGENCY_LEVELS } = require('../config/constants');
    const urgencyInfo = URGENCY_LEVELS[post.urgency];
    
    // Handle both old single category and new multiple categories
    let categoriesDisplay;
    let categoryIds = [];
    
    if (post.categories && Array.isArray(post.categories)) {
      // New format with multiple categories
      categoriesDisplay = post.categories
        .map(id => {
          const cat = CATEGORIES.find(c => c.id === id);
          categoryIds.push(id);
          return cat ? `${cat.emoji} ${cat.name}` : '';
        })
        .filter(c => c)
        .join(', ');
    } else if (post.category) {
      // Old format with single category
      const category = CATEGORIES.find(c => c.name === post.category);
      categoriesDisplay = category ? `${category.emoji} ${post.category}` : post.category;
      if (category) categoryIds.push(category.id);
    }
    
    message = `📦 <b>${statusPrefix}Favor Request</b>\n\n`;
    message += `<b>Route:</b> ${formatRoute(post.fromCity, post.toCity)}\n`;
    
    if (status === 'active') {
      message += `<b>Items:</b> ${categoriesDisplay}\n`;
      if (post.requestedWeight) {
        message += `<b>Weight:</b> ${post.requestedWeight}\n`;
      }
      message += `<b>Urgency:</b> ${urgencyInfo ? `${urgencyInfo.emoji} ${urgencyInfo.label}` : post.urgency}\n\n`;
      message += `💬 Comment below if interested\n`;
      message += `📦 Request delivery: @luukyonebot`;
    } else if (status === 'completed') {
      message += `<b>Items:</b> ${categoriesDisplay}\n`;
      message += `<b>Status:</b> Successfully delivered on ${formatDate(post.completedAt || new Date())}`;
    } else if (status === 'cancelled') {
      message += `<b>Status:</b> Cancelled by user on ${formatDate(post.cancelledAt || new Date())}`;
    } else if (status === 'expired') {
      const reason = post.urgency === 'urgent' ? 'urgency timeout' : 'time limit reached';
      message += `<b>Status:</b> Expired (${reason})`;
    }
    
    // Build hashtags
    hashtags.push('#favor');
    hashtags.push(`#${status}`);
    hashtags.push(`#${post.fromCity.toUpperCase()}_${post.toCity.toUpperCase()}`);
    hashtags.push(`#${post.urgency}`);
    
    // Add category hashtags
    categoryIds.forEach(id => {
      hashtags.push(`#${id}`);
    });
    
    // Add post ID hashtag (remove dash for valid hashtag)
    const postIdTag = post.postId.replace('-', '');
    hashtags.push(`#${postIdTag}`);
    
    // Add month hashtag
    const postDate = post.createdAt && post.createdAt.toDate ? post.createdAt.toDate() : (post.createdAt || new Date());
    hashtags.push(`#${moment(postDate).format('MMM')}${moment(postDate).format('YYYY')}`);
  }
  
  // Add hashtags for active posts
  if (status === 'active') {
    // Add post ID hashtag for reference
    const postIdTag = post.postId.replace('-', '');
    hashtags.push(`#${postIdTag}`);
    
    // Add all hashtags at the bottom
    message += `\n\n${hashtags.join(' ')}`;
  } else if (status === 'completed') {
    message += '\n\nThank you for spreading kindness! 💚';
  } else if (status === 'cancelled' || status === 'expired') {
    message += '\n\nThis post is no longer active.';
  }
  
  return message;
};

// Check if user wants daily summaries (simplified)
const userWantsDailySummary = async (userId, collections) => {
  try {
    const userDoc = await collections.users.doc(userId).get();
    if (!userDoc.exists) {
      return true; // Default to true for new users
    }
    
    const user = userDoc.data();
    // Default to true if not explicitly set to false
    return user.settings?.dailySummary !== false;
  } catch (error) {
    // Return default if error
    return true;
  }
};


// Re-export validation functions from validation module for backward compatibility
const { validateWeight, validateCategories, parseDate } = require('./validation');

module.exports = {
  formatDate,
  parseDate,
  getMonthlyPostCount,
  canCreatePost,
  formatRoute,
  generatePostId,
  escapeHtml,
  formatPostForChannel,
  userWantsDailySummary,
  checkChannelMembership,
  isAdmin,
  validateWeight,
  validateCategories
};