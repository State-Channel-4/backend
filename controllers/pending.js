const { PendingAction } = require('../models/schema');

/**
 * Prompts the smart contract to toggle a like/ unlike action
 * @notice - if there is an existing action pending for this user & url, simply delete it
 *           since there is no need to update smart contract state
 * @param {string} from - OID of user to toggle a like/ dislike as 
 * @param {string} topic - OID of url to toggle a like/ dislike for
 */
const togglePendingAction = async (from, topic) => {
    const existingAction = await PendingAction.findOne({ from, topic });
    if (existingAction) {
        await existingAction.remove();
    } else {
        await PendingAction.create({ from, topic });
    }
}

/**
 * Get all current pending likes/ dislikes that would mutate the contract state
 * @returns - data for all non-synced pending likes/dislikes to commit
 */
const getActionsToSync = async () => {
    return await PendingAction
        .find()
        .populate({
            path: 'from',
            model: 'User',
            select: 'walletAddress'
        })
        .populate({
            path: 'topic',
            model: 'Url',
            select: 'url'
        });
}

/**
 * Remove all pending actions that have been synced with the smart contract
 * @param {ObjectId} pending - ids of all pending actions to be deleted
 */
const markSynced = async (pending) => {
    await PendingAction.deleteMany({ _id: { $in: pending } });
}

module.exports = {
    togglePendingAction,
    getActionsToSync,
    markSynced,
  };
  