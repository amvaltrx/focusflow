const mongoose = require('mongoose');

const UserLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mood: {
    type: Number, // 1-5 (e.g., 1: Terrible, 5: Amazing)
    required: true
  },
  energy: {
    type: Number, // 1-5 (e.g., 1: Drained, 5: High Energy)
    required: true
  },
  note: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    expires: 31536000
  }
}, { timestamps: true });

module.exports = mongoose.model('UserLog', UserLogSchema);
