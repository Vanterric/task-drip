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

sendPushNotifications = async () => {
  console.log("Sending push notifications...");
  const users = await User.find({
    $or: [
    {lastActiveAt: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) }},
    { lastActiveAt: null }
    ],
    $or: [
      { lastPushSentAt: null },
      { lastPushSentAt: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
    ],
    pushSubscriptions: { $exists: true, $not: { $size: 0 } }
  });

  for (const user of users) {
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

    for (const sub of user.pushSubscriptions) {
      try {
        await webpush.sendNotification(sub, payload);
      } catch (err) {
        console.error('Push failed for', sub.endpoint, err.message);
      }
    }

    user.lastPushSentAt = new Date();
    await user.save();
  }

  console.log(`✅ Sent pushes to ${users.length} users`);
};

module.exports = sendPushNotifications;