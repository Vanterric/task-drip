const mongoose = require('mongoose');
const dotenv = require('dotenv');

const sendPushNotifications = require('./utils/sendPushNotifications');

(async () => {
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
