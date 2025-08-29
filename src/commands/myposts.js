const { Markup } = require('telegraf');
const { collections } = require('../config/firebase');
const { formatRoute, formatDate } = require('../utils/helpers');
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
        messages.commands.myposts.noActivePosts,
        { parse_mode: 'HTML' }
      );
    }
    
    // Sort by creation date (newest first)
    posts.sort((a, b) => b.createdAt - a.createdAt);
    
    // Build keyboard with posts
    const keyboard = [];
    posts.forEach(post => {
      const label = post.type === 'travel' 
        ? formatMessage(messages.commands.myposts.travelPlan, { postId: post.id })
        : formatMessage(messages.commands.myposts.favorRequest, { postId: post.id });
      
      keyboard.push([
        Markup.button.callback(
          label,
          `manage_post_${post.type}_${post.id}`
        )
      ]);
    });
    
    // Send message with post list
    await ctx.reply(
      messages.commands.myposts.title + '\n\n' +
      messages.commands.myposts.selectPost,
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
    await ctx.reply(messages.commands.myposts.error, { parse_mode: 'HTML' });
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
      return ctx.reply('❌ Post not found.');
    }
    
    const post = postDoc.data();
    
    // Verify ownership
    if (post.userId !== userId) {
      return ctx.reply('❌ You can only manage your own posts.');
    }
    
    // Build post details
    const route = formatRoute(post.fromCity, post.toCity);
    let details = formatMessage(messages.commands.myposts.managePost, { postId }) + '\n\n';
    details += formatMessage(messages.commands.myposts.route, { route }) + '\n';
    
    if (type === 'travel' && post.departureDate) {
      details += formatMessage(messages.commands.myposts.date, { 
        date: formatDate(post.departureDate.toDate ? post.departureDate.toDate() : post.departureDate)
      }) + '\n';
    }
    
    details += formatMessage(messages.commands.myposts.status, { status: 'Active ✅' }) + '\n\n';
    details += messages.commands.myposts.whatToDo;
    
    // Management options
    const keyboard = [
      [Markup.button.callback(
        messages.commands.myposts.markComplete,
        `complete_post_${type}_${postId}`
      )],
      [Markup.button.callback(
        messages.commands.myposts.cancel,
        `cancel_post_${type}_${postId}`
      )],
      [Markup.button.callback(
        messages.commands.myposts.back,
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
    await ctx.reply(messages.commands.myposts.error, { parse_mode: 'HTML' });
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
      messages.commands.myposts.confirmComplete,
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
      messages.commands.myposts.confirmCancel,
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
      return ctx.reply('❌ Post not found.');
    }
    
    const post = postDoc.data();
    
    // Verify ownership
    if (post.userId !== userId) {
      return ctx.reply('❌ You can only manage your own posts.');
    }
    
    // Update status to completed
    await collection.doc(postId).update({
      status: 'completed',
      completedAt: new Date()
    });
    
    // Get user info for channel notification
    const userDoc = await collections.users.doc(userId).get();
    const user = userDoc.data();
    
    // Send notification to channel
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
      logEvent.channelMessageSent('post_completed');
    } catch (error) {
      logger.error('Failed to send completion notification to channel', {
        error: error.message,
        postId
      });
    }
    
    // Update user message
    await ctx.editMessageText(
      messages.commands.myposts.postCompleted,
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
    await ctx.reply(messages.commands.myposts.error, { parse_mode: 'HTML' });
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
      return ctx.reply('❌ Post not found.');
    }
    
    const post = postDoc.data();
    
    // Verify ownership
    if (post.userId !== userId) {
      return ctx.reply('❌ You can only manage your own posts.');
    }
    
    // Update status to cancelled
    await collection.doc(postId).update({
      status: 'cancelled',
      cancelledAt: new Date()
    });
    
    // Send notification to channel
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
      logEvent.channelMessageSent('post_cancelled');
    } catch (error) {
      logger.error('Failed to send cancellation notification to channel', {
        error: error.message,
        postId
      });
    }
    
    // Update user message
    await ctx.editMessageText(
      messages.commands.myposts.postCancelled,
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
    await ctx.reply(messages.commands.myposts.error, { parse_mode: 'HTML' });
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