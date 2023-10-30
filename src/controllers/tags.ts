import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Tag, TagDocument, URLDocument, UserDocument } from '../models/schema';
import { Data } from '../types/typechain/Channel4';
import { getContractObject } from './contract';
import { ethers } from 'ethers';

export const createTag = async (req: Request, res: Response) => {
  try {
    const name: string = req.body.params[0];
    const createdBy: string = req.body.userId;
    const tag = await Tag.create({ name, createdBy });
    const receipt = await createReceipt(tag.name);
    res.status(201).json({
      tag,
      receipt,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
      return res.status(500).json({ error: error.message });
    } else {
      // Handle unknown error type
      return res.status(500).json({ error: 'Unknown Error occurred while creating tag' });
    }
  }
};

export const getAllTags = async (req: Request, res: Response) => {
  try {
    const tags: TagDocument[] = await Tag.find();
    res.status(200).json({ tags });
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
      return res.status(500).json({ error: error.message });
    } else {
      // Handle unknown error type
      return res.status(500).json({ error: 'Unknown Error occurred while fetching tags' });
    }
  }
};

export const attachURL = async (tags: Types.ObjectId[], urlId: Types.ObjectId) => {
  for (const tagId of tags) {
    const tag: TagDocument | null = await Tag.findById(tagId);
    if (tag) {
      tag.urls.push(urlId);
      tag.syncedToBlockchain = false;
      await tag.save();
    }
  }
};

export const detachURL = async (tags: Types.ObjectId[], urlId: Types.ObjectId) => {
  for (const tagId of tags) {
    const tag: TagDocument | null = await Tag.findById(tagId);
    if (tag) {
      const index = tag.urls.indexOf(urlId);
      if (index > -1) {
        tag.urls.splice(index, 1);
        tag.syncedToBlockchain = false;
        await tag.save();
      }
    }
  }
};

export const getTagsToSync = async () : Promise<Data.TagToSyncStruct[]> => {
  const tags = await Tag.find({ syncedToBlockchain: false }).populate({
    path: 'createdBy',
    model: 'User',
    select: 'walletAddress',
  }).populate({
    path: 'urls',
    model: 'Url',
    select: 'title',
  });
  return tags.map(tag => {
    return {
      name: tag.name,
      createdBy: (tag.createdBy as unknown as UserDocument).walletAddress,
      contentIds: (tag.urls as unknown as URLDocument[]).map(url => url.title),
    };
  });
}

export const markSynced = async (tags: string[]) => {
  await Tag.updateMany(
    { name: { $in: tags } },
    { syncedToBlockchain: true }
  );
}

export const getTagToSign = async (name: string): Promise<Data.TagToLitigateStruct> => {
  const tag = await Tag.findOne({ name }).populate({
    path: 'createdBy',
    model: 'User',
    select: 'walletAddress',
  });
  if (!tag) throw new Error('Tag to sign not found');
  return {
    name: tag.name,
    createdBy: (tag.createdBy as unknown as UserDocument).walletAddress,
    timestamp: Math.floor(Date.now() / 1000),
  };
};

export const getTagEIP712Metadata = async () => {
  const contract = getContractObject();
  const EIP712Domain = await contract.eip712Domain();
  const domain = {
    name: EIP712Domain.name,
    version: EIP712Domain.version,
    chainId: EIP712Domain.chainId,
    verifyingContract: EIP712Domain.verifyingContract,
  };
  const types = {
    TagToSync: [
      { name: 'name', type: 'string' },
      { name: 'createdBy', type: 'address' },
    ],
  };
  return { domain, types };
};

export const createReceipt = async (newTag: string): Promise<string> => {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL as string);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);
  const tag = await getTagToSign(newTag);
  const { domain, types } = await getTagEIP712Metadata();
  const EIPSignature = await wallet.signTypedData(domain, types, tag);
  return EIPSignature;
};