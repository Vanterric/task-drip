const webpush = require('web-push');
const User = require('../models/User');
const Task = require('../models/Task');
const TaskList = require('../models/TaskList');


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
    // 3. DewDate notifications

  const now = new Date();

  const tomorrowNoonUTC = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    12, 0, 0, 0
  ));

  const oneDayBefore = new Date(tomorrowNoonUTC);
  oneDayBefore.setUTCDate(oneDayBefore.getUTCDate() - 1); // 24h before dewDate

  const tasksDueTomorrow = await Task.find({
    notifyOnDewDate: true,
    isComplete: false,
    dewDate: tomorrowNoonUTC,
    $or: [
      { dewDatePushSent: null },
      { dewDatePushSent: { $lt: oneDayBefore } } // Push was sent early for some reason (like if the dewDate used to be earlier)
    ]
  });

  if (tasksDueTomorrow.length === 0) {
    console.log('📭 No DewDate notifications needed this run');
  } else {
    const taskListIds = [...new Set(tasksDueTomorrow.map(t => t.tasklistId.toString()))];
    const taskLists = await TaskList.find({ _id: { $in: taskListIds } });
    const userMap = {};
    taskLists.forEach(list => {
      userMap[list._id.toString()] = list.userId.toString();
    });

    const userTasksMap = {};
    for (const task of tasksDueTomorrow) {
      const userId = userMap[task.tasklistId.toString()];
      if (!userId) continue;
      if (!userTasksMap[userId]) userTasksMap[userId] = [];
      userTasksMap[userId].push(task);
    }

    const userIds = Object.keys(userTasksMap);
    const users = await User.find({ _id: { $in: userIds }, isPro: true });

    for (const user of users) {
      const tasks = userTasksMap[user._id.toString()];
      if (!tasks?.length) continue;

      const dewSubs = user.pushSubscriptions.filter(sub => sub.type === 'dewDate');

      for (const task of tasks) {
        const sub = dewSubs.find(sub => sub.taskId?.toString() === task._id.toString());
        if (!sub) continue;

        const payload = JSON.stringify({
          title: `Task Due Tomorrow`,
          body: `Your task "${task.content}" is due tomorrow 📅`,
          url: `/?tasklistId=${task.tasklistId}&taskId=${task._id}`,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          userId: user._id
        });

        try {
          await webpush.sendNotification(sub, payload);

          // ✅ Log that this task was pushed
          task.dewDatePushSent = now;
          await task.save();

          console.log(`📬 Sent DewDate push for "${task.content}" to ${user.email}`);
        } catch (err) {
          console.error('❌ DewDate push failed:', sub.endpoint, err.message);
        }
      }
    }

    console.log(`✅ Sent DewDate pushes for ${tasksDueTomorrow.length} task${tasksDueTomorrow.length > 1 ? 's' : ''}`);
  }

  

  console.log(`✅ Sent ${inactiveUsers.length} inactivity push${inactiveUsers.length !== 1 ? 'es' : ''}`);
  console.log(`✅ Sent ${resetUserIds.length} reset push${resetUserIds.length !== 1 ? 'es' : ''}`);
  console.log(`✅ Sent ${tasksDueTomorrow.length} DewDate push${tasksDueTomorrow.length !== 1 ? 'es' : ''}`);

};

module.exports = sendPushNotifications;