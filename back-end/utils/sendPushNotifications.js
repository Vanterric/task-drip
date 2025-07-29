const webpush = require('web-push');
const dotenv = require('dotenv');
const User = require('../models/User');
const Task = require('../models/Task');
const TaskList = require('../models/TaskList');
const {Resend} = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

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
      if(user.pushForInactivity){
      try {
        await webpush.sendNotification(sub, payload);
      } catch (err) {
        console.error('Push failed for', sub.endpoint, err.message);
      }
    }
  }
    if(user.emailForInactivity) {
      try {
        await resend.emails.send({
          from: 'DewList <noreply@dewlist.app>',
          to: user.email,
          subject: 'Hey, it’s DewList 👋',
          html: `<div style="font-family: 'Lexend', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #4F5962; padding: 20px; text-align: center;">
          <img src="https://dewlist.app/DewList_Icon.png"
         alt="DewList logo"
         width="48"
         height="48"
         style="display: block; margin: 0 auto 16px auto;" />
         <p>${getRandomMessage()}</p>
         <a href="https://dewlist.app"
       style="
         display: inline-block;
         background-color: #4C6CA8;
         color: white;
         text-decoration: none;
         padding: 12px 24px;
         border-radius: 8px;
         font-weight: 600;
         font-size: 16px;
       ">
      Log in to DewList
    </a>
         </div>`
        });
      } catch (err) {
        console.error('Email failed for', user.email, err.message);
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
        if(user.pushForReset){
          try {
          await webpush.sendNotification(sub, payload);
        } catch (err) {
          console.error('❌ Reset push failed:', sub.endpoint, err.message);
        }
        }
        
        if(user.emailForReset) {
          if (!user.isPro) continue
          try {
            await resend.emails.send({
              from: 'DewList <noreply@dewlist.app>',
              to: user.email,
              subject: `${sub.label || 'Your list'} has been reset!`,
              html: `<div style="font-family: 'Lexend', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #4F5962; padding: 20px; text-align: center;">
                <img src="https://dewlist.app/DewList_Icon.png"
                 alt="DewList logo"
                 width="48"
                 height="48"
                 style="display: block; margin: 0 auto 16px auto;" />
                <p>It's a fresh start! Time to dive back into "${sub.label || 'your tasks'}" ✨</p>
                <a href="https://dewlist.app"
               style="
                 display: inline-block;
                 background-color: #4C6CA8;
                 color: white;
                 text-decoration: none;
                 padding: 12px 24px;
                 border-radius: 8px;
               ">
              Log in to DewList
            </a>
          </div>`
            });
          } catch (err) {
            console.error('Email failed for', user.email, err.message);
          }
        }
      }
    }
  }
    // 3. DewDate notifications

  const now = new Date();

  const dewDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 12));

  const pushWindowStart = new Date(dewDate.getTime() - 24 * 60 * 60 * 1000); // 12 PM today
  const pushWindowEnd = new Date(pushWindowStart.getTime() + 60 * 60 * 1000); // 1-hour window

  const tasksDueTomorrow = await Task.find({
  notifyOnDewDate: true,
  isComplete: false,
  dewDate: dewDate,
  $or: [
    { dewDatePushSent: null },
    { dewDatePushSent: { $lt: pushWindowStart } }
  ],
  // Only send if now is within the push window
  $expr: {
    $and: [
      { $gte: [now, pushWindowStart] },
      { $lt: [now, pushWindowEnd] }
    ]
  }
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
      console.log(`📬 Preparing DewDate push for "${task.content}" due tomorrow for user ${userId}`);
      userTasksMap[userId].push(task);
    }

    const userIds = Object.keys(userTasksMap);
    const users = await User.find({ _id: { $in: userIds }, isPro: true });

    for (const user of users) {
      const tasks = userTasksMap[user._id.toString()];
      if (!tasks?.length) continue;

      const dewSubs = user.pushSubscriptions.filter(sub => sub.type === 'dewDate');
      console.log(`📬 Sending ${tasks.length} DewDate pushes for user ${user.email}`);
      for (const task of tasks) {
        const sub = dewSubs.find(sub => sub.taskId?.toString() === task._id.toString());
        if (!sub) continue;
        console.log(`📬 Sending DewDate push for "${task.content}" to ${user.email}`);
        const payload = JSON.stringify({
          title: `Task Due Tomorrow`,
          body: `Your task "${task.content}" is due tomorrow 📅`,
          url: `/?tasklistId=${task.tasklistId}&taskId=${task._id}`,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          userId: user._id
        });
        if(user.pushForDewDate){
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
        if(user.emailForDewDate) {
          try {
            await resend.emails.send({
              from: 'DewList <noreply@dewlist.app>',
              to: user.email,
              subject: `Your task "${task.content}" is due tomorrow!`,
              html: `
                <div style="font-family: 'Lexend', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #4F5962; padding: 20px; text-align: center;">
                 <img src="https://dewlist.app/DewList_Icon.png"
                 alt="DewList logo"
                 width="48"
                 height="48"
                 style="display: block; margin: 0 auto 16px auto;" />  
                  <p>This is a friendly reminder that your task "${task.content}" is due tomorrow.</p>
                  <a href="https://dewlist.app"
                     style="
                       display: inline-block;
                       background-color: #4C6CA8;
                       color: white;
                       text-decoration: none;
                       padding: 12px 24px;
                       border-radius: 8px;
                       font-weight: 600;
                       font-size: 16px;
                     ">
                    Log in to DewList
                  </a>
                </div>`
            });
          } catch (err) {
            console.error('Email failed for', user.email, err.message);
          }
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