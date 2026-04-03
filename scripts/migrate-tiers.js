require('dotenv').config({ path: require('path').join(__dirname, '..', 'back-end', '.env') });
const mongoose = require('mongoose');
const User = require('../back-end/models/User');

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Users with active Stripe subscriptions or lifetime → pro
  const proResult = await User.updateMany(
    {
      $or: [
        { isPro: true, stripeSubscriptionId: { $ne: null } },
        { isPro: true, isLifeTimePro: true },
      ],
    },
    { $set: { tier: 'pro' }, $unset: { isPro: 1, isFirstHundredUser: 1 } }
  );
  console.log(`Migrated ${proResult.modifiedCount} users to pro tier`);

  // Users with isPro true but no subscription (trial users) → pro (keep proExpiresAt)
  const trialResult = await User.updateMany(
    {
      isPro: true,
      stripeSubscriptionId: null,
      isLifeTimePro: { $ne: true },
    },
    { $set: { tier: 'pro' }, $unset: { isPro: 1, isFirstHundredUser: 1 } }
  );
  console.log(`Migrated ${trialResult.modifiedCount} trial users to pro tier`);

  // Everyone else → free
  const freeResult = await User.updateMany(
    { tier: { $exists: false } },
    { $set: { tier: 'free' }, $unset: { isPro: 1, isFirstHundredUser: 1 } }
  );
  console.log(`Migrated ${freeResult.modifiedCount} users to free tier`);

  // Also catch any remaining isPro: false users
  const remainingResult = await User.updateMany(
    { isPro: false },
    { $set: { tier: 'free' }, $unset: { isPro: 1, isFirstHundredUser: 1 } }
  );
  console.log(`Migrated ${remainingResult.modifiedCount} remaining users to free tier`);

  // Update old proSubscriptionType values to new format
  await User.updateMany(
    { proSubscriptionType: 'monthly' },
    { $set: { proSubscriptionType: 'pro-monthly' } }
  );
  await User.updateMany(
    { proSubscriptionType: 'yearly' },
    { $set: { proSubscriptionType: 'pro-yearly' } }
  );
  await User.updateMany(
    { proSubscriptionType: 'lifetime' },
    { $set: { proSubscriptionType: 'pro-lifetime' } }
  );
  console.log('Updated proSubscriptionType values');

  await mongoose.disconnect();
  console.log('Migration complete');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
