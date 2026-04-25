const mongoose = require('mongoose');

const SubtaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  isCompleted: { type: Boolean, default: false }
});

const TaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  allocatedTime: {
    type: Number,
    default: 25
  },
  actualTimeSpent: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  category: {
    type: String,
    default: 'Uncategorized'
  },
  deadline: {
    type: Date
  },
  subtasks: [SubtaskSchema],
  postponedCount: {
    type: Number,
    default: 0
  },
  rescheduleHistory: [{
      previousDeadline: Date,
      newDeadline: Date,
      reason: String,
      timestamp: { type: Date, default: Date.now }
  }],
  createdDate: {
    type: Date,
    default: Date.now
  },
  completedDate: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
