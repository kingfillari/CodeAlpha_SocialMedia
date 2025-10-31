const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  likesCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Update counts before saving
commentSchema.pre('save', function(next) {
  this.likesCount = this.likes.length;
  next();
});

// Populate user when finding comments
commentSchema.pre(/^find/, function(next) {
  this.populate('user', 'username profile.avatar profile.firstName profile.lastName');
  next();
});

module.exports = mongoose.model('Comment', commentSchema);