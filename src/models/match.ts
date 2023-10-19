// matchmaking results are stored here
import mongoose, { Document, Model } from 'mongoose';
interface MatchDocument extends Document {
    user1: mongoose.Types.ObjectId;
    user1Completed: boolean;
    user2: mongoose.Types.ObjectId;
    user2Completed: boolean;
    status: string;
    threshold: number; // threshold is max limit of urls allowed to be validated, depnds on key in MatchGroup
    createdAt: Date;
    updatedAt: Date;
}

const MatchSchema = new mongoose.Schema<MatchDocument>({
    user1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    user1Completed: {
        type: Boolean,
        default: false,
    },
    user2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    user2Completed: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['ready', 'running', 'completed', 'deadlock'],
        default: 'ready',
    },
    threshold: {
        type: Number,
        default: 1,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
})

const Match: Model<MatchDocument> = mongoose.model('Match', MatchSchema);

export {
    Match, MatchDocument
};