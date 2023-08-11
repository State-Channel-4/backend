import mongoose, { Schema, Document } from 'mongoose';

interface IUser extends Document {
  walletAddress: string;
  likedUrls: Array<mongoose.Types.ObjectId>;
  submittedUrls: Array<mongoose.Types.ObjectId>;
  createdAt: Date;
  updatedAt: Date;
  syncedToBlockchain: boolean;
}

const UserSchema: Schema<IUser> = new Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true
  },
  likedUrls: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Url',
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
  }
});

const User = mongoose.model<IUser>('User', UserSchema);

interface IURL extends Document {
  title: string;
  url: string;
  submittedBy: mongoose.Types.ObjectId;
  likes: number;
  tags: Array<mongoose.Types.ObjectId>;
  createdAt: Date;
  updatedAt: Date;
  syncedToBlockchain: boolean;
}

const URLSchema: Schema<IURL> = new Schema({
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

const Url = mongoose.model<IURL>('Url', URLSchema);

interface ITag extends Document {
  name: string;
  urls: Array<mongoose.Types.ObjectId>;
  createdBy: mongoose.Types.ObjectId;
  syncedToBlockchain: boolean;
}

const TagSchema: Schema<ITag> = new Schema({
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

const Tag = mongoose.model<ITag>('Tag', TagSchema);

export { User, Url, Tag };
