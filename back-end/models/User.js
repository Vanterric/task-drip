const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  isPro: { type: Boolean, default: false },
  magicToken: { type: String }, // Short-lived token for login
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
