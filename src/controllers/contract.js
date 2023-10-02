require("dotenv").config();
const ABI = require("../abi.json");
const ethers = require("ethers");
const TagControl = require("./tags");
const URLControl = require("./urls");
const UserControl = require("./users");
const LikeControl = require("./likes");

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

  // Get all data needed to sync with smart contract
  const users = await UserControl.getUsersToSync();
  const tags = await TagControl.getTagsToSync();
  const urls = await URLControl.getContentToSync();
  const likes = await LikeControl.getLikesToSync();

  // submit batch of data to smart contract to sync
  try {
    let tx = await contract.syncState(users, tags, urls, likes);
    await tx.wait();
  } catch (error) {
    console.error("error: ", error);
    return res.status(500).json({ error: `Failed to sync state: ${error.message}` });
  }

  // mark all as synced
  await UserControl.markSynced(users);
  await TagControl.markSynced(tags.map(tag => tag.name));
  await URLControl.markSynced(urls.map(url => url.title));
  await LikeControl.markSynced();

  // return success on syncing smart contract with backend state
  return res.status(200).json({});
};

module.exports = {
  syncDataToSmartContract,
};
