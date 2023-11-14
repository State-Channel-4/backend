import mongoose, { Document, Model } from 'mongoose';

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

  const Url: Model<URLDocument> = mongoose.model('Url', URLSchema);

  export { Url, URLDocument}