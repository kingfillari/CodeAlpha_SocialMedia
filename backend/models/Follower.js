const mongoose = require('mongoose');

const followerSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure unique follower-following combination
followerSchema.index({ follower: 1, following: 1 }, { unique: true });

module.exports = mongoose.model('Follower', followerSchema);