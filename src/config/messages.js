// Centralized message configuration for easy maintenance
// Messages in English, Buttons in Myanmar

const messages = {
  // Note: Cities, Categories, and Urgency data are defined in constants.js
  // This file only contains display messages and button labels
  
  // Weight Options
  weightOptions: {
    less1: '< 1 kg',
    kg1to3: '1-3 kg', 
    kg3to5: '3-5 kg',
    kg5to10: '5-10 kg',
    more10: '> 10 kg'
  },
  
  // Button Labels (KEEP IN MYANMAR)
  buttons: {
    mainMenu: {
      travel: '✈️ ခရီးစဥ်',
      favor: '📦 ပါဆယ်',
      help: '📚 အကူအညီ',
      settings: '⚙️ ဆက်တင်'
    },
    common: {
      cancel: '❌ မလုပ်တော့ပါ',
      back: '⬅️ နောက်သို့',
      skip: '⏭️ ကျော်သွားရန်',
      confirm: '✅ အတည်ပြုမည်',
      confirmCategories: '✅ အတည်ပြုမည်',
      confirmPost: '✅ အတည်ပြုမည်',
      yes: '✅ ဟုတ်ကဲ့',
      no: '❌ မဟုတ်ပါ',
      contact: '💬 ဆက်သွယ်ရန်'
    },
    date: {
      today: '📅 ဒီနေ့',
      tomorrow: '📅 မနက်ဖြန်',
      custom: '📅 ရက်စွဲ ရွေးရန်'
    },
    weight: {
      less1: '< ၁ ကီလို',
      kg1to3: '၁-၃ ကီလို',
      kg3to5: '၃-၅ ကီလို',
      kg5to10: '၅-၁၀ ကီလို',
      more10: '> ၁၀ ကီလို',
      custom: '✏️ Custom'
    },
    membership: {
      joinChannel: '📢 Community Channel သို့ ဝင်ရန်',
      checkJoined: '✅ ဝင်ပြီးပါပြီ'
    }
  },

  // Scene Messages (MYANMAR)
  scenes: {
    travel: {
      title: '✈️ <b>ခရီးစဉ်ကို မျှဝေပါ</b>',
      steps: {
        selectRoute: 'သင်သွားမယ့် ခရီးစဉ်လမ်းကြောင်းကို ရွေးချယ်ပါ',
        departure: 'Step 2: ထွက်ခွာမယ့် ရက်စွဲကို ရွေးချယ်ပါ',
        departureCustom: 'Step 2: ထွက်ခွာမယ့် ရက်စွဲကို ပြသထားသော ပုံစံအတိုင်း ဖြည့်ပေးပါ\nDD/MM/YYYY:',
        weight: 'Step 3: သယ်ယူနိုင်သော အလေးချိန်ကို ရွေးချယ်ပါ',
        weightCustom: 'Step 3: သယ်ယူနိုင်သော အလေးချိန်ကို kg ဖြင့်ထည့်ပါ  (e.g., "20" or "20 kg"):',
        categories: 'Step 4: သယ်ယူရန် အဆင်ပြေသော ပစ္စည်းအမျိုးအစားကို ရွေးချယ်ပါ။ တစ်ခုထပ်ပို၍ ရွေးချယ်နိုင်ပါသည်။'
      },
      categorySelection: {
        title: 'ရွေးချယ်ထားသော ပစ္စည်းအမျိုးအစားများ - ',
        prompt: 'တစ်ခုထပ်ပို၍ ရွေးချယ်ပါ (သို့) အတည်ပြု၍ ရှေ့ဆက်ပါ'
      },
      confirmation: {
        title: '✅ <b>ခရီးစဉ်ပြုလုပ်မှု အောင်မြင်ပါသည်။</b>',
        reference: '📌 <b>Reference:</b> {postId}\n<i>(Share this ID if someone asks about your post)</i>'
      },
      cancelled: '❌ ခရီးစဉ်ကို မပြုလုပ်တော့ပါ။',
      whatToDo: 'လုပ်ဆောင်လိုသည်ကို ရွေးချယ်ပါ?',
      errorPosting: '❌ An error occurred while posting. Please try again.'
    },
    
    favor: {
      title: '📦 <b>ပစ္စည်းပို့ရန် တောင်းဆိုပါ</b>',
      steps: {
        selectRoute: 'ပစ္စည်းပို့မည့် ခရီးစဉ်လမ်းကြောင်းကို ရွေးချယ်ပါ',
        categories: 'Step 2: ပို့ဆောင်လိုသော ပစ္စည်းအမျိုးအစားကို ရွေးချယ်ပါ။ တစ်ခုထပ်ပို၍ ရွေးချယ်နိုင်ပါသည်။?',
        urgency: 'Step 3: ပို့လိုသော အချိန် အပိုင်းအခြား တစ်ခုကို ရွေးချယ်ပါ',
        weight: 'Step 4: ပစ္စည်း အလေးချိန်ကို ရွေးချယ်ပါ?',
        weightCustom: 'Step 4: ပစ္စည်း အလေးချိန်ကို kg ဖြင့်ထည့်ပါ (e.g., "20" or "20 kg"):'
      },
      categorySelection: {
        title: 'ရွေးချယ်ထားသော ပစ္စည်းအမျိုးအစားများ -',
        prompt: 'တစ်ခုထပ်ပို၍ ရွေးချယ်ပါ (သို့) အတည်ပြု၍ ရှေ့ဆက်ပါ'
      },
      confirmation: {
        title: '✅ <b>ပစ္စည်းပို့ရန် ပြုလုပ်မှု အောင်မြင်ပါသည်။</b>',
        reference: '📌 <b>Reference:</b> {postId}\n<i>(Share this ID if someone asks about your request)</i>'
      },
      cancelled: '❌ ပစ္စည်းပို့ရန်တောင်းဆိုမှုကို မပြုလုပ်တော့ပါ။',
      whatToDo: 'လုပ်ဆောင်လိုသည်ကို ရွေးချယ်ပါ?',
      errorPosting: '❌ An error occurred while posting. Please try again.'
    }
  },

  // Welcome Messages (ENGLISH)
  welcome: {
    newUser: {
      title: '💚 <b>Welcome to Our Kindness Community!</b>',
      greeting: 'Hi {userName}! You\'ve just joined something special.',
      intro: 'Luu Kyone (လူကြုံ) connects Myanmar travelers worldwide. We\'re neighbors helping neighbors with personal favors - not a delivery service.',
      benefits: {
        title: '<b>What you can do:</b>',
        travel: '✈️ <b>Traveling?</b> - Turn empty luggage space into someone\'s happiness',
        favor: '📦 <b>Need help?</b> - Kind travelers are ready to assist',
        connect: '🤝 <b>Connect</b> - Arrange thank-you gifts directly'
      },
      start: '🚀 Ready to get started!',
      joinChannel: '📢 First, you need to join @LuuKyone_Community'
    },
    
    returningUser: {
      title: '✅ <b>Welcome back to the kindness network!</b>',
      greeting: '{userName}, great to see you again! 🤗',
      prompt: 'Our community is growing stronger every day.\nReady to share or receive kindness?',
      motto: '💚 <i>"Every act of kindness creates a ripple"</i>'
    },
    
    notMember: {
      title: '📢 <b>Join Our Community First</b>',
      description: 'To use Luu Kyone Bot, you need to join our community channel first.',
      steps: {
        title: '<b>How to join:</b>',
        step1: '1️⃣ Go to @LuuKyone_Community',
        step2: '2️⃣ Click "Join"',
        step3: '3️⃣ Come back here and click "I\'ve Joined"'
      },
      button: 'Open channel and join!'
    }
  },

  // Common Messages (ENGLISH)
  common: {
    genericError: '❌ An error occurred. Please try again.',
    operationCancelled: '❌ Operation cancelled.',
    whatToDo: 'What would you like to do?',
    howSpreadKindness: 'How can we spread kindness today?',
    startBotFirst: 'Please start the bot first with /start',
    startBotFirstAlert: '❌ Please start the bot first: @luukyonebot',
    ownPostsOnly: '❌ You can only manage your own posts.',
    failedToSend: '❌ Failed to send: {error}',
    botAdminRequired: '⚠️ Make sure bot is admin in channel!'
  },

  // Admin Messages (ENGLISH)
  admin: {
    adminOnly: '❌ This command is for admins only.',
    runningCleanup: '🧹 Running cleanup job...',
    cleanupCompleted: '✅ Cleanup completed! Check logs for details.',
    cleanupFailed: '❌ Cleanup failed: {error}',
    errorAccessingMenu: '❌ Error accessing test menu.'
  },

  // Test Command Messages (ENGLISH)
  test: {
    welcomeMessageSent: '✅ Test welcome message sent to channel!',
    dailyQuoteSent: '✅ Daily quote sent to channel!',
    summaryTitle: '📊 <b>Test Daily Summary</b>\n\nSelect which summary to test:',
    milestoneMessageSent: '✅ Test milestone message sent to channel!',
    gratitudePostSent: '✅ Test gratitude post sent to channel!',
    safetyReminderSent: '✅ Test safety reminder sent to channel!',
    routeHighlightSent: '✅ Test route highlight sent to channel!',
    sendingWelcome: 'Sending test welcome message...',
    sendingQuote: 'Sending daily quote...',
    sendingMilestone: 'Sending milestone celebration...',
    sendingGratitude: 'Sending gratitude post...',
    sendingSafety: 'Sending safety reminder...',
    sendingHighlight: 'Sending route highlight...'
  },

  // System Messages (ENGLISH)
  system: {
    channelMembershipRequired: '📢 First, you need to join @LuuKyone_Community',
    checkMembership: 'Checking channel membership...',
    savingPost: 'Saving your post...',
    postingToChannel: 'Posting to community channel...'
  },

  // Validation Messages (ENGLISH)
  validation: {
    selectCategories: '❌ Please select at least one category.',
    enterWeightNumber: '❌ Please enter weight as a number in kg (e.g., "20" or "20 kg")',
    invalidDate: '❌ Invalid date format or date is in the past.\nPlease enter in format DD/MM/YYYY:',
    invalidWeight: '❌ Invalid weight format. Please enter as a number (e.g., "20" or "20 kg")'
  },

  // Error Messages (ENGLISH)
  errors: {
    generic: '❌ An error occurred. Please try again.',
    notMember: '❌ Please join the community channel first.',
    limitReached: '❌ You\'ve reached this month\'s post limit ({limit} posts).',
    invalidDate: '❌ Invalid date format or date is in the past.\nPlease enter in format DD/MM/YYYY:',
    invalidWeight: '❌ Invalid weight format. Please enter as a number (e.g., "20" or "20 kg")',
    noActivePost: '📭 No active posts at the moment. Check back later!',
    categoryRequired: '❌ Please select at least one category.',
    postNotFound: '❌ Post not found.',
    cannotContactSelf: '❌ You cannot contact yourself!',
    alreadyContacted: '❌ You\'ve already been introduced for this post. Free tier allows one-time introduction only.',
    channelPostFailed: '⚠️ <b>Note:</b> Your post was saved but couldn\'t be posted to the channel.\n\nPlease ensure the bot is added as admin to @LuuKyone_Community channel.',
    chatNotFound: '❌ Chat not found. User might have blocked or deleted the bot.'
  },

  // Help Messages (ENGLISH)
  help: {
    title: '📚 <b>How to Use Luu Kyone Bot</b>',
    intro: {
      title: '<b>What is Luu Kyone?</b>',
      description: 'Connects kind travelers with people needing personal favors.\nBuilt on trust and community kindness.\nNot a commercial delivery service.'
    },
    travelers: {
      title: '<b>For Travelers:</b>',
      step1: '1. Use /travel to share your travel plan',
      step2: '2. Specify your route and date',
      step3: '3. Select categories you can help with',
      step4: '4. Get connected with people needing favors'
    },
    requesters: {
      title: '<b>For Requesters:</b>',
      step1: '1. Use /favor to request help',
      step2: '2. Specify pickup and delivery locations',
      step3: '3. Select category and urgency',
      step4: '4. Wait for travelers to contact you'
    },
    commands: {
      title: '<b>Commands:</b>',
      start: '/start - Start the bot',
      travel: '/travel - Share travel plan',
      favor: '/favor - Request a favor',
      myposts: '/myposts - Manage your posts',
      settings: '/settings - Notification preferences',
      help: '/help - Show this help message',
      cancel: '/cancel - Cancel current action'
    },
    limits: {
      title: '<b>Limits (Free Tier):</b>',
      posts: '• 10 posts per month',
      introduction: '• One-time introduction only',
      trust: '• Community trust-based'
    },
    safety: {
      title: '<b>Safety Tips:</b>',
      meet: '✅ Meet in public places only',
      verify: '✅ Verify items before accepting',
      photos: '✅ Take photos of handover',
      prohibited: '✅ No prohibited items',
      instincts: '✅ Trust your instincts'
    },
    support: '<b>Support:</b> @LuuKyone_Community'
  },

  // Command Messages for /start, /help, /stats, /channelinfo
  commands: {
    start: {
      newUser: {
        greeting: '💚 <b>Welcome to Our Kindness Community!</b>\n\nHi {userName}! You\'ve just joined something special.',
        intro: '<b>Luu Kyone</b> (လူကြုံ) connects kind hearts across cities. We\'re neighbors helping neighbors with personal favors - not a delivery service.',
        howItWorks: '<b>How it works:</b>\n✈️ <b>Traveling?</b> Your empty luggage space can bring joy\n🤝 <b>Need a favor?</b> Your neighbor might be traveling home',
        routes: '<b>Our routes:</b> 🇸🇬 Singapore ↔ 🇹🇭 Bangkok ↔ 🇲🇲 Yangon',
        motto: '<i>"Small acts, when multiplied by millions of people,\ncan transform the world"</i>',
        ready: 'Ready to spread kindness? Let\'s start! 🙏'
      },
      returningUser: {
        greeting: '{userName} ကို ပြန်လည် ကြိုဆိုပါတယ်🤝✨',
        motto: '<i>"Every act of kindness creates a ripple"</i>',
        impact: '<b>Your impact so far:</b>',
        postsMonth: '📊 Favors this month: {current}/{limit}',
        completedFavors: '💚 Acts of kindness: {count}',
        makingDifference: '⭐ You\'re making a difference!',
        firstAct: '🌱 Your first act of kindness awaits!',
        ready: 'Someone might need your help today. Let\'s see! 🙏'
      }
    },
    help: {
      title: '❓ <b>How Luu Kyone Works</b>',
      intro: 'We connect travelers with people needing personal favors.\nIt\'s about <b>kindness, not business</b>. 💚',
      travelers: '<b>✈️ For Kind Travelers:</b>\nYour empty luggage space = Someone\'s happiness!\n• Tap /travel to share your journey\n• Choose what you\'re comfortable carrying\n• Connect with grateful neighbors\n• <i>5 minutes of your time brings endless joy</i>',
      requesters: '<b>🤝 For Those Needing Favors:</b>\nYour neighbor might be traveling home!\n• Tap /favor to request help\n• Describe what you need clearly\n• Add photos for better understanding\n• <i>Small favors, big impact on lives</i>',
      safety: '<b>🛡️ Safety First:</b>\n• Meet only in public places (airports, cafes)\n• Document everything with photos\n• Trust your instincts always\n• Never carry unknown items',
      guidelines: '<b>💚 Community Guidelines:</b>\n• This is NOT a delivery service\n• Show gratitude with thank-you gifts\n• Build trust through kindness\n• {limit} favors/month (free members)',
      footer: '<i>"Kindness is free. Sprinkle it everywhere!"</i>\n\nNeed help? Join @LuuKyone_Community 🙏'
    },
    stats: {
      title: '📊 <b>Luu Kyone Statistics</b>',
      community: '<b>👥 Community:</b>\n• Total Members: {members}\n• Channel: @LuuKyone_Community',
      activePosts: '<b>📋 Active Posts:</b>\n• Travel Plans: {travels}\n• Favor Requests: {favors}\n• Total Active: {total}',
      thisMonth: '<b>📅 This Month:</b>\n• New Travel Plans: {travels}\n• New Favor Requests: {favors}\n• Total Posted: {total}',
      allTime: '<b>✅ All Time Success:</b>\n• Completed Travels: {travels}\n• Completed Favors: {favors}\n• Total Helped: {total}',
      impact: '<b>🌟 Impact:</b>\n• {lives} lives touched\n• 3 countries connected\n• ∞ kindness spread',
      footer: 'Join the movement: @luukyonebot'
    },
    channelInfo: {
      title: '📢 <b>Channel & Bot Relationship</b>',
      howTheyWork: '<b>How they work together:</b>\n• Bot (@luukyonebot) - Where you create posts\n• Channel (@LuuKyone_Community) - Where posts are displayed',
      userJourney: '<b>User Journey:</b>\n1️⃣ Open the bot to create a post\n2️⃣ Post appears in the channel\n3️⃣ Community members comment to connect\n4️⃣ Bot notifies you of comments\n5️⃣ You connect directly to arrange',
      whySystem: '<b>Why this system?</b>\n• Channel = Public visibility\n• Bot = Private control\n• Comments = Transparent connections',
      tips: '<b>Tips:</b>\n• Check channel for active posts\n• Use bot to create your posts\n• Comment on posts to help\n• Keep notifications on for alerts',
      footer: 'Channel: @LuuKyone_Community\nBot: @luukyonebot'
    },
    profile: {
      title: '👤 <b>Your Profile</b>',
      info: 'Name: {userName}\nUsername: {username}\nMember Type: {memberType}',
      statistics: '<b>📊 Statistics:</b>\nPosts this month: {current}/{limit}\nCompleted favors: {completed}\n{rating}',
      memberSince: 'Member since: {date}',
      noRating: 'No ratings yet',
      ratingStars: 'Rating: {stars} ({rating}/5)'
    },
    browse: {
      title: '📋 <b>Recent Active Posts</b>',
      travelPlans: '<b>✈️ Travel Plans:</b>',
      favorRequests: '<b>📦 Favor Requests:</b>',
      footer: '<i>Visit our channel @LuuKyone_Community for details</i>'
    },
    postLimit: {
      reached: '❌ You\'ve reached your monthly limit of {limit} posts.\nPosts used: {current}/{limit}\n\nYour limit will reset next month.'
    }
  },

  // Settings Messages (ENGLISH)
  settings: {
    title: '⚙️ <b>Settings</b>',
    preferences: 'Manage your preferences:',
    notifications: {
      connection: '🔔 Connection alerts: Always on (core feature)',
      daily: '📊 Daily Summary: {status}'
    },
    tip: '💡 <i>Connection notifications are always enabled to ensure you never miss someone who wants to help!</i>',
    confirmOn: '✅ You will now receive daily summaries at 9am and 6pm',
    confirmOff: '📵 Daily summaries disabled'
  },

  // Channel Messages (ENGLISH)
  channel: {
    travelPost: {
      header: '✈️ <b>KIND TRAVELER - CAN HELP</b>',
      route: '📍 Route: {route}',
      date: '📅 Date: {date}',
      weight: '📦 Space: {weight}',
      categories: '✅ Accepts: {categories}'
    },
    favorPost: {
      header: '💝 <b>KINDNESS NEEDED</b>',
      route: '📍 Route: {route}',
      urgency: '⏰ Urgency: {urgency}',
      categories: '📦 Category: {categories}',
      weight: '⚖️ Weight: {weight}'
    },
    completed: 'This post has been completed. Thank you for spreading kindness! 💚',
    cancelled: 'This post has been cancelled.',
    expired: 'This post has expired.',
    dailySummary: {
      morning: {
        title: '☀️ <b>Morning Summary</b>',
        subtitle: 'Share kindness today',
        travelCount: '✈️ {count} travel plans:',
        favorCount: '📦 {count} favor requests:',
        noActive: 'No active posts at the moment.',
        footer: 'Share: @luukyonebot\n#MorningSummary #Kindness'
      },
      evening: {
        title: '🌙 <b>Evening Summary</b>',
        subtitle: 'Check how you can help',
        travelCount: '✈️ {count} travel plans:',
        favorCount: '📦 {count} favor requests:',
        noActive: 'No active posts at the moment.',
        footer: 'Connect: @luukyonebot\n#EveningSummary #LuuKyone'
      }
    }
  },

  // Contact Messages (ENGLISH)
  contact: {
    receivedInfo: {
      title: '✅ <b>Contact Information Received!</b>',
      postType: 'You requested contact for this {postType}:',
      route: '<b>Route:</b> {route}',
      date: '<b>Date:</b> {date}',
      contactPerson: '<b>Please contact:</b>',
      tip: '<i>💡 Tip: Start by introducing yourself and mentioning the post ID #{postId}</i>',
      oneTime: '<i>⚠️ Note: This is a one-time introduction. Save this contact for future reference.</i>'
    },
    newMatch: {
      title: '🔔 <b>New Match for Your Post!</b>',
      someone: 'Someone {action}:',
      route: '<b>Route:</b> {route}',
      postId: '<b>Post ID:</b> #{postId}',
      interested: '<b>Interested person:</b>',
      willContact: 'They will contact you soon to discuss details.',
      tip: '<i>💡 If they don\'t reach out, you can message them first!</i>'
    }
  },

  // My Posts Messages (ENGLISH)
  myposts: {
    title: '📋 <b>Your Active Posts</b>',
    empty: 'You don\'t have any active posts.',
    selectPost: 'Select a post to manage:',
    managePost: {
      title: '📝 <b>Manage Post</b>',
      type: '<b>Type:</b> {type}',
      route: '<b>Route:</b> {route}',
      date: '<b>Date:</b> {date}',
      urgency: '<b>Urgency:</b> {urgency}',
      status: '<b>Status:</b> {status}',
      postId: '<b>Post ID:</b> {postId}',
      createdAt: '<b>Created:</b> {date}',
      expiresAt: '<b>Expires:</b> {date}',
      selectAction: 'Select an action:'
    },
    confirmComplete: {
      title: '✅ <b>Confirm Completion</b>',
      message: 'Mark this post as completed?\nThis action cannot be undone.'
    },
    confirmCancel: {
      title: '❌ <b>Confirm Cancellation</b>',
      message: 'Cancel this post?\nThis action cannot be undone.'
    },
    completed: '✅ Post marked as completed. Thank you for spreading kindness! 💚',
    cancelled: '❌ Post has been cancelled.',
    backToList: '🔙 Back to posts list',
    markComplete: '✅ Mark Complete',
    cancelPost: '❌ Cancel Post'
  },

  // Status Labels (ENGLISH)
  status: {
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
    expired: 'Expired'
  },

  // Post Type Labels (ENGLISH)
  postTypes: {
    travel: 'Travel Plan',
    favor: 'Favor Request'
  },

  // Comment Notifications (ENGLISH - Simple & Short)
  notifications: {
    comment: {
      single: '💬 @{username} commented on your {postType} post #{postId}',
      multiple: '💬 {count} new comments on #{postId}\n\n{usernames}'
    }
  }
};

// Helper function to format messages with variables
const formatMessage = (template, variables = {}) => {
  let message = template;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{${key}}`, 'g');
    message = message.replace(regex, value);
  });
  return message;
};

module.exports = {
  messages,
  formatMessage
};