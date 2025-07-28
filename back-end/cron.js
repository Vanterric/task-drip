const mongoose = require('mongoose');
const dotenv = require('dotenv');
const webpush = require( 'web-push');
const sendPushNotifications = require('./utils/sendPushNotifications');
const resetScheduledTaskLists = require('./utils/resetScheduledTaskLists');
const {Resend} = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

webpush.setVapidDetails(
  'mailto:hello@dewlist.app',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

(async () => {
    console.log("📅 Cron job ran at", new Date().toLocaleString());
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to DB');
    const affectedUserIds = await resetScheduledTaskLists();
    console.log('✅ Scheduled task lists reset');
    await sendPushNotifications([...affectedUserIds]);
    console.log('✅ Push notifications sent');
    process.exit(0);
  } catch (err) {
    console.error('❌ Cron job failed', err);
    process.exit(1);
  }
})();
