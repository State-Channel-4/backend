const { ethers } = require("ethers");
const { User } = require("../models/schema");
const { generateToken } = require("../middleware/auth");
import { Request, Response } from 'express';


const login = async (req: Request, res: Response) => {
  try {
    const { signedMessage } = req.body;

    const message: string = process.env.LOGIN_SECRET ?? "";
    const signer: string = ethers.verifyMessage(message, signedMessage);
    const user = await User.findOne({ walletAddress: signer });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const token = generateToken(user);
    return res.status(200).json({ user: user, token: token });
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
      return res.status(500).json({ error: error.message });
    } else {
      return res.status(500).json({error: 'Unknown error occurred while logging in'});
    }
    
  }
};

const recoverAccount = async (req: Request, res: Response) => {
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
    if (error instanceof Error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    } else {
      return res.status(400).json({error: 'Unknown error occurred while recovering account'});
    }
    
  }
};

export = {
  login,
  recoverAccount,
};
