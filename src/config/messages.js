// Centralized message configuration for easy maintenance
// Messages in English, Buttons in Myanmar

const messages = {
  // Note: Cities, Categories, and Urgency data are defined in constants.js
  // This file only contains display messages and button labels

  // Button Labels (KEEP IN MYANMAR)
  buttons: {
    mainMenu: {
      travel: '✈️ ခရီးစဉ်',
      favor: '📦 အကူအညီ',
      browse: '📋 ပို့စ်များကြည့်ရန်',
      profile: '👤 အချက်လက်',
      help: '📚 အကူအညီ',
      settings: '⚙️ ဆက်တင်'
    },
    common: {
      cancel: '❌ ပယ်ဖျက်မည်',
      back: '⬅️ နောက်သို့',
      backToMenu: '🏠 မူလမီနူး',
      skip: '⏭️ ကျော်မည်',
      confirm: '✅ အတည်ပြုမည်',
      confirmCategories: '✅ အတည်ပြုမည်',
      confirmPost: '✅ အတည်ပြုမည်',
      yes: '✅ ဟုတ်သည်',
      no: '❌ မဟုတ်ပါ',
      contact: '💬 ဆက်သွယ်ရန်'
    },
    date: {
      today: '📅 ဒီနေ့',
      tomorrow: '📅 မနက်ဖြန်',
      custom: '📅 ရက်စွဲရွေးရန်'
    },
    weight: {
      less1: '< ၁ ကီလို',
      kg1to3: '၁-၃ ကီလို',
      kg3to5: '၃-၅ ကီလို',
      kg5to10: '၅-၁၀ ကီလို',
      more10: '> ၁၀ ကီလို',
      custom: '✏️ အခြားအလေးချိန်'
    },
    membership: {
      joinChannel: '📢 Community ချန်နယ်ဝင်ရန်',
      checkJoined: '✅ ဝင်ပြီးပြီ'
    }
  },

  // Scene Messages (MYANMAR)
  scenes: {
    travel: {
      title: '✈️ <b>ခရီးစဉ်မျှဝေရန်</b>',
      steps: {
        selectRoute: 'သွားမည့်လမ်းကြောင်းရွေးပါ',
        departure: 'ထွက်ခွာမည့်ရက်ရွေးပါ',
        departureCustom: 'ထွက်ခွာမည့်ရက် ရိုက်ထည့်ပါ (DD/MM/YYYY):',
        categories: 'သယ်ဆောင်နိုင်သည့် ပစ္စည်းအမျိုးအစားရွေးပါ',
        weight: 'သယ်ဆောင်နိုင်သည့် အလေးချိန်ရွေးပါ',
        weightCustom: 'အလေးချိန် kg ဖြင့်ရိုက်ထည့်ပါ (ဥပမာ - "၂၀"):'
      },
      categorySelection: {
        title: 'ရွေးထားသောအမျိုးအစားများ - ',
        prompt: 'ထပ်ရွေးရန် (သို့) အတည်ပြုရန်'
      },
      confirmation: {
        title: '✅ <b>ခရီးစဉ်တင်ပြီးပါပြီ</b>',
        reference: '📌 <b>Reference ID:</b> {postId}'
      },
      cancelled: '❌ ခရီးစဉ်တင်ခြင်း ပယ်ဖျက်ပြီ',
      whatToDo: 'ဘာလုပ်ချင်ပါသလဲ?',
      errorPosting: '❌ တင်ရန်မအောင်မြင်ပါ။ ထပ်ကြိုးစားပါ။'
    },

    favor: {
      title: '📦 <b>အကူအညီတောင်းရန်</b>',
      steps: {
        selectRoute: 'ပို့ဆောင်လိုသော လမ်းကြောင်းရွေးပါ',
        urgency: 'ပို့ဆောင်လိုသော အချိန်ရွေးပါ',
        categories: 'ပို့ဆောင်လိုသော ပစ္စည်းအမျိုးအစားရွေးပါ',
        weight: 'ပစ္စည်းအလေးချိန်ရွေးပါ',
        weightCustom: 'အလေးချိန် kg ဖြင့်ရိုက်ထည့်ပါ (ဥပမာ - "၂၀"):'
      },
      categorySelection: {
        title: 'ရွေးထားသောအမျိုးအစားများ -',
        prompt: 'ထပ်ရွေးရန် (သို့) အတည်ပြုရန်'
      },
      confirmation: {
        title: '✅ <b>တောင်းဆိုချက်တင်ပြီးပါပြီ</b>',
        reference: '📌 <b>Reference ID:</b> {postId}'
      },
      cancelled: '❌ တောင်းဆိုချက်တင်ခြင်း ပယ်ဖျက်ပြီ',
      whatToDo: 'ဘာလုပ်ချင်ပါသလဲ?',
      errorPosting: '❌ တင်ရန်မအောင်မြင်ပါ။ ထပ်ကြိုးစားပါ။'
    }
  },

  // Common Messages
  common: {
    operationCancelled: '❌ လုပ်ဆောင်ချက်ပယ်ဖျက်ပြီ',
    whatToDo: 'ဘာလုပ်ချင်ပါသလဲ?',
    howSpreadKindness: 'ဒီနေ့ ကြင်နာမှုဖြန့်ဖြူးမည်လား?',
    startBotFirst: '/start ဖြင့် စတင်ပါ',
    startBotFirstAlert: '❌ @luukyonebot ကို အရင်စတင်ပါ',
    ownPostsOnly: '❌ ကိုယ့်ပို့စ်ကိုသာ စီမံနိုင်သည်',
    failedToSend: '❌ ပို့မရ - {error}',
    botAdminRequired: '⚠️ ဗော့ကို ချန်နယ်စီမံခွင့်ပေးပါ'
  },

  // Admin Messages
  admin: {
    adminOnly: '❌ Admin များသာ အသုံးပြုနိုင်သည်',
    runningCleanup: '🧹 ရှင်းလင်းနေသည်...',
    cleanupCompleted: '✅ ရှင်းလင်းပြီးပြီ',
    cleanupFailed: '❌ ရှင်းလင်းမရ - {error}',
    errorAccessingMenu: '❌ မီနူးဝင်ရောက်မရ'
  },

  // Test Command Messages
  test: {
    welcomeMessageSent: '✅ ကြိုဆိုစာတမ်း စမ်းပို့ပြီး',
    dailyQuoteSent: '✅ နေ့စဉ်စကားစု စမ်းပို့ပြီး',
    summaryTitle: '📊 <b>နေ့စဉ်အကျဉ်းချုပ် စမ်းသပ်မှု</b>',
    milestoneMessageSent: '✅ ခရီးရောက်စာတမ်း စမ်းပို့ပြီး',
    gratitudePostSent: '✅ ကျေးဇူးတင်စာတမ်း စမ်းပို့ပြီး',
    safetyReminderSent: '✅ ဘေးကင်းရေး အသိပေးချက် စမ်းပို့ပြီး',
    routeHighlightSent: '✅ လမ်းကြောင်း အထူးအကြောင်း စမ်းပို့ပြီး',
    sendingWelcome: 'ကြိုဆိုစာတမ်း ပို့နေသည်...',
    sendingQuote: 'နေ့စဉ်စကားစု ပို့နေသည်...',
    sendingMilestone: 'ခရီးရောက်ခြင်း ပို့နေသည်...',
    sendingGratitude: 'ကျေးဇူးတင်စာတမ်း ပို့နေသည်...',
    sendingSafety: 'ဘေးကင်းရေး အသိပေးချက် ပို့နေသည်...',
    sendingHighlight: 'လမ်းကြောင်း အထူးအကြောင်း ပို့နေသည်...'
  },

  // System Messages
  system: {
    channelMembershipRequired: '📢 @LuuKyone_Community သို့ အရင်ဝင်ပါ',
    checkMembership: 'အဖွဲ့ဝင်အခြေအနေ စစ်ဆေးနေသည်...',
    savingPost: 'ပို့စ်သိမ်းဆည်းနေသည်...',
    postingToChannel: 'ချန်နယ်သို့ တင်နေသည်...'
  },

  // Validation Messages
  validation: {
    selectCategories: '❌ အမျိုးအစား အနည်းဆုံးတစ်ခုရွေးပါ',
    enterWeightNumber: '❌ အလေးချိန် kg ဖြင့်ရိုက်ထည့်ပါ',
    invalidDate: '❌ ရက်စွဲမှားယွင်းနေပါသည်',
    invalidWeight: '❌ အလေးချိန်မှားယွင်းနေပါသည်'
  },

  // Error Messages
  errors: {
    generic: '❌ အမှားတစ်ခုဖြစ်နေသည်',
    notMember: '❌ Community ချန်နယ်သို့ အရင်ဝင်ပါ',
    limitReached: '❌ လစဉ်အကန့်အသတ်ပြည့်သွားပြီ ({limit} posts)',
    invalidDate: '❌ ရက်စွဲမှားယွင်းနေပါသည်',
    invalidWeight: '❌ အလေးချိန်မှားယွင်းနေပါသည်',
    enterWeightNumber: '❌ အလေးချိန် kg ဖြင့်ရိုက်ထည့်ပါ',
    noActivePost: '📭 လက်ရှိတွင် တက်ကြွသောပို့စ်မရှိပါ',
    categoryRequired: '❌ အမျိုးအစား အနည်းဆုံးတစ်ခုရွေးပါ',
    postNotFound: '❌ ပို့စ်မတွေ့ရှိပါ',
    cannotContactSelf: '❌ ကိုယ့်ကိုယ်ကို ဆက်သွယ်၍မရပါ',
    alreadyContacted: '❌ ဤပို့စ်အတွက် ဆက်သွယ်ပြီးသားဖြစ်သည်',
    channelPostFailed: '⚠️ ပို့စ်သိမ်းထားပါသည်။ ချန်နယ်တွင် ဗော့ကို Admin အဖြစ်ထည့်ပေးပါ',
    chatNotFound: '❌ ဆက်သွယ်၍မရပါ'
  },

  // Help Messages
  help: {
    title: '📚 <b>Luu Kyone အသုံးပြုနည်း</b>',
    intro: {
      title: '<b>Luu Kyone ဆိုတာဘာလဲ?</b>',
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
      start: '/start - ဗော့စတင်ရန်',
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
      title: '<b>ဘေးကင်းရေး-</b>',
      meet: '✅ အများသုံးနေရာတွင်သာ တွေ့ဆုံပါ',
      verify: '✅ ပစ္စည်းများ အတည်ပြုပါ',
      photos: '✅ လက်လွှဲပြောင်းခြင်း ဓာတ်ပုံရိုက်ပါ',
      prohibited: '✅ တားမြစ်ပစ္စည်းများ မပါဝင်ပါစေ',
      instincts: '✅ အတွင်းစိတ်ကို ယုံကြည်ပါ'
    },
    support: '<b>အကူအညီ-</b> @LuuKyone_Community'
  },

  // Command Messages
  commands: {
    start: {
      notMember: {
        title: '📢 <b>Community ချန်နယ်သို့ အရင်ဝင်ပါ</b>',
        description: 'Luu Kyone ကိုအသုံးပြုရန် Community ချန်နယ်သို့ဝင်ရန် လိုအပ်ပါသည်',
        steps: {
          title: '<b>ဝင်နည်း-</b>',
          step1: '1️⃣ @LuuKyone_Community သို့သွားပါ',
          step2: '2️⃣ "Join" နှိပ်ပါ',
          step3: '3️⃣ ဤနေရာသို့ပြန်လာပြီး "ဝင်ပြီးပြီ" နှိပ်ပါ'
        },
        button: 'ချန်နယ်ဖွင့်ရန်!'
      },
      newUser: {
        greeting: '💚 <b>ကြိုဆိုပါသည်!</b>\n\n{userName} မင်္ဂလာပါ!',
        intro: '<b>Luu Kyone</b> သည် ခရီးသွားများနှင့် အကူအညီလိုအပ်သူများကို ချိတ်ဆက်ပေးသော platform တစ်ခုဖြစ်ပါသည်',
        howItWorks: '<b>အလုပ်လုပ်ပုံ-</b>\n✈️ <b>ခရီးထွက်မည်လား?</b> လက်ဆွဲအိတ်ထဲက နေရာလွတ်လေးကို အသုံးချပါ\n🤝 <b>အကူအညီလိုအပ်လား?</b>',
        routes: '<b>ခရီးစဉ်များ-</b> 🇸🇬 Singapore ↔ 🇹🇭 Bangkok ↔ 🇲🇲 Yangon',
        motto: '<i>"လူသန်းပေါင်းများစွာ၏ ကြင်နာမှုသည် ကမ္ဘာကြီးကို ပြောင်းလဲစေနိုင်သည်"</i>',
        ready: 'ကြင်နာမှုဖြန့်ဖြူးရန် အဆင်သင့်ဖြစ်ပြီလား?',
        title: '💚 <b>ကြိုဆိုပါသည်!</b>',
        greetingShort: '{userName} မင်္ဂလာပါ!',
        benefits: {
          title: '<b>သင်ဘာလုပ်နိုင်မလဲ-</b>',
          travel: '✈️ <b>ခရီးထွက်မည်လား?</b> - နေရာလွတ်လေးကို အသုံးချပါ',
          favor: '📦 <b>အကူအညီလိုအပ်လား?</b> - ကြင်နာသောခရီးသွားများ ရှိပါသည်',
          connect: '🤝 <b>ချိတ်ဆက်ပါ</b> - တိုက်ရိုက်စီစဉ်ပါ'
        },
        start: '🚀 စတင်ရန်'
      },
      returningUser: {
        greeting: '{userName} ပြန်လာတာ ဝမ်းသာပါတယ်🤝',
        motto: '<i>"ကြင်နာမှုတိုင်းသည် ရေလှိုင်းတစ်ခုကို ဖန်တီးပေးသည်"</i>',
        impact: '<b>သင့်ရဲ့အကျိုးသက်ရောက်မှု-</b>',
        postsMonth: '📊 ဒီလအတွင်း အကူအညီများ- {current}/{limit}',
        completedFavors: '💚 ကြင်နာမှုများ- {count}',
        makingDifference: '⭐ သင်ဟာ ကွာခြားမှုတစ်ခုကို ဖန်တီးနေပါတယ်!',
        firstAct: '🌱 သင့်ရဲ့ ပထမဆုံး ကြင်နာမှုအတွက် စောင့်မျှော်နေပါတယ်!',
        ready: 'ဒီနေ့ တစ်စုံတစ်ယောက်က သင့်အကူအည့်ကို လိုအပ်နေလိမ့်မယ်',
        title: '✅ <b>ပြန်လည်ကြိုဆိုပါသည်!</b>',
        greetingShort: '{userName}၊ ပြန်တွေ့ရတာ ဝမ်းသာပါတယ်! 🤗',
        prompt: 'ကျွန်ုပ်တို့၏ အသိုင်းအဝိုင်း ကြီးထွားလာနေသည်'
      }
    },
    stats: {
      title: '📊 <b>Luu Kyone စာရင်းအင်းများ</b>',
      community: '<b>👥 Community-</b>\n• အဖွဲ့ဝင်စုစုပေါင်း- {members}',
      activePosts: '<b>📋 တက်ကြွသောပို့စ်များ-</b>\n• ခရီးစဉ်များ- {travels}\n• တောင်းဆိုချက်များ- {favors}',
      thisMonth: '<b>📅 ဒီလ-</b>\n• ခရီးစဉ်အသစ်- {travels}\n• တောင်းဆိုချက်အသစ်- {favors}',
      allTime: '<b>✅ စုစုပေါင်းအောင်မြင်မှုများ-</b>\n• ပြီးစီးခရီးစဉ်- {travels}\n• ပြီးစီးအကူအညီ- {favors}',
      impact: '<b>🌟 အကျိုးသက်ရောက်မှု-</b>\n• {lives} ဘဝများ ထိတွေ့ခံစားရ\n• နိုင်ငံ ၃ နိုင်ငံ ချိတ်ဆက်',
      footer: '@luukyonebot'
    },
    channelInfo: {
      title: '📢 <b>ချန်နယ်နှင့် ဗော့</b>',
      howTheyWork: '<b>အတူတကွ အလုပ်လုပ်ပုံ-</b>\n• ဗော့ - ပို့စ်များဖန်တီးရန်\n• ချန်နယ် - ပို့စ်များပြသရန်',
      userJourney: '<b>အသုံးပြုနည်း-</b>\n1️⃣ ဗော့ဖြင့် ပို့စ်ဖန်တီးပါ\n2️⃣ ပို့စ်သည် ချန်နယ်တွင်ပေါ်လာမည်\n3️⃣ Community မှ မှတ်ချက်ပေးကြမည်\n4️⃣ ဗော့က အသိပေးမည်\n5️⃣ တိုက်ရိုက်ချိတ်ဆက်ပါ',
      whySystem: '<b>စနစ်၏အကျိုးကျေးဇူး-</b>\n• ချန်နယ် = အများမြင်နိုင်\n• ဗော့ = ကိုယ်ပိုင်ထိန်းချုပ်မှု\n• မှတ်ချက်များ = ပွင့်လင်းမြင်သာမှု',
      tips: '<b>အကြံပြုချက်များ-</b>\n• တက်ကြွသောပို့စ်များအတွက် ချန်နယ်စစ်ပါ\n• ပို့စ်ဖန်တီးရန် ဗော့သုံးပါ\n• အကူအညီပေးရန် မှတ်ချက်ပေးပါ',
      footer: 'ချန်နယ်- @LuuKyone_Community\nဗော့- @luukyonebot'
    },
    profile: {
      title: '👤 <b>သင့်ရဲ့ Profile</b>',
      info: 'အမည်- {userName}\nUsername- {username}\nအဖွဲ့ဝင်အမျိုးအစား- {memberType}',
      statistics: '<b>📊 စာရင်းအင်းများ-</b>\nဒီလပို့စ်များ- {current}/{limit}\nပြီးစီးအကူအညီ- {completed}\n{rating}',
      memberSince: 'ဝင်ရောက်သည့်ရက်- {date}',
      noRating: 'အဆင့်သတ်မှတ်ချက် မရှိသေးပါ',
      ratingStars: 'အဆင့်သတ်မှတ်ချက်- {stars} ({rating}/5)'
    },
    browse: {
      title: '📋 <b>လတ်တလော ပို့စ်များ</b>',
      travelPlans: '<b>✈️ ခရီးစဉ်များ-</b>',
      favorRequests: '<b>📦 တောင်းဆိုချက်များ-</b>',
      footer: '@LuuKyone_Community'
    },
    postLimit: {
      reached: '❌ လစဉ်အကန့်အသတ်ပြည့်သွားပြီ\nအသုံးပြုပြီး- {current}/{limit}'
    }
  },

  // Settings Messages
  settings: {
    title: '⚙️ <b>ဆက်တင်များ</b>',
    preferences: 'ဦးစားပေးချက်များ-',
    notifications: {
      connection: '🔔 ချိတ်ဆက်မှု အသိပေးချက်များ- ဖွင့်ထား',
      daily: '📊 နေ့စဉ်အကျဉ်းချုပ်- {status}'
    },
    tip: '💡 ချိတ်ဆက်မှုအသိပေးချက်များကို အမြဲဖွင့်ထားပါ',
    confirmOn: '✅ နေ့စဉ်အကျဉ်းချုပ်များ ဖွင့်ထားပြီ',
    confirmOff: '📵 နေ့စဉ်အကျဉ်းချုပ်များ ပိတ်ထားပြီ'
  },

  // Channel Messages
  channel: {
    travelPost: {
      header: '✈️ <b>ကြင်နာသောခရီးသွား - ကူညီနိုင်သည်</b>',
      route: '📍 ခရီးစဉ်- {route}',
      date: '📅 ရက်စွဲ- {date}',
      weight: '📦 နေရာလွတ်- {weight}',
      categories: '✅ လက်ခံမည်- {categories}'
    },
    favorPost: {
      header: '💝 <b>ကြင်နာမှု လိုအပ်နေသည်</b>',
      route: '📍 ခရီးစဉ်- {route}',
      urgency: '⏰ အရေးတကြီးအဆင့်- {urgency}',
      categories: '📦 အမျိုးအစား- {categories}',
      weight: '⚖️ အလေးချိန်- {weight}'
    },
    completed: 'ဤပို့စ်ပြီးဆုံးပြီ။ ကျေးဇူးတင်ပါသည်! 💚',
    cancelled: 'ဤပို့စ်ပယ်ဖျက်ပြီ',
    expired: 'ဤပို့စ်သက်တမ်းကုန်သွားပြီ',
    dailySummary: {
      morning: {
        title: '☀️ <b>နံနက်ခင်း အကျဉ်းချုပ်</b>',
        subtitle: 'ဒီနေ့ ကြင်နာမှုမျှဝေပါ',
        travelCount: '✈️ ခရီးစဉ် {count} ခု-',
        favorCount: '📦 တောင်းဆိုချက် {count} ခု-',
        noActive: '📭 လက်ရှိတွင် ပို့စ်မရှိပါ',
        footer: '@luukyonebot'
      },
      evening: {
        title: '🌙 <b>ညနေခင်း အကျဉ်းချုပ်</b>',
        subtitle: 'သင်ဘယ်လိုကူညီနိုင်မလဲ စစ်ဆေးကြည့်ပါ',
        travelCount: '✈️ ခရီးစဉ် {count} ခု-',
        favorCount: '📦 တောင်းဆိုချက် {count} ခု-',
        noActive: '📭 လက်ရှိတွင် ပို့စ်မရှိပါ',
        footer: '@luukyonebot'
      }
    }
  },

  // Contact Messages
  contact: {
    receivedInfo: {
      title: '✅ <b>ဆက်သွယ်ရန်အချက်အလက် ရပြီ</b>',
      postType: 'ဤ {postType} အတွက် ဆက်သွယ်ရန် တောင်းဆိုထားပါသည်-',
      route: '<b>ခရီးစဉ်-</b> {route}',
      date: '<b>ရက်စွဲ-</b> {date}',
      contactPerson: '<b>ဆက်သွယ်ရန်-</b>',
      tip: '💡 မိမိကိုယ်ကို မိတ်ဆက်ခြင်းဖြင့် စတင်ပါ',
      oneTime: '⚠️ တစ်ကြိမ်တည်း မိတ်ဆက်ခွင့်သာရှိသည်'
    },
    newMatch: {
      title: '🔔 <b>သင့်ပို့စ်အတွက် အသစ်တွေ့ရှိမှု!</b>',
      someone: 'တစ်စုံတစ်ယောက်က {action}-',
      route: '<b>ခရီးစဉ်-</b> {route}',
      postId: '<b>ပို့စ် ID-</b> #{postId}',
      interested: '<b>စိတ်ဝင်စားသူ-</b>',
      willContact: 'အသေးစိတ်ဆွေးနွေးရန် ဆက်သွယ်မည်',
      tip: '💡 မဆက်သွယ်ပါက သင်ကိုယ်တိုင် စတင်နိုင်သည်'
    }
  },

  // My Posts Messages
  myposts: {
    title: '📋 <b>သင့်ရဲ့ ပို့စ်များ</b>',
    empty: 'လောလောဆယ် တင်ထားသော ပို့စ်များ မရှိပါ',
    selectPost: 'စီမံရန် ပို့စ်ရွေးပါ-',
    managePost: {
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
    cancelled: '❌ ပို့စ်ပယ်ဖျက်ပြီ',
    backToList: '🔙 ပို့စ်စာရင်းသို့ ပြန်သွားရန်',
    markComplete: '✅ ပြီးဆုံးပြီဟု မှတ်သားရန်',
    cancelPost: '❌ ပို့စ်ပယ်ဖျက်ရန်'
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

  // Comment Notifications
  notifications: {
    comment: {
      single: '💬 @{username} က သင့်ရဲ့ {postType} ပို့စ် #{postId} ကို မှတ်ချက်ပေးထားသည်',
      multiple: '💬 #{postId} တွင် မှတ်ချက်အသစ် {count} ခု'
    }
  },

  // Callback Processing Messages
  callbacks: {
    processing: 'လုပ်ဆောင်နေသည်...',
    generatingStats: 'စာရင်းအင်းထုတ်နေသည်...',
    weeklyStatsSent: '✅ သီတင်းပတ်စာရင်းအင်းများ ပို့ပြီး',
    morningSummarySent: '✅ နံနက်ခင်းအကျဉ်းချုပ် ပို့ပြီး',
    eveningSummarySent: '✅ ညနေခင်းအကျဉ်းချုပ် ပို့ပြီး',
    pleaseJoinFirst: '@LuuKyone_Community သို့ အရင်ဝင်ပါ',
    thisOptionRemoved: 'ဤရွေးချယ်ခွင့် ဖယ်ရှားပြီ',
    connectionAlertsAlwaysOn: 'ချိတ်ဆက်မှုအသိပေးချက်များ အမြဲဖွင့်ထား'
  },
  
  // Shared Handler Messages
  shared: {
    useStartForLink: '/start ဖြင့် လင့်ခ်ရယူပါ',
    limitResetsNextMonth: 'လာမည့်လတွင် အကန့်အသတ် ပြန်စမည်',
    chooseOptionBelow: 'စတင်ရန် အောက်ပါရွေးချယ်ခွင့်များထဲမှ တစ်ခုရွေးပါ'
  },

  // Channel Welcome Messages
  channelWelcome: [
    '💚 Luu Kyone Community မှ ကြိုဆိုပါသည်\n\nကျေးဇူးပြု၍ ကျွန်ုပ်တို့၏ community guidelines များကို ဖတ်ရှုပါ။\nကြင်နာမှုဖြင့် အတူတကွ ကူညီကြပါစို့။',
    '🤝 ကျေးဇူးတင်ပါသည် Community သို့ ဝင်ရောက်တာကို\n\nသင့်ရဲ့ ပထမဆုံး ကြင်နာမှုလုပ်ဆောင်ချက်ကို စတင်ရန် @luukyonebot ကို သုံးပါ',
    '✨ ကျေးဇူးတင်ပါသည် ကျွန်ုပ်တို့၏ kindness network တွင် ပါဝင်တာကို\n\nစိတ်ချလက်ချ ကူညီမှုများ ပြုလုပ်နိုင်ပါသည်',
    '🌟 Luu Kyone Community သို့ ကြိုဆိုပါသည်\n\nယုံကြည်မှုနှင့် လေးစားမှုဖြင့် အတူတကွ အလုပ်လုပ်ကြပါမည်'
  ],

  // Channel Motivational Quotes
  channelQuotes: {
    milestone: {
      acts100: '"Together, we\'re not just moving items.\nWe\'re moving hearts."',
      members500: '"Every new member makes our\nkindness network stronger!"',
      generic: '"Small acts × {number} = Big impact!"'
    },
    gratitude: '"Alone we can do so little;\ntogether we can do so much."'
  },

  // Safety Reminders
  safetyReminders: {
    general: 'သင်၏ဘေးကင်းလုံခြုံမှုသည် ကျနော်တို့အတွက် ပထမဦးစားပေးဖြစ်သည်',
    documentation: 'လုပ်ဆောင်ချက်အားလုံးကို မှတ်တမ်းတင်ထားပါ',
    trust: 'If something feels wrong, it probably is!'
  },

  // Bot System Messages
  system: {
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