const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true
  },
  likedUrls: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Like',
  }],
  submittedUrls: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Url',
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  syncedToBlockchain: {
    type: Boolean,
    default: false
  },
});

const User = mongoose.model('User', UserSchema);

const URLSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true,
    unique: true
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: {
    type: Number,
    default: 0
  },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  syncedToBlockchain: {
    type: Boolean,
    default: false
  }
});

const Url = mongoose.model('Url', URLSchema);

const TagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  urls: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Url'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  syncedToBlockchain: {
    type: Boolean,
    default: false
  }
});

const Tag = mongoose.model('Tag', TagSchema);

const LikeSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Url',
  },
  liked: {
    type: Boolean,
    default: true
  },
  nonce: {
    type: Number,
    default: 1
  },
  syncedToBlockchain: {
    type: Number,
    default: 0
    // 0 - not synced, 1 - synced, 2 - should not sync since nonce is different but like is same
  }
});

const Like = mongoose.model('Like', LikeSchema);



module.exports = { User, Tag, Url, Like };
