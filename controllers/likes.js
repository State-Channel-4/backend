const { Like, User, Url } = require('../models/schema');
const { getUsersToSync } = require('./users');


const handleLike = async (req, res) => {
    try {
        // unmarshall variables from http request
        const {
            params: { id: urlId },
            body: { address, params, userId },
        } = req;
        const [url, liked] = params;
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

const handleGetLikes = async (req, res) => {
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
                return {
                    id: like.topic._id,
                    url: like.topic.url,
                    title: like.topic.title,
                    nonce: like.nonce,
                }
            })
        });

    return res.status(200).json({ likes });
}

/**
 * Get all current pending likes/ dislikes that would mutate the contract state
 * @returns - data for all non-synced pending likes/dislikes to commit
 */
const getLikesToSync = async () => {
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
            return {
                url: like.topic.url,
                liked: like.liked,
                nonce: like.nonce,
                submittedBy: like.from.walletAddress,
            }
        }));
}

/**
 * Remove all pending actions that have been synced with the smart contract
 * @todo: use oids to allow for limits to batching in one tx
 */
const markSynced = async () => {
    await Like.updateMany(
        { syncedToBlockchain: 0 },
        { syncedToBlockchain: 1 }
    );
}

module.exports = {
    handleLike,
    handleGetLikes,
    getLikesToSync,
    markSynced,
};
