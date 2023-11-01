import { Request, Response } from 'express';
import { User } from '../models/users';
import { ethers } from 'ethers';
import { generateToken } from '../middleware/auth';


export const login = async (req: Request, res: Response) => {
  try {
    const { signedMessage } = req.body;

    const message = process.env.LOGIN_SECRET;
    const signer = ethers.verifyMessage(message as string, signedMessage);
    // Find user or insert if they do not already exist
    const user = await User.findOneAndUpdate(
      { walletAddress: signer },
      { $setOnInsert: { walletAddress: signer } },
      { returnOriginal: false, upsert: true }
    );
    const token = generateToken(user);
    return res.status(200).json({ user: user, token: token });
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
      return res.status(500).json({ error: error.message });
    } else {
      return res.status(500).json({ error: 'Unknown error occurred while logging in' });
    }

  }
};

export const recoverAccount = async (req: Request, res: Response) => {
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
      return res.status(400).json({ error: 'Unknown error occurred while recovering account' });
    }

  }
};
