import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { shuffle } from '../lib/utils';
import * as TagControl from './tags';
import * as UserControl from './users';
import { Data } from '../types/typechain/Channel4';
import { getEIPDomain } from './contract';
import { ethers } from 'ethers';
import { ExtendedRequest } from '../types/request';
import { UserDocument } from '../models/users';
import { Url } from '../models/urls';
import { Tag, TagDocument } from '../models/tags';


const createURL = async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.auth.id;
    const { title, url, tags } = req.body;

    if (!tags || tags.length === 0) {
      return res.status(400).json({ error: "Please add some tags to the URL" });
    }

    const existingUrl = await Url.findOne({ url });
    if (existingUrl) {
      return res.status(400).json({ error: "URL already exists" });
    }

    const newUrl = await Url.create({ title, url, submittedBy: userId, tags });

    await TagControl.attachURL(tags, newUrl.id);
    await UserControl.attachURL(userId, newUrl.id);

    const receipt = await createReceipt(newUrl.url);

    return res.status(201).json({
      newUrl,
      receipt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

const deleteURL = async (req: Request, res: Response) => {
  try {
    const { urlId } = req.params;
    const urlObjectId = new mongoose.Types.ObjectId(urlId);

    const url = await Url.findById(urlId);
    if (!url) {
      return res.status(404).json({ error: "URL not found" });
    }

    await TagControl.detachURL(url.tags, urlObjectId);
    await UserControl.detachURL(url.submittedBy, urlObjectId);

    await Url.deleteOne({ _id: urlId });

    return res.status(200).json({ message: "URL removed successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

const __getURLsFromDb = async (tags: string[], limit: number = 100) => {
  try {
    let query;
    if (tags.length === 0) {
      query = Url.aggregate([{ $sample: { size: parseInt(limit.toString()) } }]);
    } else {
      // Get tag ids by tag names provided
      const tagIds = (await Tag.find({ name: { $in: tags } })).map(({ _id }) => _id);
      query = Url.aggregate([
        { $match: { tags: { $in: tagIds } } },
        { $sample: { size: parseInt(limit.toString()) } },
      ]);
    }

    const results = await query.exec();

    // Populate 'tags' and 'name' fields
    const populatedResults = await Url.populate(results, [
      { path: "tags", select: "name" },
    ]);

    return populatedResults;
  } catch (error) {
    throw error;
  }
};

const getMixedURLs = async (req: Request, res: Response) => {
  try {
    const tags = req.query.tags as string[];
    const limit = parseInt(req.query.limit as string);
    const urls = await __getURLsFromDb(tags, limit);

    res.status(200).json({
      urls: shuffle(urls),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while fetching mixed URLs" });
  }
};

const getContentToSync = async (): Promise<Data.ContentToSyncStruct[]> => {
  const contents = await Url.find({ syncedToBlockchain: false }).populate({
    path: "submittedBy",
    model: "User",
    select: "walletAddress",
  }).populate({
    path: "tags",
    model: "Tag",
    select: "name",
  });
  return contents.map((content) => {
    return {
      title: content.title,
      url: content.url,
      submittedBy: (content.submittedBy as unknown as UserDocument).walletAddress,
      likes: content.likes,
      tagIds: content.tags.map((tag) => {
        return (tag as unknown as TagDocument).name;
      }),
    };
  });
};

const markSynced = async (urls: string[]) => {
  await Url.updateMany(
    { url: { $in: urls } },
    { syncedToBlockchain: true }
  );
};

const getContentToSign = async (url: string): Promise<Data.ContentToLitigateStruct> => {
  const content = await Url.findOne({ url }).populate({
    path: "submittedBy",
    model: "User",
    select: "walletAddress",
  }).populate({
    path: "tags",
    model: "Tag",
    select: "name",
  });
  if (!content) throw new Error("Content to sign not found");
  return {
    title: content.title,
    url: content.url,
    submittedBy: (content.submittedBy as unknown as UserDocument).walletAddress,
    likes: content.likes,
    tagIds: (content.tags as unknown as TagDocument[]).map((tag) => {
      return tag.name;
    }),
    timestamp: Math.floor(Date.now() / 1000),
  };
};

const getUrlEIP712Metadata = async () => {
  const domain = await getEIPDomain();
  const types = {
    ContentToLitigate: [
      { name: 'title', type: 'string' },
      { name: 'url', type: 'string' },
      { name: 'submittedBy', type: 'address' },
      { name: 'likes', type: 'uint256' },
      { name: 'tagIds', type: 'string[]' },
      { name: 'timestamp', type: 'uint256' },
    ],
  };
  return { domain, types };
};

const createReceipt = async (newUrl: string): Promise<string> => {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL as string);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);
  const content = await getContentToSign(newUrl);
  const { domain, types } = await getUrlEIP712Metadata();
  const EIPSignature = await wallet.signTypedData(domain, types, content);
  return EIPSignature;
};

export {
  createURL,
  deleteURL,
  getMixedURLs,
  getContentToSync,
  markSynced,
};
