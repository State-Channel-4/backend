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
  // todo: find clean way to batch all relational queries into one http request
  let tags = await Tag.find({ syncedToBlockchain: false });
  tags = await Promise.all(tags.map(async tag => {
    let user = await User.findById(tag.createdBy).then(user => user.walletAddress);
    return { name: tag.name, createdBy: user }
  }));

  // Get content to sync
  // todo: find clean way to batch all relational queries into one http request
  let urls = await Url.find({ syncedToBlockchain: false });
  urls = await Promise.all(urls.map(async url => {
    const contentTags = await Tag.find({ _id: { $in: url.tags } })
      .then(tags => tags.map(tag => tag.name));
    const user = await User.findById(url.submittedBy).then(user => user.walletAddress);
    return {
      title: url.title,
      url: url.url,
      submittedBy: user,
      tagIds: contentTags,
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
