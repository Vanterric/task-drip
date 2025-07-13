const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  tasklistId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaskList' },
  content: { type: String, required: true },
  isComplete: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  order: { type: Number, default: 0 },
  description: { type: String, default: '' },
  dewDate: { type: Date, default: null },
});

module.exports = mongoose.model('Task', TaskSchema);
