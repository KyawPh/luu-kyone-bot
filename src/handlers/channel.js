const { collections, admin } = require('../config/firebase');
const { logger, logEvent } = require('../utils/logger');
const { config } = require('../config');

const setupChannelHandlers = (bot) => {
  // Handle new members joining the channel
  bot.on('chat_member', async (ctx) => {
    try {
      // Check if this is for our community channel
      if (ctx.chat.id.toString() !== config.telegram.channelId) {
        return;
      }

      const { new_chat_member, old_chat_member } = ctx.chatMember;
      
      // Check if someone joined the channel
      if (old_chat_member.status === 'left' && 
          ['member', 'administrator', 'creator'].includes(new_chat_member.status)) {
        
        // Don't welcome bots
        if (new_chat_member.user.is_bot) {
          return;
        }
        
        const userName = new_chat_member.user.first_name || 'Friend';
        logEvent.memberJoinedChannel(userName);
        
        // Send a welcome message to the channel
        const welcomeMessages = [
          `💚 Welcome to our kindness family!\n\n"Your journey of a thousand acts of kindness begins with a single favor."\n\nReady to help? Start here: @luukyonebot`,
          `🤝 Another kind soul joins us!\n\n"Together we're building bridges of kindness across cities."\n\nShare your journey: @luukyonebot`,
          `✨ Welcome, neighbor!\n\n"Every new member makes our community stronger and kinder."\n\nBegin spreading joy: @luukyonebot`,
          `🌟 So happy you're here!\n\n"In a world where you can be anything, you chose to be kind."\n\nStart your kindness story: @luukyonebot`
        ];
        
        // Pick a random welcome message
        const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
        
        await bot.telegram.sendMessage(
          config.telegram.channelId,
          `${randomMessage}\n\n` +
          `#WelcomeWednesday #LuuKyoneFamily #KindnessInAction`,
          { parse_mode: 'HTML' }
        );
        
        logEvent.channelMessageSent('welcome');
        
        // Update stats (optional - track member count)
        try {
          const statsDoc = collections.stats || collections.users.doc('_stats');
          await statsDoc.update({
            totalMembers: admin.firestore.FieldValue.increment(1),
            lastMemberJoined: new Date()
          });
        } catch (error) {
          // Stats tracking is optional, don't fail if it doesn't work
        }
      }
      
      // Handle member leaving (optional)
      if (['member', 'administrator'].includes(old_chat_member.status) && 
          old_chat_member.status !== new_chat_member.status) {
        // Member left - we could track this but won't announce it
        try {
          const statsDoc = collections.stats || collections.users.doc('_stats');
          await statsDoc.update({
            totalMembers: admin.firestore.FieldValue.increment(-1)
          });
        } catch (error) {
          // Stats tracking is optional
        }
      }
    } catch (error) {
      logger.error('Channel member update failed', { error: error.message });
    }
  });

  // Handle messages/comments in the channel
  bot.on('channel_post', async (ctx) => {
    try {
      // Check if this is our channel
      if (ctx.chat.id.toString() !== config.telegram.channelId) {
        return;
      }
      
      // Check if this is a comment (reply to a message)
      if (ctx.channelPost.reply_to_message) {
        const originalMessageId = ctx.channelPost.reply_to_message.message_id;
        const commenter = ctx.channelPost.from;
        
        // Skip if no username (can't contact them)
        if (!commenter || !commenter.username) {
          return;
        }
        
        // Find the post by channel message ID
        const [travelPosts, favorPosts] = await Promise.all([
          collections.travelPlans
            .where('channelMessageId', '==', originalMessageId)
            .limit(1)
            .get(),
          collections.favorRequests
            .where('channelMessageId', '==', originalMessageId)
            .limit(1)
            .get()
        ]);
        
        let post = null;
        let postType = null;
        
        if (!travelPosts.empty) {
          post = travelPosts.docs[0].data();
          postType = 'travel';
        } else if (!favorPosts.empty) {
          post = favorPosts.docs[0].data();
          postType = 'favor';
        }
        
        if (post) {
          // Don't notify if commenter is the post owner
          if (commenter.id && commenter.id.toString() === post.userId) {
            return;
          }
          
          // Send simple notification to post owner
          const message = `💬 @${commenter.username} commented on your ${postType} post #${post.postId}`;
          
          try {
            await bot.telegram.sendMessage(post.userId, message);
            
            // Log the comment notification
            logger.info('Comment notification sent', {
              postId: post.postId,
              postType,
              commenter: commenter.username,
              ownerId: post.userId
            });
          } catch (error) {
            // User might have blocked the bot
            logger.debug('Could not send notification to user', { 
              userId: post.userId, 
              error: error.message 
            });
          }
        }
      }
      
    } catch (error) {
      logger.error('Channel post error', { error: error.message });
    }
  });

  // Celebrate milestones (called from other functions when milestones are reached)
  bot.telegram.celebrateMilestone = async (type, number) => {
    const messages = {
      kindness: `🎊 <b>KINDNESS MILESTONE!</b>\n\n` +
                `We've just completed our ${number}th act of kindness! 💚\n\n` +
                `That's ${number} times someone smiled because of YOUR help.\n` +
                `${number} families connected across borders.\n` +
                `${number} proofs that humanity is beautiful.\n\n` +
                `<i>"Together, we're not just moving items.\nWe're moving hearts."</i>\n\n` +
                `Thank you for being part of this journey! 🙏`,
      
      members: `🎉 <b>COMMUNITY MILESTONE!</b>\n\n` +
               `Our ${number}th kind soul just joined the family! 🤝\n\n` +
               `That's ${number} people choosing kindness.\n` +
               `${number} neighbors ready to help.\n` +
               `${number} reasons to believe in good.\n\n` +
               `<i>"Every new member makes our\nkindness network stronger!"</i>\n\n` +
               `Welcome to all our new friends! 💚`,
      
      posts: `✨ <b>ACTIVITY MILESTONE!</b>\n\n` +
             `${number} favors and journeys shared! ✈️\n\n` +
             `Every post is a chance for kindness.\n` +
             `Every journey, an opportunity to help.\n` +
             `Every favor, a life touched.\n\n` +
             `<i>"Small acts × ${number} = Big impact!"</i>\n\n` +
             `Keep the kindness flowing! 🌊`
    };
    
    if (messages[type]) {
      try {
        await bot.telegram.sendMessage(
          config.telegram.channelId,
          messages[type] + '\n\n#MilestoneMoment #LuuKyone #KindnessWins',
          { parse_mode: 'HTML' }
        );
      } catch (error) {
        logger.error('Failed to send milestone message', { error: error.message });
      }
    }
  };

  // Weekly gratitude post (Thursday)
  bot.telegram.sendGratitudePost = async () => {
    try {
      // Get stats for the week (mock data for now)
      const weeklyStats = {
        favorsCompleted: Math.floor(Math.random() * 30) + 10,
        routesActive: Math.floor(Math.random() * 6) + 3,
        newMembers: Math.floor(Math.random() * 50) + 20
      };
      
      await bot.telegram.sendMessage(
        config.telegram.channelId,
        `🙏 <b>Thank You Thursday!</b>\n\n` +
        `This week, our amazing community:\n\n` +
        `💚 Completed ${weeklyStats.favorsCompleted} acts of kindness\n` +
        `✈️ Connected across ${weeklyStats.routesActive} routes\n` +
        `🤝 Welcomed ${weeklyStats.newMembers} new neighbors\n\n` +
        `Every favor matters. Every journey counts.\n` +
        `Every one of YOU makes this possible.\n\n` +
        `<i>"Alone we can do so little;\ntogether we can do so much."</i>\n\n` +
        `Thank you for choosing kindness! 🙏\n\n` +
        `#ThankYouThursday #GratefulHeart #LuuKyoneFamily`,
        { parse_mode: 'HTML' }
      );
    } catch (error) {
      logger.error('Failed to send gratitude post', { error: error.message });
    }
  };
  
  // Safety reminder (Friday)
  bot.telegram.sendSafetyReminder = async () => {
    const safetyTips = [
      {
        title: "Meeting Safely",
        tips: [
          "✅ Airport terminals",
          "✅ Hotel lobbies", 
          "✅ Coffee shops",
          "❌ Private homes",
          "❌ Dark alleys"
        ],
        reminder: "Your safety = Our priority!"
      },
      {
        title: "Smart Documentation",
        tips: [
          "📸 Photo before handover",
          "📸 Photo during exchange",
          "📸 Photo after receiving",
          "💬 Save chat history",
          "📝 Note contact details"
        ],
        reminder: "Document everything, stay protected!"
      },
      {
        title: "Trust Your Instincts",
        tips: [
          "🚫 Unknown packages",
          "🚫 Suspicious requests",
          "🚫 Rushed decisions",
          "✅ Clear communication",
          "✅ Verified items only"
        ],
        reminder: "If something feels wrong, it probably is!"
      }
    ];
    
    const safety = safetyTips[Math.floor(Math.random() * safetyTips.length)];
    
    try {
      await bot.telegram.sendMessage(
        config.telegram.channelId,
        `🛡️ <b>Safety First Friday!</b>\n\n` +
        `<b>${safety.title}:</b>\n${safety.tips.join('\n')}\n\n` +
        `<i>${safety.reminder}</i>\n\n` +
        `Stay safe, spread kindness! 💚\n\n` +
        `#SafetyFirst #FridayReminder #StaySafe`,
        { parse_mode: 'HTML' }
      );
    } catch (error) {
      logger.error('Failed to send safety reminder', { error: error.message });
    }
  };
  
  // Route highlight (Tuesday)
  bot.telegram.sendRouteHighlight = async () => {
    const routes = [
      { from: '🇸🇬 Singapore', to: '🇲🇲 Yangon', tag: '#SGtoYGN' },
      { from: '🇲🇲 Yangon', to: '🇸🇬 Singapore', tag: '#YGNtoSG' },
      { from: '🇸🇬 Singapore', to: '🇹🇭 Bangkok', tag: '#SGtoBKK' },
      { from: '🇹🇭 Bangkok', to: '🇸🇬 Singapore', tag: '#BKKtoSG' },
      { from: '🇹🇭 Bangkok', to: '🇲🇲 Yangon', tag: '#BKKtoYGN' },
      { from: '🇲🇲 Yangon', to: '🇹🇭 Bangkok', tag: '#YGNtoBKK' }
    ];
    
    const route = routes[Math.floor(Math.random() * routes.length)];
    
    try {
      await bot.telegram.sendMessage(
        config.telegram.channelId,
        `📍 <b>Route Spotlight Tuesday!</b>\n\n` +
        `<b>${route.from} → ${route.to}</b>\n\n` +
        `This week on this route:\n` +
        `• ${Math.floor(Math.random() * 15) + 5} travelers ready to help\n` +
        `• ${Math.floor(Math.random() * 10) + 3} favors waiting\n` +
        `• Most needed: Medicine & Documents\n\n` +
        `Traveling this route soon?\n` +
        `Your empty luggage space = Someone's happiness! 💚\n\n` +
        `Check who needs help: @luukyonebot\n\n` +
        `${route.tag} #RouteSpotlight #TravelWithPurpose`,
        { parse_mode: 'HTML' }
      );
    } catch (error) {
      logger.error('Failed to send route highlight', { error: error.message });
    }
  };
  
  // Daily kindness quote (can be called by a cron job)
  bot.telegram.sendDailyQuote = async () => {
    const quotes = [
      { quote: "Your empty luggage space can bring joy to someone", author: "Luu Kyone Community" },
      { quote: "5 minutes of your time = Endless gratitude", author: "A grateful neighbor" },
      { quote: "Small favors, big impact on lives", author: "Community wisdom" },
      { quote: "Travel with purpose, return with stories", author: "Frequent traveler" },
      { quote: "Kindness knows no borders", author: "Cross-border helper" },
      { quote: "Every favor strengthens our bond", author: "Community member" },
      { quote: "Trust builds communities", author: "Luu Kyone founder" },
      { quote: "Your neighbor might be traveling to your hometown", author: "Happy recipient" }
    ];
    
    const daily = quotes[Math.floor(Math.random() * quotes.length)];
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    
    try {
      await bot.telegram.sendMessage(
        config.telegram.channelId,
        `🌅 <b>${dayOfWeek} Motivation</b>\n\n` +
        `"${daily.quote}"\n` +
        `<i>— ${daily.author}</i>\n\n` +
        `Someone needs your help today. Check active favors:\n` +
        `👉 @luukyonebot\n\n` +
        `#Daily${dayOfWeek} #KindnessInAction #LuuKyone`,
        { parse_mode: 'HTML' }
      );
    } catch (error) {
      logger.error('Failed to send daily quote', { error: error.message });
    }
  };
};

module.exports = setupChannelHandlers;