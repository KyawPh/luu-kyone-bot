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
  { id: 'medicine', name: 'ဆေးဝါး', nameEn: 'Medicine', emoji: '💊' },
  { id: 'documents', name: 'စာရွက်စာတမ်း', nameEn: 'Documents', emoji: '📄' },
  { id: 'food', name: 'အစားအစာ', nameEn: 'Food', emoji: '🍜' },
  { id: 'electronics', name: 'လျှပ်စစ်ပစ္စည်း', nameEn: 'Electronics', emoji: '📱' },
  { id: 'clothing', name: 'အ၀တ်အစား', nameEn: 'Clothing', emoji: '👕' },
  // { id: 'books', name: 'စာအုပ်', nameEn: 'Books', emoji: '📚' },
  { id: 'cosmetics', name: 'အလှပြင်ပစ္စည်း', nameEn: 'Cosmetics', emoji: '💄' },
  // { id: 'gifts', name: 'ဆုလက်ဆောင်', nameEn: 'Gifts', emoji: '🎁' },
  { id: 'other', name: 'အခြား', nameEn: 'Other', emoji: '📦' }
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