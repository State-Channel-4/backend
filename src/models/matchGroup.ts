// Group users based on their no. of submitted unverified URLs
// Later used to create matches
import mongoose, { Document, Model } from 'mongoose';
interface MatchGroupDocument extends Document {
    key: number,
    users: Array<mongoose.Types.ObjectId>;
}

const MatchGroupSchema = new mongoose.Schema<MatchGroupDocument>({
    key: {
        type: Number,
        required: true,
    },
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
})

const MatchGroup: Model<MatchGroupDocument> = mongoose.model('Match', MatchGroupSchema);

export {
    MatchGroup, MatchGroupDocument
};