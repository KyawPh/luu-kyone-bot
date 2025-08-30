const moment = require('moment-timezone');
const { CITIES, LIMITS } = require('../config/constants');

// Format date for display
const formatDate = (date) => {
  return moment(date).format('DD MMM YYYY');
};

// Parse date from user input (DD/MM/YYYY)
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

// Get user's post count for the current month
const getMonthlyPostCount = async (userId, collections) => {
  const startOfMonth = moment().startOf('month').toDate();
  const endOfMonth = moment().endOf('month').toDate();
  
  // Simplified queries - get all by userId first, then filter in memory
  const [travelPlans, favorRequests] = await Promise.all([
    collections.travelPlans
      .where('userId', '==', userId)
      .get(),
    collections.favorRequests
      .where('userId', '==', userId)
      .get()
  ]);
  
  // Filter by date in memory to avoid complex index requirements
  const travelCount = travelPlans.docs.filter(doc => {
    const createdAt = doc.data().createdAt.toDate();
    return createdAt >= startOfMonth && createdAt <= endOfMonth;
  }).length;
  
  const favorCount = favorRequests.docs.filter(doc => {
    const createdAt = doc.data().createdAt.toDate();
    return createdAt >= startOfMonth && createdAt <= endOfMonth;
  }).length;
  
  return travelCount + favorCount;
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

// Format post for channel broadcast (compact and private)
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
      message += `<b>Can help with:</b> ${categoriesDisplay}`;
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
    
    message = `📦 <b>${statusPrefix}Favor Request${status === 'active' ? '' : ''}</b>\n\n`;
    message += `<b>Route:</b> ${formatRoute(post.fromCity, post.toCity)}\n`;
    
    if (status === 'active') {
      message += `<b>Items:</b> ${categoriesDisplay}\n`;
      message += `<b>Urgency:</b> ${urgencyInfo ? `${urgencyInfo.emoji} ${urgencyInfo.label}` : post.urgency}`;
      if (post.description) {
        const shortDesc = post.description.length > 80 
          ? post.description.substring(0, 80) + '...'
          : post.description;
        message += `\n<b>Details:</b> ${escapeHtml(shortDesc)}`;
      }
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
  
  // Add thank you message for completed posts
  if (status === 'completed') {
    message += '\n\nThank you for spreading kindness! 💚';
  } else if (status === 'cancelled' || status === 'expired') {
    message += '\n\nThis post is no longer active.';
  }
  
  // Add all hashtags at the bottom
  message += `\n\n${hashtags.join(' ')}`;
  
  return message;
};

// Check if dates overlap
const datesOverlap = (start1, end1, start2, end2) => {
  return moment(start1).isSameOrBefore(end2) && moment(end1).isSameOrAfter(start2);
};

// Match travel plans with favor requests
const findMatches = (travelPlan, favorRequests) => {
  return favorRequests.filter(request => {
    // Check route match (both FROM and TO cities must match)
    if (request.fromCity !== travelPlan.fromCity || request.toCity !== travelPlan.toCity) {
      return false;
    }
    
    // Check category match
    if (!travelPlan.categories.includes(request.category)) return false;
    
    // Check date compatibility (favor needed before traveler departs)
    const favorDeadline = moment(request.createdAt).add(
      request.urgency === 'urgent' ? 3 : 
      request.urgency === 'normal' ? 7 : 30, 
      'days'
    );
    
    return moment(travelPlan.departureDate).isSameOrBefore(favorDeadline);
  });
};

module.exports = {
  formatDate,
  parseDate,
  getMonthlyPostCount,
  canCreatePost,
  formatRoute,
  generatePostId,
  escapeHtml,
  formatPostForChannel,
  datesOverlap,
  findMatches
};