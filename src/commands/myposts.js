const { Markup } = require('telegraf');
const { collections } = require('../config/firebase');
const { formatRoute, formatDate, formatPostForChannel } = require('../utils/helpers');
const { messages, formatMessage } = require('../config/messages');
const { logger, logEvent } = require('../utils/logger');

// Handle /myposts command
async function handleMyPosts(ctx) {
  try {
    const userId = ctx.from.id.toString();
    logEvent.commandUsed(userId, 'myposts');
    
    // Fetch user's active posts
    const [travelPlans, favorRequests] = await Promise.all([
      collections.travelPlans
        .where('userId', '==', userId)
        .where('status', '==', 'active')
        .orderBy('createdAt', 'desc')
        .get(),
      collections.favorRequests
        .where('userId', '==', userId)
        .where('status', '==', 'active')
        .orderBy('createdAt', 'desc')
        .get()
    ]);
    
    const posts = [];
    
    // Process travel plans
    travelPlans.forEach(doc => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        type: 'travel',
        route: formatRoute(data.fromCity, data.toCity),
        date: data.departureDate,
        createdAt: data.createdAt,
        data: data
      });
    });
    
    // Process favor requests
    favorRequests.forEach(doc => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        type: 'favor',
        route: formatRoute(data.fromCity, data.toCity),
        urgency: data.urgency,
        createdAt: data.createdAt,
        data: data
      });
    });
    
    // If no active posts
    if (posts.length === 0) {
      return ctx.reply(
        messages.myposts.empty,
        { parse_mode: 'HTML' }
      );
    }
    
    // Sort by creation date (newest first)
    posts.sort((a, b) => b.createdAt - a.createdAt);
    
    // Build keyboard with posts
    const keyboard = [];
    posts.forEach(post => {
      let label;
      
      if (post.type === 'travel') {
        // Format: ✈️ SG→BKK • 30 Dec
        const shortDate = formatDate(post.date.toDate ? post.date.toDate() : post.date)
          .split(' ')
          .slice(0, 2)
          .join(' '); // Get "30 Dec" from "30 Dec 2024"
        
        // Get short city codes
        const fromCode = post.data.fromCity.toUpperCase();
        const toCode = post.data.toCity.toUpperCase();
        
        label = `✈️ ${fromCode}→${toCode} • ${shortDate}`;
      } else {
        // Format: 📦 YGN→SG • Urgent
        const urgencyMap = {
          'urgent': '🚨 Urgent',
          'normal': '⏰ Normal',
          'flexible': '😌 Flexible'
        };
        
        // Get short city codes
        const fromCode = post.data.fromCity.toUpperCase();
        const toCode = post.data.toCity.toUpperCase();
        
        label = `📦 ${fromCode}→${toCode} • ${urgencyMap[post.data.urgency] || post.data.urgency}`;
      }
      
      keyboard.push([
        Markup.button.callback(
          label,
          `manage_post_${post.type}_${post.id}`
        )
      ]);
    });
    
    // Send message with post list
    await ctx.reply(
      messages.myposts.title + '\n\n' +
      messages.myposts.selectPost,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: keyboard
        }
      }
    );
    
    logger.info('User viewed their posts', {
      userId,
      postCount: posts.length,
      travelPlans: travelPlans.size,
      favorRequests: favorRequests.size
    });
    
  } catch (error) {
    logger.error('Error in /myposts command', {
      error: error.message,
      userId: ctx.from?.id
    });
    await ctx.reply(messages.common.genericError, { parse_mode: 'HTML' });
  }
}

// Handle post management callback
async function handleManagePost(ctx, type, postId) {
  try {
    await ctx.answerCbQuery();
    const userId = ctx.from.id.toString();
    
    // Fetch the post
    const collection = type === 'travel' ? collections.travelPlans : collections.favorRequests;
    const postDoc = await collection.doc(postId).get();
    
    if (!postDoc.exists) {
      return ctx.reply(messages.errors.postNotFound);
    }
    
    const post = postDoc.data();
    
    // Verify ownership
    if (post.userId !== userId) {
      return ctx.reply(messages.common.ownPostsOnly);
    }
    
    // Build post details
    const route = formatRoute(post.fromCity, post.toCity);
    let details = messages.myposts.managePost.title + '\n\n';
    details += formatMessage(messages.myposts.managePost.route, { route }) + '\n';
    
    if (type === 'travel' && post.departureDate) {
      details += formatMessage(messages.myposts.managePost.date, { 
        date: formatDate(post.departureDate.toDate ? post.departureDate.toDate() : post.departureDate)
      }) + '\n';
    } else if (type === 'favor' && post.urgency) {
      const urgencyLabels = {
        'urgent': '🚨 Urgent (1-3 days)',
        'normal': '⏰ Normal (4-7 days)',
        'flexible': '😌 Flexible (Anytime)'
      };
      details += `Urgency: ${urgencyLabels[post.urgency] || post.urgency}\n`;
      
      if (post.createdAt) {
        const createdDate = post.createdAt.toDate ? post.createdAt.toDate() : post.createdAt;
        details += `Posted: ${formatDate(createdDate)}\n`;
      }
    }
    
    details += formatMessage(messages.myposts.managePost.status, { status: 'Active ✅' }) + '\n\n';
    details += messages.myposts.managePost.selectAction;
    
    // Management options
    const keyboard = [
      [Markup.button.callback(
        messages.myposts.markComplete,
        `complete_post_${type}_${postId}`
      )],
      [Markup.button.callback(
        messages.myposts.cancelPost,
        `cancel_post_${type}_${postId}`
      )],
      [Markup.button.callback(
        messages.myposts.backToList,
        'back_to_posts'
      )]
    ];
    
    await ctx.editMessageText(details, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
    
  } catch (error) {
    logger.error('Error managing post', {
      error: error.message,
      postId,
      type,
      userId: ctx.from?.id
    });
    await ctx.reply(messages.common.genericError, { parse_mode: 'HTML' });
  }
}

// Handle post completion
async function handleCompletePost(ctx, type, postId) {
  try {
    await ctx.answerCbQuery();
    const userId = ctx.from.id.toString();
    
    // Confirm action
    const keyboard = [
      [
        Markup.button.callback('✅ Yes, Complete', `confirm_complete_${type}_${postId}`),
        Markup.button.callback('❌ No, Cancel', `manage_post_${type}_${postId}`)
      ]
    ];
    
    await ctx.editMessageText(
      messages.myposts.confirmComplete.title + '\n\n' + messages.myposts.confirmComplete.message,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: keyboard
        }
      }
    );
    
  } catch (error) {
    logger.error('Error in complete post handler', {
      error: error.message,
      postId,
      type
    });
  }
}

// Handle post cancellation
async function handleCancelPost(ctx, type, postId) {
  try {
    await ctx.answerCbQuery();
    
    // Confirm action
    const keyboard = [
      [
        Markup.button.callback('✅ Yes, Cancel', `confirm_cancel_${type}_${postId}`),
        Markup.button.callback('❌ No, Keep', `manage_post_${type}_${postId}`)
      ]
    ];
    
    await ctx.editMessageText(
      messages.myposts.confirmCancel.title + '\n\n' + messages.myposts.confirmCancel.message,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: keyboard
        }
      }
    );
    
  } catch (error) {
    logger.error('Error in cancel post handler', {
      error: error.message,
      postId,
      type
    });
  }
}

// Confirm post completion
async function confirmCompletePost(ctx, type, postId) {
  try {
    await ctx.answerCbQuery();
    const userId = ctx.from.id.toString();
    
    // Update post status
    const collection = type === 'travel' ? collections.travelPlans : collections.favorRequests;
    const postDoc = await collection.doc(postId).get();
    
    if (!postDoc.exists) {
      return ctx.reply(messages.errors.postNotFound);
    }
    
    const post = postDoc.data();
    
    // Verify ownership
    if (post.userId !== userId) {
      return ctx.reply(messages.common.ownPostsOnly);
    }
    
    // Update status to completed
    const completedAt = new Date();
    await collection.doc(postId).update({
      status: 'completed',
      completedAt: completedAt
    });
    
    // Update the channel post if message ID exists
    if (post.channelMessageId && post.channelChatId) {
      try {
        // Re-format the post with completed status
        const updatedPost = { ...post, completedAt };
        const updatedMessage = formatPostForChannel(updatedPost, type, 'completed');
        
        // Try to edit the original channel message
        if (post.photoUrl && type === 'favor') {
          // For posts with photos, we need to edit the caption
          await ctx.telegram.editMessageCaption(
            post.channelChatId,
            post.channelMessageId,
            null,
            updatedMessage,
            { parse_mode: 'HTML' }
          );
        } else {
          // For text-only posts
          await ctx.telegram.editMessageText(
            post.channelChatId,
            post.channelMessageId,
            null,
            updatedMessage,
            { parse_mode: 'HTML' }
          );
        }
        
        logger.info('Channel post updated to completed', {
          postId,
          channelMessageId: post.channelMessageId
        });
      } catch (error) {
        // If editing fails (message deleted, etc.), send a new notification
        logger.warn('Could not edit original channel post, sending notification', {
          error: error.message,
          postId
        });
        
        // Get user info for fallback notification
        const userDoc = await collections.users.doc(userId).get();
        const user = userDoc.data();
        
        const channelMessage = formatMessage(messages.channel.postCompleted, {
          userName: user.userName || user.firstName,
          postType: type === 'travel' ? 'Travel Plan' : 'Favor Request',
          postId: postId
        });
        
        try {
          await ctx.telegram.sendMessage(
            process.env.FREE_CHANNEL_ID,
            channelMessage,
            { parse_mode: 'HTML' }
          );
        } catch (sendError) {
          logger.error('Failed to send completion notification', {
            error: sendError.message,
            postId
          });
        }
      }
    }
    
    logEvent.channelMessageSent('post_completed');
    
    // Update user message
    await ctx.editMessageText(
      messages.myposts.completed,
      { parse_mode: 'HTML' }
    );
    
    // Log the completion
    logEvent.customEvent('post_completed', {
      userId,
      postId,
      type
    });
    
    logger.info('Post marked as completed', {
      userId,
      postId,
      type
    });
    
  } catch (error) {
    logger.error('Error confirming post completion', {
      error: error.message,
      postId,
      type
    });
    await ctx.reply(messages.common.genericError, { parse_mode: 'HTML' });
  }
}

// Confirm post cancellation
async function confirmCancelPost(ctx, type, postId) {
  try {
    await ctx.answerCbQuery();
    const userId = ctx.from.id.toString();
    
    // Update post status
    const collection = type === 'travel' ? collections.travelPlans : collections.favorRequests;
    const postDoc = await collection.doc(postId).get();
    
    if (!postDoc.exists) {
      return ctx.reply(messages.errors.postNotFound);
    }
    
    const post = postDoc.data();
    
    // Verify ownership
    if (post.userId !== userId) {
      return ctx.reply(messages.common.ownPostsOnly);
    }
    
    // Update status to cancelled
    const cancelledAt = new Date();
    await collection.doc(postId).update({
      status: 'cancelled',
      cancelledAt: cancelledAt
    });
    
    // Update the channel post if message ID exists
    if (post.channelMessageId && post.channelChatId) {
      try {
        // Re-format the post with cancelled status
        const updatedPost = { ...post, cancelledAt };
        const updatedMessage = formatPostForChannel(updatedPost, type, 'cancelled');
        
        // Try to edit the original channel message
        if (post.photoUrl && type === 'favor') {
          // For posts with photos, we need to edit the caption
          await ctx.telegram.editMessageCaption(
            post.channelChatId,
            post.channelMessageId,
            null,
            updatedMessage,
            { parse_mode: 'HTML' }
          );
        } else {
          // For text-only posts
          await ctx.telegram.editMessageText(
            post.channelChatId,
            post.channelMessageId,
            null,
            updatedMessage,
            { parse_mode: 'HTML' }
          );
        }
        
        logger.info('Channel post updated to cancelled', {
          postId,
          channelMessageId: post.channelMessageId
        });
      } catch (error) {
        // If editing fails (message deleted, etc.), send a new notification
        logger.warn('Could not edit original channel post, sending notification', {
          error: error.message,
          postId
        });
        
        const channelMessage = formatMessage(messages.channel.postCancelled, {
          postType: type === 'travel' ? 'Travel Plan' : 'Favor Request',
          postId: postId
        });
        
        try {
          await ctx.telegram.sendMessage(
            process.env.FREE_CHANNEL_ID,
            channelMessage,
            { parse_mode: 'HTML' }
          );
        } catch (sendError) {
          logger.error('Failed to send cancellation notification', {
            error: sendError.message,
            postId
          });
        }
      }
    }
    
    logEvent.channelMessageSent('post_cancelled');
    
    // Update user message
    await ctx.editMessageText(
      messages.myposts.cancelled,
      { parse_mode: 'HTML' }
    );
    
    // Log the cancellation
    logEvent.customEvent('post_cancelled', {
      userId,
      postId,
      type
    });
    
    logger.info('Post cancelled', {
      userId,
      postId,
      type
    });
    
  } catch (error) {
    logger.error('Error confirming post cancellation', {
      error: error.message,
      postId,
      type
    });
    await ctx.reply(messages.common.genericError, { parse_mode: 'HTML' });
  }
}

// Handle back to posts list
async function handleBackToPosts(ctx) {
  try {
    await ctx.answerCbQuery();
    // Delete current message and show posts list again
    await ctx.deleteMessage();
    await handleMyPosts(ctx);
  } catch (error) {
    logger.error('Error going back to posts', {
      error: error.message
    });
  }
}

module.exports = {
  handleMyPosts,
  handleManagePost,
  handleCompletePost,
  handleCancelPost,
  confirmCompletePost,
  confirmCancelPost,
  handleBackToPosts
};