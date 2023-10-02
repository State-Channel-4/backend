const { ethers } = require("ethers");
const { User } = require("../models/schema");
const { generateToken } = require("../middleware/auth");

const login = async (req, res) => {
  try {
    const { signedMessage } = req.body;

    const message = process.env.LOGIN_SECRET;
    const signer = ethers.verifyMessage(message, signedMessage);
    const user = await User.findOne({ walletAddress: signer });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const token = generateToken(user);
    return res.status(200).json({ user: user, token: token });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const recoverAccount = async (req, res) => {
  const { mnemonic } = req.body;
  try {
    const mnemonicWallet = ethers.Wallet.fromPhrase(mnemonic);
    res
      .status(200)
      .json({
        address: mnemonicWallet.address,
        public_key: mnemonicWallet.publicKey,
        private_key: mnemonicWallet.privateKey,
      });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  login,
  recoverAccount,
};
