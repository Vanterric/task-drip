const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  isPro: { type: Boolean, default: false },
  magicToken: { type: String }, // Short-lived token for login
  createdAt: { type: Date, default: Date.now },
  isLifeTimePro: { type: Boolean, default: false }, // For lifetime users
  proExpiresAt: { type: Date, default:null }, // For subscription users,
  proSubscriptionType: { type: String, enum: ['monthly', 'yearly', "lifetime", null], default: null }, // Subscription type
  lastDatePaid: { type: Date, default: null }, // Last date user paid
  isFirstHundredUser: { type: Boolean, default: false }, // For first 100 users
  isFirstTimeUser: { type: Boolean, default: true }, // For first-time users
  pushSubscriptions: [
  {
    endpoint: String,
    expirationTime: Date,
    keys: {
      p256dh: String,
      auth: String,
    },
    device: String, // optional but useful
    type: {
      type: String,
      enum: ['inactivity', 'reset', 'all'], // extensible
      default: 'inactivity'
    },
    label: String // optional label for the subscription
  }
],
  lastActiveAt: { type: Date, default: Date.now }, 
  lastPushSentAt: { type: Date, default: null }, // Last time a push notification was sent
  referrer: { type: String, default: null }, // Referrer code
  isReferrer: { type: Boolean, default: false }, // If user is part of the referrer program
  stripeSubscriptionId: { type: String, default: null }, // Stripe subscription ID
  stripeCustomerId: { type: String, default: null }, // Stripe customer ID
});

module.exports = mongoose.model('User', UserSchema);
