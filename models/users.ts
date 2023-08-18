import mongoose from "mongoose";


export interface IUserSchema extends mongoose.Document {
  walletAddress: string;
  likedUrls: mongoose.Types.ObjectId[];
  submittedUrls: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  syncedToBlockchain: boolean;
}


const UserSchema = new mongoose.Schema({
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

export default mongoose.model<IUserSchema>('User', UserSchema);