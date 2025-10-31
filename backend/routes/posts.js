const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /api/posts
// @desc    Get all posts (feed)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get posts from users that the current user follows, plus their own posts
    const currentUser = await User.findById(req.user._id);
    const followingUsers = [...currentUser.following, currentUser._id];

    const posts = await Post.find({ user: { $in: followingUsers } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username profile.avatar profile.firstName profile.lastName');

    const totalPosts = await Post.countDocuments({ user: { $in: followingUsers } });

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/posts/user/:userId
// @desc    Get posts by a specific user
// @access  Private
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ user: req.params.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username profile.avatar profile.firstName profile.lastName');

    const totalPosts = await Post.countDocuments({ user: req.params.userId });

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', [
  auth,
  body('content')
    .isLength({ min: 1 })
    .withMessage('Post content is required')
    .isLength({ max: 1000 })
    .withMessage('Post content too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { content, image } = req.body;

    const post = new Post({
      user: req.user._id,
      content,
      image: image || ''
    });

    await post.save();

    // Increment user's posts count
    await User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: 1 } });

    // Populate user data for response
    await post.populate('user', 'username profile.avatar profile.firstName profile.lastName');

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/posts/:id
// @desc    Update a post
// @access  Private
router.put('/:id', [
  auth,
  body('content')
    .isLength({ min: 1 })
    .withMessage('Post content is required')
    .isLength({ max: 1000 })
    .withMessage('Post content too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user owns the post
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    const { content, image } = req.body;

    post.content = content;
    if (image !== undefined) {
      post.image = image;
    }

    await post.save();
    await post.populate('user', 'username profile.avatar profile.firstName profile.lastName');

    res.json({
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user owns the post
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);

    // Decrement user's posts count
    await User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: -1 } });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/posts/like/:id
// @desc    Like/unlike a post
// @access  Private
router.post('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const alreadyLiked = post.likes.some(
      like => like.user.toString() === req.user._id.toString()
    );

    if (alreadyLiked) {
      // Unlike the post
      post.likes = post.likes.filter(
        like => like.user.toString() !== req.user._id.toString()
      );
      await post.save();

      res.json({ 
        message: 'Post unliked',
        liked: false,
        likesCount: post.likesCount 
      });
    } else {
      // Like the post
      post.likes.push({ user: req.user._id });
      await post.save();

      res.json({ 
        message: 'Post liked',
        liked: true,
        likesCount: post.likesCount 
      });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;