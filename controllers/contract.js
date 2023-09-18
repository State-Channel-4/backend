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

  // Sync Tags
  try {
    // find tags that are not synced
    const tags = await Tag.find({ syncedToBlockchain: false })
      .then(tags => tags.map(tag => tag.name));
    // sync remaining tags with contract
    for (const tag of tags) {
      let tx = await contract.createTagIfNotExists(tag);
      await tx.wait();
      TagControl.markSynced(tag);
    }
  } catch (error) {
    console.log("ERROR: ", error);
    return res.status(500).json({ error: `Failed to sync tags: ${error.message}` });
  }

  // Sync URLs
  try {
    // find urls that are not synced
    const urls = await Url.find({ syncedToBlockchain: false })
      .then(urls => urls.map(url => {
        return {
          title: url.title,
          url: url.url,
          submittedBy: url.submittedBy,
          tags: url.tags,
        }
      }));
    // sync remaining urls with contract
    for (const url of urls) {
      // get address of user
      // @TODO: add submittedBy to `submitURL`, currently not used
      let _user = await User.findById(url.submittedBy).then(user => user.walletAddress);

      // get tags attached to url
      let tags = await Tag.find({ _id: { $in: url.tags } })
        .then(tags => tags.map(tag => tag.name));

      // submit to contract
      let tx = await contract.submitURL(url.title, url.url, tags);
      await tx.wait();
      URLControl.markSynced(url.title);
    }
  } catch (error) {
    return res.status(500).json({ error: `Failed to sync urls: ${error.message}` });
  }

  // return success on syncing smart contract with backend state
  return res.status(200).json({});
};

module.exports = {
  syncDataToSmartContract,
};
