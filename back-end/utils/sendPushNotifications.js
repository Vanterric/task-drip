const webpush = require('web-push');
const User = require('../models/User');


const getRandomMessage = () => {
  const messages = [
    "You’ve got this — even one small win today counts 🌟",
  "Just one task can make a difference. Ready to tackle it? 💪",
  "Little steps lead to big things. Let’s take one together! 🐾",
  "Hey superstar! 🌟 Ready to check off a task? Let’s go! 🚀",
  "No need to do it all — just show up for one thing 💼✨",
  "Hey, you! Yes, you! Ready to crush a task? Let’s do it! 💥",
  "Progress > perfection. Let’s nudge something forward 🚀",
  "You don’t need motivation — just momentum. Tap to start 🔄",
  "Remember, every task completed is a step closer to your goals 🏆",
  "Gentle reminder: You’re allowed to make progress at your own pace 💚",
  "Got some time to check off just one task? Let’s do it! ⏰",
  "You’re not behind — you’re exactly where you need to be. Let’s take a step forward together 🌱",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};

sendPushNotifications = async (resetUserIds = []) => {
  console.log("Sending push notifications...");

    // 1. INACTIVITY PUSHES
 const inactiveUsers = await User.find({
  $and: [
    {
      $or: [
        { lastActiveAt: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        { lastActiveAt: null }
      ]
    },
    {
      $or: [
        { lastPushSentAt: null },
        { lastPushSentAt: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      ]
    },
    {
      pushSubscriptions: { $exists: true, $not: { $size: 0 } }
    }
  ]
});
  for (const user of inactiveUsers) {
    const payload = JSON.stringify({
      title: "Hey, it’s DewList 👋",
      body: getRandomMessage(),
      url: '/',
      userId:user._id,
      badge: '/icons/icon-192.png', 
    icon: '/icons/icon-192.png', 
    actions: [
        {
        action: 'snooze',
        title: '😴 Remind Me Later',
        icon: '/icons/icon-192.png'
        }
    ],
    });

    for (const sub of user.pushSubscriptions.filter(s => s.type === 'inactivity')) {
      try {
        await webpush.sendNotification(sub, payload);
      } catch (err) {
        console.error('Push failed for', sub.endpoint, err.message);
      }
    }

    user.lastPushSentAt = new Date();
    await user.save();
  }

  // 2. RESET NOTIFICATIONS (only to provided user IDs)
if (resetUserIds.length > 0) {
    const resetUsers = await User.find({
      _id: { $in: resetUserIds },
      'pushSubscriptions.type': 'reset'
    });

    for (const user of resetUsers) {
      if (!user.isPro) continue; // Only pro users get reset notifications

      const resetSubs = user.pushSubscriptions.filter(sub => sub.type === 'reset');

      for (const sub of resetSubs) {
        const payload = JSON.stringify({
          title: `${sub.label || 'Your list'} was reset!`,
          body: `It's a fresh start! Time to dive back into "${sub.label || 'your tasks'}" ✨`,
          url: '/',
          userId: user._id,
          badge: '/icons/icon-192.png',
          icon: '/icons/icon-192.png',
        });

        try {
          await webpush.sendNotification(sub, payload);
        } catch (err) {
          console.error('❌ Reset push failed:', sub.endpoint, err.message);
        }
      }
    }
  }

  console.log(`✅ Sent ${inactiveUsers.length} inactivity push${inactiveUsers.length !== 1 ? 'es' : ''}`);
  console.log(`✅ Sent ${resetUserIds.length} reset push${resetUserIds.length !== 1 ? 'es' : ''}`);

};

module.exports = sendPushNotifications;