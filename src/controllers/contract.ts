import { Request, Response } from 'express';
import { ethers } from 'ethers';
import * as TagControl from './tags'
import * as URLControl from './urls'
import * as UserControl from './users';
import * as LikeControl from './likes';


// Models
import ABI from '../abi.json';

const __createContract = () => {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL as string);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);
  const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS as string,
    ABI,
    wallet
  );
  return contract;
};

const syncDataToSmartContract = async (_req: Request, res: Response) => {
  // Connect to smart contract
  let contract: ethers.Contract;
  try {
    contract = __createContract();
  } catch (error: any) {
    return res.status(500).json({ error: `Failed contract connection: ${error.message}` });
  }

  // Get all data needed to sync with smart contract
  const users = await UserControl.getUsersToSync();
  const tags = await TagControl.getTagsToSync();
  const urls  = await URLControl.getContentToSync();
  const likes = await LikeControl.getLikesToSync();

  // Submit a batch of data to the smart contract to sync
  try {
    let tx = await contract.syncState(users, tags, urls, likes);
    await tx.wait();
  } catch (error: any) {
    console.error("error: ", error);
    return res.status(500).json({ error: `Failed to sync state: ${error.message}` });
  }

  // Mark all as synced
  await UserControl.markSynced(users);
  await TagControl.markSynced(tags);
  await URLControl.markSynced(urls);
  await LikeControl.markSynced();

  // Return success on syncing smart contract with backend state
  return res.status(200).json({});
};

export {
  syncDataToSmartContract,
};
