require("dotenv").config();
const ABI = require("../abi.json");
const ethers = require("ethers");
const TagControl = require("./tags");
const URLControl = require("./urls");

// Models
const { User, Tag, Url } = require("../models/schema");

const __createContract = () => {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    ABI,
    wallet
  );
  return contract;
};

const syncDataToSmartContract = async (_req, res) => {

  // Connect to smart contract
  let contract;
  try {
    contract = __createContract();
  } catch (error) {
    return res.status(500).json({ error: `Failed contract connection: ${error.message}` });
  }

  // Get users to sync
  const users = await User.find({ syncedToBlockchain: false })
    .then(users => users.map(user => user.walletAddress));

  // Get tags to sync
  const tags = await Tag.find({ syncedToBlockchain: false })
    .populate({
      path: 'createdBy',
      model: 'User',
      select: 'walletAddress'
    })
    .then(tags => tags.map(tag => {
      return { name: tag.name, createdBy: tag.createdBy.walletAddress }
    }));
  
  // Get content to sync
  const urls = await Url.find({ syncedToBlockchain: false })
    .populate({
      path: 'submittedBy',
      model: 'User',
      select: 'walletAddress'
    })
    .populate({
      path: 'tags',
      model: 'Tag',
      select: 'name'
    })
    .then(urls => urls.map(url => {
      return {
        title: url.title,
        url: url.url,
        submittedBy: url.submittedBy.walletAddress,
        tagIds: url.tags.map(tag => tag.name)
      }
    }));

  // Get pending actions
  // @TODO: ask preferred way for storing pending actions
  const pendingActions = [];

  try {
    let tx = await contract.syncState(users, tags, urls, pendingActions);
    await tx.wait();
  } catch (error) {
    console.error("error: ", error);
    return res.status(500).json({ error: `Failed to sync state: ${error.message}` });
  }

  // mark all as synced
  await User.updateMany(
    { walletAddress: { $in: users } },
    { syncedToBlockchain: true }
  );
  await Tag.updateMany(
    { name: { $in: tags.map(tag => tag.name) } },
    { syncedToBlockchain: true }
  );
  await Url.updateMany(
    { title: { $in: urls.map(url => url.title) } },
    { syncedToBlockchain: true }
  );

  // return success on syncing smart contract with backend state
  return res.status(200).json({});
};

module.exports = {
  syncDataToSmartContract,
};
