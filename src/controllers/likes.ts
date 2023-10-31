import { Like, User, Url, URLDocument, LikeDocument, UserDocument } from '../models/schema';
import { Request, Response } from 'express';
import { Data } from '../types/typechain/Channel4';
import { getContractObject } from './contract';
import { ethers } from 'ethers';


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

        const receipt = await createReceipt(urlId, userId);

        return res.status(200).json({
            like,
            receipt,
        });
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
 * Get all current pending likes/ dislikes from specific user that would mutate the contract state
 * @returns - data for all non-synced pending likes/dislikes of a specific user to commit
 */
export const getLikesFromUser = async (userId: string): Promise<Data.UrlNonceStruct[]> =>  {
    const likes = await Like.find({ from: userId, syncedToBlockchain: 0 }).populate({
        path: 'topic',
        model: 'Url',
        select: 'url'
    });
    return likes.map((like) => {
        return {
            url: (like.topic as unknown as URLDocument).url,
            nonce: like.nonce,
            liked: like.liked,
        }
    });
}

/**
 * Remove all pending actions that have been synced with the smart contract
 */
export const markSynced = async (users: string[]) => {
    await Like.updateMany(
        { from: { $in: users } },
        { syncedToBlockchain: 0 },
        { syncedToBlockchain: 1 }
    );
}

export const getLikeToSign = async (topic: string, from: string): Promise<Data.LikeToLitigateStruct> => {
    const like = await Like.findOne({ topic, from }).populate({
        path: 'from',
        model: 'User',
        select: 'walletAddress'
    }).populate({
        path: 'topic',
        model: 'Url',
        select: 'url'
    });
    if (!like) throw new Error("Like to sign not found");
    return {
        submittedBy: (like.from as unknown as UserDocument).walletAddress,
        url: (like.topic as unknown as URLDocument).url,
        liked: like.liked,
        nonce: like.nonce,
        timestamp: Math.floor(Date.now() / 1000),
    };
};

export const getLikeEIP712Metadata = async () => {
    const contract = getContractObject();
    const EIP712Domain = await contract.eip712Domain();
    const domain = {
      name: EIP712Domain.name,
      version: EIP712Domain.version,
      chainId: EIP712Domain.chainId,
      verifyingContract: EIP712Domain.verifyingContract,
    };
    const types = {
        LikeToLitigate: [
          { name: 'submittedBy', type: 'address' },
          { name: 'url', type: 'string' },
          { name: 'liked', type: 'bool' },
          { name: 'nonce', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
        ],
      };
    return { domain, types };
  };

  export const createReceipt = async (topic: string, from: string): Promise<string> => {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL as string);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);
    const like = await getLikeToSign(topic, from);
    const { domain, types } = await getLikeEIP712Metadata();
    const EIPSignature = await wallet.signTypedData(domain, types, like);
    return EIPSignature;
  };
