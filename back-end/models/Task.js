const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  tasklistId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaskList' },
  content: { type: String, required: true },
  isComplete: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', TaskSchema);
