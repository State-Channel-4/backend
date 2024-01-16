import mongoose, { Document, Model } from 'mongoose';

interface TagDocument extends Document {
    name: string;
    urls: Array<mongoose.Types.ObjectId>;
    createdBy: mongoose.Types.ObjectId;
    syncedToBlockchain: boolean;
}

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

  const Tag: Model<TagDocument> = mongoose.model('Tag', TagSchema);

  export { Tag, TagDocument }