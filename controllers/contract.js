const ethers = require("ethers");
require("dotenv").config();

// Models
const { User, Tag, Url } = require("../models/schema");

const __createContract = () => {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    process.env.ABI,
    provider
  );
  return contract;
};

const syncDataToSmartContract = async () => {
  const contract = __createContract();
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, contract.provider);
  const contractWithSigner = contract.connect(wallet);

  // Sync users
  const users = await User.find();
  for (const user of users) {
    await contractWithSigner.addUser(user.walletAddress);
  }

  // Sync URLs
  const urls = await Url.find().populate("submittedBy");
  for (const url of urls) {
    await contractWithSigner.addUrl(
      url.title,
      url.url,
      url.submittedBy.walletAddress,
      url.id
    );
  }

  // Sync tags
  const allTags = await Tag.find().populate("createdBy");
  for (const tag of allTags) {
    await contractWithSigner.addTag(tag.name, tag.createdBy.walletAddress);
  }
};

module.exports = {
  syncDataToSmartContract,
};
