import mongoose from "mongoose";

export interface ITag extends mongoose.Document {
    name: string;
    urls: mongoose.Types.ObjectId[];
    createdBy: mongoose.Types.ObjectId;
    syncedToBlockchain: boolean;
  }

interface submitTag extends mongoose.Types.ObjectId {
walletAddress: string;
}


export interface Synctag extends ITag, mongoose.Document {
walletAddress: string;
title: string;
url: string;
createdBy: submitTag;

}
export type submitTags = submitTag[];

  
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
  
export default mongoose.model<ITag>('Tag', TagSchema);  