import mongoose from "mongoose";

export interface IUrl extends mongoose.Document {
    title: string;
    url: string;
    submittedBy: mongoose.Types.ObjectId;
    likes: number;
    tags: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
    syncedToBlockchain: boolean;
  }


interface submit extends mongoose.Types.ObjectId {
  walletAddress: string;
}


export interface SyncUrl extends IUrl, mongoose.Document {
  walletAddress: string;
  title: string;
  url: string;
  submittedBy: submit;
  
}
export type SyncUrls = SyncUrl[];



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
export default mongoose.model<IUrl>('User', URLSchema);
