// Centralized message configuration for easy maintenance
// All text content and button labels in one place

const messages = {
  // Cities Configuration
  cities: {
    singapore: {
      name: 'Singapore',
      emoji: '🇸🇬'
    },
    bangkok: {
      name: 'Bangkok', 
      emoji: '🇹🇭'
    },
    yangon: {
      name: 'Yangon',
      emoji: '🇲🇲'
    }
  },

  // Categories Configuration
  categories: {
    medicine: { name: 'Medicine', emoji: '💊' },
    documents: { name: 'Documents', emoji: '📄' },
    food: { name: 'Food', emoji: '🍜' },
    electronics: { name: 'Electronics', emoji: '📱' },
    clothing: { name: 'Clothing', emoji: '👕' },
    books: { name: 'Books', emoji: '📚' },
    cosmetics: { name: 'Cosmetics', emoji: '💄' },
    gifts: { name: 'Gifts', emoji: '🎁' },
    other: { name: 'Other', emoji: '📦' }
  },

  // Urgency Levels
  urgency: {
    urgent: { label: 'Urgent (1-3 days)', emoji: '🚨' },
    normal: { label: 'Normal (4-7 days)', emoji: '⏰' },
    flexible: { label: 'Flexible (Anytime)', emoji: '😌' }
  },
  
  // Weight Options
  weightOptions: {
    less1: '< 1 kg',
    kg1to3: '1-3 kg', 
    kg3to5: '3-5 kg',
    kg5to10: '5-10 kg',
    more10: '> 10 kg'
  },
  // Button Labels
  buttons: {
    mainMenu: {
      travel: '✈️ Travel',
      favor: '📦 Favor',
      browse: '🔍 Browse',
      profile: '👤 Profile',
      help: '📚 Help',
      settings: '⚙️ Settings'
    },
    common: {
      cancel: '❌ Cancel',
      back: '⬅️ Back',
      skip: '⏭️ Skip',
      confirm: '✅ Confirm',
      confirmCategories: '✅ Confirm Categories',
      confirmPost: '✅ Confirm',
      yes: '✅ Yes',
      no: '❌ No',
      contact: '💬 Contact'
    },
    date: {
      today: '📅 Today',
      tomorrow: '📅 Tomorrow',
      custom: '📅 Custom Date'
    },
    weight: {
      less1: '< 1 kg',
      kg1to3: '1-3 kg',
      kg3to5: '3-5 kg',
      kg5to10: '5-10 kg',
      more10: '> 10 kg',
      custom: '✏️ Custom'
    },
    membership: {
      joinChannel: '📢 Join Community Channel',
      checkJoined: '✅ I\'ve Joined'
    }
  },

  // Scene Messages
  scenes: {
    travel: {
      title: '✈️ Share Your Travel Plan',
      steps: {
        fromCity: 'Step 1: Where are you traveling FROM?',
        toCity: 'Step 2: Where are you traveling TO?',
        departure: 'Step 3: When is your DEPARTURE date?',
        departureCustom: 'Step 3: Please enter the departure date in format DD/MM/YYYY:',
        weight: 'Step 4: How much luggage space do you have available?',
        weightCustom: 'Step 4: Enter the available weight in kg (e.g., "20" or "20 kg"):',
        categories: 'Step 5: What categories can you help with?\n<i>Select multiple categories, then confirm</i>'
      },
      categorySelection: {
        title: 'Selected Categories:',
        prompt: 'Add more categories or confirm to post:'
      },
      confirmation: {
        title: '✅ Travel Plan Posted Successfully!',
        body: 'Your travel plan has been shared with the community.\nYou will be notified when someone needs your help.',
        reference: '📌 Reference: {postId}\n<i>(Share this ID if someone asks about your post)</i>'
      },
      cancelled: '❌ Travel plan cancelled.',
      nextPrompt: 'What would you like to do next?',
      whatToDo: 'What would you like to do?',
      errorPosting: '❌ An error occurred while posting. Please try again.'
    },
    
    favor: {
      title: '📦 Request a Personal Favor',
      steps: {
        fromCity: 'Step 1: Where does the item need to be picked up FROM?',
        toCity: 'Step 2: Where does the item need to be delivered TO?',
        categories: 'Step 3: What category does your item belong to?',
        urgency: 'Step 4: How urgent is your request?',
        weight: 'Step 5: How much does the item weigh?',
        weightCustom: 'Step 5: Enter the weight in kg (e.g., "20" or "20 kg"):'
      },
      categorySelection: {
        title: 'Selected Categories:',
        prompt: 'Add more categories or confirm your selection:'
      },
      confirmation: {
        title: '✅ Favor Request Posted Successfully!',
        body: 'Your request has been shared with the community.\nTravelers on your route will be notified.',
        reference: '📌 Reference: {postId}\n<i>(Share this ID if someone asks about your request)</i>'
      },
      cancelled: '❌ Favor request cancelled.',
      photoProcessing: '📸 Processing photo...',
      photoError: '❌ Failed to process photo. You can skip or try again.',
      nextPrompt: 'What would you like to do next?',
      whatToDo: 'What would you like to do?',
      errorPosting: '❌ An error occurred while posting. Please try again.'
    }
  },

  // Welcome Messages
  welcome: {
    newUser: {
      title: '💚 Welcome to Our Kindness Community!',
      greeting: 'Hi {userName}! You\'ve just joined something special.',
      intro: 'Luu Kyone (လူကြုံ) connects kind hearts across cities. We\'re neighbors helping neighbors with personal favors - not a delivery service.',
      howItWorks: {
        title: 'How it works:',
        travel: '✈️ Traveling? Your empty luggage space can bring joy',
        favor: '🤝 Need a favor? Your neighbor might be traveling home'
      },
      routes: 'Our routes: 🇸🇬 Singapore ↔ 🇹🇭 Bangkok ↔ 🇲🇲 Yangon',
      quote: '"Small acts, when multiplied by millions of people,\ncan transform the world"',
      ready: 'Ready to spread kindness? Let\'s start! 🙏'
    },
    
    returningUser: {
      greeting: 'Welcome back, {userName}! 🤝',
      quote: '"Every act of kindness creates a ripple"',
      impact: {
        title: 'Your impact so far:',
        favorsMonth: '📊 Favors this month: {current}/{limit}',
        actsCompleted: '💚 Acts of kindness: {count}',
        firstAct: '🌱 Your first act of kindness awaits!',
        makingDifference: '⭐ You\'re making a difference!'
      },
      motivation: 'Someone might need your help today. Let\'s see! 🙏'
    },
    
    notMember: {
      title: '👋 Welcome {userName}!',
      requirement: 'To use Luu Kyone Bot, please join our community channel first.',
      benefits: 'All travel plans and favor requests are shared there, so you can:\n• See all active posts\n• Connect with other members\n• Build trust in the community',
      action: 'Please join the channel and click "I\'ve Joined" below:'
    },
    
    membershipVerified: {
      title: '✅ Welcome back to the kindness network!',
      message: 'Great! You\'re part of our community.'
    }
  },

  // Channel Messages
  channel: {
    travel: {
      title: '✈️ Travel Plan Available',
      route: 'Route:',
      date: 'Date:',
      available: 'Available:',
      canHelp: 'Can help with:'
    },
    favor: {
      title: '📦 Favor Request',
      route: 'Route:',
      items: 'Items:',
      weight: 'Weight:',
      urgency: 'Urgency:'
    },
    welcome: {
      single: '💚 Welcome to our kindness family!\n\n"Your journey of a thousand acts of kindness begins with a single favor."\n\nReady to help? Start here: @luukyonebot',
      multiple: 'Welcome to all our new friends! 💚'
    },
    milestones: {
      kindness100: '🎊 MILESTONE CELEBRATION! 🎊\n\nOur community has completed 100 acts of kindness!\n\n"No act of kindness, no matter how small, is ever wasted."\n\nThank you for making the world a better place, one favor at a time! 💚',
      members500: '🎉 COMMUNITY MILESTONE! 🎉\n\nWe\'ve grown to 500 kind hearts! 🎉\n\nEach of you makes our community special. Together, we\'re proving that kindness has no borders.\n\nHere\'s to many more connections and favors! 🤝',
      weeklyStats: '📊 This Week in Kindness\n\n✈️ Active Travelers: {travelers}\n📦 Favor Requests: {favors}\n🤝 Connections Made: {connections}\n⭐ Kindness Rating: {rating}/5\n\nKeep spreading the love! 💚'
    },
    dailyQuote: '💚 Daily Kindness Reminder\n\n"{quote}"\n\nWhat act of kindness will you do today?',
    postCompleted: '✅ Post Completed!\n\n{userName} has successfully completed their {postType}!\nPost ID: #{postId}\n\nThank you for spreading kindness! 💚',
    postCancelled: '❌ Post Cancelled\n\n{postType} #{postId} has been cancelled by the user.',
    dailySummary: {
      morning: {
        title: '☀️ Good Morning! Active Posts Summary',
        subtitle: 'Here are today\'s opportunities to spread kindness:',
        travelCount: '✈️ {count} Active Travel Plans',
        favorCount: '📦 {count} Active Favor Requests',
        noActive: 'No active posts at the moment. Be the first to post today!',
        footer: 'Ready to help? Visit @luukyonebot'
      },
      evening: {
        title: '🌙 Evening Update! Active Posts Summary',
        subtitle: 'Still time to help with these:',
        travelCount: '✈️ {count} Active Travel Plans',
        favorCount: '📦 {count} Active Favor Requests',
        noActive: 'All posts have been completed today! Great job, community! 🎉',
        footer: 'Tomorrow brings new opportunities for kindness 💚'
      }
    }
  },

  // Browse Messages
  browse: {
    title: '📋 Recent Active Posts',
    travelSection: '✈️ Travel Plans:',
    favorSection: '📦 Favor Requests:',
    empty: '📭 No active posts at the moment. Check back later!',
    footer: 'Visit our channel @LuuKyone_Community for details'
  },

  // Profile Messages
  profile: {
    title: '👤 Your Profile',
    name: 'Name:',
    username: 'Username:',
    memberType: 'Member Type:',
    memberTypeFree: '🆓 Free',
    memberTypePremium: '💎 Premium',
    statistics: {
      title: '📊 Statistics:',
      postsMonth: 'Posts this month:',
      completedFavors: 'Completed favors:',
      rating: 'Rating:',
      noRating: 'No ratings yet'
    },
    memberSince: 'Member since:'
  },

  // Contact Messages
  contact: {
    selfContact: '❌ You can\'t contact yourself!',
    notRegistered: '❌ Please start the bot first: @luukyonebot',
    alreadyConnected: '❌ You\'ve already been introduced for this post. Free tier allows one-time introduction only.',
    
    requesterNotification: {
      title: '✅ Contact Information Received!',
      requestedFor: 'You requested contact for this {postType}:',
      route: 'Route:',
      date: 'Date:',
      contact: 'Please contact:',
      clickToMessage: 'Click here to message',
      tip: '💡 Tip: Start by introducing yourself and mentioning the post ID #{postId}',
      note: '⚠️ Note: This is a one-time introduction. Save this contact for future reference.'
    },
    
    posterNotification: {
      title: '🔔 New Match for Your Post!',
      someoneNeeds: 'Someone needs your help with:',
      someoneCanHelp: 'Someone can help you with:',
      route: 'Route:',
      postId: 'Post ID:',
      interested: 'Interested person:',
      viewProfile: 'View profile',
      willContact: 'They will contact you soon to discuss details.',
      tip: '💡 If they don\'t reach out, you can message them first!'
    }
  },

  // Error Messages
  errors: {
    generic: '❌ An error occurred. Please try again.',
    somethingWrong: '😔 Oops! Something went wrong.\n\nDon\'t worry, it happens! Please try again.\n\nIf this keeps happening, our community is here to help:\n👉 @LuuKyone_Community\n\n<i>"Even technology needs kindness sometimes!"</i>',
    notMember: '❌ Please join @LuuKyone_Community first!\n\nUse /start to get the join link.',
    startFirst: 'Please start the bot first with /start',
    limitReached: '❌ You\'ve reached your monthly limit of {limit} posts.\nPosts used: {current}/{limit}\n\nYour limit will reset next month.',
    channelPostFailed: '⚠️ Note: Your {postType} was saved but couldn\'t be posted to the channel.\n\nPlease ensure the bot is added as admin to @LuuKyone_Community channel.'
  },

  // Validation Messages
  validation: {
    descriptionTooShort: '❌ Please provide a more detailed description (at least 10 characters).',
    descriptionTooLong: '❌ Description is too long. Please keep it under 500 characters.',
    invalidDate: '❌ Invalid date format or date is in the past.\nPlease enter in format DD/MM/YYYY:',
    invalidWeight: '❌ Please enter weight as a number in kg (e.g., "20" or "20 kg"):',
    selectCategory: '❌ Please select at least one category.',
    selectAtLeastOne: '❌ Please select at least one option.'
  },

  // Help Messages
  help: {
    title: '❓ How Luu Kyone Works',
    intro: 'We connect travelers with people needing personal favors.\nIt\'s about kindness, not business. 💚',
    travelers: {
      title: '✈️ For Kind Travelers:',
      content: 'Your empty luggage space = Someone\'s happiness!\n• Tap /travel to share your journey\n• Choose what you\'re comfortable carrying\n• Connect with grateful neighbors\n• 5 minutes of your time brings endless joy'
    },
    needers: {
      title: '🤝 For Those Needing Favors:',
      content: 'Your neighbor might be traveling home!\n• Tap /favor to request help\n• Describe what you need clearly\n• Add photos for better understanding\n• Small favors, big impact on lives'
    },
    safety: {
      title: '🛡️ Safety First:',
      content: '• Meet only in public places (airports, cafes)\n• Document everything with photos\n• Trust your instincts always\n• Never carry unknown items'
    },
    guidelines: {
      title: '💚 Community Guidelines:',
      content: '• This is NOT a delivery service\n• Show gratitude with thank-you gifts\n• Build trust through kindness\n• {limit} favors/month (free members)'
    },
    footer: '"Kindness is free. Sprinkle it everywhere!"\n\nNeed help? Join @LuuKyone_Community 🙏'
  },

  // Common Messages
  common: {
    operationCancelled: '❌ Operation cancelled.',
    whatNext: 'What would you like to do next?',
    whatToDo: 'What would you like to do?'
  },

  // Commands Messages
  commands: {
    start: {
      channelRequired: '👉 @LuuKyone_Community',
      joinFirst: 'Please join the channel and click "I\'ve Joined" below:'
    },
    test: {
      title: '🧪 Channel Test Menu',
      selectPrompt: 'Select what you want to test:',
      adminOnly: '❌ This command is for admins only.',
      error: '❌ Error accessing test menu.'
    },
    myposts: {
      title: '📋 Your Active Posts',
      noActivePosts: '📭 You don\'t have any active posts at the moment.',
      travelPlan: '✈️ Travel Plan #{postId}',
      favorRequest: '📦 Favor Request #{postId}',
      route: 'Route: {route}',
      date: 'Date: {date}',
      status: 'Status: {status}',
      selectPost: 'Select a post to manage:',
      managePost: '📋 Managing Post #{postId}',
      whatToDo: 'What would you like to do with this post?',
      markComplete: '✅ Mark as Completed',
      cancel: '❌ Cancel Post',
      back: '⬅️ Back to List',
      confirmComplete: 'Are you sure you want to mark this post as completed?',
      confirmCancel: 'Are you sure you want to cancel this post?',
      postCompleted: '✅ Post marked as completed!',
      postCancelled: '❌ Post cancelled.',
      error: '❌ Error managing posts. Please try again.'
    }
  },

  // Admin Messages
  admin: {
    testButtons: {
      welcome: '📢 Test Welcome Message',
      quote: '💚 Test Daily Quote',
      milestone100: '🎊 Test Milestone (100 kindness)',
      milestone500: '🎉 Test Milestone (500 members)',
      stats: '📊 Test Weekly Stats'
    }
  }
};

// Message formatter to replace variables like {userName}
const formatMessage = (message, variables = {}) => {
  let formatted = message;
  Object.keys(variables).forEach(key => {
    formatted = formatted.replace(new RegExp(`{${key}}`, 'g'), variables[key]);
  });
  return formatted;
};

module.exports = {
  messages,
  formatMessage
};