const { collections, admin } = require('../config/firebase');

const setupChannelHandlers = (bot) => {
  // Handle new members joining the channel
  bot.on('chat_member', async (ctx) => {
    try {
      // Check if this is for our community channel
      if (ctx.chat.id.toString() !== process.env.FREE_CHANNEL_ID) {
        return;
      }

      const { new_chat_member, old_chat_member } = ctx.chatMember;
      
      // Check if someone joined the channel
      if (old_chat_member.status === 'left' && 
          ['member', 'administrator', 'creator'].includes(new_chat_member.status)) {
        
        // Don't welcome bots
        if (new_chat_member.user.is_bot) return;
        
        // Send a welcome message to the channel
        const welcomeMessages = [
          `💚 Welcome to our kindness community!\n\n"No act of kindness, no matter how small, is ever wasted."`,
          `🤝 A new friend has joined us!\n\n"Kindness is a language everyone understands."`,
          `🌟 Welcome aboard!\n\n"Small acts, when multiplied by millions of people, can transform the world."`,
          `✨ Great to have you here!\n\n"Be the reason someone believes in the goodness of people."`
        ];
        
        // Pick a random welcome message
        const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
        
        await bot.telegram.sendMessage(
          process.env.FREE_CHANNEL_ID,
          `${randomMessage}\n\n` +
          `🤖 Start your journey: @luukyonebot\n` +
          `#welcome #kindness`,
          { parse_mode: 'HTML' }
        );
        
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
      console.error('Channel member update error:', error);
      // Don't crash on channel events
    }
  });

  // Handle messages in the channel (for future features like commands)
  bot.on('channel_post', async (ctx) => {
    try {
      // Check if this is our channel
      if (ctx.chat.id.toString() !== process.env.FREE_CHANNEL_ID) {
        return;
      }
      
      // We could add channel-specific commands here in the future
      // For example: /stats, /help, etc.
      
    } catch (error) {
      console.error('Channel post error:', error);
    }
  });

  // Celebrate milestones (called from other functions when milestones are reached)
  bot.telegram.celebrateMilestone = async (type, number) => {
    const messages = {
      kindness: `🎊 Amazing! We've just facilitated our ${number}th act of kindness!\n\n"Together we're making the world a kinder place."`,
      members: `🎉 Welcome to our ${number}th community member!\n\n"Our kindness network keeps growing stronger!"`,
      posts: `✨ ${number} travel plans and favor requests shared!\n\n"Every journey is an opportunity for kindness."`
    };
    
    if (messages[type]) {
      try {
        await bot.telegram.sendMessage(
          process.env.FREE_CHANNEL_ID,
          messages[type] + '\n\n#milestone #kindness',
          { parse_mode: 'HTML' }
        );
      } catch (error) {
        console.error('Failed to send milestone message:', error);
      }
    }
  };

  // Daily kindness quote (can be called by a cron job)
  bot.telegram.sendDailyQuote = async () => {
    const quotes = [
      { quote: "Kindness is free. Sprinkle that stuff everywhere.", author: "Unknown" },
      { quote: "In a world where you can be anything, be kind.", author: "Jennifer Dukes Lee" },
      { quote: "Kindness is the sunshine in which virtue grows.", author: "Robert Green Ingersoll" },
      { quote: "A single act of kindness throws out roots in all directions.", author: "Amelia Earhart" },
      { quote: "Kind words can be short and easy to speak, but their echoes are truly endless.", author: "Mother Teresa" }
    ];
    
    const daily = quotes[Math.floor(Math.random() * quotes.length)];
    
    try {
      await bot.telegram.sendMessage(
        process.env.FREE_CHANNEL_ID,
        `🌅 <b>Daily Inspiration</b>\n\n` +
        `"${daily.quote}"\n` +
        `— ${daily.author}\n\n` +
        `Ready to share kindness today? Start here: @luukyonebot\n\n` +
        `#dailyquote #kindness`,
        { parse_mode: 'HTML' }
      );
    } catch (error) {
      console.error('Failed to send daily quote:', error);
    }
  };
};

module.exports = setupChannelHandlers;