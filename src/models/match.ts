// matchmaking results are stored here
import mongoose, { Document, Model } from 'mongoose';
import { URLDocument } from './schema';
interface MatchDocument extends Document {
    user1: {
        id: mongoose.Types.ObjectId,
        urls: Array<URLDocument>,
        completed: boolean,
        concur : string, // does user agree with the final result? values yes, no . None by default. If yes and no then deadlock
    },
    user2: {
        id: mongoose.Types.ObjectId,
        urls: Array<URLDocument>,
        completed: boolean,
        concur : string,
    },
    status: string;
    threshold: number; // threshold is max limit of urls allowed to be validated, depnds on key in MatchGroup(not needed , will remove)
    createdAt: Date;
    updatedAt: Date;
}

const MatchSchema = new mongoose.Schema<MatchDocument>({
    user1: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        urls: {
            type: Array<URLDocument>,

        },
        completed: {
            type: Boolean,
            default: false,
        },
        concur: {
            type: String,
            enum: ['yes', 'no', 'none'],
            default: 'none',
        }
    },
    user2: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        urls: {
            type: Array<URLDocument>,
        },
        completed: {
            type: Boolean,
            default: false,
        },
        concur: {
            type: String,
            enum: ['yes', 'no', 'none'],
            default: 'none',
        }
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