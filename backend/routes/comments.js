const express = require('express');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /api/comments/post/:postId
// @desc    Get comments for a post
// @access  Private
router.get('/post/:postId', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ post: req.params.postId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username profile.avatar profile.firstName profile.lastName');

    const totalComments = await Comment.countDocuments({ post: req.params.postId });

    res.json({
      comments,
      currentPage: page,
      totalPages: Math.ceil(totalComments / limit),
      totalComments
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/comments
// @desc    Add a comment to a post
// @access  Private
router.post('/', [
  auth,
  body('content')
    .isLength({ min: 1 })
    .withMessage('Comment content is required')
    .isLength({ max: 500 })
    .withMessage('Comment content too long'),
  body('postId')
    .isMongoId()
    .withMessage('Valid post ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { content, postId } = req.body;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = new Comment({
      user: req.user._id,
      post: postId,
      content
    });

    await comment.save();

    // Add comment to post's comments array
    post.comments.push(comment._id);
    await post.save();

    // Populate user data for response
    await comment.populate('user', 'username profile.avatar profile.firstName profile.lastName');

    res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/comments/:id
// @desc    Delete a comment
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Remove comment from post's comments array
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: comment._id }
    });

    await Comment.findByIdAndDelete(req.params.id);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/comments/like/:id
// @desc    Like/unlike a comment
// @access  Private
router.post('/like/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const alreadyLiked = comment.likes.some(
      like => like.user.toString() === req.user._id.toString()
    );

    if (alreadyLiked) {
      // Unlike the comment
      comment.likes = comment.likes.filter(
        like => like.user.toString() !== req.user._id.toString()
      );
      await comment.save();

      res.json({ 
        message: 'Comment unliked',
        liked: false,
        likesCount: comment.likesCount 
      });
    } else {
      // Like the comment
      comment.likes.push({ user: req.user._id });
      await comment.save();

      res.json({ 
        message: 'Comment liked',
        liked: true,
        likesCount: comment.likesCount 
      });
    }
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;