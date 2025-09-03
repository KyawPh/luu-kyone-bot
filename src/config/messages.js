// Centralized message configuration for easy maintenance
// Messages in English, Buttons in Myanmar
// Note: Cities, Categories, and Urgency data are defined in constants.js

const messages = {
  // ==================================================
  // 1. CORE MESSAGES (Most frequently used)
  // ==================================================

  // Main Menu Messages
  menu: {
    greeting: '👋 မင်္ဂလာပါ {userName}!',
    welcome: '💚 ကျွန်ုပ်တို့ရဲ့ လူကြုံ Bot မှ ပြန်လည်ကြိုဆိုပါတယ်',
    instruction: 'စတင်ရန် အောက်က option တစ်ခုခုကို ရွေးပါ။'
  },

  // Common Messages (Used throughout the bot)
  common: {
    // Basic prompts
    whatToDo: 'စတင်ရန် အောက်က option တစ်ခုခုကို ရွေးပါ။',
    howToSpreadKindness: 'ဒီနေ့ ဘာကူညီလိုက်မလဲ?',
    startBotFirst: '/start ဖြင့် စတင်ပါ',

    // Operation messages
    operationCancelled: '❌ လုပ်ဆောင်ချက်ပယ်ဖျက်ပြီ',
    processing: 'လုပ်ဆောင်နေသည်...',

    // Post-related
    postCreatedSuccessfully: '✅ <b>ပို့စ်တင်ပြီးပါပြီ</b>',
    referenceId: '📌 <b>Reference ID:</b> {postId}',
    noActivePosts: '📭 လက်ရှိတွင် ပို့စ်မရှိပါ',

    // Input prompts
    weightCustomPrompt: 'အလေးချိန် kg ဖြင့်ရိုက်ထည့်ပါ (ဥပမာ - "၂၀"):',
    categoryPrompt: 'ထပ်ရွေးရန် (သို့) အတည်ပြုရန်',

    // Utility messages
    useStartForLink: '/start ဖြင့် လင့်ခ်ရယူပါ',
    limitResetsNextMonth: 'လာမည့်လတွင် အကန့်အသတ် ပြန်စမည်',
    postsUsed: 'သုံးပြီးသား ပို့စ်များ: {current}/{limit}',

    // Display helpers
    dateTBD: 'ရက်စွဲ သတ်မှတ်ရန် ကျန်ရှိ',
    itemsCount: '{count} မျိုး',
    various: 'အမျိုးမျိုး'
  },

  // System Status Messages
  system: {
    checkingMembership: 'အဖွဲ့ဝင်အခြေအနေ စစ်ဆေးနေသည်...',
    savingPost: 'ပို့စ်သိမ်းဆည်းနေသည်...',
    postingToChannel: 'Channel သို့ တင်နေသည်...',
    channelMembershipRequired: '📢 @LuuKyone_Community သို့ အရင်ဝင်ပါ',
    botAdminRequired: '⚠️ Bot ကို Channel စီမံခွင့်ပေးပါ'
  },

  // ==================================================
  // 2. UI COMPONENTS
  // ==================================================

  // Button Labels (KEEP IN MYANMAR)
  buttons: {
    // Main menu buttons
    mainMenu: {
      travel: '✈️ ခရီးစဉ်',
      favor: '📦 အကူအညီ',
      browse: '📋 ပို့စ်များကြည့်ရန်',
      profile: '👤 အချက်လက်',
      help: '📚 အကူအညီ',
      settings: '⚙️ ဆက်တင်'
    },

    // Common action buttons
    actions: {
      cancel: '❌ ပယ်ဖျက်မည်',
      back: '⬅️ နောက်သို့',
      backToMenu: '🏠 မူလမီနူး',
      skip: '⏭️ ကျော်မည်',
      confirm: '✅ အတည်ပြုမည်',
      yes: '✅ ဟုတ်သည်',
      no: '❌ မဟုတ်ပါ'
    },

    // Scene-specific buttons
    scenes: {
      confirmCategories: '✅ အတည်ပြုမည်',
      confirmPost: '✅ အတည်ပြုမည်'
    },

    // Date selection buttons
    date: {
      today: '📅 ဒီနေ့',
      tomorrow: '📅 မနက်ဖြန်',
      custom: '📅 ရက်စွဲရွေးရန်'
    },

    // Weight selection buttons
    weight: {
      less1: '< ၁ ကီလို',
      kg1to3: '၁-၃ ကီလို',
      kg3to5: '၃-၅ ကီလို',
      kg5to10: '၅-၁၀ ကီလို',
      more10: '> ၁၀ ကီလို',
      custom: '✏️ အခြားအလေးချိန်'
    },

    // Membership buttons
    membership: {
      joinChannel: '📢 Community Channel သို့ဝင်ရောက်ရန်',
      checkJoined: '✅ ဝင်ပြီးပါပြီ'
    },

    // Post management buttons
    postManagement: {
      markComplete: '✅ ပြီးဆုံးပြီဟု မှတ်သားရန်',
      cancelPost: '❌ ပို့စ်ပယ်ဖျက်ရန်',
      backToList: '🔙 ပို့စ်စာရင်းသို့ ပြန်သွားရန်'
    }
  },

  // Field Labels (For display purposes)
  fieldLabels: {
    route: 'Route',
    departure: 'Departure',
    urgency: 'Urgency',
    categories: 'Categories',
    weight: 'Weight',
    availableSpace: 'Available Space',
    status: 'Status',
    type: 'Type'
  },

  // Status & Type Labels
  labels: {
    status: {
      active: 'Active',
      completed: 'Completed',
      cancelled: 'Cancelled',
      expired: 'Expired'
    },
    postTypes: {
      travel: 'Travel Plan',
      favor: 'Favor Request'
    },
    userTypes: {
      free: '🆓 Free',
      premium: '💎 Premium',
      notSet: 'Not set'
    }
  },

  // ==================================================
  // 3. FEATURE MESSAGES (By command/feature)
  // ==================================================

  // Start Command
  start: {
    // Non-member flow
    notMember: {
      title: '📢 <b>Community Channel သို့ အရင်ဝင်ပါ</b>',
      description: 'လူကြုံ Bot ကိုအသုံးပြုရန် Community Channel သို့ဝင်ရန် လိုအပ်ပါသည်',
      instructions: {
        title: '<b>ဝင်နည်း-</b>',
        step1: '1️⃣ @LuuKyone_Community သို့သွားပါ',
        step2: '2️⃣ "Join" နှိပ်ပါ',
        step3: '3️⃣ ဤနေရာသို့ပြန်လာပြီး "ဝင်ပြီးပြီ" နှိပ်ပါ'
      }
    },

    // New user welcome
    newUser: {
      greeting: '💚 <b>ကြိုဆိုပါသည်!</b>\n\n{userName} မင်္ဂလာပါ!',
      intro: '<b>လူကြုံ</b>သည် ခရီးသွားများနှင့် အကူအညီလိုအပ်သူများကို ချိတ်ဆက်ပေးသော platform တစ်ခုဖြစ်ပါသည်',
      benefits: {
        title: '<b>သင်ဘာလုပ်နိုင်မလဲ-</b>',
        travel: '✈️ <b>ခရီးထွက်မည်လား?</b> - နေရာလွတ်လေးကို အသုံးချပါ',
        favor: '📦 <b>အကူအညီလိုအပ်လား?</b> - ကြင်နာသောခရီးသွားများ ရှိပါသည်',
        connect: '🤝 <b>ချိတ်ဆက်ပါ</b> - တိုက်ရိုက်စီစဉ်ပါ'
      }
    }
  },

  // Help Section
  help: {
    title: '📚 <b>လူကြုံ Bot ကို အသုံးပြုနည်း</b>',
    intro: {
      title: '<b>လူကြုံ Bot ဆိုတာဘာလဲ?</b>',
      description: 'ကြင်နာသောခရီးသွားများနှင့် အကူအညီလိုအပ်သူများကို ချိတ်ဆက်ပေးသည်'
    },
    travelers: {
      title: '<b>ခရီးသွားများအတွက်-</b>',
      step1: '၁။ /travel ဖြင့် ခရီးစဉ်မျှဝေပါ',
      step2: '၂။ လမ်းကြောင်းနှင့် ရက်စွဲသတ်မှတ်ပါ',
      step3: '၃။ ကူညီနိုင်သည့် အမျိုးအစားရွေးပါ',
      step4: '၄။ အကူအညီလိုအပ်သူများနှင့် ချိတ်ဆက်ပါ'
    },
    requesters: {
      title: '<b>တောင်းဆိုသူများအတွက်-</b>',
      step1: '၁။ /favor ဖြင့် အကူအညီတောင်းပါ',
      step2: '၂။ လမ်းကြောင်းသတ်မှတ်ပါ',
      step3: '၃။ အမျိုးအစားနှင့် အရေးတကြီးအဆင့်ရွေးပါ',
      step4: '၄။ ခရီးသွားများ ဆက်သွယ်လာသည်ကို စောင့်ပါ'
    },
    commands: {
      title: '<b>Commands-</b>',
      start: '/start - Bot စတင်ရန်',
      travel: '/travel - ခရီးစဉ်မျှဝေရန်',
      favor: '/favor - အကူအညီတောင်းရန်',
      myposts: '/myposts - ကိုယ့်ပို့စ်များ',
      settings: '/settings - အသိပေးချက်များ',
      help: '/help - အကူအညီ',
      cancel: '/cancel - လက်ရှိလုပ်ဆောင်ချက်ပယ်ဖျက်ရန်'
    },
    limits: {
      title: '<b>အကန့်အသတ်များ-</b>',
      posts: '• တစ်လလျှင် ပို့စ် ၁၀ ခု',
      introduction: '• တစ်ကြိမ်တည်း မိတ်ဆက်ခွင့်',
      trust: '• ယုံကြည်မှုအပေါ်အခြေခံ'
    },
    safety: {
      title: '<b>⚠️ ဆောင်ရန်/ရှောင်ရန် ⚠️</b>',
      meet: '📍 လုံခြုံသော အများသုံးနေရာမှာသာ တွေ့ဆုံပါ',
      verify: '🔍 လက်ခံမယ့် ပစ္စည်းကို သေချာစစ်ဆေးပါ',
      photos: '📸 လက်လွှဲအပြီး ဓာတ်ပုံရိုက်ထားပါ (အထောက်အထားအတွက်)',
      prohibited: '🚫 ဥပဒေနဲ့မညီသော ပစ္စည်းများ လုံးဝမသယ်ပါနှင့်',
      instincts: '💡 စိတ်ထဲမသက်မသာဖြစ်ရင် ချက်ချင်းရပ်ပါ'
    },
    support: '<b>အကူအညီ-</b> @LuuKyone_Community'
  },

  // Profile
  profile: {
    title: '👤 <b>သင့်ရဲ့ Profile</b>',
    info: 'အမည်- {userName}\nUsername- {username}\nအဖွဲ့ဝင်အမျိုးအစား- {memberType}',
    statistics: '<b>📊 စာရင်းအင်းများ-</b>\nဒီလပို့စ်များ- {current}/{limit}\nပြီးစီးအကူအညီ- {completed}\n{rating}',
    memberSince: 'ဝင်ရောက်သည့်ရက်- {date}',
    noRating: 'အဆင့်သတ်မှတ်ချက် မရှိသေးပါ',
    ratingStars: 'အဆင့်သတ်မှတ်ချက်- {stars} ({rating}/5)'
  },

  // Browse
  browse: {
    title: '📋 <b>လတ်တလော ပို့စ်များ</b>',
    travelPlans: '<b>✈️ ခရီးစဉ်များ-</b>',
    favorRequests: '<b>📦 တောင်းဆိုချက်များ-</b>',
    footer: '@LuuKyone_Community'
  },

  // Stats
  stats: {
    title: '📊 <b>လူကြုံ စာရင်းအင်းများ</b>',
    community: '<b>👥 Community-</b>\n• အဖွဲ့ဝင်စုစုပေါင်း- {members}',
    activePosts: '<b>📋 လတ်တလောပို့စ်များ-</b>\n• ခရီးစဉ်များ- {travels}\n• တောင်းဆိုချက်များ- {favors}',
    thisMonth: '<b>📅 ဒီလ-</b>\n• ခရီးစဉ်အသစ်- {travels}\n• တောင်းဆိုချက်အသစ်- {favors}',
    allTime: '<b>✅ စုစုပေါင်းအောင်မြင်မှုများ-</b>\n• ပြီးစီးခရီးစဉ်- {travels}\n• ပြီးစီးအကူအညီ- {favors}',
    impact: '<b>🌟 အကျိုးသက်ရောက်မှု-</b>\n• {lives} ဘဝများ ထိတွေ့ခံစားရ\n• နိုင်ငံ ၃ နိုင်ငံ ချိတ်ဆက်',
    footer: '@luukyonebot'
  },

  // Settings
  settings: {
    title: '⚙️ <b>ဆက်တင်များ</b>',
    preferences: 'ဦးစားပေးချက်များ-',
    notifications: {
      connection: '🔔 ချိတ်ဆက်မှု အသိပေးချက်များ- ဖွင့်ထား',
      daily: '📊 နေ့စဉ်အကျဉ်းချုပ်- {status}'
    },
    tip: '💡 ချိတ်ဆက်မှုအသိပေးချက်များကို အမြဲဖွင့်ထားပါ',
    confirmOn: '✅ နေ့စဉ်အကျဉ်းချုပ်များ ဖွင့်ထားပြီ',
    confirmOff: '📵 နေ့စဉ်အကျဉ်းချုပ်များ ပိတ်ထားပြီ',
    about: {
      title: '📱 <b>လူကြုံ Bot အကြောင်း</b>',
      tagline: '🤝 ကမ္ဘာတစ်ဝှမ်းက မြန်မာခရီးသွားတွေကို ချိတ်ဆက်ပေးတဲ့ platform',
      version: '<b>Version:</b> 1.3.1',
      status: '<b>Status:</b> {status}',
      community: '<b>Community:</b> @LuuKyone_Community',
      features: '<b>အဓိက Features:</b>',
      featuresList: '• ခရီးစဉ်တွေ မျှဝေနိုင်\n• ကိုယ်ရေးကိုယ်တာ အကူအညီတောင်း\n• ခရီးသွားတွေနဲ့ ချိတ်ဆက်\n• လက်ရှိပို့စ်တွေ ကြည့်ရှု',
      notifications: '<b>အသိပေးချက်များ:</b>',
      notificationStatus: '🔔 ချိတ်ဆက်မှုသတင်း: အမြဲဖွင့်\n📊 နေ့စဉ်အကျဉ်းချုပ်: {status}',
      notificationsOn: 'ဖွင့်ထား (မနက် ၉နာရီ ညနေ ၆နာရီ)',
      notificationsOff: 'ပိတ်ထား'
    }
  },

  // My Posts
  myPosts: {
    title: '📋 <b>သင့်ရဲ့ ပို့စ်များ</b>',
    empty: 'လတ်တလော တင်ထားသော ပို့စ်များ မရှိပါ',
    selectPost: 'စီမံရန် ပို့စ်ရွေးပါ-',
    management: {
      title: '📝 <b>ပို့စ်စီမံခန့်ခွဲမှု</b>',
      type: '<b>အမျိုးအစား-</b> {type}',
      route: '<b>ခရီးစဉ်-</b> {route}',
      date: '<b>ရက်စွဲ-</b> {date}',
      urgency: '<b>အရေးတကြီးအဆင့်-</b> {urgency}',
      status: '<b>အခြေအနေ-</b> {status}',
      postId: '<b>ပို့စ် ID-</b> {postId}',
      createdAt: '<b>ဖန်တီးသည့်ရက်-</b> {date}',
      expiresAt: '<b>သက်တမ်းကုန်ရက်-</b> {date}',
      selectAction: 'လုပ်ဆောင်ချက်ရွေးပါ-'
    },
    confirmComplete: {
      title: '✅ <b>ပြီးဆုံးကြောင်း အတည်ပြုခြင်း</b>',
      message: 'ဤပို့စ်ကို ပြီးဆုံးပြီဟု မှတ်သားမည်လား?'
    },
    confirmCancel: {
      title: '❌ <b>ပယ်ဖျက်ခြင်း အတည်ပြုခြင်း</b>',
      message: 'ဤပို့စ်ကို ပယ်ဖျက်မည်လား?'
    },
    completed: '✅ ပို့စ်ပြီးဆုံးပြီ။ ကျေးဇူးတင်ပါသည်! 💚',
    cancelled: '❌ ပို့စ်ပယ်ဖျက်ပြီ'
  },

  // ==================================================
  // 4. SCENE MESSAGES (Travel & Favor flows)
  // ==================================================

  scenes: {
    // Travel Scene
    travel: {
      title: '✈️ <b>ခရီးစဉ်မျှဝေရန်</b>',
      prompts: {
        selectRoute: 'သွားမည့်လမ်းကြောင်းရွေးပါ',
        selectDate: 'ထွက်ခွာမည့်ရက်ရွေးပါ',
        enterCustomDate: 'ထွက်ခွာမည့်ရက် ရိုက်ထည့်ပါ (DD/MM/YYYY):',
        selectCategories: 'သယ်ဆောင်နိုင်သည့် ပစ္စည်းအမျိုးအစားရွေးပါ',
        selectWeight: 'သယ်ဆောင်နိုင်သည့် အလေးချိန်ရွေးပါ'
      },
      categorySelection: 'ရွေးထားသောအမျိုးအစားများ - ',
      success: '✅ <b>ခရီးစဉ်တင်ပြီးပါပြီ</b>',
      cancelled: '❌ ခရီးစဉ်တင်ခြင်း ပယ်ဖျက်ပြီ'
    },

    // Favor Scene
    favor: {
      title: '📦 <b>အကူအညီတောင်းရန်</b>',
      prompts: {
        selectRoute: 'ပို့ဆောင်လိုသော လမ်းကြောင်းရွေးပါ',
        selectUrgency: 'ပို့ဆောင်လိုသော အချိန်ရွေးပါ',
        selectCategories: 'ပို့ဆောင်လိုသော ပစ္စည်းအမျိုးအစားရွေးပါ',
        selectWeight: 'ပစ္စည်းအလေးချိန်ရွေးပါ'
      },
      categorySelection: 'ရွေးထားသောအမျိုးအစားများ -',
      success: '✅ <b>တောင်းဆိုချက်တင်ပြီးပါပြီ</b>',
      cancelled: '❌ တောင်းဆိုချက်တင်ခြင်း ပယ်ဖျက်ပြီ'
    }
  },

  // ==================================================
  // 5. CHANNEL MESSAGES
  // ==================================================

  channel: {
    // Channel post formats
    posts: {
      travel: {
        header: '✈️ <b>ကြင်နာသောခရီးသွား - ကူညီနိုင်သည်</b>',
        route: '📍 ခရီးစဉ်- {route}',
        date: '📅 ရက်စွဲ- {date}',
        weight: '📦 နေရာလွတ်- {weight}',
        categories: '✅ လက်ခံမည်- {categories}'
      },
      favor: {
        header: '💝 <b>ကြင်နာမှု လိုအပ်နေသည်</b>',
        route: '📍 ခရီးစဉ်- {route}',
        urgency: '⏰ အရေးတကြီးအဆင့်- {urgency}',
        categories: '📦 အမျိုးအစား- {categories}',
        weight: '⚖️ အလေးချိန်- {weight}'
      }
    },
    
    // New member announcement
    newMemberAnnouncement: {
      title: '🎉 <b>{userName} ကြိုဆိုပါတယ်!</b>',
      welcome: 'လူကြုံ မိသားစုမှ ကြိုဆိုပါတယ် 💚',
      startJourney: '@luukyonebot',
      hashtags: '#NewMember #LuuKyone'
    },

    // Post status updates
    statusUpdates: {
      completed: 'ဤပို့စ်ပြီးဆုံးပြီ။ ကျေးဇူးတင်ပါသည်! 💚',
      cancelled: 'ဤပို့စ်ပယ်ဖျက်ပြီ',
      expired: 'ဤပို့စ်သက်တမ်းကုန်သွားပြီ'
    },

    // Daily summaries
    dailySummary: {
      morning: {
        title: '☀️ <b>နံနက်ခင်း အကျဉ်းချုပ်</b>',
        subtitle: 'ဒီနေ့ ဘယ်လိုကူညီနိုင်မလဲ?',
        travelCount: '✈️ ခရီးစဉ် {count} ခု-',
        favorCount: '📦 တောင်းဆိုချက် {count} ခု-',
        noActive: 'လက်ရှိတွင် တက်ကြွသော ပို့စ်များ မရှိပါ',
        footer: '@luukyonebot'
      },
      evening: {
        title: '🌙 <b>ညနေခင်း အကျဉ်းချုပ်</b>',
        subtitle: 'ဒီနေ့ ဘယ်လိုကူညီနိုင်မလဲ?',
        travelCount: '✈️ ခရီးစဉ် {count} ခု-',
        favorCount: '📦 တောင်းဆိုချက် {count} ခု-',
        noActive: 'လက်ရှိတွင် တက်ကြွသော ပို့စ်များ မရှိပါ',
        footer: '@luukyonebot'
      },
      footer: '@luukyonebot'
    },

    // Channel info
    info: {
      title: '📢 <b>Channel နှင့် Bot</b>',
      howItWorks: '<b>အတူတကွ အလုပ်လုပ်ပုံ-</b>\n• Bot - ပို့စ်များဖန်တီးရန်\n• Channel - ပို့စ်များပြသရန်',
      userFlow: '<b>အသုံးပြုနည်း-</b>\n1️⃣ Bot ဖြင့် ပို့စ်ဖန်တီးပါ\n2️⃣ ပို့စ်သည် Channel တွင်ပေါ်လာမည်\n3️⃣ Community မှ မှတ်ချက်ပေးကြမည်\n4️⃣ Bot က အသိပေးမည်\n5️⃣ တိုက်ရိုက်ချိတ်ဆက်ပါ',
      benefits: '<b>စနစ်၏အကျိုးကျေးဇူး-</b>\n• Channel = အများမြင်နိုင်\n• Bot = ကိုယ်ပိုင်ထိန်းချုပ်မှု\n• မှတ်ချက်များ = ပွင့်လင်းမြင်သာမှု',
      tips: '<b>အကြံပြုချက်များ-</b>\n• တက်ကြွသောပို့စ်များအတွက် Channel စစ်ပါ\n• ပို့စ်ဖန်တီးရန် Bot သုံးပါ\n• အကူအညီပေးရန် မှတ်ချက်ပေးပါ',
      footer: 'Channel - @LuuKyone_Community\nBot - @luukyonebot'
    }
  },

  // ==================================================
  // 6. NOTIFICATIONS & CONTACT
  // ==================================================

  notifications: {
    // Comment notifications
    comment: {
      single: '💬 @{username} က သင့်ရဲ့ {postType} ပို့စ် #{postId} ကို မှတ်ချက်ပေးထားသည်',
      multiple: '💬 #{postId} တွင် မှတ်ချက်အသစ် {count} ခု'
    }
  },


  // ==================================================
  // 7. ADMIN & TEST MESSAGES
  // ==================================================

  admin: {
    adminOnly: '❌ Admin များသာ အသုံးပြုနိုင်သည်',
    cleanup: {
      running: '🧹 ရှင်းလင်းနေသည်...',
      completed: '✅ ရှင်းလင်းပြီးပြီ',
      failed: '❌ ရှင်းလင်းမရ - {error}'
    },
    errorAccessingMenu: '❌ မီနူးဝင်ရောက်မရ'
  },

  // Content management messages
  content: {
    commands: {
      today: '📅 ယနေ့အတွက် အကြောင်းအရာများ',
      browse: '📚 အကြောင်းအရာများ ကြည့်ရှုရန်',
      post: '📤 အကြောင်းအရာ ပို့ရန်',
      date: '📅 ရက်စွဲအလိုက် ပို့ရန်',
      batch: '📦 အများအပြား ပို့ရန်',
      refresh: '🔄 အစီအစဉ် ပြန်လည်စစ်ဆေးရန်',
      templates: '📝 နမူနာပုံစံများ ထုတ်ရန်',
      rows: '📋 အကြောင်းအရာ စာရင်း'
    },
    errors: {
      notFound: '❌ အကြောင်းအရာ ရှာမတွေ့ပါ',
      postFailed: '❌ ပို့မရပါ - အသေးစိတ် logs တွင်ကြည့်ပါ',
      invalidRow: '❌ မှားယွင်းသော အတန်းနံပါတ်',
      noContent: '📭 Google Sheets တွင် အကြောင်းအရာမရှိပါ'
    },
    success: {
      posted: '✅ အောင်မြင်စွာ ပို့ပြီးပါပြီ!',
      templatesCreated: '📝 နမူနာပုံစံများ ဖန်တီးပြီး!',
      refreshed: '✅ အစီအစဉ် ပြန်လည်စစ်ဆေးပြီး!'
    }
  },

  // Callback messages
  callbacks: {
    processing: 'လုပ်ဆောင်နေသည်...',
    generatingStats: 'စာရင်းအင်းထုတ်နေသည်...',
    statsSent: '✅ စာရင်းအင်းများ ပို့ပြီး',
    summarySent: '✅ အကျဉ်းချုပ် ပို့ပြီး',
    pleaseJoinFirst: '@LuuKyone_Community သို့ အရင်ဝင်ပါ',
    optionRemoved: 'ဤရွေးချယ်ခွင့် ဖယ်ရှားပြီ',
    alertsAlwaysOn: 'ချိတ်ဆက်မှုအသိပေးချက်များ အမြဲဖွင့်ထား'
  },

  // ==================================================
  // 8. ERROR MESSAGES (Reference section)
  // ==================================================

  errors: {
    // General errors
    generic: '❌ အမှားတစ်ခုဖြစ်နေသည်',
    notMember: '❌ Community Channel သို့ အရင်ဝင်ပါ',
    startBotFirst: '❌ @luukyonebot ကို အရင်စတင်ပါ',

    // Post limits
    limitReached: '❌ လစဉ်အကန့်အသတ်ပြည့်သွားပြီ ({limit} posts)',
    ownPostsOnly: '❌ ကိုယ့်ပို့စ်ကိုသာ စီမံနိုင်သည်',

    // Input validation
    invalidDate: '❌ ရက်စွဲမှားယွင်းနေပါသည်',
    invalidWeight: '❌ အလေးချိန်မှားယွင်းနေပါသည်',
    enterWeightNumber: '❌ အလေးချိန် kg ဖြင့်ရိုက်ထည့်ပါ',
    categoryRequired: '❌ အမျိုးအစား အနည်းဆုံးတစ်ခုရွေးပါ',

    // Post operations
    postNotFound: '❌ ပို့စ်မတွေ့ရှိပါ',
    postingFailed: '❌ တင်ရန်မအောင်မြင်ပါ။ ထပ်ကြိုးစားပါ။',
    channelPostFailed: '⚠️ ပို့စ်သိမ်းထားပါသည်။ Channel တွင် Bot ကို Admin အဖြစ်ထည့်ပေးပါ',


    // System errors
    failedToSend: '❌ ပို့မရ - {error}'
  },

  // ==================================================
  // 9. EXTERNAL RESOURCES
  // ==================================================

  // URLs
  urls: {
    community: 'https://t.me/LuuKyone_Community'
  },

  // Channel welcome messages (array)
  channelWelcome: [
    '💚 လူကြုံ Community မှ ကြိုဆိုပါသည်\n\nအတူတကွ ကူညီမှုများ ဖန်တီးနိုင်ရန် လမ်းညွှန်ချက်များကို ဖတ်ရှုပါ။\nယုံကြည်မှုဖြင့် အတူလက်တွဲကြပါစို့။',
    '🤝 Community သို့ ရောက်ရှိတာကို ကျေးဇူးတင်ပါသည်\n\nပထမဆုံး ကူညီမှုကို @luukyonebot မှာ စတင်နိုင်ပါပြီ',
    '✨ ကျွန်ုပ်တို့၏ ကူညီမှုကွန်ရက်တွင် ပါဝင်တာကို ကျေးဇူးတင်ပါသည်\n\nစိတ်ချရသော ကူညီမှုများ ပြုလုပ်နိုင်ပါသည်',
    '🌟 လူကြုံ Community မှ ကြိုဆိုပါသည်\n\nလေးစားမှုနှင့် ယုံကြည်မှုဖြင့် အတူတကွ ဆောင်ရွက်ကြပါမည်'
  ],

  // Motivational quotes
  quotes: {
    milestone: {
      acts100: '"ကူညီမှု အကြိမ် ၁၀၀ ပြည့်ပါပြီ" - အားလုံးကျေးဇူးတင်ပါတယ်',
      members500: '"အဖွဲ့ဝင် ၅၀၀ ရှိလာပြီ" - အတူတူဆက်လက်ကူညီကြပါစို့',
      generic: '"ကူညီမှု {number} ကြိမ်" - ကျေးဇူးတင်ပါတယ်'
    },
    gratitude: '"Alone we can do so little;\ntogether we can do so much."'
  },

  // Safety reminders
  safety: {
    general: 'သင်၏ဘေးကင်းလုံခြုံမှုသည် ကျနော်တို့အတွက် ပထမဦးစားပေးဖြစ်သည်',
    documentation: 'လုပ်ဆောင်ချက်အားလုံးကို မှတ်တမ်းတင်ထားပါ',
    trust: 'If something feels wrong, it probably is!'
  },

  // Technical messages
  technical: {
    techNeedsKindness: '"Even technology needs kindness sometimes!"',
    productionWebhookRequired: 'Production requires webhook mode. Set RAILWAY_PUBLIC_DOMAIN in Railway.',
    webhookUrlChanged: 'Webhook URL changed, updating...',
    webhookAlreadyConfigured: 'Webhook already configured correctly, skipping update'
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