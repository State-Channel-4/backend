import mongoose, { Document } from 'mongoose';
interface IUser extends Document {
    walletAddress: string;
    likedUrls: Array<mongoose.Types.ObjectId>;
    submittedUrls: Array<mongoose.Types.ObjectId>;
    createdAt: Date;
    updatedAt: Date;
    syncedToBlockchain: boolean;
}
declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser> & IUser & {
    _id: mongoose.Types.ObjectId;
}, any>;
interface IURL extends Document {
    title: string;
    url: string;
    submittedBy: mongoose.Types.ObjectId;
    likes: number;
    tags: Array<mongoose.Types.ObjectId>;
    createdAt: Date;
    updatedAt: Date;
    syncedToBlockchain: boolean;
}
declare const Url: mongoose.Model<IURL, {}, {}, {}, mongoose.Document<unknown, {}, IURL> & IURL & {
    _id: mongoose.Types.ObjectId;
}, any>;
interface ITag extends Document {
    name: string;
    urls: Array<mongoose.Types.ObjectId>;
    createdBy: mongoose.Types.ObjectId;
    syncedToBlockchain: boolean;
}
declare const Tag: mongoose.Model<ITag, {}, {}, {}, mongoose.Document<unknown, {}, ITag> & ITag & {
    _id: mongoose.Types.ObjectId;
}, any>;
export { User, Url, Tag };
