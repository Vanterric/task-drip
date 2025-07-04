const mongoose = require('mongoose');

const TaskListSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  icon: { type: String, default: 'clipboard-check' },
  creationPrompt: { type: String, default: '' },
  resetSchedule:{
    number: { type: Number, default: null },
    cadence: { type: String, default: null }, // days, weeks, months, years
    startDate: { type: Date, default: null },
    lastReset: { type: Date, default: null }
  },
  order: { type: Number, default: 0 },
});

module.exports = mongoose.model('TaskList', TaskListSchema);
