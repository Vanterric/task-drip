const mongoose = require('mongoose');
const dotenv = require('dotenv');
const webpush = require( 'web-push');
const sendPushNotifications = require('./utils/sendPushNotifications');

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
    await sendPushNotifications();
    console.log('✅ Push notifications sent');
    process.exit(0);
  } catch (err) {
    console.error('❌ Cron job failed', err);
    process.exit(1);
  }
})();
