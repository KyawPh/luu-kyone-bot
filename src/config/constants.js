const CITIES = {
  singapore: {
    code: 'SG',
    name: 'Singapore',
    currency: 'SGD',
    premiumPrice: 1.3,
    emoji: '🇸🇬'
  },
  bangkok: {
    code: 'BKK',
    name: 'Bangkok',
    currency: 'THB',
    premiumPrice: 33,
    emoji: '🇹🇭'
  },
  yangon: {
    code: 'YGN',
    name: 'Yangon',
    currency: 'MMK',
    premiumPrice: 4300,
    emoji: '🇲🇲'
  }
};

const CATEGORIES = [
  { id: 'medicine', name: 'Medicine', emoji: '💊' },
  { id: 'documents', name: 'Documents', emoji: '📄' },
  { id: 'food', name: 'Food', emoji: '🍜' },
  { id: 'electronics', name: 'Electronics', emoji: '📱' },
  { id: 'clothing', name: 'Clothing', emoji: '👕' },
  { id: 'books', name: 'Books', emoji: '📚' },
  { id: 'cosmetics', name: 'Cosmetics', emoji: '💄' },
  { id: 'gifts', name: 'Gifts', emoji: '🎁' },
  { id: 'other', name: 'Other', emoji: '📦' }
];

const URGENCY_LEVELS = {
  urgent: { label: 'Urgent (1-3 days)', emoji: '🚨' },
  normal: { label: 'Normal (4-7 days)', emoji: '⏰' },
  flexible: { label: 'Flexible (Anytime)', emoji: '😌' }
};

const LIMITS = {
  free: {
    postsPerMonth: 10,
    maxActiveRequests: 3
  },
  premium: {
    postsPerMonth: 30,
    maxActiveRequests: 10
  }
};

module.exports = {
  CITIES,
  CATEGORIES,
  URGENCY_LEVELS,
  LIMITS
};