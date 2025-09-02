const { collections, admin } = require('../config/firebase');
const { logger, logEvent } = require('../utils/logger');
const { config } = require('../config');
const { messages, formatMessage } = require('../config/messages');

const setupChannelHandlers = (bot) => {
  // Debug: Log ALL update types to see what we're receiving
  bot.on('message', async (ctx) => {
    const chatId = ctx.chat?.id?.toString();
    if (chatId === config.telegram.discussionGroupId || chatId === config.telegram.channelId) {
      logger.info('🔍 DEBUG: Message event in our group/channel', {
        chatId: chatId,
        chatType: ctx.chat.type,
        messageId: ctx.message?.message_id,
        hasReplyTo: !!ctx.message?.reply_to_message,
        replyToId: ctx.message?.reply_to_message?.message_id,
        fromUser: ctx.from?.username,
        text: ctx.message?.text?.substring(0, 50)
      });
      
      // If this is a reply in the discussion group, handle it as a comment
      if (chatId === config.telegram.discussionGroupId && ctx.message?.reply_to_message) {
        logger.info('💬 Comment detected via message event!', {
          originalMessageId: ctx.message.reply_to_message.message_id,
          commenter: ctx.from?.username
        });
        
        // Try to find the post by the original message ID
        const originalMessageId = ctx.message.reply_to_message.message_id;
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
        
        logger.info('📊 Post search results', {
          travelFound: !travelPosts.empty,
          favorFound: !favorPosts.empty
        });
        
        let post = null;
        let postType = null;
        
        if (!travelPosts.empty) {
          post = travelPosts.docs[0].data();
          postType = 'travel';
        } else if (!favorPosts.empty) {
          post = favorPosts.docs[0].data();
          postType = 'favor';
        }
        
        if (post && ctx.from?.username) {
          // Don't notify if commenter is the post owner
          if (ctx.from.id.toString() !== post.userId) {
            const message = `💬 @${ctx.from.username} commented on your ${postType} post #${post.postId}`;
            
            try {
              await bot.telegram.sendMessage(post.userId, message);
              logger.info('✅ Comment notification sent via message handler', {
                postId: post.postId,
                ownerId: post.userId
              });
            } catch (error) {
              logger.error('Failed to send notification', { error: error.message });
            }
          }
        }
      }
    }
  });
  
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
          `💚 Welcome to Luu Kyone Community!\n\n<b>How to participate:</b>\n1️⃣ Open @luukyonebot\n2️⃣ Share your travel plans or request delivery\n3️⃣ Help connect travelers with those in need\n\n✅ FREE | ✅ SAFE | ✅ COMMUNITY-DRIVEN`,
          `🤝 Welcome aboard!\n\n<b>Quick Start:</b>\n✈️ Traveling? Post at @luukyonebot\n📦 Need delivery? Request at @luukyonebot\n💬 See a post? Comment to connect!\n\n"Together we're building bridges of kindness"`,
          `✨ Welcome to our family!\n\n<b>Get Started:</b>\n👉 @luukyonebot - Your gateway to kindness\n\nPost travels, request deliveries, help neighbors!\nYGN ↔️ SG ↔️ BKK Routes`,
          `🌟 So happy you're here!\n\n<b>Join the movement:</b>\n📱 Bot: @luukyonebot\n💬 Channel: Comment on posts\n🤝 Community: Help each other\n\nEvery small act creates big impact!`
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
      const chatId = ctx.chat.id.toString();
      const isOurChannel = chatId === config.telegram.channelId;
      const isOurDiscussionGroup = config.telegram.discussionGroupId && 
                                   chatId === config.telegram.discussionGroupId;
      
      // Log ALL channel_post events for debugging
      logger.info('📨 Channel post event received', {
        chatId: chatId,
        chatType: ctx.chat.type,
        chatTitle: ctx.chat.title,
        messageId: ctx.channelPost?.message_id,
        hasReply: !!ctx.channelPost?.reply_to_message,
        hasFrom: !!ctx.channelPost?.from,
        isOurChannel: isOurChannel,
        isOurDiscussionGroup: isOurDiscussionGroup,
        configuredChannelId: config.telegram.channelId,
        configuredDiscussionId: config.telegram.discussionGroupId
      });
      
      // Check if this is our channel OR our discussion group
      if (!isOurChannel && !isOurDiscussionGroup) {
        logger.warn('🚫 Ignoring - not our channel or discussion group', {
          receivedId: chatId,
          expectedChannelId: config.telegram.channelId,
          expectedDiscussionId: config.telegram.discussionGroupId
        });
        return;
      }
      
      // Log which source accepted the event
      if (isOurDiscussionGroup) {
        logger.info('✅ Event from discussion group accepted');
      } else if (isOurChannel) {
        logger.info('✅ Event from channel accepted');
      }
      
      // Check if this is a comment (reply to a message)
      if (ctx.channelPost.reply_to_message) {
        const originalMessageId = ctx.channelPost.reply_to_message.message_id;
        const commenter = ctx.channelPost.from;
        
        logger.info('💬 Comment detected!', {
          originalMessageId,
          commenterUsername: commenter?.username,
          commenterId: commenter?.id,
          commenterName: commenter?.first_name
        });
        
        // Skip if no username (can't contact them)
        if (!commenter || !commenter.username) {
          logger.warn('Skipping - commenter has no username', {
            commenterId: commenter?.id,
            commenterName: commenter?.first_name
          });
          return;
        }
        
        logger.info('🔍 Searching for post in database', {
          originalMessageId
        });
        
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
        
        logger.info('📊 Database query results', {
          travelPostsFound: !travelPosts.empty,
          favorPostsFound: !favorPosts.empty,
          travelCount: travelPosts.size,
          favorCount: favorPosts.size
        });
        
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
          logger.info('✅ Post found!', {
            postId: post.postId,
            postType,
            postOwnerId: post.userId,
            postOwnerName: post.userName
          });
          
          // Don't notify if commenter is the post owner
          if (commenter.id && commenter.id.toString() === post.userId) {
            logger.info('Skipping - commenter is the post owner');
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
        } else {
          logger.warn('⚠️ No post found for this message ID', {
            originalMessageId,
            commenter: commenter?.username
          });
        }
      } else {
        logger.debug('Not a reply - regular channel message');
      }
      
    } catch (error) {
      logger.error('Channel post error', { 
        error: error.message,
        stack: error.stack 
      });
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
                `<i>${messages.channelQuotes.milestone.acts100}</i>\n\n` +
                `Thank you for being part of this journey! 🙏`,
      
      members: `🎉 <b>COMMUNITY MILESTONE!</b>\n\n` +
               `Our ${number}th kind soul just joined the family! 🤝\n\n` +
               `That's ${number} people choosing kindness.\n` +
               `${number} neighbors ready to help.\n` +
               `${number} reasons to believe in good.\n\n` +
               `<i>${messages.channelQuotes.milestone.members500}</i>\n\n` +
               `Welcome to all our new friends! 💚`,
      
      posts: `✨ <b>ACTIVITY MILESTONE!</b>\n\n` +
             `${number} favors and journeys shared! ✈️\n\n` +
             `Every post is a chance for kindness.\n` +
             `Every journey, an opportunity to help.\n` +
             `Every favor, a life touched.\n\n` +
             `<i>${formatMessage(messages.channelQuotes.milestone.generic, { number })}</i>\n\n` +
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
        `<i>${messages.channelQuotes.gratitude}</i>\n\n` +
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
        reminder: messages.safetyReminders.general
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
        reminder: messages.safetyReminders.documentation
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
        reminder: messages.safetyReminders.trust
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