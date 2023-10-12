import mongoose, { Document, Model } from 'mongoose';

// Define interfaces for the data models
interface UserDocument extends Document {
  walletAddress: string;
  likedUrls: Array<mongoose.Types.ObjectId>;
  submittedUrls: Array<mongoose.Types.ObjectId>;
  createdAt: Date;
  updatedAt: Date;
  syncedToBlockchain: boolean;
}

interface URLDocument extends Document {
  title: string;
  url: string;
  submittedBy: mongoose.Types.ObjectId;
  likes: number;
  tags: Array<mongoose.Types.ObjectId>;
  createdAt: Date;
  updatedAt: Date;
  syncedToBlockchain: boolean;
}

interface TagDocument extends Document {
  name: string;
  urls: Array<mongoose.Types.ObjectId>;
  createdBy: mongoose.Types.ObjectId;
  syncedToBlockchain: boolean;
}

interface LikeDocument extends Document {
  from: mongoose.Types.ObjectId;
  topic: mongoose.Types.ObjectId;
  liked: boolean;
  nonce: number;
  syncedToBlockchain: number;
}

// Define the schemas
const UserSchema = new mongoose.Schema<UserDocument>({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
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
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  syncedToBlockchain: {
    type: Boolean,
    default: false,
  },
});

const URLSchema = new mongoose.Schema<URLDocument>({
  title: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
    unique: true,
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  likes: {
    type: Number,
    default: 0,
  },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag',
    required: true,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  syncedToBlockchain: {
    type: Boolean,
    default: false,
  },
});

const TagSchema = new mongoose.Schema<TagDocument>({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  urls: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Url',
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  syncedToBlockchain: {
    type: Boolean,
    default: false,
  },
});

const LikeSchema = new mongoose.Schema<LikeDocument>({
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
    default: true,
  },
  nonce: {
    type: Number,
    default: 1,
  },
  syncedToBlockchain: {
    type: Number,
    default: 0,
    // 0 - not synced, 1 - synced, 2 - should not sync since nonce is different but like is same
  },
});

// Define models
const User: Model<UserDocument> = mongoose.model('User', UserSchema);
const Url: Model<URLDocument> = mongoose.model('Url', URLSchema);
const Tag: Model<TagDocument> = mongoose.model('Tag', TagSchema);
const Like: Model<LikeDocument> = mongoose.model('Like', LikeSchema);

export { User, UserDocument,
        Tag, TagDocument,
        Url, URLDocument,
        Like, LikeDocument };
