const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  points: {
    type: Number,
    default: 0
  },
  totalXp: {
    type: Number,
    default: 0
  },
  companionLevel: {
    type: Number,
    default: 1
  },
  companionHealth: {
    type: Number,
    default: 100 // max 100
  },
  companionExp: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('User', UserSchema);
