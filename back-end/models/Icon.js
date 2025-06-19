const mongoose = require('mongoose');

const IconSchema = new mongoose.Schema({
  name: { type: String, required: true },
  embedding: { type: [Number], required: true },
  description: { type: String, required: true },
  tags: { type: [String], default: [] },
});

module.exports = mongoose.model('Icon', IconSchema);
