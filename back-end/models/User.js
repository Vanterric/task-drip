const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  isPro: { type: Boolean, default: false },
  magicToken: { type: String }, // Short-lived token for login
  createdAt: { type: Date, default: Date.now },
  isLifeTimePro: { type: Boolean, default: false }, // For lifetime users
  proExpiresAt: { type: Date, default:null }, // For subscription users
  isFirstHundredUser: { type: Boolean, default: false }, // For first 100 users
  isFirstTimeUser: { type: Boolean, default: true }, // For first-time users
  pushSubscriptions: {
    type: [Object],
    default: [] // each subscription will include an edpoint, expirationTime, keys.p256dh, keys.auth
  },
  lastActiveAt: { type: Date, default: Date.now }, 
  lastPushSentAt: { type: Date, default: null }, // Last time a push notification was sent
  referrer: { type: String, default: null }, // Referrer code
});

module.exports = mongoose.model('User', UserSchema);
