import mongoose, { Document, Model } from 'mongoose';

interface LikeDocument extends Document {
  from: mongoose.Types.ObjectId;
  topic: mongoose.Types.ObjectId;
  liked: boolean;
  nonce: number;
  syncedToBlockchain: number;
}


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

const Like: Model<LikeDocument> = mongoose.model('Like', LikeSchema);

export {Like, LikeDocument };
