const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  image: {
    type: String,
    default: ''
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
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Update counts before saving
postSchema.pre('save', function(next) {
  this.likesCount = this.likes.length;
  this.commentsCount = this.comments.length;
  next();
});

// Populate user when finding posts
postSchema.pre(/^find/, function(next) {
  this.populate('user', 'username profile.avatar profile.firstName profile.lastName');
  next();
});

module.exports = mongoose.model('Post', postSchema);