import mongoose, { Document, Model } from 'mongoose';

interface UserDocument extends Document {
  walletAddress: string;
  likedUrls: Array<mongoose.Types.ObjectId>;
  submittedUrls: Array<mongoose.Types.ObjectId>;
  createdAt: Date;
  updatedAt: Date;
  syncedToBlockchain: boolean;
}

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

const User: Model<UserDocument> = mongoose.model('User', UserSchema);

export { User, UserDocument }