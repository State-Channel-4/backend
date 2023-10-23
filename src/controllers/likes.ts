import { Like, User, Url, URLDocument, LikeDocument, UserDocument } from '../models/schema';
import { Request, Response } from 'express';

import { LikeToSync } from '../types/contract';


export const handleLike = async (req: Request, res: Response) => {
    let url, liked, likeText, address;
    try {
        // unmarshall variables from http request
        const {
            params: { id: urlId },
            body: { address, params, userId },
        } = req;
        [url, liked] = params;
        const likeText = liked ? 'like' : 'dislike';

        // check user exists
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: `'${address}' doesn't exist as a Channel 4 user`,
            });
        }

        // check content exists
        let content = await Url.findById(urlId);
        if (!content) {
            return res.status(404).json({
                error: `Content ${url} doesn't exist as Channel 4 content`,
            });
        }

        // search for existing like
        let like = await Like.findOne({ from: userId, topic: urlId });
        if (!like) {
            // check that user is not trying to dislike content they have never liked
            if (liked == false) {
                return res.status(400).json({
                    error: `User '${address}' cannot dislike content '${url}' they've never liked`,
                });
            }
            // if no existing like create and add to user's likes
            like = await Like.create({ from: userId, topic: urlId, like });
            user.likedUrls.push(like._id);
            await user.save();
        } else {
            // check if like state is incorrect
            if (like.liked == liked) {
                return res.status(400).json({
                    error: `User '${address}' has already ${likeText} '${url}'`,
                });
            }
            if (like.syncedToBlockchain == 0) {
                // if the like is already pending to be synced, mark as 'dont sync' and locally store nonce
                like.syncedToBlockchain = 2;
            } else {
                // otherwise, mark to be synced
                like.syncedToBlockchain = 0;
            }
            like.nonce += 1;
            like.liked = liked;
            await like.save();
        }

        // update the # of likes on the content
        content.syncedToBlockchain = false;
        content.likes += liked ? 1 : -1;
        await content.save();

        return res.status(200).json({});
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: `Failed to ${likeText} '${url}' as '${address}`,
        });
    }

}

export const handleGetLikes = async (req: Request, res: Response) => {
    // unmarshall variables from http request
    const { params: { userId } } = req;

    // check if user exists
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({
            error: `User '${userId}' doesn't exist as a Channel 4 user`,
        });
    };

    // get likes for the user
    const likes = await user
        .populate({
            path: 'likedUrls',
            model: 'Like',
            match: { liked: true },
            populate: {
                path: 'topic',
                model: 'Url',
                select: ['url', 'title', '_id']
            },
        })
        .then(user => {
            return user.likedUrls.map(like => {
                const likeDoc = (like as unknown) as LikeDocument
                const topic = (likeDoc.topic as unknown) as URLDocument
                return {
                    id: topic._id,
                    url: topic.url,
                    title: topic.title,
                    nonce: likeDoc.nonce,
                }
            })
        });

    return res.status(200).json({ likes });
}

/**
 * Get all current pending likes/ dislikes that would mutate the contract state
 * @returns - data for all non-synced pending likes/dislikes to commit
 */
export const getLikesToSync = async (): Promise<LikeToSync[]> => {
    return await Like
        .find({ syncedToBlockchain: 0 })
        .populate({
            path: 'from',
            model: 'User',
            select: 'walletAddress'
        })
        .populate({
            path: 'topic',
            model: 'Url',
            select: 'url'
        })
        .then(likes => likes.map(like => {
            const likeDoc = (like as unknown) as LikeDocument
            const topic = (likeDoc.topic as unknown) as URLDocument
            const UserDoc = (like.from as unknown) as UserDocument
            return {
                url: topic.url,
                liked: like.liked,
                nonce: like.nonce,
                submittedBy: UserDoc.walletAddress,
            }
        }));
}

/**
 * Remove all pending actions that have been synced with the smart contract
 * @todo: use oids to allow for limits to batching in one tx
 */
export const markSynced = async () => {
    await Like.updateMany(
        { syncedToBlockchain: 0 },
        { syncedToBlockchain: 1 }
    );
}
