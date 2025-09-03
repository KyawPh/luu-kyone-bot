const { collections, admin } = require('../config/firebase');
const { logger, logEvent } = require('../utils/logger');
const { config } = require('../config');
const { messages, formatMessage } = require('../config/messages');
const { getChannelPostLink } = require('../utils/helpers');

const setupChannelHandlers = (bot) => {
  // Handle comments in the discussion group
  bot.on('message', async (ctx) => {
    const chatId = ctx.chat?.id?.toString();
    
    // Only process messages from our discussion group that are replies
    if (chatId === config.telegram.discussionGroupId && ctx.message?.reply_to_message) {
      const replyToMessage = ctx.message.reply_to_message;
      
      // The original channel message ID is in forward_from_message_id
      const originalMessageId = replyToMessage.forward_from_message_id || replyToMessage.message_id;
      
      // Search for the post in both collections
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
          // Handle anonymous comments (when GroupAnonymousBot is the sender)
          const isAnonymous = ctx.from?.username === 'GroupAnonymousBot';
          const commenterDisplay = isAnonymous ? 
            'Someone (anonymous)' : 
            (ctx.from?.username ? `@${ctx.from.username}` : ctx.from?.first_name || 'Someone');
          
          // Don't notify if commenter is the post owner (unless anonymous)
          if (isAnonymous || ctx.from.id.toString() !== post.userId) {
            // Use postId directly for display
            const postIdDisplay = post.postId;
            
            // Generate link to the channel post
            const postLink = getChannelPostLink(post.channelChatId || config.telegram.channelId, post.channelMessageId);
            
            // Build notification message with link
            let message = `💬 ${commenterDisplay} commented on your ${postType} post #${postIdDisplay}`;
            if (postLink) {
              message += ` 👉 <a href="${postLink}">View post</a>`;
            }
            
            try {
              await bot.telegram.sendMessage(post.userId, message, { 
                parse_mode: 'HTML',
                disable_web_page_preview: true 
              });
              
              logger.info('Comment notification sent', {
                postId: post.postId,
                commenter: isAnonymous ? 'anonymous' : ctx.from?.username
              });
            } catch (error) {
              logger.error('Failed to send comment notification', { 
                error: error.message,
                postId: post.postId 
              });
            }
          }
      }
      // Post not found - might be an old message or different channel, skip silently
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

  // Handle messages/comments in the channel (kept for legacy channel comments if needed)
  bot.on('channel_post', async (ctx) => {
    try {
      const chatId = ctx.chat.id.toString();
      
      // Only process if it's from our channel and is a reply
      if (chatId === config.telegram.channelId && ctx.channelPost.reply_to_message) {
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
        
        if (post && commenter.id && commenter.id.toString() !== post.userId) {
          // Use postId directly for display
          const postIdDisplay = post.postId;
          
          // Generate link to the channel post
          const postLink = getChannelPostLink(post.channelChatId || config.telegram.channelId, post.channelMessageId);
          
          // Build notification message with link
          let message = `💬 @${commenter.username} commented on your ${postType} post #${postIdDisplay}`;
          if (postLink) {
            message += ` 👉 <a href="${postLink}">View post</a>`;
          }
          
          try {
            await bot.telegram.sendMessage(post.userId, message, { 
              parse_mode: 'HTML',
              disable_web_page_preview: true 
            });
            
            logger.info('Comment notification sent', {
              postId: post.postId,
              commenter: commenter.username
            });
          } catch (error) {
            // User might have blocked the bot - fail silently
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

  // All hardcoded content functions have been removed
  // Content is now managed through Google Sheets
  // Use /content_templates command to generate template content for your sheet
};

module.exports = setupChannelHandlers;